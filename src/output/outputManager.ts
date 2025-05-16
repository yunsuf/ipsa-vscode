import * as vscode from 'vscode';
import * as path from 'path';
import { OutputManager, CodeSnippet, CodeSnippetType, ApplySnippetOptions, DocumentationOptions, DocumentationFormat } from '../models/output';
import { Finding } from '../models/finding';
import { PlanDocument } from '../models/planDocument';
import { Logger } from '../logger';

/**
 * Implementation of the OutputManager interface.
 */
export class OutputManagerImpl implements OutputManager {
  private _workspaceRoot: string;
  private _snippetsCache: Map<string, CodeSnippet[]>;

  /**
   * Creates a new OutputManagerImpl.
   * @param workspaceRoot The workspace root path
   */
  constructor(workspaceRoot: string) {
    this._workspaceRoot = workspaceRoot;
    this._snippetsCache = new Map<string, CodeSnippet[]>();
  }

  /**
   * Extract code snippets from a finding.
   * @param finding The finding to extract snippets from
   * @returns Array of extracted code snippets
   */
  public async extractCodeSnippets(finding: Finding): Promise<CodeSnippet[]> {
    try {
      // Only extract snippets from code findings
      if (finding.type !== 'code') {
        return [];
      }

      // Get the language from the finding metadata
      const language = finding.metadata?.language || 'plaintext';

      // Create a snippet ID
      const snippetId = `snippet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create the code snippet
      const snippet: CodeSnippet = {
        id: snippetId,
        content: finding.content,
        language,
        type: this._determineSnippetType(finding.content, language),
        findingId: finding.id,
        iterationNumber: 0, // Will be set by the caller if needed
        timestamp: new Date()
      };

      // Try to determine a suggested file path
      snippet.suggestedFilePath = this._suggestFilePath(snippet);

      // Cache the snippet
      this._cacheSnippet(snippet);

      return [snippet];
    } catch (error) {
      Logger.error('Failed to extract code snippets', error);
      throw new Error(`Failed to extract code snippets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply a code snippet to the workspace.
   * @param snippet The snippet to apply
   * @param options Options for applying the snippet
   * @returns The file path where the snippet was applied
   */
  public async applyCodeSnippet(snippet: CodeSnippet, options?: ApplySnippetOptions): Promise<string> {
    try {
      // Determine the file path
      let filePath = options?.filePath || snippet.suggestedFilePath;

      // If no file path is provided, prompt the user
      if (!filePath) {
        filePath = await this._promptForFilePath(snippet);
        if (!filePath) {
          throw new Error('No file path provided');
        }
      }

      // Ensure the file path is absolute
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(this._workspaceRoot, filePath);
      }

      // Check if the file exists
      const fileExists = await this._fileExists(filePath);

      // Create the file if it doesn't exist and createFile is true
      if (!fileExists && options?.createFile) {
        await this._createFile(filePath);
      } else if (!fileExists) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Read the file content
      let content = await this._readFile(filePath);

      // Apply the snippet
      if (options?.replace && options.position) {
        // Replace content at the specified position
        const lines = content.split('\n');
        const line = lines[options.position.line];
        const before = line.substring(0, options.position.character);
        const after = line.substring(options.position.character + (options.replaceContent?.length || 0));
        lines[options.position.line] = before + snippet.content + after;
        content = lines.join('\n');
      } else if (options?.position) {
        // Insert at the specified position
        const lines = content.split('\n');
        const line = lines[options.position.line];
        const before = line.substring(0, options.position.character);
        const after = line.substring(options.position.character);
        lines[options.position.line] = before + snippet.content + after;
        content = lines.join('\n');
      } else {
        // Append to the end of the file
        content += '\n\n' + snippet.content;
      }

      // Write the file
      await this._writeFile(filePath, content);

      // Update the snippet's suggested file path
      snippet.suggestedFilePath = filePath;

      // Cache the updated snippet
      this._cacheSnippet(snippet);

      return filePath;
    } catch (error) {
      Logger.error('Failed to apply code snippet', error);
      throw new Error(`Failed to apply code snippet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate documentation from a plan document.
   * @param document The plan document to generate documentation from
   * @param options Options for generating documentation
   * @returns The path to the generated documentation
   */
  public async generateDocumentation(document: PlanDocument, options?: DocumentationOptions): Promise<string> {
    try {
      // Default options
      const docOptions: DocumentationOptions = {
        format: options?.format || 'markdown',
        includeCodeSnippets: options?.includeCodeSnippets !== false,
        includeFindings: options?.includeFindings !== false,
        includeMetrics: options?.includeMetrics !== false,
        title: options?.title || `${document.problemId} Documentation`,
        description: options?.description || 'Generated documentation'
      };

      // Generate the documentation content
      let content = '';

      // Add title
      content += `# ${docOptions.title}\n\n`;

      // Add description
      content += `${docOptions.description}\n\n`;

      // Add problem statement
      content += `## Problem Statement\n\n${document.problemStatement}\n\n`;

      // Add initial plan
      content += `## Initial Plan\n\n`;
      document.initialPlan.forEach((step, index) => {
        const status = step.status === 'completed' ? '✅' : step.status === 'skipped' ? '⏭️' : '⏳';
        content += `${index + 1}. ${status} ${step.description}\n`;
      });
      content += '\n';

      // Add iterations and findings if includeFindings is true
      if (docOptions.includeFindings) {
        content += `## Iterations\n\n`;
        document.iterations.forEach(iteration => {
          content += `### Iteration ${iteration.number}\n\n`;

          // Add findings
          if (iteration.findings && iteration.findings.length > 0) {
            content += `#### Findings\n\n`;
            iteration.findings.forEach(finding => {
              content += `##### ${this._capitalizeFirstLetter(finding.type)}\n\n`;

              if (finding.type === 'code' && finding.metadata?.language) {
                content += `\`\`\`${finding.metadata.language}\n${finding.content}\n\`\`\`\n\n`;
              } else {
                content += `${finding.content}\n\n`;
              }
            });
          }
        });
      }

      // Add code snippets if includeCodeSnippets is true
      if (docOptions.includeCodeSnippets) {
        const snippets = await this.getCodeSnippets(document);
        if (snippets.length > 0) {
          content += `## Code Snippets\n\n`;
          snippets.forEach(snippet => {
            content += `### ${snippet.type} (${snippet.language})\n\n`;
            content += `\`\`\`${snippet.language}\n${snippet.content}\n\`\`\`\n\n`;
            if (snippet.suggestedFilePath) {
              content += `Suggested file path: \`${snippet.suggestedFilePath}\`\n\n`;
            }
          });
        }
      }

      // Generate file path
      const fileName = `${document.problemId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-documentation.${this._getFileExtension(docOptions.format)}`;
      const filePath = path.join(this._workspaceRoot, fileName);

      // Write the file
      await this._writeFile(filePath, content);

      return filePath;
    } catch (error) {
      Logger.error('Failed to generate documentation', error);
      throw new Error(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export a plan document to a file.
   * @param document The plan document to export
   * @param format The format to export to
   * @param filePath The file path to export to
   * @returns The path to the exported file
   */
  public async exportPlanDocument(document: PlanDocument, format: DocumentationFormat, filePath?: string): Promise<string> {
    try {
      // Generate file path if not provided
      if (!filePath) {
        const fileName = `${document.problemId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.${this._getFileExtension(format)}`;
        filePath = path.join(this._workspaceRoot, fileName);
      }

      // Ensure the file path is absolute
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(this._workspaceRoot, filePath);
      }

      // Generate the content based on the format
      let content = '';
      switch (format) {
        case 'markdown':
          content = await this._exportToMarkdown(document);
          break;
        case 'html':
          content = await this._exportToHtml(document);
          break;
        case 'json':
          content = await this._exportToJson(document);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Write the file
      await this._writeFile(filePath, content);

      return filePath;
    } catch (error) {
      Logger.error('Failed to export plan document', error);
      throw new Error(`Failed to export plan document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all code snippets extracted from a plan document.
   * @param document The plan document to get snippets from
   * @returns Array of code snippets
   */
  public async getCodeSnippets(document: PlanDocument): Promise<CodeSnippet[]> {
    try {
      // Check if snippets are cached
      if (this._snippetsCache.has(document.path)) {
        return this._snippetsCache.get(document.path) || [];
      }

      // Extract snippets from all code findings
      const snippets: CodeSnippet[] = [];
      for (const iteration of document.iterations) {
        for (const finding of iteration.findings) {
          if (finding.type === 'code') {
            // Extract snippets with iteration number
            const extractedSnippets = await this.extractCodeSnippets(finding);

            // Add iteration number to each snippet
            for (const snippet of extractedSnippets) {
              snippet.iterationNumber = iteration.number;
            }

            snippets.push(...extractedSnippets);
          }
        }
      }

      // Cache the snippets
      this._snippetsCache.set(document.path, snippets);

      return snippets;
    } catch (error) {
      Logger.error('Failed to get code snippets', error);
      throw new Error(`Failed to get code snippets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save a code snippet to the workspace.
   * @param snippet The snippet to save
   * @param filePath The file path to save to
   * @returns The file path where the snippet was saved
   */
  public async saveCodeSnippet(snippet: CodeSnippet, filePath: string): Promise<string> {
    try {
      // Ensure the file path is absolute
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(this._workspaceRoot, filePath);
      }

      // Create the directory if it doesn't exist
      const directory = path.dirname(filePath);
      await this._ensureDirectoryExists(directory);

      // Write the file
      await this._writeFile(filePath, snippet.content);

      // Update the snippet's suggested file path
      snippet.suggestedFilePath = filePath;

      // Cache the updated snippet
      this._cacheSnippet(snippet);

      return filePath;
    } catch (error) {
      Logger.error('Failed to save code snippet', error);
      throw new Error(`Failed to save code snippet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine the type of a code snippet.
   * @param content The snippet content
   * @param language The programming language
   * @returns The snippet type
   * @private
   */
  private _determineSnippetType(content: string, language: string): CodeSnippetType {
    // Simple heuristics to determine the snippet type
    const trimmedContent = content.trim();

    if (language === 'typescript' || language === 'javascript') {
      if (trimmedContent.startsWith('import ') || trimmedContent.startsWith('const ') && trimmedContent.includes(' from ')) {
        return 'import';
      } else if (trimmedContent.startsWith('function ') || trimmedContent.startsWith('const ') && trimmedContent.includes(' = function')) {
        return 'function';
      } else if (trimmedContent.startsWith('class ')) {
        return 'class';
      } else if (trimmedContent.includes('() {') || trimmedContent.includes('() =>')) {
        return 'method';
      } else if (trimmedContent.startsWith('const ') || trimmedContent.startsWith('let ') || trimmedContent.startsWith('var ')) {
        return 'variable';
      }
    } else if (language === 'python') {
      if (trimmedContent.startsWith('import ') || trimmedContent.startsWith('from ')) {
        return 'import';
      } else if (trimmedContent.startsWith('def ')) {
        return 'function';
      } else if (trimmedContent.startsWith('class ')) {
        return 'class';
      }
    } else if (language === 'java' || language === 'csharp') {
      if (trimmedContent.startsWith('import ') || trimmedContent.startsWith('using ')) {
        return 'import';
      } else if (trimmedContent.includes('class ')) {
        return 'class';
      } else if (trimmedContent.includes('void ') || trimmedContent.includes('public ') || trimmedContent.includes('private ')) {
        return 'method';
      }
    }

    return 'other';
  }

  /**
   * Suggest a file path for a code snippet.
   * @param snippet The code snippet
   * @returns The suggested file path
   * @private
   */
  private _suggestFilePath(snippet: CodeSnippet): string | undefined {
    // Try to determine a file name based on the snippet content and type
    let fileName: string | undefined;

    const trimmedContent = snippet.content.trim();

    if (snippet.type === 'class') {
      // Extract class name
      const match = trimmedContent.match(/class\s+(\w+)/);
      if (match && match[1]) {
        fileName = match[1];
      }
    } else if (snippet.type === 'function') {
      // Extract function name
      const match = trimmedContent.match(/function\s+(\w+)/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    if (!fileName) {
      // Use a generic name based on the snippet type and a timestamp
      fileName = `${snippet.type}_${Date.now()}`;
    }

    // Add appropriate extension based on language
    let extension = '.txt';
    switch (snippet.language) {
      case 'typescript':
        extension = '.ts';
        break;
      case 'javascript':
        extension = '.js';
        break;
      case 'python':
        extension = '.py';
        break;
      case 'java':
        extension = '.java';
        break;
      case 'csharp':
        extension = '.cs';
        break;
      case 'html':
        extension = '.html';
        break;
      case 'css':
        extension = '.css';
        break;
      case 'json':
        extension = '.json';
        break;
    }

    return `${fileName}${extension}`;
  }

  /**
   * Cache a code snippet.
   * @param snippet The snippet to cache
   * @private
   */
  private _cacheSnippet(snippet: CodeSnippet): void {
    // Get the document path from the snippet
    const documentPath = snippet.suggestedFilePath;

    if (!documentPath) {
      return;
    }

    // Get the existing snippets for this document
    const snippets = this._snippetsCache.get(documentPath) || [];

    // Check if the snippet already exists
    const existingIndex = snippets.findIndex(s => s.id === snippet.id);

    if (existingIndex >= 0) {
      // Update the existing snippet
      snippets[existingIndex] = snippet;
    } else {
      // Add the new snippet
      snippets.push(snippet);
    }

    // Update the cache
    this._snippetsCache.set(documentPath, snippets);
  }

  /**
   * Prompt the user for a file path.
   * @param snippet The code snippet
   * @returns The selected file path
   * @private
   */
  private async _promptForFilePath(snippet: CodeSnippet): Promise<string | undefined> {
    // Create a suggested file name
    const suggestedFileName = snippet.suggestedFilePath || `snippet.${this._getFileExtensionForLanguage(snippet.language)}`;

    // Show a file save dialog
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(this._workspaceRoot, suggestedFileName)),
      filters: {
        'All Files': ['*']
      }
    });

    return uri?.fsPath;
  }

  /**
   * Get the file extension for a language.
   * @param language The programming language
   * @returns The file extension
   * @private
   */
  private _getFileExtensionForLanguage(language: string): string {
    switch (language) {
      case 'typescript':
        return 'ts';
      case 'javascript':
        return 'js';
      case 'python':
        return 'py';
      case 'java':
        return 'java';
      case 'csharp':
        return 'cs';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'txt';
    }
  }

  /**
   * Get the file extension for a documentation format.
   * @param format The documentation format
   * @returns The file extension
   * @private
   */
  private _getFileExtension(format: DocumentationFormat): string {
    switch (format) {
      case 'markdown':
        return 'md';
      case 'html':
        return 'html';
      case 'pdf':
        return 'pdf';
      case 'json':
        return 'json';
      default:
        return 'txt';
    }
  }

  /**
   * Export a plan document to Markdown.
   * @param document The plan document to export
   * @returns The Markdown content
   * @private
   */
  private async _exportToMarkdown(document: PlanDocument): Promise<string> {
    let content = '';

    // Add title
    content += `# ${document.problemId}\n\n`;

    // Add problem statement
    content += `## Problem Statement\n\n${document.problemStatement}\n\n`;

    // Add initial plan
    content += `## Initial Plan\n\n`;
    document.initialPlan.forEach((step, index) => {
      const status = step.status === 'completed' ? '✅' : step.status === 'skipped' ? '⏭️' : '⏳';
      content += `${index + 1}. ${status} ${step.description}\n`;
    });
    content += '\n';

    // Add iterations
    content += `## Iterations\n\n`;
    document.iterations.forEach(iteration => {
      content += `### Iteration ${iteration.number}\n\n`;

      // Add prompt
      if (iteration.prompt) {
        content += `#### Prompt\n\n\`\`\`\n${iteration.prompt}\n\`\`\`\n\n`;
      }

      // Add response
      if (iteration.response) {
        content += `#### Response\n\n\`\`\`\n${iteration.response}\n\`\`\`\n\n`;
      }

      // Add findings
      if (iteration.findings && iteration.findings.length > 0) {
        content += `#### Findings\n\n`;
        iteration.findings.forEach(finding => {
          content += `##### ${this._capitalizeFirstLetter(finding.type)}\n\n`;

          if (finding.type === 'code' && finding.metadata?.language) {
            content += `\`\`\`${finding.metadata.language}\n${finding.content}\n\`\`\`\n\n`;
          } else {
            content += `${finding.content}\n\n`;
          }
        });
      }
    });

    // Add metadata
    content += `## Metadata\n\n`;
    content += `- Created: ${document.metadata.created.toISOString()}\n`;
    content += `- Last Modified: ${document.metadata.lastModified.toISOString()}\n`;
    content += `- Version: ${document.metadata.version}\n\n`;

    return content;
  }

  /**
   * Export a plan document to HTML.
   * @param document The plan document to export
   * @returns The HTML content
   * @private
   */
  private async _exportToHtml(document: PlanDocument): Promise<string> {
    // Convert Markdown to HTML
    const markdown = await this._exportToMarkdown(document);

    // Simple HTML wrapper
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.problemId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code {
      font-family: 'Courier New', Courier, monospace;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
  </style>
</head>
<body>
  ${this._markdownToHtml(markdown)}
</body>
</html>`;
  }

  /**
   * Export a plan document to JSON.
   * @param document The plan document to export
   * @returns The JSON content
   * @private
   */
  private async _exportToJson(document: PlanDocument): Promise<string> {
    // Create a copy of the document to avoid modifying the original
    const documentCopy = JSON.parse(JSON.stringify(document));

    // Convert dates to ISO strings
    documentCopy.metadata.created = document.metadata.created.toISOString();
    documentCopy.metadata.lastModified = document.metadata.lastModified.toISOString();

    document.iterations.forEach((iteration, i) => {
      if (iteration.timestamp) {
        documentCopy.iterations[i].timestamp = iteration.timestamp.toISOString();
      }
    });

    return JSON.stringify(documentCopy, null, 2);
  }

  /**
   * Convert Markdown to HTML.
   * @param markdown The Markdown content
   * @returns The HTML content
   * @private
   */
  private _markdownToHtml(markdown: string): string {
    // Very simple Markdown to HTML conversion
    // In a real implementation, you would use a proper Markdown parser

    let html = markdown;

    // Headers
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');

    // Lists
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

    // Code blocks
    html = html.replace(/```(.+)\n([\s\S]+?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/```\n([\s\S]+?)\n```/g, '<pre><code>$1</code></pre>');

    // Paragraphs
    html = html.replace(/\n\n([^<])/g, '\n\n<p>$1');
    html = html.replace(/([^>])\n\n/g, '$1</p>\n\n');

    return html;
  }

  /**
   * Capitalize the first letter of a string.
   * @param str The string to capitalize
   * @returns The capitalized string
   * @private
   */
  private _capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Check if a file exists.
   * @param filePath The path to the file
   * @returns True if the file exists, false otherwise
   * @private
   */
  private async _fileExists(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a file.
   * @param filePath The path to the file
   * @private
   */
  private async _createFile(filePath: string): Promise<void> {
    try {
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      await this._ensureDirectoryExists(directory);

      // Create an empty file
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(''));
    } catch (error) {
      throw new Error(`Failed to create file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read a file.
   * @param filePath The path to the file
   * @returns The file content
   * @private
   */
  private async _readFile(filePath: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const data = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(data).toString('utf8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write a file.
   * @param filePath The path to the file
   * @param content The content to write
   * @private
   */
  private async _writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      await this._ensureDirectoryExists(directory);

      // Write the file
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure a directory exists.
   * @param directory The directory path
   * @private
   */
  private async _ensureDirectoryExists(directory: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(directory);
      await vscode.workspace.fs.createDirectory(uri);
    } catch (error) {
      throw new Error(`Failed to create directory: ${directory} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}