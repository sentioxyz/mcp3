#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
let releaseType = 'patch'; // Default release type

args.forEach(arg => {
  if (arg.startsWith('--type=')) {
    const providedType = arg.split('=')[1];
    // If the type is empty or undefined, keep the default
    if (providedType) {
      releaseType = providedType;
      // Validate the release type
      if (!['patch', 'minor', 'major', 'rc'].includes(releaseType)) {
        console.error(`Invalid release type: ${releaseType}. Must be one of: patch, minor, major, rc`);
        process.exit(1);
      }
    } else {
      console.log('Empty release type provided, using default: patch');
    }
  }
});

console.log(`Release type: ${releaseType}`);

// Get the most recent tag
let lastTag;
try {
  lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  console.log(`Last release tag: ${lastTag}`);
} catch (error) {
  console.log('No previous tags found. Will bump all packages.');
}

// Find changed packages since the last tag
let changedPackages = new Set();

if (lastTag) {
  try {
    const changedFiles = execSync(`git diff --name-only ${lastTag} HEAD`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(file => file.startsWith('packages/'));

    changedFiles.forEach(file => {
      const packagePath = file.split('/').slice(0, 2).join('/');
      changedPackages.add(packagePath);
    });

    console.log(`Detected changes in the following packages:`);
    changedPackages.forEach(pkg => console.log(`- ${pkg}`));
  } catch (error) {
    console.error(`Error detecting changed packages: ${error.message}`);
    process.exit(1);
  }
} else {
  // If no tag is found, consider all packages as changed
  const packageDirs = globSync('packages/*', { onlyDirectories: true });
  packageDirs.forEach(dir => changedPackages.add(dir));
}

// Find all package.json files in the packages directory
const packageJsonFiles = globSync('packages/*/package.json');

// Create dependency graph to handle updates in the correct order
const dependencyGraph = {};
const packageVersions = {};

packageJsonFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  const packageName = packageJson.name;
  dependencyGraph[packageName] = [];
  packageVersions[packageName] = packageJson.version;

  // Check for workspace dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (packageJson.dependencies[dep].startsWith('workspace:')) {
        dependencyGraph[packageName].push(dep);
      }
    });
  }

  if (packageJson.peerDependencies) {
    Object.keys(packageJson.peerDependencies).forEach(dep => {
      if (packageJson.peerDependencies[dep].startsWith('workspace:')) {
        dependencyGraph[packageName].push(dep);
      }
    });
  }
});

// Find packages that need to be bumped due to dependencies
const packagesToUpdate = new Set();

function markForUpdate(packageName) {
  if (packagesToUpdate.has(packageName)) return;
  packagesToUpdate.add(packageName);

  // Find packages that depend on this package
  Object.keys(dependencyGraph).forEach(pkg => {
    if (dependencyGraph[pkg].includes(packageName)) {
      markForUpdate(pkg);
    }
  });
}

// Mark changed packages and their dependents for update
changedPackages.forEach(pkgPath => {
  try {
    const packageJsonPath = path.join(pkgPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      markForUpdate(packageJson.name);
    }
  } catch (error) {
    console.error(`Error processing ${pkgPath}: ${error.message}`);
  }
});


console.log('\nThe following packages will be updated:');
packagesToUpdate.forEach(pkg => {
  console.log(`- ${pkg}`);
});

// Bump the version for each package that needs updating
packageJsonFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  const packageName = packageJson.name;

  if (!packagesToUpdate.has(packageName)) {
    console.log(`Skipping ${packageName} (no changes detected)`);
    return;
  }

  const currentVersion = packageJson.version;

  // Parse version components
  const versionParts = currentVersion.split('.');
  // Ensure we have valid numbers for each part, defaulting to 0 if NaN
  const major = parseInt(versionParts[0], 10) || 0;
  const minor = parseInt(versionParts[1], 10) || 0;

  // Handle patch version which might contain pre-release info
  let patch = 0;
  let preRelease = '';
  let preReleaseNum = 0;

  // Check if current version has a prerelease component
  if (currentVersion.includes('-')) {
    const [version, preReleaseInfo] = currentVersion.split('-');
    // Extract patch from the version part
    const versionParts = version.split('.');
    patch = parseInt(versionParts[2], 10) || 0;

    if (preReleaseInfo && preReleaseInfo.startsWith('rc.')) {
      preRelease = 'rc';
      preReleaseNum = parseInt(preReleaseInfo.substring(3), 10) || 0;
    }
  } else {
    // No pre-release, just extract patch
    patch = parseInt(versionParts[2], 10) || 0;
  }

  // Calculate new version based on release type
  let newVersion;
  if (releaseType === 'rc') {
    if (preRelease === 'rc') {
      // Increment the RC number
      newVersion = `${major}.${minor}.${patch}-rc.${preReleaseNum + 1}`;
    } else {
      // Create a new RC for the next patch version
      newVersion = `${major}.${minor}.${patch + 1}-rc.1`;
    }
  } else if (releaseType === 'major') {
    newVersion = `${major + 1}.0.0`;
  } else if (releaseType === 'minor') {
    newVersion = `${major}.${minor + 1}.0`;
  } else { // patch
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  packageJson.version = newVersion;

  // Update dependencies to other workspace packages
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (packageJson.dependencies[dep].startsWith('workspace:') && packagesToUpdate.has(dep)) {
        // Keep the workspace specifier but update for reference
        console.log(`  Updating dependency: ${dep} (${packageJson.dependencies[dep]})`);
      }
    });
  }

  // Write updated package.json
  fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`✅ ${packageName}: ${currentVersion} -> ${newVersion}`);
});

console.log('\nPackage versions have been bumped!');
console.log('Next steps:');
console.log('1. Run: pnpm install');
console.log('2. Run: pnpm build');
console.log('3. Run: pnpm publish -r');
