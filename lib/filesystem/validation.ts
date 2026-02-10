/**
 * Path Validation - Comprehensive security checks for filesystem access
 * Prevents directory traversal, symlink escapes, and system directory access
 */

import path from 'path'
import fs from 'fs'

// Whitelisted base directories
const WHITELIST_DIRS = [
  path.join(process.env.HOME || '', 'Downloads'),
  path.join(process.env.HOME || '', 'Documents'),
  path.join(process.env.HOME || '', 'Desktop'),
  path.join(process.env.HOME || '', 'Pictures'),
]

export interface ValidationResult {
  valid: boolean
  realPath?: string
  error?: string
}

/**
 * Validates a user-provided path to ensure it's safe for file operations
 * Checks for:
 * - Directory traversal attempts
 * - Symlink escapes
 * - System directory access
 * - Path depth limits
 */
export function validatePath(userPath: string): ValidationResult {
  try {
    // 1. Normalize Unicode (NFC form)
    const normalized = userPath.normalize('NFC')

    // 2. Resolve all path components (removes .., .)
    const resolved = path.resolve(normalized)

    // 3. Resolve symlinks to their real target
    // lstat first to check if it's a symlink without following it
    try {
      const stat = fs.lstatSync(resolved)

      if (stat.isSymbolicLink()) {
        // It's a symlink - resolve to the real path
        const realPath = fs.realpathSync(resolved)

        // Verify the target is within whitelist
        const isWhitelisted = WHITELIST_DIRS.some((dir) =>
          realPath.startsWith(dir + path.sep) || realPath === dir
        )

        if (!isWhitelisted) {
          return {
            valid: false,
            error: `Symlink target is outside allowed directories: ${realPath}`,
          }
        }

        return { valid: true, realPath }
      }
    } catch (e) {
      // Path doesn't exist yet - that's ok, still validate it
      // Just need to check the directory components
    }

    // 4. For non-symlinks or non-existent paths, check if within whitelist
    const isWhitelisted = WHITELIST_DIRS.some((dir) =>
      resolved.startsWith(dir + path.sep) || resolved === dir
    )

    if (!isWhitelisted) {
      return {
        valid: false,
        error: `Path is outside allowed directories. Allowed: ${WHITELIST_DIRS.join(', ')}`,
      }
    }

    // 5. Check path depth (prevent extremely deep paths)
    const depth = resolved.split(path.sep).length
    if (depth > 50) {
      return {
        valid: false,
        error: 'Path depth exceeds limit',
      }
    }

    return { valid: true, realPath: resolved }
  } catch (error) {
    return {
      valid: false,
      error: `Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validates multiple paths efficiently
 */
export function validatePaths(
  paths: string[]
): { valid: string[]; invalid: Array<{ path: string; error: string }> } {
  const valid: string[] = []
  const invalid: Array<{ path: string; error: string }> = []

  for (const p of paths) {
    const result = validatePath(p)
    if (result.valid && result.realPath) {
      valid.push(result.realPath)
    } else {
      invalid.push({ path: p, error: result.error || 'Unknown error' })
    }
  }

  return { valid, invalid }
}

/**
 * Checks if a path exists
 */
export function pathExists(checkPath: string): boolean {
  const validation = validatePath(checkPath)
  if (!validation.valid || !validation.realPath) {
    return false
  }

  try {
    fs.statSync(validation.realPath)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if a path is a directory
 */
export function isDirectory(checkPath: string): boolean {
  const validation = validatePath(checkPath)
  if (!validation.valid || !validation.realPath) {
    return false
  }

  try {
    const stat = fs.statSync(validation.realPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

/**
 * Gets the whitelisted base directories
 */
export function getWhitelistedDirs(): string[] {
  return WHITELIST_DIRS.filter((dir) => {
    try {
      fs.statSync(dir)
      return true
    } catch {
      return false
    }
  })
}
