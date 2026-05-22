import { app } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface PythonResult<T> {
  ok: boolean
  value?: T
  error?: string
}

const SPAWN_TIMEOUT_MS = 5000

/**
 * Resolve the python executable to invoke. In dev we rely on the system
 * interpreter; in packaged builds we expect a PyInstaller `--onedir` bundle
 * placed under `resources/python/` by electron-builder's `extraResources`.
 */
export function resolvePythonInvocation(): { command: string; baseArgs: string[] } | null {
  if (app.isPackaged) {
    // Production builds intentionally ship without a Python interpreter; the TS
    // implementation is the source of truth and the verify-with-Python button is
    // hidden in the renderer. Short-circuit to avoid the filesystem probe.
    return null
  }

  const scriptPath = join(app.getAppPath(), 'python', 'em_calc.py')
  if (!existsSync(scriptPath)) return null

  const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']
  return { command: candidates[0]!, baseArgs: [scriptPath] }
}

let availabilityCache: boolean | null = null

export async function isPythonAvailable(): Promise<boolean> {
  if (availabilityCache !== null) return availabilityCache

  const invocation = resolvePythonInvocation()
  if (!invocation) {
    availabilityCache = false
    return false
  }

  availabilityCache = await new Promise<boolean>((resolve) => {
    const proc = spawn(invocation.command, [...invocation.baseArgs, '--help'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })
    let resolved = false
    const finish = (ok: boolean) => {
      if (!resolved) {
        resolved = true
        resolve(ok)
      }
    }
    proc.on('error', () => finish(false))
    proc.on('close', (code) => finish(code === 0))
    setTimeout(() => {
      if (!resolved) {
        proc.kill()
        finish(false)
      }
    }, SPAWN_TIMEOUT_MS)
  })

  return availabilityCache
}

export type PythonComputeError =
  | { kind: 'spawn_failed'; detail: string }
  | { kind: 'timeout' }
  | { kind: 'non_zero_exit'; code: number | null; stderr: string }
  | { kind: 'invalid_json'; stdout: string }

export async function runPythonAction(
  action: 'bandwidth' | 'aperture-efficiency',
  args: string[],
): Promise<{ ok: true; raw: PythonResult<unknown> } | { ok: false; error: PythonComputeError }> {
  const invocation = resolvePythonInvocation()
  if (!invocation) {
    return { ok: false, error: { kind: 'spawn_failed', detail: 'python_not_found' } }
  }

  return new Promise((resolve) => {
    const proc = spawn(invocation.command, [...invocation.baseArgs, action, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    const settle = (
      result: { ok: true; raw: PythonResult<unknown> } | { ok: false; error: PythonComputeError },
    ) => {
      if (!settled) {
        settled = true
        resolve(result)
      }
    }

    const timer = setTimeout(() => {
      proc.kill()
      settle({ ok: false, error: { kind: 'timeout' } })
    }, SPAWN_TIMEOUT_MS)

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    proc.on('error', (err) => {
      clearTimeout(timer)
      settle({ ok: false, error: { kind: 'spawn_failed', detail: err.message } })
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        settle({ ok: false, error: { kind: 'non_zero_exit', code, stderr: stderr.trim() } })
        return
      }
      try {
        const parsed = JSON.parse(stdout.trim()) as PythonResult<unknown>
        settle({ ok: true, raw: parsed })
      } catch {
        settle({ ok: false, error: { kind: 'invalid_json', stdout: stdout.trim() } })
      }
    })
  })
}
