# IPSA Next Implementation Commands

This document outlines the VS Code commands that need to be implemented for the Agent Interaction System and Output Management System. It serves as a development roadmap for the next implementation phase of the IPSA extension.

## Agent Interaction System Commands

### High Priority

#### 1. `ipsa.configureAssistantSettings`
- **Purpose**: Configure detailed settings for the selected AI assistant
- **Functionality**: Allows users to set specific parameters for each assistant type (API keys, model preferences, etc.)
- **Command Registration**:
```typescript
const configureAssistantSettingsCommand = vscode.commands.registerCommand('ipsa.configureAssistantSettings', async () => {
  try {
    // Get the current assistant type
    const currentType = aiAssistantIntegration.getPreferredAssistantType();
    
    // Get the adapter for the current type
    const adapter = aiAssistantIntegration.getAdapter(currentType);
    
    // Get available settings for this adapter
    const settings = adapter.getAvailableSettings();
    
    // Show settings UI and update configuration
    // ...
    
    vscode.window.showInformationMessage(`Updated settings for ${aiAssistantIntegration.getAssistantTypeDisplayName(currentType)}`);
  } catch (error) {
    Logger.error('Failed to configure assistant settings', error);
    vscode.window.showErrorMessage(`Failed to configure assistant settings: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 2. `ipsa.viewConversationHistory`
- **Purpose**: View the history of interactions with the AI assistant
- **Functionality**: Displays a list of previous prompts and responses for the current session
- **Command Registration**:
```typescript
const viewConversationHistoryCommand = vscode.commands.registerCommand('ipsa.viewConversationHistory', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Get conversation history for the current session
    const history = await aiAssistantIntegration.getConversationHistory(currentSession.id);
    
    // Display history in a webview panel
    // ...
    
  } catch (error) {
    Logger.error('Failed to view conversation history', error);
    vscode.window.showErrorMessage(`Failed to view conversation history: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 3. `ipsa.clearConversationHistory`
- **Purpose**: Clear the conversation history for the current session
- **Functionality**: Deletes all stored prompts and responses for the current session
- **Command Registration**:
```typescript
const clearConversationHistoryCommand = vscode.commands.registerCommand('ipsa.clearConversationHistory', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Confirm with the user
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to clear the conversation history for this session?',
      'Yes', 'No'
    );
    
    if (confirm !== 'Yes') {
      return;
    }
    
    // Clear conversation history
    await aiAssistantIntegration.clearConversationHistory(currentSession.id);
    
    vscode.window.showInformationMessage('Conversation history cleared');
  } catch (error) {
    Logger.error('Failed to clear conversation history', error);
    vscode.window.showErrorMessage(`Failed to clear conversation history: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

### Medium Priority

#### 4. `ipsa.registerCustomAssistant`
- **Purpose**: Register a custom AI assistant adapter
- **Functionality**: Allows users to add support for additional AI assistants
- **Command Registration**:
```typescript
const registerCustomAssistantCommand = vscode.commands.registerCommand('ipsa.registerCustomAssistant', async () => {
  try {
    // Get custom assistant details from user
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the custom assistant',
      placeHolder: 'e.g., My Custom Assistant'
    });
    
    if (!name) {
      return;
    }
    
    // Get command to execute for sending prompts
    const sendCommand = await vscode.window.showInputBox({
      prompt: 'Enter the VS Code command to execute for sending prompts',
      placeHolder: 'e.g., myextension.sendPrompt'
    });
    
    // Register the custom assistant
    // ...
    
    vscode.window.showInformationMessage(`Custom assistant "${name}" registered`);
  } catch (error) {
    Logger.error('Failed to register custom assistant', error);
    vscode.window.showErrorMessage(`Failed to register custom assistant: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 5. `ipsa.editPromptTemplate`
- **Purpose**: Edit the prompt template for a specific step or iteration
- **Functionality**: Allows users to customize the prompt template used for AI interactions
- **Command Registration**:
```typescript
const editPromptTemplateCommand = vscode.commands.registerCommand('ipsa.editPromptTemplate', async () => {
  try {
    // Get template type from user
    const templateType = await vscode.window.showQuickPick(
      ['Step', 'Iteration', 'Finding', 'Global'],
      { placeHolder: 'Select template type' }
    );
    
    if (!templateType) {
      return;
    }
    
    // Get current template
    const currentTemplate = promptConstructionEngine.getTemplate(templateType.toLowerCase());
    
    // Show editor to modify template
    // ...
    
    vscode.window.showInformationMessage(`${templateType} template updated`);
  } catch (error) {
    Logger.error('Failed to edit prompt template', error);
    vscode.window.showErrorMessage(`Failed to edit prompt template: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

### Low Priority

#### 6. `ipsa.exportConversationHistory`
- **Purpose**: Export the conversation history to a file
- **Functionality**: Saves the conversation history in various formats (Markdown, HTML, JSON)
- **Command Registration**:
```typescript
const exportConversationHistoryCommand = vscode.commands.registerCommand('ipsa.exportConversationHistory', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Get conversation history
    const history = await aiAssistantIntegration.getConversationHistory(currentSession.id);
    
    // Get export format from user
    const format = await vscode.window.showQuickPick(
      ['Markdown', 'HTML', 'JSON'],
      { placeHolder: 'Select export format' }
    );
    
    if (!format) {
      return;
    }
    
    // Export history to file
    // ...
    
    vscode.window.showInformationMessage(`Conversation history exported to ${filePath}`);
  } catch (error) {
    Logger.error('Failed to export conversation history', error);
    vscode.window.showErrorMessage(`Failed to export conversation history: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

## Output Management System Commands

### High Priority

#### 1. `ipsa.batchApplyCodeSnippets`
- **Purpose**: Apply multiple code snippets at once
- **Functionality**: Allows users to select and apply multiple code snippets from findings
- **Command Registration**:
```typescript
const batchApplyCodeSnippetsCommand = vscode.commands.registerCommand('ipsa.batchApplyCodeSnippets', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Check if output manager is initialized
    if (!outputManager) {
      vscode.window.showErrorMessage('Output manager not initialized');
      return;
    }
    
    // Load the plan document
    const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);
    
    // Get all code snippets from all iterations
    const allSnippets = [];
    for (const iteration of planDoc.iterations) {
      const codeFindings = iteration.findings.filter(f => f.type === 'code');
      for (const finding of codeFindings) {
        const snippets = await outputManager.extractCodeSnippets(finding);
        allSnippets.push(...snippets.map(s => ({ ...s, iterationNumber: iteration.number })));
      }
    }
    
    // Show multi-select quick pick for snippets
    // ...
    
    vscode.window.showInformationMessage(`Applied ${selectedSnippets.length} code snippets`);
  } catch (error) {
    Logger.error('Failed to batch apply code snippets', error);
    vscode.window.showErrorMessage(`Failed to batch apply code snippets: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 2. `ipsa.exportToPdf`
- **Purpose**: Export a plan document to PDF format
- **Functionality**: Converts the plan document to PDF for sharing or printing
- **Command Registration**:
```typescript
const exportToPdfCommand = vscode.commands.registerCommand('ipsa.exportToPdf', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Check if output manager is initialized
    if (!outputManager) {
      vscode.window.showErrorMessage('Output manager not initialized');
      return;
    }
    
    // Load the plan document
    const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);
    
    // Export to PDF
    const pdfPath = await outputManager.exportPlanDocument(planDoc, 'pdf');
    
    vscode.window.showInformationMessage(`Plan document exported to PDF: ${pdfPath}`);
    
    // Open the PDF with the default application
    const uri = vscode.Uri.file(pdfPath);
    await vscode.env.openExternal(uri);
  } catch (error) {
    Logger.error('Failed to export to PDF', error);
    vscode.window.showErrorMessage(`Failed to export to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

### Medium Priority

#### 3. `ipsa.createGitCommit`
- **Purpose**: Create a Git commit with the current findings
- **Functionality**: Automatically commits code changes with a message based on findings
- **Command Registration**:
```typescript
const createGitCommitCommand = vscode.commands.registerCommand('ipsa.createGitCommit', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Check if Git is available in the workspace
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    if (!gitExtension) {
      vscode.window.showErrorMessage('Git extension not found');
      return;
    }
    
    // Get the Git API
    const git = gitExtension.getAPI(1);
    if (!git) {
      vscode.window.showErrorMessage('Git API not available');
      return;
    }
    
    // Get the current repository
    const repo = git.repositories[0];
    if (!repo) {
      vscode.window.showErrorMessage('No Git repository found in the workspace');
      return;
    }
    
    // Generate commit message from findings
    // ...
    
    // Create commit
    await repo.commit(commitMessage);
    
    vscode.window.showInformationMessage(`Created Git commit: ${commitMessage}`);
  } catch (error) {
    Logger.error('Failed to create Git commit', error);
    vscode.window.showErrorMessage(`Failed to create Git commit: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 4. `ipsa.generateTestsFromFindings`
- **Purpose**: Generate test files based on code findings
- **Functionality**: Creates test files for code snippets found in findings
- **Command Registration**:
```typescript
const generateTestsFromFindingsCommand = vscode.commands.registerCommand('ipsa.generateTestsFromFindings', async () => {
  try {
    // Get the current session
    const currentSession = stateManager.getCurrentSession();
    if (!currentSession) {
      vscode.window.showErrorMessage('No active session. Please start a session first.');
      return;
    }
    
    // Check if output manager is initialized
    if (!outputManager) {
      vscode.window.showErrorMessage('Output manager not initialized');
      return;
    }
    
    // Load the plan document
    const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);
    
    // Get code findings from the current iteration
    const currentIteration = planDoc.iterations.find(i => i.number === currentSession.currentIteration);
    if (!currentIteration) {
      vscode.window.showErrorMessage('Current iteration not found');
      return;
    }
    
    // Generate tests for code findings
    // ...
    
    vscode.window.showInformationMessage(`Generated ${testFiles.length} test files`);
  } catch (error) {
    Logger.error('Failed to generate tests from findings', error);
    vscode.window.showErrorMessage(`Failed to generate tests from findings: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

### Low Priority

#### 5. `ipsa.createProjectSummary`
- **Purpose**: Generate a summary of the entire project
- **Functionality**: Creates a comprehensive summary of all sessions and findings
- **Command Registration**:
```typescript
const createProjectSummaryCommand = vscode.commands.registerCommand('ipsa.createProjectSummary', async () => {
  try {
    // Check if output manager is initialized
    if (!outputManager) {
      vscode.window.showErrorMessage('Output manager not initialized');
      return;
    }
    
    // Get all sessions
    const sessions = stateManager.getSessions();
    
    // Generate summary for each session
    // ...
    
    vscode.window.showInformationMessage(`Project summary created: ${summaryPath}`);
    
    // Open the summary file
    const uri = vscode.Uri.file(summaryPath);
    await vscode.window.showTextDocument(uri);
  } catch (error) {
    Logger.error('Failed to create project summary', error);
    vscode.window.showErrorMessage(`Failed to create project summary: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

#### 6. `ipsa.exportFindingsDatabase`
- **Purpose**: Export all findings to a searchable database
- **Functionality**: Creates a JSON database of all findings for external use
- **Command Registration**:
```typescript
const exportFindingsDatabaseCommand = vscode.commands.registerCommand('ipsa.exportFindingsDatabase', async () => {
  try {
    // Check if output manager is initialized
    if (!outputManager) {
      vscode.window.showErrorMessage('Output manager not initialized');
      return;
    }
    
    // Get all sessions
    const sessions = stateManager.getSessions();
    
    // Collect all findings from all sessions
    // ...
    
    vscode.window.showInformationMessage(`Findings database exported: ${dbPath}`);
  } catch (error) {
    Logger.error('Failed to export findings database', error);
    vscode.window.showErrorMessage(`Failed to export findings database: ${error instanceof Error ? error.message : String(error)}`);
  }
});
```

## Required Imports and Dependencies

```typescript
// Required imports for implementing these commands
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './logger';
import { StateManagerImpl, ConfigManager } from './state';
import { PlanDocumentManagerImpl } from './document/planDocumentManager';
import { PromptConstructionEngineImpl } from './prompt/promptConstructionEngine';
import { AIAssistantIntegrationImpl } from './assistant/assistantIntegration';
import { OutputManagerImpl } from './output/outputManager';
import { FindingType, FindingMetadata } from './models/finding';
import { CodeSnippet, CodeSnippetType, ApplySnippetOptions } from './models/output';
```

## Implementation Steps

1. Update the models and interfaces to support new functionality
2. Implement the core functionality in the respective manager classes
3. Register the commands in extension.ts
4. Add command entries to package.json
5. Test each command individually
6. Update documentation to reflect new commands
