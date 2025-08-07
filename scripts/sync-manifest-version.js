#!/usr/bin/env node

/**
 * Sync version from package.json to manifest.json
 * This ensures both files have the same version after npm version commands
 */

const fs = require('fs');
const path = require('path');

// Read package.json version
const packagePath = path.join(__dirname, '..', 'package.json');
const manifestPath = path.join(__dirname, '..', 'src', 'manifest.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Update manifest version
  manifestJson.version = packageJson.version;

  // Write back to manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');

  console.log(`✅ Version synced: ${packageJson.version} (package.json → manifest.json)`);
} catch (error) {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
}