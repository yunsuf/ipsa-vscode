import * as vscode from 'vscode';
import * as path from 'path';
import { PlanDocument, PlanDocumentManager, Iteration, Finding, PlanStep } from '../models';
import { MarkdownProcessor } from './markdownProcessor';
import { ConfigManager } from '../state';

/**
 * Implementation of the PlanDocumentManager interface.
 */
export class PlanDocumentManagerImpl implements PlanDocumentManager {
  private _markdownProcessor: MarkdownProcessor;
  private _workspaceRoot: string;
  private _ipsaRoot: string;
  private _plansRoot: string;
  private _activePlansRoot: string;
  private _archivedPlansRoot: string;
  private _templatesRoot: string;
  private _configManager: ConfigManager;
  private _useOrganizedFolders: boolean;

  /**
   * Gets the active plans directory path.
   */
  public get activePlansRoot(): string {
    return this._activePlansRoot;
  }

  /**
   * Gets the archived plans directory path.
   */
  public get archivedPlansRoot(): string {
    return this._archivedPlansRoot;
  }

  /**
   * Creates a new PlanDocumentManagerImpl.
   * @param workspaceRoot The root directory of the workspace
   */
  constructor(workspaceRoot: string) {
    this._markdownProcessor = new MarkdownProcessor();
    this._workspaceRoot = workspaceRoot;
    this._configManager = ConfigManager.getInstance();

    // Check if organized folder structure is enabled
    this._useOrganizedFolders = this._configManager.get<string>('plans.folderStructure', 'organized') === 'organized';

    // Set up IPSA directory structure
    this._ipsaRoot = path.join(this._workspaceRoot, '.ipsa');
    this._plansRoot = path.join(this._ipsaRoot, 'plans');
    this._activePlansRoot = path.join(this._plansRoot, 'active');
    this._archivedPlansRoot = path.join(this._plansRoot, 'archived');
    this._templatesRoot = path.join(this._plansRoot, 'templates');

    // Ensure directories exist if using organized folders
    if (this._useOrganizedFolders) {
      this._ensureDirectoriesExist();
    }
  }

  /**
   * Ensures that all required directories exist.
   * @private
   */
  private async _ensureDirectoriesExist(): Promise<void> {
    try {
      await this._ensureDirectoryExists(this._ipsaRoot);
      await this._ensureDirectoryExists(this._plansRoot);
      await this._ensureDirectoryExists(this._activePlansRoot);
      await this._ensureDirectoryExists(this._archivedPlansRoot);
      await this._ensureDirectoryExists(this._templatesRoot);
    } catch (error) {
      throw new Error(`Failed to create IPSA directories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensures that a directory exists, creating it if necessary.
   * @param dirPath The directory path
   * @private
   */
  private async _ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(dirPath);
      try {
        await vscode.workspace.fs.stat(uri);
      } catch {
        // Directory doesn't exist, create it
        await vscode.workspace.fs.createDirectory(uri);
      }
    } catch (error) {
      throw new Error(`Failed to create directory: ${dirPath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a new plan document.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  public async createPlanDocument(problemId: string): Promise<PlanDocument> {
    // Sanitize problem ID for file name
    const sanitizedId = this._sanitizeFileName(problemId);

    // Create file path based on configuration
    let filePath: string;
    if (this._useOrganizedFolders) {
      filePath = path.join(this._activePlansRoot, `${sanitizedId}.plan.md`);
    } else {
      filePath = path.join(this._workspaceRoot, `${sanitizedId}.plan.md`);
    }

    // Check if file already exists
    if (await this.fileExists(filePath)) {
      throw new Error(`Plan document already exists: ${filePath}`);
    }

    // Create initial plan document
    const planDoc: PlanDocument = {
      problemId,
      path: filePath,
      problemStatement: '',
      initialPlan: [],
      iterations: [],
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        version: '1.0'
      }
    };

    // Generate Markdown content
    const markdown = this._markdownProcessor.generateMarkdownFromPlanDocument(planDoc);

    // Write to file
    await this._writeFile(filePath, markdown);

    return planDoc;
  }

  /**
   * Loads an existing plan document.
   * @param path Path to the plan document
   * @returns The loaded plan document
   */
  public async loadPlanDocument(path: string): Promise<PlanDocument> {
    // Check if file exists at the provided path
    if (await this.fileExists(path)) {
      // Read file content
      const content = await this._readFile(path);

      // Parse Markdown to plan document
      return this._markdownProcessor.parseMarkdownToPlanDocument(content, path);
    }

    // If file doesn't exist at the provided path, try to find it in the organized folder structure
    if (this._useOrganizedFolders) {
      // Extract the filename from the path
      const fileName = path.split('/').pop() || '';

      // Check if the file exists in the active plans directory
      const activePath = require('path').join(this._activePlansRoot, fileName);
      if (await this.fileExists(activePath)) {
        // Read file content
        const content = await this._readFile(activePath);

        // Parse Markdown to plan document
        return this._markdownProcessor.parseMarkdownToPlanDocument(content, activePath);
      }

      // Check if the file exists in the archived plans directory
      const archivedPath = require('path').join(this._archivedPlansRoot, fileName);
      if (await this.fileExists(archivedPath)) {
        // Read file content
        const content = await this._readFile(archivedPath);

        // Parse Markdown to plan document
        return this._markdownProcessor.parseMarkdownToPlanDocument(content, archivedPath);
      }
    }

    // If we still haven't found the file, throw an error
    throw new Error(`Plan document not found: ${path}`);
  }

  /**
   * Updates a plan document with new data.
   * @param document The document to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  public async updatePlanDocument(
    document: PlanDocument,
    updates: Partial<PlanDocument>
  ): Promise<PlanDocument> {
    // Create updated document
    const updatedDoc: PlanDocument = {
      ...document,
      ...updates,
      metadata: {
        ...document.metadata,
        lastModified: new Date()
      }
    };

    // Generate Markdown content
    const markdown = this._markdownProcessor.generateMarkdownFromPlanDocument(updatedDoc);

    // Write to file
    await this._writeFile(updatedDoc.path, markdown);

    return updatedDoc;
  }

  /**
   * Adds an iteration to a plan document.
   * @param document The document to update
   * @param iteration The iteration to add
   * @returns The updated document
   */
  public async addIteration(
    document: PlanDocument,
    iteration: Iteration
  ): Promise<PlanDocument> {
    // Check if iteration with same number already exists
    const existingIndex = document.iterations.findIndex(i => i.number === iteration.number);

    if (existingIndex >= 0) {
      // Replace existing iteration
      document.iterations[existingIndex] = iteration;
    } else {
      // Add new iteration
      document.iterations.push(iteration);
    }

    // Sort iterations by number
    document.iterations.sort((a, b) => a.number - b.number);

    // Update document
    return this.updatePlanDocument(document, {
      iterations: document.iterations
    });
  }

  /**
   * Adds a finding to an iteration.
   * @param document The document to update
   * @param iterationNumber The iteration number
   * @param finding The finding to add
   * @returns The updated document
   */
  public async addFinding(
    document: PlanDocument,
    iterationNumber: number,
    finding: Finding
  ): Promise<PlanDocument> {
    // Find the iteration
    const iteration = document.iterations.find(i => i.number === iterationNumber);

    if (!iteration) {
      throw new Error(`Iteration ${iterationNumber} not found`);
    }

    // Add finding to iteration
    iteration.findings.push(finding);

    // Update document
    return this.updatePlanDocument(document, {
      iterations: document.iterations
    });
  }

  /**
   * Updates a plan step.
   * @param document The document to update
   * @param stepId The ID of the step to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  public async updatePlanStep(
    document: PlanDocument,
    stepId: string,
    updates: Partial<PlanStep>
  ): Promise<PlanDocument> {
    // Find the step
    const stepIndex = document.initialPlan.findIndex(s => s.id === stepId);

    if (stepIndex === -1) {
      throw new Error(`Step ${stepId} not found`);
    }

    // Update step
    document.initialPlan[stepIndex] = {
      ...document.initialPlan[stepIndex],
      ...updates
    };

    // Update document
    return this.updatePlanDocument(document, {
      initialPlan: document.initialPlan
    });
  }

  /**
   * Creates a template plan document with default structure.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  public async createTemplatePlanDocument(problemId: string): Promise<PlanDocument> {
    // Create basic plan document
    const planDoc = await this.createPlanDocument(problemId);

    // Add template problem statement
    planDoc.problemStatement = 'Describe the problem you are trying to solve here.';

    // Add template initial plan
    planDoc.initialPlan = [
      {
        id: 'step_1',
        description: 'Define the problem scope and requirements',
        status: 'pending',
        order: 1
      },
      {
        id: 'step_2',
        description: 'Research potential solutions',
        status: 'pending',
        order: 2
      },
      {
        id: 'step_3',
        description: 'Design the solution architecture',
        status: 'pending',
        order: 3
      },
      {
        id: 'step_4',
        description: 'Implement the solution',
        status: 'pending',
        order: 4
      },
      {
        id: 'step_5',
        description: 'Test and validate the solution',
        status: 'pending',
        order: 5
      }
    ];

    // Update document
    return this.updatePlanDocument(planDoc, {
      problemStatement: planDoc.problemStatement,
      initialPlan: planDoc.initialPlan
    });
  }

  /**
   * Sanitizes a string for use as a file name.
   * @param name The string to sanitize
   * @returns The sanitized string
   */
  private _sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Checks if a file exists.
   * @param filePath The path to the file
   * @returns True if the file exists, false otherwise
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch (error) {
      return false;
    }
  }



  /**
   * Reads a file.
   * @param filePath The path to the file
   * @returns The file content
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
   * Writes to a file.
   * @param filePath The path to the file
   * @param content The content to write
   */
  private async _writeFile(filePath: string, content: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(filePath);
      const data = Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(uri, data);
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Archives a plan document by moving it to the archived directory.
   * @param document The document to archive
   * @returns The updated document with the new path
   */
  public async archivePlanDocument(document: PlanDocument): Promise<PlanDocument> {
    if (!this._useOrganizedFolders) {
      throw new Error('Archiving is only available when using organized folder structure');
    }

    const fileName = path.basename(document.path);
    const newPath = path.join(this._archivedPlansRoot, fileName);

    // Read the current file
    const content = await this._readFile(document.path);

    // Write to the new location
    await this._writeFile(newPath, content);

    // Delete the original file
    await this._deleteFile(document.path);

    // Update the document path
    const updatedDoc: PlanDocument = {
      ...document,
      path: newPath,
      metadata: {
        ...document.metadata,
        lastModified: new Date()
      }
    };

    return updatedDoc;
  }

  /**
   * Unarchives a plan document by moving it from the archived directory to the active directory.
   * @param document The document to unarchive
   * @returns The updated document with the new path
   */
  public async unarchivePlanDocument(document: PlanDocument): Promise<PlanDocument> {
    if (!this._useOrganizedFolders) {
      throw new Error('Unarchiving is only available when using organized folder structure');
    }

    const fileName = path.basename(document.path);
    const newPath = path.join(this._activePlansRoot, fileName);

    // Read the current file
    const content = await this._readFile(document.path);

    // Write to the new location
    await this._writeFile(newPath, content);

    // Delete the original file
    await this._deleteFile(document.path);

    // Update the document path
    const updatedDoc: PlanDocument = {
      ...document,
      path: newPath,
      metadata: {
        ...document.metadata,
        lastModified: new Date()
      }
    };

    return updatedDoc;
  }

  /**
   * Lists all plan documents in the active directory.
   * @returns Array of plan document paths
   */
  public async listActivePlanDocuments(): Promise<string[]> {
    if (!this._useOrganizedFolders) {
      // If not using organized folders, list all plan documents in the workspace root
      return this._listPlanDocumentsInDirectory(this._workspaceRoot);
    }
    return this._listPlanDocumentsInDirectory(this._activePlansRoot);
  }

  /**
   * Lists all plan documents in the archived directory.
   * @returns Array of plan document paths
   */
  public async listArchivedPlanDocuments(): Promise<string[]> {
    if (!this._useOrganizedFolders) {
      // If not using organized folders, return an empty array
      return [];
    }
    return this._listPlanDocumentsInDirectory(this._archivedPlansRoot);
  }

  /**
   * Lists all plan documents in a directory.
   * @param directoryPath The directory path
   * @returns Array of plan document paths
   * @private
   */
  private async _listPlanDocumentsInDirectory(directoryPath: string): Promise<string[]> {
    try {
      const uri = vscode.Uri.file(directoryPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);

      // Filter for .plan.md files
      return entries
        .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.plan.md'))
        .map(([name]) => path.join(directoryPath, name));
    } catch (error) {
      throw new Error(`Failed to list plan documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deletes a file.
   * @param filePath The path to the file
   * @private
   */
  private async _deleteFile(filePath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.delete(uri);
    } catch (error) {
      throw new Error(`Failed to delete file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Migrates existing plan documents from the workspace root to the organized folder structure.
   * @returns Number of migrated documents
   */
  public async migratePlanDocuments(): Promise<number> {
    if (!this._useOrganizedFolders) {
      throw new Error('Migration is only available when using organized folder structure');
    }

    try {
      // Find all .plan.md files in the workspace root
      const workspaceUri = vscode.Uri.file(this._workspaceRoot);
      const entries = await vscode.workspace.fs.readDirectory(workspaceUri);

      // Filter for .plan.md files
      const planFiles = entries
        .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.plan.md'))
        .map(([name]) => path.join(this._workspaceRoot, name));

      let migratedCount = 0;

      // Migrate each file
      for (const filePath of planFiles) {
        const fileName = path.basename(filePath);
        const newPath = path.join(this._activePlansRoot, fileName);

        // Read the file
        const content = await this._readFile(filePath);

        // Write to the new location
        await this._writeFile(newPath, content);

        // Delete the original file
        await this._deleteFile(filePath);

        migratedCount++;
      }

      return migratedCount;
    } catch (error) {
      throw new Error(`Failed to migrate plan documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
