#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

// Get all apps from the apps directory
function getApps() {
  const appsDir = join(process.cwd(), 'apps');
  if (!existsSync(appsDir)) return [];
  
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

// Get all websites from the websites directory
function getWebsites() {
  const websitesDir = join(process.cwd(), 'websites');
  if (!existsSync(websitesDir)) return [];
  
  const websites = readdirSync(websitesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      const packagePath = join(websitesDir, name, 'package.json');
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
  
  return websites;
}

// Get all buildable projects (apps + websites)
function getAllProjects() {
  const apps = getApps().map(name => ({ name, type: 'app' }));
  const websites = getWebsites().map(name => ({ name, type: 'website' }));
  return [...apps, ...websites].sort((a, b) => a.name.localeCompare(b.name));
}

// Get project info for display (works for both apps and websites)
function getProjectInfo(projectName, projectType = 'app') {
  const projectDir = projectType === 'website' ? 'websites' : 'apps';
  const packagePath = join(process.cwd(), projectDir, projectName, 'package.json');
  try {
    const pkg = require(packagePath);
    return {
      name: projectName,
      description: pkg.description || '',
      version: pkg.version || '0.0.0',
      type: projectType
    };
  } catch (e) {
    return {
      name: projectName,
      description: '',
      version: '0.0.0',
      type: projectType
    };
  }
}

// Build the specified project (app or website)
function buildProject(projectName, projectType = 'app') {
  const typeLabel = projectType === 'website' ? 'website' : 'app';
  console.log(`\n${colors.blue}🔨 Building ${colors.green}${projectName}${colors.blue} (${typeLabel})...${colors.reset}\n`);
  
  try {
    if (projectType === 'website') {
      // Build websites using pnpm filter
      execSync(`pnpm --filter=${projectName} build`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } else {
      // Build apps using nx
      execSync(`npx nx build ${projectName}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
    console.log(`\n${colors.green}✅ Successfully built ${projectName} (${typeLabel})${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building ${projectName}:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Build all projects (apps + websites)
function buildAllProjects() {
  console.log(`\n${colors.blue}🔨 Building all apps and websites...${colors.reset}\n`);
  
  try {
    // Build all apps using nx
    console.log(`${colors.blue}🔨 Building all apps...${colors.reset}`);
    execSync(`npx nx run-many --target=build --all`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Build all websites
    const websites = getWebsites();
    if (websites.length > 0) {
      console.log(`\n${colors.blue}🔨 Building websites...${colors.reset}`);
      for (const website of websites) {
        console.log(`${colors.blue}Building ${website}...${colors.reset}`);
        execSync(`pnpm --filter=${website} build`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
    }
    
    console.log(`\n${colors.green}✅ Successfully built all projects${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Error building projects:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function main() {
  // Check if project name was provided as argument
  const projectArg = process.argv[2];
  
  // Show help if requested
  if (projectArg === '--help' || projectArg === '-h') {
    const apps = getApps();
    const websites = getWebsites();
    
    console.log(`${colors.blue}${colors.bright}Tiko Build Tool${colors.reset}\n`);
    console.log('Usage: pnpm build [project-name|all]\n');
    console.log('Options:');
    console.log('  (no args)         Interactive selection');
    console.log('  all               Build all apps and websites');
    console.log('  <project-name>    Build specific app or website');
    console.log('  --help, -h        Show this help message\n');
    console.log('Examples:');
    console.log('  pnpm build               # Interactive selection');
    console.log('  pnpm build all           # Build everything');
    console.log('  pnpm build timer         # Build timer app');
    console.log('  pnpm build marketing     # Build marketing website\n');
    
    if (apps.length > 0) {
      console.log(`Available apps: ${apps.join(', ')}`);
    }
    if (websites.length > 0) {
      console.log(`Available websites: ${websites.join(', ')}`);
    }
    process.exit(0);
  }
  
  if (projectArg) {
    // Direct mode
    if (projectArg === 'all') {
      buildAllProjects();
      return;
    }
    
    const apps = getApps();
    const websites = getWebsites();
    const allProjects = [...apps, ...websites];
    
    // Find matching project
    const normalizedArg = projectArg.toLowerCase().replace('_', '-');
    const matchingApp = apps.find(app => 
      app.toLowerCase() === normalizedArg ||
      app.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      app === projectArg
    );
    
    const matchingWebsite = websites.find(website => 
      website.toLowerCase() === normalizedArg ||
      website.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      website === projectArg
    );
    
    if (matchingApp) {
      buildProject(matchingApp, 'app');
    } else if (matchingWebsite) {
      buildProject(matchingWebsite, 'website');
    } else {
      console.log(`${colors.red}❌ Project "${projectArg}" not found${colors.reset}`);
      if (apps.length > 0) {
        console.log(`${colors.yellow}Available apps: ${apps.join(', ')}${colors.reset}`);
      }
      if (websites.length > 0) {
        console.log(`${colors.yellow}Available websites: ${websites.join(', ')}${colors.reset}`);
      }
      process.exit(1);
    }
    return;
  }
  
  // Interactive mode
  const apps = getApps();
  const websites = getWebsites();
  const allProjects = getAllProjects();
  
  if (allProjects.length === 0) {
    console.log(`${colors.red}No projects found with build scripts!${colors.reset}`);
    process.exit(1);
  }

  // Prepare options for interactive selection
  const options = [
    {
      name: `${colors.bright}All Projects${colors.reset}`,
      description: 'Build all apps and websites',
      value: 'all'
    }
  ];

  // Add apps section
  if (apps.length > 0) {
    options.push({
      name: `${colors.blue}${colors.bright}Apps${colors.reset}`,
      description: '',
      value: null,
      disabled: true
    });
    
    apps.forEach(app => {
      const info = getProjectInfo(app, 'app');
      options.push({
        name: `  ${info.name} ${colors.gray}v${info.version}${colors.reset}`,
        description: info.description,
        value: { name: app, type: 'app' }
      });
    });
  }

  // Add websites section
  if (websites.length > 0) {
    options.push({
      name: `${colors.green}${colors.bright}Websites${colors.reset}`,
      description: '',
      value: null,
      disabled: true
    });
    
    websites.forEach(website => {
      const info = getProjectInfo(website, 'website');
      options.push({
        name: `  ${info.name} ${colors.gray}v${info.version}${colors.reset}`,
        description: info.description,
        value: { name: website, type: 'website' }
      });
    });
  }

  const selected = await interactiveSelect('🔨 Select what to build:', options);
  
  if (selected === 'all') {
    buildAllProjects();
  } else if (selected && typeof selected === 'object') {
    buildProject(selected.name, selected.type);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});