---
title: Add Preset Commands Dropdown Menu
type: feat
date: 2026-02-10
---

# feat: Add Preset Commands Dropdown Menu

## Overview

Add a dropdown menu with preset common file organization commands that users can quickly select from, while keeping the text input field for custom queries. This reduces friction for common operations and improves discoverability.

## Problem Statement / Motivation

Currently, users must type commands from scratch each time, even for repetitive operations. This creates friction for:
- New users who don't know what commands are possible
- Returning users doing repetitive tasks (organizing downloads by type, listing specific folders)
- Users who want quick access to common operations without typing

**Solution:** Provide a preset dropdown menu with the most useful commands, while maintaining the ability to type custom commands.

## Proposed Solution

### User Experience Flow

1. **At Rest:** Show normal text input with placeholder
2. **On Focus or Click Icon:** Dropdown appears below input showing preset commands
3. **User Actions:**
   - Click a preset → Command populates input → Auto-submit
   - Start typing → Dropdown closes (or filters results)
   - Type custom command → Input works as before
   - Click away → Dropdown closes

### Preset Commands

```
• List Downloads - Show all files in Downloads
• Organize by Type - Group files by extension
• Organize by Date - Group files by modification date
• Find Large Files - Show files over 10MB
• Find PDFs - Search for PDF documents
• Find Images - Search for image files
• Move to Documents - Move files to Documents folder
• [Custom Command...] - Type your own command
```

## Technical Approach

### Architecture

**Components:**
- `PresetCommand` interface for command metadata
- `CommandDropdown` UI component (dropdown list)
- Enhanced input form wrapper to manage dropdown state
- Keep existing `handleSendMessage` logic intact

**State Management (in app/page.tsx):**

```typescript
// Add to existing state
const [showDropdown, setShowDropdown] = useState(false)
const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null)

// Command list constant
const PRESET_COMMANDS = [
  { id: 'list', label: 'List Downloads', command: 'list my downloads' },
  { id: 'organize-type', label: 'Organize by Type', command: 'organize downloads by type' },
  { id: 'organize-date', label: 'Organize by Date', command: 'organize downloads by date' },
  { id: 'large-files', label: 'Find Large Files', command: 'find large files' },
  { id: 'find-pdf', label: 'Find PDFs', command: 'find PDF files' },
  { id: 'find-images', label: 'Find Images', command: 'find image files' },
  { id: 'move-docs', label: 'Move to Documents', command: 'move documents to Documents folder' },
]
```

**Event Handlers:**

```typescript
const handleInputFocus = () => {
  setShowDropdown(true)
}

const handleSelectCommand = (command: string) => {
  setInput(command)
  setShowDropdown(false)
  // Auto-submit after brief delay to allow state update
  setTimeout(() => {
    const formEvent = new Event('submit', { bubbles: true })
    document.querySelector('form')?.dispatchEvent(formEvent)
  }, 0)
}

const handleInputChange = (e) => {
  setInput(e.target.value)
  // Keep dropdown open while typing for discoverability
}

const handleClickOutside = () => {
  setShowDropdown(false)
}
```

### File Structure

**Modified Files:**
- `app/page.tsx` - Add dropdown state, handlers, and UI

**New Files:** None (keep as minimal component in existing file)

### UI Implementation

```typescript
// Add to footer after existing form
<div className="relative">
  <form onSubmit={handleSendMessage} className="flex gap-2">
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onFocus={handleInputFocus}
      placeholder="Type a command... (e.g., 'list downloads')"
      disabled={isLoading}
      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
    />
    <button
      type="submit"
      disabled={isLoading || !input.trim()}
      className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
    >
      Send
    </button>
  </form>

  {/* Dropdown Menu */}
  {showDropdown && (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
      {PRESET_COMMANDS.map((cmd) => (
        <button
          key={cmd.id}
          onClick={() => handleSelectCommand(cmd.command)}
          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-blue-600"
        >
          <div className="font-medium">{cmd.label}</div>
          <div className="text-xs text-gray-500">{cmd.command}</div>
        </button>
      ))}
    </div>
  )}
</div>
```

## Acceptance Criteria

- [x] Dropdown menu displays when input is focused
- [x] Preset commands list 7+ useful file operations
- [x] Clicking a preset command populates the input field
- [x] Selected command auto-submits to the agent
- [x] Dropdown closes when:
  - User clicks a command
  - User clicks outside the dropdown
  - User starts typing a custom command (optional: filter instead)
- [x] Custom text input still works normally
- [x] Styling matches existing UI (Tailwind, consistent colors)
- [x] Mobile-friendly dropdown positioning
- [x] No console errors or warnings

## Success Metrics

- ✅ Reduced clicks for common operations (5+ click operations reduce to 1 click)
- ✅ New users can discover available commands more easily
- ✅ Keystroke savings for frequently used commands
- ✅ No disruption to existing text input behavior

## Dependencies & Risks

**Dependencies:**
- None; uses existing React/Tailwind patterns

**Risks & Mitigations:**
- **Risk:** Dropdown overlaps with other UI elements
  - **Mitigation:** Position absolutely from input, z-index 10, test on mobile
- **Risk:** Auto-submit timing causes race conditions
  - **Mitigation:** Use refs and proper event handling instead of setTimeout if needed
- **Risk:** Command list too long, clutters UI
  - **Mitigation:** Keep to 7-8 most useful commands; can expand in future

## References & Research

### Internal References
- Input form pattern: `app/page.tsx:258-277` (current form implementation)
- State management pattern: `app/page.tsx:19-24` (existing state hooks)
- Tailwind styling: All existing classes follow project conventions
- Form submission handler: `app/page.tsx:34-144` (handleSendMessage)

### Technology Stack
- React 19.0.0
- Next.js 16.0.0
- Tailwind CSS 4.0.0
- TypeScript 5.0.0

### Related Features
- Undo Last Organization (already implemented) - complementary feature
- Message history - existing pattern

## Implementation Notes

1. **Keep It Simple:** The dropdown is a small enhancement; avoid over-engineering
2. **Discoverability:** Commands should be readable with description text
3. **Keyboard Support:** Consider adding arrow keys navigation (Phase 2)
4. **Future Improvements:**
   - Keyboard navigation (↑↓ to select, Enter to confirm)
   - Search/filter as user types
   - Customizable command list
   - Command history tracking
   - Drag-to-reorder presets

## Code Example (Pseudo-implementation structure)

```typescript
// app/page.tsx - additions

interface PresetCommand {
  id: string
  label: string
  command: string
}

const PRESET_COMMANDS: PresetCommand[] = [
  // ... command definitions
]

export default function Home() {
  // ... existing state
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSelectCommand = (command: string) => {
    setInput(command)
    setShowDropdown(false)
    // Submit the command
  }

  // ... rest of component
  return (
    <div>
      {/* ... header, messages ... */}
      <footer>
        <div className="relative">
          {/* form with input */}
          {/* dropdown menu */}
        </div>
      </footer>
    </div>
  )
}
```

## Testing Considerations

- Test dropdown opens/closes correctly
- Test all 7 commands work when selected
- Test custom input still works when dropdown is open
- Test dropdown closes on click-outside
- Test mobile responsiveness
- Test keyboard interactions (if adding in Phase 2)
- Verify no regression to existing chat functionality
