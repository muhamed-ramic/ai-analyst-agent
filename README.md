# AI Code Analyst Agent

An intelligent code analysis tool that automatically generates comprehensive system requirements documentation from your codebase. Powered by Anthropic's Claude AI, this tool analyzes source code across multiple programming languages and produces detailed documentation including system overview, functional requirements, technical architecture, and more.

## Features

- **Multi-Language Support**: Analyzes code in JavaScript, TypeScript, Python, Java, C++, C#, Go, Ruby, PHP, Scala, Rust, Swift, Kotlin, and more
- **Comprehensive Analysis**: Generates detailed documentation covering:
  - System Overview
  - Functional Requirements
  - Technical Architecture
  - Dependencies
  - Data Models
  - API Specifications
  - Security Requirements
- **Smart Chunking**: Handles large codebases efficiently through intelligent code chunking
- **Rate Limiting**: Built-in rate limiting to handle API constraints gracefully
- **Markdown Output**: Generates clean, well-formatted markdown documentation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-analyst-agent.git
cd ai-analyst-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

Analyze a code repository by providing its path:
```bash
# Analyze a specific repository
node src/main.js /path/to/your/repository

# Analyze the current directory
node src/main.js .

# Analyze this tool itself
node src/main.js $(pwd)
```

Examples:
```bash
# Analyze a React project
node src/main.js ./my-react-app

# Analyze an Angular project
node src/main.js ./angular-project

# Analyze the current directory and save output to a specific file
node src/main.js . > custom_requirements.md
```

The tool will generate a `system_requirements_document.md` file in your current directory containing:
- System Overview
- Functional Requirements
- Technical Architecture
- Dependencies
- Data Models
- API Specifications
- Security Requirements
- Implementation Guidelines
- Testing Requirements
- Deployment Requirements

### Tips for Better Analysis

1. **Clean Repository**: Remove build directories, node_modules, and other non-source files before analysis
2. **Focus Areas**: You can organize your code into specific directories for better analysis:
   - `src/` or `lib/` for source code
   - `models/` or `entities/` for data models
   - `api/` or `controllers/` for API endpoints
   - `config/` for configuration files
3. **Documentation**: Include comments and documentation in your code for better analysis results

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `LOG_LEVEL`: Logging level (default: 'info')

### Analysis Settings

The analyzer can be configured through the following parameters in `src/analyzer.js`:

- `MAX_CHUNK_SIZE`: Maximum size of code chunks for analysis (default: 12000 characters)
- `RATE_LIMIT_DELAY`: Delay between API calls (default: 1000ms)
- `CONCURRENT_REQUESTS`: Number of concurrent API requests (default: 5)

## Project Structure

- `src/`
  - `main.js`: Entry point and command-line interface
  - `analyzer.js`: Core code analysis logic
  - `documentGenerator.js`: Markdown document generation
  - `utils.js`: Utility functions and logging

## Dependencies

- `@langchain/anthropic`: Claude AI integration
- `@langchain/core`: LangChain core functionality
- `dotenv`: Environment configuration
- `fs-extra`: Enhanced file system operations
- `glob`: File pattern matching
- `markdown-it`: Markdown generation
- `winston`: Logging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

Run the test suite:
```bash
npm test
```

## Error Handling

The tool includes comprehensive error handling:
- API rate limit handling
- File system error recovery
- Invalid repository path detection
- Missing API key validation

## Logging

Logs are generated using Winston logger with configurable log levels:
- ERROR: Critical errors that prevent analysis
- WARN: Non-critical issues that might affect results
- INFO: General progress information
- DEBUG: Detailed debugging information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Anthropic for providing the Claude AI model
- LangChain for the AI integration framework
- The open-source community for various dependencies

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
