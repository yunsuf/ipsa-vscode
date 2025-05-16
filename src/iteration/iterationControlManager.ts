import { Iteration } from '../models/planDocument';
import { IPSASession } from '../models/session';
import { StateManager } from '../models/state';
import { PlanDocumentManager } from '../models';
import { Logger } from '../logger';

/**
 * Options for starting a new iteration.
 */
export interface NewIterationOptions {
  /**
   * The prompt to use for the new iteration.
   */
  prompt?: string;

  /**
   * The step ID to associate with the new iteration.
   * If not provided, the current step will be used.
   */
  stepId?: string;
}

/**
 * Options for advancing to the next step.
 */
export interface AdvanceStepOptions {
  /**
   * Whether to automatically start a new iteration for the next step.
   */
  startNewIteration?: boolean;

  /**
   * The prompt to use for the new iteration if startNewIteration is true.
   */
  prompt?: string;
}

/**
 * Metrics for a problem-solving session.
 */
export interface SessionMetrics {
  /**
   * Total number of iterations.
   */
  totalIterations: number;

  /**
   * Number of iterations per step.
   */
  iterationsPerStep: Record<string, number>;

  /**
   * Number of findings per step.
   */
  findingsPerStep: Record<string, number>;

  /**
   * Time spent on each step (in milliseconds).
   */
  timePerStep: Record<string, number>;

  /**
   * Total time spent on the session (in milliseconds).
   */
  totalTime: number;
}

/**
 * Manager for iteration control.
 */
export interface IterationControlManager {
  /**
   * Starts a new iteration for the current step.
   * @param options Options for the new iteration
   * @returns The created iteration
   */
  startNewIteration(options?: NewIterationOptions): Promise<Iteration>;

  /**
   * Advances to the next step in the plan.
   * @param options Options for advancing to the next step
   * @returns The updated session
   */
  advanceToNextStep(options?: AdvanceStepOptions): Promise<IPSASession>;

  /**
   * Goes back to the previous step in the plan.
   * @returns The updated session
   */
  goToPreviousStep(): Promise<IPSASession>;

  /**
   * Skips the current step and advances to the next one.
   * @returns The updated session
   */
  skipCurrentStep(): Promise<IPSASession>;

  /**
   * Marks the current step as completed.
   * @returns The updated session
   */
  markStepAsCompleted(): Promise<IPSASession>;

  /**
   * Gets metrics for the current session.
   * @returns The session metrics
   */
  getSessionMetrics(): Promise<SessionMetrics>;
}

/**
 * Implementation of the IterationControlManager interface.
 */
export class IterationControlManagerImpl implements IterationControlManager {
  private _stateManager: StateManager;
  private _planDocumentManager: PlanDocumentManager;

  /**
   * Creates a new IterationControlManagerImpl.
   * @param stateManager The state manager
   * @param planDocumentManager The plan document manager
   */
  constructor(stateManager: StateManager, planDocumentManager: PlanDocumentManager) {
    this._stateManager = stateManager;
    this._planDocumentManager = planDocumentManager;
  }

  /**
   * Starts a new iteration for the current step.
   * @param options Options for the new iteration
   * @returns The created iteration
   */
  public async startNewIteration(options?: NewIterationOptions): Promise<Iteration> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the current step
      const currentStep = planDoc.initialPlan[currentSession.currentStep];
      if (!currentStep) {
        throw new Error('Current step not found in plan');
      }

      // Determine the next iteration number
      const nextIterationNumber = planDoc.iterations.length > 0
        ? Math.max(...planDoc.iterations.map(i => i.number)) + 1
        : 1;

      // Create the new iteration
      const newIteration: Iteration = {
        number: nextIterationNumber,
        stepId: options?.stepId || currentStep.id,
        prompt: options?.prompt || '',
        response: '',
        findings: [],
        timestamp: new Date()
      };

      // Add the iteration to the plan document
      await this._planDocumentManager.addIteration(planDoc, newIteration);

      // Update the session
      currentSession.currentIteration = nextIterationNumber;
      currentSession.lastModified = new Date();
      await this._stateManager.saveSessionState(currentSession.id, currentSession);

      return newIteration;
    } catch (error) {
      Logger.error('Failed to start new iteration', error);
      throw new Error(`Failed to start new iteration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Advances to the next step in the plan.
   * @param options Options for advancing to the next step
   * @returns The updated session
   */
  public async advanceToNextStep(options?: AdvanceStepOptions): Promise<IPSASession> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Check if there is a next step
      if (currentSession.currentStep >= planDoc.initialPlan.length - 1) {
        throw new Error('Already at the last step');
      }

      // Mark the current step as done
      const currentStep = planDoc.initialPlan[currentSession.currentStep];
      await this._planDocumentManager.updatePlanStep(planDoc, currentStep.id, {
        status: 'done'
      });

      // Update the session to the next step
      currentSession.currentStep += 1;
      currentSession.lastModified = new Date();
      await this._stateManager.saveSessionState(currentSession.id, currentSession);

      // Start a new iteration for the next step if requested
      if (options?.startNewIteration) {
        await this.startNewIteration({
          prompt: options.prompt
        });
      }

      return currentSession;
    } catch (error) {
      Logger.error('Failed to advance to next step', error);
      throw new Error(`Failed to advance to next step: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Goes back to the previous step in the plan.
   * @returns The updated session
   */
  public async goToPreviousStep(): Promise<IPSASession> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Check if there is a previous step
      if (currentSession.currentStep <= 0) {
        throw new Error('Already at the first step');
      }

      // Update the session to the previous step
      currentSession.currentStep -= 1;
      currentSession.lastModified = new Date();
      await this._stateManager.saveSessionState(currentSession.id, currentSession);

      return currentSession;
    } catch (error) {
      Logger.error('Failed to go to previous step', error);
      throw new Error(`Failed to go to previous step: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Skips the current step and advances to the next one.
   * @returns The updated session
   */
  public async skipCurrentStep(): Promise<IPSASession> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Check if there is a next step
      if (currentSession.currentStep >= planDoc.initialPlan.length - 1) {
        throw new Error('Already at the last step');
      }

      // Mark the current step as done (skipped)
      const currentStep = planDoc.initialPlan[currentSession.currentStep];
      await this._planDocumentManager.updatePlanStep(planDoc, currentStep.id, {
        status: 'done'
      });

      // Update the session to the next step
      currentSession.currentStep += 1;
      currentSession.lastModified = new Date();
      await this._stateManager.saveSessionState(currentSession.id, currentSession);

      return currentSession;
    } catch (error) {
      Logger.error('Failed to skip current step', error);
      throw new Error(`Failed to skip current step: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Marks the current step as completed.
   * @returns The updated session
   */
  public async markStepAsCompleted(): Promise<IPSASession> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Mark the current step as done
      const currentStep = planDoc.initialPlan[currentSession.currentStep];
      await this._planDocumentManager.updatePlanStep(planDoc, currentStep.id, {
        status: 'done'
      });

      // Update the session
      currentSession.lastModified = new Date();
      await this._stateManager.saveSessionState(currentSession.id, currentSession);

      return currentSession;
    } catch (error) {
      Logger.error('Failed to mark step as completed', error);
      throw new Error(`Failed to mark step as completed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets metrics for the current session.
   * @returns The session metrics
   */
  public async getSessionMetrics(): Promise<SessionMetrics> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Initialize metrics
      const metrics: SessionMetrics = {
        totalIterations: planDoc.iterations.length,
        iterationsPerStep: {},
        findingsPerStep: {},
        timePerStep: {},
        totalTime: 0
      };

      // Calculate iterations per step
      for (const iteration of planDoc.iterations) {
        if (iteration.stepId) {
          metrics.iterationsPerStep[iteration.stepId] = (metrics.iterationsPerStep[iteration.stepId] || 0) + 1;
        }
      }

      // Calculate findings per step
      for (const iteration of planDoc.iterations) {
        if (iteration.stepId) {
          metrics.findingsPerStep[iteration.stepId] = (metrics.findingsPerStep[iteration.stepId] || 0) + iteration.findings.length;
        }
      }

      // Calculate time per step (based on iteration timestamps)
      const stepTimestamps: Record<string, { first: Date, last: Date }> = {};

      for (const iteration of planDoc.iterations) {
        if (iteration.stepId && iteration.timestamp) {
          if (!stepTimestamps[iteration.stepId]) {
            stepTimestamps[iteration.stepId] = {
              first: iteration.timestamp,
              last: iteration.timestamp
            };
          } else {
            if (iteration.timestamp < stepTimestamps[iteration.stepId].first) {
              stepTimestamps[iteration.stepId].first = iteration.timestamp;
            }
            if (iteration.timestamp > stepTimestamps[iteration.stepId].last) {
              stepTimestamps[iteration.stepId].last = iteration.timestamp;
            }
          }
        }
      }

      // Calculate time differences
      for (const stepId in stepTimestamps) {
        const { first, last } = stepTimestamps[stepId];
        metrics.timePerStep[stepId] = last.getTime() - first.getTime();
      }

      // Calculate total time
      if (planDoc.metadata.created && planDoc.metadata.lastModified) {
        metrics.totalTime = planDoc.metadata.lastModified.getTime() - planDoc.metadata.created.getTime();
      }

      return metrics;
    } catch (error) {
      Logger.error('Failed to get session metrics', error);
      throw new Error(`Failed to get session metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Automatically advances to the next step based on findings.
   * This method analyzes the findings in the latest iteration and determines
   * if the current step can be considered completed.
   * @returns True if the step was advanced, false otherwise
   */
  public async autoAdvanceStep(): Promise<boolean> {
    try {
      // Get the current session
      const currentSession = this._stateManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No active session');
      }

      // Load the plan document
      const planDoc = await this._planDocumentManager.loadPlanDocument(currentSession.planDocumentPath);

      // Get the latest iteration
      if (planDoc.iterations.length === 0) {
        return false;
      }

      const latestIteration = planDoc.iterations[planDoc.iterations.length - 1];

      // Check if the iteration has findings
      if (!latestIteration.findings || latestIteration.findings.length === 0) {
        return false;
      }

      // Check if the findings indicate the step is completed
      // This is a simple heuristic that can be improved
      const solutionFindings = latestIteration.findings.filter(f =>
        f.type === 'solution' ||
        f.content.toLowerCase().includes('complete') ||
        f.content.toLowerCase().includes('finished') ||
        f.content.toLowerCase().includes('done')
      );

      if (solutionFindings.length > 0) {
        // Advance to the next step
        await this.advanceToNextStep();
        return true;
      }

      return false;
    } catch (error) {
      Logger.error('Failed to auto-advance step', error);
      return false;
    }
  }
}
