#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

// Get all testable apps/packages
function getTestableProjects() {
  const projects = [];
  
  // Check apps
  const appsDir = join(process.cwd(), 'apps');
  if (existsSync(appsDir)) {
    const apps = readdirSync(appsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({ name: dirent.name, type: 'app' }))
      .filter(({ name }) => {
        const packagePath = join(appsDir, name, 'package.json');
        if (existsSync(packagePath)) {
          try {
            const pkg = require(packagePath);
            return pkg.scripts && pkg.scripts.test;
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    projects.push(...apps);
  }
  
  // Check packages
  const packagesDir = join(process.cwd(), 'packages');
  if (existsSync(packagesDir)) {
    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({ name: dirent.name, type: 'package' }))
      .filter(({ name }) => {
        const packagePath = join(packagesDir, name, 'package.json');
        if (existsSync(packagePath)) {
          try {
            const pkg = require(packagePath);
            return pkg.scripts && pkg.scripts.test;
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    projects.push(...packages);
  }
  
  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

// Get project info
function getProjectInfo(projectName, type) {
  const dir = type === 'app' ? 'apps' : 'packages';
  const packagePath = join(process.cwd(), dir, projectName, 'package.json');
  try {
    const pkg = require(packagePath);
    return {
      name: projectName,
      description: pkg.description || '',
      version: pkg.version || '0.0.0'
    };
  } catch (e) {
    return {
      name: projectName,
      description: '',
      version: '0.0.0'
    };
  }
}

// Test the specified project
function testProject(projectName) {
  console.log(`\n${colors.blue}🧪 Testing ${colors.green}${projectName}${colors.blue}...${colors.reset}\n`);
  
  try {
    execSync(`npx nx test ${projectName} -- --run`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n${colors.green}✅ All tests passed for ${projectName}${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Tests failed for ${projectName}${colors.reset}`);
    process.exit(1);
  }
}

// Test all projects
function testAllProjects() {
  console.log(`\n${colors.blue}🧪 Testing all projects...${colors.reset}\n`);
  
  try {
    execSync(`npx nx run-many --target=test --all -- --run`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`\n${colors.green}✅ All tests passed${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}\n❌ Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

async function main() {
  // Check if project name was provided as argument
  const projectArg = process.argv[2];
  
  if (projectArg) {
    // Direct mode
    if (projectArg === 'all') {
      testAllProjects();
      return;
    }
    
    const projects = getTestableProjects();
    
    // Find matching project
    const normalizedArg = projectArg.toLowerCase().replace('_', '-');
    const matchingProject = projects.find(({ name }) => 
      name.toLowerCase() === normalizedArg ||
      name.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      name === projectArg
    );
    
    if (matchingProject) {
      testProject(matchingProject.name);
    } else {
      console.log(`${colors.red}❌ Project "${projectArg}" not found or doesn't have tests${colors.reset}`);
      console.log(`${colors.yellow}Available projects with tests: ${projects.map(p => p.name).join(', ')}${colors.reset}`);
      process.exit(1);
    }
    return;
  }
  
  // Interactive mode
  const projects = getTestableProjects();
  
  if (projects.length === 0) {
    console.log(`${colors.red}No projects found with test scripts!${colors.reset}`);
    process.exit(1);
  }

  // Prepare options for interactive selection
  const options = [
    {
      name: `${colors.bright}All Projects${colors.reset}`,
      description: 'Run all tests',
      value: 'all'
    },
    ...projects.map(({ name, type }) => {
      const info = getProjectInfo(name, type);
      const typeLabel = type === 'app' ? 'app' : 'pkg';
      return {
        name: `${info.name} ${colors.gray}[${typeLabel}] v${info.version}${colors.reset}`,
        description: info.description,
        value: name
      };
    })
  ];

  const selected = await interactiveSelect('🧪 Select what to test:', options);
  
  if (selected === 'all') {
    testAllProjects();
  } else {
    testProject(selected);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});