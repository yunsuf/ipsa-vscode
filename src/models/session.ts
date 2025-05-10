/**
 * Represents the state of a problem-solving session.
 */
export interface IPSASession {
  /**
   * Unique identifier for the session.
   */
  id: string;

  /**
   * Identifier for the problem being solved.
   * Used in file naming and display.
   */
  problemId: string;

  /**
   * Path to the plan document file.
   */
  planDocumentPath: string;

  /**
   * The current iteration number.
   */
  currentIteration: number;

  /**
   * The current step index in the initial plan.
   */
  currentStep: number;

  /**
   * The last prompt sent to the AI assistant.
   */
  lastPrompt?: string;

  /**
   * The last response received from the AI assistant.
   */
  lastResponse?: string;

  /**
   * Timestamp when the session was created.
   */
  created: Date;

  /**
   * Timestamp when the session was last modified.
   */
  lastModified: Date;
}

/**
 * Manager for session operations.
 */
export interface SessionManager {
  /**
   * Start a new problem-solving session.
   * @param problemId Identifier for the problem
   * @returns The created session
   */
  startNewSession(problemId: string): Promise<IPSASession>;

  /**
   * Resume an existing session.
   * @param sessionId ID of the session to resume
   * @returns The resumed session
   */
  resumeSession(sessionId: string): Promise<IPSASession>;

  /**
   * End the current session.
   */
  endSession(): Promise<void>;

  /**
   * Get all existing sessions.
   * @returns Array of existing sessions
   */
  getExistingSessions(): Promise<IPSASession[]>;

  /**
   * Get the current active session.
   * @returns The current session or undefined if no session is active
   */
  getCurrentSession(): IPSASession | undefined;

  /**
   * Update a session with new data.
   * @param session The session to update
   * @returns The updated session
   */
  updateSession(session: IPSASession): Promise<IPSASession>;
}
