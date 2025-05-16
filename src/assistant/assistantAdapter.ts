import * as vscode from 'vscode';
import { AssistantAdapter } from '../models/assistant';
import { Logger } from '../logger';

/**
 * Adapter for clipboard-based interaction with AI assistants.
 */
export class ClipboardAssistantAdapter implements AssistantAdapter {
  /**
   * Send a prompt to the AI assistant via clipboard.
   * @param prompt The prompt to send
   */
  public async sendPrompt(prompt: string): Promise<void> {
    try {
      // Write the prompt to the clipboard
      await vscode.env.clipboard.writeText(prompt);

      // Show a notification to the user
      vscode.window.showInformationMessage('Prompt copied to clipboard. Paste it into your AI assistant.');
    } catch (error) {
      Logger.error('Failed to send prompt via clipboard', error);
      throw new Error(`Failed to send prompt via clipboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a response from the AI assistant via clipboard.
   * @returns The response from the AI assistant
   */
  public async getResponse(): Promise<string> {
    try {
      // Show a notification to the user
      vscode.window.showInformationMessage('Copy the AI assistant response to clipboard, then click "Capture Response"');

      // Ask the user to confirm when they've copied the response
      const confirmation = await vscode.window.showInformationMessage(
        'Have you copied the AI assistant response to clipboard?',
        'Capture Response', 'Cancel'
      );

      if (confirmation !== 'Capture Response') {
        throw new Error('Response capture cancelled by user');
      }

      // Read the response from the clipboard
      const response = await vscode.env.clipboard.readText();

      if (!response) {
        throw new Error('No response found in clipboard');
      }

      return response;
    } catch (error) {
      Logger.error('Failed to get response via clipboard', error);
      throw new Error(`Failed to get response via clipboard: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Adapter for GitHub Copilot integration.
 */
export class CopilotAssistantAdapter implements AssistantAdapter {
  /**
   * Send a prompt to GitHub Copilot.
   * @param prompt The prompt to send
   */
  public async sendPrompt(prompt: string): Promise<void> {
    try {
      // Check if Copilot Chat extension is installed
      const extension = vscode.extensions.getExtension('GitHub.copilot-chat');

      if (!extension) {
        throw new Error('GitHub Copilot Chat extension is not installed');
      }

      // Try to execute the Copilot Chat command
      await vscode.commands.executeCommand('github.copilot.chat.focus');

      // Since there's no direct API to send text to Copilot Chat,
      // we'll use the clipboard as a fallback
      await vscode.env.clipboard.writeText(prompt);

      vscode.window.showInformationMessage('Prompt ready for Copilot. Paste it into the Copilot Chat panel.');
    } catch (error) {
      Logger.error('Failed to send prompt to Copilot', error);
      throw new Error(`Failed to send prompt to Copilot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a response from GitHub Copilot.
   * @returns The response from the AI assistant
   */
  public async getResponse(): Promise<string> {
    try {
      // Since there's no direct API to get responses from Copilot Chat,
      // we'll use the clipboard as a fallback
      vscode.window.showInformationMessage('Copy the Copilot response to clipboard, then click "Capture Response"');

      // Ask the user to confirm when they've copied the response
      const confirmation = await vscode.window.showInformationMessage(
        'Have you copied the Copilot response to clipboard?',
        'Capture Response', 'Cancel'
      );

      if (confirmation !== 'Capture Response') {
        throw new Error('Response capture cancelled by user');
      }

      // Read the response from the clipboard
      const response = await vscode.env.clipboard.readText();

      if (!response) {
        throw new Error('No response found in clipboard');
      }

      return response;
    } catch (error) {
      Logger.error('Failed to get response from Copilot', error);
      throw new Error(`Failed to get response from Copilot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Adapter for Cursor AI integration.
 */
export class CursorAssistantAdapter implements AssistantAdapter {
  /**
   * Send a prompt to Cursor AI.
   * @param prompt The prompt to send
   */
  public async sendPrompt(prompt: string): Promise<void> {
    try {
      // Check if Cursor extension is installed
      const extension = vscode.extensions.getExtension('cursor.cursor');

      if (!extension) {
        throw new Error('Cursor extension is not installed');
      }

      // Try to execute the Cursor AI command
      await vscode.commands.executeCommand('cursor.newChat');

      // Since there's no direct API to send text to Cursor AI,
      // we'll use the clipboard as a fallback
      await vscode.env.clipboard.writeText(prompt);

      vscode.window.showInformationMessage('Prompt ready for Cursor AI. Paste it into the Cursor AI chat panel.');
    } catch (error) {
      Logger.error('Failed to send prompt to Cursor AI', error);
      throw new Error(`Failed to send prompt to Cursor AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a response from Cursor AI.
   * @returns The response from the AI assistant
   */
  public async getResponse(): Promise<string> {
    try {
      // Since there's no direct API to get responses from Cursor AI,
      // we'll use the clipboard as a fallback
      vscode.window.showInformationMessage('Copy the Cursor AI response to clipboard, then click "Capture Response"');

      // Ask the user to confirm when they've copied the response
      const confirmation = await vscode.window.showInformationMessage(
        'Have you copied the Cursor AI response to clipboard?',
        'Capture Response', 'Cancel'
      );

      if (confirmation !== 'Capture Response') {
        throw new Error('Response capture cancelled by user');
      }

      // Read the response from the clipboard
      const response = await vscode.env.clipboard.readText();

      if (!response) {
        throw new Error('No response found in clipboard');
      }

      return response;
    } catch (error) {
      Logger.error('Failed to get response from Cursor AI', error);
      throw new Error(`Failed to get response from Cursor AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
