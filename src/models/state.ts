import { IPSASession } from './session';

/**
 * Manager for extension state.
 */
export interface StateManager {
  /**
   * Save session state.
   * @param sessionId The session ID
   * @param state The session state to save
   */
  saveSessionState(sessionId: string, state: IPSASession): Promise<void>;

  /**
   * Get all sessions.
   * @returns Record of session IDs to session states
   */
  getSessions(): Record<string, IPSASession>;

  /**
   * Get a specific session.
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
   * Delete a session.
   * @param sessionId The session ID
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Updates the path of a plan document in a session.
   * @param sessionId The session ID
   * @param newPath The new path to the plan document
   */
  updateSessionPlanDocumentPath(sessionId: string, newPath: string): Promise<void>;

  /**
   * Save a user preference.
   * @param key The preference key
   * @param value The preference value
   */
  saveUserPreference<T>(key: string, value: T): Promise<void>;

  /**
   * Get a user preference.
   * @param key The preference key
   * @param defaultValue The default value if the preference is not set
   * @returns The preference value or the default value
   */
  getUserPreference<T>(key: string, defaultValue: T): T;
}

/**
 * User preferences for the extension.
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
   * Maximum number of previous findings to include in prompts.
   */
  maxPreviousFindings: number;

  /**
   * Whether to show the AI assistant response in the IPSA panel.
   */
  showResponseInPanel: boolean;
}
