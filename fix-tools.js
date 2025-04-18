const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'packages/defilama/src/tools/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix formatting issues in args
content = content.replace(/args: \{\s+([^}]+)\s+,\s+nextCursor: nextCursorParam\}/g, (match, argsContent) => {
  return `args: {\n            ${argsContent},\n            nextCursor: nextCursorParam\n        }`;
});

// Fix callback parameter issues - replace _ with {nextCursor}
content = content.replace(/callback: async \(_\) => \{([\s\S]+?)return toResult\(`\${baseUrl}[^`]+`, data, error, nextCursor\)/g, 
  (match) => match.replace(/callback: async \(_\) => \{/, 'callback: async ({nextCursor}) => {'));

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed formatting issues in tools');
