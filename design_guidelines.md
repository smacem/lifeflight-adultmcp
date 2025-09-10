# EHS LifeFlight Adult MCP Self-Scheduler Design Guidelines

## Design Approach: Reference-Based (Healthcare/Enterprise)
Drawing inspiration from professional healthcare scheduling platforms like Epic MyChart and enterprise tools like Calendly, prioritizing clarity, reliability, and medical-grade professionalism.

## Core Design Elements

### A. Color Palette
**Primary Colors (from EHS LifeFlight branding):**
- Primary Blue: 210 85% 45% (deep professional blue from logo)
- Secondary Red: 0 85% 55% (emergency red accent from branding)
- Light Blue: 210 40% 85% (subtle backgrounds)

**Supporting Colors:**
- Gray Scale: 220 10% 15% (dark text), 220 5% 60% (medium gray), 220 10% 95% (light backgrounds)
- Success Green: 120 60% 45% (confirmations)
- Warning Orange: 35 85% 55% (alerts)

### B. Typography
**Primary Font:** Inter (Google Fonts)
- Headers: 600-700 weight, sizes 24px-48px
- Body: 400-500 weight, 14px-16px
- Labels: 500 weight, 12px-14px

**Secondary Font:** Source Sans Pro for data tables and schedules

### C. Layout System
**Tailwind Spacing Units:** Consistent use of 2, 4, 6, 8, 12, 16 units
- Component padding: p-4, p-6
- Section margins: m-8, m-12
- Grid gaps: gap-4, gap-6

### D. Component Library

**Navigation:**
- Top navigation bar with EHS LifeFlight logo
- Horizontal tabs for Monthly Views, Admin, Profile
- Breadcrumb navigation for deep sections

**Calendar Components:**
- Monthly grid with large, clickable day cells
- Color-coded availability states (available, selected, unavailable, traded)
- Hover states showing shift details
- Clean typography for dates and names

**Forms & Controls:**
- Professional form styling with blue focus states
- Toggle switches for availability selection
- Dropdown menus for month/year navigation
- Clean input fields with proper labeling

**Data Display:**
- Physician/learner roster tables
- Schedule summary cards
- Contact information displays
- PDF export preview modals

**Interactive Elements:**
- Shift trading proposals with approval workflows
- Admin limit setting controls
- Public link generation interface
- Print-optimized schedule layouts

### E. Visual Hierarchy
- Primary actions use the EHS blue
- Secondary actions use outline styling
- Emergency/critical items use the red accent sparingly
- Generous whitespace for medical professional aesthetic
- Clear section divisions with subtle borders

## Specific Interface Considerations

**Monthly Calendar:**
- Large, scannable grid layout
- Clear day boundaries
- Professional color coding for different shift states
- Easy toggle interaction for availability

**Admin Controls:**
- Dedicated admin section with elevated styling
- Clear limit-setting interfaces
- Override capabilities with confirmation dialogs

**Public Schedule View:**
- Clean, read-only presentation
- EHS branding maintained
- Print-friendly layout optimization
- Contact information appropriately displayed

## Images
No large hero images needed - this is a utility-focused healthcare scheduling tool. Include small EHS LifeFlight logo in navigation header only.