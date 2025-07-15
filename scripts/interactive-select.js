#!/usr/bin/env node

const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgReset: '\x1b[49m'
};

/**
 * Interactive selection with arrow keys
 * @param {string} title - Title to display
 * @param {Array} options - Array of {name, description?, value?} objects
 * @returns {Promise<any>} Selected option value or name
 */
async function interactiveSelect(title, options) {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Hide cursor
    process.stdout.write('\x1B[?25l');

    function render() {
      // Move cursor to home position and clear entire screen
      process.stdout.write('\x1B[H\x1B[2J');
      
      console.log(`\n${colors.blue}${colors.bright}${title}${colors.reset}\n`);
      
      options.forEach((option, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? `${colors.green}❯${colors.reset} ` : '  ';
        const highlight = isSelected ? colors.bright : '';
        const name = option.name || option;
        
        console.log(`${prefix}${highlight}${name}${colors.reset}`);
      });
      
      console.log(`\n${colors.dim}Use arrow keys to navigate, Enter to select, Ctrl+C to exit${colors.reset}`);
    }

    // Initial render
    render();

    // Enable keypress events
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        // Show cursor
        process.stdout.write('\x1B[?25h');
        console.log(`\n${colors.yellow}Cancelled${colors.reset}\n`);
        process.exit(0);
      }

      if (key.name === 'up') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      } else if (key.name === 'down') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      } else if (key.name === 'return') {
        // Show cursor
        process.stdout.write('\x1B[?25h');
        
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        
        const selected = options[selectedIndex];
        resolve(selected.value !== undefined ? selected.value : (selected.name || selected));
      }
    });
  });
}

module.exports = { interactiveSelect, colors };