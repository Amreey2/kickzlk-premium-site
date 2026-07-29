# KICKZ.LK Premium Sneaker Marketplace

The approved KICKZ.LK HTML design converted into a Vite-powered React frontend. It includes the complete homepage and product-detail experience with the original responsive layouts, animations, assets, navigation, and client-side interactions.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Development

```bash
npm install
npm run dev
```

Vite prints the local development URL. The available page entries are:

- `/` or `/index.html` — homepage
- `/product.html` — product detail page

## Validation and Production Build

```bash
npm run lint
npm run build
npm run preview
```

The production build outputs both page entries to `dist/`.

## Mobile Responsive Audit

With Google Chrome installed on macOS, run the reproducible mobile simulation audit:

```bash
npm run audit:mobile
```

The audit renders both pages at 320px, 375px, 390px, 430px, and 768px. It checks document overflow, clipped text, console errors, mobile navigation, product filtering, size selection, preorder state, and product tabs. Reference screenshots are written to `/tmp/kickz-{page}-{width}.png`.

## Project Structure

```text
src/
  assets/       Supplied KICKZ.LK artwork and logos
  components/   Shared UI and page-section components
  hooks/        Reveal and toast behavior
  pages/        Home and product pages
  styles/       Approved responsive design system
  App.jsx       Page entry selection
  main.jsx      React bootstrap
```

This sprint intentionally does not add authentication, inventory, checkout, payments, databases, admin tools, or additional pages.
