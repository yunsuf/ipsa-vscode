import { Finding } from './finding';

/**
 * Represents a step in the problem-solving plan.
 */
export interface PlanStep {
  /**
   * Unique identifier for the step.
   */
  id: string;

  /**
   * Description of the step.
   */
  description: string;

  /**
   * Current status of the step.
   */
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'done';

  /**
   * Order of the step in the plan.
   */
  order: number;
}

/**
 * Represents an iteration in the problem-solving process.
 */
export interface Iteration {
  /**
   * Iteration number.
   */
  number: number;

  /**
   * ID of the step this iteration is associated with.
   */
  stepId?: string;

  /**
   * The prompt sent to the AI assistant.
   */
  prompt: string;

  /**
   * The response received from the AI assistant.
   */
  response: string;

  /**
   * Findings extracted from the response.
   */
  findings: Finding[];

  /**
   * Timestamp when the iteration was created.
   */
  timestamp?: Date;
}

/**
 * Represents the plan document for a problem-solving session.
 */
export interface PlanDocument {
  /**
   * Identifier for the problem being solved.
   */
  problemId: string;

  /**
   * Path to the plan document file.
   */
  path: string;

  /**
   * Description of the problem.
   */
  problemStatement: string;

  /**
   * The initial plan steps.
   */
  initialPlan: PlanStep[];

  /**
   * The iterations performed during the problem-solving process.
   */
  iterations: Iteration[];

  /**
   * Metadata about the plan document.
   */
  metadata: {
    /**
     * Timestamp when the document was created.
     */
    created: Date;

    /**
     * Timestamp when the document was last modified.
     */
    lastModified: Date;

    /**
     * Version of the document format.
     */
    version: string;
  };
}

/**
 * Manager for plan document operations.
 */
export interface PlanDocumentManager {
  /**
   * Create a new plan document.
   * @param problemId Identifier for the problem
   * @returns The created plan document
   */
  createPlanDocument(problemId: string): Promise<PlanDocument>;

  /**
   * Load an existing plan document.
   * @param path Path to the plan document
   * @returns The loaded plan document
   */
  loadPlanDocument(path: string): Promise<PlanDocument>;

  /**
   * Update a plan document with new data.
   * @param document The document to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  updatePlanDocument(document: PlanDocument, updates: Partial<PlanDocument>): Promise<PlanDocument>;

  /**
   * Add an iteration to a plan document.
   * @param document The document to update
   * @param iteration The iteration to add
   * @returns The updated document
   */
  addIteration(document: PlanDocument, iteration: Iteration): Promise<PlanDocument>;

  /**
   * Add a finding to an iteration.
   * @param document The document to update
   * @param iterationNumber The iteration number
   * @param finding The finding to add
   * @returns The updated document
   */
  addFinding(document: PlanDocument, iterationNumber: number, finding: Finding): Promise<PlanDocument>;

  /**
   * Archives a plan document by moving it to the archived directory.
   * @param document The document to archive
   * @returns The updated document with the new path
   */
  archivePlanDocument(document: PlanDocument): Promise<PlanDocument>;

  /**
   * Unarchives a plan document by moving it from the archived directory to the active directory.
   * @param document The document to unarchive
   * @returns The updated document with the new path
   */
  unarchivePlanDocument(document: PlanDocument): Promise<PlanDocument>;

  /**
   * Lists all plan documents in the active directory.
   * @returns Array of plan document paths
   */
  listActivePlanDocuments(): Promise<string[]>;

  /**
   * Lists all plan documents in the archived directory.
   * @returns Array of plan document paths
   */
  listArchivedPlanDocuments(): Promise<string[]>;

  /**
   * Migrates existing plan documents from the workspace root to the organized folder structure.
   * @returns Number of migrated documents
   */
  migratePlanDocuments(): Promise<number>;

  /**
   * Updates a plan step.
   * @param document The document to update
   * @param stepId The ID of the step to update
   * @param updates Partial updates to apply
   * @returns The updated document
   */
  updatePlanStep(
    document: PlanDocument,
    stepId: string,
    updates: Partial<PlanStep>
  ): Promise<PlanDocument>;

  /**
   * Checks if a file exists.
   * @param filePath The path to the file
   * @returns True if the file exists, false otherwise
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * Gets the active plans directory path.
   */
  get activePlansRoot(): string;

  /**
   * Gets the archived plans directory path.
   */
  get archivedPlansRoot(): string;
}
