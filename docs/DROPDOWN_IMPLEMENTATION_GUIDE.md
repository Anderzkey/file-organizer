# Dropdown Implementation Guide

## Quick Reference: Recommended CSS Classes

### Base Container
```html
<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
```

**Breakdown:**
- `absolute` - Position relative to parent form (use `relative` on parent)
- `top-full` - Position below parent (24px gap from top)
- `left-0 right-0` - Full width of parent
- `mt-1` - 4px margin-top for visual breathing room
- `bg-white` - Clean white background
- `border border-gray-200` - Subtle border for definition
- `rounded-lg` - 8px border radius (matches design language)
- `shadow-lg` - Depth shadow for elevation
- `z-10` - Ensure dropdown appears above other content
- `max-h-64 overflow-y-auto` - Scrollable when content exceeds 256px

### Dropdown Item (Recommended Enhanced Version)
```html
<button
  key={cmd.id}
  onClick={() => handleSelectCommand(cmd.command)}
  className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors duration-150 hover:font-semibold"
  role="option"
  aria-selected={focusedIndex === index}
  tabIndex={focusedIndex === index ? 0 : -1}
>
  <div className="font-medium">{cmd.label}</div>
  <div className="text-xs text-gray-500">{cmd.command}</div>
</button>
```

**Enhanced vs Base Differences:**
- Added: `focus-visible:ring-2 focus-visible:ring-blue-500` (focus indicator)
- Added: `transition-colors duration-150` (smooth color transitions)
- Added: `hover:font-semibold` (stronger hover affordance)
- Added: ARIA attributes
- Kept: All original styling for consistency

### Basic Label Item (Alternative - Simpler)
```html
<button className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-blue-600">
  <div className="font-medium">{cmd.label}</div>
  <div className="text-xs text-gray-500">{cmd.command}</div>
</button>
```

---

## Spacing Measurements (Tailwind Units)

### Container Spacing
```
Top spacing from input:    mt-1      = 4px
Horizontal padding:        px-4      = 16px (left) + 16px (right) = 32px
Per-item vertical padding: py-2      = 8px (top) + 8px (bottom) = 16px total height per item
Item separator:            border-b  = 1px line between items
Max visible height:        max-h-64  = 256px (approximately 7-8 items visible)
Border radius:             rounded-lg = 8px
```

### Item Dimensions
```
Width:                     100% of parent (full dropdown width)
Height per item:           ~32-36px with padding and borders
Recommended touch target:  44px+ (increase py-2 to py-3 on mobile)
```

---

## Color Palette Reference

### Text Colors
```
Primary text:       text-gray-700    = #374151    (contrast: 10.5:1 on white)
Secondary text:     text-gray-500    = #6b7280    (contrast: 7.1:1 on white)
Hover text:         text-blue-600    = #2563eb    (contrast: 8.6:1 on white)
Disabled text:      text-gray-400    = #9ca3af    (contrast: 4.3:1 on white)
```

### Background Colors
```
Default:            bg-white         = #ffffff
Hover state:        hover:bg-blue-50 = #eff6ff
Alternative hover:  hover:bg-blue-100= #dbeafe (slightly stronger)
Border:             border-gray-200  = #e5e7eb (container border)
Divider:            border-gray-100  = #f3f4f6 (between items)
```

### Interactive States
```
Focus ring:         focus:ring-blue-500    = #3b82f6 (primary blue)
Disabled button:    disabled:bg-gray-300   = #d1d5db
Input focus:        focus:border-blue-500  = #3b82f6
```

---

## Complete Implementation Example

### React Component Structure
```typescript
import React, { useState, useRef, useEffect } from 'react'

interface PresetCommand {
  id: string
  label: string
  command: string
  icon?: string // Optional emoji icon
}

const PRESET_COMMANDS: PresetCommand[] = [
  { id: 'list', label: 'List Downloads', command: 'list my downloads', icon: '📂' },
  { id: 'organize-type', label: 'Organize by Type', command: 'organize downloads by type', icon: '✏️' },
  { id: 'organize-date', label: 'Organize by Date', command: 'organize downloads by date', icon: '📅' },
  { id: 'large-files', label: 'Find Large Files', command: 'find large files', icon: '📊' },
  { id: 'find-pdf', label: 'Find PDFs', command: 'find PDF files', icon: '📄' },
  { id: 'find-images', label: 'Find Images', command: 'find image files', icon: '🖼️' },
  { id: 'move-docs', label: 'Move to Documents', command: 'move documents to Documents folder', icon: '➡️' },
]

export default function Home() {
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Handle input focus - show dropdown
  const handleInputFocus = () => {
    setShowDropdown(true)
    setFocusedIndex(-1)
  }

  // Handle input blur - close dropdown (with delay to allow click)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowDropdown(false)
      setFocusedIndex(-1)
    }, 200)
  }

  // Handle command selection
  const handleSelectCommand = (command: string) => {
    setInput(command)
    setShowDropdown(false)
    setFocusedIndex(-1)

    // Focus back to input for keyboard continuity
    inputRef.current?.focus()

    // Auto-submit after state update
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true })
      formRef.current?.dispatchEvent(event)
    }, 0)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && e.key === 'ArrowDown') {
      e.preventDefault()
      setShowDropdown(true)
      setFocusedIndex(0)
      return
    }

    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < PRESET_COMMANDS.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : PRESET_COMMANDS.length - 1
        )
        break

      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0) {
          handleSelectCommand(PRESET_COMMANDS[focusedIndex].command)
        }
        break

      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        setFocusedIndex(-1)
        break

      default:
        break
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div>
      {/* ... existing header and messages ... */}

      {/* Footer with Input and Dropdown */}
      <footer className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="relative" ref={formRef}>
          <form onSubmit={(e) => {
            e.preventDefault()
            // Your existing handleSendMessage logic
          }} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Type a command... (e.g., 'list downloads')"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              aria-expanded={showDropdown}
              aria-controls="command-dropdown"
              aria-haspopup="listbox"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              id="command-dropdown"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
            >
              {PRESET_COMMANDS.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelectCommand(cmd.command)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full text-left px-4 py-2 border-b border-gray-100 last:border-b-0 text-sm transition-colors duration-150
                    ${focusedIndex === index
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:font-semibold'
                    } focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                  role="option"
                  aria-selected={focusedIndex === index}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <div className="font-medium">
                    {cmd.icon && <span className="mr-2">{cmd.icon}</span>}
                    {cmd.label}
                  </div>
                  <div className="text-xs text-gray-500 ml-6">{cmd.command}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
```

---

## Mobile Responsive Version

### Enhanced with Breakpoint Adjustments
```html
<button
  className="w-full text-left px-4 py-3 md:py-2 hover:bg-blue-50 border-b border-gray-100
             last:border-b-0 text-sm text-gray-700 hover:text-blue-600
             focus-visible:ring-2 focus-visible:ring-blue-500
             transition-colors hover:font-semibold"
>
  <div className="font-medium text-sm md:text-sm">{cmd.label}</div>
  <div className="text-xs md:text-xs text-gray-500">{cmd.command}</div>
</button>
```

### Dynamic Positioning for Mobile
```typescript
const [dropdownAbove, setDropdownAbove] = useState(false)

const handleInputFocus = () => {
  const inputRect = inputRef.current?.getBoundingClientRect()
  const spaceBelow = window.innerHeight - (inputRect?.bottom || 0)

  // If less than 200px of space below, show dropdown above
  if (spaceBelow < 200) {
    setDropdownAbove(true)
  } else {
    setDropdownAbove(false)
  }

  setShowDropdown(true)
}

// Apply conditionally in JSX
className={dropdownAbove
  ? "absolute bottom-full left-0 right-0 mb-1 ..."
  : "absolute top-full left-0 right-0 mt-1 ..."
}
```

---

## Accessibility Checklist - Implementation

### ARIA Attributes
```html
<!-- Input element -->
<input
  aria-expanded={showDropdown}
  aria-controls="command-dropdown"
  aria-haspopup="listbox"
/>

<!-- Dropdown container -->
<div
  id="command-dropdown"
  role="listbox"
>

<!-- Individual items -->
<button
  role="option"
  aria-selected={focusedIndex === index}
  tabIndex={focusedIndex === index ? 0 : -1}
>
```

### Focus Management
```typescript
// Store ref to input
const inputRef = useRef<HTMLInputElement>(null)

// Return focus after selection
const handleSelectCommand = (command: string) => {
  setInput(command)
  setShowDropdown(false)
  inputRef.current?.focus() // KEY: Return focus
}
```

### Keyboard Support
```typescript
// Handle all key events
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') { /* ... */ }
  if (e.key === 'ArrowUp') { /* ... */ }
  if (e.key === 'Enter') { /* ... */ }
  if (e.key === 'Escape') { /* ... */ }
}
```

### High Contrast Mode
```html
<button className="...
  contrast-more:bg-gray-100 contrast-more:text-gray-900
  contrast-more:hover:bg-blue-500 contrast-more:hover:text-white
">
```

---

## Performance Considerations

### 1. Prevent Unnecessary Re-renders
```typescript
// Use useCallback for handlers
const handleSelectCommand = useCallback((command: string) => {
  setInput(command)
  setShowDropdown(false)
}, [])

// Memoize command list
const PRESET_COMMANDS = useMemo(() => [
  { id: 'list', label: 'List Downloads', command: 'list my downloads' },
  // ...
], [])
```

### 2. Optimize Click-Outside Detection
```typescript
useEffect(() => {
  if (!showDropdown) return // Don't listen if closed

  const handleClickOutside = (e: MouseEvent) => {
    // ... logic
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [showDropdown]) // Only when dropdown state changes
```

### 3. Debounce Window Resize (for responsive positioning)
```typescript
useEffect(() => {
  let timeoutId: NodeJS.Timeout

  const handleResize = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      // Recalculate dropdown position
    }, 100)
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

## Testing Code Snippets

### Unit Test: Command Selection
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

test('selecting a command populates input and closes dropdown', () => {
  render(<Home />)

  const input = screen.getByPlaceholderText(/Type a command/)
  fireEvent.focus(input) // Open dropdown

  const listButton = screen.getByText('List Downloads')
  fireEvent.click(listButton)

  expect(input).toHaveValue('list my downloads')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})
```

### E2E Test: Keyboard Navigation
```typescript
import { test, expect } from '@playwright/test'

test('keyboard navigation works correctly', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const input = page.getByPlaceholderText(/Type a command/)
  await input.focus()

  // Press ArrowDown to open and move to first item
  await page.keyboard.press('ArrowDown')

  // Check first item is focused
  let focused = await page.locator('[role="option"][aria-selected="true"]').first()
  expect(focused).toContainText('List Downloads')

  // Press ArrowDown to move to next item
  await page.keyboard.press('ArrowDown')

  // Check second item is now focused
  focused = await page.locator('[role="option"][aria-selected="true"]').first()
  expect(focused).toContainText('Organize by Type')

  // Press Enter to select
  await page.keyboard.press('Enter')

  // Verify input is populated and dropdown closed
  await expect(input).toHaveValue('organize downloads by type')
  await expect(page.locator('[role="listbox"]')).not.toBeVisible()
})
```

---

## CSS Custom Properties (Optional Theming)

### If adding dark mode support later
```css
@layer components {
  .dropdown-container {
    @apply absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900
           border border-gray-200 dark:border-gray-700
           rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto;
  }

  .dropdown-item {
    @apply w-full text-left px-4 py-2 border-b border-gray-100 dark:border-gray-700
           text-sm text-gray-700 dark:text-gray-200
           hover:bg-blue-50 dark:hover:bg-blue-900
           hover:text-blue-600 dark:hover:text-blue-400
           transition-colors focus-visible:ring-2 focus-visible:ring-blue-500;
  }
}
```

---

## Browser Support

**Target Browsers:**
- Chrome 90+ (ES2020)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 9+)

**CSS Features Used:**
- Flexbox ✅
- CSS Grid ✅ (not required, but base layout uses flex)
- CSS Custom Properties ❌ (not needed, uses Tailwind)
- Transitions ✅
- Focus-visible ✅

**JavaScript Features Used:**
- React 19 Hooks (useState, useRef, useEffect, useCallback)
- ES2020+ (arrow functions, destructuring, spread operator)
- Event API (addEventListener, dispatchEvent)

---

## Rollback Plan

If issues arise, you can quickly revert to simpler version:

### Minimal Version (No Keyboard Support)
```typescript
{showDropdown && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
    {PRESET_COMMANDS.map((cmd) => (
      <button
        key={cmd.id}
        onClick={() => {
          setInput(cmd.command)
          setShowDropdown(false)
          setTimeout(() => {
            document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }))
          }, 0)
        }}
        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-blue-600"
      >
        <div className="font-medium">{cmd.label}</div>
        <div className="text-xs text-gray-500">{cmd.command}</div>
      </button>
    ))}
  </div>
)}
```

This can be deployed and enhanced iteratively.

---

**Last Updated:** 2026-02-10
**Version:** 1.0 (Pre-implementation)
