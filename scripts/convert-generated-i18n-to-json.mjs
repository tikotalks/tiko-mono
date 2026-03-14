#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const GENERATED_DIR = path.join(process.cwd(), 'packages/core/src/i18n/generated')
const OUTPUT_DIR = path.join(process.cwd(), 'packages/core/src/i18n/json')

function log(...args) {
  console.log('[i18n-json]', ...args)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function extractObjectLiteral(tsContent) {
  // Find the object assigned to the const variable (skip import braces)
  let searchFrom = 0
  while (true) {
    const constIdx = tsContent.indexOf('const ', searchFrom)
    if (constIdx === -1) break
    const eqIdx = tsContent.indexOf('=', constIdx)
    if (eqIdx === -1) break
    const braceStart = tsContent.indexOf('{', eqIdx)
    if (braceStart === -1) break

    // Attempt to extract balanced braces from braceStart
    let depth = 0
    for (let i = braceStart; i < tsContent.length; i++) {
      const ch = tsContent[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          return tsContent.slice(braceStart, i + 1)
        }
      }
    }

    // If not returned, move search forward
    searchFrom = eqIdx + 1
  }
  return null
}

function dotToNested(flatObj) {
  const nested = {}
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split('.')
    let cur = nested
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        cur[part] = value
      } else {
        if (!cur[part] || typeof cur[part] !== 'object') cur[part] = {}
        cur = cur[part]
      }
    }
  }
  return nested
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    return null
  }
}

function convertTsFileToJson(tsFilePath, outPath) {
  const content = fs.readFileSync(tsFilePath, 'utf8')
  const objLiteral = extractObjectLiteral(content)
  if (!objLiteral) throw new Error('Could not extract object literal from ' + tsFilePath)

  // The TS language files have JSON-compatible key/value pairs (quoted keys and string values)
  const flat = safeJsonParse(objLiteral)
  if (!flat || typeof flat !== 'object') throw new Error('Parsed object invalid in ' + tsFilePath)

  const nested = dotToNested(flat)
  ensureDir(path.dirname(outPath))
  fs.writeFileSync(outPath, JSON.stringify(nested, null, 2) + '\n', 'utf8')
}

function main() {
  ensureDir(OUTPUT_DIR)
  const files = fs.readdirSync(GENERATED_DIR)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts')

  log('Found', files.length, 'generated language files')

  let ok = 0, fail = 0
  for (const file of files) {
    const src = path.join(GENERATED_DIR, file)
    const out = path.join(OUTPUT_DIR, file.replace(/\.ts$/, '.json'))
    try {
      convertTsFileToJson(src, out)
      ok++
      log('Converted', file, '->', path.relative(process.cwd(), out))
    } catch (e) {
      fail++
      console.warn('Failed to convert', file, e.message)
    }
  }

  log('Done. Success:', ok, 'Failed:', fail)
}

main()
