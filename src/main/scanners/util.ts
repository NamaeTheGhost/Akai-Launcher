import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execFileP = promisify(execFile)

/**
 * Run a command line, suppressing errors. Returns null on failure.
 * Uses a generous buffer because reg query / dir output can be large.
 */
export async function runCmd(command: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileP(command, args, {
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    })
    return stdout
  } catch {
    return null
  }
}

/**
 * Read a single registry value via `reg query`.
 * Returns the raw string value or null if missing.
 */
export async function regGetValue(
  keyPath: string,
  valueName: string,
  view?: '32' | '64'
): Promise<string | null> {
  const args = ['query', keyPath, '/v', valueName]
  if (view === '32') args.push('/reg:32')
  if (view === '64') args.push('/reg:64')
  const out = await runCmd('reg', args)
  if (!out) return null
  // Match indented line: "    valueName    REG_TYPE    rest"
  const escaped = valueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `^\\s+${escaped}\\s+REG_(?:SZ|EXPAND_SZ|MULTI_SZ|DWORD|QWORD|BINARY)\\s+(.*)$`,
    'mi'
  )
  const m = out.match(re)
  return m ? m[1].trim() : null
}

/**
 * Read the (Default) value for a registry key.
 */
export async function regGetDefault(keyPath: string, view?: '32' | '64'): Promise<string | null> {
  const args = ['query', keyPath, '/ve']
  if (view === '32') args.push('/reg:32')
  if (view === '64') args.push('/reg:64')
  const out = await runCmd('reg', args)
  if (!out) return null
  const m = out.match(/^\s+\(Default\)\s+REG_(?:SZ|EXPAND_SZ|MULTI_SZ)\s+(.*)$/im)
  return m ? m[1].trim() : null
}

/**
 * List immediate subkey names under the given registry key.
 */
export async function regListSubkeys(keyPath: string, view?: '32' | '64'): Promise<string[]> {
  const args = ['query', keyPath]
  if (view === '32') args.push('/reg:32')
  if (view === '64') args.push('/reg:64')
  const out = await runCmd('reg', args)
  if (!out) return []
  const lines = out
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.startsWith('HKEY_'))
  // First HKEY line is the queried key itself; the rest are subkeys.
  return lines
    .slice(1)
    .map((l) => l.split('\\').pop() || l)
    .filter(Boolean)
}

/**
 * Read all values of a single registry key as { name -> value }.
 */
export async function regGetAllValues(
  keyPath: string,
  view?: '32' | '64'
): Promise<Record<string, string>> {
  const args = ['query', keyPath]
  if (view === '32') args.push('/reg:32')
  if (view === '64') args.push('/reg:64')
  const out = await runCmd('reg', args)
  if (!out) return {}
  const result: Record<string, string> = {}
  const re = /^\s+([^\s]+)\s+REG_(?:SZ|EXPAND_SZ|MULTI_SZ|DWORD|QWORD|BINARY)\s+(.*)$/gim
  let m: RegExpExecArray | null
  while ((m = re.exec(out)) !== null) {
    const name = m[1].trim()
    if (name === '(Default)') continue
    result[name] = m[2].trim()
  }
  return result
}

/**
 * Test if a path exists.
 */
export async function pathExists(p: string | undefined | null): Promise<boolean> {
  if (!p) return false
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Try several paths; return the first existing one.
 */
export async function firstExisting(
  paths: (string | undefined | null)[]
): Promise<string | undefined> {
  for (const p of paths) {
    if (p && (await pathExists(p))) return p
  }
  return undefined
}

/**
 * Read a UTF-8 / UTF-16 text file gracefully.
 */
export async function readTextFile(p: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(p)
    if (
      buf.length >= 2 &&
      ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))
    ) {
      const le = buf[0] === 0xff
      return buf.subarray(2).toString(le ? 'utf16le' : ('utf16be' as BufferEncoding))
    }
    return buf.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Minimal Valve KeyValues / VDF parser. Sufficient for libraryfolders.vdf and
 * appmanifest_*.acf files, which use only quoted-string keys/values and
 * brace-delimited subsections.
 */
type VdfNode = { [k: string]: string | VdfNode }

export function parseVdf(text: string): VdfNode {
  const root: VdfNode = {}
  const stack: VdfNode[] = [root]
  let i = 0
  let pendingKey: string | null = null

  const skipWhitespace = (): void => {
    while (i < text.length) {
      const c = text[i]
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
        i++
      } else if (c === '/' && text[i + 1] === '/') {
        while (i < text.length && text[i] !== '\n') i++
      } else {
        break
      }
    }
  }

  const readQuoted = (): string => {
    if (text[i] !== '"') return ''
    i++
    let out = ''
    while (i < text.length && text[i] !== '"') {
      if (text[i] === '\\' && i + 1 < text.length) {
        const n = text[i + 1]
        if (n === 'n') out += '\n'
        else if (n === 't') out += '\t'
        else if (n === 'r') out += '\r'
        else out += n
        i += 2
      } else {
        out += text[i++]
      }
    }
    if (text[i] === '"') i++
    return out
  }

  while (i < text.length) {
    skipWhitespace()
    if (i >= text.length) break
    const c = text[i]
    if (c === '}') {
      i++
      stack.pop()
      pendingKey = null
      continue
    }
    if (c === '{') {
      i++
      const child: VdfNode = {}
      const parent = stack[stack.length - 1]
      if (pendingKey != null) {
        parent[pendingKey] = child
        stack.push(child)
        pendingKey = null
      } else {
        // unexpected, skip
      }
      continue
    }
    if (c !== '"') {
      i++
      continue
    }
    const token = readQuoted()
    if (pendingKey == null) {
      pendingKey = token
    } else {
      const parent = stack[stack.length - 1]
      parent[pendingKey] = token
      pendingKey = null
    }
  }

  return root
}

/**
 * Convert an HKEY_... value path that came from the registry (e.g. with
 * forward slashes or trailing quotes) to a usable filesystem path.
 */
export function normalizePath(p: string): string {
  let out = p.trim()
  if ((out.startsWith('"') && out.endsWith('"')) || (out.startsWith("'") && out.endsWith("'"))) {
    out = out.slice(1, -1)
  }
  return path.normalize(out.replace(/\//g, path.sep))
}
