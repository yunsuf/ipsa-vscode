import * as vscode from 'vscode';
import { IPSAWebViewProvider, WebViewMessageType, WebViewMessage } from '../models/ui';
import { IPSASession } from '../models/session';
import { PlanDocument, PlanStep } from '../models/planDocument';
import { Logger } from '../logger';

/**
 * Implementation of the IPSA WebView provider.
 */
export class IPSAWebViewProviderImpl implements IPSAWebViewProvider {
  private _panel: vscode.WebviewPanel | undefined;
  private _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * Creates a new IPSAWebViewProviderImpl.
   * @param extensionUri The extension URI
   */
  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  /**
   * Create and show the WebView panel.
   * @returns The created WebView panel
   */
  public createWebViewPanel(): vscode.WebviewPanel {
    // Create the WebView panel
    const panel = vscode.window.createWebviewPanel(
      'ipsaPanel',
      'IPSA: Iterative Problem-Solving Assistant',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, 'media')
        ]
      }
    );

    // Set the WebView content
    panel.webview.html = this._getWebViewContent(panel.webview);

    // Set up message handling
    panel.webview.onDidReceiveMessage(
      this._handleMessage.bind(this),
      null,
      this._disposables
    );

    // Store the panel
    this._panel = panel;

    // Handle panel disposal
    panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this._disposables
    );

    return panel;
  }

  /**
   * Update the WebView with the current session state.
   * @param session The current session
   */
  public updateSession(session: IPSASession): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.UPDATE_SESSION,
        session
      });
    }
  }

  /**
   * Update the WebView with the current plan document.
   * @param planDocument The current plan document
   */
  public updatePlanDocument(planDocument: PlanDocument): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.UPDATE_PLAN_DOCUMENT,
        planDocument
      });
    }
  }

  /**
   * Show a notification in the WebView.
   * @param message The notification message
   * @param level The notification level
   */
  public showNotification(message: string, level: 'info' | 'warning' | 'error'): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.SHOW_NOTIFICATION,
        message,
        level
      });
    }
  }

  /**
   * Open the document editor in the WebView.
   * @param planDocument The plan document to edit
   */
  public openDocumentEditor(planDocument: PlanDocument): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.OPEN_DOCUMENT_EDITOR,
        planDocument
      });
    }
  }

  /**
   * Update the problem statement in the WebView.
   * @param problemStatement The updated problem statement
   */
  public updateProblemStatement(problemStatement: string): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.UPDATE_PROBLEM_STATEMENT,
        problemStatement
      });
    }
  }

  /**
   * Update a plan step in the WebView.
   * @param step The updated plan step
   */
  public updatePlanStep(step: PlanStep): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.UPDATE_PLAN_STEP,
        step
      });
    }
  }

  /**
   * Update the findings in the WebView.
   * @param findings The updated findings
   */
  public updateFindings(findings: any[]): void {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: WebViewMessageType.UPDATE_FINDINGS,
        findings
      });
    }
  }

  /**
   * Dispose of the WebView panel.
   */
  public dispose(): void {
    // Clean up resources
    if (this._panel) {
      this._panel.dispose();
      this._panel = undefined;
    }

    // Dispose of all disposables
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Get the HTML content for the WebView.
   * @param webview The WebView
   * @returns The HTML content
   * @private
   */
  private _getWebViewContent(webview: vscode.Webview): string {
    // Get the local path to main script and CSS files
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>IPSA: Iterative Problem-Solving Assistant</title>
</head>
<body>
  <div class="container">
    <header>
      <h1>IPSA: Iterative Problem-Solving Assistant</h1>
      <div id="session-status">No active session</div>
    </header>

    <section id="current-session" class="hidden">
      <div class="section-header">
        <h2>Current Session</h2>
      </div>
      <div class="section-content">
        <div id="problem-id"></div>
        <div id="current-step"></div>
        <div id="current-iteration"></div>
      </div>
    </section>

    <section id="plan-steps">
      <div class="section-header">
        <h2>Plan Steps</h2>
      </div>
      <div class="section-content">
        <div id="steps-list">No plan steps available</div>
      </div>
    </section>

    <section id="findings">
      <div class="section-header">
        <h2>Findings</h2>
        <div class="section-actions">
          <button id="create-finding-btn" class="action-button">Create Finding</button>
          <button id="findings-settings-btn" class="action-button">Settings</button>
        </div>
      </div>
      <div class="section-content">
        <div id="findings-controls">
          <div class="findings-toolbar">
            <input type="text" id="findings-search" placeholder="Search findings..." />
            <select id="findings-filter">
              <option value="all">All Types</option>
              <option value="code">Code</option>
              <option value="analysis">Analysis</option>
              <option value="issue">Issue</option>
              <option value="solution">Solution</option>
              <option value="documentation">Documentation</option>
            </select>
            <select id="findings-sort">
              <option value="timestamp-desc">Newest First</option>
              <option value="timestamp-asc">Oldest First</option>
              <option value="type">By Type</option>
              <option value="source">By Source</option>
            </select>
          </div>
        </div>
        <div id="findings-list">No findings available</div>
      </div>
    </section>

    <section id="document-editor" class="hidden">
      <div class="section-header">
        <h2>Plan Document Editor</h2>
        <div class="section-actions">
          <button id="save-document-btn" class="action-button">Save</button>
          <button id="cancel-edit-btn" class="action-button">Cancel</button>
        </div>
      </div>
      <div class="section-content">
        <div class="editor-section">
          <h3>Problem Statement</h3>
          <textarea id="problem-statement-editor" placeholder="Enter the problem statement..."></textarea>
        </div>

        <div class="editor-section">
          <h3>Plan Steps</h3>
          <div id="plan-steps-editor">
            <div id="steps-editor-list"></div>
            <button id="add-step-btn" class="action-button">Add Step</button>
          </div>
        </div>

        <div class="editor-section">
          <h3>Iterations</h3>
          <div id="iterations-editor">
            <div id="iterations-editor-list"></div>
          </div>
        </div>
      </div>
    </section>

    <section id="prompt-section">
      <div class="section-header">
        <h2>Prompt</h2>
      </div>
      <div class="section-content">
        <textarea id="prompt-input" placeholder="Enter your prompt here..."></textarea>
        <div class="button-group">
          <button id="send-prompt-btn">Send Prompt</button>
          <button id="capture-response-btn">Capture Response</button>
          <button id="extract-findings-btn">Extract Findings</button>
        </div>
      </div>
    </section>

    <section id="controls">
      <div class="section-header">
        <h2>Controls</h2>
      </div>
      <div class="section-content">
        <div class="button-group">
          <button id="new-iteration-btn">New Iteration</button>
          <button id="next-step-btn">Next Step</button>
          <button id="prev-step-btn">Previous Step</button>
          <button id="skip-step-btn">Skip Step</button>
          <button id="complete-step-btn">Complete Step</button>
          <button id="open-plan-btn">Open Plan Document</button>
          <button id="edit-document-btn">Edit Plan Document</button>
        </div>
      </div>
    </section>

    <div id="notification" class="hidden"></div>
  </div>

  <!-- Create Finding Modal -->
  <div id="create-finding-modal" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Create Finding</h3>
        <button id="close-finding-modal-btn" class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="finding-type-select">Type:</label>
          <select id="finding-type-select">
            <option value="code">Code</option>
            <option value="analysis">Analysis</option>
            <option value="issue">Issue</option>
            <option value="solution">Solution</option>
            <option value="documentation">Documentation</option>
          </select>
        </div>
        <div class="form-group">
          <label for="finding-content-input">Content:</label>
          <textarea id="finding-content-input" placeholder="Enter finding content..." rows="6"></textarea>
        </div>
        <div class="form-group">
          <label for="finding-language-input">Language (for code findings):</label>
          <input type="text" id="finding-language-input" placeholder="e.g., javascript, python, typescript" />
        </div>
        <div class="form-group">
          <label for="finding-tags-input">Tags (comma-separated):</label>
          <input type="text" id="finding-tags-input" placeholder="e.g., bug, performance, refactor" />
        </div>
      </div>
      <div class="modal-footer">
        <button id="save-finding-btn" class="action-button primary">Save Finding</button>
        <button id="cancel-finding-btn" class="action-button">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Findings Settings Modal -->
  <div id="findings-settings-modal" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Findings Settings</h3>
        <button id="close-settings-modal-btn" class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>
            <input type="checkbox" id="auto-extract-enabled" checked />
            Enable automatic extraction
          </label>
        </div>
        <div class="form-group">
          <label for="extraction-types">Preferred extraction types:</label>
          <div id="extraction-types" class="checkbox-group">
            <label><input type="checkbox" value="code" checked /> Code</label>
            <label><input type="checkbox" value="analysis" checked /> Analysis</label>
            <label><input type="checkbox" value="issue" checked /> Issue</label>
            <label><input type="checkbox" value="solution" checked /> Solution</label>
            <label><input type="checkbox" value="documentation" checked /> Documentation</label>
          </div>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="preview-before-save" checked />
            Preview findings before saving
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button id="save-settings-btn" class="action-button primary">Save Settings</button>
        <button id="cancel-settings-btn" class="action-button">Cancel</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Handle messages from the WebView.
   * @param message The message
   * @private
   */
  private _handleMessage(message: WebViewMessage): void {
    Logger.log(`Received message from WebView: ${JSON.stringify(message)}`);

    switch (message.type) {
      case WebViewMessageType.START_NEW_ITERATION:
        vscode.commands.executeCommand('ipsa.startNewIteration', message);
        break;
      case WebViewMessageType.ADVANCE_TO_NEXT_STEP:
        vscode.commands.executeCommand('ipsa.advanceToNextStep', message);
        break;
      case WebViewMessageType.GO_TO_PREVIOUS_STEP:
        vscode.commands.executeCommand('ipsa.goToPreviousStep');
        break;
      case WebViewMessageType.SKIP_CURRENT_STEP:
        vscode.commands.executeCommand('ipsa.skipCurrentStep');
        break;
      case WebViewMessageType.MARK_STEP_COMPLETED:
        vscode.commands.executeCommand('ipsa.markStepAsCompleted');
        break;
      case WebViewMessageType.SEND_PROMPT_TO_ASSISTANT:
        vscode.commands.executeCommand('ipsa.sendPromptToAssistant', message);
        break;
      case WebViewMessageType.CAPTURE_ASSISTANT_RESPONSE:
        vscode.commands.executeCommand('ipsa.captureAssistantResponse');
        break;
      case WebViewMessageType.EXTRACT_FINDINGS:
        vscode.commands.executeCommand('ipsa.extractFindings', message);
        break;
      case WebViewMessageType.OPEN_PLAN_DOCUMENT:
        vscode.commands.executeCommand('ipsa.openPlanDocument');
        break;
      // Plan Document Editor messages
      case WebViewMessageType.OPEN_DOCUMENT_EDITOR:
        vscode.commands.executeCommand('ipsa.openDocumentEditor');
        break;
      case WebViewMessageType.UPDATE_PROBLEM_STATEMENT:
        vscode.commands.executeCommand('ipsa.updateProblemStatement', message);
        break;
      case WebViewMessageType.ADD_PLAN_STEP:
        vscode.commands.executeCommand('ipsa.addPlanStep', message);
        break;
      case WebViewMessageType.UPDATE_PLAN_STEP:
        vscode.commands.executeCommand('ipsa.updatePlanStep', message);
        break;
      case WebViewMessageType.REMOVE_PLAN_STEP:
        vscode.commands.executeCommand('ipsa.removePlanStep', message);
        break;
      case WebViewMessageType.REORDER_PLAN_STEPS:
        vscode.commands.executeCommand('ipsa.reorderPlanSteps', message);
        break;
      case WebViewMessageType.SAVE_DOCUMENT_CHANGES:
        vscode.commands.executeCommand('ipsa.saveDocumentChanges', message);
        break;
      // Findings interface messages
      case WebViewMessageType.CREATE_FINDING:
        vscode.commands.executeCommand('ipsa.createFinding', message);
        break;
      case WebViewMessageType.DELETE_FINDING:
        vscode.commands.executeCommand('ipsa.deleteFinding', message);
        break;
      case WebViewMessageType.UPDATE_FINDINGS_SETTINGS:
        vscode.commands.executeCommand('ipsa.updateFindingsSettings', message);
        break;
      default:
        Logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Generate a nonce string.
   * @returns A nonce string
   * @private
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
