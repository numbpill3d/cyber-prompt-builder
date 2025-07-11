# UI Aesthetic Guide

This document outlines the consistent cyber/futuristic aesthetic maintained throughout the Cyber Prompt Builder application.

## Color Palette

### Primary Colors
- **Cyber Bright Blue**: `#1EAEDB` - Primary accent color for buttons, borders, and highlights
- **Cyber Sky Blue**: `#33C3F0` - Secondary accent color for hover states and gradients
- **Cyber Ice Blue**: `#D3E4FD` - Light background color and subtle highlights
- **Cyber Black**: `#0D0D0F` - Dark text and code backgrounds
- **Cyber White**: `#FFFFFF` - Primary background and text color

### Usage Guidelines
- Use `cyber-bright-blue` for primary interactive elements, borders, and key text
- Use `cyber-sky-blue` for hover states and secondary elements
- Use `cyber-ice-blue` for subtle backgrounds and light accents
- Use `cyber-black` for text on light backgrounds and code displays
- Use `cyber-white` for primary backgrounds and text on dark elements

## Typography

### Font Families
- **Orbitron**: Used for headings, titles, labels, and important UI text
- **Mono/Monospace**: Used for code, technical text, and terminal-style elements
- **Default Sans**: Used for body text and descriptions

### Implementation
```css
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.font-mono { font-family: monospace; }
```

## Visual Effects

### Core Classes
- **cyberborder**: Adds cyber-style border with corner accents
- **ice-card**: Semi-transparent white background with backdrop blur
- **hover-glow**: Adds glowing shadow effect on hover
- **hover-lift**: Subtle transform lift effect on hover
- **chrome-gradient**: Metallic gradient background
- **glassmorphism**: Glass-like transparency effect

### Animations
- **animate-pulse**: For status indicators and loading states
- **animate-glow**: For glowing effects
- **animate-scanline**: For scanning line effects
- **animate-shimmer**: For shimmer loading effects

## Component Styling Standards

### Buttons
- Use `font-orbitron` for button text
- Primary buttons: `bg-cyber-bright-blue text-white hover:bg-cyber-sky-blue`
- Outline buttons: `border-cyber-bright-blue text-cyber-bright-blue hover:bg-cyber-bright-blue hover:text-white`
- Include `hover-lift` and `hover-glow` effects

### Cards
- Always include `cyberborder ice-card hover-glow` classes
- Titles should use `font-orbitron text-cyber-bright-blue`
- Content should maintain proper contrast with `text-cyber-black`

### Form Elements
- Inputs/textareas: `border-cyber-bright-blue border-opacity-30 bg-white bg-opacity-80`
- Labels: `font-orbitron text-cyber-bright-blue`
- Focus states: `focus-visible:ring-cyber-bright-blue`
- Hover states: `hover:border-cyber-bright-blue hover:border-opacity-60`

### Tabs
- Tab list: `bg-cyber-ice-blue border-cyber-bright-blue border-opacity-30`
- Active tab: `bg-cyber-bright-blue text-white`
- Inactive tabs: `hover:bg-cyber-bright-blue hover:bg-opacity-20`

### Code Display
- Background: `bg-cyber-black` for dark code themes
- Text: `text-cyber-ice-blue` for normal code text
- Highlights: `text-cyber-bright-blue` for added/changed lines
- Borders: Include `cyberborder` class

## Layout Patterns

### Main Layout
- Background: `bg-gradient-to-br from-cyber-ice-blue to-white`
- Text: `text-cyber-black`
- Navbar: `glassmorphism chrome-gradient`
- Sidebar: `bg-white bg-opacity-80 border-cyber-bright-blue border-opacity-20`

### Status Indicators
- Active/Ready: Green dot with `bg-green-500`
- Error/Inactive: Red dot with `bg-red-500`
- Processing: Blue dot with `bg-cyber-bright-blue animate-pulse`

## Interactive Elements

### Hover States
- Always include transition effects: `transition-all`
- Use `hover-lift` for subtle elevation
- Use `hover-glow` for glowing effects
- Color transitions should be smooth and consistent

### Loading States
- Use `animate-pulse` for status indicators
- Use `animate-spin` for loading spinners
- Maintain cyber color scheme in loading elements

## Accessibility

### Contrast Requirements
- Ensure sufficient contrast between text and backgrounds
- Use `text-cyber-black` on light backgrounds
- Use `text-white` or `text-cyber-ice-blue` on dark backgrounds

### Focus States
- All interactive elements must have visible focus states
- Use `focus-visible:ring-cyber-bright-blue` for focus rings
- Maintain keyboard navigation support

## Implementation Checklist

When creating new components, ensure:

- [ ] Uses appropriate cyber color palette
- [ ] Includes proper typography (Orbitron for headings, mono for code)
- [ ] Has consistent hover and focus states
- [ ] Includes appropriate visual effects (cyberborder, hover-glow, etc.)
- [ ] Maintains accessibility standards
- [ ] Follows established animation patterns
- [ ] Uses consistent spacing and sizing
- [ ] Integrates with the overall layout system

## Updated Components

The following components have been updated to maintain aesthetic consistency:

- ✅ Button component - Updated with cyber colors and Orbitron font
- ✅ Card components - Added cyberborder, ice-card, and hover-glow effects
- ✅ Input components - Updated with cyber borders and styling
- ✅ Textarea components - Consistent with input styling
- ✅ Tabs components - Updated with cyber aesthetic
- ✅ Select components - Updated with cyber styling
- ✅ Label components - Added Orbitron font and cyber colors
- ✅ DiffView component - Updated code display colors

All existing custom components (ChatInterface, CodeEditor, PromptInput, ActionButtons, etc.) already maintain the proper cyber aesthetic.