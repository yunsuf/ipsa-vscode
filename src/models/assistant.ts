/**
 * Adapter for interacting with an AI assistant.
 */
export interface AssistantAdapter {
  /**
   * Send a prompt to the AI assistant.
   * @param prompt The prompt to send
   */
  sendPrompt(prompt: string): Promise<void>;

  /**
   * Get a response from the AI assistant.
   * @returns The response from the AI assistant
   */
  getResponse(): Promise<string>;
}

/**
 * Types of AI assistants.
 */
export type AssistantType = 'clipboard' | 'copilot' | 'cursor' | 'other';

/**
 * Options for interacting with an AI assistant.
 */
export interface AssistantOptions {
  /**
   * The type of AI assistant to use.
   */
  assistantType?: AssistantType;

  /**
   * Whether to request a structured response format.
   */
  structuredFormat?: boolean;

  /**
   * Timeout for waiting for a response.
   */
  timeout?: number;

  /**
   * Command ID for command-based integration.
   */
  commandId?: string;
}

/**
 * System for interacting with AI assistants.
 */
export interface AIAssistantIntegration {
  /**
   * Register an adapter for an assistant type.
   * @param type The assistant type
   * @param adapter The adapter to register
   */
  registerAdapter(type: AssistantType, adapter: AssistantAdapter): void;

  /**
   * Get an adapter for an assistant type.
   * @param type The assistant type
   * @returns The adapter for the specified type
   */
  getAdapter(type: AssistantType): AssistantAdapter;

  /**
   * Send a prompt to an AI assistant.
   * @param prompt The prompt to send
   * @param options Options for sending the prompt
   */
  sendPrompt(prompt: string, options?: AssistantOptions): Promise<void>;

  /**
   * Get a response from an AI assistant.
   * @param options Options for getting the response
   * @returns The response from the AI assistant
   */
  getResponse(options?: AssistantOptions): Promise<string>;

  /**
   * Get the preferred assistant type from user configuration.
   * @returns The preferred assistant type
   */
  getPreferredAssistantType(): AssistantType;

  /**
   * Get all registered assistant types.
   * @returns Array of registered assistant types
   */
  getRegisteredAssistantTypes(): AssistantType[];

  /**
   * Check if an assistant type is available.
   * @param type The assistant type to check
   * @returns True if the assistant type is available, false otherwise
   */
  isAssistantTypeAvailable(type: AssistantType): boolean;

  /**
   * Get the display name for an assistant type.
   * @param type The assistant type
   * @returns The display name for the assistant type
   */
  getAssistantTypeDisplayName(type: AssistantType): string;
}
