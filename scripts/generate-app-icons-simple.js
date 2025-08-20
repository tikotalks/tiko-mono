#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const https = require('https');

// Icon sizes configuration
const ICON_SIZES = {
  favicon: [16, 32, 48],
  apple: [57, 60, 72, 76, 114, 120, 144, 152, 180],
  android: [36, 48, 72, 96, 144, 192, 512],
  pwa: [192, 512],
  general: [64, 128, 256]
};

// Get all icon configurations
function getIconConfigs() {
  const configs = [];
  
  // Favicon sizes
  ICON_SIZES.favicon.forEach(size => {
    configs.push({
      size,
      type: 'favicon',
      filename: `favicon-${size}x${size}.png`,
      rounded: true
    });
  });
  
  // Apple touch icons
  ICON_SIZES.apple.forEach(size => {
    configs.push({
      size,
      type: 'apple',
      filename: `apple-touch-icon-${size}x${size}.png`,
      rounded: false
    });
  });
  
  // Android icons
  ICON_SIZES.android.forEach(size => {
    configs.push({
      size,
      type: 'android',
      filename: `android-chrome-${size}x${size}.png`,
      rounded: false
    });
  });
  
  // PWA icons
  ICON_SIZES.pwa.forEach(size => {
    configs.push({
      size,
      type: 'pwa',
      filename: `icon-${size}x${size}.png`,
      rounded: false
    });
  });
  
  // General purpose icons
  ICON_SIZES.general.forEach(size => {
    configs.push({
      size,
      type: 'general',
      filename: `icon-${size}.png`,
      rounded: false
    });
  });
  
  return configs;
}

// Load Tiko config
async function loadTikoConfig(appPath) {
  const configPath = path.join(appPath, 'tiko.config.ts');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`No tiko.config.ts found at ${configPath}`);
  }
  
  // Read the file and extract the config
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Simple regex parsing for the config values we need
  const appIconMatch = configContent.match(/appIcon:\s*['"]([^'"]+)['"]/);
  const primaryColorMatch = configContent.match(/primary:\s*['"]([^'"]+)['"]/);
  const appNameMatch = configContent.match(/appName:\s*['"]([^'"]+)['"]/);
  
  if (!appIconMatch || !primaryColorMatch) {
    throw new Error('Could not parse appIcon or primary color from tiko.config.ts');
  }
  
  return {
    appIcon: appIconMatch[1],
    primaryColor: primaryColorMatch[1],
    appName: appNameMatch ? appNameMatch[1] : 'App'
  };
}

// Convert color names to hex using Tiko UI color values
function getColorHex(colorName) {
  // These values are from packages/ui/src/types/color.ts
  const colors = {
    'purple': "#9049ce",
    'blue': "#7bcdff",
    'navy': "#2217bc",
    'royal-blue': "#146bee",
    'dark-blue': "#220d5c",
    'green': "#4fcf4f",
    'lime': "#8aff84",
    'yellow': "#ffc94b",
    'orange': "#f6883a",
    'maroon': "#b04f4f",
    'olive': "#b0b04f",
    'sand': "#e2d699",
    'charcoal': "#333333",
    'peach': "#ffb3a7",
    'teal': "#4fb0b0",
    'blue-gray': "#4f4fb0",
    'blue-green': "#4fb04f",
    'red': "#ff4d5e",
    'pink': "#ea7f9a",
    'brown': "#4f332d",
    'gray': "#b0b0b0",
    'black': "#111111",
    'white': "#ffffff",
    'turquoise': "#63d4c7",
    'cyan': "#baf0ff",
    'indigo': "#571ab4",
    'violet': "#dfbaff",
    'magenta': "#e524b5",
    'rose': "#ff7dff",
    'coral': "#ff7d7d",
    'gold': "#ffd700",
    'silver': "#c0c0c0",
    'bronze': "#cd7f32"
  };
  
  // Return the color if found, otherwise assume it's already a hex value
  return colors[colorName] || colorName;
}

// Simple HTTP request helper
async function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: headers
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Resolve image URL using Tiko's media service
async function resolveImageUrl(imageId) {
  // Check if it's already a full URL
  if (imageId.startsWith('http')) {
    return imageId;
  }
  
  // Check if it's a local file
  if (fs.existsSync(imageId)) {
    return `file://${path.resolve(imageId)}`;
  }
  
  // If it's a UUID, fetch the media entry from Supabase
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageId)) {
    const API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE';
    
    try {
      console.log(`  Fetching media info for UUID: ${imageId}`);
      
      const data = await fetchJSON(`${API_URL}/media?select=*&id=eq.${imageId}`, {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      });
      
      if (!data || data.length === 0) {
        throw new Error(`Media not found for ID: ${imageId}`);
      }
      
      const media = data[0];
      if (!media.original_url) {
        throw new Error(`No original_url found for media ID: ${imageId}`);
      }
      
      console.log(`  Found media URL: ${media.original_url}`);
      return media.original_url;
    } catch (error) {
      console.error(`  Failed to resolve media URL: ${error.message}`);
      // Fallback to direct storage URL
      return `https://xqjibuvlhfisvgvwgfbn.supabase.co/storage/v1/object/public/media/${imageId}`;
    }
  }
  
  // Otherwise assume it's a named icon in the default Supabase
  return `https://xqjibuvlhfisvgvwgfbn.supabase.co/storage/v1/object/public/media/icons/${imageId}.png`;
}

// Generate icons for a specific app
async function generateAppIcons(appPath) {
  console.log(`\nGenerating icons for ${path.basename(appPath)}...`);
  
  try {
    // Load config
    const config = await loadTikoConfig(appPath);
    console.log(`  App: ${config.appName}`);
    console.log(`  Icon: ${config.appIcon}`);
    console.log(`  Color: ${config.primaryColor}`);
    
    // Resolve image URL
    const imageUrl = await resolveImageUrl(config.appIcon);
    console.log(`  Image URL: ${imageUrl}`);
    
    // Create public/icons directory if it doesn't exist
    const publicDir = path.join(appPath, 'public');
    const iconsDir = path.join(publicDir, 'icons');
    await fs.ensureDir(iconsDir);
    
    // Since we don't have canvas installed, let's just log what would be generated
    console.log(`\n  ⚠️  Canvas module not installed. Icons generation requires manual setup.`);
    console.log(`  To generate icons, you need to:`);
    console.log(`  1. Install canvas: pnpm add -D canvas`);
    console.log(`  2. Run: pnpm build:app-icons ${path.basename(appPath)}`);
    console.log(`\n  Icon configuration:`);
    console.log(`  - Background: ${getColorHex(config.primaryColor)} (radial gradient)`);
    console.log(`  - Image: ${imageUrl}`);
    console.log(`  - Corner radius: 45% for favicons`);
    console.log(`  - Image size: 80% of icon size`);
    
    // Create a manifest file with the configuration
    const manifestPath = path.join(iconsDir, 'icon-config.json');
    await fs.writeJson(manifestPath, {
      appName: config.appName,
      appIcon: config.appIcon,
      primaryColor: config.primaryColor,
      primaryColorHex: getColorHex(config.primaryColor),
      imageUrl: imageUrl,
      generatedAt: new Date().toISOString(),
      sizes: getIconConfigs()
    }, { spaces: 2 });
    
    console.log(`\n  ✅ Icon configuration saved to: ${manifestPath}`);
  } catch (error) {
    console.error(`\n  ❌ Error: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const specificApp = args[0];
  
  console.log('🎨 Tiko App Icon Generator (Simple Version)\n');
  
  let appPaths = [];
  
  if (specificApp) {
    // Generate for specific app
    const appPath = path.join(process.cwd(), 'apps', specificApp);
    if (!fs.existsSync(appPath)) {
      console.error(`App "${specificApp}" not found at ${appPath}`);
      process.exit(1);
    }
    appPaths = [appPath];
  } else {
    // Generate for all apps
    const appsDir = path.join(process.cwd(), 'apps');
    const apps = await glob('*/tiko.config.ts', { cwd: appsDir });
    appPaths = apps.map(app => path.join(appsDir, path.dirname(app)));
    
    // Also check websites
    const websitesDir = path.join(process.cwd(), 'websites');
    if (fs.existsSync(websitesDir)) {
      const websites = await glob('*/tiko.config.ts', { cwd: websitesDir });
      appPaths.push(...websites.map(site => path.join(websitesDir, path.dirname(site))));
    }
    
    // Also check tools
    const toolsDir = path.join(process.cwd(), 'tools');
    if (fs.existsSync(toolsDir)) {
      const tools = await glob('*/tiko.config.ts', { cwd: toolsDir });
      appPaths.push(...tools.map(tool => path.join(toolsDir, path.dirname(tool))));
    }
  }
  
  console.log(`Found ${appPaths.length} app(s) to process`);
  
  for (const appPath of appPaths) {
    await generateAppIcons(appPath);
  }
  
  console.log('\n✨ All done!\n');
}

// Run the script
main().catch(console.error);