import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Radio App', () => {
  it('App.vue file exists and has valid template', () => {
    const appPath = path.resolve(__dirname, './App.vue')
    const content = fs.readFileSync(appPath, 'utf-8')
    expect(content).toContain('NxWelcome')
    expect(content).toContain('title="radio"')
  })
})
