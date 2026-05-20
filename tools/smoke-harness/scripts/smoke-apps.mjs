#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
const defaultApps = ['cards', 'sequence', 'type', 'yes-no', 'radio', 'tiko', 'timer', 'todo']
const args = process.argv.slice(2)
const buildOnly = args.includes('--build-only')
const requestedApps = args.filter((arg) => !arg.startsWith('--'))
const apps = requestedApps.length > 0 ? requestedApps : defaultApps
const results = []

for (const app of apps) {
  const packagePath = resolve(repoRoot, 'apps', app, 'package.json')
  if (!existsSync(packagePath)) {
    throw new Error(`Unknown app "${app}". Expected ${packagePath}`)
  }
}

for (const packageName of ['@tiko/core', '@tiko/ui', '@tiko/animations']) {
  results.push(await step(`package:${packageName}`, () => runPnpm(['--filter', packageName, 'build'])))
}

for (const app of apps) {
  results.push(await step(`app:${app}:build`, () => runPnpm(['--filter', app, 'build'])))
}

if (!buildOnly) {
  results.push(await step('playwright:e2e', () => runPnpm(['--dir', 'tools/smoke-harness', 'smoke:e2e'])))
}

printResults(results)

if (results.some((result) => !result.ok)) {
  process.exitCode = 1
}

async function step(name, action) {
  const startedAt = Date.now()
  try {
    await action()
    return { name, ok: true, durationMs: Date.now() - startedAt }
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function printResults(stepResults) {
  console.log('\nTiko smoke harness results')
  console.log('==========================')
  for (const result of stepResults) {
    const status = result.ok ? 'PASS' : 'FAIL'
    const duration = `${Math.round(result.durationMs / 100) / 10}s`
    console.log(`${status} ${result.name} (${duration})`)
    if (result.error) {
      console.log(`  ${result.error}`)
    }
  }
}

function runPnpm(commandArgs) {
  const pnpmCli = process.env.npm_execpath
  if (pnpmCli) {
    return run(process.execPath, [pnpmCli, ...commandArgs])
  }

  return run('corepack', ['pnpm', ...commandArgs])
}

function run(command, commandArgs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
      } else {
        reject(new Error(`${command} ${commandArgs.join(' ')} exited with ${code}`))
      }
    })
  })
}
