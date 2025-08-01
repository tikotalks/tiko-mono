#!/usr/bin/env node

/**
 * Clean Cache Script
 * Removes all Vite caches, dist folders, and other build artifacts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

// Directories to clean
const dirsToClean = [
  // Root level caches
  'node_modules/.cache',
  'node_modules/.vite',
  '.nuxt',
  '.next',
  '.turbo',
  
  // Package dist and caches
  'packages/*/dist',
  'packages/*/node_modules/.vite',
  'packages/*/node_modules/.cache',
  
  // App dist and caches
  'apps/*/dist',
  'apps/*/node_modules/.vite',
  'apps/*/node_modules/.cache',
  'apps/*/.nuxt',
  
  // Tools dist and caches
  'tools/*/dist',
  'tools/*/node_modules/.vite',
  'tools/*/node_modules/.cache',
  
  // Websites dist and caches
  'websites/*/dist',
  'websites/*/node_modules/.vite',
  'websites/*/node_modules/.cache',
  'websites/*/.nuxt',
];

console.log('🧹 Cleaning caches and build artifacts...\n');

let cleanedCount = 0;

// Function to remove directory
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`  ✅ Cleaned: ${path.relative(rootDir, dirPath)}`);
      cleanedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to clean: ${path.relative(rootDir, dirPath)}`);
      console.error(`     ${error.message}`);
    }
  }
}

// Function to expand glob patterns
function expandGlob(pattern) {
  const parts = pattern.split('/');
  const results = [];
  
  function expandPath(basePath, remainingParts) {
    if (remainingParts.length === 0) {
      return [basePath];
    }
    
    const [currentPart, ...rest] = remainingParts;
    
    if (currentPart === '*') {
      // List all directories at this level
      if (fs.existsSync(basePath)) {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
        
        const expandedPaths = [];
        for (const dir of dirs) {
          expandedPaths.push(...expandPath(path.join(basePath, dir), rest));
        }
        return expandedPaths;
      }
      return [];
    } else {
      return expandPath(path.join(basePath, currentPart), rest);
    }
  }
  
  return expandPath(rootDir, parts);
}

// Clean each directory
for (const dirPattern of dirsToClean) {
  if (dirPattern.includes('*')) {
    // Expand glob pattern
    const expandedPaths = expandGlob(dirPattern);
    for (const dirPath of expandedPaths) {
      removeDir(dirPath);
    }
  } else {
    // Direct path
    removeDir(path.join(rootDir, dirPattern));
  }
}

// Also clear pnpm store cache
console.log('\n🗑️  Clearing pnpm store cache...');
try {
  execSync('pnpm store prune', { stdio: 'inherit' });
  console.log('  ✅ pnpm store pruned');
} catch (error) {
  console.error('  ⚠️  Failed to prune pnpm store:', error.message);
}

console.log(`\n✨ Cleaning complete! Removed ${cleanedCount} directories.`);
console.log('💡 Run "pnpm build:packages" to rebuild packages.\n');