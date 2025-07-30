#!/usr/bin/env node

/**
 * Test script to verify Cloudflare build detection locally
 */

const { execSync } = require('child_process');

// Test apps
const testApps = [
  'admin',
  'timer',
  'yesno',
  'yes-no',
  'cards',
  'radio',
  'type',
  'todo',
  'tiko',
  'ui-docs'
];

console.log('\n🧪 Testing Cloudflare Build Script Locally\n');

// First, let's check what projects Nx knows about
console.log('📦 Nx Registered Projects:');
try {
  const projects = execSync('npx nx show projects --type=app', { encoding: 'utf8' });
  console.log(projects);
} catch (error) {
  console.error('❌ Failed to list Nx projects:', error.message);
}

console.log('\n🔍 Testing each app:\n');

testApps.forEach(app => {
  console.log(`\nTesting: ${app}`);
  console.log('-'.repeat(40));
  
  try {
    // Test the build script
    const result = execSync(`node scripts/cloudflare-build.js ${app}`, { 
      encoding: 'utf8',
      env: { 
        ...process.env,
        CF_PAGES_COMMIT_SHA: 'HEAD',
        CF_PAGES_BRANCH: 'test'
      }
    });
    console.log(result);
    console.log(`✅ ${app} - Build script ran successfully`);
  } catch (error) {
    console.log(`❌ ${app} - Build script failed`);
    console.log(error.stdout || error.message);
  }
  
  // Also test if Nx can build it
  try {
    execSync(`npx nx show project ${app} --json`, { encoding: 'utf8' });
    console.log(`✅ ${app} - Nx recognizes this project`);
  } catch (error) {
    console.log(`❌ ${app} - Nx does not recognize this project`);
  }
});

console.log('\n\n📊 Summary:\n');
console.log('If any apps show as not recognized by Nx, they need a project.json file.');
console.log('The build script should handle name mappings (e.g., yesno -> yes-no).\n');