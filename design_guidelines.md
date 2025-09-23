# Design Guidelines: Logistics Order Management App

## Design Approach Documentation
**Selected Approach**: Reference-based approach inspired by enterprise productivity tools like Linear and Notion, with specific attention to logistics industry standards.

**Justification**: This is a utility-focused, information-dense application requiring efficiency and learnability over visual flourish. The existing screenshots demonstrate a clean, professional interface optimized for operational workflows.

## Core Design Elements

### A. Color Palette
**Primary Colors**:
- Purple theme matching screenshots: 270 85% 60% (primary purple)
- Dark purple for headers/navigation: 270 90% 45%
- Light purple for accents: 270 70% 95%

**Supporting Colors**:
- Neutral grays: 220 10% 95% (backgrounds), 220 15% 25% (text)
- Status colors: 
  - Success/Delivered: 142 76% 36%
  - Warning/Pending: 38 92% 50%
  - Error/Cancelled: 0 84% 60%
  - Info/In Transit: 217 91% 60%

### B. Typography
**Font Stack**: Inter via Google Fonts CDN
- Headers (H1-H3): 600 weight, purple primary color
- Body text: 400 weight, neutral dark gray
- Table headers: 500 weight, smaller sizing
- Metrics/numbers: 700 weight for emphasis

### C. Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section margins: m-6, m-8
- Element spacing: gap-4, space-y-2
- Container max-width: max-w-7xl with mx-auto

### D. Component Library

**Navigation**:
- Fixed sidebar with purple background (270 90% 45%)
- White text with hover states
- Active page indicators with lighter purple background

**Data Tables**:
- Clean borders with subtle shadows
- Alternating row backgrounds for readability
- Checkbox column for bulk selections
- Action buttons in final column
- Sticky headers for long lists

**Forms & Modals**:
- Multi-section layout matching screenshot structure
- Clear section headers with dividers
- Consistent input styling with focus states
- Primary purple buttons for submission

**Cards & Metrics**:
- White backgrounds with subtle borders
- Purple accent elements for key metrics
- Clear typography hierarchy
- Consistent padding (p-6)

**Status Indicators**:
- Colored badges with rounded corners
- Icon + text combinations
- Consistent sizing across components

**Bulk Actions Bar**:
- Appears when orders are selected via checkboxes
- Fixed position with download/print invoice options
- Clear selection count display

### E. Responsive Considerations
- Mobile-first approach with sidebar collapsing to hamburger menu
- Table horizontal scrolling on smaller screens
- Modal forms adapting to mobile with stacked sections
- Touch-friendly button sizing (min 44px height)

## Key Interaction Patterns
- Checkbox selection for bulk operations (download invoice, print invoice)
- Modal overlays for order creation/editing
- Inline editing capabilities for quick updates
- Search and filter combinations with clear states
- Export functionality matching screenshot placement

## Accessibility Notes
- High contrast ratios maintained across all color combinations
- Focus indicators on all interactive elements
- Proper ARIA labels for screen readers
- Keyboard navigation support for all functionality