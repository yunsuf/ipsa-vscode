import { Finding } from './finding';
import { PlanDocument } from './planDocument';

/**
 * Type of code snippet.
 */
export type CodeSnippetType = 'function' | 'class' | 'method' | 'variable' | 'import' | 'other';

/**
 * Represents a code snippet extracted from a finding.
 */
export interface CodeSnippet {
  /**
   * Unique identifier for the snippet.
   */
  id: string;

  /**
   * The content of the code snippet.
   */
  content: string;

  /**
   * The programming language of the snippet.
   */
  language: string;

  /**
   * The type of code snippet.
   */
  type: CodeSnippetType;

  /**
   * The finding ID this snippet was extracted from.
   */
  findingId: string;

  /**
   * The iteration number this snippet was extracted from.
   */
  iterationNumber: number;

  /**
   * Suggested file path for the snippet.
   */
  suggestedFilePath?: string;

  /**
   * Timestamp when the snippet was created.
   */
  timestamp: Date;
}

/**
 * Options for applying a code snippet to the workspace.
 */
export interface ApplySnippetOptions {
  /**
   * The file path to apply the snippet to.
   * If not provided, will use the suggested file path or prompt the user.
   */
  filePath?: string;

  /**
   * The position in the file to insert the snippet.
   * If not provided, will append to the end of the file or prompt the user.
   */
  position?: {
    line: number;
    character: number;
  };

  /**
   * Whether to create the file if it doesn't exist.
   */
  createFile?: boolean;

  /**
   * Whether to replace existing content.
   * If true and position is provided, will replace content at the position.
   */
  replace?: boolean;

  /**
   * The content to replace if replace is true.
   */
  replaceContent?: string;
}

/**
 * Format for exporting documentation.
 */
export type DocumentationFormat = 'markdown' | 'html' | 'pdf' | 'json';

/**
 * Options for generating documentation.
 */
export interface DocumentationOptions {
  /**
   * The format of the documentation.
   */
  format: DocumentationFormat;

  /**
   * Whether to include code snippets in the documentation.
   */
  includeCodeSnippets?: boolean;

  /**
   * Whether to include findings in the documentation.
   */
  includeFindings?: boolean;

  /**
   * Whether to include metrics in the documentation.
   */
  includeMetrics?: boolean;

  /**
   * The title of the documentation.
   */
  title?: string;

  /**
   * The description of the documentation.
   */
  description?: string;
}

/**
 * Manager for output operations.
 */
export interface OutputManager {
  /**
   * Extract code snippets from a finding.
   * @param finding The finding to extract snippets from
   * @returns Array of extracted code snippets
   */
  extractCodeSnippets(finding: Finding): Promise<CodeSnippet[]>;

  /**
   * Apply a code snippet to the workspace.
   * @param snippet The snippet to apply
   * @param options Options for applying the snippet
   * @returns The file path where the snippet was applied
   */
  applyCodeSnippet(snippet: CodeSnippet, options?: ApplySnippetOptions): Promise<string>;

  /**
   * Generate documentation from a plan document.
   * @param document The plan document to generate documentation from
   * @param options Options for generating documentation
   * @returns The path to the generated documentation
   */
  generateDocumentation(document: PlanDocument, options?: DocumentationOptions): Promise<string>;

  /**
   * Export a plan document to a file.
   * @param document The plan document to export
   * @param format The format to export to
   * @param filePath The file path to export to
   * @returns The path to the exported file
   */
  exportPlanDocument(document: PlanDocument, format: DocumentationFormat, filePath?: string): Promise<string>;

  /**
   * Get all code snippets extracted from a plan document.
   * @param document The plan document to get snippets from
   * @returns Array of code snippets
   */
  getCodeSnippets(document: PlanDocument): Promise<CodeSnippet[]>;

  /**
   * Save a code snippet to the workspace.
   * @param snippet The snippet to save
   * @param filePath The file path to save to
   * @returns The file path where the snippet was saved
   */
  saveCodeSnippet(snippet: CodeSnippet, filePath: string): Promise<string>;
}
