import * as vscode from 'vscode';
import * as path from 'path';
import { PlanDocument, PlanDocumentManager, Iteration, Finding, PlanStep } from '../models';
import { MarkdownProcessor } from './markdownProcessor';

/**
 * Implementation of the PlanDocumentManager interface.
 */
export class PlanDocumentManagerImpl implements PlanDocumentManager {
  private _markdownProcessor: MarkdownProcessor;
  private _workspaceRoot: string;

  /**
   * Creates a new PlanDocumentManagerImpl.
   * @param workspaceRoot The root directory of the workspace
   */
  constructor(workspaceRoot: string) {
    this._markdownProcessor = new MarkdownProcessor();
    this._workspaceRoot = workspaceRoot;
  }

  /**
   * Creates a new plan document.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  public async createPlanDocument(problemId: string): Promise<PlanDocument> {
    // Sanitize problem ID for file name
    const sanitizedId = this._sanitizeFileName(problemId);

    // Create file path
    const filePath = path.join(this._workspaceRoot, `${sanitizedId}.plan.md`);

    // Check if file already exists
    if (await this._fileExists(filePath)) {
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
    // Check if file exists
    if (!await this._fileExists(path)) {
      throw new Error(`Plan document not found: ${path}`);
    }

    // Read file content
    const content = await this._readFile(path);

    // Parse Markdown to plan document
    return this._markdownProcessor.parseMarkdownToPlanDocument(content, path);
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
}
