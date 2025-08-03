#!/usr/bin/env node

/**
 * Inject build information into apps during build time
 * This script generates a build-info.json file with version and deployment metadata
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get build information
const getBuildInfo = (packagePath) => {
  // Read package.json to get version
  const packageJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
  
  // Get git information
  let gitCommit = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA;
  let gitBranch = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME;
  
  // Fallback to git commands if env vars not available
  if (!gitCommit) {
    try {
      gitCommit = execSync('git rev-parse HEAD').toString().trim();
    } catch (e) {
      gitCommit = 'unknown';
    }
  }
  
  if (!gitBranch) {
    try {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (e) {
      gitBranch = 'unknown';
    }
  }
  
  // Get build number from commit count
  let buildNumber;
  try {
    buildNumber = execSync('git rev-list --count HEAD').toString().trim();
  } catch (e) {
    buildNumber = '0';
  }
  
  return {
    version: packageJson.version,
    buildNumber: parseInt(buildNumber),
    commit: gitCommit.substring(0, 7), // Short SHA
    commitFull: gitCommit,
    branch: gitBranch,
    buildDate: new Date().toISOString(),
    deploymentUrl: process.env.CF_PAGES_URL || '',
    environment: gitBranch === 'master' ? 'production' : 'preview'
  };
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: inject-build-info.js <app-directory>');
    process.exit(1);
  }
  
  const appDir = args[0];
  const buildInfo = getBuildInfo(appDir);
  
  // Create public directory if it doesn't exist
  const publicDir = path.join(appDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Write build info to public directory (will be served as static file)
  const buildInfoPath = path.join(publicDir, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  // Also inject into src as a TypeScript module for compile-time access
  const srcDir = path.join(appDir, 'src');
  const buildInfoTsPath = path.join(srcDir, 'build-info.ts');
  
  const tsContent = `// Auto-generated build information
// Generated at: ${buildInfo.buildDate}

export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)} as const;

export type BuildInfo = typeof BUILD_INFO;
`;
  
  fs.writeFileSync(buildInfoTsPath, tsContent);
  
  console.log(`✅ Build info injected for ${path.basename(appDir)}:`);
  console.log(`   Version: ${buildInfo.version} (build ${buildInfo.buildNumber})`);
  console.log(`   Commit: ${buildInfo.commit}`);
  console.log(`   Branch: ${buildInfo.branch}`);
  console.log(`   Environment: ${buildInfo.environment}`);
};

main();