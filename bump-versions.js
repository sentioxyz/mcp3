#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find all package.json files in the packages directory
const packageJsonFiles = globSync('packages/*/package.json');

console.log('Found the following packages:');
packageJsonFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`- ${packageJson.name}@${packageJson.version}`);
});

console.log('\nBumping package versions...');

// Bump the version for each package
packageJsonFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Parse version components
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;
  packageJson.version = newVersion;
  
  // Write updated package.json
  fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`✅ ${packageJson.name}: ${currentVersion} -> ${newVersion}`);
});

console.log('\nAll package versions have been bumped!');
console.log('Next steps:');
console.log('1. Run: pnpm install');
console.log('2. Run: pnpm build');
console.log('3. Run: pnpm publish -r');
