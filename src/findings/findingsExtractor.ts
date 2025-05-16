import { Finding, FindingMetadata, FindingType, FindingsExtractor } from '../models/finding';

/**
 * Implementation of the FindingsExtractor interface.
 */
export class FindingsExtractorImpl implements FindingsExtractor {
  /**
   * Extracts findings from an AI assistant response.
   * @param response The response to extract findings from
   * @param options Options for extraction
   * @returns Array of extracted findings
   */
  public extractFindings(
    response: string,
    options?: {
      autoExtract?: boolean;
      preferredTypes?: FindingType[];
    }
  ): Finding[] {
    const findings: Finding[] = [];

    // Default to auto-extract if not specified
    const shouldAutoExtract = options?.autoExtract ?? true;

    if (shouldAutoExtract) {
      // Try to extract findings based on patterns
      this._extractCodeFindings(response, findings);
      this._extractHeadingBasedFindings(response, findings);
      this._extractListBasedFindings(response, findings);
    }

    // Filter by preferred types if specified
    if (options?.preferredTypes && options.preferredTypes.length > 0) {
      return findings.filter(finding =>
        options.preferredTypes!.includes(finding.type)
      );
    }

    return findings;
  }

  /**
   * Creates a finding from selected text.
   * @param text The selected text
   * @param type The type of finding
   * @param metadata Additional metadata
   * @returns The created finding
   */
  public createFindingFromSelection(
    text: string,
    type: FindingType,
    metadata?: Partial<FindingMetadata>
  ): Finding {
    // Generate a unique ID for the finding
    const id = `finding_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create the finding
    return {
      id,
      type,
      content: text,
      metadata: {
        source: 'user',
        timestamp: Date.now(),
        ...metadata
      }
    };
  }

  /**
   * Extracts code findings from a response.
   * @param response The response to extract from
   * @param findings The array to add findings to
   * @private
   */
  private _extractCodeFindings(response: string, findings: Finding[]): void {
    // Match code blocks with language specifier: ```language\ncode\n```
    const codeBlockRegex = /```([a-zA-Z0-9_+#]+)?\s*\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      let language = match[1]?.trim() || '';
      const code = match[2]?.trim() || '';

      if (code) {
        // If no language specified in the code block, try to detect it
        if (!language) {
          language = this._detectLanguage(code);
        }

        findings.push({
          id: `finding_${Date.now()}_${findings.length}`,
          type: 'code',
          content: code,
          metadata: {
            language,
            source: 'agent',
            timestamp: Date.now()
          }
        });
      }
    }
  }

  /**
   * Extracts findings based on markdown headings.
   * @param response The response to extract from
   * @param findings The array to add findings to
   * @private
   */
  private _extractHeadingBasedFindings(response: string, findings: Finding[]): void {
    // Look for sections with specific headings that indicate finding types
    const headingPatterns = [
      { regex: /#+\s*(?:Code|Implementation|Solution Code)[\s:]*([\s\S]*?)(?=#+\s|$)/gi, type: 'code' },
      { regex: /#+\s*(?:Analysis|Explanation|Understanding)[\s:]*([\s\S]*?)(?=#+\s|$)/gi, type: 'analysis' },
      { regex: /#+\s*(?:Issue|Problem|Bug|Error)[\s:]*([\s\S]*?)(?=#+\s|$)/gi, type: 'issue' },
      { regex: /#+\s*(?:Solution|Approach|Fix|Resolution)[\s:]*([\s\S]*?)(?=#+\s|$)/gi, type: 'solution' },
      { regex: /#+\s*(?:Documentation|Reference|Resources)[\s:]*([\s\S]*?)(?=#+\s|$)/gi, type: 'documentation' }
    ];

    for (const pattern of headingPatterns) {
      let match;
      while ((match = pattern.regex.exec(response)) !== null) {
        const content = match[1]?.trim();

        if (content) {
          findings.push({
            id: `finding_${Date.now()}_${findings.length}`,
            type: pattern.type as FindingType,
            content,
            metadata: {
              source: 'agent',
              timestamp: Date.now()
            }
          });
        }
      }
    }
  }

  /**
   * Extracts findings based on list items.
   * @param response The response to extract from
   * @param findings The array to add findings to
   * @private
   */
  private _extractListBasedFindings(response: string, findings: Finding[]): void {
    // Look for lists with specific prefixes that indicate finding types
    const listPatterns = [
      { regex: /(?:^|\n)(?:- |[0-9]+\. )(?:Code|Implementation):?\s*([\s\S]*?)(?=(?:^|\n)(?:- |[0-9]+\. )|$)/gim, type: 'code' },
      { regex: /(?:^|\n)(?:- |[0-9]+\. )(?:Analysis|Explanation):?\s*([\s\S]*?)(?=(?:^|\n)(?:- |[0-9]+\. )|$)/gim, type: 'analysis' },
      { regex: /(?:^|\n)(?:- |[0-9]+\. )(?:Issue|Problem):?\s*([\s\S]*?)(?=(?:^|\n)(?:- |[0-9]+\. )|$)/gim, type: 'issue' },
      { regex: /(?:^|\n)(?:- |[0-9]+\. )(?:Solution|Fix):?\s*([\s\S]*?)(?=(?:^|\n)(?:- |[0-9]+\. )|$)/gim, type: 'solution' },
      { regex: /(?:^|\n)(?:- |[0-9]+\. )(?:Documentation|Reference):?\s*([\s\S]*?)(?=(?:^|\n)(?:- |[0-9]+\. )|$)/gim, type: 'documentation' }
    ];

    for (const pattern of listPatterns) {
      let match;
      while ((match = pattern.regex.exec(response)) !== null) {
        const content = match[1]?.trim();

        if (content) {
          findings.push({
            id: `finding_${Date.now()}_${findings.length}`,
            type: pattern.type as FindingType,
            content,
            metadata: {
              source: 'agent',
              timestamp: Date.now()
            }
          });
        }
      }
    }
  }

  /**
   * Detects the programming language from code content.
   * @param code The code to analyze
   * @returns The detected language or empty string if unknown
   * @private
   */
  private _detectLanguage(code: string): string {
    // Simple language detection based on common patterns
    if (code.includes('function') && (code.includes('{') || code.includes('=>'))) {
      return 'javascript';
    }
    if (code.includes('import') && code.includes('from') && code.includes('class')) {
      return 'typescript';
    }
    if (code.includes('def ') && code.includes(':')) {
      return 'python';
    }
    if (code.includes('public class') || code.includes('private class')) {
      return 'java';
    }
    if (code.includes('#include')) {
      return 'cpp';
    }

    // Default to empty string if language can't be detected
    return '';
  }
}
