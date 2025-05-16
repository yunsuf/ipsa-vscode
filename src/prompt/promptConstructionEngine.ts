import { Finding } from '../models/finding';
import { PlanStep } from '../models/planDocument';
import { PromptConstructionEngine, PromptContext, PromptOptions, PromptTemplate } from '../models/prompt';
import { ConfigManager } from '../state';

/**
 * Implementation of the PromptConstructionEngine interface.
 */
export class PromptConstructionEngineImpl implements PromptConstructionEngine {
  private _templates: Map<string, PromptTemplate>;
  private _configManager: ConfigManager;

  /**
   * Creates a new PromptConstructionEngineImpl.
   */
  constructor() {
    this._templates = new Map<string, PromptTemplate>();
    this._configManager = ConfigManager.getInstance();

    // Register default templates
    this._registerDefaultTemplates();
  }

  /**
   * Constructs a prompt for the current state.
   * @param problemStatement The problem statement
   * @param currentStep The current plan step
   * @param relevantFindings Relevant findings from previous iterations
   * @param options Options for prompt construction
   * @returns The constructed prompt
   */
  public constructPrompt(
    problemStatement: string,
    currentStep: PlanStep,
    relevantFindings: Finding[],
    options?: PromptOptions
  ): string {
    // Get default options from configuration
    const defaultMaxPreviousFindings = this._configManager.get<number>(
      'prompt.maxPreviousFindings',
      5
    );

    // Merge options with defaults
    const mergedOptions: Required<PromptOptions> = {
      includeGoal: options?.includeGoal ?? true,
      includeCurrentStep: options?.includeCurrentStep ?? true,
      maxPreviousFindings: options?.maxPreviousFindings ?? defaultMaxPreviousFindings,
      customInstructions: options?.customInstructions ?? ''
    };

    // Filter findings based on max count
    const filteredFindings = this._selectRelevantFindings(
      relevantFindings,
      mergedOptions.maxPreviousFindings
    );

    // Create prompt context
    const context: PromptContext = {
      problemStatement,
      currentStep,
      relevantFindings: filteredFindings,
      customInstructions: mergedOptions.customInstructions
    };

    // Use standard template by default
    const template = this.getTemplate('standard') || this._createStandardTemplate();

    // Generate prompt using template
    return template.generatePrompt(context);
  }

  /**
   * Registers a prompt template.
   * @param template The template to register
   */
  public registerTemplate(template: PromptTemplate): void {
    this._templates.set(template.id, template);
  }

  /**
   * Gets a prompt template by ID.
   * @param id The template ID
   * @returns The template or undefined if not found
   */
  public getTemplate(id: string): PromptTemplate | undefined {
    return this._templates.get(id);
  }

  /**
   * Gets all registered templates.
   * @returns Array of registered templates
   */
  public getTemplates(): PromptTemplate[] {
    return Array.from(this._templates.values());
  }

  /**
   * Registers default templates.
   * @private
   */
  private _registerDefaultTemplates(): void {
    // Standard template
    this.registerTemplate(this._createStandardTemplate());

    // Code generation template
    this.registerTemplate({
      id: 'code-generation',
      name: 'Code Generation',
      description: 'Template focused on generating code implementations',
      generatePrompt: (context: PromptContext): string => {
        let prompt = '';

        // Include problem statement if requested
        prompt += `# Code Implementation Task\n\n`;
        prompt += `## Problem Context\n${context.problemStatement}\n\n`;

        // Include current step
        prompt += `## Current Task\n${context.currentStep.description}\n\n`;

        // Include relevant findings
        if (context.relevantFindings.length > 0) {
          prompt += `## Relevant Context\n`;

          // Prioritize code and solution findings
          const codeFindings = context.relevantFindings.filter(f =>
            f.type === 'code' || f.type === 'solution'
          );

          if (codeFindings.length > 0) {
            prompt += `### Previous Code and Solutions\n`;
            codeFindings.forEach(finding => {
              prompt += `#### ${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}\n`;
              prompt += `${finding.content}\n\n`;
            });
          }

          // Include other findings
          const otherFindings = context.relevantFindings.filter(f =>
            f.type !== 'code' && f.type !== 'solution'
          );

          if (otherFindings.length > 0) {
            prompt += `### Additional Context\n`;
            otherFindings.forEach(finding => {
              prompt += `#### ${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}\n`;
              prompt += `${finding.content}\n\n`;
            });
          }
        }

        // Include custom instructions
        prompt += `## Implementation Requirements\n`;
        prompt += context.customInstructions || 'Please implement the code for the current task based on the problem context and any relevant findings.';
        prompt += `\n\nPlease structure your response with the following sections:
1. **Implementation Plan**: Brief overview of your approach
2. **Code Implementation**: The actual code with clear comments
3. **Usage Example**: How to use the implemented code
4. **Testing Considerations**: What should be tested\n\n`;

        return prompt;
      }
    });

    // Analysis template
    this.registerTemplate({
      id: 'analysis',
      name: 'Analysis',
      description: 'Template for analyzing findings and identifying issues',
      generatePrompt: (context: PromptContext): string => {
        let prompt = '';

        // Include problem statement
        prompt += `# Analysis Task\n\n`;
        prompt += `## Problem Context\n${context.problemStatement}\n\n`;

        // Include current step
        prompt += `## Current Task\n${context.currentStep.description}\n\n`;

        // Include all relevant findings
        if (context.relevantFindings.length > 0) {
          prompt += `## Content to Analyze\n`;
          context.relevantFindings.forEach(finding => {
            prompt += `### ${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)} Finding\n`;
            prompt += `${finding.content}\n\n`;
          });
        }

        // Include custom instructions
        prompt += `## Analysis Instructions\n`;
        prompt += context.customInstructions || 'Please analyze the provided content and identify any issues, inconsistencies, or areas for improvement.';
        prompt += `\n\nPlease structure your response with the following sections:
1. **Summary**: Brief overview of your analysis
2. **Key Issues**: Identified problems or concerns
3. **Recommendations**: Suggested improvements
4. **Questions**: Any clarifications needed\n\n`;

        return prompt;
      }
    });

    // Solution template
    this.registerTemplate({
      id: 'solution',
      name: 'Solution',
      description: 'Template for proposing solutions to identified issues',
      generatePrompt: (context: PromptContext): string => {
        let prompt = '';

        // Include problem statement
        prompt += `# Solution Design Task\n\n`;
        prompt += `## Problem Context\n${context.problemStatement}\n\n`;

        // Include current step
        prompt += `## Current Task\n${context.currentStep.description}\n\n`;

        // Include relevant findings, prioritizing issues
        if (context.relevantFindings.length > 0) {
          // First include issues
          const issueFindings = context.relevantFindings.filter(f => f.type === 'issue');
          if (issueFindings.length > 0) {
            prompt += `## Identified Issues\n`;
            issueFindings.forEach(finding => {
              prompt += `### Issue\n${finding.content}\n\n`;
            });
          }

          // Then include other findings
          const otherFindings = context.relevantFindings.filter(f => f.type !== 'issue');
          if (otherFindings.length > 0) {
            prompt += `## Additional Context\n`;
            otherFindings.forEach(finding => {
              prompt += `### ${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}\n`;
              prompt += `${finding.content}\n\n`;
            });
          }
        }

        // Include custom instructions
        prompt += `## Solution Requirements\n`;
        prompt += context.customInstructions || 'Please propose a solution to address the identified issues based on the problem context and any relevant findings.';
        prompt += `\n\nPlease structure your response with the following sections:
1. **Solution Overview**: High-level description of your proposed solution
2. **Design Details**: Specific implementation details
3. **Pros and Cons**: Advantages and disadvantages of your approach
4. **Alternative Approaches**: Other solutions you considered\n\n`;

        return prompt;
      }
    });
  }

  /**
   * Creates the standard template.
   * @returns The standard template
   * @private
   */
  private _createStandardTemplate(): PromptTemplate {
    return {
      id: 'standard',
      name: 'Standard',
      description: 'Standard template for general problem-solving',
      generatePrompt: (context: PromptContext): string => {
        let prompt = '';

        // Include problem statement
        prompt += `# Problem-Solving Task\n\n`;
        prompt += `## Problem Statement\n${context.problemStatement}\n\n`;

        // Include current step
        prompt += `## Current Step\n${context.currentStep.description}\n\n`;

        // Include relevant findings
        if (context.relevantFindings.length > 0) {
          prompt += `## Relevant Findings\n`;
          context.relevantFindings.forEach(finding => {
            prompt += `### ${finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}\n`;
            prompt += `${finding.content}\n\n`;
          });
        }

        // Include custom instructions
        if (context.customInstructions) {
          prompt += `## Instructions\n${context.customInstructions}\n\n`;
        }

        return prompt;
      }
    };
  }

  /**
   * Selects the most relevant findings to include in the prompt.
   * @param findings All available findings
   * @param maxCount Maximum number of findings to include
   * @returns Selected findings
   * @private
   */
  private _selectRelevantFindings(findings: Finding[], maxCount: number): Finding[] {
    if (findings.length <= maxCount) {
      return [...findings];
    }

    // Sort findings by relevance (currently just using timestamp)
    // In a more advanced implementation, this could use semantic relevance
    const sortedFindings = [...findings].sort((a, b) => {
      // Sort by timestamp (newest first)
      const timestampA = a.metadata?.timestamp || 0;
      const timestampB = b.metadata?.timestamp || 0;
      return timestampB - timestampA;
    });

    // Take the top N findings
    return sortedFindings.slice(0, maxCount);
  }
}
