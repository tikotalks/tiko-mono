#!/usr/bin/env node

console.log('Testing icon generation...');

// Test 1: Check if we can read the tiko config
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'apps/cards/tiko.config.ts');
console.log('Checking config at:', configPath);

if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf-8');
  console.log('Config exists!');
  
  const appIconMatch = content.match(/appIcon:\s*['"]([^'"]+)['"]/);
  const primaryColorMatch = content.match(/primary:\s*['"]([^'"]+)['"]/);
  
  console.log('App Icon:', appIconMatch ? appIconMatch[1] : 'not found');
  console.log('Primary Color:', primaryColorMatch ? primaryColorMatch[1] : 'not found');
  
  if (appIconMatch && appIconMatch[1]) {
    const iconId = appIconMatch[1];
    console.log('\nIcon ID is a UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(iconId));
    
    // Test the API call
    const https = require('https');
    const API_URL = 'https://kejvhvszhevfwgsztedf.supabase.co/rest/v1';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZodnN6aGV2Zndnc3p0ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODg2MTIsImV4cCI6MjA2NzQ2NDYxMn0.xUYXxNodJTpTwChlKbuBSojVJqX9CDW87aVISEUc2rE';
    
    const url = `${API_URL}/media?select=*&id=eq.${iconId}`;
    console.log('\nFetching from:', url);
    
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\nResponse status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Response data:', json);
          if (json && json[0] && json[0].original_url) {
            console.log('\nResolved image URL:', json[0].original_url);
          }
        } catch (e) {
          console.error('Failed to parse response:', e);
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
    });
    
    req.end();
  }
} else {
  console.log('Config not found');
}