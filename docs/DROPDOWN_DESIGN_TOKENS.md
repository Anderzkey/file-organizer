# Dropdown Design Tokens & Specifications

## Design System Overview

This document defines the complete design token specification for the Preset Commands Dropdown feature, ensuring consistency with the File Organizer design language.

---

## Color Tokens

### Semantic Colors

#### Primary Action Color
```
Name:              Primary Blue
Hex:               #3b82f6
RGB:               (59, 130, 246)
Tailwind:          bg-blue-500, text-blue-600, border-blue-500
Usage:             Hover states, focus rings, primary actions
WCAG Contrast:     8.6:1 on white background (AA+)
Accessibility:     Safe for colorblind users with supporting visual indicators
```

#### Text Colors
```
Primary Text
  Hex:             #374151 (gray-700)
  RGB:             (55, 65, 81)
  Size:            14px (text-sm)
  Weight:          400 (normal)
  Usage:           Default item text
  Contrast:        10.5:1 on white (AAA)

Secondary Text
  Hex:             #6b7280 (gray-600)
  RGB:             (107, 114, 128)
  Size:            12px (text-xs)
  Weight:          400 (normal)
  Usage:           Command descriptions
  Contrast:        7.1:1 on white (AA)

Label Text (emphasized)
  Hex:             #111827 (gray-900)
  RGB:             (17, 24, 39)
  Size:            14px (text-sm)
  Weight:          600 (semibold)
  Usage:           Command labels
  Contrast:        19:1 on white (AAA)

Hover/Active Text
  Hex:             #2563eb (blue-600)
  RGB:             (37, 99, 235)
  Size:            14px (text-sm)
  Weight:          600 (semibold) on hover
  Usage:           Hovered/focused items
  Contrast:        8.6:1 on white (AA)
```

#### Background Colors
```
Container Background
  Hex:             #ffffff (white)
  RGB:             (255, 255, 255)
  Usage:           Dropdown container
  Notes:           Ensures maximum contrast for text

Item Default
  Hex:             #ffffff (white)
  RGB:             (255, 255, 255)
  Usage:           Item background at rest

Item Hover
  Hex:             #eff6ff (blue-50)
  RGB:             (239, 245, 255)
  Usage:           Background on hover
  Alternative:     #dbeafe (blue-100) for stronger affordance

Item Focus
  Hex:             #eff6ff (blue-50)
  RGB:             (239, 245, 255)
  Usage:           Background when keyboard-focused

Item Disabled
  Hex:             #f3f4f6 (gray-100)
  RGB:             (243, 244, 246)
  Usage:           Disabled item background
```

#### Border Colors
```
Container Border
  Hex:             #e5e7eb (gray-200)
  RGB:             (229, 231, 235)
  Width:           1px
  Usage:           Dropdown container outline
  Opacity:         100%

Item Divider
  Hex:             #f3f4f6 (gray-100)
  RGB:             (243, 244, 246)
  Width:           1px
  Usage:           Between dropdown items
  Opacity:         100%
  Note:            Removed from last item (last:border-b-0)

Focus Ring
  Hex:             #3b82f6 (blue-500)
  RGB:             (59, 130, 246)
  Width:           2px
  Offset:          1px
  Usage:           Keyboard focus indicator
  Opacity:         100%
```

### Color Contrast Reference Table

| Element | Foreground | Background | Ratio | WCAG AA | WCAG AAA |
|---------|-----------|-----------|-------|---------|----------|
| Default Text | #374151 | #ffffff | 10.5:1 | ✅ | ✅ |
| Secondary Text | #6b7280 | #ffffff | 7.1:1 | ✅ | ✅ |
| Label Text | #111827 | #ffffff | 19:1 | ✅ | ✅ |
| Hover Text | #2563eb | #ffffff | 8.6:1 | ✅ | ✅ |
| Hover Text | #2563eb | #eff6ff | 5.2:1 | ✅ | ❌ |
| Hover Text | #2563eb | #dbeafe | 7.8:1 | ✅ | ✅ |
| Focus Ring | #3b82f6 | #ffffff | 8.6:1 | ✅ | ✅ |

---

## Typography Tokens

### Font Family
```
Primary Font Stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Fallback:           system-ui, sans-serif
Monospace:          'Monaco', 'Menlo', 'Ubuntu Mono', monospace (for command preview)
```

### Font Sizes
```
Command Label
  Size:            14px (Tailwind text-sm)
  Weight:          600 (Tailwind font-semibold)
  Line Height:     1.5rem (1.5)
  Letter Spacing:  Normal

Command Description
  Size:            12px (Tailwind text-xs)
  Weight:          400 (Tailwind font-normal)
  Line Height:     1rem (1)
  Letter Spacing:  Normal
  Color:           #6b7280 (gray-600)
```

### Font Weights
```
Normal:    400 (default)
Semibold: 600 (labels, hover states)
Bold:     700 (not used in dropdown)
```

### Line Heights
```
Text:      1.5    (24px for 16px text)
Compact:   1.25   (20px for 16px text, not used here)
```

---

## Spacing Tokens

### Container Spacing
```
Top Offset (from input)
  Value:     4px (Tailwind mt-1)
  Purpose:   Visual separation between input and dropdown
  Purpose:   Sufficient space for focus ring

Horizontal Padding (container)
  Value:     16px (Tailwind px-4)
  Total:     32px (16px left + 16px right)
  Purpose:   Content inset from edges

Container Border
  Radius:    8px (Tailwind rounded-lg)
  Width:     1px
```

### Item Spacing
```
Horizontal Padding (items)
  Value:     16px (Tailwind px-4)
  Alignment: Flush left with container
  Purpose:   Consistent with container

Vertical Padding (items)
  Value:     8px (Tailwind py-2)
  Total:     16px (8px top + 8px bottom)
  Purpose:   Compact but readable
  Mobile:    12px (Tailwind py-3) for larger touch targets

Item Height
  Calculated:  ~32px (py-2) or 40px (py-3 on mobile)
  With border: ~33px or 41px

Text Spacing (internal)
  Label to Command:   4px (mt-0.5)
  Icon to Label:      8px (mr-2)
  Command indent:     24px (ml-6, aligns under label if icon present)
```

### Vertical Rhythm
```
Total Visible Items (max-h-64):
  Max Height:    256px (Tailwind max-h-64)
  Item Height:   ~32-33px
  Visible Items: 7-8 items before scroll
  Scroll Height: Handled by overflow-y-auto
```

---

## Shadow & Elevation Tokens

### Box Shadows
```
Dropdown Container
  Shadow Class:  shadow-lg (Tailwind)
  Shadow Value:  0 10px 15px -3px rgba(0, 0, 0, 0.1),
                 0 4px 6px -2px rgba(0, 0, 0, 0.05)
  Purpose:       Elevation and depth
  Usage:         Primary shadow for dropdown
  Z-index:       10

Focus Ring
  Width:         2px
  Color:         #3b82f6
  Offset:        1px
  Blur Radius:   0px
  Spread:        0px
```

---

## Animation & Transition Tokens

### Transitions
```
Color Transitions
  Property:      background-color, color
  Duration:      150ms (Tailwind duration-150)
  Easing:        cubic-bezier(0.4, 0, 0.2, 1) (Tailwind ease-out)
  Usage:         Hover and focus state changes

Opacity Transitions (future)
  Property:      opacity
  Duration:      100ms
  Easing:        ease-out
  Usage:         Dropdown appear/disappear (future enhancement)
```

### Motion Preferences
```
Reduced Motion (WCAG AAA)
  Prefixed Query: prefers-reduced-motion: reduce
  Duration:       0ms (instant)
  Or:            Remove animations, keep state changes instant
  Implementation: motion-reduce:transition-none (Tailwind)
```

---

## Component Dimensions

### Dropdown Container
```
Width:           100% of parent (left-0 right-0)
Max Width:       600px (recommended, not enforced)
Min Height:      Auto (based on items)
Max Height:      256px (max-h-64), scrollable
Overflow:        Vertical scroll if needed, horizontal hidden
Border Radius:   8px (rounded-lg)
```

### Individual Items
```
Width:           100% of container
Height:          32px (py-2) or 40px (py-3 mobile)
Min Height:      32px
Padding:         16px horizontal, 8px vertical (or 12px mobile)
Align Content:   Left-aligned (text-left)
```

### Touch Targets (Mobile)
```
Recommended:   44px × 44px (WCAG AA)
Current (Rest):  32px × 44px (width × height)
Current (Mobile): 40px × 44px (improved)

Enhancement: Consider py-3 (12px) on mobile to reach 44px height
```

---

## Z-index Strategy

```
Body Content:           z-index: 0 (default)
Messages/Chat:          z-index: 0-1
Input Form:             z-index: 1
Dropdown Container:     z-index: 10
Modal/Overlay (future): z-index: 50+
Tooltip (future):       z-index: 40

Reasoning:
  - Dropdown needs to appear above all page content
  - 10 provides buffer for future enhancements
  - Prevents accidentally going above modals (which use 40-50+)
```

---

## Responsive Design Tokens

### Breakpoints (Tailwind)
```
Mobile:           0px - 640px (sm: 640px)
Tablet:           641px - 1024px (md: 768px)
Desktop:          1025px+ (lg: 1024px)

File Organizer Breakpoints (custom):
  sm: 640px   (default Tailwind)
  md: 768px   (default Tailwind)
  lg: 1024px  (default Tailwind)
  xl: 1280px  (default Tailwind)
```

### Mobile Adjustments
```
Item Padding:      py-2 → py-3 (increase touch target)
Font Size:         text-sm (unchanged)
Container Margin:  mt-1 (unchanged, 4px is fine)
Max Height:        max-h-64 (unchanged, or increase to max-h-96)
Position:          absolute top-full (unchanged, or add dynamic top/bottom)
```

### Responsive Layout Example
```
Mobile (< 640px)
  Input:          Full width with padding px-4
  Dropdown:       Full width of input (left-0 right-0)
  Item Height:    40px (py-3)
  Visible Items:  5-6 before scroll

Tablet (641px - 1024px)
  Input:          Full width with padding px-6
  Dropdown:       Full width of input
  Item Height:    32px (py-2)
  Visible Items:  7-8 before scroll

Desktop (1025px+)
  Input:          80-90% width
  Dropdown:       Full width of input
  Item Height:    32px (py-2)
  Visible Items:  7-8 before scroll
```

---

## Accessibility Tokens

### Focus Indicators
```
Focus Ring
  Color:           #3b82f6 (blue-500)
  Width:           2px
  Offset:          1px
  Style:           Solid
  Visibility:      Always visible for keyboard users
  Class:           focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500

Visibility (High Contrast Mode)
  Thickness:       Increases to 3px
  Color:           Shifts to system high contrast color
  Automatic:       Handled by browser
```

### ARIA Attributes
```
Input (Trigger)
  aria-expanded:        true | false (dropdown open/closed)
  aria-controls:        "command-dropdown" (connects to dropdown id)
  aria-haspopup:        "listbox" (declares interaction type)

Dropdown Container
  id:                   "command-dropdown"
  role:                 "listbox"

Dropdown Items
  role:                 "option"
  aria-selected:        true | false (focused item)
  tabIndex:             0 (focused) or -1 (not focused)
```

### Keyboard Navigation
```
Arrow Down:       Move focus down, open if closed
Arrow Up:         Move focus up, wrap to bottom
Enter/Return:     Select focused item, close dropdown
Escape:           Close dropdown, return focus to input
Tab:              Navigate out of dropdown (standard)
Shift+Tab:        Navigate backwards out of dropdown (standard)

When Dropdown Closed:
  ArrowDown:      Open dropdown and focus first item
  Type:           Input text, keep dropdown closed
```

### Color Blindness Considerations
```
Red-Green Blindness (Most Common)
  Issue:           Blue-50 on white may not show enough contrast
  Solution:        Add font-semibold or border indicator
  Current State:   Acceptable with supporting visual cues

Blue-Yellow Blindness
  Issue:           Blue colors harder to distinguish
  Solution:        Add shape/position changes on hover
  Current State:   Acceptable (position change indicates selection)

Monochromacy (Complete Color Blindness)
  Issue:           All colors appear as grayscale
  Solution:        Rely on text weight, size, position
  Current State:   Needs enhancement - add font-semibold
```

---

## State Definitions

### Rest State
```
Container:         White background, gray border
Items:             White background, gray text
Text:              Normal weight, normal size
Cursor:            Default
Affordance:        Subtle dividers between items
Icon:              Visible (if included)
```

### Hover State (Item)
```
Container:         Unchanged (white)
Hovered Item:      Light blue background (#eff6ff)
Hovered Text:      Blue color (#2563eb), semibold weight
Other Items:       Unchanged
Cursor:            Pointer
Affordance:        Background + text color + weight change
```

### Focus State (Keyboard)
```
Container:         Unchanged (white)
Focused Item:      Light blue background (#eff6ff)
Focused Text:      Blue color (#2563eb), semibold weight
Focus Ring:        Blue ring around item (2px, 1px offset)
Cursor:            Default
Affordance:        Ring + background + text changes
```

### Active State (Selected)
```
Container:         Closes immediately after selection
Item Clicked:      Removed from view
Input:             Populates with selected command
Dropdown:          Hidden (z-index: -1 or display: none)
Focus:             Returns to input
Affordance:        Form submission behavior
```

### Disabled State (Loading)
```
Container:         Can still show (or hide, implementation choice)
Items:             Grayed out or hidden
Text:              Gray color (#9ca3af)
Cursor:            Not-allowed
Opacity:           50% or 0 (hidden)
Affordance:        Clearly disabled appearance
```

---

## File Structure for Implementation

### CSS Classes Required
```
Container:
  - absolute, top-full, left-0, right-0, mt-1
  - bg-white, border, border-gray-200
  - rounded-lg, shadow-lg, z-10
  - max-h-64, overflow-y-auto

Item Button:
  - w-full, text-left
  - px-4, py-2 (or py-3 mobile)
  - hover:bg-blue-50, hover:text-blue-600
  - border-b, border-gray-100, last:border-b-0
  - text-sm, text-gray-700
  - focus-visible:ring-2, focus-visible:ring-blue-500, focus-visible:ring-offset-1
  - transition-colors, hover:font-semibold

Label (inside button):
  - font-medium, text-gray-700

Description (inside button):
  - text-xs, text-gray-500
```

### Tailwind Configuration (Existing)
```
Current Config: tailwind.config.ts (uses defaults)
No custom colors needed - all Tailwind defaults
No custom spacing needed - all Tailwind defaults
Consider extending if needed: `extend: { colors: { ... } }`
```

---

## Implementation Checklist

### Color Implementation
- [ ] Use #3b82f6 for primary blue (Tailwind blue-500)
- [ ] Use #eff6ff for hover backgrounds (Tailwind blue-50)
- [ ] Use #374151 for text (Tailwind gray-700)
- [ ] Use #6b7280 for secondary text (Tailwind gray-600)
- [ ] Verify contrast ratios in browser DevTools

### Spacing Implementation
- [ ] Container mt-1 (4px from input)
- [ ] Container px-4 (16px horizontal padding)
- [ ] Items px-4, py-2 (8px vertical padding)
- [ ] Items py-3 on mobile (12px for larger touch target)
- [ ] Items border-b border-gray-100 (1px dividers)

### Typography Implementation
- [ ] Label: text-sm, font-semibold (14px, 600 weight)
- [ ] Command: text-xs, text-gray-500 (12px, gray)
- [ ] Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- [ ] Line height: 1.5 (inherited from body)

### Shadow & Elevation
- [ ] shadow-lg on dropdown container
- [ ] z-10 for stacking context
- [ ] focus-visible:ring-2 for focus indicator
- [ ] focus-visible:ring-blue-500 for ring color
- [ ] focus-visible:ring-offset-1 for ring spacing

### Accessibility
- [ ] aria-expanded on input
- [ ] aria-controls connecting to dropdown id
- [ ] aria-haspopup="listbox"
- [ ] role="listbox" on container
- [ ] role="option" on items
- [ ] aria-selected on items
- [ ] tabIndex management (0 when focused, -1 otherwise)
- [ ] Keyboard navigation (arrows, enter, escape)

---

## Testing Tokens

### Visual Regression Test Points
```
1. Default state - No dropdown visible
2. Focus state - Input focused, dropdown open
3. Hover state - First item hovered
4. All items visible - Check at 320px, 768px, 1024px
5. Scroll state - Check when > 8 items (future)
6. Focus ring - Visible at 2px, 1px offset
7. High contrast mode - Ring clearly visible
8. Mobile responsive - Check breakpoints
```

### Color Contrast Test
```
1. Text #374151 on #ffffff - 10.5:1
2. Text #6b7280 on #ffffff - 7.1:1
3. Text #2563eb on #eff6ff - 5.2:1 (on hover)
4. Focus ring #3b82f6 on #ffffff - 8.6:1
```

### Animation Performance
```
Transitions (150ms):
  - background-color
  - color
  - No blur/shadow transitions (expensive)
  - No position changes (expensive)
```

---

## References

### Related Tailwind Classes
```
https://tailwindcss.com/docs/margin - mt-1
https://tailwindcss.com/docs/padding - px-4, py-2, py-3
https://tailwindcss.com/docs/border-radius - rounded-lg
https://tailwindcss.com/docs/box-shadow - shadow-lg
https://tailwindcss.com/docs/z-index - z-10
https://tailwindcss.com/docs/max-height - max-h-64
https://tailwindcss.com/docs/overflow - overflow-y-auto
https://tailwindcss.com/docs/focus - focus-visible:ring-*
```

### WCAG Guidelines
```
WCAG 2.1 Level AA: Minimum 4.5:1 contrast for normal text
WCAG 2.1 Level AAA: Minimum 7:1 contrast for normal text
WCAG 2.1 Focus Visible: Clear keyboard focus indicator
WCAG 2.1 Motion: Respect prefers-reduced-motion setting
```

---

**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Status:** Pre-implementation
**Review Cycle:** After implementation, test, and gather feedback
