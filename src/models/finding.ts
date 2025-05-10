/**
 * Represents a finding extracted from an AI assistant response.
 */
export interface Finding {
  /**
   * Unique identifier for the finding.
   */
  id: string;

  /**
   * Type of finding.
   */
  type: FindingType;

  /**
   * Content of the finding.
   */
  content: string;

  /**
   * Metadata about the finding.
   */
  metadata: FindingMetadata;
}

/**
 * Types of findings that can be extracted.
 */
export type FindingType = 'code' | 'analysis' | 'issue' | 'solution' | 'documentation';

/**
 * Metadata for a finding.
 */
export interface FindingMetadata {
  /**
   * Programming language for code findings.
   */
  language?: string;

  /**
   * Tags for categorizing the finding.
   */
  tags?: string[];

  /**
   * Source of the finding.
   */
  source: 'agent' | 'user';

  /**
   * Timestamp when the finding was created.
   */
  timestamp: number;
}

/**
 * Manager for findings operations.
 */
export interface FindingsExtractor {
  /**
   * Extract findings from an AI assistant response.
   * @param response The response to extract findings from
   * @param options Options for extraction
   * @returns Array of extracted findings
   */
  extractFindings(
    response: string,
    options?: {
      autoExtract?: boolean;
      preferredTypes?: FindingType[];
    }
  ): Finding[];

  /**
   * Create a finding from selected text.
   * @param text The selected text
   * @param type The type of finding
   * @param metadata Additional metadata
   * @returns The created finding
   */
  createFindingFromSelection(
    text: string,
    type: FindingType,
    metadata?: Partial<FindingMetadata>
  ): Finding;
}
