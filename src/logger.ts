import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Simple logger for debugging extension issues
 */
export class Logger {
  private static logFilePath: string;
  private static initialized = false;

  /**
   * Initialize the logger
   * @param context The extension context
   */
  public static initialize(context: vscode.ExtensionContext): void {
    if (this.initialized) {
      return;
    }

    try {
      // Create logs directory in the extension's global storage path
      const logsDir = path.join(context.globalStoragePath, 'logs');

      // Ensure the directory exists
      try {
        if (!fs.existsSync(context.globalStoragePath)) {
          fs.mkdirSync(context.globalStoragePath, { recursive: true });
        }

        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
      } catch (err) {
        console.error('Failed to create logs directory:', err);
        // Continue without file logging
      }

      // Create log file with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      this.logFilePath = path.join(logsDir, `ipsa-${timestamp}.log`);

      // Write initial log entry
      try {
        fs.writeFileSync(this.logFilePath, `[${new Date().toISOString()}] Logger initialized\n`);
      } catch (err) {
        console.error('Failed to write to log file:', err);
        this.logFilePath = ''; // Disable file logging
      }
    } catch (err) {
      console.error('Logger initialization failed:', err);
      this.logFilePath = ''; // Disable file logging
    }

    this.initialized = true;
    console.log('IPSA Logger initialized');
  }

  /**
   * Log a message
   * @param message The message to log
   */
  public static log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Log to console
    console.log(message);

    // Log to file if initialized
    if (this.initialized && this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logMessage);
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  /**
   * Log an error
   * @param message The error message
   * @param error The error object
   */
  public static error(message: string, error?: any): void {
    const errorMessage = error ? `${message}: ${error instanceof Error ? error.stack : JSON.stringify(error)}` : message;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${errorMessage}\n`;

    // Log to console
    console.error(errorMessage);

    // Log to file if initialized
    if (this.initialized && this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logMessage);
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }
}
