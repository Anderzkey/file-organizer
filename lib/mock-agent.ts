/**
 * Mock Agent - Simulates Claude API responses for testing
 * Returns realistic file operations without actual API calls
 */

export interface StreamEvent {
  type: 'thinking' | 'tool_start' | 'tool_result' | 'text'
  content?: string
  tool?: string
  toolInput?: unknown
  toolOutput?: unknown
  error?: string
}

const SAMPLE_FILES = [
  { name: 'report.pdf', size: 2048000, type: 'pdf', date: '2025-02-08' },
  { name: 'image.jpg', size: 3145728, type: 'image', date: '2025-02-07' },
  { name: 'document.docx', size: 512000, type: 'document', date: '2025-02-06' },
  { name: 'spreadsheet.xlsx', size: 1024000, type: 'spreadsheet', date: '2025-02-05' },
  { name: 'photo1.jpg', size: 4096000, type: 'image', date: '2025-02-04' },
  { name: 'photo2.jpg', size: 5242880, type: 'image', date: '2025-02-03' },
  { name: 'presentation.pptx', size: 8388608, type: 'presentation', date: '2025-02-02' },
  { name: 'data.csv', size: 512000, type: 'data', date: '2025-02-01' },
]

export async function* mockAgentStream(userMessage: string): AsyncGenerator<StreamEvent> {
  const lowerMessage = userMessage.toLowerCase()

  // Determine the user's intent
  const isListCommand = lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('files')
  const isOrganizeCommand = lowerMessage.includes('organize') || lowerMessage.includes('move') || lowerMessage.includes('categorize')
  const isSearchCommand = lowerMessage.includes('find') || lowerMessage.includes('search')

  // Simulate thinking
  yield {
    type: 'thinking',
    content: 'Analyzing your request...',
  }

  await sleep(300)

  if (isListCommand) {
    yield {
      type: 'thinking',
      content: 'User wants to list files. I should scan the Downloads directory.',
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'list_files',
    }

    await sleep(400)

    const fileList = SAMPLE_FILES.map(
      (f) => `  • ${f.name} (${formatBytes(f.size)}) - ${f.type}`
    ).join('\n')

    yield {
      type: 'tool_result',
      tool: 'list_files',
      toolOutput: `Found ${SAMPLE_FILES.length} files in ~/Downloads:\n${fileList}`,
    }

    await sleep(300)

    yield {
      type: 'text',
      content: `I found ${SAMPLE_FILES.length} files in your Downloads folder. Here's what I see:\n\n${fileList}\n\nWould you like me to organize these files?`,
    }
  } else if (isOrganizeCommand) {
    yield {
      type: 'thinking',
      content: 'User wants to organize files. I should create categories and move files.',
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'create_folder',
    }

    await sleep(200)

    yield {
      type: 'tool_result',
      tool: 'create_folder',
      toolOutput: 'Created folder: ~/Downloads/Documents',
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'create_folder',
    }

    await sleep(200)

    yield {
      type: 'tool_result',
      tool: 'create_folder',
      toolOutput: 'Created folder: ~/Downloads/Images',
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'move_file',
    }

    await sleep(300)

    yield {
      type: 'tool_result',
      tool: 'move_file',
      toolOutput: 'Moved 3 files to Documents',
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'move_file',
    }

    await sleep(300)

    yield {
      type: 'tool_result',
      tool: 'move_file',
      toolOutput: 'Moved 4 files to Images',
    }

    await sleep(300)

    yield {
      type: 'text',
      content: '✅ Organization complete!\n\nI created two folders and organized your files:\n• Documents: 3 files (reports, spreadsheets, presentations)\n• Images: 4 files (photos)\n\nYour Downloads folder is now organized!',
    }
  } else if (isSearchCommand) {
    const fileType = extractFileType(userMessage)

    yield {
      type: 'thinking',
      content: `User is searching for ${fileType} files.`,
    }

    await sleep(200)

    yield {
      type: 'tool_start',
      tool: 'search_files',
    }

    await sleep(350)

    const foundFiles = SAMPLE_FILES.filter((f) =>
      fileType ? f.type.toLowerCase().includes(fileType.toLowerCase()) : true
    )

    const resultList = foundFiles.map((f) => `  • ${f.name} (${formatBytes(f.size)})`).join('\n')

    yield {
      type: 'tool_result',
      tool: 'search_files',
      toolOutput: `Found ${foundFiles.length} ${fileType || ''} files:\n${resultList}`,
    }

    await sleep(300)

    yield {
      type: 'text',
      content: `Found ${foundFiles.length} ${fileType || 'matching'} files:\n\n${resultList}`,
    }
  } else {
    // Default response for unclear commands
    yield {
      type: 'thinking',
      content: 'User message is unclear. I should ask for clarification.',
    }

    await sleep(200)

    yield {
      type: 'text',
      content: 'I can help you organize your files! Try these commands:\n\n• "list my downloads" - Show all files\n• "organize downloads by type" - Group files by type\n• "find PDFs" - Search for specific file types\n• "move images to pictures" - Move files to a folder',
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function extractFileType(message: string): string {
  const patterns = ['pdf', 'image', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'excel', 'xlsx', 'csv', 'video', 'mp4']
  for (const pattern of patterns) {
    if (message.toLowerCase().includes(pattern)) {
      return pattern
    }
  }
  return ''
}
