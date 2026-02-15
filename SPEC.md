# TechDeals - CPU & Laptop Deals Aggregator

## Project Overview
- **Name:** TechDeals
- **Type:** Single-page webapp
- **Core functionality:** Aggregates and displays current CPU and laptop deals from Romanian e-commerce sites
- **Target users:** Romanian shoppers looking for tech deals

## UI/UX Specification

### Layout Structure
- **Header:** Fixed top navigation with logo + menu
- **Hero:** Minimal banner with search/filter controls
- **Content:** Grid of deal cards
- **Footer:** Simple attribution

### Responsive Breakpoints
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

### Visual Design

**Color Palette:**
- Background: `#0a0a0f` (deep dark)
- Card bg: `#16161d` (dark card)
- Card hover: `#1e1e28`
- Primary accent: `#00d4aa` (teal/mint)
- Secondary accent: `#ff6b6b` (coral red for prices)
- Text primary: `#ffffff`
- Text secondary: `#8b8b9a`
- Border: `#2a2a35`

**Typography:**
- Headings: "Outfit" (Google Fonts) - modern geometric sans
- Body: "DM Sans" - clean and readable
- Monospace (prices): "JetBrains Mono"

**Spacing:**
- Card padding: 20px
- Grid gap: 24px
- Section padding: 48px

**Visual Effects:**
- Cards: subtle border glow on hover (accent color)
- Prices: pulsing animation on "good deal" threshold
- Page load: staggered card reveal animation
- Smooth hover transitions (0.3s ease)

### Components

**1. Navigation Bar**
- Logo (left): "TechDeals" with circuit icon
- Menu (right): "Deals", "CPUs", "Laptops", "About"
- Active state: underline with accent color

**2. Deal Card**
- Product image placeholder (gradient if none)
- Title (product name)
- Price (large, coral red)
- Original price (strikethrough, secondary)
- Discount badge (percentage)
- Store logo/name
- "View Deal" button
- Condition tag (new/open-box/used)

**3. Filter Bar**
- Category toggle (All / CPUs / Laptops)
- Price range slider
- Store filter checkboxes

**4. Empty State**
- Illustrated placeholder when no deals match

## Functionality Specification

### Core Features
1. **Deal Display:** Grid of deal cards from multiple sources
2. **Filtering:** Filter by category (CPU/Laptop), price, store
3. **Data Source:** Static JSON initially (can be expanded to API later)
4. **Deal Scoring:** Visual indicator for "good deals" (under target price)

### User Interactions
- Click card → opens deal URL in new tab
- Filter toggles → instantly update displayed deals
- Hover card → subtle elevation + glow

### Data Model
```json
{
  "id": "string",
  "title": "string",
  "price": "number",
  "originalPrice": "number",
  "discount": "number",
  "store": "string",
  "storeUrl": "string",
  "category": "cpu" | "laptop",
  "condition": "new" | "open-box" | "used",
  "imageUrl": "string",
  "targetPrice": "number",
  "isGoodDeal": "boolean"
}
```

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (no framework needed for this scope)
- **Hosting:** GitHub Pages + Tailscale serve
- **CI/CD:** GitHub Actions for deploy

## Acceptance Criteria
- [ ] Page loads with header, hero, and deal grid
- [ ] At least 6 sample deals displayed (3 CPUs, 3 laptops)
- [ ] Cards show image, title, price, discount, store
- [ ] Filter buttons work (All/CPUs/Laptops)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Hover effects on cards
- [ ] Built with the specified color palette and typography
