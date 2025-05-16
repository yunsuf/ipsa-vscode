# IPSA Extension User Guide

This guide explains how to build, install, use, and uninstall the IPSA (Iterative Problem-Solving Assistant) VS Code extension.

## Table of Contents

- [Building the Extension](#building-the-extension)
- [Installing the Extension](#installing-the-extension)
- [Using the Extension](#using-the-extension)
  - [Session Management](#session-management)
  - [Plan Document Management](#plan-document-management)
  - [IPSA Panel Interface](#ipsa-panel-interface)
  - [Findings Extraction](#findings-extraction)
  - [Prompt Construction](#prompt-construction)
  - [Preferences Management](#preferences-management)
- [Plan Document Structure](#plan-document-structure)
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
   # This will create a file like ipsa-1.0.0
   vsce package

   # This will install the extension in VS Code
   code --install-extension ./ipsa-1.0.0.vsix
   #
   code --new-window --extensionDevelopmentPath=/Users/bilgem/developer/ws/automate_gpt

   ```

2. Install the extension in VS Code:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
   - Click the "..." menu at the top of the Extensions view
   - Select "Install from VSIX..."
   - Navigate to and select the `ipsa-0.1.0.vsix` file

## Using the Extension

### Session Management

#### Starting a New Session

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "IPSA: Start New Iterative Session"
3. Enter a name for your problem (e.g., "auth-flow-bug")
4. A new plan document will be created and opened in the editor
5. The status bar will show your active session

#### Resuming a Session

1. Open the Command Palette
2. Type "IPSA: Resume Iterative Session"
3. Your previous session will be restored

#### Checking Session Status

1. Click on the IPSA status bar item (shows "IPSA: [problem-id]" or "IPSA: No Active Session")
2. Or open the Command Palette and type "IPSA: Show Session Status"

#### Managing Multiple Sessions

1. Open the Command Palette
2. Type "IPSA: List All Sessions"
3. Select a session from the list to switch to it
4. The selected session's plan document will be opened

#### Ending a Session

1. Open the Command Palette
2. Type "IPSA: End Current Session"

### Plan Document Management

#### Creating a Plan Document

1. Open the Command Palette
2. Type "IPSA: Create Plan Document"
3. Enter a name for your problem
4. A new plan document will be created with a template structure

#### Opening an Existing Plan Document

1. Open the Command Palette
2. Type "IPSA: Open Plan Document"
3. Select the plan document you want to open

### IPSA Panel Interface

The IPSA Panel provides a visual interface for managing your problem-solving sessions, viewing plan steps, and interacting with AI assistants.

#### Opening the IPSA Panel

1. Open the Command Palette
2. Type "IPSA: Show Panel"
3. The IPSA panel will open in a new tab

#### Panel Sections

The IPSA Panel is divided into several sections:

1. **Current Session**: Displays information about the active session, including:
   - Problem ID
   - Current step
   - Current iteration

2. **Plan Steps**: Shows all steps in your plan with their status:
   - Active steps are highlighted
   - Completed steps are marked with a checkmark
   - Skipped steps are marked with a skip indicator

3. **Findings**: Displays findings from the current iteration, categorized by type:
   - Code findings with syntax highlighting
   - Analysis findings
   - Issue findings
   - Solution findings

4. **Prompt**: Provides a text area for entering prompts to send to the AI assistant

5. **Controls**: Contains buttons for common actions:
   - New Iteration: Start a new iteration for the current step
   - Next Step: Advance to the next step in the plan
   - Previous Step: Go back to the previous step
   - Skip Step: Skip the current step
   - Complete Step: Mark the current step as completed
   - Open Plan Document: Open the current plan document in the editor

#### Using the Panel

1. **Sending Prompts**:
   - Enter your prompt in the prompt text area
   - Click "Send Prompt" to send it to the AI assistant
   - Click "Capture Response" after receiving a response
   - Click "Extract Findings" to extract findings from the response

2. **Managing Iterations**:
   - Click "New Iteration" to start a new iteration for the current step
   - The panel will update to show the new iteration

3. **Navigating Steps**:
   - Click "Next Step" to advance to the next step in the plan
   - Click "Previous Step" to go back to the previous step
   - Click "Skip Step" to skip the current step
   - Click "Complete Step" to mark the current step as completed

4. **Viewing Plan Document**:
   - Click "Open Plan Document" to open the current plan document in the editor

### Findings Extraction

The Findings Extraction feature helps you extract and categorize key information from AI assistant responses.

#### Extracting Findings from a Response

1. After receiving a response from an AI assistant, open the Command Palette
2. Type "IPSA: Extract Findings from Response"
3. IPSA will automatically analyze the response and identify potential findings
4. A quick pick menu will appear showing the extracted findings
5. Select the findings you want to add to your plan document
6. The selected findings will be added to the current iteration in your plan document

#### Creating a Finding from Selected Text

1. Select text in the editor that you want to save as a finding
2. Open the Command Palette
3. Type "IPSA: Create Finding from Selection"
4. Select the type of finding (code, analysis, issue, solution, documentation)
5. The finding will be added to the current iteration in your plan document

### Prompt Construction

The Prompt Construction Engine helps you create effective prompts for AI assistants by incorporating relevant context from your problem-solving process.

#### Constructing a Prompt

1. Open the Command Palette
2. Type "IPSA: Construct Prompt"
3. IPSA will generate a prompt based on your problem statement, current step, and relevant findings
4. The prompt will be copied to your clipboard or sent directly to your preferred AI assistant (depending on your settings)

#### Prompt Templates

IPSA includes several built-in prompt templates for different scenarios:

- **Standard**: General-purpose template for most problem-solving tasks
- **Code Generation**: Specialized template for generating code implementations
- **Analysis**: Template for analyzing findings and identifying issues
- **Solution**: Template for proposing solutions to identified issues

### Preferences Management

#### Method 1: Using the Preferences Manager

1. Open the Command Palette
2. Type "IPSA: Manage Preferences"
3. Select a preference to change
4. Select a new value for the preference

Available preferences:
- Preferred Assistant: Choose your preferred AI assistant type (clipboard, copilot, cursor, other)
- Auto-commit Git Changes: Enable/disable automatic Git commits
- Max Previous Findings: Set the maximum number of previous findings to include in prompts
- Show Response in Panel: Whether to show responses in a panel

#### Method 2: Using VS Code Settings

1. Open VS Code Settings (File → Preferences → Settings or Code → Preferences → Settings)
2. Search for "IPSA"
3. You'll see the following settings:
   - `ipsa.preferredAssistant`: Choose your preferred AI assistant type
   - `ipsa.git.autoCommit`: Enable/disable automatic Git commits
   - `ipsa.prompt.maxPreviousFindings`: Set the maximum number of previous findings to include in prompts

## Plan Document Organization

IPSA organizes plan documents in a structured folder hierarchy to keep your workspace clean and make it easier to manage multiple plan documents.

### Folder Structure

By default, IPSA uses the following folder structure:

```
<workspace-root>/
├── .ipsa/                      # Main IPSA directory (hidden)
│   ├── plans/                  # All plan documents
│   │   ├── active/             # Currently active plan documents
│   │   │   ├── <problem-id>.plan.md
│   │   │   └── ...
│   │   └── archived/           # Completed or archived plan documents
│   │       ├── <problem-id>.plan.md
│   │       └── ...
```

### Managing Plan Documents

#### Migrating Existing Documents

If you have existing plan documents in your workspace root, you can migrate them to the organized folder structure:

1. Open the Command Palette
2. Type "IPSA: Migrate Plan Documents to Organized Folder"
3. Confirm the migration when prompted

#### Archiving Plan Documents

When you've completed work on a problem, you can archive its plan document:

1. Open the Command Palette
2. Type "IPSA: Archive Plan Document"
3. Select the plan document to archive from the list

#### Configuring Folder Structure

You can choose between the organized folder structure or a flat structure (all documents in the workspace root):

1. Open VS Code Settings (File → Preferences → Settings)
2. Search for "IPSA plans folder"
3. Select either "organized" or "flat" for the "IPSA: Plans: Folder Structure" setting

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

- `src/extension.ts`: Main extension code and activation logic
- `src/document/`: Document management system for plan documents
  - `planDocumentManager.ts`: Implementation of plan document management
- `src/state/`: State management system
  - `stateManager.ts`: Management of session state and user preferences
  - `configManager.ts`: Management of extension configuration
- `src/models/`: Data models and interfaces
  - `finding.ts`: Models for findings extracted from AI responses
  - `planDocument.ts`: Models for plan documents and iterations
  - `prompt.ts`: Models for prompt construction
- `src/findings/`: Findings extraction system
  - `findingsExtractor.ts`: Implementation of findings extraction from AI responses
- `src/prompt/`: Prompt construction system
  - `promptConstructionEngine.ts`: Implementation of prompt construction with templates
- `src/ui/`: User interface components
  - `webViewProvider.ts`: Implementation of the IPSA panel WebView
- `src/models/ui.ts`: Models and interfaces for UI components
- `media/`: WebView assets
  - `main.js`: JavaScript for the WebView panel
  - `style.css`: CSS styles for the WebView panel
- `src/logger.ts`: Logging system for extension diagnostics
- `src/test/suite/`: Test files for the extension

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
- ✅ Basic extension activation and command registration
- ✅ Document management system (creating, loading, and parsing plan documents)
- ✅ Organized folder structure for plan documents (active and archived)
- ✅ Session management (creating, resuming, ending, and switching between sessions)
- ✅ Status bar integration (showing current session status)
- ✅ Configuration settings and user preferences management
- ✅ State management system (persistent storage of session state)
- ✅ Multi-session support (managing multiple problem-solving sessions)
- ✅ Findings extraction system (extracting and categorizing findings from AI responses)
- ✅ Prompt construction engine (generating contextual prompts with templates)
- ✅ Document archiving and migration tools
- ✅ Iteration control system (step progression, metrics, and analytics)
- ✅ Agent interaction system (AI assistant integration and interaction)
- ✅ Output management system (code snippet integration, documentation generation, export capabilities)
- ✅ WebView panel interface (visual interface for managing sessions and interacting with AI assistants)

### Iteration Control System

The Iteration Control System provides tools for managing the iterative problem-solving process:

#### Commands

- **Start New Iteration** (`ipsa.startNewIteration`): Starts a new iteration for the current step
- **Advance to Next Step** (`ipsa.advanceToNextStep`): Advances to the next step in the plan
- **Go to Previous Step** (`ipsa.goToPreviousStep`): Goes back to the previous step in the plan
- **Skip Current Step** (`ipsa.skipCurrentStep`): Skips the current step and advances to the next one
- **Mark Current Step as Completed** (`ipsa.markStepAsCompleted`): Marks the current step as completed
- **Show Session Metrics** (`ipsa.showSessionMetrics`): Displays metrics about the problem-solving process

#### Features

- **Step Progression**: Easily navigate through the steps in your plan
- **Iteration Management**: Create and manage iterations for each step
- **Session Metrics**: View metrics about your problem-solving process, including:
  - Total number of iterations
  - Number of iterations per step
  - Number of findings per step
  - Time spent on each step
  - Total time spent on the session
- **Automatic Step Advancement**: The system can automatically advance to the next step based on findings

### AI Assistant Integration

The AI Assistant Integration system provides tools for interacting with AI assistants:

#### Commands

- **Configure AI Assistant** (`ipsa.configureAssistant`): Configure which AI assistant to use
- **Send Prompt to AI Assistant** (`ipsa.sendPromptToAssistant`): Send a prompt to the configured AI assistant
- **Capture AI Assistant Response** (`ipsa.captureAssistantResponse`): Capture a response from the AI assistant
- **Interact with AI Assistant** (`ipsa.interactWithAssistant`): Complete interaction flow (send prompt and capture response)

#### Features

- **Multiple Assistant Support**: Support for different AI assistants:
  - Clipboard (works with any AI assistant)
  - GitHub Copilot
  - Cursor AI
  - Other assistants (via clipboard)
- **Prompt Construction**: Automatically construct prompts based on the current step and previous findings
- **Response Capture**: Capture and store AI assistant responses in the plan document
- **Integration with Iteration Control**: Automatically create new iterations and extract findings from responses

#### Configuration

- **Preferred Assistant**: Set your preferred AI assistant in the settings
  - `ipsa.preferredAssistant`: The preferred AI assistant type to use (default: `clipboard`)

### Output Management System

The Output Management System provides tools for managing outputs from the problem-solving process:

#### Commands

- **Extract Code Snippets** (`ipsa.extractCodeSnippets`): Extract code snippets from findings in the current iteration
- **Apply Code Snippet** (`ipsa.applyCodeSnippet`): Apply a code snippet to the workspace
- **Generate Documentation** (`ipsa.generateDocumentation`): Generate documentation from the current plan document
- **Export Plan Document** (`ipsa.exportPlanDocument`): Export the current plan document to a file

### WebView Panel Interface

The WebView Panel Interface provides a visual interface for managing problem-solving sessions:

#### Commands

- **Show IPSA Panel** (`ipsa.showIPSAPanel`): Open the IPSA panel in a new tab

#### Features

- **Visual Session Management**: Manage your problem-solving sessions visually
  - See current session status at a glance
  - Navigate between steps with buttons
  - Start new iterations with a single click
- **Plan Step Visualization**: View all steps in your plan with their status
  - Active steps are highlighted
  - Completed steps are marked with a checkmark
  - Skipped steps are marked with a skip indicator
- **Findings Display**: View findings from the current iteration
  - Code findings with syntax highlighting
  - Analysis findings with formatting
  - Issue and solution findings clearly labeled
- **Prompt Interface**: Enter and send prompts to AI assistants
  - Text area for entering prompts
  - Buttons for sending prompts and capturing responses
  - Extract findings directly from the panel
- **Responsive Design**: The panel adapts to different window sizes
  - Uses VS Code's theming for consistent appearance
  - Follows VS Code UI/UX guidelines

### Output Management Features

- **Code Snippet Extraction**: Automatically extract code snippets from findings
  - Identifies code snippets by type (function, class, method, etc.)
  - Suggests appropriate file paths based on snippet content
  - Provides a preview of extracted snippets
- **Code Snippet Integration**: Apply code snippets to the workspace
  - Create new files or update existing files
  - Automatically determine appropriate file extensions
  - Open files after applying snippets
- **Documentation Generation**: Generate documentation from plan documents
  - Support for multiple formats (Markdown, HTML, JSON)
  - Include code snippets, findings, and metrics
  - Customizable documentation options
- **Export Capabilities**: Export plan documents for sharing
  - Support for multiple formats (Markdown, HTML, JSON)
  - Include all iterations, findings, and metadata
  - Formatted for readability and sharing

### Next Steps

The IPSA extension is now feature-complete with all major systems implemented. Future enhancements could include:

1. **Enhanced AI Integration**: Deeper integration with specific AI assistants
2. **Collaborative Features**: Support for team collaboration on problem-solving sessions
3. **Analytics Dashboard**: Visual analytics for problem-solving metrics
4. **Custom Templates**: Support for custom plan document templates
5. **Version Control Integration**: Better integration with version control systems

---

For more information, please refer to the project's README.md file or contact the development team.
