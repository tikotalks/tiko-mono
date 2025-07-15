#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

// Get all apps from the apps directory
function getApps() {
  const appsDir = join(process.cwd(), 'apps');
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      const packagePath = join(appsDir, name, 'package.json');
      if (existsSync(packagePath)) {
        try {
          const pkg = require(packagePath);
          return pkg.scripts && pkg.scripts.build;
        } catch (e) {
          return false;
        }
      }
      return false;
    })
    .sort();
  
  return apps;
}

// Get app info for display
function getAppInfo(appName) {
  const packagePath = join(process.cwd(), 'apps', appName, 'package.json');
  try {
    const pkg = require(packagePath);
    return {
      name: appName,
      description: pkg.description || '',
      version: pkg.version || '0.0.0'
    };
  } catch (e) {
    return {
      name: appName,
      description: '',
      version: '0.0.0'
    };
  }
}

// Build the specified app
function buildApp(appName) {
  console.log(`\n${colors.blue}🔨 Building ${colors.green}${appName}${colors.blue}...${colors.reset}\n`);
  
  try {
    execSync(`npx nx build ${appName}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n${colors.green}✅ Successfully built ${appName}${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building ${appName}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Build all apps
function buildAllApps() {
  console.log(`\n${colors.blue}🔨 Building all apps...${colors.reset}\n`);
  
  try {
    execSync(`npx nx run-many --target=build --all`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n${colors.green}✅ Successfully built all apps${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building apps:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function main() {
  // Check if app name was provided as argument
  const appArg = process.argv[2];
  
  // Show help if requested
  if (appArg === '--help' || appArg === '-h') {
    console.log(`${colors.blue}${colors.bright}Tiko Build Tool${colors.reset}\n`);
    console.log('Usage: pnpm build [app-name|all]\n');
    console.log('Options:');
    console.log('  (no args)    Interactive selection');
    console.log('  all          Build all apps');
    console.log('  <app-name>   Build specific app');
    console.log('  --help, -h   Show this help message\n');
    console.log('Examples:');
    console.log('  pnpm build          # Interactive selection');
    console.log('  pnpm build all      # Build all apps');
    console.log('  pnpm build timer    # Build timer app');
    console.log('  pnpm build radio    # Build radio app\n');
    console.log(`Available apps: ${getApps().join(', ')}`);
    process.exit(0);
  }
  
  if (appArg) {
    // Direct mode
    if (appArg === 'all') {
      buildAllApps();
      return;
    }
    
    const apps = getApps();
    
    // Find matching app
    const normalizedArg = appArg.toLowerCase().replace('_', '-');
    const matchingApp = apps.find(app => 
      app.toLowerCase() === normalizedArg ||
      app.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      app === appArg
    );
    
    if (matchingApp) {
      buildApp(matchingApp);
    } else {
      console.log(`${colors.red}❌ App "${appArg}" not found${colors.reset}`);
      console.log(`${colors.yellow}Available apps: ${apps.join(', ')}${colors.reset}`);
      process.exit(1);
    }
    return;
  }
  
  // Interactive mode
  const apps = getApps();
  
  if (apps.length === 0) {
    console.log(`${colors.red}No apps found with build scripts!${colors.reset}`);
    process.exit(1);
  }

  // Prepare options for interactive selection
  const options = [
    {
      name: `${colors.bright}All Apps${colors.reset}`,
      description: 'Build all applications',
      value: 'all'
    },
    ...apps.map(app => {
      const info = getAppInfo(app);
      return {
        name: `${info.name} ${colors.gray}v${info.version}${colors.reset}`,
        description: info.description,
        value: app
      };
    })
  ];

  const selected = await interactiveSelect('🔨 Select what to build:', options);
  
  if (selected === 'all') {
    buildAllApps();
  } else {
    buildApp(selected);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});