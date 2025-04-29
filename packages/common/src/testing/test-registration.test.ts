import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TestRegistration } from './system-test.js';
import { z } from 'zod';

describe('TestRegistration', () => {
  let testRegistration: TestRegistration;

  beforeEach(() => {
    // Create a new TestRegistration instance for each test
    testRegistration = TestRegistration.createTest('test-registration', 'Test Registration', '1.0.0');
  });

  it('should create a TestRegistration instance', () => {
    assert.ok(testRegistration, 'TestRegistration instance should be created');
    assert.strictEqual(testRegistration.name, 'test-registration', 'Name should match');
    assert.strictEqual(testRegistration.description, 'Test Registration', 'Description should match');
    assert.strictEqual(testRegistration.version, '1.0.0', 'Version should match');
  });

  it('should set and get global options', () => {
    const options = { nodeUrl: 'https://fullnode.testnet.sui.io:443' };
    testRegistration.setGlobalOptions(options);
    assert.deepStrictEqual(testRegistration.globalOptions, options, 'Global options should match');
  });

  it('should register and call a tool without args', async () => {
    // Register a simple tool without args
    testRegistration.addTool({
      name: 'test-tool',
      description: 'A test tool',
      callback: async () => {
        return {
          content: [{ type: "text" as const, text: 'Test tool called' }]
        };
      }
    });

    // Call the tool
    const result = await testRegistration.call('test-tool');
    assert.deepStrictEqual(
      result, 
      { content: [{ type: 'text', text: 'Test tool called' }] },
      'Tool result should match'
    );
  });

  it('should register and call a tool with args', async () => {
    // Register a tool with args
    testRegistration.addTool({
      name: 'test-tool-with-args',
      description: 'A test tool with args',
      args: {
        name: z.string().describe('A name parameter'),
        count: z.number().describe('A count parameter')
      },
      callback: async ({ name, count }) => {
        return {
          content: [{ 
            type: "text" as const, 
            text: `Tool called with name: ${name}, count: ${count}` 
          }]
        };
      }
    });

    // Call the tool with args
    const result = await testRegistration.call('test-tool-with-args', { name: 'test', count: 42 });
    assert.deepStrictEqual(
      result, 
      { content: [{ type: 'text', text: 'Tool called with name: test, count: 42' }] },
      'Tool result should match'
    );
  });

  it('should throw an error when calling a non-existent tool', async () => {
    try {
      await testRegistration.call('non-existent-tool');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error instanceof Error, 'Should throw an Error');
      assert.strictEqual(
        (error as Error).message, 
        'Tool non-existent-tool not found',
        'Error message should match'
      );
    }
  });

  it('should expose registered tools', () => {
    // Register a tool
    testRegistration.addTool({
      name: 'test-tool',
      description: 'A test tool',
      callback: async () => {
        return {
          content: [{ type: "text" as const, text: 'Test tool called' }]
        };
      }
    });

    // Check that the tool is exposed
    const tools = testRegistration.registeredTools;
    assert.ok('test-tool' in tools, 'Tool should be in registeredTools');
    assert.strictEqual(tools['test-tool'].name, 'test-tool', 'Tool name should match');
    assert.strictEqual(tools['test-tool'].description, 'A test tool', 'Tool description should match');
  });
});
