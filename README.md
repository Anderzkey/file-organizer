# AI File Organizer

A chat-based file organizer powered by an AI agent. Type natural language commands — the agent understands what you want and executes file operations automatically, with real-time progress display.

## What it does

Instead of manually sorting files into folders, you talk to the app:

- `"Organize my downloads by file type"` → creates folders, moves files
- `"Find all PDFs"` → scans and lists them
- `"Move images to Documents"` → done
- `"Show me large files"` → finds files over 10MB

The AI agent parses your intent, plans the operations, and executes them — showing progress in real time.

## Tech Stack

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS** for UI
- **AI Agent** with tool-calling architecture (file system operations as tools)
- **SSE Streaming** for real-time progress updates
- Undo support for reversing operations

## How to run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

The app uses an agent loop pattern:
1. User sends a natural language command
2. Agent interprets the command and selects tools
3. Tools execute file operations (list, move, organize, search)
4. Results stream back to the UI in real time
5. Operations can be undone

Built as a learning project to explore AI agent patterns with real filesystem interactions.
