#!/usr/bin/env node

/**
 * Cloudflare Pages Build Script
 * 
 * This script determines which projects need to be built based on:
 * 1. Nx affected detection
 * 2. Manual overrides via commit messages
 * 3. Changes to shared packages (ui/core)
 * 
 * Usage:
 *   node scripts/cloudflare-build.js <app-name>
 * 
 * Environment variables:
 *   CF_PAGES_COMMIT_SHA - Current commit SHA
 *   CF_PAGES_BRANCH - Current branch name
 *   CF_PAGES_URL - Preview URL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the app name from command line arguments
let appName = process.argv[2];

if (!appName) {
  console.error('Error: App name is required');
  console.error('Usage: node scripts/cloudflare-build.js <app-name>');
  process.exit(1);
}

// Convert simple app names to Nx project names
const appNameMapping = {
  'admin': 'admin',
  'yesno': 'yes-no',     // Directory is yes-no, not yesno
  'yes-no': 'yes-no',
  'timer': 'timer',
  'cards': 'cards',
  'radio': 'radio',
  'type': 'type',
  'todo': 'todo',
  'tiko': 'tiko',
  'ui-docs': 'ui-docs'
};

if (appNameMapping[appName]) {
  const originalName = appName;
  appName = appNameMapping[appName];
  if (originalName !== appName) {
    console.log(`📝 Converting ${originalName} to ${appName} for Nx compatibility`);
  }
}

// Get environment variables
const commitSha = process.env.CF_PAGES_COMMIT_SHA || 'HEAD';
const branch = process.env.CF_PAGES_BRANCH || 'main';
const isProduction = branch === 'main' || branch === 'master';

console.log(`🔍 Cloudflare Pages Build Detection for: ${appName}`);
console.log(`📍 Branch: ${branch}`);
console.log(`📍 Commit: ${commitSha}`);
console.log(`📍 Production: ${isProduction}`);

/**
 * Get the last commit message
 */
function getCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get commit message:', error.message);
    return '';
  }
}

/**
 * Check if build should be forced based on commit message
 */
function checkCommitMessageOverrides(message, app) {
  // Force build all apps
  if (message.includes('[build-all]') || message.includes('[force-build]')) {
    console.log('✅ Force build triggered by commit message: [build-all]');
    return { shouldBuild: true, reason: 'Forced by [build-all] in commit' };
  }

  // Force build specific app
  if (message.includes(`[build-${app}]`)) {
    console.log(`✅ Force build triggered by commit message: [build-${app}]`);
    return { shouldBuild: true, reason: `Forced by [build-${app}] in commit` };
  }

  // Skip all builds
  if (message.includes('[skip-ci]') || message.includes('[skip-build]')) {
    console.log('⏭️  Build skipped by commit message: [skip-ci]');
    return { shouldBuild: false, reason: 'Skipped by [skip-ci] in commit' };
  }

  // Skip specific app
  if (message.includes(`[skip-${app}]`)) {
    console.log(`⏭️  Build skipped by commit message: [skip-${app}]`);
    return { shouldBuild: false, reason: `Skipped by [skip-${app}] in commit` };
  }

  return null;
}

/**
 * Use Nx to detect affected projects
 */
function getAffectedProjects() {
  try {
    // Cloudflare does shallow clones, so we need to handle this differently
    let base = 'origin/main';
    
    // Try to get the previous commit for production builds
    if (isProduction) {
      try {
        // Check if we have enough git history
        execSync('git rev-parse HEAD~1', { encoding: 'utf8' });
        base = 'HEAD~1';
      } catch (e) {
        console.log('⚠️  Shallow clone detected, comparing with origin/main instead');
        // Try to fetch more history
        try {
          execSync('git fetch --unshallow', { encoding: 'utf8' });
          base = 'origin/main';
        } catch (fetchError) {
          console.log('⚠️  Could not unshallow, using current state');
          // Fall back to checking all files
          base = '';
        }
      }
    }
    
    console.log(`🔍 Checking affected projects${base ? ` between ${base} and HEAD` : ''}...`);
    
    // Run nx affected:apps to get list of affected applications
    let affected = [];
    let affectedLibs = [];
    
    if (base) {
      affected = execSync(
        `npx nx show projects --affected --base=${base} --head=HEAD --type=app`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);
      
      affectedLibs = execSync(
        `npx nx show projects --affected --base=${base} --head=HEAD --type=lib`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);
    } else {
      // If no base, get all projects
      affected = execSync(
        `npx nx show projects --type=app`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);
      
      affectedLibs = execSync(
        `npx nx show projects --type=lib`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);
    }
    
    console.log('📦 Affected apps:', affected.length > 0 ? affected.join(', ') : 'none');
    console.log('📚 Affected libraries:', affectedLibs.length > 0 ? affectedLibs.join(', ') : 'none');
    
    return { apps: affected, libs: affectedLibs };
  } catch (error) {
    console.warn('⚠️  Could not determine affected projects, assuming all affected');
    console.error(error.message);
    return { apps: [appName], libs: [] };
  }
}

/**
 * Main build detection logic
 */
function shouldBuildApp() {
  const commitMessage = getCommitMessage();
  console.log(`💬 Commit message: ${commitMessage.split('\n')[0]}`);
  
  // Check commit message overrides first
  const override = checkCommitMessageOverrides(commitMessage, appName);
  if (override) {
    return override;
  }
  
  // Get affected projects from Nx
  const { apps, libs } = getAffectedProjects();
  
  // Check if this app is directly affected
  // Handle both with and without @tiko/ prefix
  const appNameVariations = [
    appName,
    `@tiko/${appName}`,
    appName.replace('@tiko/', '')
  ];
  
  const isAppAffected = apps.some(app => appNameVariations.includes(app));
  
  if (isAppAffected) {
    return { 
      shouldBuild: true, 
      reason: 'App has direct changes' 
    };
  }
  
  // Check if core packages are affected (should rebuild all apps)
  const corePackages = ['ui', 'core', '@tiko/ui', '@tiko/core'];
  const coreAffected = libs.some(lib => corePackages.includes(lib));
  
  if (coreAffected) {
    return { 
      shouldBuild: true, 
      reason: `Shared packages affected: ${libs.filter(lib => corePackages.includes(lib)).join(', ')}` 
    };
  }
  
  // No need to build
  return { 
    shouldBuild: false, 
    reason: 'No changes detected for this app' 
  };
}

// Run the detection
const { shouldBuild, reason } = shouldBuildApp();

console.log('\n' + '='.repeat(50));
console.log(`📊 Build Decision: ${shouldBuild ? '✅ BUILD' : '⏭️  SKIP'}`);
console.log(`📝 Reason: ${reason}`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
// Exit 0 = build, Exit 1 = skip build
if (shouldBuild) {
  console.log(`🚀 Proceeding with build for ${appName}...`);
  process.exit(0);
} else {
  console.log(`⏭️  Skipping build for ${appName}`);
  process.exit(1);
}