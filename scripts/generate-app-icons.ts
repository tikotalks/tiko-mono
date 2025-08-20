#!/usr/bin/env node
import { Canvas, createCanvas, loadImage } from 'canvas';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import sharp from 'sharp';

// Icon sizes configuration
const ICON_SIZES = {
  favicon: [16, 32, 48],
  apple: [57, 60, 72, 76, 114, 120, 144, 152, 180],
  android: [36, 48, 72, 96, 144, 192, 512],
  pwa: [192, 512],
  general: [64, 128, 256]
};

interface IconConfig {
  size: number;
  type: 'favicon' | 'apple' | 'android' | 'pwa' | 'general';
  filename: string;
  rounded: boolean;
}

// Get all icon configurations
function getIconConfigs(): IconConfig[] {
  const configs: IconConfig[] = [];
  
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
async function loadTikoConfig(appPath: string) {
  const configPath = path.join(appPath, 'tiko.config.ts');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`No tiko.config.ts found at ${configPath}`);
  }
  
  // We need to use a different approach since we can't directly import TS files
  // Read the file and extract the config
  const configContent = await fs.readFile(configPath, 'utf-8');
  
  // Simple regex parsing for the config values we need
  const appIconMatch = configContent.match(/appIcon:\s*['"]([^'"]+)['"]/);
  const primaryColorMatch = configContent.match(/primary:\s*['"]([^'"]+)['"]/);
  
  if (!appIconMatch || !primaryColorMatch) {
    throw new Error('Could not parse appIcon or primary color from tiko.config.ts');
  }
  
  return {
    appIcon: appIconMatch[1],
    primaryColor: primaryColorMatch[1]
  };
}

// Convert color names to hex
function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e'
  };
  
  return colors[colorName] || colorName;
}

// Create icon with gradient background
async function createIcon(
  imageUrl: string,
  primaryColor: string,
  size: number,
  rounded: boolean
): Promise<Buffer> {
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
    const radius = size * 0.15; // 15% corner radius
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
    
    // Calculate 80% size
    const iconSize = size * 0.8;
    const offset = size * 0.1;
    
    // Draw image centered
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
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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
function adjustBrightness(hex: string, percent: number): string {
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

// Resolve image URL using Tiko's image resolver
async function resolveImageUrl(imageId: string): Promise<string> {
  // For now, we'll use a placeholder approach
  // In production, this would use the actual image resolver
  const baseUrl = process.env.VITE_SUPABASE_URL || 'https://tikoapi.com';
  
  // Check if it's already a full URL
  if (imageId.startsWith('http')) {
    return imageId;
  }
  
  // Check if it's a local file
  if (fs.existsSync(imageId)) {
    return `file://${path.resolve(imageId)}`;
  }
  
  // Otherwise, assume it's a media ID
  return `${baseUrl}/storage/v1/object/public/media/${imageId}`;
}

// Generate icons for a specific app
async function generateAppIcons(appPath: string) {
  console.log(`Generating icons for ${appPath}...`);
  
  try {
    // Load config
    const config = await loadTikoConfig(appPath);
    console.log(`Config loaded:`, config);
    
    // Resolve image URL
    const imageUrl = await resolveImageUrl(config.appIcon);
    console.log(`Image URL resolved: ${imageUrl}`);
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(appPath, 'public');
    await fs.ensureDir(publicDir);
    
    // Generate each icon size
    const configs = getIconConfigs();
    for (const iconConfig of configs) {
      console.log(`Generating ${iconConfig.filename}...`);
      
      const iconBuffer = await createIcon(
        imageUrl,
        config.primaryColor,
        iconConfig.size,
        iconConfig.rounded
      );
      
      const outputPath = path.join(publicDir, iconConfig.filename);
      await fs.writeFile(outputPath, iconBuffer);
    }
    
    // Generate favicon.ico with multiple sizes
    console.log('Generating favicon.ico...');
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = await Promise.all(
      faviconSizes.map(size => 
        createIcon(imageUrl, config.primaryColor, size, true)
      )
    );
    
    // For favicon.ico, we'll just use the 32x32 version
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await fs.writeFile(faviconPath, faviconBuffers[1]);
    
    console.log(`✅ Icons generated successfully for ${path.basename(appPath)}`);
  } catch (error) {
    console.error(`❌ Error generating icons for ${appPath}:`, error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const specificApp = args[0];
  
  let appPaths: string[] = [];
  
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
  }
  
  console.log(`Found ${appPaths.length} app(s) to process`);
  
  for (const appPath of appPaths) {
    await generateAppIcons(appPath);
  }
  
  console.log('\n✨ All done!');
}

// Run the script
main().catch(console.error);