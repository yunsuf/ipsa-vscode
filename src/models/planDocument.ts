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
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';

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
  stepId: string;

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
  timestamp: Date;
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
}
