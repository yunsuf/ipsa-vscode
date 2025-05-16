import * as vscode from 'vscode';
import { IPSASession } from './session';
import { PlanDocument, PlanStep, Iteration } from './planDocument';
import { Finding } from './finding';

/**
 * Message types for communication between the extension and WebView.
 */
export enum WebViewMessageType {
  // From extension to WebView
  UPDATE_SESSION = 'updateSession',
  UPDATE_PLAN_DOCUMENT = 'updatePlanDocument',
  UPDATE_CURRENT_STEP = 'updateCurrentStep',
  UPDATE_CURRENT_ITERATION = 'updateCurrentIteration',
  UPDATE_FINDINGS = 'updateFindings',
  SHOW_NOTIFICATION = 'showNotification',
  
  // From WebView to extension
  START_NEW_ITERATION = 'startNewIteration',
  ADVANCE_TO_NEXT_STEP = 'advanceToNextStep',
  GO_TO_PREVIOUS_STEP = 'goToPreviousStep',
  SKIP_CURRENT_STEP = 'skipCurrentStep',
  MARK_STEP_COMPLETED = 'markStepCompleted',
  SEND_PROMPT_TO_ASSISTANT = 'sendPromptToAssistant',
  CAPTURE_ASSISTANT_RESPONSE = 'captureAssistantResponse',
  EXTRACT_FINDINGS = 'extractFindings',
  OPEN_PLAN_DOCUMENT = 'openPlanDocument'
}

/**
 * Base interface for all WebView messages.
 */
export interface WebViewMessage {
  type: WebViewMessageType;
}

/**
 * Message to update the session state in the WebView.
 */
export interface UpdateSessionMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_SESSION;
  session: IPSASession;
}

/**
 * Message to update the plan document in the WebView.
 */
export interface UpdatePlanDocumentMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_PLAN_DOCUMENT;
  planDocument: PlanDocument;
}

/**
 * Message to update the current step in the WebView.
 */
export interface UpdateCurrentStepMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_CURRENT_STEP;
  step: PlanStep;
  stepIndex: number;
}

/**
 * Message to update the current iteration in the WebView.
 */
export interface UpdateCurrentIterationMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_CURRENT_ITERATION;
  iteration: Iteration;
}

/**
 * Message to update the findings in the WebView.
 */
export interface UpdateFindingsMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_FINDINGS;
  findings: Finding[];
}

/**
 * Message to show a notification in the WebView.
 */
export interface ShowNotificationMessage extends WebViewMessage {
  type: WebViewMessageType.SHOW_NOTIFICATION;
  message: string;
  level: 'info' | 'warning' | 'error';
}

/**
 * Message to start a new iteration from the WebView.
 */
export interface StartNewIterationMessage extends WebViewMessage {
  type: WebViewMessageType.START_NEW_ITERATION;
  prompt?: string;
}

/**
 * Message to advance to the next step from the WebView.
 */
export interface AdvanceToNextStepMessage extends WebViewMessage {
  type: WebViewMessageType.ADVANCE_TO_NEXT_STEP;
  startNewIteration?: boolean;
  prompt?: string;
}

/**
 * Message to go to the previous step from the WebView.
 */
export interface GoToPreviousStepMessage extends WebViewMessage {
  type: WebViewMessageType.GO_TO_PREVIOUS_STEP;
}

/**
 * Message to skip the current step from the WebView.
 */
export interface SkipCurrentStepMessage extends WebViewMessage {
  type: WebViewMessageType.SKIP_CURRENT_STEP;
}

/**
 * Message to mark the current step as completed from the WebView.
 */
export interface MarkStepCompletedMessage extends WebViewMessage {
  type: WebViewMessageType.MARK_STEP_COMPLETED;
}

/**
 * Message to send a prompt to the assistant from the WebView.
 */
export interface SendPromptToAssistantMessage extends WebViewMessage {
  type: WebViewMessageType.SEND_PROMPT_TO_ASSISTANT;
  prompt: string;
}

/**
 * Message to capture the assistant response from the WebView.
 */
export interface CaptureAssistantResponseMessage extends WebViewMessage {
  type: WebViewMessageType.CAPTURE_ASSISTANT_RESPONSE;
}

/**
 * Message to extract findings from the WebView.
 */
export interface ExtractFindingsMessage extends WebViewMessage {
  type: WebViewMessageType.EXTRACT_FINDINGS;
  response: string;
}

/**
 * Message to open the plan document from the WebView.
 */
export interface OpenPlanDocumentMessage extends WebViewMessage {
  type: WebViewMessageType.OPEN_PLAN_DOCUMENT;
}

/**
 * Provider for the IPSA WebView panel.
 */
export interface IPSAWebViewProvider {
  /**
   * Create and show the WebView panel.
   * @returns The created WebView panel
   */
  createWebViewPanel(): vscode.WebviewPanel;
  
  /**
   * Update the WebView with the current session state.
   * @param session The current session
   */
  updateSession(session: IPSASession): void;
  
  /**
   * Update the WebView with the current plan document.
   * @param planDocument The current plan document
   */
  updatePlanDocument(planDocument: PlanDocument): void;
  
  /**
   * Show a notification in the WebView.
   * @param message The notification message
   * @param level The notification level
   */
  showNotification(message: string, level: 'info' | 'warning' | 'error'): void;
  
  /**
   * Dispose of the WebView panel.
   */
  dispose(): void;
}
