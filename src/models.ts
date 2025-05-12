/**
 * Represents a plan document.
 */
export interface PlanDocument {
  /**
   * The problem ID.
   */
  problemId: string;

  /**
   * The path to the plan document.
   */
  path: string;

  /**
   * The problem statement.
   */
  problemStatement: string;

  /**
   * The initial plan steps.
   */
  initialPlan: PlanStep[];

  /**
   * The iterations.
   */
  iterations: Iteration[];

  /**
   * Metadata about the plan document.
   */
  metadata: {
    /**
     * The date the plan document was created.
     */
    created: Date;

    /**
     * The date the plan document was last modified.
     */
    lastModified: Date;

    /**
     * The version of the plan document format.
     */
    version: string;
  };
}

/**
 * Represents a step in the plan.
 */
export interface PlanStep {
  /**
   * The step ID.
   */
  id: string;

  /**
   * The step description.
   */
  description: string;

  /**
   * The step status.
   */
  status: 'pending' | 'in-progress' | 'done';

  /**
   * The step order.
   */
  order: number;
}

/**
 * Represents an iteration in the plan.
 */
export interface Iteration {
  /**
   * The iteration number.
   */
  number: number;

  /**
   * The step ID this iteration is associated with.
   */
  stepId?: string;

  /**
   * The prompt used in this iteration.
   */
  prompt: string;

  /**
   * The response received in this iteration.
   */
  response: string;

  /**
   * The findings from this iteration.
   */
  findings: Finding[];

  /**
   * The timestamp when the iteration was created.
   */
  timestamp?: Date;
}

/**
 * Represents a finding from an iteration.
 */
export interface Finding {
  /**
   * The finding ID.
   */
  id: string;

  /**
   * The finding type.
   */
  type: 'code' | 'analysis' | 'issue' | 'solution' | 'documentation';

  /**
   * The finding content.
   */
  content: string;

  /**
   * Optional metadata about the finding.
   */
  metadata?: {
    /**
     * The programming language for code findings.
     */
    language?: string;

    /**
     * The source of the finding.
     */
    source?: string;

    /**
     * The timestamp when the finding was created.
     */
    timestamp?: number;
  };
}

/**
 * Represents an IPSA session.
 */
export interface IPSASession {
  /**
   * The session ID.
   */
  id: string;

  /**
   * The problem ID.
   */
  problemId: string;

  /**
   * The path to the plan document.
   */
  planDocumentPath: string;

  /**
   * The current iteration number.
   */
  currentIteration: number;

  /**
   * The current step number.
   */
  currentStep: number;

  /**
   * The date the session was created.
   */
  created: Date;

  /**
   * The date the session was last modified.
   */
  lastModified: Date;
}

/**
 * Represents user preferences.
 */
export interface UserPreferences {
  /**
   * The preferred AI assistant type.
   */
  preferredAssistant: 'clipboard' | 'copilot' | 'cursor' | 'other';

  /**
   * Whether to automatically commit plan document changes.
   */
  gitAutoCommit: boolean;

  /**
   * The maximum number of previous findings to include in prompts.
   */
  maxPreviousFindings: number;

  /**
   * Whether to show responses in a panel.
   */
  showResponseInPanel: boolean;
}

/**
 * Interface for the plan document manager.
 */
export interface PlanDocumentManager {
  /**
   * Creates a new plan document.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  createPlanDocument(problemId: string): Promise<PlanDocument>;

  /**
   * Loads an existing plan document.
   * @param path Path to the plan document
   * @returns The loaded plan document
   */
  loadPlanDocument(path: string): Promise<PlanDocument>;

  /**
   * Updates a plan document with new data.
   * @param document The document to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  updatePlanDocument(
    document: PlanDocument,
    updates: Partial<PlanDocument>
  ): Promise<PlanDocument>;

  /**
   * Adds an iteration to a plan document.
   * @param document The document to update
   * @param iteration The iteration to add
   * @returns The updated document
   */
  addIteration(
    document: PlanDocument,
    iteration: Iteration
  ): Promise<PlanDocument>;

  /**
   * Adds a finding to an iteration.
   * @param document The document to update
   * @param iterationNumber The iteration number
   * @param finding The finding to add
   * @returns The updated document
   */
  addFinding(
    document: PlanDocument,
    iterationNumber: number,
    finding: Finding
  ): Promise<PlanDocument>;

  /**
   * Updates a plan step.
   * @param document The document to update
   * @param stepId The ID of the step to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  updatePlanStep(
    document: PlanDocument,
    stepId: string,
    updates: Partial<PlanStep>
  ): Promise<PlanDocument>;

  /**
   * Creates a template plan document with default structure.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  createTemplatePlanDocument(problemId: string): Promise<PlanDocument>;
}

/**
 * Interface for the state manager.
 */
export interface StateManager {
  /**
   * Saves session state.
   * @param sessionId The session ID
   * @param state The session state to save
   */
  saveSessionState(sessionId: string, state: IPSASession): Promise<void>;

  /**
   * Gets all sessions.
   * @returns Record of session IDs to session states
   */
  getSessions(): Record<string, IPSASession>;

  /**
   * Gets a specific session.
   * @param sessionId The session ID
   * @returns The session state or undefined if not found
   */
  getSession(sessionId: string): IPSASession | undefined;

  /**
   * Gets the current active session.
   * @returns The current session or undefined if no session is active
   */
  getCurrentSession(): IPSASession | undefined;

  /**
   * Sets the current active session.
   * @param sessionId The session ID to set as current
   */
  setCurrentSession(sessionId: string | undefined): Promise<void>;

  /**
   * Deletes a session.
   * @param sessionId The session ID
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Saves a user preference.
   * @param key The preference key
   * @param value The preference value
   */
  saveUserPreference<T>(key: string, value: T): Promise<void>;

  /**
   * Gets a user preference.
   * @param key The preference key
   * @param defaultValue The default value if the preference is not set
   * @returns The preference value or the default value
   */
  getUserPreference<T>(key: string, defaultValue: T): T;

  /**
   * Gets all user preferences.
   * @returns The user preferences
   */
  getUserPreferences(): UserPreferences;

  /**
   * Clears all state.
   */
  clearState(): Promise<void>;
}
