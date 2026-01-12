# FlashFusion Design System

**Version:** 1.0.0  
**Status:** Production Ready  
**WCAG Compliance:** AA Level Verified

A complete dark-first glassmorphism design system for AI-powered workflow orchestration.

---

## Quick Start

### Using Tailwind Utilities

```jsx
// Primary button with glow
<button className="bg-primary text-white hover:shadow-glow-primary">
  Get Started
</button>

// Glass card
<div className="glass rounded-xl p-6">
  <h2 className="text-2xl font-heading font-semibold text-primary">
    FlashFusion
  </h2>
</div>

// Secondary button with rose glow
<button className="bg-secondary hover:shadow-glow-secondary">
  Learn More
</button>
```

### Color Scales

```jsx
// Primary purple scale (50-900)
<div className="bg-primary-500">  {/* #a855f7 - Brand color */}
<div className="bg-primary-600">  {/* #9333ea - Hover state */}
<div className="bg-primary-400">  {/* #c084fc - Accent */}

// Secondary rose scale (50-900)
<div className="bg-secondary-500"> {/* #f472b6 - Brand color */}
<div className="bg-secondary-600"> {/* #ec4899 - Hover state */}
```

### Typography

```jsx
// Headings use Poppins
<h1 className="text-5xl font-heading font-bold">
  Heading Text
</h1>

// Body uses Inter
<p className="text-base font-body">
  Body text with excellent readability
</p>
```

---

## Core Files

| File | Purpose | Size |
|------|---------|------|
| `design-tokens.json` | Figma/Storybook tokens | 19KB |
| `docs/BRAND_GUIDELINES.md` | Complete brand guide | 15KB |
| `src/design-system/color-palette.json` | Color system | 3KB |
| `src/design-system/component-colors.json` | Component specs | 10KB |
| `src/design-system/accessibility-report.json` | WCAG report | 10KB |
| `tailwind.config.js` | Tailwind theme | - |
| `src/index.css` | CSS variables | - |

---

## Brand Colors

### Primary Purple
```
Brand Color: #a855f7 (primary-500)
Use for: CTAs, links, focus states, brand moments
```

### Secondary Rose
```
Accent Color: #f472b6 (secondary-500)
Use for: Secondary CTAs, accents, variety
```

### Dark Background
```
Main Background: #0f0618
Surface: #18082d
Elevated: #1f0d3a
```

### Text Colors (Dark Mode)
```
Primary: #f3e8ff (14.23:1 contrast - AAA)
Secondary: #e9d5ff (12.45:1 contrast - AAA)
Muted: #c084fc (5.23:1 contrast - AA)
```

---

## Utility Classes

### Glassmorphism
```jsx
.glass         // Light glass (rgba(255,255,255,0.05), blur(12px))
.glass-medium  // Medium glass (rgba(255,255,255,0.1), blur(16px))
.glass-strong  // Strong glass (rgba(255,255,255,0.15), blur(20px))
```

### Glow Effects
```jsx
.glow-primary     // Purple glow (0 0 20px rgba(168,85,247,0.4))
.glow-secondary   // Rose glow (0 0 20px rgba(244,114,182,0.4))
.text-glow-primary   // Text glow purple
.text-glow-secondary // Text glow rose
```

### Tailwind Shadows
```jsx
shadow-glow-primary-sm    // Small purple glow
shadow-glow-primary       // Medium purple glow
shadow-glow-primary-lg    // Large purple glow

shadow-glow-secondary-sm  // Small rose glow
shadow-glow-secondary     // Medium rose glow
shadow-glow-secondary-lg  // Large rose glow
```

---

## Component Examples

### Buttons

```jsx
// Primary
<button className="bg-primary hover:bg-primary-600 hover:shadow-glow-primary 
                   text-white font-heading font-semibold px-6 py-3 rounded-lg
                   transition-all duration-200">
  Primary Action
</button>

// Secondary
<button className="bg-secondary hover:bg-secondary-600 hover:shadow-glow-secondary
                   text-white font-heading font-semibold px-6 py-3 rounded-lg
                   transition-all duration-200">
  Secondary Action
</button>

// Outline
<button className="border-2 border-primary text-primary hover:bg-primary/10
                   hover:shadow-glow-primary-sm font-heading font-semibold 
                   px-6 py-3 rounded-lg transition-all duration-200">
  Outline Button
</button>

// Ghost
<button className="text-foreground hover:bg-primary/10 font-heading font-semibold
                   px-6 py-3 rounded-lg transition-all duration-200">
  Ghost Button
</button>
```

### Cards

```jsx
// Standard Card
<div className="bg-card border border-border rounded-xl p-6 shadow-md">
  <h3 className="text-xl font-heading font-semibold mb-2">Card Title</h3>
  <p className="text-foreground font-body">Card content</p>
</div>

// Glass Card
<div className="glass rounded-xl p-6">
  <h3 className="text-xl font-heading font-semibold mb-2">Glass Card</h3>
  <p className="text-foreground font-body">With glassmorphism effect</p>
</div>

// Interactive Card
<div className="bg-card border border-border rounded-xl p-6 
                hover:border-primary hover:shadow-glow-primary-sm
                transition-all duration-200 cursor-pointer">
  <h3 className="text-xl font-heading font-semibold mb-2">Clickable Card</h3>
  <p className="text-foreground font-body">Hover to see effect</p>
</div>
```

### Forms

```jsx
// Input
<input 
  type="text"
  className="w-full bg-glass border border-border rounded-lg px-4 py-3
             text-foreground placeholder:text-muted
             focus:border-primary focus:ring-2 focus:ring-primary/30
             transition-all duration-200"
  placeholder="Enter text..."
/>

// Label
<label className="block text-sm font-heading font-semibold text-secondary mb-2">
  Field Label
</label>

// Error Input
<input 
  type="text"
  className="w-full bg-error/5 border border-error rounded-lg px-4 py-3
             text-foreground focus:border-error focus:ring-2 focus:ring-error/30"
/>
<p className="text-sm text-error-400 mt-1">Error message here</p>
```

### Alerts

```jsx
// Success
<div className="bg-success/10 border border-success rounded-lg p-4 
                flex items-center gap-3">
  <CheckIcon className="text-success-400" />
  <p className="text-success-100 font-body">Success message</p>
</div>

// Warning
<div className="bg-warning/10 border border-warning rounded-lg p-4
                flex items-center gap-3">
  <AlertIcon className="text-warning-400" />
  <p className="text-warning-100 font-body">Warning message</p>
</div>

// Error
<div className="bg-error/10 border border-error rounded-lg p-4
                flex items-center gap-3">
  <XIcon className="text-error-400" />
  <p className="text-error-100 font-body">Error message</p>
</div>

// Info
<div className="bg-info/10 border border-info rounded-lg p-4
                flex items-center gap-3">
  <InfoIcon className="text-info-400" />
  <p className="text-info-100 font-body">Info message</p>
</div>
```

### Badges

```jsx
// Primary
<span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-heading font-semibold">
  Primary
</span>

// Secondary
<span className="bg-secondary text-white px-3 py-1 rounded-full text-sm font-heading font-semibold">
  Secondary
</span>

// Success
<span className="bg-success text-white px-3 py-1 rounded-full text-sm font-heading font-semibold">
  Success
</span>

// Outline
<span className="border border-primary text-primary px-3 py-1 rounded-full text-sm font-heading font-semibold">
  Outline
</span>

// Ghost
<span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-heading font-semibold">
  Ghost
</span>
```

---

## Accessibility

### WCAG AA Compliant

✅ **Body Text:** 14.23:1 contrast (exceeds AAA 7:1)  
✅ **UI Components:** 3.21:1 contrast (meets AA 3:1)  
✅ **Interactive Elements:** 4.89:1+ contrast (meets AA 4.5:1)

### Best Practices

- Always use semantic HTML elements
- Provide aria-labels for icon buttons
- Include alt text for images
- Maintain logical tab order
- Use clear focus indicators
- Never rely on color alone to convey information

### Focus States

All interactive elements have visible focus indicators:

```jsx
className="focus:outline-2 focus:outline-primary focus:outline-offset-2
           focus:ring-2 focus:ring-primary/30"
```

---

## Typography Scale

| Element | Size | Weight | Font | Line Height |
|---------|------|--------|------|-------------|
| H1 | 48px (text-5xl) | 700 (Bold) | Poppins | 1.2 |
| H2 | 36px (text-4xl) | 600 (SemiBold) | Poppins | 1.2 |
| H3 | 30px (text-3xl) | 600 (SemiBold) | Poppins | 1.3 |
| H4 | 24px (text-2xl) | 600 (SemiBold) | Poppins | 1.3 |
| H5 | 20px (text-xl) | 600 (SemiBold) | Poppins | 1.4 |
| H6 | 18px (text-lg) | 600 (SemiBold) | Poppins | 1.4 |
| Body Large | 18px (text-lg) | 400 (Regular) | Inter | 1.6 |
| Body | 16px (text-base) | 400 (Regular) | Inter | 1.6 |
| Body Small | 14px (text-sm) | 400 (Regular) | Inter | 1.5 |
| Caption | 12px (text-xs) | 400 (Regular) | Inter | 1.4 |

---

## Design Principles

### 1. Dark-First
Optimized for dark mode with #0f0618 background. Light mode supported but dark is primary.

### 2. Glassmorphism
Use glass overlays for elevated surfaces. Apply backdrop blur for depth.

### 3. Neon Accents
Strategic use of glowing purple and rose. Reserve for important moments.

### 4. High Contrast
Maintain WCAG AA minimum (4.5:1 for text). Strive for AAA where possible.

### 5. Fluid & Responsive
Mobile-first approach. Smooth transitions. Minimum 44x44px touch targets.

### 6. Purposeful Animation
Motion with intention. 200-300ms transitions. Provide reduced motion option.

---

## Resources

- **Complete Guide:** `docs/BRAND_GUIDELINES.md`
- **Color Palette:** `src/design-system/color-palette.json`
- **Component Colors:** `src/design-system/component-colors.json`
- **Accessibility Report:** `src/design-system/accessibility-report.json`
- **Design Tokens:** `design-tokens.json`
- **Delivery Summary:** `FLASHFUSION_DELIVERY_SUMMARY.md`

---

## Integration

### Figma
Import `design-tokens.json` using Figma Tokens plugin.

### Storybook
```javascript
import tokens from './design-tokens.json';
```

### CSS-in-JS
```javascript
const theme = {
  colors: {
    primary: 'hsl(var(--primary))',
    // ... rest of theme
  }
}
```

---

## Support

For questions about implementation:
1. Review `docs/BRAND_GUIDELINES.md`
2. Check `src/design-system/accessibility-report.json` for color guidance
3. Refer to component examples in this README

---

**FlashFusion Design System v1.0.0**  
*Built for creators. Designed for impact.*
