# Mobile Navigation Specification

## Overview

This specification outlines the changes required to improve the mobile experience of the 10xRules.ai application while maintaining the current desktop behavior. The changes focus on implementing a mobile-first bottom navigation pattern and reorganizing the main panels for better accessibility.

## Components Affected

- `TwoPane.tsx` (main layout component)
- `Footer.tsx` (global footer)
- `CollectionsSidebar.tsx` (collections panel)
- `RuleBuilder.tsx` (builder panel)
- `RulePreview.tsx` (preview panel)

## Desktop Behavior (>= md breakpoint)

- Maintain current three-panel layout
- Keep the existing sidebar toggle functionality
- Preserve current footer visibility and positioning
- No changes to current panel distribution and sizing

## Mobile Behavior (< md breakpoint)

### Layout Changes

- Transform into a single-panel view with bottom navigation
- Hide the classic footer component
- Each panel (Collections, Builder, Preview) becomes a full-width view
- Remove the current top-right toggle button
- Make collections panel full width and height

### Bottom Navigation

- Fixed position at the bottom of the viewport
- Three equal-width navigation items:
  1. Collections
  2. Builder
  3. Preview
- Active state indication for current view
- Consistent with Fluent 2.0 design system
- Dark theme by default

### Panel Transitions

- Smooth transitions between panels (300ms duration)
- Maintain scroll position for each panel independently
- No content reflow during transitions

### Accessibility Requirements

- Minimum touch target size: 44x44px
- Clear visual feedback on active states
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## Technical Constraints

- Built with React 18.3
- Styled with Tailwind CSS 4
- State management via Zustand
- Icons from lucide-react
- Responsive breakpoints follow Tailwind defaults
- Dark mode as default theme

## Success Metrics

- Improved mobile usability score
- Reduced cognitive load for mobile users
- Maintained desktop experience quality
- Seamless responsive behavior across breakpoints
