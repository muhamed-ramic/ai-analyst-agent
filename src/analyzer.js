const { ChatAnthropic } = require('@langchain/anthropic');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { glob } = require('glob');
const fs = require('fs-extra');
const path = require('path');

class CodeAnalyzer {
    constructor(repoPath) {
        this.repoPath = repoPath;
        
        // Check for Anthropic API key
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is not set');
        }

        this.llm = new ChatAnthropic({
            modelName: 'claude-3-opus-20240229',
            temperature: 0,
            maxTokens: 4096,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY
        });
        
        // Increased chunk size as Claude has higher token limits
        this.MAX_CHUNK_SIZE = 12000;
        
        // Rate limiting settings adjusted for Claude
        this.RATE_LIMIT_DELAY = 1000; // 1 second between API calls
        this.CONCURRENT_REQUESTS = 5; // Claude allows more concurrent requests
        
        // Common patterns for different types of files across languages
        this.patterns = {
            sourceFiles: '**/*.{js,ts,jsx,tsx,py,java,cpp,cs,go,rb,php,scala,rs,swift,kt,dart,h,c,sql}',
            mainFiles: '**/?(main|index|app|program|application).{js,ts,jsx,tsx,py,java,cpp,cs,go,rb,php,scala,rs,swift,kt,dart,c}',
            modelFiles: '**/?(models|entities|domain|schemas|types)/**/*.{js,ts,jsx,tsx,py,java,cpp,cs,go,rb,php,scala,rs,swift,kt,dart,c}',
            routeFiles: '**/?(routes|controllers|handlers|endpoints|apis)/**/*.{js,ts,jsx,tsx,py,java,cpp,cs,go,rb,php,scala,rs,swift,kt,dart,c}',
            configFiles: '**/?(config|settings|configuration)/*.{json,yaml,yml,xml,ini,env,properties,toml}',
            dependencyFiles: [
                '**/package.json',           // Node.js
                '**/requirements.txt',       // Python
                '**/pom.xml',               // Java (Maven)
                '**/build.gradle',          // Java/Kotlin (Gradle)
                '**/Gemfile',               // Ruby
                '**/composer.json',         // PHP
                '**/Cargo.toml',            // Rust
                '**/*.csproj',              // .NET
                '**/go.mod',                // Go
                '**/pubspec.yaml',          // Dart/Flutter
                '**/Podfile'                // iOS/Swift
            ]
        };
    }

    async analyze() {
        try {
            const analysisResults = {
                systemOverview: await this._analyzeSystemOverview(),
                functionalRequirements: await this._analyzeFunctionalRequirements(),
                technicalArchitecture: await this._analyzeTechnicalArchitecture(),
                dependencies: await this._analyzeDependencies(),
                dataModels: await this._analyzeDataModels(),
                apiSpecifications: await this._analyzeApiSpecs(),
                securityRequirements: await this._analyzeSecurityRequirements()
            };

            return analysisResults;
        } catch (error) {
            console.error('Error during analysis:', error);
            throw error;
        }
    }

    // Split content into chunks to avoid token limits
    _chunkContent(contents) {
        const chunks = [];
        let currentChunk = '';
        
        for (const content of contents) {
            // If current content is already bigger than chunk size, split it
            if (content.length > this.MAX_CHUNK_SIZE) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                const splitChunks = this._splitChunk(content);
                chunks.push(...splitChunks);
            } 
            // If adding content would exceed chunk size, start new chunk
            else if ((currentChunk.length + content.length) > this.MAX_CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = content + '\n\n';
            } 
            // Add to current chunk
            else {
                currentChunk += content + '\n\n';
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    // Split a single large content into smaller chunks
    _splitChunk(content) {
        const chunks = [];
        let currentChunk = '';
        
        // Split content into lines to preserve code structure
        const lines = content.split('\n');
        
        for (const line of lines) {
            // If single line is longer than chunk size, split by character
            if (line.length > this.MAX_CHUNK_SIZE) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                
                // Split long line into character chunks
                let remainingLine = line;
                while (remainingLine.length > 0) {
                    // Try to split at a sensible boundary
                    let splitIndex = this.MAX_CHUNK_SIZE;
                    
                    // Look for last occurrence of common delimiters
                    const delimiters = [' ', ',', '.', ';', '{', '}', '(', ')', '[', ']'];
                    for (const delimiter of delimiters) {
                        const lastIndex = remainingLine.lastIndexOf(delimiter, this.MAX_CHUNK_SIZE);
                        if (lastIndex > 0) {
                            splitIndex = lastIndex + 1; // Include the delimiter
                            break;
                        }
                    }
                    
                    chunks.push(remainingLine.slice(0, splitIndex));
                    remainingLine = remainingLine.slice(splitIndex);
                }
            }
            // If adding line would exceed chunk size, start new chunk
            else if ((currentChunk.length + line.length + 1) > this.MAX_CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            }
            // Add line to current chunk
            else {
                currentChunk += line + '\n';
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    async _analyzeChunks(chunks, systemPrompt) {
        const results = [];
        
        for (const chunk of chunks) {
            try {
                const response = await this.llm.invoke([
                    new SystemMessage(systemPrompt),
                    new HumanMessage(`Analyze this code chunk and provide insights:\n\n${chunk}`)
                ]);
                results.push(response.content);
            } catch (error) {
                console.warn('Error analyzing chunk:', error.message);
            }
        }

        // Combine and summarize results
        if (results.length > 0) {
            const summary = await this.llm.invoke([
                new SystemMessage("Combine and summarize the following analysis results into a cohesive overview:"),
                new HumanMessage(results.join('\n\n'))
            ]);
            return summary.content;
        }

        return 'Not found';
    }

    async _getFiles(pattern) {
        if (Array.isArray(pattern)) {
            const allFiles = [];
            for (const p of pattern) {
                const files = await glob(p, { 
                    cwd: this.repoPath, 
                    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/bin/**', '**/obj/**', '**/target/**', '**/vendor/**']
                });
                allFiles.push(...files);
            }
            return allFiles;
        }
        return glob(pattern, { 
            cwd: this.repoPath, 
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/bin/**', '**/obj/**', '**/target/**', '**/vendor/**']
        });
    }

    async _readFileContent(filePath) {
        try {
            return await fs.readFile(path.join(this.repoPath, filePath), 'utf-8');
        } catch (error) {
            console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
            return '';
        }
    }

    async _analyzeSystemOverview() {
        const files = await this._getFiles(this.patterns.mainFiles);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks, 
            "You are a senior software architect analyzing a codebase. The code could be in any programming language. Provide a high-level overview of the system."
        );
    }

    async _analyzeFunctionalRequirements() {
        const files = await this._getFiles(this.patterns.sourceFiles);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks,
            "Extract and list all functional requirements from the codebase. The code could be in any programming language."
        );
    }

    async _analyzeTechnicalArchitecture() {
        const files = await this._getFiles(this.patterns.sourceFiles);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks,
            "Analyze the technical architecture and design patterns used in the codebase. The code could be in any programming language."
        );
    }

    async _analyzeDependencies() {
        const files = await this._getFiles(this.patterns.dependencyFiles);
        if (files.length === 0) return {};

        const dependencies = {};
        
        for (const file of files) {
            try {
                const content = await this._readFileContent(file);
                const fileName = path.basename(file).toLowerCase();
                
                if (fileName === 'package.json') {
                    const json = JSON.parse(content);
                    dependencies.nodejs = {
                        ...dependencies.nodejs,
                        ...(json.dependencies || {}),
                        ...(json.devDependencies || {})
                    };
                } else if (fileName === 'requirements.txt') {
                    dependencies.python = content
                        .split('\n')
                        .filter(line => line.trim() && !line.startsWith('#'))
                        .reduce((acc, line) => {
                            const [name, version] = line.split('==');
                            acc[name.trim()] = version ? version.trim() : 'latest';
                            return acc;
                        }, {});
                } else if (fileName === 'gemfile') {
                    dependencies.ruby = content
                        .split('\n')
                        .filter(line => line.trim().startsWith('gem'))
                        .reduce((acc, line) => {
                            const parts = line.split("'").filter(p => p.trim());
                            if (parts.length >= 2) {
                                acc[parts[1]] = parts[2] ? parts[2].trim().replace(/[,)]/g, '') : 'latest';
                            }
                            return acc;
                        }, {});
                }
                // Add more dependency file parsers as needed
            } catch (error) {
                console.warn(`Warning: Could not parse dependencies from ${file}: ${error.message}`);
            }
        }

        return dependencies;
    }

    async _analyzeDataModels() {
        const files = await this._getFiles(this.patterns.modelFiles);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks,
            "Extract and document all data models and their relationships. The code could be in any programming language."
        );
    }

    async _analyzeApiSpecs() {
        const files = await this._getFiles(this.patterns.routeFiles);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks,
            "Document all API endpoints, their purposes, and specifications. The code could be in any programming language."
        );
    }

    async _analyzeSecurityRequirements() {
        const files = await this._getFiles([this.patterns.sourceFiles, this.patterns.configFiles]);
        if (files.length === 0) return 'Not found';
        
        const contents = await Promise.all(files.map(f => this._readFileContent(f)));
        const validContents = contents.filter(content => content.trim().length > 0);
        
        if (validContents.length === 0) return 'Not found';

        const chunks = this._chunkContent(validContents);
        return this._analyzeChunks(chunks,
            "Identify and document security requirements and potential security concerns. The code could be in any programming language."
        );
    }
}

module.exports = { CodeAnalyzer };
