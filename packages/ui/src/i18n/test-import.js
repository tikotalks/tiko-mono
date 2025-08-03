// Test import to debug issue
const fs = require('fs')
const path = require('path')

// Check if files exist
const generatedDir = path.join(__dirname, 'generated')
console.log('Generated directory exists:', fs.existsSync(generatedDir))
console.log('Files in generated directory:')
if (fs.existsSync(generatedDir)) {
  const files = fs.readdirSync(generatedDir)
  files.forEach(file => console.log(' -', file))
  
  // Check index.ts
  const indexPath = path.join(generatedDir, 'index.ts')
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8')
    console.log('\nFirst 200 chars of index.ts:')
    console.log(indexContent.substring(0, 200))
  }
}