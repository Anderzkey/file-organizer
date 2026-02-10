/**
 * Filesystem Tools - Safe file operations with comprehensive error handling
 * All tools validate paths and handle partial failures gracefully
 */

import { promises as fsPromises } from 'fs'
import path from 'path'
import { validatePath, isDirectory } from './validation'

export interface FileInfo {
  name: string
  path: string
  size: number
  type: 'file' | 'directory' | 'symlink'
  mimeType?: string
  created: Date
  modified: Date
  accessed: Date
}

export interface OperationError {
  path: string
  code: string
  message: string
  retryable: boolean
}

export interface ToolResult<T> {
  success: boolean
  data?: T
  error?: OperationError | string
  partialResults?: any
}

/**
 * List files in a directory with metadata
 * Limit: 1000 files max to prevent token explosion
 */
export async function listFiles(directory: string): Promise<ToolResult<FileInfo[]>> {
  try {
    const validation = validatePath(directory)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid path',
      }
    }

    const realPath = validation.realPath!
    if (!isDirectory(realPath)) {
      return {
        success: false,
        error: 'Path is not a directory',
      }
    }

    const entries = await fsPromises.readdir(realPath, { withFileTypes: true })

    // Limit to 1000 entries to prevent token explosion
    if (entries.length > 1000) {
      const files = await Promise.all(
        entries.slice(0, 1000).map((entry) => getFileInfo(entry, realPath))
      )
      return {
        success: true,
        data: files,
        partialResults: {
          error: {
            path: realPath,
            code: 'LIMIT_EXCEEDED',
            message: `Directory contains ${entries.length} files, showing first 1000`,
            retryable: false,
          } as any,
        },
      }
    }

    const files = await Promise.all(
      entries.map((entry) => getFileInfo(entry, realPath))
    )
    return { success: true, data: files }
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    }
  }
}

/**
 * Get detailed file information
 */
export async function getFileInfo(fileOrPath: string | any, parentDir?: string): Promise<FileInfo> {
  let filePath: string
  let entry: any

  if (typeof fileOrPath === 'string') {
    const validation = validatePath(fileOrPath)
    if (!validation.valid) {
      throw new Error(`Invalid path: ${validation.error}`)
    }
    filePath = validation.realPath!
  } else {
    // It's a Dirent object from readdir
    entry = fileOrPath
    filePath = path.join(parentDir || '', entry.name)
  }

  const stat = await fsPromises.stat(filePath)
  const name = path.basename(filePath)
  const ext = path.extname(name).toLowerCase()

  let type: 'file' | 'directory' | 'symlink' = 'file'
  if (stat.isDirectory()) type = 'directory'
  if (stat.isSymbolicLink()) type = 'symlink'

  return {
    name,
    path: filePath,
    size: stat.size,
    type,
    mimeType: getMimeType(ext),
    created: stat.birthtime,
    modified: stat.mtime,
    accessed: stat.atime,
  }
}

/**
 * Create a folder with error handling for duplicates
 */
export async function createFolder(folderPath: string): Promise<ToolResult<{ path: string }>> {
  try {
    const validation = validatePath(folderPath)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const realPath = validation.realPath!

    // Check if it already exists
    try {
      const stat = await fsPromises.stat(realPath)
      if (stat.isDirectory()) {
        return {
          success: true,
          data: { path: realPath },
          error: 'Folder already exists',
        }
      } else {
        return {
          success: false,
          error: 'Path exists but is not a directory',
        }
      }
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e
      }
    }

    // Create the folder
    await fsPromises.mkdir(realPath, { recursive: true })
    return { success: true, data: { path: realPath } }
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    }
  }
}

/**
 * Move a file from source to destination
 */
export async function moveFile(source: string, destination: string): Promise<ToolResult<{ source: string; destination: string }>> {
  try {
    const srcValidation = validatePath(source)
    if (!srcValidation.valid) {
      return { success: false, error: `Invalid source: ${srcValidation.error}` }
    }

    const destValidation = validatePath(destination)
    if (!destValidation.valid) {
      return { success: false, error: `Invalid destination: ${destValidation.error}` }
    }

    const srcPath = srcValidation.realPath!
    let destPath = destValidation.realPath!

    // Check if source exists
    try {
      await fsPromises.stat(srcPath)
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return { success: false, error: 'Source file does not exist' }
      }
      throw e
    }

    // If destination is a directory, move file into it
    if (isDirectory(destPath)) {
      const fileName = path.basename(srcPath)
      destPath = path.join(destPath, fileName)
    }

    // Check for existing file at destination
    try {
      await fsPromises.stat(destPath)
      // File exists - auto-rename
      const ext = path.extname(destPath)
      const base = destPath.slice(0, -ext.length)
      let counter = 1
      let newPath = `${base} (${counter})${ext}`
      while (true) {
        try {
          await fsPromises.stat(newPath)
          counter++
          newPath = `${base} (${counter})${ext}`
        } catch {
          destPath = newPath
          break
        }
      }
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e
      }
    }

    // Ensure destination directory exists
    const destDir = path.dirname(destPath)
    await fsPromises.mkdir(destDir, { recursive: true })

    // Move the file
    await fsPromises.rename(srcPath, destPath)
    return {
      success: true,
      data: { source: srcPath, destination: destPath },
    }
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    }
  }
}

/**
 * Search for files by name and type
 * Phase 1: Simple name + type filtering
 */
export async function searchFiles(
  directory: string,
  criteria: {
    namePattern?: string
    fileType?: string
  }
): Promise<ToolResult<FileInfo[]>> {
  try {
    const validation = validatePath(directory)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const realPath = validation.realPath!
    if (!isDirectory(realPath)) {
      return { success: false, error: 'Path is not a directory' }
    }

    const listResult = await listFiles(realPath)
    if (!listResult.success || !listResult.data) {
      return listResult
    }

    let results = listResult.data

    // Filter by name pattern
    if (criteria.namePattern) {
      const pattern = new RegExp(criteria.namePattern, 'i')
      results = results.filter((f) => pattern.test(f.name))
    }

    // Filter by file type
    if (criteria.fileType) {
      const typeExt = criteria.fileType.toLowerCase()
      results = results.filter((f) => {
        const ext = path.extname(f.name).toLowerCase().slice(1)
        return ext === typeExt || f.type === 'directory'
      })
    }

    return { success: true, data: results }
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    }
  }
}

/**
 * Helper: Convert file extension to MIME type
 */
function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

/**
 * Helper: Format error for tool result
 */
function formatError(error: unknown): OperationError | string {
  if (error instanceof Error) {
    const code = (error as any).code || 'UNKNOWN_ERROR'
    const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'EAGAIN', 'EBUSY']
    return {
      path: '',
      code,
      message: error.message,
      retryable: retryableCodes.includes(code),
    }
  }
  return 'Unknown error occurred'
}
