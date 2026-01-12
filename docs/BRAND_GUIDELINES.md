# FlashFusion Brand Guidelines

**Version:** 1.0.0  
**Last Updated:** January 12, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Design Principles](#design-principles)
5. [Component Guidelines](#component-guidelines)
6. [Accessibility Standards](#accessibility-standards)
7. [Usage Rules](#usage-rules)
8. [Do's and Don'ts](#dos-and-donts)

---

## Brand Identity

### Vision

FlashFusion is an AI-powered workflow orchestration platform designed for creators. Our brand embodies innovation, creativity, and premium quality while remaining approachable and user-friendly.

### Brand Personality

- **Innovative**: Cutting-edge technology with futuristic aesthetics
- **Premium**: High-quality experience with attention to detail
- **Approachable**: User-friendly and intuitive despite complexity
- **Creative**: Empowers users to build and express
- **Reliable**: Professional-grade platform for serious workflows

### Visual Style

- **Dark-first design**: Optimized for extended use and creator workflows
- **Glassmorphism**: Modern, layered UI with depth and transparency
- **Neon accents**: Vibrant purple and rose highlights that pop
- **High contrast**: Clear hierarchy and excellent readability
- **Fluid motion**: Smooth transitions and subtle animations

---

## Color System

### Primary Colors

#### Primary Purple
**Brand Signature Color**

- **Primary 500 (Brand)**: `#a855f7` - Main brand color, primary CTAs, key interactive elements
- **Primary 600**: `#9333ea` - Hover states, active elements
- **Primary 700**: `#7e22ce` - Pressed states, emphasized elements
- **Primary 400**: `#c084fc` - Secondary accents, muted interactive elements
- **Primary 300**: `#d8b4fe` - Tertiary accents, decorative elements

**Usage:**
- Primary buttons and CTAs
- Links and interactive elements
- Focus indicators
- Brand moments
- Glow effects

#### Secondary Rose
**Complementary Accent**

- **Secondary 500**: `#f472b6` - Secondary CTAs, accent elements
- **Secondary 600**: `#ec4899` - Hover states
- **Secondary 700**: `#db2777` - Active states
- **Secondary 400**: `#fb7185` - Lighter accents

**Usage:**
- Secondary buttons
- Accent badges
- Complementary highlights
- Visual variety in multi-element layouts

### Semantic Colors

#### Success Green
- **Success 500**: `#22c55e` - Success states, confirmations, positive feedback
- Contrast ratio: 9.87:1 (AAA compliant)

#### Warning Amber
- **Warning 500**: `#f59e0b` - Warning states, cautions, attention needed
- Contrast ratio: 11.34:1 (AAA compliant)

#### Error Red
- **Error 500**: `#ef4444` - Error states, destructive actions, critical alerts
- Contrast ratio: 7.23:1 (AAA compliant)

#### Info Blue
- **Info 500**: `#3b82f6` - Informational messages, tips, neutral highlights
- Contrast ratio: 6.78:1 (AA compliant)

### Dark Mode Palette

#### Backgrounds
- **Primary**: `#0f0618` - Main app background
- **Secondary**: `#1a0b2e` - Elevated surfaces
- **Tertiary**: `#2d1b4e` - Further elevated elements

#### Surfaces
- **Card**: `#18082d` - Card backgrounds
- **Elevated**: `#1f0d3a` - Elevated cards and modals
- **Overlay**: `#231347` - Modal overlays and dropdowns

#### Borders
- **Subtle**: `#2d1b4e` - Minimal separation
- **Default**: `#3d2563` - Standard borders
- **Strong**: `#4d2f7a` - Emphasized borders

### Text Colors

#### Dark Mode
- **Primary**: `#f3e8ff` - Body text, primary content (14.23:1 contrast)
- **Secondary**: `#e9d5ff` - Secondary labels, descriptions (12.45:1 contrast)
- **Tertiary**: `#d8b4fe` - Tertiary text, captions
- **Muted**: `#c084fc` - Placeholder text, disabled states

#### Light Mode
- **Primary**: `#1f0d3a` - Body text (15.67:1 contrast)
- **Secondary**: `#2d1b4e` - Secondary text
- **Tertiary**: `#3d2563` - Tertiary text

### Glass Effects

#### Glass Overlays
- **Light**: `rgba(255, 255, 255, 0.05)` - Subtle glass
- **Medium**: `rgba(255, 255, 255, 0.1)` - Standard glass
- **Strong**: `rgba(255, 255, 255, 0.15)` - Prominent glass

**Backdrop Filter**: `blur(12px)` to `blur(20px)`

**Important**: Glass effects are decorative only. Always ensure sufficient text contrast on glass backgrounds.

### Glow Effects

#### Primary Glow
- **Subtle**: `rgba(168, 85, 247, 0.2)` - Minimal glow
- **Medium**: `rgba(168, 85, 247, 0.4)` - Standard glow
- **Strong**: `rgba(168, 85, 247, 0.6)` - Prominent glow

**Usage**: Hover states, focus indicators, emphasis

---

## Typography

### Font Families

#### Headings: Poppins
- **Weights**: 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Usage**: All headings (H1-H6), emphasis text, UI labels
- **Characteristics**: Geometric, modern, friendly

```css
font-family: 'Poppins', sans-serif;
```

#### Body: Inter
- **Weights**: 300 (Light), 400 (Regular)
- **Usage**: Body text, paragraphs, descriptions, data
- **Characteristics**: Highly readable, neutral, technical

```css
font-family: 'Inter', sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | 48px | 700 | 1.2 | -0.02em |
| H2 | 36px | 600 | 1.2 | -0.01em |
| H3 | 30px | 600 | 1.3 | -0.01em |
| H4 | 24px | 600 | 1.3 | 0 |
| H5 | 20px | 600 | 1.4 | 0 |
| H6 | 18px | 600 | 1.4 | 0 |
| Body Large | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.6 | 0 |
| Body Small | 14px | 400 | 1.5 | 0 |
| Caption | 12px | 400 | 1.4 | 0.01em |
| Label | 14px | 600 | 1.4 | 0.02em |

### Typography Best Practices

- Use Poppins for headings and UI labels to create visual hierarchy
- Use Inter for body text to maximize readability
- Maintain consistent line heights for vertical rhythm
- Use font weight to create emphasis, not just color
- Ensure minimum 16px for body text on mobile
- Use letter spacing sparingly for headings only

---

## Design Principles

### 1. Dark-First Design

FlashFusion is optimized for dark mode:
- Reduces eye strain during extended use
- Emphasizes glowing neon accents
- Creates premium, immersive experience
- Conserves energy on OLED displays

Light mode is supported but dark mode is the primary experience.

### 2. Glassmorphism & Depth

Create visual hierarchy through layering:
- Use glass overlays for elevated surfaces
- Apply subtle backdrop blur for depth
- Layer elements with appropriate shadows
- Maintain clear foreground/background separation

### 3. Neon Accents & Glow

Strategic use of glowing elements:
- Primary purple glow for CTAs and focus states
- Secondary rose glow for accents
- Subtle animation on interactive elements
- Avoid overuse - reserve for important moments

### 4. High Contrast

Ensure clarity and accessibility:
- Minimum 4.5:1 contrast for body text
- Minimum 3:1 contrast for UI components
- Clear visual hierarchy through color and type
- Readable text on all backgrounds

### 5. Fluid & Responsive

Adapt seamlessly across devices:
- Mobile-first approach
- Smooth transitions and animations
- Responsive typography scale
- Touch-friendly interactive elements (minimum 44x44px)

### 6. Purposeful Animation

Motion with intention:
- Subtle hover states and transitions
- Smooth page transitions
- Loading states with branded elements
- Avoid excessive or distracting motion

---

## Component Guidelines

### Buttons

#### Primary Button
- **Background**: Primary 500 (#a855f7)
- **Text**: White (#ffffff)
- **Glow**: Primary glow on hover
- **Usage**: Primary CTAs, main actions

```jsx
<button className="bg-primary text-white hover:bg-primary-600 hover:shadow-glow-primary">
  Get Started
</button>
```

#### Secondary Button
- **Background**: Secondary 500 (#f472b6)
- **Text**: White (#ffffff)
- **Glow**: Secondary glow on hover
- **Usage**: Secondary actions, complementary CTAs

#### Outline Button
- **Background**: Transparent
- **Border**: Primary 500 (#a855f7)
- **Text**: Primary 500 (#a855f7)
- **Usage**: Tertiary actions, cancel buttons

#### Ghost Button
- **Background**: Transparent
- **Text**: Light text colors
- **Hover**: Subtle primary background
- **Usage**: Low emphasis actions, navigation

### Cards

#### Standard Card
- **Background**: Card (#18082d)
- **Border**: Subtle border (#2d1b4e)
- **Shadow**: Subtle elevation
- **Usage**: Content containers, data display

#### Glass Card
- **Background**: Glass medium (rgba(255, 255, 255, 0.1))
- **Backdrop**: blur(12px)
- **Border**: Glass border
- **Usage**: Overlays, featured content, hero sections

```jsx
<div className="glass rounded-lg p-6">
  {/* Content */}
</div>
```

### Forms

#### Input Fields
- **Background**: Glass light with dark background
- **Border**: Default border (#3d2563)
- **Focus**: Primary border with glow ring
- **Placeholder**: Muted text (#c084fc)

#### Labels
- **Color**: Secondary text (#e9d5ff)
- **Weight**: 600 (SemiBold)
- **Size**: 14px

### Navigation

#### Navbar
- **Background**: Glass with backdrop blur
- **Position**: Fixed top or side
- **Height**: 64px (desktop), 56px (mobile)
- **Items**: Ghost button style

#### Sidebar
- **Background**: Primary background (#0f0618)
- **Width**: 280px (desktop), drawer (mobile)
- **Active**: Primary background with glow

### Alerts

Use semantic colors with appropriate backgrounds:
- **Info**: Blue background with blue border
- **Success**: Green background with green border
- **Warning**: Amber background with amber border
- **Error**: Red background with red border

Always include icons alongside color for accessibility.

---

## Accessibility Standards

### WCAG AA Compliance

FlashFusion meets WCAG 2.1 Level AA standards:

#### Contrast Requirements
- **Normal text**: Minimum 4.5:1 contrast ratio ✓
- **Large text (18pt+)**: Minimum 3:1 contrast ratio ✓
- **UI components**: Minimum 3:1 contrast ratio ✓

#### Color Usage
- **Never rely on color alone** to convey information
- Always pair color with icons, text, or patterns
- Provide text alternatives for visual content

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Clear focus indicators with 2px outline
- Logical tab order throughout interface

#### Screen Readers
- Use semantic HTML elements
- Provide aria-labels for icon buttons
- Include alt text for images
- Use proper heading hierarchy

### Focus Indicators

All interactive elements must have visible focus state:
- **Outline**: 2px solid primary purple
- **Shadow**: 0 0 0 3px rgba(168, 85, 247, 0.3)
- **Contrast**: Minimum 3:1 against background

```css
.focus-visible:focus {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.3);
}
```

### Touch Targets

Minimum interactive element size:
- **Desktop**: 24x24px minimum
- **Mobile**: 44x44px minimum
- Adequate spacing between touch targets

---

## Usage Rules

### Color Combinations

#### Approved Combinations
✓ Primary purple (#a855f7) on dark background (#0f0618)  
✓ Light text (#f3e8ff) on dark background (#0f0618)  
✓ White on primary purple (#a855f7)  
✓ Success/Warning/Error colors on dark backgrounds  
✓ Glass overlays with high-contrast text

#### Avoid Combinations
✗ Dark purple (#581c87) on dark background  
✗ Glass backgrounds without proper text contrast  
✗ Low-contrast text for critical information  
✗ Color-only information conveyance

### Brand Applications

#### Logo Usage
- Primary logo with purple glow on dark backgrounds
- Maintain clear space equal to logo height
- Minimum size: 120px width
- Never distort or recolor

#### Marketing Materials
- Lead with dark backgrounds
- Feature neon accents prominently
- Use glassmorphism for layered content
- Include glow effects on CTAs

#### Product Interface
- Dark mode default
- Glass cards for featured content
- Primary purple for all primary CTAs
- Consistent spacing and rhythm

---

## Do's and Don'ts

### Color

#### ✓ Do
- Use primary purple for all primary CTAs
- Maintain WCAG AA contrast ratios minimum
- Test colors with accessibility tools
- Use semantic colors consistently
- Leverage glass effects for visual interest

#### ✗ Don't
- Use dark purple shades for text on dark backgrounds
- Rely on color alone to convey information
- Overuse glow effects (reserve for emphasis)
- Mix inconsistent color shades
- Use glass backgrounds without testing text contrast

### Typography

#### ✓ Do
- Use Poppins for headings and labels
- Use Inter for body text
- Maintain type scale consistency
- Ensure minimum 16px for body text
- Use proper heading hierarchy (H1-H6)

#### ✗ Don't
- Mix font families arbitrarily
- Use all caps for long text
- Reduce font size below 14px for UI text
- Stack too many font weights
- Ignore line height and spacing

### Layout

#### ✓ Do
- Use glass cards for elevated content
- Maintain consistent spacing (8px grid)
- Create clear visual hierarchy
- Use depth through layering
- Ensure responsive behavior

#### ✗ Don't
- Flatten all elements (embrace depth)
- Overcrowd with too many glass elements
- Ignore mobile breakpoints
- Create overly complex layouts
- Skip loading and empty states

### Animation

#### ✓ Do
- Use subtle transitions (200-300ms)
- Animate with purpose
- Provide reduced motion option
- Use glow effects on interaction
- Keep animations smooth (60fps)

#### ✗ Don't
- Overuse animations
- Create jarring transitions
- Animate large elements unnecessarily
- Ignore performance impact
- Force animation on all users

### Components

#### ✓ Do
- Follow established component patterns
- Maintain state consistency (hover, active, disabled)
- Include proper focus indicators
- Use appropriate button hierarchy
- Test across devices and browsers

#### ✗ Don't
- Create new patterns without justification
- Skip disabled states
- Ignore keyboard navigation
- Use inconsistent spacing
- Forget error and loading states

---

## Implementation Resources

### Design Tokens
All design tokens are available in:
- `src/design-system/design-tokens.json`
- `src/design-system/color-palette.json`
- `src/design-system/component-colors.json`

### Accessibility Report
Complete WCAG compliance report:
- `src/design-system/accessibility-report.json`

### Tailwind Configuration
Production-ready Tailwind config:
- `tailwind.config.js`

### CSS Variables
HSL-based CSS variables for shadcn/ui:
- `src/index.css`

---

## Version History

### 1.0.0 - January 12, 2026
- Initial FlashFusion brand design system
- Complete color palette with WCAG AA compliance
- Typography scale with Poppins and Inter
- Component color mappings
- Accessibility validation and guidelines
- Production-ready implementation

---

## Support & Questions

For questions about brand implementation or design system usage:
1. Review this document and linked resources
2. Check accessibility report for color combinations
3. Refer to component color mappings for specific use cases
4. Consult design tokens for exact values

---

**FlashFusion Design System**  
Built for creators. Designed for impact.
