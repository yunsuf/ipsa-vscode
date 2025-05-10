import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Starting all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('ipsa-team.ipsa'));
  });

  test('Should register commands', async () => {
    // Get all registered commands
    const commands = await vscode.commands.getCommands();
    
    // Check if our commands are registered
    assert.ok(commands.includes('ipsa.startNewSession'));
    assert.ok(commands.includes('ipsa.resumeSession'));
    assert.ok(commands.includes('ipsa.endSession'));
  });
});
