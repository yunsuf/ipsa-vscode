import * as vscode from 'vscode';
import { IPSASession, StateManager, UserPreferences } from '../models';

/**
 * Implementation of the StateManager interface.
 * Manages extension state using VS Code's extension context.
 */
export class StateManagerImpl implements StateManager {
  private _context: vscode.ExtensionContext;
  private _sessions: Record<string, IPSASession>;
  private _currentSessionId: string | undefined;
  private _memoryCache: Map<string, any>;

  /**
   * Creates a new StateManagerImpl.
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._sessions = this._loadSessions();
    this._currentSessionId = this._context.globalState.get<string>('currentSessionId');
    this._memoryCache = new Map<string, any>();
  }

  /**
   * Saves session state.
   * @param sessionId The session ID
   * @param state The session state to save
   */
  public async saveSessionState(sessionId: string, state: IPSASession): Promise<void> {
    // Update the sessions record
    this._sessions[sessionId] = state;

    // Save to global state
    await this._context.globalState.update('sessions', this._sessions);

    // Update current session ID if this is the current session
    if (this._currentSessionId === sessionId) {
      await this._context.globalState.update('currentSessionId', sessionId);
    }
  }

  /**
   * Gets all sessions.
   * @returns Record of session IDs to session states
   */
  public getSessions(): Record<string, IPSASession> {
    return { ...this._sessions };
  }

  /**
   * Gets a specific session.
   * @param sessionId The session ID
   * @returns The session state or undefined if not found
   */
  public getSession(sessionId: string): IPSASession | undefined {
    return this._sessions[sessionId];
  }

  /**
   * Gets the current active session.
   * @returns The current session or undefined if no session is active
   */
  public getCurrentSession(): IPSASession | undefined {
    return this._currentSessionId ? this._sessions[this._currentSessionId] : undefined;
  }

  /**
   * Sets the current active session.
   * @param sessionId The session ID to set as current
   */
  public async setCurrentSession(sessionId: string | undefined): Promise<void> {
    this._currentSessionId = sessionId;
    await this._context.globalState.update('currentSessionId', sessionId);
  }

  /**
   * Deletes a session.
   * @param sessionId The session ID
   */
  public async deleteSession(sessionId: string): Promise<void> {
    // Remove from sessions record
    delete this._sessions[sessionId];

    // Save to global state
    await this._context.globalState.update('sessions', this._sessions);

    // Clear current session ID if this is the current session
    if (this._currentSessionId === sessionId) {
      this._currentSessionId = undefined;
      await this._context.globalState.update('currentSessionId', undefined);
    }
  }

  /**
   * Saves a user preference.
   * @param key The preference key
   * @param value The preference value
   */
  public async saveUserPreference<T>(key: string, value: T): Promise<void> {
    // Save to global state
    await this._context.globalState.update(`pref_${key}`, value);

    // Update memory cache
    this._memoryCache.set(key, value);
  }

  /**
   * Gets a user preference.
   * @param key The preference key
   * @param defaultValue The default value if the preference is not set
   * @returns The preference value or the default value
   */
  public getUserPreference<T>(key: string, defaultValue: T): T {
    // Check memory cache first
    if (this._memoryCache.has(key)) {
      return this._memoryCache.get(key) as T;
    }

    // Get from global state
    const value = this._context.globalState.get<T>(`pref_${key}`, defaultValue);

    // Update memory cache
    this._memoryCache.set(key, value);

    return value;
  }

  /**
   * Gets all user preferences.
   * @returns The user preferences
   */
  public getUserPreferences(): UserPreferences {
    return {
      preferredAssistant: this.getUserPreference<'clipboard' | 'copilot' | 'cursor' | 'other'>('preferredAssistant', 'clipboard'),
      gitAutoCommit: this.getUserPreference<boolean>('gitAutoCommit', false),
      maxPreviousFindings: this.getUserPreference<number>('maxPreviousFindings', 5),
      showResponseInPanel: this.getUserPreference<boolean>('showResponseInPanel', true)
    };
  }

  /**
   * Clears all state.
   */
  public async clearState(): Promise<void> {
    // Clear sessions
    this._sessions = {};
    await this._context.globalState.update('sessions', this._sessions);

    // Clear current session ID
    this._currentSessionId = undefined;
    await this._context.globalState.update('currentSessionId', undefined);

    // Clear memory cache
    this._memoryCache.clear();
  }

  /**
   * Updates the path of a plan document in a session.
   * @param sessionId The session ID
   * @param newPath The new path to the plan document
   */
  public async updateSessionPlanDocumentPath(sessionId: string, newPath: string): Promise<void> {
    // Get the session
    const session = this._sessions[sessionId];

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update the path
    session.planDocumentPath = newPath;
    session.lastModified = new Date();

    // Save the updated session
    await this.saveSessionState(sessionId, session);
  }

  /**
   * Loads sessions from global state.
   * @returns Record of session IDs to session states
   */
  private _loadSessions(): Record<string, IPSASession> {
    return this._context.globalState.get<Record<string, IPSASession>>('sessions', {});
  }
}
