import { AIAssistantIntegration, AssistantAdapter, AssistantOptions, AssistantType } from '../models/assistant';
import { ClipboardAssistantAdapter, CopilotAssistantAdapter, CursorAssistantAdapter } from './assistantAdapter';
import { ConfigManager } from '../state';
import { Logger } from '../logger';

/**
 * Implementation of the AIAssistantIntegration interface.
 */
export class AIAssistantIntegrationImpl implements AIAssistantIntegration {
  private _adapters: Map<AssistantType, AssistantAdapter>;
  private _configManager: ConfigManager;

  /**
   * Creates a new AIAssistantIntegrationImpl.
   */
  constructor() {
    this._adapters = new Map();
    this._configManager = ConfigManager.getInstance();

    // Register default adapters
    this._registerDefaultAdapters();
  }

  /**
   * Register an adapter for an assistant type.
   * @param type The assistant type
   * @param adapter The adapter to register
   */
  public registerAdapter(type: AssistantType, adapter: AssistantAdapter): void {
    this._adapters.set(type, adapter);
    Logger.log(`Registered adapter for assistant type: ${type}`);
  }

  /**
   * Get an adapter for an assistant type.
   * @param type The assistant type
   * @returns The adapter for the specified type
   */
  public getAdapter(type: AssistantType): AssistantAdapter {
    const adapter = this._adapters.get(type);

    if (!adapter) {
      throw new Error(`No adapter registered for assistant type: ${type}`);
    }

    return adapter;
  }

  /**
   * Send a prompt to an AI assistant.
   * @param prompt The prompt to send
   * @param options Options for sending the prompt
   */
  public async sendPrompt(prompt: string, options?: AssistantOptions): Promise<void> {
    try {
      // Get the assistant type from options or user preferences
      const assistantType = options?.assistantType || this.getPreferredAssistantType();

      // Get the adapter for the assistant type
      const adapter = this.getAdapter(assistantType);

      // Send the prompt
      await adapter.sendPrompt(prompt);

      Logger.log(`Sent prompt to assistant type: ${assistantType}`);
    } catch (error) {
      Logger.error('Failed to send prompt to AI assistant', error);
      throw new Error(`Failed to send prompt to AI assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a response from an AI assistant.
   * @param options Options for getting the response
   * @returns The response from the AI assistant
   */
  public async getResponse(options?: AssistantOptions): Promise<string> {
    try {
      // Get the assistant type from options or user preferences
      const assistantType = options?.assistantType || this.getPreferredAssistantType();

      // Get the adapter for the assistant type
      const adapter = this.getAdapter(assistantType);

      // Get the response
      const response = await adapter.getResponse();

      Logger.log(`Got response from assistant type: ${assistantType}`);

      return response;
    } catch (error) {
      Logger.error('Failed to get response from AI assistant', error);
      throw new Error(`Failed to get response from AI assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the preferred assistant type from user configuration.
   * @returns The preferred assistant type
   */
  public getPreferredAssistantType(): AssistantType {
    const preferredAssistant = this._configManager.get<AssistantType>(
      'assistant.preferredAssistant',
      'clipboard'
    );

    return preferredAssistant;
  }

  /**
   * Register default adapters.
   * @private
   */
  private _registerDefaultAdapters(): void {
    // Register clipboard adapter
    this.registerAdapter('clipboard', new ClipboardAssistantAdapter());

    // Register Copilot adapter
    this.registerAdapter('copilot', new CopilotAssistantAdapter());

    // Register Cursor adapter
    this.registerAdapter('cursor', new CursorAssistantAdapter());

    // Register a default adapter for 'other' type
    this.registerAdapter('other', new ClipboardAssistantAdapter());
  }

  /**
   * Get all registered assistant types.
   * @returns Array of registered assistant types
   */
  public getRegisteredAssistantTypes(): AssistantType[] {
    return Array.from(this._adapters.keys());
  }

  /**
   * Check if an assistant type is available.
   * @param type The assistant type to check
   * @returns True if the assistant type is available, false otherwise
   */
  public isAssistantTypeAvailable(type: AssistantType): boolean {
    return this._adapters.has(type);
  }

  /**
   * Get the display name for an assistant type.
   * @param type The assistant type
   * @returns The display name for the assistant type
   */
  public getAssistantTypeDisplayName(type: AssistantType): string {
    switch (type) {
      case 'clipboard':
        return 'Clipboard (Any Assistant)';
      case 'copilot':
        return 'GitHub Copilot';
      case 'cursor':
        return 'Cursor AI';
      case 'other':
        return 'Other Assistant';
      default:
        return type;
    }
  }
}
