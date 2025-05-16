import * as vscode from 'vscode';
import { IPSAWebViewProvider, WebViewMessageType, WebViewMessage } from '../models/ui';
import { IPSASession } from '../models/session';
import { PlanDocument } from '../models/planDocument';
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
      </div>
      <div class="section-content">
        <div id="findings-list">No findings available</div>
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
        </div>
      </div>
    </section>

    <div id="notification" class="hidden"></div>
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
