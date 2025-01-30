const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');

class DocumentGenerator {
    constructor(outputFormat = 'md') {
        this.outputFormat = outputFormat;
        this.md = new MarkdownIt();
    }

    async generate(analysisResults) {
        const content = this._generateMarkdown(analysisResults);
        await this._writeDocument(content);
    }

    _generateMarkdown(results) {
        let sections = [];

        // Add header
        sections.push('# System Requirements Document');
        sections.push(`Generated on: ${new Date().toISOString()}\n`);

        // Only add sections that have content
        if (results.systemOverview && results.systemOverview !== 'Not found') {
            sections.push('## 1. System Overview');
            sections.push(results.systemOverview + '\n');
        }

        if (results.functionalRequirements && results.functionalRequirements !== 'Not found') {
            sections.push('## 2. Functional Requirements');
            sections.push(results.functionalRequirements + '\n');
        }

        if (results.technicalArchitecture && results.technicalArchitecture !== 'Not found') {
            sections.push('## 3. Technical Architecture');
            sections.push(results.technicalArchitecture + '\n');
        }

        if (results.dependencies && Object.keys(results.dependencies).length > 0) {
            sections.push('## 4. Dependencies');
            sections.push('```json');
            sections.push(JSON.stringify(results.dependencies, null, 2));
            sections.push('```\n');
        }

        if (results.dataModels && results.dataModels !== 'Not found') {
            sections.push('## 5. Data Models');
            sections.push(results.dataModels + '\n');
        }

        if (results.apiSpecifications && results.apiSpecifications !== 'Not found') {
            sections.push('## 6. API Specifications');
            sections.push(results.apiSpecifications + '\n');
        }

        if (results.securityRequirements && results.securityRequirements !== 'Not found') {
            sections.push('## 7. Security Requirements');
            sections.push(results.securityRequirements + '\n');
        }

        // Add implementation guidelines only if we have actual content
        if (sections.length > 2) {  // More than just header and timestamp
            sections.push('## 8. Implementation Guidelines');
            sections.push('- The system should be implemented following the architecture and patterns described above');
            if (results.securityRequirements) {
                sections.push('- All security requirements must be strictly followed');
            }
            if (results.apiSpecifications) {
                sections.push('- API implementations should adhere to the specifications provided');
            }
            if (results.dataModels) {
                sections.push('- Data models should be implemented as documented');
            }
            if (Object.keys(results.dependencies || {}).length > 0) {
                sections.push('- Dependencies should be kept up to date and security patches applied promptly');
            }
            sections.push('');

            sections.push('## 9. Testing Requirements');
            sections.push('- Unit tests should be written for all components');
            if (results.apiSpecifications) {
                sections.push('- Integration tests should cover API endpoints');
            }
            if (results.securityRequirements) {
                sections.push('- Security testing should be performed regularly');
            }
            sections.push('- Performance testing should be conducted under expected load\n');

            sections.push('## 10. Deployment Requirements');
            sections.push('- CI/CD pipeline should be implemented');
            sections.push('- Environment-specific configurations should be managed through environment variables');
            sections.push('- Logging and monitoring should be implemented');
            sections.push('- Regular backups should be configured where applicable');
        }

        return sections.join('\n');
    }

    async _writeDocument(content) {
        const outputPath = path.join(process.cwd(), 'system_requirements_document.md');
        await fs.writeFile(outputPath, content, 'utf-8');
    }
}

module.exports = { DocumentGenerator };
