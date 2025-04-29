
import { describe, it, beforeEach, afterEach } from 'node:test';
import {TestRegistration} from "@mcp3/common";
 import assert from "node:assert";
import {registerAbiTool} from "../tools/index.js";

describe('borrow tool test', () => {
    let testRegistration = TestRegistration.createTest('test-registration', 'Test Registration', '1.0.0');
    registerAbiTool(testRegistration);


    it('should registered borrow tool', () => {
        const tools = testRegistration.registeredTools;
        assert.ok('sui-download-abi' in tools, 'Tool should be in registeredTools');
        assert.strictEqual(tools['sui-download-abi'].name, 'sui-download-abi', 'Tool name should match');
        assert.strictEqual(tools['sui-download-abi'].description, 'Get the ABI for a given object ID', 'Tool description should match');
    });



})