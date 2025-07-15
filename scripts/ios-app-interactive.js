#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

// Get all apps with iOS support
function getIOSApps() {
  const appsDir = join(process.cwd(), 'apps');
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      // Check if app has iOS configuration
      const iosPath = join(appsDir, name, 'ios');
      const packagePath = join(appsDir, name, 'package.json');
      
      if (existsSync(iosPath) && existsSync(packagePath)) {
        try {
          const pkg = require(packagePath);
          return pkg.scripts && (pkg.scripts['ios:build'] || pkg.scripts['cap:build']);
        } catch (e) {
          return false;
        }
      }
      return false;
    })
    .sort();
  
  return apps;
}

// Get app info
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

// iOS command functions
function iosBuild(appName) {
  console.log(`\n${colors.blue}📱 Building ${colors.green}${appName}${colors.blue} for iOS...${colors.reset}\n`);
  
  try {
    // First build the web app
    execSync(`nx build ${appName}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Then sync with Capacitor
    execSync(`cd apps/${appName} && npx cap sync ios`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true
    });
    
    console.log(`\n${colors.green}✅ Successfully built ${appName} for iOS${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building ${appName} for iOS:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function iosOpen(appName) {
  console.log(`\n${colors.blue}📱 Opening ${colors.green}${appName}${colors.blue} in Xcode...${colors.reset}\n`);
  
  try {
    execSync(`cd apps/${appName} && npx cap open ios`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true
    });
  } catch (error) {
    console.error(`${colors.red}\n❌ Error opening ${appName} in Xcode:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function iosBuildAll() {
  console.log(`\n${colors.blue}📱 Building all apps for iOS...${colors.reset}\n`);
  
  try {
    // Build all web apps
    execSync(`nx run-many --target=build --all`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Sync all with Capacitor
    execSync(`nx run-many --target=cap:sync --all`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`\n${colors.green}✅ Successfully built all apps for iOS${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building apps for iOS:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function selectAppInteractive(action, apps) {
  const options = action === 'build' ? [
    {
      name: `${colors.bright}All Apps${colors.reset}`,
      description: 'Build all iOS apps',
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
  ] : apps.map(app => {
    const info = getAppInfo(app);
    return {
      name: `${info.name} ${colors.gray}v${info.version}${colors.reset}`,
      description: info.description,
      value: app
    };
  });

  const title = action === 'build' 
    ? '📱 Select what to build for iOS:'
    : '📱 Select app to open in Xcode:';

  return await interactiveSelect(title, options);
}

async function main() {
  const command = process.argv[2]; // build or open
  const appArg = process.argv[3];  // app name
  
  if (!command || (command !== 'build' && command !== 'open')) {
    // Show interactive command selection
    const commandOptions = [
      {
        name: 'Build for iOS',
        description: 'Build app(s) for iOS deployment',
        value: 'build'
      },
      {
        name: 'Open in Xcode',
        description: 'Open app in Xcode for development',
        value: 'open'
      }
    ];
    
    const selectedCommand = await interactiveSelect('📱 iOS Manager - Select action:', commandOptions);
    
    // Now proceed with app selection for the chosen command
    const apps = getIOSApps();
    
    if (apps.length === 0) {
      console.log(`${colors.red}No apps found with iOS support!${colors.reset}`);
      process.exit(1);
    }
    
    const selectedApp = await selectAppInteractive(selectedCommand, apps);
    
    if (selectedCommand === 'build') {
      if (selectedApp === 'all') {
        iosBuildAll();
      } else {
        iosBuild(selectedApp);
      }
    } else {
      iosOpen(selectedApp);
    }
    return;
  }
  
  const apps = getIOSApps();
  
  if (apps.length === 0) {
    console.log(`${colors.red}No apps found with iOS support!${colors.reset}`);
    process.exit(1);
  }
  
  if (appArg) {
    // Direct mode with app argument
    if (command === 'build' && appArg === 'all') {
      iosBuildAll();
      return;
    }
    
    // Find matching app
    const normalizedArg = appArg.toLowerCase().replace('_', '-');
    const matchingApp = apps.find(app => 
      app.toLowerCase() === normalizedArg ||
      app.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      app === appArg
    );
    
    if (!matchingApp) {
      console.log(`${colors.red}❌ App "${appArg}" not found or doesn't support iOS${colors.reset}`);
      console.log(`${colors.yellow}Available iOS apps: ${apps.join(', ')}${colors.reset}`);
      process.exit(1);
    }
    
    if (command === 'build') {
      iosBuild(matchingApp);
    } else {
      iosOpen(matchingApp);
    }
  } else {
    // Interactive mode for app selection
    const selectedApp = await selectAppInteractive(command, apps);
    
    if (command === 'build') {
      if (selectedApp === 'all') {
        iosBuildAll();
      } else {
        iosBuild(selectedApp);
      }
    } else {
      iosOpen(selectedApp);
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`${colors.yellow}\n\n👋 Shutting down...\n${colors.reset}`);
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});