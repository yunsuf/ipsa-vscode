// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as path from 'path';
import { PlanDocumentManagerImpl } from './document/planDocumentManager';
import { Logger } from './logger';
import { StateManagerImpl, ConfigManager } from './state';
import { PromptConstructionEngineImpl } from './prompt/promptConstructionEngine';
import { FindingsExtractorImpl } from './findings/findingsExtractor';
import { FindingType, FindingMetadata } from './models/finding';
import { IterationControlManagerImpl } from './iteration/iterationControlManager';
import { AIAssistantIntegrationImpl } from './assistant/assistantIntegration';
import { OutputManagerImpl } from './output/outputManager';
import { IPSAWebViewProviderImpl } from './ui/webViewProvider';
// Import types as needed

// Global state for the extension
let stateManager: StateManagerImpl;
let configManager: ConfigManager;
let planDocumentManager: PlanDocumentManagerImpl | undefined;
let promptConstructionEngine: PromptConstructionEngineImpl;
let findingsExtractor: FindingsExtractorImpl;
let iterationControlManager: IterationControlManagerImpl;
let aiAssistantIntegration: AIAssistantIntegrationImpl;
let outputManager: OutputManagerImpl | undefined;
let webViewProvider: IPSAWebViewProviderImpl | undefined;
let statusBarItem: vscode.StatusBarItem;
let assistantStatusBarItem: vscode.StatusBarItem;

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

    // Initialize prompt construction engine
    promptConstructionEngine = new PromptConstructionEngineImpl();
    Logger.log('Prompt construction engine initialized');

    // Initialize findings extractor
    findingsExtractor = new FindingsExtractorImpl();
    Logger.log('Findings extractor initialized');

    // Initialize AI assistant integration
    aiAssistantIntegration = new AIAssistantIntegrationImpl();
    Logger.log('AI assistant integration initialized');

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

  // Create session status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'ipsa.showSessionStatus';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Create assistant status bar item
  assistantStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  assistantStatusBarItem.command = 'ipsa.configureAssistant';
  context.subscriptions.push(assistantStatusBarItem);
  updateAssistantStatusBar();

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

        // Initialize the iteration control manager
        iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
        Logger.log('Iteration control manager initialized successfully');

        // Initialize the output manager
        outputManager = new OutputManagerImpl(workspaceRoot);
        Logger.log('Output manager initialized successfully');

        // Initialize the WebView provider
        webViewProvider = new IPSAWebViewProviderImpl(context.extensionUri);
        Logger.log('WebView provider initialized successfully');
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

      // Create quick pick items for active and archived documents
      const quickPickItems: vscode.QuickPickItem[] = [];

      // Add active documents
      try {
        const activeDocs = await planDocumentManager.listActivePlanDocuments();
        for (const docPath of activeDocs) {
          const fileName = path.basename(docPath);
          quickPickItems.push({
            label: fileName.replace('.plan.md', ''),
            description: 'Active',
            detail: docPath
          });
        }

        // Add archived documents
        const archivedDocs = await planDocumentManager.listArchivedPlanDocuments();
        for (const docPath of archivedDocs) {
          const fileName = path.basename(docPath);
          quickPickItems.push({
            label: fileName.replace('.plan.md', ''),
            description: 'Archived',
            detail: docPath
          });
        }
      } catch (error) {
        Logger.error('Failed to list plan documents', error);
        // Fall back to file picker if listing fails
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
        return;
      }

      if (quickPickItems.length === 0) {
        vscode.window.showInformationMessage('No plan documents found. Create a new one first.');
        return;
      }

      // Show quick pick
      const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a plan document to open',
        title: 'Open Plan Document'
      });

      if (selectedItem) {
        // Open the selected document
        const uri = vscode.Uri.file(selectedItem.detail!);
        await vscode.window.showTextDocument(uri);
      }
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

  // Register the extractFindings command
  const extractFindingsCommand = vscode.commands.registerCommand('ipsa.extractFindings', async () => {
    try {
      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current iteration
      if (planDoc.iterations.length === 0) {
        vscode.window.showErrorMessage('No iterations found in the plan document. Please add an iteration first.');
        return;
      }

      // Get the latest iteration
      const latestIteration = planDoc.iterations[planDoc.iterations.length - 1];

      // Check if the iteration has a response
      if (!latestIteration.response) {
        vscode.window.showErrorMessage('The latest iteration does not have a response. Please add a response first.');
        return;
      }

      // Extract findings from the response
      const findings = findingsExtractor.extractFindings(latestIteration.response);

      if (findings.length === 0) {
        vscode.window.showInformationMessage('No findings were automatically extracted. You can manually create findings from selected text.');
        return;
      }

      // Show findings in a quick pick
      const items = findings.map(finding => ({
        label: `${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}`,
        description: finding.content.length > 50 ? finding.content.substring(0, 50) + '...' : finding.content,
        detail: finding.metadata.language ? `Language: ${finding.metadata.language}` : undefined,
        finding
      }));

      const selectedItems = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: 'Select findings to add to the iteration',
        title: 'Extracted Findings'
      });

      if (!selectedItems || selectedItems.length === 0) {
        return; // User cancelled or didn't select any findings
      }

      // Add selected findings to the iteration
      for (const item of selectedItems) {
        await planDocumentManager.addFinding(planDoc, latestIteration.number, item.finding);
      }

      vscode.window.showInformationMessage(`Added ${selectedItems.length} finding(s) to iteration ${latestIteration.number}`);
    } catch (error) {
      Logger.error('Failed to extract findings', error);
      vscode.window.showErrorMessage(`Failed to extract findings: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the createFinding command
  const createFindingCommand = vscode.commands.registerCommand('ipsa.createFinding', async () => {
    try {
      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current iteration
      if (planDoc.iterations.length === 0) {
        vscode.window.showErrorMessage('No iterations found in the plan document. Please add an iteration first.');
        return;
      }

      // Get the latest iteration
      const latestIteration = planDoc.iterations[planDoc.iterations.length - 1];

      // Get the active text editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }

      // Get the selected text
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }

      // Show a quick pick for finding type
      const findingTypes: FindingType[] = ['code', 'analysis', 'issue', 'solution', 'documentation'];
      const typeItems = findingTypes.map(type => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type
      }));

      const selectedType = await vscode.window.showQuickPick(typeItems, {
        placeHolder: 'Select the type of finding',
        title: 'Finding Type'
      });

      if (!selectedType) {
        return; // User cancelled
      }

      // If it's a code finding, try to detect the language
      let metadata: Partial<FindingMetadata> = {};
      if (selectedType.type === 'code') {
        // Try to get the language from the document
        const language = editor.document.languageId;
        if (language && language !== 'plaintext') {
          metadata.language = language;
        }
      }

      // Create the finding
      const finding = findingsExtractor.createFindingFromSelection(
        selectedText,
        selectedType.type,
        metadata
      );

      // Add the finding to the iteration
      await planDocumentManager.addFinding(planDoc, latestIteration.number, finding);

      vscode.window.showInformationMessage(`Added ${selectedType.type} finding to iteration ${latestIteration.number}`);
    } catch (error) {
      Logger.error('Failed to create finding', error);
      vscode.window.showErrorMessage(`Failed to create finding: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the constructPrompt command
  const constructPromptCommand = vscode.commands.registerCommand('ipsa.constructPrompt', async () => {
    try {
      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current step
      const currentStep = planDoc.initialPlan[currentSession.currentStep];

      if (!currentStep) {
        vscode.window.showErrorMessage('Current step not found in plan');
        return;
      }

      // Get relevant findings from previous iterations
      const relevantFindings = planDoc.iterations
        .flatMap(iteration => iteration.findings)
        .slice(0, getConfiguration('prompt.maxPreviousFindings', 5));

      // Get custom instructions from user
      const customInstructions = await vscode.window.showInputBox({
        prompt: 'Enter any custom instructions for this prompt',
        placeHolder: 'e.g., Focus on implementing the authentication logic'
      });

      // Construct the prompt
      const prompt = promptConstructionEngine.constructPrompt(
        planDoc.problemStatement,
        currentStep,
        relevantFindings,
        {
          customInstructions: customInstructions || undefined
        }
      );

      // Show the prompt in a new editor
      const promptDoc = await vscode.workspace.openTextDocument({
        content: prompt,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(promptDoc);

      vscode.window.showInformationMessage('Prompt constructed successfully');
    } catch (error) {
      Logger.error('Failed to construct prompt', error);
      vscode.window.showErrorMessage(`Failed to construct prompt: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the migratePlanDocuments command
  const migratePlanDocumentsCommand = vscode.commands.registerCommand('ipsa.migratePlanDocuments', async () => {
    Logger.log('ipsa.migratePlanDocuments command triggered');
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

      // Confirm with the user
      const confirm = await vscode.window.showWarningMessage(
        'This will move all plan documents from the workspace root to the .ipsa/plans/active directory. Continue?',
        'Yes', 'No'
      );

      if (confirm !== 'Yes') {
        return;
      }

      // Migrate documents
      const migratedCount = await planDocumentManager.migratePlanDocuments();

      vscode.window.showInformationMessage(`Successfully migrated ${migratedCount} plan documents.`);
    } catch (error) {
      Logger.error('Failed to migrate plan documents', error);
      vscode.window.showErrorMessage(`Failed to migrate plan documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the archivePlanDocument command
  const archivePlanDocumentCommand = vscode.commands.registerCommand('ipsa.archivePlanDocument', async () => {
    Logger.log('ipsa.archivePlanDocument command triggered');
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

      // Get active documents
      const activeDocs = await planDocumentManager.listActivePlanDocuments();
      if (activeDocs.length === 0) {
        vscode.window.showInformationMessage('No active plan documents found to archive.');
        return;
      }

      // Create quick pick items
      const quickPickItems = activeDocs.map(docPath => {
        const fileName = path.basename(docPath);
        return {
          label: fileName.replace('.plan.md', ''),
          detail: docPath
        };
      });

      // Show quick pick
      const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a plan document to archive',
        title: 'Archive Plan Document'
      });

      if (!selectedItem) {
        return; // User cancelled
      }

      // Load the document
      const planDoc = await planDocumentManager.loadPlanDocument(selectedItem.detail!);

      // Archive the document
      await planDocumentManager.archivePlanDocument(planDoc);

      vscode.window.showInformationMessage(`Successfully archived plan document: ${selectedItem.label}`);
    } catch (error) {
      Logger.error('Failed to archive plan document', error);
      vscode.window.showErrorMessage(`Failed to archive plan document: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the startNewIteration command
  const startNewIterationCommand = vscode.commands.registerCommand('ipsa.startNewIteration', async () => {
    Logger.log('ipsa.startNewIteration command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Get custom prompt from user
      const prompt = await vscode.window.showInputBox({
        prompt: 'Enter a prompt for the new iteration (optional)',
        placeHolder: 'e.g., Implement the authentication logic'
      });

      // Start a new iteration
      const newIteration = await iterationControlManager.startNewIteration({
        prompt: prompt || undefined
      });

      vscode.window.showInformationMessage(`Started new iteration: ${newIteration.number}`);

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      Logger.error('Failed to start new iteration', error);
      vscode.window.showErrorMessage(`Failed to start new iteration: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the advanceToNextStep command
  const advanceToNextStepCommand = vscode.commands.registerCommand('ipsa.advanceToNextStep', async () => {
    Logger.log('ipsa.advanceToNextStep command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Ask if the user wants to start a new iteration for the next step
      const startNewIteration = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ],
        {
          placeHolder: 'Start a new iteration for the next step?',
          title: 'Advance to Next Step'
        }
      );

      if (!startNewIteration) {
        return; // User cancelled
      }

      let prompt: string | undefined;
      if (startNewIteration.value) {
        // Get custom prompt from user
        prompt = await vscode.window.showInputBox({
          prompt: 'Enter a prompt for the new iteration (optional)',
          placeHolder: 'e.g., Implement the authentication logic'
        });
      }

      // Advance to the next step
      const updatedSession = await iterationControlManager.advanceToNextStep({
        startNewIteration: startNewIteration.value,
        prompt: prompt
      });

      vscode.window.showInformationMessage(`Advanced to step ${updatedSession.currentStep + 1}`);

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      Logger.error('Failed to advance to next step', error);
      vscode.window.showErrorMessage(`Failed to advance to next step: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the goToPreviousStep command
  const goToPreviousStepCommand = vscode.commands.registerCommand('ipsa.goToPreviousStep', async () => {
    Logger.log('ipsa.goToPreviousStep command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Go to the previous step
      const updatedSession = await iterationControlManager.goToPreviousStep();

      vscode.window.showInformationMessage(`Went back to step ${updatedSession.currentStep + 1}`);

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      Logger.error('Failed to go to previous step', error);
      vscode.window.showErrorMessage(`Failed to go to previous step: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the skipCurrentStep command
  const skipCurrentStepCommand = vscode.commands.registerCommand('ipsa.skipCurrentStep', async () => {
    Logger.log('ipsa.skipCurrentStep command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Confirm with the user
      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to skip the current step?',
        'Yes', 'No'
      );

      if (confirm !== 'Yes') {
        return;
      }

      // Skip the current step
      const updatedSession = await iterationControlManager.skipCurrentStep();

      vscode.window.showInformationMessage(`Skipped to step ${updatedSession.currentStep + 1}`);

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      Logger.error('Failed to skip current step', error);
      vscode.window.showErrorMessage(`Failed to skip current step: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the markStepAsCompleted command
  const markStepAsCompletedCommand = vscode.commands.registerCommand('ipsa.markStepAsCompleted', async () => {
    Logger.log('ipsa.markStepAsCompleted command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Mark the current step as completed
      await iterationControlManager.markStepAsCompleted();

      vscode.window.showInformationMessage('Marked current step as completed');

      // Update the status bar
      updateStatusBar();
    } catch (error) {
      Logger.error('Failed to mark step as completed', error);
      vscode.window.showErrorMessage(`Failed to mark step as completed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the showSessionMetrics command
  const showSessionMetricsCommand = vscode.commands.registerCommand('ipsa.showSessionMetrics', async () => {
    Logger.log('ipsa.showSessionMetrics command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        // Try to initialize it now
        try {
          iterationControlManager = new IterationControlManagerImpl(stateManager, planDocumentManager);
          Logger.log('Iteration control manager initialized on-demand');
        } catch (error) {
          Logger.error('Failed to initialize iteration control manager on-demand', error);
          vscode.window.showErrorMessage('Failed to initialize iteration control manager. Please try reloading the window.');
          return;
        }
      }

      // Get the session metrics
      const metrics = await iterationControlManager.getSessionMetrics();

      // Create a markdown document with the metrics
      const content = `# Session Metrics

## Overview
- Total Iterations: ${metrics.totalIterations}
- Total Time: ${formatDuration(metrics.totalTime)}

## Iterations per Step
${Object.entries(metrics.iterationsPerStep)
  .map(([stepId, count]) => `- ${stepId}: ${count}`)
  .join('\n')}

## Findings per Step
${Object.entries(metrics.findingsPerStep)
  .map(([stepId, count]) => `- ${stepId}: ${count}`)
  .join('\n')}

## Time per Step
${Object.entries(metrics.timePerStep)
  .map(([stepId, time]) => `- ${stepId}: ${formatDuration(time)}`)
  .join('\n')}
`;

      // Show the metrics in a new editor
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(doc);
    } catch (error) {
      Logger.error('Failed to show session metrics', error);
      vscode.window.showErrorMessage(`Failed to show session metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the configureAssistant command
  const configureAssistantCommand = vscode.commands.registerCommand('ipsa.configureAssistant', async () => {
    Logger.log('ipsa.configureAssistant command triggered');
    try {
      // Get all registered assistant types
      const assistantTypes = aiAssistantIntegration.getRegisteredAssistantTypes();

      // Create QuickPick items for each assistant type
      const items = assistantTypes.map(type => ({
        label: aiAssistantIntegration.getAssistantTypeDisplayName(type),
        description: type === aiAssistantIntegration.getPreferredAssistantType() ? '(Current)' : '',
        value: type
      }));

      // Show QuickPick
      const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an AI assistant to use',
        title: 'Configure AI Assistant'
      });

      if (selectedItem) {
        // Save the preference
        await stateManager.saveUserPreference('assistant.preferredAssistant', selectedItem.value);

        // Update the status bar
        updateAssistantStatusBar();

        vscode.window.showInformationMessage(`AI assistant set to: ${selectedItem.label}`);
      }
    } catch (error) {
      Logger.error('Failed to configure AI assistant', error);
      vscode.window.showErrorMessage(`Failed to configure AI assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the sendPromptToAssistant command
  const sendPromptToAssistantCommand = vscode.commands.registerCommand('ipsa.sendPromptToAssistant', async () => {
    Logger.log('ipsa.sendPromptToAssistant command triggered');
    try {
      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current step
      const currentStep = planDoc.initialPlan[currentSession.currentStep];

      if (!currentStep) {
        vscode.window.showErrorMessage('Current step not found in plan');
        return;
      }

      // Get relevant findings from previous iterations
      const relevantFindings = planDoc.iterations
        .flatMap(iteration => iteration.findings)
        .slice(0, getConfiguration('prompt.maxPreviousFindings', 5));

      // Get custom instructions from user
      const customInstructions = await vscode.window.showInputBox({
        prompt: 'Enter any custom instructions for this prompt',
        placeHolder: 'e.g., Focus on implementing the authentication logic'
      });

      // Construct the prompt
      const prompt = promptConstructionEngine.constructPrompt(
        planDoc.problemStatement,
        currentStep,
        relevantFindings,
        {
          customInstructions: customInstructions || undefined
        }
      );

      // Send the prompt to the AI assistant
      await aiAssistantIntegration.sendPrompt(prompt);

      vscode.window.showInformationMessage('Prompt sent to AI assistant');
    } catch (error) {
      Logger.error('Failed to send prompt to AI assistant', error);
      vscode.window.showErrorMessage(`Failed to send prompt to AI assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the captureAssistantResponse command
  const captureAssistantResponseCommand = vscode.commands.registerCommand('ipsa.captureAssistantResponse', async () => {
    Logger.log('ipsa.captureAssistantResponse command triggered');
    try {
      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if iteration control manager is initialized
      if (!iterationControlManager) {
        vscode.window.showErrorMessage('Iteration control manager not initialized');
        return;
      }

      // Get the response from the AI assistant
      const response = await aiAssistantIntegration.getResponse();

      // Create a new iteration if needed
      let iteration = currentSession.currentIteration;
      if (iteration === 0) {
        // Start a new iteration
        const newIteration = await iterationControlManager.startNewIteration();
        iteration = newIteration.number;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Find the current iteration
      const currentIteration = planDoc.iterations.find(i => i.number === iteration);

      if (!currentIteration) {
        vscode.window.showErrorMessage(`Iteration ${iteration} not found`);
        return;
      }

      // Update the iteration with the response
      currentIteration.response = response;

      // Update the plan document
      await planDocumentManager.updatePlanDocument(planDoc, {
        iterations: planDoc.iterations
      });

      vscode.window.showInformationMessage('AI assistant response captured successfully');

      // Ask if the user wants to extract findings
      const extractFindings = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ],
        {
          placeHolder: 'Extract findings from the response?',
          title: 'Extract Findings'
        }
      );

      if (extractFindings?.value) {
        // Extract findings
        await vscode.commands.executeCommand('ipsa.extractFindings');
      }
    } catch (error) {
      Logger.error('Failed to capture AI assistant response', error);
      vscode.window.showErrorMessage(`Failed to capture AI assistant response: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the interactWithAssistant command
  const interactWithAssistantCommand = vscode.commands.registerCommand('ipsa.interactWithAssistant', async () => {
    Logger.log('ipsa.interactWithAssistant command triggered');
    try {
      // First, send the prompt to the AI assistant
      await vscode.commands.executeCommand('ipsa.sendPromptToAssistant');

      // Then, capture the response
      await vscode.commands.executeCommand('ipsa.captureAssistantResponse');
    } catch (error) {
      Logger.error('Failed to interact with AI assistant', error);
      vscode.window.showErrorMessage(`Failed to interact with AI assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the extractCodeSnippets command
  const extractCodeSnippetsCommand = vscode.commands.registerCommand('ipsa.extractCodeSnippets', async () => {
    Logger.log('ipsa.extractCodeSnippets command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if output manager is initialized
      if (!outputManager) {
        vscode.window.showErrorMessage('Output manager not initialized');
        return;
      }

      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current iteration
      const currentIteration = planDoc.iterations.find(i => i.number === currentSession.currentIteration);

      if (!currentIteration) {
        vscode.window.showErrorMessage('No current iteration found');
        return;
      }

      // Get code findings from the current iteration
      const codeFindings = currentIteration.findings.filter(f => f.type === 'code');

      if (codeFindings.length === 0) {
        vscode.window.showInformationMessage('No code findings found in the current iteration');
        return;
      }

      // Extract code snippets from each finding
      const allSnippets = [];
      for (const finding of codeFindings) {
        const snippets = await outputManager.extractCodeSnippets(finding);
        allSnippets.push(...snippets);
      }

      if (allSnippets.length === 0) {
        vscode.window.showInformationMessage('No code snippets extracted');
        return;
      }

      // Show a quick pick to select a snippet
      const items = allSnippets.map(snippet => ({
        label: `${snippet.type} (${snippet.language})`,
        description: snippet.suggestedFilePath || '',
        detail: snippet.content.length > 50 ? snippet.content.substring(0, 50) + '...' : snippet.content,
        snippet
      }));

      const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a code snippet to apply',
        title: 'Extract Code Snippets'
      });

      if (!selectedItem) {
        return;
      }

      // Ask if the user wants to apply the snippet
      const applySnippet = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ],
        {
          placeHolder: 'Apply the selected code snippet to the workspace?',
          title: 'Apply Code Snippet'
        }
      );

      if (!applySnippet || !applySnippet.value) {
        return;
      }

      // Apply the snippet
      await vscode.commands.executeCommand('ipsa.applyCodeSnippet', selectedItem.snippet);
    } catch (error) {
      Logger.error('Failed to extract code snippets', error);
      vscode.window.showErrorMessage(`Failed to extract code snippets: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the applyCodeSnippet command
  const applyCodeSnippetCommand = vscode.commands.registerCommand('ipsa.applyCodeSnippet', async (snippet) => {
    Logger.log('ipsa.applyCodeSnippet command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if output manager is initialized
      if (!outputManager) {
        vscode.window.showErrorMessage('Output manager not initialized');
        return;
      }

      // If no snippet is provided, show an error
      if (!snippet) {
        vscode.window.showErrorMessage('No code snippet provided');
        return;
      }

      // Ask for the file path if not provided
      let filePath = snippet.suggestedFilePath;
      if (!filePath) {
        filePath = await vscode.window.showInputBox({
          prompt: 'Enter the file path to apply the snippet to',
          placeHolder: 'e.g., src/index.ts'
        });

        if (!filePath) {
          return;
        }
      }

      // Ask if the file should be created if it doesn't exist
      const createFile = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ],
        {
          placeHolder: 'Create the file if it doesn\'t exist?',
          title: 'Create File'
        }
      );

      if (!createFile) {
        return;
      }

      // Apply the snippet
      const appliedPath = await outputManager.applyCodeSnippet(snippet, {
        filePath,
        createFile: createFile.value
      });

      vscode.window.showInformationMessage(`Code snippet applied to: ${appliedPath}`);

      // Open the file
      const uri = vscode.Uri.file(appliedPath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      Logger.error('Failed to apply code snippet', error);
      vscode.window.showErrorMessage(`Failed to apply code snippet: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the generateDocumentation command
  const generateDocumentationCommand = vscode.commands.registerCommand('ipsa.generateDocumentation', async () => {
    Logger.log('ipsa.generateDocumentation command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if output manager is initialized
      if (!outputManager) {
        vscode.window.showErrorMessage('Output manager not initialized');
        return;
      }

      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get default values from configuration
      const defaultFormat = getConfiguration<string>('output.defaultDocumentationFormat', 'markdown');
      const defaultIncludeCodeSnippets = getConfiguration<boolean>('output.includeCodeSnippets', true);
      const defaultIncludeFindings = getConfiguration<boolean>('output.includeFindings', true);
      const defaultIncludeMetrics = getConfiguration<boolean>('output.includeMetrics', true);

      // Ask for the documentation format
      const format = await vscode.window.showQuickPick(
        [
          { label: 'Markdown', value: 'markdown', description: defaultFormat === 'markdown' ? '(Default)' : '' },
          { label: 'HTML', value: 'html', description: defaultFormat === 'html' ? '(Default)' : '' },
          { label: 'JSON', value: 'json', description: defaultFormat === 'json' ? '(Default)' : '' }
        ],
        {
          placeHolder: 'Select the documentation format',
          title: 'Generate Documentation'
        }
      );

      if (!format) {
        return;
      }

      // Ask for documentation options
      const includeCodeSnippets = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true, description: defaultIncludeCodeSnippets ? '(Default)' : '' },
          { label: 'No', value: false, description: !defaultIncludeCodeSnippets ? '(Default)' : '' }
        ],
        {
          placeHolder: 'Include code snippets in the documentation?',
          title: 'Include Code Snippets'
        }
      );

      if (!includeCodeSnippets) {
        return;
      }

      const includeFindings = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true, description: defaultIncludeFindings ? '(Default)' : '' },
          { label: 'No', value: false, description: !defaultIncludeFindings ? '(Default)' : '' }
        ],
        {
          placeHolder: 'Include findings in the documentation?',
          title: 'Include Findings'
        }
      );

      if (!includeFindings) {
        return;
      }

      const includeMetrics = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true, description: defaultIncludeMetrics ? '(Default)' : '' },
          { label: 'No', value: false, description: !defaultIncludeMetrics ? '(Default)' : '' }
        ],
        {
          placeHolder: 'Include metrics in the documentation?',
          title: 'Include Metrics'
        }
      );

      if (!includeMetrics) {
        return;
      }

      // Generate the documentation
      const docPath = await outputManager.generateDocumentation(planDoc, {
        format: format.value as 'markdown' | 'html' | 'pdf' | 'json',
        includeCodeSnippets: includeCodeSnippets.value,
        includeFindings: includeFindings.value,
        includeMetrics: includeMetrics.value,
        title: `${planDoc.problemId} Documentation`,
        description: `Documentation for the problem: ${planDoc.problemId}`
      });

      vscode.window.showInformationMessage(`Documentation generated: ${docPath}`);

      // Open the documentation
      const uri = vscode.Uri.file(docPath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      Logger.error('Failed to generate documentation', error);
      vscode.window.showErrorMessage(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the exportPlanDocument command
  const exportPlanDocumentCommand = vscode.commands.registerCommand('ipsa.exportPlanDocument', async () => {
    Logger.log('ipsa.exportPlanDocument command triggered');
    try {
      // Check if we have a workspace
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('IPSA requires a workspace to be opened. Please open a folder first.');
        return;
      }

      // Check if document manager is initialized
      if (!planDocumentManager) {
        vscode.window.showErrorMessage('Document manager not initialized');
        return;
      }

      // Check if output manager is initialized
      if (!outputManager) {
        vscode.window.showErrorMessage('Output manager not initialized');
        return;
      }

      // Get the current session
      const currentSession = stateManager.getCurrentSession();

      if (!currentSession) {
        vscode.window.showErrorMessage('No active session. Please start a session first.');
        return;
      }

      // Load the plan document
      const planDoc = await planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get default export format from configuration
      const defaultFormat = getConfiguration<string>('output.defaultExportFormat', 'markdown');

      // Ask for the export format
      const format = await vscode.window.showQuickPick(
        [
          { label: 'Markdown', value: 'markdown', description: defaultFormat === 'markdown' ? '(Default)' : '' },
          { label: 'HTML', value: 'html', description: defaultFormat === 'html' ? '(Default)' : '' },
          { label: 'JSON', value: 'json', description: defaultFormat === 'json' ? '(Default)' : '' }
        ],
        {
          placeHolder: 'Select the export format',
          title: 'Export Plan Document'
        }
      );

      if (!format) {
        return;
      }

      // Export the plan document
      const exportPath = await outputManager.exportPlanDocument(planDoc, format.value as 'markdown' | 'html' | 'pdf' | 'json');

      vscode.window.showInformationMessage(`Plan document exported: ${exportPath}`);

      // Open the exported document
      const uri = vscode.Uri.file(exportPath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      Logger.error('Failed to export plan document', error);
      vscode.window.showErrorMessage(`Failed to export plan document: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Register the migrateSessionPaths command
  const migrateSessionPathsCommand = vscode.commands.registerCommand('ipsa.migrateSessionPaths', async () => {
    Logger.log('ipsa.migrateSessionPaths command triggered');
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

      // Confirm with the user
      const confirm = await vscode.window.showWarningMessage(
        'This will update all session paths to point to the new organized folder structure. Continue?',
        'Yes', 'No'
      );

      if (confirm !== 'Yes') {
        return;
      }

      // Get all sessions
      const sessions = stateManager.getSessions();
      let updatedCount = 0;

      // Process each session
      for (const sessionId in sessions) {
        const session = sessions[sessionId];

        // Check if the plan document exists at the current path
        const currentPath = session.planDocumentPath;
        if (await planDocumentManager.fileExists(currentPath)) {
          // Document exists at the current path, no need to update
          continue;
        }

        // Try to find the document in the organized folder structure
        try {
          // Extract the filename from the path
          const fileName = currentPath.split('/').pop() || '';

          // Check if the file exists in the active plans directory
          const activePath = path.join(planDocumentManager.activePlansRoot, fileName);
          if (await planDocumentManager.fileExists(activePath)) {
            // Update the session path
            await stateManager.updateSessionPlanDocumentPath(sessionId, activePath);
            updatedCount++;
            continue;
          }

          // Check if the file exists in the archived plans directory
          const archivedPath = path.join(planDocumentManager.archivedPlansRoot, fileName);
          if (await planDocumentManager.fileExists(archivedPath)) {
            // Update the session path
            await stateManager.updateSessionPlanDocumentPath(sessionId, archivedPath);
            updatedCount++;
            continue;
          }
        } catch (error) {
          Logger.error(`Failed to update session path for session ${sessionId}`, error);
        }
      }

      vscode.window.showInformationMessage(`Successfully updated ${updatedCount} session paths.`);
    } catch (error) {
      Logger.error('Failed to migrate session paths', error);
      vscode.window.showErrorMessage(`Failed to migrate session paths: ${error instanceof Error ? error.message : String(error)}`);
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
  context.subscriptions.push(constructPromptCommand);
  context.subscriptions.push(extractFindingsCommand);
  context.subscriptions.push(createFindingCommand);
  context.subscriptions.push(migratePlanDocumentsCommand);
  context.subscriptions.push(archivePlanDocumentCommand);
  context.subscriptions.push(migrateSessionPathsCommand);

  // Add iteration control commands
  context.subscriptions.push(startNewIterationCommand);
  context.subscriptions.push(advanceToNextStepCommand);
  context.subscriptions.push(goToPreviousStepCommand);
  context.subscriptions.push(skipCurrentStepCommand);
  context.subscriptions.push(markStepAsCompletedCommand);
  context.subscriptions.push(showSessionMetricsCommand);

  // Add AI assistant integration commands
  context.subscriptions.push(configureAssistantCommand);
  context.subscriptions.push(sendPromptToAssistantCommand);
  context.subscriptions.push(captureAssistantResponseCommand);
  context.subscriptions.push(interactWithAssistantCommand);

  // Register the showIPSAPanel command
  const showIPSAPanelCommand = vscode.commands.registerCommand('ipsa.showIPSAPanel', () => {
    Logger.log('ipsa.showIPSAPanel command triggered');
    try {
      // Check if WebView provider is initialized
      if (!webViewProvider) {
        // Initialize it now
        webViewProvider = new IPSAWebViewProviderImpl(context.extensionUri);
        Logger.log('WebView provider initialized on-demand');
      }

      // Create and show the WebView panel
      if (webViewProvider) {
        webViewProvider.createWebViewPanel();
      } else {
        Logger.error('WebView provider is undefined');
        vscode.window.showErrorMessage('Failed to create WebView panel: WebView provider is undefined');
        return;
      }

      // Get the current session
      const currentSession = stateManager.getCurrentSession();
      if (currentSession && planDocumentManager && webViewProvider) {
        // Update the WebView with the current session
        webViewProvider.updateSession(currentSession);

        // Load and update the plan document
        planDocumentManager.loadPlanDocument(currentSession.planDocumentPath)
          .then(planDoc => {
            if (webViewProvider) {
              webViewProvider.updatePlanDocument(planDoc);

              // Get the current step
              const currentStep = planDoc.initialPlan[currentSession.currentStep];
              if (currentStep) {
                // Update the WebView with the current step
                webViewProvider.showNotification(`Current step: ${currentStep.description}`, 'info');
              }

              // Get the current iteration
              const currentIteration = planDoc.iterations.find(i => i.number === currentSession.currentIteration);
              if (currentIteration && currentIteration.findings) {
                // Update the WebView with the findings
                webViewProvider.showNotification(`Loaded ${currentIteration.findings.length} findings from iteration ${currentIteration.number}`, 'info');
              }
            }
          })
          .catch(error => {
            Logger.error('Failed to load plan document', error);
            webViewProvider?.showNotification(`Failed to load plan document: ${error instanceof Error ? error.message : String(error)}`, 'error');
          });
      } else if (webViewProvider) {
        webViewProvider.showNotification('No active session. Please start a session first.', 'warning');
      }
    } catch (error) {
      Logger.error('Failed to show IPSA panel', error);
      vscode.window.showErrorMessage(`Failed to show IPSA panel: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Add output management commands
  context.subscriptions.push(extractCodeSnippetsCommand);
  context.subscriptions.push(applyCodeSnippetCommand);
  context.subscriptions.push(generateDocumentationCommand);
  context.subscriptions.push(exportPlanDocumentCommand);

  // Add UI commands
  context.subscriptions.push(showIPSAPanelCommand);

  // Add event listeners
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
 * Updates the assistant status bar item based on the current assistant configuration.
 */
function updateAssistantStatusBar(): void {
  if (!aiAssistantIntegration) {
    return;
  }

  const preferredAssistant = aiAssistantIntegration.getPreferredAssistantType();
  const displayName = aiAssistantIntegration.getAssistantTypeDisplayName(preferredAssistant);

  assistantStatusBarItem.text = `$(robot) AI: ${displayName}`;
  assistantStatusBarItem.tooltip = 'Click to configure AI assistant';
  assistantStatusBarItem.show();
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

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param milliseconds The duration in milliseconds
 * @returns A human-readable string representation of the duration
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
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
