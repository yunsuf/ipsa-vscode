import { Finding } from './finding';
import { PlanStep } from './planDocument';

/**
 * Options for prompt construction.
 */
export interface PromptOptions {
  /**
   * Whether to include the problem statement/goal.
   */
  includeGoal?: boolean;

  /**
   * Whether to include the current plan step.
   */
  includeCurrentStep?: boolean;

  /**
   * Maximum number of previous findings to include.
   */
  maxPreviousFindings?: number;

  /**
   * Custom instructions to add to the prompt.
   */
  customInstructions?: string;
}

/**
 * Context for prompt construction.
 */
export interface PromptContext {
  /**
   * The problem statement.
   */
  problemStatement: string;

  /**
   * The current plan step.
   */
  currentStep: PlanStep;

  /**
   * Relevant findings from previous iterations.
   */
  relevantFindings: Finding[];

  /**
   * Custom instructions for the current task.
   */
  customInstructions?: string;
}

/**
 * Template for prompt construction.
 */
export interface PromptTemplate {
  /**
   * Unique identifier for the template.
   */
  id: string;

  /**
   * Display name for the template.
   */
  name: string;

  /**
   * Description of the template.
   */
  description: string;

  /**
   * Generate a prompt using the template.
   * @param context Context for prompt generation
   * @returns The generated prompt
   */
  generatePrompt(context: PromptContext): string;
}

/**
 * Engine for constructing prompts.
 */
export interface PromptConstructionEngine {
  /**
   * Construct a prompt for the current state.
   * @param problemStatement The problem statement
   * @param currentStep The current plan step
   * @param currentIteration The current iteration number
   * @param options Options for prompt construction
   * @returns The constructed prompt
   */
  constructPrompt(
    problemStatement: string,
    currentStep: PlanStep,
    relevantFindings: Finding[],
    options?: PromptOptions
  ): string;

  /**
   * Register a prompt template.
   * @param template The template to register
   */
  registerTemplate(template: PromptTemplate): void;

  /**
   * Get a prompt template by ID.
   * @param id The template ID
   * @returns The template or undefined if not found
   */
  getTemplate(id: string): PromptTemplate | undefined;

  /**
   * Get all registered templates.
   * @returns Array of registered templates
   */
  getTemplates(): PromptTemplate[];
}
