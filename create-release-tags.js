#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { globSync } from 'glob';

// Find all package.json files in the packages directory
const packageJsonFiles = globSync('packages/*/package.json');

// Create a tag for each package
console.log('Creating release tags...');

packageJsonFiles.forEach(file => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
    const { name, version } = packageJson;
    
    // Format the tag name as package-name@version
    const tagName = `${name.replace('@', '').replace('/', '-')}@${version}`;
    
    // Create and push the tag
    execSync(`git tag -a ${tagName} -m "Release ${name} version ${version}"`, { stdio: 'inherit' });
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    
    console.log(`✅ Created and pushed tag: ${tagName}`);
  } catch (error) {
    console.error(`Failed to create tag for ${file}: ${error.message}`);
  }
});

// Also create a generic release tag with the date
const today = new Date();
const dateTag = `release-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

try {
  execSync(`git tag -a ${dateTag} -m "Release ${dateTag}"`, { stdio: 'inherit' });
  execSync(`git push origin ${dateTag}`, { stdio: 'inherit' });
  console.log(`✅ Created and pushed release tag: ${dateTag}`);
} catch (error) {
  console.error(`Failed to create release tag: ${error.message}`);
}

console.log('\nAll release tags have been created and pushed!');