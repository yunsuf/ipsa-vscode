import MarkdownIt from 'markdown-it';
import { PlanDocument, PlanStep, Iteration, Finding } from '../models';

/**
 * Class for processing Markdown content in plan documents.
 */
export class MarkdownProcessor {
  private _md: MarkdownIt;

  /**
   * Creates a new MarkdownProcessor.
   */
  constructor() {
    this._md = new MarkdownIt({
      html: false,
      xhtmlOut: false,
      breaks: false,
      langPrefix: 'language-',
      linkify: true,
      typographer: true
    });
  }

  /**
   * Renders Markdown to HTML.
   * @param markdown The Markdown content
   * @returns The rendered HTML
   */
  public renderMarkdown(markdown: string): string {
    return this._md.render(markdown);
  }

  /**
   * Parses Markdown content into a structured PlanDocument.
   * @param markdown The Markdown content
   * @param path The path to the document
   * @returns The parsed PlanDocument
   */
  public parseMarkdownToPlanDocument(markdown: string, path: string): PlanDocument {
    const lines = markdown.split('\n');
    const planDoc: Partial<PlanDocument> = {
      problemId: '',
      path,
      problemStatement: '',
      initialPlan: [],
      iterations: [],
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        version: '1.0'
      }
    };

    let currentSection: string | null = null;
    let currentIteration: Partial<Iteration> | null = null;
    let currentFinding: Partial<Finding> | null = null;
    let contentBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse headings to identify sections
      if (line.startsWith('# ')) {
        // Top-level heading - problem ID
        planDoc.problemId = line.substring(2).trim();
        continue;
      }

      if (line.startsWith('## ')) {
        // Save content from previous section
        this._saveSection(planDoc, currentSection, contentBuffer, currentIteration);

        // Start new section
        currentSection = line.substring(3).trim();
        contentBuffer = [];

        // Check if this is an iteration section
        const iterationMatch = currentSection.match(/^Iteration (\d+)/i);
        if (iterationMatch) {
          currentIteration = {
            number: parseInt(iterationMatch[1], 10),
            stepId: '',
            prompt: '',
            response: '',
            findings: [], // Initialize with empty array
            timestamp: new Date()
          };
        } else {
          currentIteration = null;
        }

        continue;
      }

      if (line.startsWith('### ') && currentIteration) {
        // Save content from previous subsection if within an iteration
        this._saveIterationSubsection(currentIteration, currentSection, contentBuffer);

        // Start new subsection
        currentSection = line.substring(4).trim();
        contentBuffer = [];

        continue;
      }

      if (line.startsWith('#### ') && currentIteration && currentSection === 'Findings') {
        // Save previous finding if any
        if (currentFinding && contentBuffer.length > 0) {
          currentFinding.content = contentBuffer.join('\n').trim();
          if (currentIteration.findings) {
            currentIteration.findings.push(currentFinding as Finding);
          } else {
            currentIteration.findings = [currentFinding as Finding];
          }
        }

        // Start new finding
        const findingType = line.substring(5).trim().toLowerCase();
        currentFinding = {
          id: `finding_${Date.now()}_${currentIteration.findings?.length || 0}`,
          type: this._mapFindingType(findingType),
          content: '',
          metadata: {
            source: 'agent',
            timestamp: Date.now()
          }
        };

        contentBuffer = [];
        continue;
      }

      // Handle the last finding in the iteration
      if (i === lines.length - 1 && currentFinding && contentBuffer.length > 0 && currentIteration) {
        currentFinding.content = contentBuffer.join('\n').trim();
        if (currentIteration.findings) {
          currentIteration.findings.push(currentFinding as Finding);
        } else {
          currentIteration.findings = [currentFinding as Finding];
        }
      }

      // Add line to current content buffer
      contentBuffer.push(line);
    }

    // Save the last section
    this._saveSection(planDoc, currentSection, contentBuffer, currentIteration);

    return planDoc as PlanDocument;
  }

  /**
   * Generates Markdown content from a PlanDocument.
   * @param planDoc The PlanDocument
   * @returns The generated Markdown
   */
  public generateMarkdownFromPlanDocument(planDoc: PlanDocument): string {
    let markdown = '';

    // Add problem ID as title
    markdown += `# ${planDoc.problemId}\n\n`;

    // Add problem statement
    markdown += `## Problem Statement\n\n${planDoc.problemStatement}\n\n`;

    // Add initial plan
    markdown += `## Initial Plan\n\n`;
    planDoc.initialPlan.forEach((step, index) => {
      markdown += `${index + 1}. ${step.description}\n`;
    });
    markdown += '\n';

    // Add iterations
    planDoc.iterations.forEach(iteration => {
      markdown += `## Iteration ${iteration.number}\n\n`;

      if (iteration.prompt) {
        markdown += `### Prompt\n\n\`\`\`\n${iteration.prompt}\n\`\`\`\n\n`;
      }

      if (iteration.response) {
        markdown += `### Response\n\n\`\`\`\n${iteration.response}\n\`\`\`\n\n`;
      }

      if (iteration.findings && iteration.findings.length > 0) {
        markdown += `### Findings\n\n`;

        iteration.findings.forEach(finding => {
          markdown += `#### ${this._capitalizeFirstLetter(finding.type)}\n\n`;

          if (finding.type === 'code' && finding.metadata && finding.metadata.language) {
            markdown += `\`\`\`${finding.metadata.language}\n${finding.content}\n\`\`\`\n\n`;
          } else {
            markdown += `${finding.content}\n\n`;
          }
        });
      }
    });

    return markdown;
  }

  /**
   * Updates a section in a Markdown document.
   * @param markdown The original Markdown content
   * @param sectionHeading The heading of the section to update
   * @param newContent The new content for the section
   * @returns The updated Markdown
   */
  public updateMarkdownSection(markdown: string, sectionHeading: string, newContent: string): string {
    const lines = markdown.split('\n');
    const result: string[] = [];

    let inTargetSection = false;
    let sectionLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for section heading
      const headingMatch = line.match(/^(#+)\s+(.+)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();

        if (heading === sectionHeading) {
          // Found the target section
          inTargetSection = true;
          sectionLevel = level;

          // Add the heading
          result.push(line);

          // Add the new content
          result.push('');
          result.push(newContent);

          // Skip existing content until we find the next section at the same or higher level
          while (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextHeadingMatch = nextLine.match(/^(#+)\s+.+$/);

            if (nextHeadingMatch && nextHeadingMatch[1].length <= sectionLevel) {
              // Found the next section, stop skipping
              break;
            }

            i++;
          }
        } else if (inTargetSection && level <= sectionLevel) {
          // Found the next section at the same or higher level, end of target section
          inTargetSection = false;
          result.push(line);
        } else {
          // Not in target section or subsection of target, just add the line
          result.push(line);
        }
      } else {
        // Not a heading, just add the line
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Parses the initial plan from Markdown content.
   * @param content The Markdown content
   * @returns Array of plan steps
   */
  private _parseInitialPlan(content: string): PlanStep[] {
    const steps: PlanStep[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Look for numbered list items
      const match = line.match(/^\s*(\d+)\.\s+(.+)$/);
      if (match) {
        const order = parseInt(match[1], 10);
        const description = match[2].trim();

        steps.push({
          id: `step_${order}`,
          description,
          status: 'pending',
          order
        });
      }
    }

    return steps;
  }

  /**
   * Saves a section of the Markdown to the plan document.
   * @param planDoc The plan document being built
   * @param section The current section name
   * @param content The content lines for the section
   * @param iteration The current iteration if in an iteration section
   */
  private _saveSection(
    planDoc: Partial<PlanDocument>,
    section: string | null,
    content: string[],
    iteration: Partial<Iteration> | null
  ): void {
    if (!section || content.length === 0) {
      return;
    }

    const contentText = content.join('\n').trim();

    if (section === 'Problem Statement') {
      planDoc.problemStatement = contentText;
    } else if (section === 'Initial Plan') {
      planDoc.initialPlan = this._parseInitialPlan(contentText);
    } else if (section.startsWith('Iteration') && iteration) {
      // Add iteration to document
      if (!planDoc.iterations) {
        planDoc.iterations = [];
      }

      // Save any remaining content to the iteration
      this._saveIterationSubsection(iteration, section, content);

      planDoc.iterations.push(iteration as Iteration);
    }
  }

  /**
   * Saves a subsection of an iteration.
   * @param iteration The iteration being built
   * @param subsection The current subsection name
   * @param content The content lines for the subsection
   */
  private _saveIterationSubsection(
    iteration: Partial<Iteration>,
    subsection: string | null,
    content: string[]
  ): void {
    if (!subsection || content.length === 0) {
      return;
    }

    const contentText = content.join('\n').trim();

    if (subsection === 'Prompt') {
      // Extract prompt from code block
      const promptMatch = contentText.match(/```([\s\S]*?)```/);
      iteration.prompt = promptMatch ? promptMatch[1].trim() : contentText;
    } else if (subsection === 'Response') {
      // Extract response from code block
      const responseMatch = contentText.match(/```([\s\S]*?)```/);
      iteration.response = responseMatch ? responseMatch[1].trim() : contentText;
    }
    // Findings are handled separately in the main parsing loop
  }

  /**
   * Maps a finding type string to a valid FindingType.
   * @param type The type string from the Markdown
   * @returns A valid FindingType
   */
  private _mapFindingType(type: string): 'code' | 'analysis' | 'issue' | 'solution' | 'documentation' {
    const validTypes: Record<string, 'code' | 'analysis' | 'issue' | 'solution' | 'documentation'> = {
      'code': 'code',
      'analysis': 'analysis',
      'issue': 'issue',
      'solution': 'solution',
      'documentation': 'documentation'
    };

    return validTypes[type.toLowerCase()] || 'documentation';
  }

  /**
   * Capitalizes the first letter of a string.
   * @param str The string to capitalize
   * @returns The capitalized string
   */
  private _capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
