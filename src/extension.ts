// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { PlanDocumentManagerImpl } from './document/planDocumentManager';
import { Logger } from './logger';
import { StateManagerImpl, ConfigManager } from './state';

// Global state for the extension
let stateManager: StateManagerImpl;
let configManager: ConfigManager;
let planDocumentManager: PlanDocumentManagerImpl | undefined;
let statusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use console.log for initial logging before logger is initialized
  console.log('Activating IPSA extension...');

  // Wrap the entire activation in a try-catch to prevent crashes
  try {
    // Initialize the logger
    Logger.initialize(context);

    // Use the logger to output diagnostic information
    Logger.log('IPSA extension is now active!');

    // Initialize state manager
    stateManager = new StateManagerImpl(context);
    Logger.log('State manager initialized');

    // Initialize config manager
    configManager = ConfigManager.getInstance();
    configManager.registerConfigChangeListener(context.subscriptions);
    Logger.log('Config manager initialized');

    // Log all registered commands for debugging
    vscode.commands.getCommands(true).then(commands => {
      const ipsaCommands = commands.filter(cmd => cmd.startsWith('ipsa.'));
      Logger.log(`Registered IPSA commands: ${JSON.stringify(ipsaCommands)}`);
    }).then(undefined, (err: Error) => {
      Logger.error('Failed to get commands', err);
    });
  } catch (error) {
    console.error('Error during extension initialization:', error);
  }

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'ipsa.showSessionStatus';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Initialize the document manager
  try {
    // Check if workspace is available
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (workspaceRoot) {
      Logger.log(`Initializing document manager with workspace root: ${workspaceRoot}`);

      // Create the document manager
      try {
        planDocumentManager = new PlanDocumentManagerImpl(workspaceRoot);
        Logger.log('Document manager initialized successfully');
      } catch (error) {
        Logger.error('Failed to create document manager', error);
        // Continue without document manager - commands will show appropriate errors
      }
    } else {
      Logger.log('No workspace folder found - some commands will be disabled');
      // We'll continue without a document manager, and commands will check for it
    }
  } catch (error) {
    Logger.error('Error during workspace initialization', error);
    // Continue without document manager - commands will show appropriate errors
  }

  // Register the createPlanDocument command
  const createPlanDocumentCommand = vscode.commands.registerCommand('ipsa.createPlanDocument', async () => {
    Logger.log('ipsa.createPlanDocument command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        // Try to initialize it now
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        try {
          planDocumentManager = new PlanDocumentManagerImpl(workspaceRoot);
          Logger.log('Document manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize document manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize document manager. Please try reloading the window.');
          return;
        }
      }

      const problemId = await vscode.window.showInputBox({
        prompt: 'Enter a name for this problem',
        placeHolder: 'e.g., auth-flow-bug'
      });

      if (!problemId) {
        return; // User cancelled the input
      }

      // Create a template plan document
      const planDoc = await planDocumentManager.createTemplatePlanDocument(problemId);

      // Open the document in the editor
      const uri = vscode.Uri.file(planDoc.path);
      await vscode.window.showTextDocument(uri);

      vscode.window.showInformationMessage(`Created plan document for problem: ${problemId}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create plan document: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the startNewSession command
  const startNewSessionCommand = vscode.commands.registerCommand('ipsa.startNewSession', async () => {
    Logger.log('ipsa.startNewSession command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        // Try to initialize it now
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        try {
          planDocumentManager = new PlanDocumentManagerImpl(workspaceRoot);
          Logger.log('Document manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize document manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize document manager. Please try reloading the window.');
          return;
        }
      }

      const problemId = await vscode.window.showInputBox({
        prompt: 'Enter a name for this problem',
        placeHolder: 'e.g., auth-flow-bug'
      });

      if (!problemId) {
        return; // User cancelled the input
      }

      // Create a template plan document
      const planDoc = await planDocumentManager.createTemplatePlanDocument(problemId);

      // Create a new session
      const sessionId = `session_${Date.now()}`;
      const newSession = {
        id: sessionId,
        problemId,
        planDocumentPath: planDoc.path,
        currentIteration: 0,
        currentStep: 0,
        created: new Date(),
        lastModified: new Date()
      };

      // Save session to state manager
      await stateManager.saveSessionState(sessionId, newSession);
      await stateManager.setCurrentSession(sessionId);

      // Open the document in the editor
      const uri = vscode.Uri.file(planDoc.path);
      await vscode.window.showTextDocument(uri);

      vscode.window.showInformationMessage(`Started new session for problem: ${problemId}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the resumeSession command
  const resumeSessionCommand = vscode.commands.registerCommand('ipsa.resumeSession', async () => {
    try {
      // Get the current session from state manager
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No session to resume');
        return;
      }

      // Open the plan document
      const uri = vscode.Uri.file(currentSession.planDocumentPath);
      await vscode.window.showTextDocument(uri);

      vscode.window.showInformationMessage(`Resumed session for problem: ${currentSession.problemId}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to resume session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the endSession command
  const endSessionCommand = vscode.commands.registerCommand('ipsa.endSession', async () => {
    try {
      // Get the current session from state manager
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session to end');
        return;
      }

      // Clear the current session
      const problemId = currentSession.problemId;
      await stateManager.setCurrentSession(undefined);

      vscode.window.showInformationMessage(`Ended session for problem: ${problemId}`);

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to end session: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the openPlanDocument command
  const openPlanDocumentCommand = vscode.commands.registerCommand('ipsa.openPlanDocument', async () => {
    Logger.log('ipsa.openPlanDocument command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // For this command, we don't need the document manager to be initialized

      // Show file picker
      const fileUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          'planDocuments': ['plan.md']
        },
        title: 'Open Plan Document'
      });

      if (!fileUris || fileUris.length === 0) {
        return; // User cancelled
      }

      // Open the selected document
      await vscode.window.showTextDocument(fileUris[0]);

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open plan document: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the showSessionStatus command
  const showSessionStatusCommand = vscode.commands.registerCommand('ipsa.showSessionStatus', () => {
    // Get the current session from state manager
    const currentSession = stateManager.getCurrentSession();

    if (currentSession) {
      vscode.window.showInformationMessage(
        `Active Session: ${currentSession.problemId} (Step ${currentSession.currentStep + 1}, Iteration ${currentSession.currentIteration})`
      );
    } else {
      vscode.window.showInformationMessage('No active IPSA session');
    }
  });

  // Register the listSessions command
  const listSessionsCommand = vscode.commands.registerCommand('ipsa.listSessions', async () => {
    try {
      // Get all sessions from state manager
      const sessions = stateManager.getSessions();
      const sessionIds = Object.keys(sessions);

      if (sessionIds.length === 0) {
        vscode.window.showInformationMessage('No IPSA sessions found');
        return;
      }

      // Create QuickPick items for each session
      const items = sessionIds.map(id => {
        const session = sessions[id];
        return {
          label: session.problemId,
          description: `Created: ${new Date(session.created).toLocaleString()}`,
          detail: `Step ${session.currentStep + 1}, Iteration ${session.currentIteration}`,
          sessionId: id
        };
      });

      // Show QuickPick
      const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a session to switch to',
        title: 'IPSA Sessions'
      });

      if (selectedItem) {
        // Set as current session
        await stateManager.setCurrentSession(selectedItem.sessionId);

        // Open the plan document
        const session = sessions[selectedItem.sessionId];
        const uri = vscode.Uri.file(session.planDocumentPath);
        await vscode.window.showTextDocument(uri);

        // Update status bar
        updateStatusBar();

        vscode.window.showInformationMessage(`Switched to session: ${session.problemId}`);
      }
    } catch (error) {
      Logger.error('Failed to list sessions', error);
      vscode.window.showErrorMessage(`Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the managePreferences command
  const managePreferencesCommand = vscode.commands.registerCommand('ipsa.managePreferences', async () => {
    try {
      // Get current preferences
      const preferences = stateManager.getUserPreferences();

      // Create QuickPick items for preferences
      const items = [
        {
          label: 'Preferred Assistant',
          description: `Current: ${preferences.preferredAssistant}`,
          key: 'preferredAssistant',
          values: ['clipboard', 'copilot', 'cursor', 'other']
        },
        {
          label: 'Auto-commit Git Changes',
          description: `Current: ${preferences.gitAutoCommit ? 'Enabled' : 'Disabled'}`,
          key: 'gitAutoCommit',
          values: [true, false]
        },
        {
          label: 'Max Previous Findings',
          description: `Current: ${preferences.maxPreviousFindings}`,
          key: 'maxPreviousFindings',
          values: [3, 5, 10, 15, 20]
        },
        {
          label: 'Show Response in Panel',
          description: `Current: ${preferences.showResponseInPanel ? 'Enabled' : 'Disabled'}`,
          key: 'showResponseInPanel',
          values: [true, false]
        }
      ];

      // Show QuickPick for preference selection
      const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a preference to change',
        title: 'IPSA Preferences'
      });

      if (selectedItem) {
        // Show QuickPick for value selection
        const valueItems = selectedItem.values.map(value => ({
          label: String(value),
          value
        }));

        const selectedValue = await vscode.window.showQuickPick(valueItems, {
          placeHolder: `Select a value for ${selectedItem.label}`,
          title: `IPSA Preferences: ${selectedItem.label}`
        });

        if (selectedValue) {
          // Save the preference
          await stateManager.saveUserPreference(selectedItem.key, selectedValue.value);
          vscode.window.showInformationMessage(`Updated ${selectedItem.label} to ${selectedValue.label}`);
        }
      }
    } catch (error) {
      Logger.error('Failed to manage preferences', error);
      vscode.window.showErrorMessage(`Failed to manage preferences: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register event listeners
  const documentSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
    // Check if the saved document is a plan document
    const currentSession = stateManager.getCurrentSession();
    if (document.fileName.endsWith('.plan.md') && currentSession) {
      // Update the session's lastModified timestamp
      const updatedSession = {
        ...currentSession,
        lastModified: new Date()
      };

      // Save the updated session
      await stateManager.saveSessionState(currentSession.id, updatedSession);

      // Update the status bar
      updateStatusBar();

      Logger.log(`Plan document saved: ${document.fileName}`);

      // Auto-commit if enabled
      if (getConfiguration('git.autoCommit')) {
        // This would be implemented in a real Git integration
        Logger.log('Auto-commit is enabled, would commit changes here');
      }
    }
  });

  // Listen for configuration changes
  const configurationListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('ipsa')) {
      Logger.log('IPSA configuration changed');

      // The ConfigManager will handle updating cached values
      // We just need to update the UI if necessary
      if (event.affectsConfiguration('ipsa.git.autoCommit')) {
        Logger.log('Git auto-commit setting changed');
      }
    }
  });

  // Add all commands to the subscriptions array
  context.subscriptions.push(createPlanDocumentCommand);
  context.subscriptions.push(startNewSessionCommand);
  context.subscriptions.push(resumeSessionCommand);
  context.subscriptions.push(endSessionCommand);
  context.subscriptions.push(openPlanDocumentCommand);
  context.subscriptions.push(showSessionStatusCommand);
  context.subscriptions.push(listSessionsCommand);
  context.subscriptions.push(managePreferencesCommand);
  context.subscriptions.push(documentSaveListener);
  context.subscriptions.push(configurationListener);

  // Session restoration is handled by the state manager
  // Just update the status bar to reflect the current session
  updateStatusBar();

  // Log the current session if available
  const currentSession = stateManager.getCurrentSession();
  if (currentSession) {
    Logger.log(`Active session for problem: ${currentSession.problemId}`);
  } else {
    Logger.log('No active session');
  }
}

/**
 * Updates the status bar item based on the current session state.
 */
function updateStatusBar(): void {
  const currentSession = stateManager?.getCurrentSession();

  if (currentSession) {
    statusBarItem.text = `$(beaker) IPSA: ${currentSession.problemId}`;
    statusBarItem.tooltip = `Step ${currentSession.currentStep + 1}, Iteration ${currentSession.currentIteration}`;
    statusBarItem.show();
  } else {
    statusBarItem.text = '$(beaker) IPSA: No Active Session';
    statusBarItem.tooltip = 'Click to start a new session';
    statusBarItem.show();
  }
}

/**
 * Gets a configuration value from the extension settings.
 * @param key The configuration key (without the 'ipsa.' prefix)
 * @param defaultValue The default value if the configuration is not set
 * @returns The configuration value
 */
function getConfiguration<T>(key: string, defaultValue?: T): T {
  return configManager?.get<T>(key, defaultValue) ?? (defaultValue as T);
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up resources
  if (statusBarItem) {
    statusBarItem.dispose();
  }

  // Log deactivation
  console.log('IPSA extension is now deactivated!');
}
