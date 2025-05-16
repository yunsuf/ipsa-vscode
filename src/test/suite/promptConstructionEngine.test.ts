import * as assert from 'assert';
import { PromptConstructionEngineImpl } from '../../prompt/promptConstructionEngine';
import { Finding } from '../../models/finding';
import { PlanStep } from '../../models/planDocument';

suite('PromptConstructionEngine Test Suite', () => {
  let engine: PromptConstructionEngineImpl;
  
  setup(() => {
    engine = new PromptConstructionEngineImpl();
  });

  test('constructPrompt should include problem statement and current step', () => {
    const problemStatement = 'Test problem statement';
    const currentStep: PlanStep = {
      id: 'step_1',
      description: 'Test step description',
      status: 'pending',
      order: 1
    };
    const findings: Finding[] = [];

    const prompt = engine.constructPrompt(problemStatement, currentStep, findings);

    assert.ok(prompt.includes(problemStatement), 'Prompt should include problem statement');
    assert.ok(prompt.includes(currentStep.description), 'Prompt should include current step description');
  });

  test('constructPrompt should include relevant findings', () => {
    const problemStatement = 'Test problem statement';
    const currentStep: PlanStep = {
      id: 'step_1',
      description: 'Test step description',
      status: 'pending',
      order: 1
    };
    const findings: Finding[] = [
      {
        id: 'finding_1',
        type: 'code',
        content: 'Test code finding',
        metadata: {
          source: 'agent',
          timestamp: Date.now()
        }
      },
      {
        id: 'finding_2',
        type: 'analysis',
        content: 'Test analysis finding',
        metadata: {
          source: 'agent',
          timestamp: Date.now()
        }
      }
    ];

    const prompt = engine.constructPrompt(problemStatement, currentStep, findings);

    assert.ok(prompt.includes('Test code finding'), 'Prompt should include code finding content');
    assert.ok(prompt.includes('Test analysis finding'), 'Prompt should include analysis finding content');
  });

  test('constructPrompt should respect maxPreviousFindings option', () => {
    const problemStatement = 'Test problem statement';
    const currentStep: PlanStep = {
      id: 'step_1',
      description: 'Test step description',
      status: 'pending',
      order: 1
    };
    
    // Create 10 findings
    const findings: Finding[] = Array.from({ length: 10 }, (_, i) => ({
      id: `finding_${i + 1}`,
      type: 'code',
      content: `Test finding ${i + 1}`,
      metadata: {
        source: 'agent',
        timestamp: Date.now() - i * 1000 // Older findings have earlier timestamps
      }
    }));

    const prompt = engine.constructPrompt(problemStatement, currentStep, findings, {
      maxPreviousFindings: 3
    });

    // Should include the 3 most recent findings (with highest timestamps)
    assert.ok(prompt.includes('Test finding 1'), 'Prompt should include most recent finding');
    assert.ok(prompt.includes('Test finding 2'), 'Prompt should include second most recent finding');
    assert.ok(prompt.includes('Test finding 3'), 'Prompt should include third most recent finding');
    
    // Should not include older findings
    assert.ok(!prompt.includes('Test finding 4'), 'Prompt should not include older findings');
  });

  test('constructPrompt should include custom instructions', () => {
    const problemStatement = 'Test problem statement';
    const currentStep: PlanStep = {
      id: 'step_1',
      description: 'Test step description',
      status: 'pending',
      order: 1
    };
    const findings: Finding[] = [];
    const customInstructions = 'These are custom instructions for the prompt';

    const prompt = engine.constructPrompt(problemStatement, currentStep, findings, {
      customInstructions
    });

    assert.ok(prompt.includes(customInstructions), 'Prompt should include custom instructions');
  });

  test('getTemplates should return all registered templates', () => {
    const templates = engine.getTemplates();
    
    // Should have at least the default templates
    assert.ok(templates.length >= 4, 'Should have at least 4 default templates');
    
    // Check for standard template
    const standardTemplate = templates.find(t => t.id === 'standard');
    assert.ok(standardTemplate, 'Should have standard template');
    assert.strictEqual(standardTemplate?.name, 'Standard');
    
    // Check for code generation template
    const codeTemplate = templates.find(t => t.id === 'code-generation');
    assert.ok(codeTemplate, 'Should have code generation template');
    assert.strictEqual(codeTemplate?.name, 'Code Generation');
  });

  test('registerTemplate and getTemplate should work correctly', () => {
    const customTemplate = {
      id: 'custom-template',
      name: 'Custom Template',
      description: 'A custom template for testing',
      generatePrompt: () => 'Custom prompt'
    };
    
    engine.registerTemplate(customTemplate);
    
    const retrievedTemplate = engine.getTemplate('custom-template');
    assert.strictEqual(retrievedTemplate, customTemplate, 'Should retrieve the registered template');
  });

  test('code-generation template should prioritize code and solution findings', () => {
    const problemStatement = 'Test problem statement';
    const currentStep: PlanStep = {
      id: 'step_1',
      description: 'Test step description',
      status: 'pending',
      order: 1
    };
    const findings: Finding[] = [
      {
        id: 'finding_1',
        type: 'code',
        content: 'Test code finding',
        metadata: {
          source: 'agent',
          timestamp: Date.now()
        }
      },
      {
        id: 'finding_2',
        type: 'analysis',
        content: 'Test analysis finding',
        metadata: {
          source: 'agent',
          timestamp: Date.now()
        }
      },
      {
        id: 'finding_3',
        type: 'solution',
        content: 'Test solution finding',
        metadata: {
          source: 'agent',
          timestamp: Date.now()
        }
      }
    ];

    const codeTemplate = engine.getTemplate('code-generation');
    if (!codeTemplate) {
      assert.fail('Code generation template not found');
      return;
    }

    const prompt = codeTemplate.generatePrompt({
      problemStatement,
      currentStep,
      relevantFindings: findings,
      customInstructions: ''
    });

    // Check that code and solution findings appear before analysis findings
    const codeIndex = prompt.indexOf('Test code finding');
    const solutionIndex = prompt.indexOf('Test solution finding');
    const analysisIndex = prompt.indexOf('Test analysis finding');
    
    assert.ok(codeIndex < analysisIndex, 'Code finding should appear before analysis finding');
    assert.ok(solutionIndex < analysisIndex, 'Solution finding should appear before analysis finding');
  });
});
