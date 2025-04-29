import { describe, it, beforeEach, afterEach } from 'node:test';
import {TestRegistration} from "@mcp3/common";
import {registerNaviDepositTool} from "../deposit-tool.js";
import assert from "node:assert";

describe('deposit tool test', () => {
    let testRegistration: TestRegistration;

    beforeEach(() => {
        // Create a new TestRegistration instance for each test
        testRegistration = TestRegistration.createTest('test-registration', 'Test Registration', '1.0.0');
        registerNaviDepositTool(testRegistration);
    });

    it('should register deposit tool', () => {
        const tools = testRegistration.registeredTools;
        assert.ok('sui-navi-deposit' in tools, 'Tool should be in registeredTools');
        assert.strictEqual(tools['sui-navi-deposit'].name, 'sui-navi-deposit', 'Tool name should match');
        assert.strictEqual(
            tools['sui-navi-deposit'].description, 
            'Create a Navi deposit transaction, return the transaction bytes', 
            'Tool description should match'
        );
    });

     
});