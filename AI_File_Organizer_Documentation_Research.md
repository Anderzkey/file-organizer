# AI-Powered File Organizer Web App - Documentation Research

**Research Date:** February 2026
**Focus:** 2025 Best Practices and Recent Documentation

---

## 1. CLAUDE API TOOL USE AND STREAMING CAPABILITIES

### 1.1 Overview

The Claude API provides comprehensive support for tool use and streaming, making it ideal for building AI-powered file organizers. The latest 2025 enhancements include fine-grained tool streaming, which reduces latency when handling large tool parameters.

**Current Model:** Claude Opus 4.6 (Latest)

### 1.2 Fine-Grained Tool Streaming

**What It Is:**
Fine-grained tool streaming enables streaming of tool use parameter values without buffering or JSON validation, dramatically reducing the latency to begin receiving large parameters.

**Configuration:**
Set `eager_input_streaming: true` on any tool where you want fine-grained streaming enabled, combined with `"stream": true` on your request.

**Key Benefits:**
- Reduces latency from 15+ seconds to ~3 seconds for large parameters
- Streams tool use chunks faster without word breaks
- Longer chunks due to different chunking behavior

**Implementation Example (TypeScript):**

```typescript
const message = await anthropic.messages.stream({
  model: "claude-opus-4-6",
  max_tokens: 65536,
  tools: [{
    name: "organize_files",
    description: "Organize files in a directory",
    eager_input_streaming: true,  // Enable fine-grained streaming
    input_schema: {
      type: "object",
      properties: {
        file_paths: {
          type: "array",
          items: { type: "string" },
          description: "Array of file paths to organize"
        },
        destination_dir: {
          type: "string",
          description: "Destination directory for organized files"
        }
      },
      required: ["file_paths", "destination_dir"]
    }
  }],
  messages: [{
    role: "user",
    content: "Organize all documents in the downloads folder by type"
  }]
});

for await (const chunk of message) {
  if (chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'input_json_delta') {
    // Handle streaming parameter values
    console.log(chunk.delta.partial_json);
  }
}
```

**Important Considerations:**

1. **Partial JSON Handling:** You may receive invalid or incomplete JSON when using fine-grained streaming. Implement robust error handling:

```typescript
// Handle invalid JSON from fine-grained streaming
function handlePartialJson(invalidJson: string) {
  return JSON.stringify({
    INVALID_JSON: invalidJson
  });
}
```

2. **Token Limits:** If `max_tokens` is reached during streaming, the stream may end mid-parameter. You must write specific support to handle incomplete inputs.

### 1.3 Standard Streaming Implementation

**Basic Streaming Pattern:**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const stream = await client.messages.stream({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: "Analyze these files for organization"
  }]
});

// Consume stream events
stream.on('text', (text) => {
  console.log(text);
});

// Or get final message
const message = await stream.finalMessage();
```

### 1.4 Tool Use with Streaming

**Event Flow for Tool Use:**
1. `message_start` - Initial message with empty content
2. `content_block_start` - Tool definition begins
3. Multiple `content_block_delta` events - Parameters stream in (with `input_json_delta`)
4. `content_block_stop` - Tool definition complete
5. `message_delta` - Top-level changes
6. `message_stop` - Stream ended

**Full Tool Use Streaming Example:**

```typescript
const stream = await client.messages.stream({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  tools: [{
    name: "categorize_files",
    description: "Categorize files based on type",
    input_schema: {
      type: "object",
      properties: {
        file_data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              size: { type: "number" },
              type: { type: "string" }
            }
          }
        }
      }
    }
  }],
  messages: [{
    role: "user",
    content: "Categorize the files I'm about to send"
  }]
});

// Process streaming events
for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    if (event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
    } else if (event.delta.type === 'input_json_delta') {
      // Handle streaming tool parameters
      console.log('Parameter chunk:', event.delta.partial_json);
    }
  } else if (event.type === 'message_stop') {
    console.log('Stream complete');
  }
}
```

### 1.5 Agent SDK for Advanced Workflows

**Key Features:**
- Built-in tool execution orchestration
- Automatic context management and retries
- Async iterator for streaming messages as Claude thinks
- Handles tool execution, observation, and decision cycles

**Basic Agent Pattern:**

```typescript
// Pseudocode - actual implementation varies by SDK
const agent = new Agent({
  model: "claude-opus-4-6",
  tools: [fileOrganizationTool, fileCategoryTool]
});

for await (const step of agent.run(userRequest)) {
  // Each iteration: reasoning, tool call, result, or outcome
  if (step.type === 'tool_call') {
    console.log('Tool:', step.name, 'Args:', step.args);
  } else if (step.type === 'text') {
    console.log('Claude:', step.content);
  }
}
```

### 1.6 Best Practices for Claude API Integration

1. **Extended Thinking for Complex Tasks:** Turn on selectively (high-value operations)
2. **Streaming for UX:** Always use streaming for real-time feedback in web apps
3. **Error Recovery:** Capture partial responses and resume from interruption point
4. **Token Management:** Monitor usage in message_delta events (cumulative tokens)
5. **Tool Error Handling:** Wrap invalid JSON responses in INVALID_JSON wrapper

---

## 2. REACT PATTERNS FOR REAL-TIME STATUS DISPLAY

### 2.1 React Hooks for State Management

**Core Hooks for Streaming UI:**

1. **useState** - Manage component state
2. **useEffect** - Side effects and cleanup
3. **useSyncExternalStore** - Subscribe to external state (SSE, WebSockets)
4. **useActionState** - Handle async form actions with pending state
5. **useFormStatus** - Track form submission status

### 2.2 Real-Time Status Display with Streaming

**Custom Hook Pattern - useStreamingStatus:**

```typescript
import { useState, useEffect } from 'react';

interface StreamingStatus {
  isStreaming: boolean;
  message: string;
  progress: number;
  error: string | null;
}

export function useStreamingStatus(eventSource?: EventSource) {
  const [status, setStatus] = useState<StreamingStatus>({
    isStreaming: false,
    message: '',
    progress: 0,
    error: null
  });

  useEffect(() => {
    if (!eventSource) return;

    setStatus(prev => ({ ...prev, isStreaming: true }));

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(prev => ({
          ...prev,
          message: data.message,
          progress: data.progress || prev.progress,
          error: null
        }));
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          error: 'Failed to parse message'
        }));
      }
    };

    const handleError = () => {
      setStatus(prev => ({
        ...prev,
        isStreaming: false,
        error: 'Connection lost'
      }));
    };

    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('message', handleMessage);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [eventSource]);

  return status;
}
```

### 2.3 Agent State Transitions Display

**Type-Safe State Management:**

```typescript
import { useState, useCallback } from 'react';

// Discriminated union for agent states
type AgentState =
  | { type: 'idle' }
  | { type: 'analyzing'; files: number }
  | { type: 'processing'; currentFile: string; progress: number }
  | { type: 'organizing'; movedCount: number; totalCount: number }
  | { type: 'complete'; result: OrganizationResult }
  | { type: 'error'; message: string };

export function useAgentState() {
  const [state, setState] = useState<AgentState>({ type: 'idle' });

  const updateState = useCallback((newState: AgentState) => {
    setState(newState);
  }, []);

  return { state, updateState };
}
```

**Status Display Component:**

```typescript
import React from 'react';

interface AgentStatusProps {
  state: AgentState;
}

export function AgentStatus({ state }: AgentStatusProps) {
  switch (state.type) {
    case 'idle':
      return <div>Ready to organize files</div>;

    case 'analyzing':
      return (
        <div>
          <p>Analyzing {state.files} files...</p>
          <ProgressBar value={undefined} />
        </div>
      );

    case 'processing':
      return (
        <div>
          <p>Processing: {state.currentFile}</p>
          <ProgressBar
            value={state.progress}
            max={100}
          />
        </div>
      );

    case 'organizing':
      return (
        <div>
          <p>Organizing files: {state.movedCount}/{state.totalCount}</p>
          <ProgressBar
            value={state.movedCount}
            max={state.totalCount}
          />
        </div>
      );

    case 'complete':
      return (
        <div className="success">
          <p>Organization complete!</p>
          <p>Moved {state.result.filesOrganized} files into {state.result.categoriesCreated} categories</p>
        </div>
      );

    case 'error':
      return <div className="error">Error: {state.message}</div>;
  }
}
```

### 2.4 Real-Time Updates with useSyncExternalStore

**For Network Status and External Events:**

```typescript
import { useSyncExternalStore } from 'react';

function useSSEStatus(url: string) {
  return useSyncExternalStore(
    // Subscribe function
    (callback) => {
      const eventSource = new EventSource(url);
      eventSource.addEventListener('message', callback);
      return () => {
        eventSource.removeEventListener('message', callback);
        eventSource.close();
      };
    },
    // Get client-side snapshot
    () => localStorage.getItem('agentStatus') || '',
    // Get server-side snapshot (for SSR)
    () => ''
  );
}
```

### 2.5 Form Submission with Streaming

**useActionState Pattern for File Organization:**

```typescript
'use client';

import { useState } from 'react';
import { useActionState } from 'react';

async function organizeFilesAction(
  previousState: any,
  formData: FormData
) {
  const directory = formData.get('directory');

  const response = await fetch('/api/organize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory })
  });

  if (!response.ok) throw new Error('Failed to organize files');
  return response.json();
}

export function FileOrganizerForm() {
  const [state, formAction, isPending] = useActionState(
    organizeFilesAction,
    null
  );

  return (
    <form action={formAction}>
      <input
        type="text"
        name="directory"
        placeholder="Enter directory path"
        disabled={isPending}
      />
      <button disabled={isPending} type="submit">
        {isPending ? 'Organizing...' : 'Organize Files'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">{state.message}</p>}
    </form>
  );
}
```

### 2.6 React Server Components with Streaming

**2025 Recommended Pattern:**

```typescript
// app/organizer/page.tsx (Server Component)
import { Suspense } from 'react';
import FileOrganizer from '@/components/FileOrganizer';
import LoadingFallback from '@/components/LoadingFallback';

async function getDirectoryStructure(path: string) {
  // This runs on the server
  const result = await fetch('/api/fs', {
    method: 'POST',
    body: JSON.stringify({ path })
  });
  return result.json();
}

export default async function OrganizerPage() {
  const directoryPromise = getDirectoryStructure('/home/user');

  return (
    <div>
      <h1>File Organizer</h1>
      <Suspense fallback={<LoadingFallback />}>
        <FileOrganizer dataPromise={directoryPromise} />
      </Suspense>
    </div>
  );
}

// components/FileOrganizer.tsx (Client Component)
'use client';

import { use } from 'react';

export default function FileOrganizer({ dataPromise }) {
  const data = use(dataPromise);

  return (
    <div>
      {/* Interactive UI using data from server */}
    </div>
  );
}
```

### 2.7 Best Practices for Real-Time Display

1. **Use Discriminated Unions:** Type-safe state transitions (as shown above)
2. **Separate Server and Client:** Server for heavy compute, client for interactivity
3. **Progressive Enhancement:** Show fallbacks while streaming
4. **Error Boundaries:** Wrap components that might error
5. **Memoization:** Use `useMemo` for expensive computations
6. **Custom Hooks:** Extract reusable streaming logic
7. **Accessibility:** Update ARIA live regions for status changes

---

## 3. NODE.JS FILE SYSTEM BEST PRACTICES

### 3.1 Async/Await with fs/promises

**Why fs/promises is Best:**
- Cleaner async/await syntax than callbacks
- Better error handling with try/catch
- Non-blocking I/O operations
- Promise-based composability

**Basic Pattern:**

```typescript
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

async function organizeDirectory(sourcePath: string) {
  try {
    // Read all files
    const files = await readdir(sourcePath);

    for (const file of files) {
      const fullPath = join(sourcePath, file);

      // Get file stats
      const stats = await stat(fullPath);

      if (stats.isFile()) {
        // Process file
        console.log(`File: ${file}`);
      }
    }
  } catch (error) {
    console.error('Failed to organize directory:', error);
  }
}
```

### 3.2 Type-Safe File Operations

**File Metadata Interface:**

```typescript
import { FileHandle, open } from 'node:fs/promises';

interface FileMetadata {
  name: string;
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
  modified: Date;
}

async function getFileMetadata(filePath: string): Promise<FileMetadata> {
  const stats = await stat(filePath);
  const name = filePath.split('/').pop() || '';
  const extension = name.includes('.') ? name.split('.').pop() || '' : '';

  return {
    name,
    path: filePath,
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    extension,
    modified: stats.mtime
  };
}
```

### 3.3 Concurrent File Operations

**Safe Concurrent Reads:**

```typescript
import { readFile } from 'node:fs/promises';

async function readMultipleFiles(filePaths: string[]): Promise<Map<string, string>> {
  // Use Promise.all for concurrent reads
  const results = await Promise.all(
    filePaths.map(async (path) => {
      try {
        const content = await readFile(path, 'utf-8');
        return [path, content] as [string, string];
      } catch (error) {
        console.error(`Failed to read ${path}:`, error);
        return [path, ''] as [string, string];
      }
    })
  );

  return new Map(results);
}

// Usage with concurrency limit
async function readFilesWithLimit(
  filePaths: string[],
  limit: number = 5
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (let i = 0; i < filePaths.length; i += limit) {
    const batch = filePaths.slice(i, i + limit);
    const batchResults = await readMultipleFiles(batch);

    for (const [path, content] of batchResults) {
      results.set(path, content);
    }
  }

  return results;
}
```

### 3.4 FileHandle for Multiple Operations

**Use FileHandle when multiple operations needed:**

```typescript
import { open } from 'node:fs/promises';

async function processFileWithMultipleOps(filePath: string): Promise<void> {
  let fileHandle: FileHandle | null = null;

  try {
    // Open file for multiple operations
    fileHandle = await open(filePath, 'r');

    // Read stats
    const stats = await fileHandle.stat();
    console.log('File size:', stats.size);

    // Read content
    const buffer = Buffer.alloc(1024);
    const { bytesRead } = await fileHandle.read(buffer, 0, 1024, 0);
    const content = buffer.toString('utf-8', 0, bytesRead);

    console.log('Content preview:', content);
  } catch (error) {
    console.error('File operation failed:', error);
  } finally {
    // Always close handle
    if (fileHandle) {
      await fileHandle.close();
    }
  }
}
```

### 3.5 Path Construction Best Practice

**Always Use path.join():**

```typescript
import { join, resolve } from 'node:path';

// Bad: manual string concatenation
const badPath = `/home/user/` + fileName;

// Good: use path module
const goodPath = join('/home', 'user', fileName);

// Absolute path
const absolutePath = resolve(__dirname, 'uploads', fileName);

// Handle relative paths safely
const safePath = join(process.cwd(), '..', 'data', fileName);
```

### 3.6 Recursive Directory Operations

**Safe Recursive Implementation:**

```typescript
async function* walkDirectory(dirPath: string): AsyncGenerator<FileMetadata> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively walk subdirectories
      yield* walkDirectory(fullPath);
    } else if (entry.isFile()) {
      const stats = await stat(fullPath);
      yield {
        name: entry.name,
        path: fullPath,
        size: stats.size,
        isFile: true,
        isDirectory: false,
        extension: entry.name.split('.').pop() || '',
        modified: stats.mtime
      };
    }
  }
}

// Usage
async function processAllFiles(dirPath: string): Promise<void> {
  for await (const file of walkDirectory(dirPath)) {
    console.log(`Processing: ${file.path}`);
  }
}
```

### 3.7 Error Handling Patterns

**Comprehensive Error Handling:**

```typescript
import { mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

class FileOperationError extends Error {
  constructor(
    message: string,
    public code: string,
    public filePath: string
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

async function safeFileOperation(
  operation: () => Promise<void>,
  context: string
): Promise<void> {
  try {
    await operation();
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new FileOperationError(
        `File not found during ${context}`,
        'ENOENT',
        error.path
      );
    } else if (error.code === 'EACCES') {
      throw new FileOperationError(
        `Permission denied during ${context}`,
        'EACCES',
        error.path
      );
    } else if (error.code === 'EISDIR') {
      throw new FileOperationError(
        `Is a directory during ${context}`,
        'EISDIR',
        error.path
      );
    }
    throw error;
  }
}

// Usage
async function moveFileWithFallback(from: string, to: string): Promise<void> {
  await safeFileOperation(async () => {
    // Try direct rename first (faster)
    try {
      await rename(from, to);
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        // Cross-device link, copy then delete
        await cp(from, to);
        await rm(from);
      } else {
        throw error;
      }
    }
  }, `moving ${from} to ${to}`);
}
```

### 3.8 Performance Considerations

1. **Use Promises over Callbacks:** Modern best practice
2. **Batch Operations:** Use Promise.all() for concurrent operations
3. **Limit Concurrency:** Prevent file descriptor exhaustion
4. **Use Generators:** For memory-efficient directory walking
5. **Monitor Open Handles:** Ensure all FileHandles are closed
6. **Cache Metadata:** Don't repeatedly stat() same file

---

## 4. TYPESCRIPT PATTERNS FOR TYPE-SAFE TOOL IMPLEMENTATIONS

### 4.1 Discriminated Unions for Tool Definitions

**Core Pattern:**

```typescript
// Base interface for all tools
interface BaseTool {
  id: string;
  name: string;
  description: string;
}

// Specific tool types
interface CategorizeTool extends BaseTool {
  type: 'categorize';
  maxCategories: number;
  categoryRules?: Record<string, string[]>;
}

interface MoveTool extends BaseTool {
  type: 'move';
  overwrite: boolean;
  createMissing: boolean;
}

interface DeleteTool extends BaseTool {
  type: 'delete';
  requireConfirm: boolean;
  backupBeforeDelete: boolean;
}

// Discriminated union
type FileOrganizationTool = CategorizeTool | MoveTool | DeleteTool;

// Type-safe tool processor
function executeTool(tool: FileOrganizationTool): Promise<void> {
  switch (tool.type) {
    case 'categorize':
      return categorizaFiles(tool.categoryRules);
    case 'move':
      return moveFiles(tool.overwrite, tool.createMissing);
    case 'delete':
      return deleteFiles(tool.requireConfirm, tool.backupBeforeDelete);
  }
}
```

### 4.2 Type-Safe Tool Parameters

**Generic Tool Definition:**

```typescript
// Tool parameter interface
interface ToolParameter<T> {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  schema?: T;
}

// Tool definition with parameters
interface ToolDefinition<TParams extends Record<string, any>> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: {
      [K in keyof TParams]: ToolParameter<TParams[K]>;
    };
    required: (keyof TParams)[];
  };
}

// Usage with specific parameters
interface OrganizeFilesParams {
  sourcePath: string;
  targetPath: string;
  strategy: 'category' | 'size' | 'date';
  recursive: boolean;
}

const organizeFilesTool: ToolDefinition<OrganizeFilesParams> = {
  name: 'organize_files',
  description: 'Organize files according to specified strategy',
  parameters: {
    type: 'object',
    properties: {
      sourcePath: {
        name: 'sourcePath',
        type: 'string',
        description: 'Root directory to organize',
        required: true
      },
      targetPath: {
        name: 'targetPath',
        type: 'string',
        description: 'Target directory for organized files',
        required: true
      },
      strategy: {
        name: 'strategy',
        type: 'string',
        description: 'Organization strategy',
        required: true
      },
      recursive: {
        name: 'recursive',
        type: 'boolean',
        description: 'Whether to process subdirectories',
        required: false
      }
    },
    required: ['sourcePath', 'targetPath', 'strategy']
  }
};
```

### 4.3 Type Guards for Runtime Validation

**Custom Type Guards:**

```typescript
// Type guard for tool parameters
function isOrganizeFilesParams(
  params: unknown
): params is OrganizeFilesParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const obj = params as Record<string, unknown>;

  return (
    typeof obj.sourcePath === 'string' &&
    typeof obj.targetPath === 'string' &&
    (obj.strategy === 'category' ||
     obj.strategy === 'size' ||
     obj.strategy === 'date') &&
    (typeof obj.recursive === 'boolean' || obj.recursive === undefined)
  );
}

// Usage
async function executeOrganizeTool(params: unknown): Promise<void> {
  if (!isOrganizeFilesParams(params)) {
    throw new Error('Invalid parameters for organize_files tool');
  }

  // Now TypeScript knows params is OrganizeFilesParams
  await organizeFiles(params);
}
```

### 4.4 Zod for Schema Validation

**Modern Validation Pattern:**

```typescript
import { z } from 'zod';

// Define schema with Zod
const OrganizeFilesParamsSchema = z.object({
  sourcePath: z.string().min(1, 'Source path required'),
  targetPath: z.string().min(1, 'Target path required'),
  strategy: z.enum(['category', 'size', 'date']),
  recursive: z.boolean().default(true),
  dryRun: z.boolean().default(false)
});

type OrganizeFilesParams = z.infer<typeof OrganizeFilesParamsSchema>;

// Safe parsing
async function executeOrganizeTool(
  rawParams: unknown
): Promise<{ success: boolean; data?: OrganizeFilesParams; error?: string }> {
  try {
    const params = OrganizeFilesParamsSchema.parse(rawParams);
    await organizeFiles(params);
    return { success: true, data: params };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join('; ')
      };
    }
    return { success: false, error: String(error) };
  }
}
```

### 4.5 Generic Result Types

**Result Pattern for Errors:**

```typescript
// Discriminated union for success/error results
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

interface FileOrganizationResult {
  filesProcessed: number;
  filesMoved: number;
  categoriesCreated: string[];
  duration: number;
}

async function organizeFilesWithResult(
  params: OrganizeFilesParams
): Promise<Result<FileOrganizationResult>> {
  try {
    const startTime = Date.now();
    const result = await organizeFilesInternal(params);

    return {
      success: true,
      data: {
        ...result,
        duration: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Usage with type narrowing
const result = await organizeFilesWithResult(params);

if (result.success) {
  console.log(`Organized ${result.data.filesProcessed} files`);
} else {
  console.error(`Failed: ${result.error.message}`);
}
```

### 4.6 Generics for Tool Handler Functions

**Reusable Tool Handler Pattern:**

```typescript
interface ToolHandler<TInput, TOutput> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<Result<TOutput>>;
  schema: z.ZodSchema<TInput>;
}

// Create typed handler
function createToolHandler<TInput, TOutput>(
  config: ToolHandler<TInput, TOutput>
): ToolHandler<TInput, TOutput> {
  return {
    ...config,
    execute: async (input) => {
      try {
        const validatedInput = await config.schema.parseAsync(input);
        const output = await config.execute(validatedInput);
        return output;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    }
  };
}

// Define specific tool
const organizeFilesTool = createToolHandler<
  OrganizeFilesParams,
  FileOrganizationResult
>({
  name: 'organize_files',
  description: 'Organize files in a directory',
  schema: OrganizeFilesParamsSchema,
  execute: async (input) => {
    // Implementation
    return {
      success: true,
      data: { /* ... */ }
    };
  }
});
```

### 4.7 Best Practices Summary

1. **Use Discriminated Unions:** For type-safe polymorphism
2. **Implement Type Guards:** For runtime validation
3. **Leverage Zod/Ajv:** For schema validation
4. **Use Generic Constraints:** For reusable patterns
5. **Create Result Types:** For error handling
6. **Avoid `any`:** Always prefer specific types
7. **Test Type Guards:** Ensure runtime safety matches compile-time types

---

## 5. FRONTEND FRAMEWORKS FOR AGENT STATE TRANSITIONS

### 5.1 React 19 with Server Components (Recommended 2025)

**Architecture Overview:**

```
Server (Heavy Compute, AI)
    ↓ Streams Data
React Server Components
    ↓ Serializes UI
Browser
    ↓ Interactive
Client Components
```

**Full Implementation:**

```typescript
// app/api/organize/route.ts
import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  const { sourcePath } = await request.json();

  const client = new Anthropic();

  // Stream response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = await client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          tools: [
            {
              name: 'analyze_directory',
              description: 'Analyze directory structure',
              input_schema: {
                type: 'object',
                properties: {
                  path: { type: 'string' }
                },
                required: ['path']
              }
            }
          ],
          messages: [
            {
              role: 'user',
              content: `Analyze and organize files in ${sourcePath}`
            }
          ]
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta') {
            controller.enqueue(
              `data: ${JSON.stringify(event)}\n\n`
            );
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// components/FileOrganizerApp.tsx
'use client';

import { useState, useEffect } from 'react';

type AgentState =
  | { type: 'idle' }
  | { type: 'analyzing'; fileCount: number }
  | { type: 'processing'; fileName: string; progress: number }
  | { type: 'complete'; result: any };

export function FileOrganizerApp() {
  const [state, setState] = useState<AgentState>({ type: 'idle' });
  const [path, setPath] = useState('');

  const handleOrganize = async () => {
    setState({ type: 'analyzing', fileCount: 0 });

    const response = await fetch('/api/organize', {
      method: 'POST',
      body: JSON.stringify({ sourcePath: path })
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                // Update UI with streaming text
                console.log(event.delta.text);
              }
            }
          }
        }
      }

      setState({ type: 'complete', result: {} });
    } catch (error) {
      console.error('Stream error:', error);
    }
  };

  return (
    <div>
      <input
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="Enter directory path"
      />
      <button onClick={handleOrganize} disabled={state.type !== 'idle'}>
        {state.type === 'idle' ? 'Organize Files' : 'Processing...'}
      </button>

      {state.type === 'analyzing' && (
        <p>Analyzing {state.fileCount} files...</p>
      )}
      {state.type === 'processing' && (
        <div>
          <p>Processing: {state.fileName}</p>
          <progress value={state.progress} max={100} />
        </div>
      )}
      {state.type === 'complete' && (
        <p>Organization complete!</p>
      )}
    </div>
  );
}
```

### 5.2 State Management Patterns

**Context + Hooks Pattern:**

```typescript
import { createContext, useContext, ReactNode } from 'react';

type OrganizationState = {
  status: 'idle' | 'analyzing' | 'organizing' | 'complete' | 'error';
  progress: number;
  currentFile: string;
  error: string | null;
  results: any | null;
};

type OrganizationContextType = {
  state: OrganizationState;
  startOrganization: (path: string) => Promise<void>;
  cancelOrganization: () => void;
  reset: () => void;
};

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrganizationState>({
    status: 'idle',
    progress: 0,
    currentFile: '',
    error: null,
    results: null
  });

  const startOrganization = async (path: string) => {
    setState(s => ({ ...s, status: 'analyzing' }));
    // Implementation...
  };

  const cancelOrganization = () => {
    setState(s => ({ ...s, status: 'idle' }));
  };

  const reset = () => {
    setState({
      status: 'idle',
      progress: 0,
      currentFile: '',
      error: null,
      results: null
    });
  };

  return (
    <OrganizationContext.Provider
      value={{ state, startOrganization, cancelOrganization, reset }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
```

### 5.3 Transition Animations

**Smooth State Changes:**

```typescript
import { useTransition } from 'react';

export function FileOrganizerUI() {
  const [isPending, startTransition] = useTransition();
  const { state, startOrganization } = useOrganization();

  const handleOrganize = () => {
    startTransition(async () => {
      await startOrganization('/path/to/files');
    });
  };

  return (
    <div className="organizer">
      <button
        onClick={handleOrganize}
        disabled={isPending}
        className={`btn ${isPending ? 'loading' : ''}`}
      >
        {isPending ? '⏳ Processing...' : 'Organize Files'}
      </button>

      <AnimatedStatus
        state={state}
        className={isPending ? 'fade-in' : 'fade-out'}
      />
    </div>
  );
}

function AnimatedStatus({
  state,
  className
}: {
  state: OrganizationState;
  className: string;
}) {
  return (
    <div className={`status ${className}`}>
      {state.status === 'analyzing' && (
        <div className="spinner">Analyzing files...</div>
      )}
      {state.status === 'organizing' && (
        <div>
          <p>{state.currentFile}</p>
          <progress value={state.progress} max={100} />
        </div>
      )}
      {state.status === 'complete' && (
        <div className="success">
          Successfully organized {state.results?.filesProcessed} files!
        </div>
      )}
      {state.status === 'error' && (
        <div className="error">{state.error}</div>
      )}
    </div>
  );
}
```

### 5.4 Server-Sent Events Integration

**Clean SSE Hook:**

```typescript
function useSSEStream(url: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed'>('idle');

  useEffect(() => {
    setStatus('connecting');
    const eventSource = new EventSource(url);

    eventSource.onopen = () => setStatus('open');

    eventSource.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data));
      } catch {
        setData(event.data);
      }
    };

    eventSource.onerror = () => {
      setError(new Error('Stream connection lost'));
      setStatus('closed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setStatus('closed');
    };
  }, [url]);

  return { data, error, status };
}

// Usage
function StreamingResults() {
  const { data, status, error } = useSSEStream('/api/organize/stream');

  if (status === 'connecting') return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (status === 'closed') return <div>Stream ended</div>;

  return (
    <div>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### 5.5 Best Practices for 2025

1. **Prefer Server Components:** Reduces JavaScript sent to browser
2. **Use Streaming SSR:** Progressive rendering with Suspense
3. **Implement Error Boundaries:** Graceful error handling
4. **Monitor Performance:** Use Core Web Vitals
5. **Accessibility First:** ARIA labels for status changes
6. **Type Everything:** Full TypeScript coverage
7. **Test State Transitions:** Use Vitest or Jest

---

## 6. INTEGRATION ARCHITECTURE SUMMARY

### 6.1 Complete Tech Stack (2025 Recommended)

```
Frontend:
├── React 19 (with Server Components)
├── TypeScript 5.3+
├── TailwindCSS (styling)
└── Zod (validation)

Backend:
├── Node.js 22+
├── Express/Next.js
├── fs/promises (file operations)
└── @anthropic-ai/sdk

AI Engine:
├── Claude API (streaming)
├── Tool use with eager_input_streaming
└── Agent SDK (optional)

Data Flow:
Server Component → Claude Streaming → SSE → Client Component → UI Update
```

### 6.2 Complete Working Example

```typescript
// Full integration example
// app/organizer/layout.tsx
import { OrganizationProvider } from '@/context/OrganizationContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  );
}

// app/api/organize/route.ts
import { Anthropic } from '@anthropic-ai/sdk';
import { analyzeDirectory, moveFiles } from '@/lib/fileOps';

export async function POST(request: Request) {
  const { sourcePath } = await request.json();

  const client = new Anthropic();

  // Create ReadableStream for streaming
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          tools: [
            {
              name: 'analyze_files',
              description: 'Analyze directory for organization',
              eager_input_streaming: true,
              input_schema: {
                type: 'object',
                properties: {
                  directory: { type: 'string' },
                  extension_rules: {
                    type: 'object',
                    additionalProperties: { type: 'string' }
                  }
                },
                required: ['directory', 'extension_rules']
              }
            },
            {
              name: 'organize_files',
              description: 'Execute file organization',
              eager_input_streaming: true,
              input_schema: {
                type: 'object',
                properties: {
                  operations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        source: { type: 'string' },
                        destination: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          ],
          messages: [{
            role: 'user',
            content: `Analyze and organize files in ${sourcePath}.
                     Group by: documents (.pdf, .doc, .docx),
                     images (.jpg, .png, .gif),
                     code (.js, .ts, .py),
                     other`
          }]
        });

        // Process streaming events
        for await (const event of messageStream) {
          const eventData = {
            timestamp: new Date().toISOString(),
            event: event.type,
            data: event
          };

          controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);

          // Execute tool calls
          if (event.type === 'content_block_start' &&
              event.content_block.type === 'tool_use') {
            console.log(`Tool called: ${event.content_block.name}`);
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// components/FileOrganizer.tsx
'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { AgentStatus } from '@/components/AgentStatus';

export function FileOrganizerForm() {
  const [path, setPath] = useState('');
  const { state, startOrganization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await startOrganization(path);
  };

  return (
    <form onSubmit={handleSubmit} className="organizer-form">
      <div>
        <label htmlFor="path">Directory Path:</label>
        <input
          id="path"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/path/to/files"
          disabled={state.status !== 'idle'}
        />
      </div>

      <button
        type="submit"
        disabled={state.status !== 'idle' || !path}
      >
        {state.status === 'idle' ? 'Organize Files' : 'Processing...'}
      </button>

      <AgentStatus state={state} />
    </form>
  );
}
```

### 6.3 Error Handling Strategy

```typescript
// Comprehensive error handling
type ToolError = {
  type: 'validation' | 'execution' | 'file_system' | 'api';
  message: string;
  details?: unknown;
};

async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: ToolError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: `Invalid JSON in ${context}: ${error.message}`,
          details: error
        }
      };
    }

    if (error instanceof Error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          error: {
            type: 'file_system',
            message: `File not found in ${context}`,
            details: error
          }
        };
      }
    }

    return {
      success: false,
      error: {
        type: 'execution',
        message: `Failed during ${context}`,
        details: error
      }
    };
  }
}
```

---

## KEY TAKEAWAYS FOR 2025

### Recommended Architecture
1. **Backend:** Node.js with fs/promises + Claude API streaming
2. **Frontend:** React 19 with Server Components
3. **Streaming:** Server-Sent Events for real-time updates
4. **Type Safety:** TypeScript + Zod for validation
5. **State:** Discriminated unions for type-safe state machines

### Critical Practices
- Always use `eager_input_streaming: true` for large tool parameters
- Implement proper error handling for partial JSON
- Use fs/promises for all file operations (never sync)
- Close FileHandles explicitly
- Implement error boundaries in React
- Test discriminated unions thoroughly
- Monitor token usage in message_delta events

### Performance Optimizations
- Stream responses progressively
- Batch concurrent file operations with concurrency limits
- Use generators for memory-efficient directory walking
- Cache file metadata when appropriate
- Limit open file descriptors

---

## SOURCES AND REFERENCES

### Official Documentation
- [Claude API - Tool Use & Streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use)
- [Claude API - Fine-Grained Tool Streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming)
- [Claude API - Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [React 19 Documentation](https://react.dev)
- [Node.js fs/promises API](https://nodejs.org/api/fs/promises.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook)

### 2025 Best Practices Resources
- [React Server Components - Josh W. Comeau](https://www.joshwcomeau.com/react/server-components/)
- [React 19 Deep Dive - Medium](https://medium.com/@Amanda0/)
- [fs.promises Mastering - DEV Community](https://dev.to/sovannaro/mastering-the-fspromises-module-in-nodejs-4210)
- [TypeScript Advanced Patterns - DEV Community](https://dev.to/frontendtoolstech/typescript-advanced-patterns-writing-cleaner-safer-code-in-2025-4gbn)
- [Type Guards for AI-Era - DEV Community](https://dev.to/paulthedev/type-guards-in-typescript-2025-next-level-type-safety-for-ai-era-developers-6me)

---

**Document Generated:** February 2026
**Latest Model Used:** Claude Opus 4.6
**Recommended Node.js Version:** 22 LTS
**Recommended React Version:** 19+
**Recommended TypeScript Version:** 5.3+
