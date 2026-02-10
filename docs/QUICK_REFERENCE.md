# Dropdown Feature - Quick Reference Card

**Feature:** Preset Commands Dropdown Menu | **Status:** Pre-implementation | **Priority:** High

---

## Critical Issues (Fix Before Launch)

| Issue | Severity | Fix | Time |
|-------|----------|-----|------|
| Missing ARIA attributes | 🔴 CRITICAL | Add `aria-expanded`, `aria-controls`, `role="listbox"` | 0.5h |
| No focus ring | 🔴 CRITICAL | Add `focus-visible:ring-2 focus-visible:ring-blue-500` | 0.25h |
| Mobile dropdown overflow | 🔴 CRITICAL | Add dynamic positioning (top/bottom based on space) | 1h |

---

## High Priority Issues (Before Release)

| Issue | Severity | Fix | Time |
|-------|----------|-----|------|
| No keyboard navigation | 🟠 HIGH | Add arrow keys, Enter, Escape handlers | 1.5h |
| Weak hover affordance | 🟠 HIGH | Add `hover:font-semibold transition-colors` | 0.25h |
| Focus not returned | 🟠 HIGH | Add `inputRef.current?.focus()` after selection | 0.25h |

---

## Color Palette Quick Reference

```
Primary Blue:       #3b82f6 (blue-500)     ← Main brand color
Hover Background:   #eff6ff (blue-50)      ← Light blue for hover
Default Text:       #374151 (gray-700)     ← Dark gray text
Secondary Text:     #6b7280 (gray-600)     ← Medium gray for descriptions
Hover Text:         #2563eb (blue-600)     ← Blue on hover
Border:             #e5e7eb (gray-200)     ← Subtle dividers
Item Dividers:      #f3f4f6 (gray-100)     ← Very subtle separators
Focus Ring:         #3b82f6 (blue-500)     ← Same as primary blue
```

---

## Spacing Reference

```
Container:
  Top margin from input:      mt-1 (4px)
  Horizontal padding:         px-4 (16px each side)
  Border radius:              rounded-lg (8px)
  Shadow:                     shadow-lg

Items:
  Horizontal padding:         px-4 (16px)
  Vertical padding (desktop): py-2 (8px)
  Vertical padding (mobile):  py-3 (12px)  ← For touch targets
  Item dividers:              border-b border-gray-100

Accessibility:
  Focus ring width:           2px
  Focus ring offset:          1px
  Touch target height:        44px+ (44px recommended)
```

---

## Key CSS Classes

### Container (Dropdown)
```html
className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200
           rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
```

### Item Button (Base)
```html
className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100
           last:border-b-0 text-sm text-gray-700 hover:text-blue-600"
```

### Item Button (Enhanced - Recommended)
```html
className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100
           last:border-b-0 text-sm text-gray-700 hover:text-blue-600
           focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
           transition-colors duration-150 hover:font-semibold"
```

---

## ARIA Attributes Checklist

### Input Element
```html
<input
  aria-expanded={showDropdown}
  aria-controls="command-dropdown"
  aria-haspopup="listbox"
/>
```

### Dropdown Container
```html
<div
  id="command-dropdown"
  role="listbox"
>
```

### Item Buttons
```html
<button
  role="option"
  aria-selected={focusedIndex === index}
  tabIndex={focusedIndex === index ? 0 : -1}
>
```

---

## Keyboard Navigation Required

```
Arrow Down:   Move focus down (or open if closed)
Arrow Up:     Move focus up
Enter:        Select focused item
Escape:       Close dropdown
Tab:          Move to next element (standard)
```

---

## State Management

### Required State Variables
```typescript
const [showDropdown, setShowDropdown] = useState(false)
const [focusedIndex, setFocusedIndex] = useState(-1)
const inputRef = useRef<HTMLInputElement>(null)
const dropdownRef = useRef<HTMLDivElement>(null)
```

### Required Event Handlers
```typescript
const handleInputFocus = () => { /* show dropdown */ }
const handleInputBlur = () => { /* hide dropdown */ }
const handleKeyDown = (e) => { /* navigate, select, escape */ }
const handleSelectCommand = (cmd) => { /* populate input, close, submit */ }
const handleClickOutside = () => { /* close dropdown */ }
```

---

## Responsive Adjustments

### Mobile (< 640px)
```html
<!-- Increase vertical padding for touch targets -->
<button className="px-4 py-3 md:py-2">

<!-- Consider max-h-96 for more visible items on small screens -->
<div className="max-h-96 md:max-h-64">
```

### Dynamic Positioning (for mobile)
```typescript
const handleInputFocus = () => {
  const rect = inputRef.current?.getBoundingClientRect()
  const spaceBelow = window.innerHeight - (rect?.bottom || 0)
  if (spaceBelow < 200) {
    setDropdownAbove(true)  // Show above input
  }
  setShowDropdown(true)
}

// In JSX:
className={dropdownAbove
  ? "absolute bottom-full left-0 right-0 mb-1 ..."
  : "absolute top-full left-0 right-0 mt-1 ..."
}
```

---

## Accessibility Quick Checks

- [ ] Focus ring visible when using Tab key
- [ ] Arrow keys navigate dropdown items
- [ ] Enter key selects highlighted item
- [ ] Escape key closes dropdown
- [ ] Focus returns to input after selection
- [ ] Screen reader announces dropdown role and items
- [ ] All text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Works with browser high contrast mode
- [ ] Touch targets 44px+ on mobile

---

## Common Issues & Solutions

### Issue: Dropdown extends below viewport on mobile
**Solution:** Detect available space and position above input if needed
```typescript
const spaceBelow = window.innerHeight - inputRect.bottom
if (spaceBelow < 200) setDropdownAbove(true)
```

### Issue: Hard to tap items on mobile
**Solution:** Increase padding from py-2 to py-3
```html
<button className="py-3 md:py-2">  <!-- 40px on mobile, 32px on desktop -->
```

### Issue: Hover state hard to see
**Solution:** Add font-semibold and smoother transition
```html
className="... hover:font-semibold transition-colors duration-150"
```

### Issue: Keyboard users can't see focused item
**Solution:** Add focus ring styling
```html
className="... focus-visible:ring-2 focus-visible:ring-blue-500"
```

### Issue: Screen reader doesn't announce dropdown
**Solution:** Add ARIA attributes
```html
<div role="listbox" id="command-dropdown">
  <button role="option" aria-selected={isFocused}>
```

---

## File Locations

**Main Implementation:**
- File: `/Users/andrejzadoroznyj/Downloads/Go_practice/Cursor + CC/File Organizer. CC/app/page.tsx`
- Lines to modify: 19-24 (state), 259-277 (form UI), add handlers throughout

**Reference Documents:**
- Design Analysis: `docs/DROPDOWN_UI_REVIEW.md`
- Design Tokens: `docs/DROPDOWN_DESIGN_TOKENS.md`
- Implementation Guide: `docs/DROPDOWN_IMPLEMENTATION_GUIDE.md`
- This Quick Reference: `docs/QUICK_REFERENCE.md`

---

## Testing Checklist

### Functional
- [ ] Click input → dropdown opens
- [ ] Click command → input populated, dropdown closed, form submitted
- [ ] Click outside → dropdown closed
- [ ] Hover item → background + text color + weight change

### Accessibility
- [ ] Tab to input → focus visible
- [ ] Arrow keys → navigate items
- [ ] Enter → select item
- [ ] Escape → close dropdown
- [ ] Screen reader → announces role, items, selected state

### Mobile
- [ ] 320px width → dropdown visible
- [ ] Touch targets → 44px+ height
- [ ] Dropdown doesn't overflow → viewport

### Browser
- [ ] Chrome, Firefox, Safari, Edge
- [ ] Mobile Safari (iOS), Chrome Mobile (Android)
- [ ] High contrast mode readable

---

## Performance Tips

1. **Avoid re-rendering command list**
   ```typescript
   const PRESET_COMMANDS = useMemo(() => [...], [])
   ```

2. **Use useCallback for handlers**
   ```typescript
   const handleSelectCommand = useCallback((cmd) => { ... }, [])
   ```

3. **Only listen for click-outside when dropdown is open**
   ```typescript
   useEffect(() => {
     if (!showDropdown) return  // Don't listen if closed
     // ...
   }, [showDropdown])
   ```

4. **Smooth transitions without jank**
   ```html
   className="transition-colors duration-150"  <!-- Not transform or shadow -->
   ```

---

## Preset Commands

```
1. List Downloads             → "list my downloads"
2. Organize by Type          → "organize downloads by type"
3. Organize by Date          → "organize downloads by date"
4. Find Large Files          → "find large files"
5. Find PDFs                 → "find PDF files"
6. Find Images               → "find image files"
7. Move to Documents         → "move documents to Documents folder"
```

**Optional Enhancement:** Add emoji icons for scannability
```
📂 List Downloads
✏️ Organize by Type
📅 Organize by Date
📊 Find Large Files
📄 Find PDFs
🖼️ Find Images
➡️ Move to Documents
```

---

## Estimated Effort

| Phase | Task | Time |
|-------|------|------|
| 1 | Core functionality (click to select) | 2-3h |
| 2 | Accessibility + mobile fixes | 2-3h |
| 3 | Polish + optimization | 2-3h |
| | **Testing & QA** | **4-6h** |
| | **TOTAL** | **12-18h** |

---

## Launch Checklist

**Before Launch:**
- [ ] All critical issues fixed
- [ ] All high-priority issues fixed
- [ ] WCAG AA compliance verified
- [ ] Mobile testing passed
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Cross-browser tested
- [ ] No console errors
- [ ] Performance acceptable

**Post-Launch:**
- [ ] Monitor user engagement
- [ ] Gather feedback on commands
- [ ] Watch for accessibility issues
- [ ] Plan Phase 2 improvements

---

**Quick Reference Version:** 1.0
**Last Updated:** 2026-02-10
**Review Cycle:** After implementation, gather feedback for Phase 2
