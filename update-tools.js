const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'packages/defilama/src/tools/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find all tool registrations
const toolRegex = /registration\.addTool\(\{[\s\S]+?callback: async \(\{([^}]*)\}\) => \{[\s\S]+?return toResult\(`\${baseUrl}[^`]+`, data, error(?:\)|\s*\))/g;

// Replace each tool registration
let updatedContent = content.replace(toolRegex, (match, argsStr) => {
  // Check if nextCursor is already in the args
  if (match.includes('nextCursor: nextCursorParam')) {
    return match;
  }

  // Add nextCursor to args
  const argsMatch = match.match(/args: \{([^}]*)\}/);
  if (argsMatch) {
    const argsContent = argsMatch[1];
    const updatedArgs = argsContent.trim() 
      ? `args: {${argsContent},\n            nextCursor: nextCursorParam}`
      : `args: {\n            nextCursor: nextCursorParam\n        }`;
    match = match.replace(/args: \{([^}]*)\}/, updatedArgs);
  }

  // Update callback parameters
  const callbackParams = argsStr.trim() 
    ? `{${argsStr}, nextCursor}` 
    : `{nextCursor}`;
  match = match.replace(/callback: async \(\{([^}]*)\}\)/, `callback: async (${callbackParams})`);

  // Update toResult call
  match = match.replace(/return toResult\(`\${baseUrl}[^`]+`, data, error(?:\)|\s*\))/, 
    (resultMatch) => resultMatch.replace(/error(?:\)|\s*\))/, 'error, nextCursor)'));

  return match;
});

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('Updated all tools with nextCursor parameter');
