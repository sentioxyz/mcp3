import { describe, it, beforeEach, afterEach } from 'node:test';
import {TestRegistration} from "@mcp3/common";
import {registerRepayTool} from "../repay-tool.js";
import assert from "node:assert";

describe('repay tool test', () => {
    let testRegistration: TestRegistration;

    beforeEach(() => {
        // Create a new TestRegistration instance for each test
        testRegistration = TestRegistration.createTest('test-registration', 'Test Registration', '1.0.0');
        registerRepayTool(testRegistration);
    });

    it('should register repay tool', () => {
        const tools = testRegistration.registeredTools;
        assert.ok('sui-navi-repay' in tools, 'Tool should be in registeredTools');
        assert.strictEqual(tools['sui-navi-repay'].name, 'sui-navi-repay', 'Tool name should match');
        assert.strictEqual(tools['sui-navi-repay'].description, 'Repay debt to Navi Protocol', 'Tool description should match');
    });
 
});