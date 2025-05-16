import * as vscode from 'vscode';

/**
 * Manager for extension configuration.
 */
export class ConfigManager {
  private static _instance: ConfigManager;
  private _configChangeEmitter: vscode.EventEmitter<string>;
  private _onConfigChange: vscode.Event<string>;

  /**
   * Creates a new ConfigManager.
   */
  private constructor() {
    this._configChangeEmitter = new vscode.EventEmitter<string>();
    this._onConfigChange = this._configChangeEmitter.event;
  }

  /**
   * Gets the singleton instance of the ConfigManager.
   * @returns The ConfigManager instance
   */
  public static getInstance(): ConfigManager {
    if (!this._instance) {
      this._instance = new ConfigManager();
    }
    return this._instance;
  }

  /**
   * Gets a configuration value.
   * @param key The configuration key (without the 'ipsa.' prefix)
   * @param defaultValue The default value if the configuration is not set
   * @returns The configuration value
   */
  public get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration('ipsa');
    return config.get<T>(key, defaultValue as T);
  }

  /**
   * Sets a configuration value.
   * @param key The configuration key (without the 'ipsa.' prefix)
   * @param value The configuration value
   * @param target The configuration target
   */
  public async set<T>(
    key: string,
    value: T,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('ipsa');
    await config.update(key, value, target);
    this._configChangeEmitter.fire(key);
  }

  /**
   * Gets an event that is emitted when a configuration value changes.
   * @returns The event
   */
  public get onConfigChange(): vscode.Event<string> {
    return this._onConfigChange;
  }

  /**
   * Registers a listener for configuration changes.
   * @param disposables The disposables array to add the listener to
   */
  public registerConfigChangeListener(disposables: vscode.Disposable[]): void {
    const listener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('ipsa')) {
        // Find which settings changed
        const keys = ['preferredAssistant', 'git.autoCommit', 'prompt.maxPreviousFindings'];
        for (const key of keys) {
          if (event.affectsConfiguration(`ipsa.${key}`)) {
            this._configChangeEmitter.fire(key);
          }
        }
      }
    });
    disposables.push(listener);
  }
}
