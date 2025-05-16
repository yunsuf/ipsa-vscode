import * as assert from 'assert';
import { FindingsExtractorImpl } from '../../findings/findingsExtractor';
import { FindingType } from '../../models/finding';

suite('FindingsExtractor Test Suite', () => {
  let extractor: FindingsExtractorImpl;
  
  setup(() => {
    extractor = new FindingsExtractorImpl();
  });

  test('extractFindings should extract code blocks', () => {
    const response = `
Here's a solution to your problem:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

Let me know if you have any questions.
`;

    const findings = extractor.extractFindings(response);
    
    assert.strictEqual(findings.length, 1, 'Should extract one finding');
    assert.strictEqual(findings[0].type, 'code', 'Should be a code finding');
    assert.strictEqual(findings[0].content, 'function add(a, b) {\n  return a + b;\n}', 'Should extract the code content');
    assert.strictEqual(findings[0].metadata.language, 'javascript', 'Should detect the language');
  });

  test('extractFindings should extract findings based on headings', () => {
    const response = `
# Analysis
This is an analysis of the problem.

# Solution
Here's how to solve it.

# Issue
There's a bug in the code.
`;

    const findings = extractor.extractFindings(response);
    
    assert.strictEqual(findings.length, 3, 'Should extract three findings');
    
    const analysisFindings = findings.filter(f => f.type === 'analysis');
    assert.strictEqual(analysisFindings.length, 1, 'Should have one analysis finding');
    assert.strictEqual(analysisFindings[0].content, 'This is an analysis of the problem.', 'Should extract the analysis content');
    
    const solutionFindings = findings.filter(f => f.type === 'solution');
    assert.strictEqual(solutionFindings.length, 1, 'Should have one solution finding');
    assert.strictEqual(solutionFindings[0].content, 'Here\'s how to solve it.', 'Should extract the solution content');
    
    const issueFindings = findings.filter(f => f.type === 'issue');
    assert.strictEqual(issueFindings.length, 1, 'Should have one issue finding');
    assert.strictEqual(issueFindings[0].content, 'There\'s a bug in the code.', 'Should extract the issue content');
  });

  test('extractFindings should extract findings based on list items', () => {
    const response = `
Here are my findings:

- Analysis: The code is inefficient
- Issue: There's a memory leak
- Solution: Use a different algorithm
`;

    const findings = extractor.extractFindings(response);
    
    assert.strictEqual(findings.length, 3, 'Should extract three findings');
    
    const analysisFindings = findings.filter(f => f.type === 'analysis');
    assert.strictEqual(analysisFindings.length, 1, 'Should have one analysis finding');
    assert.strictEqual(analysisFindings[0].content, 'The code is inefficient', 'Should extract the analysis content');
    
    const issueFindings = findings.filter(f => f.type === 'issue');
    assert.strictEqual(issueFindings.length, 1, 'Should have one issue finding');
    assert.strictEqual(issueFindings[0].content, 'There\'s a memory leak', 'Should extract the issue content');
    
    const solutionFindings = findings.filter(f => f.type === 'solution');
    assert.strictEqual(solutionFindings.length, 1, 'Should have one solution finding');
    assert.strictEqual(solutionFindings[0].content, 'Use a different algorithm', 'Should extract the solution content');
  });

  test('extractFindings should respect preferredTypes option', () => {
    const response = `
# Analysis
This is an analysis of the problem.

# Solution
Here's how to solve it.

# Issue
There's a bug in the code.
`;

    const findings = extractor.extractFindings(response, {
      preferredTypes: ['analysis', 'solution']
    });
    
    assert.strictEqual(findings.length, 2, 'Should extract only two findings');
    assert.ok(findings.every(f => f.type === 'analysis' || f.type === 'solution'), 'Should only include preferred types');
    assert.strictEqual(findings.filter(f => f.type === 'issue').length, 0, 'Should not include issue findings');
  });

  test('extractFindings should respect autoExtract option', () => {
    const response = `
# Analysis
This is an analysis of the problem.

# Solution
Here's how to solve it.
`;

    const findings = extractor.extractFindings(response, {
      autoExtract: false
    });
    
    assert.strictEqual(findings.length, 0, 'Should not extract any findings when autoExtract is false');
  });

  test('createFindingFromSelection should create a finding with the correct type and content', () => {
    const text = 'This is a selected text';
    const type: FindingType = 'documentation';
    
    const finding = extractor.createFindingFromSelection(text, type);
    
    assert.strictEqual(finding.content, text, 'Should use the provided text as content');
    assert.strictEqual(finding.type, type, 'Should use the provided type');
    assert.strictEqual(finding.metadata.source, 'user', 'Should set source to user');
    assert.ok(finding.metadata.timestamp > 0, 'Should set a timestamp');
  });

  test('createFindingFromSelection should include additional metadata', () => {
    const text = 'console.log("Hello, world!");';
    const type: FindingType = 'code';
    const metadata = {
      language: 'javascript',
      tags: ['logging']
    };
    
    const finding = extractor.createFindingFromSelection(text, type, metadata);
    
    assert.strictEqual(finding.metadata.language, 'javascript', 'Should include language metadata');
    assert.deepStrictEqual(finding.metadata.tags, ['logging'], 'Should include tags metadata');
  });
});
