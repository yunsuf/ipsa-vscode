# Iterative Problem-Solving Assistant (IPSA)

IPSA is a VS Code extension that enhances AI-assisted problem-solving by providing a structured framework for complex coding and analytical tasks.

## Features

- **Structured Problem-Solving Framework**: Establish and evolve a clear plan throughout the process
- **Persistent Knowledge Base**: Create a "living document" that captures the entire problem-solving journey
- **Context-Aware Prompting**: Construct prompts that include relevant context from previous iterations
- **Iterative Workflow Management**: Guide users through a systematic problem-solving process
- **Integration with Development Environment**: Seamlessly work within VS Code

## Requirements

- VS Code 1.60.0 or higher
- An AI coding assistant (such as GitHub Copilot, Cursor, or similar)

## Extension Settings

This extension contributes the following settings:

* `ipsa.preferredAssistant`: Set the preferred AI assistant type (clipboard, copilot, cursor)
* `ipsa.git.autoCommit`: Enable/disable automatic Git commits for plan document changes
* `ipsa.prompt.maxPreviousFindings`: Maximum number of previous findings to include in prompts

## Known Issues

This extension is in early development. Please report any issues on the GitHub repository.

## Release Notes

### 0.1.0

Initial release of IPSA with basic functionality:
- Session management
- Plan document creation and editing
- Basic prompt construction
- Findings extraction

## Development

### Building the Extension

1. Clone the repository
2. Run `npm install`
3. Run `npm run compile`

### Running Tests

Run `npm test` to execute the test suite.

### Packaging

Run `npm run package` to create a VSIX package for installation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
