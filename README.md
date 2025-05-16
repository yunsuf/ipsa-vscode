# Iterative Problem-Solving Assistant (IPSA)

A VS Code extension for structured, iterative problem-solving with AI assistants.

## Overview

The Iterative Problem-Solving Assistant (IPSA) is a VS Code extension that helps developers solve complex problems through a structured, iterative approach. It integrates with AI assistants to provide a systematic workflow for breaking down problems, exploring solutions, and documenting the process.

## Features

### Document Management System
- Create structured Markdown documents for problem-solving sessions
- Organize documents in a clean folder structure (.ipsa/plans/active and .ipsa/plans/archived)
- Archive completed plan documents
- Migrate existing documents to the organized folder structure

### Session Management System
- Create new problem-solving sessions
- Resume existing sessions
- Switch between multiple active sessions
- Persist session state across VS Code restarts
- Manage user preferences and configuration settings
- Show current session status in the VS Code status bar

### Iteration Control System
- Manage progression through plan steps (advance, go back, skip)
- Create and manage iterations for each step
- Track the status of each step (pending, in-progress, completed, skipped)
- Automatically advance to the next step based on findings
- Provide metrics about the problem-solving process

### Agent Interaction System
- Support different AI assistants (Clipboard, GitHub Copilot, Cursor AI)
- Abstract away differences between AI assistants using adapters
- Construct prompts based on the current step and previous findings
- Capture and store AI assistant responses
- Configure preferred AI assistant
- Automatically create new iterations and extract findings from responses

### Output Management System
- Extract code snippets from findings
- Apply code snippets to the workspace
- Generate documentation from plan documents
- Export plan documents for sharing
- Support multiple formats (Markdown, HTML, JSON)

## Requirements

- VS Code 1.60.0 or higher
- An AI coding assistant (such as GitHub Copilot, Cursor, or similar)

## Getting Started

### Starting a New Session
1. Open the Command Palette (Ctrl+Shift+P)
2. Run the command "IPSA: Start New Iterative Session"
3. Enter a problem ID and description
4. Define the initial steps for solving the problem

### Working with Iterations
1. Run the command "IPSA: Start New Iteration"
2. Use the command "IPSA: Send Prompt to AI Assistant" to send a prompt to your AI assistant
3. Capture the response using "IPSA: Capture AI Assistant Response"
4. The system will automatically extract findings from the response
5. When ready, advance to the next step using "IPSA: Advance to Next Step"

### Using the Output Management System
1. Extract code snippets from findings using "IPSA: Extract Code Snippets"
2. Apply code snippets to your workspace using "IPSA: Apply Code Snippet"
3. Generate documentation from your plan document using "IPSA: Generate Documentation"
4. Export your plan document using "IPSA: Export Plan Document"

## Extension Settings

This extension contributes the following settings:

### General Settings
- `ipsa.preferredAssistant`: The preferred AI assistant type to use (default: `clipboard`)
- `ipsa.git.autoCommit`: Automatically commit plan document changes (default: `false`)
- `ipsa.prompt.maxPreviousFindings`: Maximum number of previous findings to include in prompts (default: `5`)
- `ipsa.plans.folderStructure`: How plan documents are organized (default: `organized`)

### Output Management Settings
- `ipsa.output.defaultDocumentationFormat`: Default format for generated documentation (default: `markdown`)
- `ipsa.output.includeCodeSnippets`: Whether to include code snippets in generated documentation (default: `true`)
- `ipsa.output.includeFindings`: Whether to include findings in generated documentation (default: `true`)
- `ipsa.output.includeMetrics`: Whether to include metrics in generated documentation (default: `true`)
- `ipsa.output.defaultExportFormat`: Default format for exporting plan documents (default: `markdown`)

## Release Notes

### 1.0.0

First stable release with complete functionality:
- Document Management System
- Session Management System
- Iteration Control System
- Agent Interaction System
- Output Management System

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
