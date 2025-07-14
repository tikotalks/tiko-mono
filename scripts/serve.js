#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Get all apps from the apps directory
function getApps() {
  const appsDir = join(process.cwd(), 'apps');
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      // Check if it has a package.json with a dev script
      const packagePath = join(appsDir, name, 'package.json');
      if (existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(execSync(`cat ${packagePath}`, { encoding: 'utf8' }));
          return pkg.scripts && (pkg.scripts.dev || pkg.scripts.serve);
        } catch (e) {
          return false;
        }
      }
      return false;
    });
  
  return apps;
}

// Get app info for display
function getAppInfo(appName) {
  const packagePath = join(process.cwd(), 'apps', appName, 'package.json');
  try {
    const pkg = JSON.parse(execSync(`cat ${packagePath}`, { encoding: 'utf8' }));
    return {
      name: appName,
      description: pkg.description || 'No description',
      version: pkg.version || '0.0.0'
    };
  } catch (e) {
    return {
      name: appName,
      description: 'No description',
      version: '0.0.0'
    };
  }
}

async function main() {
  console.log(chalk.blue.bold('\n🚀 Tiko App Launcher\n'));
  
  const apps = getApps();
  
  if (apps.length === 0) {
    console.log(chalk.red('No apps found with dev/serve scripts!'));
    process.exit(1);
  }

  // Create choices with app info
  const choices = apps.map(app => {
    const info = getAppInfo(app);
    return {
      name: `${chalk.green(info.name)} ${chalk.gray(`v${info.version}`)} - ${chalk.dim(info.description)}`,
      value: app,
      short: info.name
    };
  });

  // Add separator and exit option
  choices.push(
    new inquirer.Separator(),
    {
      name: chalk.red('Exit'),
      value: 'exit',
      short: 'Exit'
    }
  );

  // Prompt user to select an app
  const { selectedApp } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedApp',
      message: 'Which app would you like to run?',
      choices,
      pageSize: 15
    }
  ]);

  if (selectedApp === 'exit') {
    console.log(chalk.yellow('\n👋 Goodbye!\n'));
    process.exit(0);
  }

  // Check if we should run multiple apps
  const { runAnother } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runAnother',
      message: 'Do you want to run another app simultaneously?',
      default: false
    }
  ]);

  const appsToRun = [selectedApp];

  if (runAnother) {
    const remainingApps = apps.filter(app => app !== selectedApp);
    const { additionalApps } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'additionalApps',
        message: 'Select additional apps to run:',
        choices: remainingApps.map(app => {
          const info = getAppInfo(app);
          return {
            name: `${chalk.green(info.name)} - ${chalk.dim(info.description)}`,
            value: app,
            short: info.name
          };
        })
      }
    ]);
    appsToRun.push(...additionalApps);
  }

  console.log(chalk.blue('\n🏃 Starting app(s)...\n'));

  // Run the selected app(s)
  if (appsToRun.length === 1) {
    // Run single app
    console.log(chalk.green(`Starting ${appsToRun[0]}...`));
    execSync(`pnpm --filter ${appsToRun[0]} dev`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } else {
    // Run multiple apps using concurrently
    const commands = appsToRun.map(app => `"pnpm --filter ${app} dev"`).join(' ');
    const names = appsToRun.join(',');
    
    console.log(chalk.green(`Starting ${names}...`));
    execSync(`pnpm exec concurrently --names "${names}" ${commands}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  }
}

// Handle errors
main().catch(error => {
  console.error(chalk.red('\n❌ Error:'), error.message);
  process.exit(1);
});