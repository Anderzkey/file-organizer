# File Organizer Implementation Plan

## Overview

Build an AI-powered file organizer web application with a chat interface that allows users to organize files using natural language commands. The agent displays real-time reasoning and tool execution, while users maintain full feature parity through manual UI controls.

**Core Vision**: "Organize my downloads" → Agent plans, executes, and shows progress in real-time

## Problem Statement

Users struggle with file organization—downloads accumulate, photos scatter, documents cluster without structure. Current solutions require manual categorization or inflexible rules. This app solves it with conversational AI that:
- Understands natural language requests ("organize downloads by type and date")
- Executes file operations safely with preview/confirmation
- Shows agent reasoning transparently
- Maintains user-agent feature parity (everything the agent can do, users can do manually)

## Proposed Solution

A web application with:
1. **Chat interface** - User sends commands, agent responds with plans and execution
2. **Real-time progress** - Stream agent reasoning and tool execution status
3. **Core tools** - list files, move, create folders, search, get metadata
4. **Manual controls** - Sidebar UI for direct tool invocation matching agent capabilities
5. **Safety features** - Preview mode, operation history, undo capability

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────┐
│     Next.js 16 + React 19 Frontend      │
│  (Chat + Manual Tools + Progress View)  │
└────────────────┬────────────────────────┘
                 │ /api/agent-stream
┌────────────────▼────────────────────────┐
│   Node.js Backend (API Routes)          │
│  (Tool execution, streaming response)   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Claude API (Tool Use + Streaming)     │
│   (Agent reasoning and planning)        │
└─────────────────────────────────────────┘
         │              │           │
      ┌──▼───┬──────────▼──┬────────▼──┐
      │ Node │  Filesystem │ Subprocess│
      │      │   (fs/promises)         │
      │      │             │           │
   File System Operations (Sandboxed)
```

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js API routes with fs/promises
- **AI**: Claude API (Opus 4.5/4.6) with tool use + streaming
- **Streaming**: Server-Sent Events (SSE) for real-time updates
- **Storage**: localStorage for operations history, settings
- **Deployment**: Vercel

### Security Model

**Filesystem Sandbox** (Initial MVP):
- Whitelist: User's home directory only (`~/Downloads`, `~/Documents`, `~/Desktop`, `~/Pictures`)
- No system directory access (`/System`, `/Windows`, `/etc`, etc.)
- Path traversal protection: validate all paths with `path.resolve()` and boundary check
- No permission elevation (fail on access denied, don't request sudo)
- Symlink detection: warn user, don't follow into different directories

**Tool Authorization**:
- Read tools (`list_files`, `search_files`, `get_file_info`) - no permission needed
- Write tools (`move_file`, `create_folder`) - require user confirmation first
- No delete capability (safety first - only move to `.organizer_trash`)
- Mandatory preview mode for operations affecting >10 files

## Mock API Strategy

### Testing-First Approach (Weeks 1-2 of Phase 1)

Before integrating with Claude API, development will use a **mock agent** to test UI, streaming, and file operations independently.

**Mock API Mode:**
- Mock tool execution returns realistic responses without API calls
- Simulates agent reasoning with predefined response patterns
- Tests error scenarios (permission denied, file not found, partial failures)
- Verifies streaming behavior without rate limiting concerns
- Allows UI testing before backend is complete

**Mock Implementation:**
```typescript
// Mock agent that simulates Claude responses
class MockAgent {
  async processMessage(userMessage: string) {
    // Return simulated tool calls and responses
    // Examples: "list downloads" → returns sample file list
    //          "move PDFs" → simulates batch file operations
    //          "error scenario" → demonstrates error handling
  }
}
```

**Transition to Real API (Week 3 of Phase 1):**
- Replace mock responses with actual Claude API calls
- Same interface, real agent reasoning
- Gradual migration: first endpoint, then full integration
- Both mock and real API modes available in settings for testing

**Benefits:**
- UI development not blocked by API availability
- Error scenarios easily testable
- Reproducible testing for all scenarios
- Faster iteration on streaming/progress logic
- Real API integration becomes a drop-in replacement

---

## Implementation Phases

### Phase 1: MVP - Core Functionality (Weeks 1-2)

**Goal**: Functional file organizer with mock agent, graduating to real Claude API by end of phase

**Core Features**:
1. **Backend API** (`/api/agent-stream`)
   - Claude API integration with tool use
   - Streaming tool execution and responses
   - Convert to AG-UI protocol events
   - Error handling and logging

2. **Tools Implementation** (API routes)
   - `list_files(directory)` - list with metadata (name, size, date, type, permissions)
   - `get_file_info(path)` - detailed metadata
   - `create_folder(path)` - atomic creation with error handling
   - `move_file(source, dest)` - safe move with conflict detection
   - `search_files(criteria)` - date/type/name filtering

3. **Frontend Chat UI** (`/app/page.tsx`)
   - Message input and send
   - Display agent responses and reasoning
   - Real-time status updates from SSE stream
   - Basic message history

4. **Real-time Progress View**
   - Stream agent thinking process
   - Show tool execution status (queued → running → completed)
   - Display tool inputs/outputs
   - Progress percentage for batch operations

5. **Operation History**
   - localStorage persistence (last 50 operations)
   - Show operation summary and results
   - Basic undo capability (restore moved files)

**Acceptance Criteria**:
- [ ] Chat interface sends message, receives streamed response from Claude
- [ ] Tools execute safely within sandboxed directories
- [ ] Real-time progress shows agent reasoning + tool execution
- [ ] Undo restores files to previous locations
- [ ] All file paths validated (no directory traversal)
- [ ] Error states handled gracefully (permission, missing paths, conflicts)
- [ ] TypeScript strict mode passes
- [ ] Mobile responsive (375px+)
- [ ] No console errors

**Testing Checklist**:
- [ ] User types "list downloads" → agent lists 50 files with metadata
- [ ] User types "organize downloads by type" → agent creates folders (Documents, Images, Other), moves files, shows progress
- [ ] User types "undo" → reverts last operation
- [ ] Agent encounters permission error → shows user-friendly message, continues with other files
- [ ] User manually moves file via sidebar UI → operation tracked in history
- [ ] Session persistence: reload page → history preserved

### Phase 2: Stability & Performance (Weeks 4-5)

**Goal**: Robust file operations at scale, better error handling, performant UI

**NOTE**: Phase 2 scope is REDUCED from original plan. Features deferred to Phase 3+ (see "Deferred Features" section).

**Features**:
1. **Batch Operation Optimization**
   - Stream progress every N files (configurable, default 10)
   - Show estimated time remaining based on rate
   - Cancellation at safe checkpoints
   - Partial completion summary on cancel

2. **Error Recovery & Retry**
   - Exponential backoff for transient errors (network, timeouts, locks)
   - Fast-fail for non-retryable errors (permission, not found)
   - Clear error messages with remediation suggestions
   - "Retry all" button for failed operations

3. **Better Help & Examples**
   - In-app example commands ("organize downloads", "find large files")
   - Tooltip explanations of agent capabilities
   - Quick-start guide for first-time users
   - Help panel accessible from chat

4. **Performance at Scale**
   - Test with 5000+ file directories
   - Verify UI responsiveness during batch ops
   - Optimize file system operations (parallel where safe)
   - Profile and fix any memory leaks

5. **Improved Operation History**
   - Show operation details (files affected, duration, errors)
   - Filter history by date/result
   - Export operation log
   - Clear history safely

**Acceptance Criteria**:
- [ ] Batch operations (100+ files) stream progress smoothly
- [ ] Errors are classified correctly (retryable vs. non-retryable)
- [ ] Retry mechanism works without duplicating operations
- [ ] Cancellation stops operations gracefully with partial summary
- [ ] Help examples guide new users successfully
- [ ] Performance: list 5000 files in <2s, move 100 files in <5s
- [ ] No memory leaks during long operations
- [ ] Error messages suggest concrete fixes

**Testing Checklist**:
- [ ] Move 100 files → UI responsive, progress updates every ~10 files
- [ ] Network error mid-batch → Shown with retry option, continues after retry
- [ ] Permission denied on file 47/100 → Continues with remaining, shows summary
- [ ] User cancels at 50% → Partial results shown, remaining files untouched
- [ ] List 5000 files → Shows under 2 seconds, no freeze
- [ ] Example commands all work: "find large files", "organize by type"
- [ ] Undo works after batch operation with retries and errors

**Deferred to Phase 3+**:
- Context persistence / pronoun resolution
- Advanced search (date ranges, AND/OR logic)
- Manual sidebar tools UI
- Cross-platform metadata testing
- Ambiguity clarification from agent

### Phase 3: Polish & Refinement (Week 6)

**Goal**: Production-ready user experience, accessibility, final refinements

**Features**:
1. **Conflict Resolution**
   - Duplicate filename detection
   - Auto-rename strategy (file (1).txt, file (2).txt) with preview
   - Clear conflict resolution UI

2. **Accessibility (Incremental)**
   - Semantic HTML throughout (built incrementally in Phases 1-2)
   - ARIA labels and roles
   - Keyboard navigation (Tab, Enter, Escape, Cmd/Ctrl+Z for undo)
   - Screen reader testing

3. **UI Polish & Refinement**
   - Improved visual hierarchy and spacing
   - Better loading states and transitions
   - Refined error message presentation
   - Responsive design testing on real devices (mobile, tablet, desktop)

4. **Documentation**
   - User guide (markdown)
   - Developer guide for future contributors
   - API documentation for tool specifications
   - Deployment instructions for Vercel

5. **Final Testing & Bug Fixes**
   - Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - Mobile responsiveness (375px, 768px, 1024px, 2560px widths)
   - Accessibility audit (keyboard nav, screen reader)
   - Performance profiling and optimization

**Acceptance Criteria**:
- [ ] Duplicate filenames auto-renamed correctly with clear UI feedback
- [ ] All keyboard shortcuts work (Tab, Enter, Escape, Cmd/Ctrl+Z)
- [ ] Mobile responsive: works at 375px width without horizontal scroll
- [ ] No console errors in production build
- [ ] Help documentation complete and helpful
- [ ] Tested on at least 3 browsers
- [ ] All accessibility WCAG 2.1 A standards met (AA can be Phase 4)

**Testing Checklist**:
- [ ] Move file with same name to destination → Auto-renamed to file (1).txt with preview
- [ ] Keyboard navigation: Tab through all interactive elements → all accessible
- [ ] Mobile (375px): Chat interface fully functional, no horizontal scroll
- [ ] Tablet (768px): Layout adjusts correctly
- [ ] Desktop (1440px): Full UI visible
- [ ] Dark mode toggle (if implemented) → Correct colors
- [ ] Screen reader: Can navigate and understand all UI elements
- [ ] No console errors in Chrome DevTools

**Deferred to Phase 4+**:
- Context persistence / pronoun resolution ("organize those")
- Advanced search (date ranges, AND/OR logic, size filtering)
- Manual sidebar tools UI for power users
- Hash-based deduplication (separate feature)
- Cross-platform comprehensive metadata testing
- Full WCAG 2.1 AA accessibility audit
- Dark mode implementation

## Scope Changes from Original Plan

### Features Deferred to Phase 4+ (Post-MVP)

The following features have been moved out of Phases 1-3 to reduce complexity and accelerate MVP delivery. These are valuable enhancements, not critical for initial release.

| Feature | Original Phase | New Phase | Reason for Deferral | Effort Saved |
|---------|---|---|---|---|
| **Context Persistence** | Phase 2 | Phase 4+ | Users can re-query explicitly; agent doesn't need pronoun resolution ("organize those PDFs") for MVP | 8-10h |
| **Advanced Search** | Phase 2 | Phase 4+ | Agent can interpret complex natural language queries ("files from Q4 2024 larger than 1MB"); limit Phase 1 to name + type filtering | 6-8h |
| **Manual Sidebar Tools UI** | Phase 2 | Phase 4+ | Chat is primary interface; sidebar duplication is secondary feature; "feature parity" is nice-to-have | 10-12h |
| **Hash-based Deduplication** | Phase 3 | Phase 4+ | Separate feature from file organization; expensive (reads file contents); can be Phase 4 enhancement | 5-6h |
| **Cross-platform Metadata Testing** | Phase 3 | Phase 4+ | Node.js preserves metadata automatically; defer OS-specific testing to later phases | 4-5h |
| **Full WCAG 2.1 AA Audit** | Phase 3 | Phase 4+ | Build accessibility incrementally in Phases 1-3; formal audit and AAA compliance in Phase 4 | 10-15h |
| **Ambiguity Clarification** | Phase 2 | Phase 4+ | Agent responds directly to requests; advanced clarification questions are refinement | 3-4h |

**Total Effort Saved by Scope Reduction: 47-61 hours**

This allows realistic delivery: **80-85 hours** (3-4 weeks) instead of claimed 80-120 hours (5+ weeks).

### Architecture Changes from Original Plan

| Change | Original | Updated | Impact |
|--------|---|---|---|
| **Event Protocol** | AG-UI standard (unspecified) | Simple custom JSON | Simpler implementation, no external dependency, easier to maintain |
| **Confirmation Flow** | Phase 2 "Advanced Planning" | Phase 1 core requirement | Critical safety feature; users must see plan before execution |
| **Phase 2 Focus** | Agent features (context, advanced search) | Stability & performance | More valuable for MVP quality; robustness beats advanced features |
| **Mock API Mode** | Not mentioned | Phase 1 explicit strategy | UI testing independent of API availability; easier error scenario testing |
| **Atomicity Guarantee** | "Tool execution atomic" (impossible for batches) | Clarified: individual ops atomic, batch ops best-effort | Realistic guarantees; clearer error handling expectations |

---

## Acceptance Criteria (Overall)

### Functional Requirements
- [ ] Chat accepts natural language commands
- [ ] Agent plans file operations and shows reasoning
- [ ] Real-time progress displays tool execution
- [ ] All file operations sandboxed to user directories
- [ ] Tool execution atomic (succeeds or fails, no partial)
- [ ] Manual UI tools produce identical results to agent
- [ ] Operation history persists (localStorage)
- [ ] Undo restores previous state
- [ ] Search supports multiple criteria
- [ ] Error messages actionable

### Non-Functional Requirements
- [ ] No TypeScript strict errors
- [ ] Responsive: 375px (mobile) to 2560px (wide desktop)
- [ ] Performance: <2s list 5000 files, <100ms move single file
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Security: no path traversal, no system directory access
- [ ] Streaming: <500ms latency for initial response

### Quality Gates
- [ ] No console errors (development or production)
- [ ] Manual testing checklist complete (see Testing Checklist)
- [ ] Code follows Next.js + TypeScript conventions
- [ ] All error paths tested (permissions, missing files, conflicts)
- [ ] Performance tested with 5,000+ file directories

## Success Metrics

1. **Agent Effectiveness**: Agent succeeds without user intervention 90% of time
2. **Performance**: List 5000 files <2s, move 100 files <5s
3. **Trust**: Users can undo operations, see preview before execution
4. **Feature Parity**: User can do 100% of agent actions manually
5. **Usability**: Help system makes all features discoverable to first-time users

## Dependencies & Prerequisites

- **Node.js 18+** - Runtime
- **Claude API Key** - Agent reasoning
- **Vercel Account** - Deployment
- **Modern Browser** - SSE, File System API (optional fallback)

## Risk Analysis & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Filesystem permissions block operations | High | Graceful error, skip file, continue |
| Agent moves important files incorrectly | Critical | Mandatory preview, undo capability, whitelist sandbox |
| Race condition: file deleted by other process mid-move | Medium | Try-catch, report error, don't rollback others |
| Large directory (100k+ files) freezes UI | Medium | Limit results, warn user, pagination |
| Cloud sync conflicts (OneDrive, Dropbox) | Medium | Detect network paths, longer timeouts, warn user |
| Streaming connection drops | Low | Display error, offer retry, show partial results |
| Memory exhaustion from huge file lists | Medium | Implement result limits, streaming cursor |

## Resource Requirements

**Development**: ~80-120 hours over 5 weeks (Phase 1: 30h, Phase 2: 35h, Phase 3: 30h)

**Deployment**: Vercel free tier sufficient for MVP

**Monitoring**: Basic Sentry or Vercel error tracking

## Architecture Decisions

### 1. Next.js Backend for Tool Execution
**Decision**: Run file operations in Node.js API routes (not browser)
**Rationale**: Browser lacks safe filesystem access; Node.js has full fs/promises API; easier sandboxing and permission control
**Alternative Rejected**: Electron app (overkill complexity); browser File System API (limited, requires user interaction per file)

### 2. Streaming via Server-Sent Events (SSE)
**Decision**: Use SSE instead of WebSocket for agent progress
**Rationale**: Simpler than WebSocket; unidirectional fits use case; works with Vercel serverless
**Alternative Rejected**: WebSocket (more complex, doesn't work serverless); polling (inefficient); GraphQL subscriptions (overkill)

### 3. Event Streaming Protocol
**Decision**: Simple custom JSON events (vs. AG-UI)
**Rationale**:
- AG-UI spec is not yet widely standardized (docs.ag-ui.com doesn't exist)
- Custom JSON is self-documenting: `{type: "thinking" | "tool_start" | "tool_result" | "text", ...}`
- Simpler implementation: 4-5 hours saved vs. AG-UI translation layer
- Can adopt AG-UI in Phase 2 if clear value appears
- Direct streaming is easier to debug and maintain
**Alternative Rejected**: AG-UI (premature standardization, unclear value for MVP)

### 4. localStorage for History (MVP)
**Decision**: Session-only history initially, localStorage for persistence
**Rationale**: Simple to implement; sufficient for MVP; scales to ~100 operations
**Alternative Rejected**: Supabase database (overcomplicated MVP); server-side database (requires auth, infrastructure)

### 5. Whitelist Sandbox (Not Expandable)
**Decision**: Fixed whitelist (Downloads, Documents, Desktop, Pictures)
**Rationale**: Security first; prevents accidental system damage; clear user expectations
**Alternative Rejected**: User-configurable paths (complexity, social engineering risk); full filesystem (too dangerous)

### 6. No Delete Tool (Move to Trash Only)
**Decision**: No direct delete; all destructive ops are "move to trash"
**Rationale**: Safety first; matches user expectations (Move to Trash on desktop); supports undo (restore from trash)
**Alternative Rejected**: Permanent delete (irreversible data loss risk); archive folder (less intuitive)

## Future Considerations

**Post-MVP Features**:
- **Persistent preferences**: Learn user's organization strategies
- **Scheduled operations**: "Organize downloads weekly"
- **Collaborative**: Share organization across devices
- **Integration**: Connect to cloud storage (Google Drive, OneDrive)
- **AI Training**: Fine-tune Claude on user's file patterns
- **Advanced search**: Content-based search (read file contents for categorization)
- **Batch operations**: Move multiple files in single API call
- **Performance**: Parallel execution of independent operations

**Extensibility**:
- Plugin system for custom tools (e.g., compress, encrypt)
- Workflow templates (e.g., "photo organizing pipeline")
- Integration with file tagging systems

## Documentation Plan

**User-Facing**:
- [ ] README.md - Feature overview, quick start
- [ ] In-app Help - Example commands, keyboard shortcuts, troubleshooting
- [ ] API documentation - Tool specifications for power users

**Developer-Facing**:
- [ ] CLAUDE.md - AI guidelines for future modifications
- [ ] Architecture guide - System design, tool implementation patterns
- [ ] Tool API schema - Formal specification for each tool
- [ ] Error codes reference - All error messages and recovery paths

**Deployment**:
- [ ] Vercel setup guide
- [ ] Environment variables documentation
- [ ] Scaling considerations (rate limits, filesystem constraints)

## References & Research

### Internal References
- **Project structure**: Follows Task Manager. CC patterns (Next.js 16, Tailwind CSS, localStorage)
- **Streaming**: AG-UI protocol + SSE (industry standard 2025)
- **Tool design**: Atomic primitives (agent-native architecture principles)
- **TypeScript patterns**: Discriminated unions, Zod validation

### External References
- [Claude API Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use)
- [Claude API Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [React 19 Server Components](https://react.dev/reference/react/use-server)
- [Node.js fs/promises](https://nodejs.org/api/fs/promises.html)
- [AG-UI Protocol](https://docs.ag-ui.com/)
- [Agent-Native Architecture](https://every.to/guides/agent-native)

### Related Projects
- Task Manager. CC - Next.js + localStorage reference
- To-Do App. CC - Git worktree workflow reference
- Markdown Note Taking App - Complex project patterns

## Pre-Implementation Planning (REQUIRED BEFORE CODING)

Before Phase 1 coding begins, complete these planning items (5-6 hours total). These decisions unblock development and prevent rework.

### 1. Finalize Event Protocol (1 hour)
**Decision Required**: AG-UI protocol vs. simple custom JSON

**Option A: AG-UI Protocol**
- Commit to full AG-UI specification
- Creates event translation layer in backend
- Justification: Future portability to other backends
- Cost: 4-5 hours development + learning curve

**Option B: Simple Custom JSON (RECOMMENDED)**
- Direct streaming of event types: `thinking`, `tool_start`, `tool_result`, `text`
- Self-documenting schema
- Easy to debug and extend
- Cost: 2-3 hours development + simpler maintenance
- Example:
```json
{type: "thinking", content: "I should organize by file type"}
{type: "tool_start", tool: "list_files", input: {directory: "~/Downloads"}}
{type: "tool_result", tool: "list_files", output: [...files]}
{type: "text", content: "Found 47 files..."}
```

**Recommendation**: Use Option B (simple JSON). AG-UI adoption is still emerging; revisit in Phase 2 if clear value appears.

**Decision Owner**: Architecture lead
**Deadline**: Before backend development starts

---

### 2. Path Validation Security Specification (2-3 hours)
**Deliverable**: Formal spec with test cases

**Must Define:**
- Case normalization for macOS/Windows
- Symlink handling (block or allow? if allow, verify target)
- Unicode normalization (é as single char vs. e + accent)
- Max path depth and length limits
- Test cases covering attacks:
  - `~/../../etc/passwd` (directory traversal)
  - `~/symlink-to-/etc/passwd` (symlink escape)
  - Symlinks creating loops (A → B → A)

**Recommended Implementation Pattern:**
```typescript
function validatePath(userPath: string, baseDir: string) {
  // 1. Normalize Unicode
  const normalized = userPath.normalize('NFC');

  // 2. Resolve all path components
  const resolved = path.resolve(normalized);

  // 3. Follow symlinks to real path
  const realPath = fs.realpathSync(resolved);

  // 4. Verify within base directory
  const relative = path.relative(baseDir, realPath);
  if (relative.startsWith('..')) {
    throw new Error('Path outside sandbox');
  }

  return realPath;
}
```

**Test Cases:**
- ✅ `~/Downloads/file.pdf` → allowed
- ❌ `~/../../etc/passwd` → rejected
- ❌ `~/symlink-to-etc` → rejected (if outside whitelist)
- ✅ `~/Downloads/subdir/file.pdf` → allowed (depth < 20)

**Decision Owner**: Security lead
**Deadline**: Before Phase 1 file operations code

---

### 3. Confirmation/Approval Flow Design (2 hours)
**Deliverable**: Sequence diagram + implementation spec

**Must Define:**
- When does agent generate plan (before or after tool execution)?
- How does user approve? Modal, inline, separate endpoint?
- Can user edit plan before execution? (scope: No for MVP)
- What if user cancels? Rollback? Partial completion?

**Recommended Flow:**
```
User: "organize downloads by type"
  ↓
Backend: Stream agent thinking...
Backend: Generate tool plan (DON'T execute yet)
Frontend: Display plan with [Approve] [Cancel] buttons
User: Click [Approve]
Frontend: Send approval confirmation
Backend: Execute tools, stream progress
Frontend: Display results with [Undo] button
```

**Key Decisions:**
- Approval is synchronous (wait for user, max 5 minutes timeout)
- Tools execute only after approval
- Can't edit plan in MVP (Approve/Cancel only)
- Preview shows exact files affected + destination

**Decision Owner**: Product/UX lead
**Deadline**: Before frontend chat component

---

### 4. Context Window & Large Directory Strategy (2-3 hours)
**Deliverable**: Chunking strategy spec

**Must Define:**
- Max files per `list_files` call (recommend: 1000)
- Behavior when more files exist (warning + pagination?)
- How agent handles large directories (sampling? hierarchical?)
- Token budget for file lists in agent reasoning

**Recommended Approach:**
```typescript
// Phase 1: Hard limit with clear message
async function listFiles(directory: string) {
  const files = await fs.promises.readdir(directory);

  if (files.length > 1000) {
    return {
      files: files.slice(0, 1000),
      warning: `Directory contains ${files.length} files. Showing first 1000.`,
      hasMore: true
    };
  }

  return { files, hasMore: false };
}

// Phase 2: Add pagination for large directories
// Phase 3: Add intelligent sampling (show representative files)
```

**Token Budget:**
- Claude Opus 4.5: 200k context window
- Safe budget for files: 75k tokens (leave 125k for conversation + response)
- At ~5 tokens per file entry: ~15,000 files max
- Phase 1 hard limit: 1,000 files (32 tokens per file for metadata)

**Decision Owner**: Engineering lead
**Deadline**: Before agent tool definitions

---

### 5. Atomicity & Partial Failure Handling (1-2 hours)
**Deliverable**: Error classification spec

**Must Define:**
- Which errors are retryable (network, timeouts, locks)?
- Which errors should stop the batch (permission, path not found)?
- How many retries? Backoff strategy?
- What does undo do on partial failures?

**Recommended Classification:**
```typescript
RETRYABLE = [
  'ECONNREFUSED',      // Network
  'ETIMEDOUT',         // Timeout
  'EAGAIN'             // Resource temporarily unavailable
]

NON_RETRYABLE = [
  'EACCES',            // Permission denied
  'ENOENT',            // File not found
  'EISDIR',            // Is a directory
  'EEXIST'             // File exists
]
```

**Retry Strategy:**
- Exponential backoff: base delay 1 second, max 30 seconds
- Jitter: random 0.5-1.5x multiplier
- Max 3 retries per operation
- Log all retries for debugging

**Partial Failure Behavior:**
```
Move 100 files:
  Files 1-73: success
  File 74: permission denied (non-retryable, skip)
  Files 75-100: success

Result: 99 files moved, 1 skipped
Show: "99/100 files organized. Skipped 1 (permission denied)"
Undo: Restores all 99 moved files
```

**Decision Owner**: Engineering lead
**Deadline**: Before Phase 1 tool implementation

---

### 6. Mock API Architecture Specification (2 hours)
**Deliverable**: Mock agent interface spec

**Must Define:**
- What does mock agent return for each user query?
- How to simulate different error scenarios?
- How to transition from mock to real API?
- Settings to switch between mock and real?

**Recommended Mock Patterns:**
```typescript
interface MockAgentResponse {
  thinking: string;
  toolCalls: Array<{
    name: string;
    input: object;
    result: object;
  }>;
  finalResponse: string;
}

// Examples:
"list downloads" →
{
  thinking: "User wants to see what's in downloads",
  toolCalls: [{
    name: "list_files",
    input: {directory: "~/Downloads"},
    result: {files: [...sample files...], count: 47}
  }],
  finalResponse: "Found 47 files in downloads..."
}

"move PDFs to documents" →
{
  thinking: "User wants to organize PDFs",
  toolCalls: [{
    name: "search_files",
    input: {directory: "~/Downloads", fileType: "pdf"},
    result: {files: [...12 PDFs...]}
  }, {
    name: "create_folder",
    input: {path: "~/Downloads/documents"},
    result: {success: true}
  }, {
    name: "move_file",
    input: {source: "file1.pdf", dest: "~/Downloads/documents/"},
    result: {success: true}
  }],
  finalResponse: "Moved 12 PDFs to documents folder"
}

"permission error" →
{
  thinking: "Attempting to move system file...",
  toolCalls: [{
    name: "move_file",
    input: {source: "/System/file", dest: "..."},
    result: {error: "EACCES: permission denied"}
  }],
  finalResponse: "Error: Permission denied..."
}
```

**Real API Migration (Week 3):**
- Create `ClaudeAgent` class with same interface as `MockAgent`
- Toggle via environment variable: `AGENT_MODE=mock|real`
- Both implementations use identical tool definitions
- Gradual replacement: test real API with mock UI first

**Decision Owner**: Engineering lead
**Deadline**: Before starting backend development

---

## Next Steps (Post-Planning)

### Week 1: Planning & Setup (Parallel)
1. **Complete 6 Planning Items Above** (5-6 hours)
   - Decisions documented in this plan
   - Shared with team for alignment

2. **Environment Setup** (in parallel)
   - Initialize Next.js project: `npx create-next-app@latest`
   - Setup TypeScript, Tailwind CSS, ESLint
   - Create `.claude/settings.local.json` with tool permissions
   - Set up mock agent stub

### Week 2-3: Phase 1 Implementation
1. **Backend API** (`/app/api/agent-stream.ts`)
   - SSE streaming endpoint
   - Mock agent integration
   - Tool execution layer

2. **Frontend Chat UI** (`/app/page.tsx`)
   - Message input and display
   - Real-time SSE stream handling
   - Plan preview/approval modal
   - Result display with undo button

3. **Tools Implementation** (`/lib/filesystem/tools.ts`)
   - list_files, get_file_info, create_folder, move_file, search_files
   - Comprehensive path validation
   - Error handling per spec

4. **localStorage Persistence** (`/lib/operations-history.ts`)
   - Operation history (last 50)
   - Undo capability with rollback
   - Session persistence

### Week 4: Phase 1 Testing & Real API Integration
1. **Mock Agent Testing**
   - All error scenarios
   - Streaming behavior
   - Path validation
   - Undo functionality

2. **Real Claude API Integration**
   - Replace mock responses with Claude API
   - Test with actual file operations
   - Verify streaming latency

3. **Phase 1 Acceptance Criteria Validation**
   - Chat receives commands ✓
   - Agent shows reasoning ✓
   - Real-time progress ✓
   - Path validation ✓
   - Undo works ✓
   - No console errors ✓

---

**Status**: Phase 1 - Environment & Core Tools Complete ✅

**Last Updated**: 2025-02-09

**Difficulty**: Medium (file I/O, streaming, agent integration)

**Estimated Effort (Revised)**:
- Phase 1: 40-45 hours (up from 30h; includes planning + implementation)
- Phase 2: 25 hours (down from 35h; scope reduced)
- Phase 3: 15-20 hours (down from 30h; simplified polish)
- **Total: 80-85 hours** (down from 80-120h; better scoped)
