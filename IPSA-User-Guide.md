# IPSA Extension User Guide

This guide explains how to build, install, use, and uninstall the IPSA (Iterative Problem-Solving Assistant) VS Code extension.

## Table of Contents

- [Building the Extension](#building-the-extension)
- [Installing the Extension](#installing-the-extension)
- [Using the Extension](#using-the-extension)
- [Uninstalling the Extension](#uninstalling-the-extension)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)

## Building the Extension

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Visual Studio Code

### Building Steps

1. Clone the repository or navigate to your project directory:
   ```bash
   cd /path/to/automate_gpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   # For production build
   npm run compile
   
   # For development build (with better debugging)
   npm run compile:dev
   ```

4. Watch for changes during development:
   ```bash
   npm run watch
   ```

## Installing the Extension

### Method 1: Running in Development Mode

The easiest way to test the extension is to launch it in development mode:

1. Open the project in VS Code
2. Press F5 (or select "Run" → "Start Debugging")
3. This will open a new VS Code window with the extension loaded
4. You'll see "Extension Development Host" in the title bar of the new window

### Method 2: Installing the VSIX Package

To install the extension for regular use:

1. Package the extension into a VSIX file:
   ```bash
   # Install vsce if you don't have it
   npm install -g @vscode/vsce
   
   # Package the extension
   vsce package
   ```

2. Install the extension in VS Code:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
   - Click the "..." menu at the top of the Extensions view
   - Select "Install from VSIX..."
   - Navigate to and select the `ipsa-0.1.0.vsix` file

## Using the Extension

### Starting a New Session

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "IPSA: Start New Iterative Session"
3. Enter a name for your problem (e.g., "auth-flow-bug")
4. A new plan document will be created and opened in the editor
5. The status bar will show your active session

### Creating a Plan Document

1. Open the Command Palette
2. Type "IPSA: Create Plan Document"
3. Enter a name for your problem
4. A new plan document will be created with a template structure

### Opening an Existing Plan Document

1. Open the Command Palette
2. Type "IPSA: Open Plan Document"
3. Select the plan document you want to open

### Resuming a Session

1. Open the Command Palette
2. Type "IPSA: Resume Iterative Session"
3. Your previous session will be restored

### Checking Session Status

1. Click on the IPSA status bar item (shows "IPSA: [problem-id]" or "IPSA: No Active Session")
2. Or open the Command Palette and type "IPSA: Show Session Status"

### Ending a Session

1. Open the Command Palette
2. Type "IPSA: End Current Session"

### Configuring the Extension

1. Open VS Code Settings (File → Preferences → Settings or Code → Preferences → Settings)
2. Search for "IPSA"
3. You'll see the following settings:
   - `ipsa.preferredAssistant`: Choose your preferred AI assistant type
   - `ipsa.git.autoCommit`: Enable/disable automatic Git commits
   - `ipsa.prompt.maxPreviousFindings`: Set the maximum number of previous findings to include in prompts

## Plan Document Structure

The plan documents created by IPSA have the following structure:

```markdown
# [Problem ID]

## Problem Statement

Describe the problem you are trying to solve here.

## Initial Plan

1. Define the problem scope and requirements
2. Research potential solutions
3. Design the solution architecture
4. Implement the solution
5. Test and validate the solution

## Iteration 1

### Prompt

Your prompt to the AI assistant goes here.

### Response

The AI assistant's response goes here.

### Findings

#### Code

```language
Code snippets found in the response
```

#### Analysis

Analysis of the problem or solution found in the response.
```

You can edit this document directly to update your problem-solving process.

## Uninstalling the Extension

### Method 1: Uninstalling from VS Code

1. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
2. Find "IPSA" in your installed extensions
3. Click the gear icon and select "Uninstall"
4. Reload VS Code when prompted

### Method 2: Removing Development Version

If you installed it in development mode, simply close the Extension Development Host window.

## Troubleshooting

### Extension Not Showing Up

If the extension commands don't appear in the Command Palette:
- Make sure the extension is properly installed or running in development mode
- Check the "Output" panel (View → Output) and select "IPSA" from the dropdown to see any error messages

### Plan Documents Not Saving

If you're having issues with plan documents:
- Make sure you have a workspace open (the extension requires a workspace)
- Check that you have write permissions to the workspace directory

### Session Not Resuming

If your session doesn't resume correctly:
- The session data is stored in VS Code's global state
- Try ending the current session and starting a new one

### Build Warnings

If you see webpack warnings during build:

```
WARNING in configuration
The 'mode' option has not been set, webpack will fallback to 'production' for this value.
```

This has been fixed by setting the mode explicitly in webpack.config.js. If you still see this warning:

1. Make sure webpack.config.js has the mode set:
   ```javascript
   const config = {
     target: 'node',
     mode: 'production', // This line should be present
     // ...
   };
   ```

2. Or use the npm scripts that specify the mode:
   ```bash
   npm run compile:dev   # Development mode
   npm run package       # Production mode
   ```

## Development Notes

### Project Structure

- `src/extension.ts`: Main extension code
- `src/document/`: Document management system
- `src/models/`: Data models and interfaces
- `src/test/suite/`: Test files

### Running Tests

```bash
npm run test
```

### Linting Code

```bash
npm run lint
```

### Current Implementation Status

The current implementation includes:
- ✅ Basic extension activation
- ✅ Document management system
- ✅ Session management
- ✅ Status bar integration
- ✅ Configuration settings
- 🔄 State management system (in progress)

### Next Steps

The next task to implement is the State Management System, which will provide a more robust way to manage the extension's state.

---

For more information, please refer to the project's README.md file or contact the development team.
