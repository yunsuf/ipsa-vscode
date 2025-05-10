// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  console.log('IPSA extension is now active!');

  // Register the startNewSession command
  let startNewSessionCommand = vscode.commands.registerCommand('ipsa.startNewSession', async () => {
    try {
      const problemId = await vscode.window.showInputBox({
        prompt: 'Enter a name for this problem',
        placeHolder: 'e.g., auth-flow-bug'
      });
      
      if (!problemId) {
        return; // User cancelled the input
      }
      
      // TODO: Implement session creation logic
      
      vscode.window.showInformationMessage(`Started new session for problem: ${problemId}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the resumeSession command
  let resumeSessionCommand = vscode.commands.registerCommand('ipsa.resumeSession', async () => {
    try {
      // TODO: Implement session resumption logic
      
      vscode.window.showInformationMessage('Session resumed');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to resume session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the endSession command
  let endSessionCommand = vscode.commands.registerCommand('ipsa.endSession', async () => {
    try {
      // TODO: Implement session end logic
      
      vscode.window.showInformationMessage('Session ended');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to end session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Add all commands to the subscriptions array
  context.subscriptions.push(startNewSessionCommand);
  context.subscriptions.push(resumeSessionCommand);
  context.subscriptions.push(endSessionCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up resources
  console.log('IPSA extension is now deactivated!');
}
