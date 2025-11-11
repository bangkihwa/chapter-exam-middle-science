# Design Guidelines: Mokdong A1 Science Academy Assessment System

## Design Approach
**System-Based Approach**: Material Design principles adapted for educational clarity, with enhanced data visualization for analytics. Drawing inspiration from Google Classroom's organizational structure and Khan Academy's assessment patterns.

## Core Design Principles
- **Clarity First**: Information hierarchy prioritizes student task completion and data comprehension
- **Efficient Navigation**: Minimize clicks between login → unit selection → assessment → results
- **Data Celebration**: Analytics dashboards use bold visual treatments to highlight achievement

## Typography System
- **Primary Font**: Inter (via Google Fonts) for UI elements, forms, and navigation
- **Data Font**: JetBrains Mono for numerical displays, scores, and student IDs
- **Hierarchy**:
  - Page titles: text-3xl font-bold
  - Section headers: text-xl font-semibold
  - Body text: text-base
  - Labels/metadata: text-sm
  - Numerical data: text-2xl font-mono for emphasis

## Layout System
**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16 (p-4, gap-6, mb-8, py-12, mt-16)
- Container: max-w-7xl mx-auto px-4
- Cards/Panels: p-6 to p-8
- Form spacing: gap-4 between fields, gap-6 between sections
- Grid layouts: gap-6 for card grids

## Component Library

### Authentication (Login)
- Centered card layout (max-w-md mx-auto)
- School logo/name at top
- Two input fields: Student ID, Name
- Large primary button for login
- Minimal, focused interface

### Unit Selection Dashboard
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Unit cards with:
  - Unit name (prominent heading)
  - Question count badge
  - Progress indicator (if applicable)
  - "Start Assessment" button
- Header showing: Student name, current textbook (물리학 프리미엄)

### OMR Answer Input Interface
- Split layout:
  - **Left panel** (sticky): Question navigation grid showing all question numbers (clickable bubbles indicating answered/unanswered status)
  - **Right panel** (scrollable): Current question display with:
    - Question number badge
    - 5-option radio button grid (1-5) styled as large touch-friendly bubbles
    - "Skip" indicator for subjective questions
    - Next/Previous navigation
- Progress bar at top showing completion percentage
- Submit button (prominent) when all multiple choice answered

### Results & Feedback Screen
- Hero metric card: Large score display with achievement percentage
- Breakdown section:
  - Correct/Incorrect count
  - Questions by unit visualization
- Answer review: Expandable list showing each question with student answer vs correct answer (icon-based: checkmark/x)
- Action buttons: "View Detailed Report", "Return to Units"

### Analytics Dashboard (Reports)
- Multi-section layout:
  - **Header**: Student profile card (ID, name, grade)
  - **Performance Overview**: Large cards showing overall stats (grid-cols-1 md:grid-cols-3)
  - **Unit Performance**: Horizontal bar chart comparing achievement across units
  - **Trend Analysis**: Line graph showing performance over time
  - **Detailed Table**: Sortable data table with all assessment records
- Filter controls: Dropdown selectors for textbook and unit
- Export/print functionality in top-right

### Universal Components
- **Buttons**: 
  - Primary: Solid fill, px-6 py-3, rounded-lg, font-semibold
  - Secondary: Border style, same padding
  - Icon buttons: p-2, rounded-full for actions
- **Cards**: Rounded-xl, shadow-md, border, p-6
- **Badges**: Rounded-full, px-3 py-1, text-sm for status indicators
- **Input Fields**: Rounded-lg border, px-4 py-3, focus ring treatment
- **Data Tables**: Striped rows, hover states, sticky header

## Navigation Pattern
- Top navigation bar (sticky):
  - School name/logo (left)
  - Student name and ID (right)
  - Logout button
- Breadcrumb trail for multi-step processes (Unit Selection > Assessment > Results)

## Data Visualization Standards
- **Charts**: Use Chart.js or similar library
- Bar charts for unit comparisons (horizontal orientation)
- Line charts for temporal trends
- Donut charts for score breakdowns
- Maintain consistent aspect ratios: 16:9 for main charts, square for summary widgets

## Responsive Behavior
- Mobile (< 768px): Single column, stacked cards, hamburger navigation
- Tablet (768-1024px): 2-column grids, maintained spacing
- Desktop (> 1024px): Full 3-column grids, split panels for OMR interface

## Icons
Use Heroicons (outline style) via CDN:
- Academic cap for education
- Chart bar for analytics
- Check/X circle for answers
- Clock for timestamps
- User for profile
- Document text for assessments

## Images
No hero images required. Focus on functional interface with icon-based visual communication. Optional: School logo in header (240x60px recommended).