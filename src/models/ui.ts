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
  OPEN_PLAN_DOCUMENT = 'openPlanDocument',

  // Plan Document Editor messages
  UPDATE_PROBLEM_STATEMENT = 'updateProblemStatement',
  ADD_PLAN_STEP = 'addPlanStep',
  UPDATE_PLAN_STEP = 'updatePlanStep',
  REMOVE_PLAN_STEP = 'removePlanStep',
  REORDER_PLAN_STEPS = 'reorderPlanSteps',
  OPEN_DOCUMENT_EDITOR = 'openDocumentEditor',
  SAVE_DOCUMENT_CHANGES = 'saveDocumentChanges',

  // Findings interface messages
  CREATE_FINDING = 'createFinding',
  DELETE_FINDING = 'deleteFinding',
  UPDATE_FINDINGS_SETTINGS = 'updateFindingsSettings'
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
 * Message to update the problem statement from the WebView.
 */
export interface UpdateProblemStatementMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_PROBLEM_STATEMENT;
  problemStatement: string;
}

/**
 * Message to add a plan step from the WebView.
 */
export interface AddPlanStepMessage extends WebViewMessage {
  type: WebViewMessageType.ADD_PLAN_STEP;
  description: string;
}

/**
 * Message to update a plan step from the WebView.
 */
export interface UpdatePlanStepMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_PLAN_STEP;
  stepId: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'done';
}

/**
 * Message to remove a plan step from the WebView.
 */
export interface RemovePlanStepMessage extends WebViewMessage {
  type: WebViewMessageType.REMOVE_PLAN_STEP;
  stepId: string;
}

/**
 * Message to reorder plan steps from the WebView.
 */
export interface ReorderPlanStepsMessage extends WebViewMessage {
  type: WebViewMessageType.REORDER_PLAN_STEPS;
  stepIds: string[];
}

/**
 * Message to open the document editor from the WebView.
 */
export interface OpenDocumentEditorMessage extends WebViewMessage {
  type: WebViewMessageType.OPEN_DOCUMENT_EDITOR;
}

/**
 * Message to save document changes from the WebView.
 */
export interface SaveDocumentChangesMessage extends WebViewMessage {
  type: WebViewMessageType.SAVE_DOCUMENT_CHANGES;
  planDocument: PlanDocument;
}

/**
 * Message to create a finding from the WebView.
 */
export interface CreateFindingMessage extends WebViewMessage {
  type: WebViewMessageType.CREATE_FINDING;
  finding: Finding;
}

/**
 * Message to delete a finding from the WebView.
 */
export interface DeleteFindingMessage extends WebViewMessage {
  type: WebViewMessageType.DELETE_FINDING;
  findingId: string;
}

/**
 * Message to update findings settings from the WebView.
 */
export interface UpdateFindingsSettingsMessage extends WebViewMessage {
  type: WebViewMessageType.UPDATE_FINDINGS_SETTINGS;
  settings: {
    autoExtract: boolean;
    preferredTypes: string[];
    previewBeforeSave: boolean;
  };
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
   * Open the document editor in the WebView.
   * @param planDocument The plan document to edit
   */
  openDocumentEditor(planDocument: PlanDocument): void;

  /**
   * Update the problem statement in the WebView.
   * @param problemStatement The updated problem statement
   */
  updateProblemStatement(problemStatement: string): void;

  /**
   * Update a plan step in the WebView.
   * @param step The updated plan step
   */
  updatePlanStep(step: PlanStep): void;

  /**
   * Dispose of the WebView panel.
   */
  dispose(): void;
}
