#!/usr/bin/env node
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

// Use native fetch if available (Node 18+), otherwise use https module
const https = require('https');

async function fetch(url, options = {}) {
  if (typeof global.fetch !== 'undefined') {
    return global.fetch(url, options);
  }
  
  // Fallback to https module for older Node versions
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data),
          text: async () => data
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

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

// Create icon with gradient background
async function createIcon(imageUrl, primaryColor, size, rounded) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Get hex color
  const hexColor = getColorHex(primaryColor);
  
  // Create radial gradient
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, adjustBrightness(hexColor, -20)); // Darker in center
  gradient.addColorStop(1, hexColor); // Original color at edges
  
  // Fill background with gradient
  if (rounded) {
    const radius = size * 0.45; // 45% corner radius (3x more rounded)
    roundRect(ctx, 0, 0, size, size, radius);
    ctx.fillStyle = gradient;
    ctx.fill();
  } else {
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  
  try {
    // Load and draw the icon image
    const image = await loadImage(imageUrl);
    
    // Use full size (100%)
    const iconSize = size;
    const offset = 0;
    
    // Draw image centered at full size
    ctx.drawImage(
      image,
      offset,
      offset,
      iconSize,
      iconSize
    );
  } catch (error) {
    console.warn(`Could not load image from ${imageUrl}, using placeholder`);
    // Draw a placeholder if image fails to load
    ctx.fillStyle = 'white';
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', size/2, size/2);
  }
  
  return canvas.toBuffer('image/png');
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Adjust brightness of hex color
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

// Resolve image URL using Tiko's image resolver logic
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
      
      const response = await fetch(`${API_URL}/media?select=*&id=eq.${imageId}`, {
        headers: {
          'apikey': ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media info: ${response.statusText}`);
      }
      
      const data = await response.json();
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
    
    // Generate each icon size
    const configs = getIconConfigs();
    let generated = 0;
    
    for (const iconConfig of configs) {
      process.stdout.write(`\r  Generating icons... ${++generated}/${configs.length}`);
      
      const iconBuffer = await createIcon(
        imageUrl,
        config.primaryColor,
        iconConfig.size,
        iconConfig.rounded
      );
      
      const outputPath = path.join(iconsDir, iconConfig.filename);
      await fs.writeFile(outputPath, iconBuffer);
    }
    
    // Generate favicon.ico with multiple sizes
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = await Promise.all(
      faviconSizes.map(size => 
        createIcon(imageUrl, config.primaryColor, size, true)
      )
    );
    
    // For favicon.ico, we'll put it in both locations for compatibility
    // One in public/icons/ and one in public/ root
    const faviconIconsPath = path.join(iconsDir, 'favicon.ico');
    const faviconRootPath = path.join(publicDir, 'favicon.ico');
    await fs.writeFile(faviconIconsPath, faviconBuffers[1]);
    await fs.writeFile(faviconRootPath, faviconBuffers[1]);
    
    console.log(`\n  ✅ ${configs.length + 1} icons generated successfully!`);
  } catch (error) {
    console.error(`\n  ❌ Error: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const specificApp = args[0];
  
  console.log('🎨 Tiko App Icon Generator\n');
  
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