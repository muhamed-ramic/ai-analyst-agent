require('dotenv').config();
const { CodeAnalyzer } = require('./analyzer');
const { DocumentGenerator } = require('./documentGenerator');
const { setupLogger } = require('./utils');
const path = require('path');

async function main() {
    const logger = setupLogger();
    
    try {
        // Get repository path from command line arguments
        const repoPath = process.argv[2];
        if (!repoPath) {
            throw new Error('Please provide the repository path as an argument');
        }

        // Initialize the analyzer
        const analyzer = new CodeAnalyzer(repoPath);
        
        // Analyze the codebase
        logger.info('Starting codebase analysis...');
        const analysisResults = await analyzer.analyze();
        
        // Generate documentation
        logger.info('Generating system requirements document...');
        const docGenerator = new DocumentGenerator();
        await docGenerator.generate(analysisResults);
        
        logger.info('Analysis complete! Check system_requirements_document.md for results');
    } catch (error) {
        logger.error('Error during analysis:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
