# KICKZ.LK Premium Sneaker Marketplace

The approved KICKZ.LK React storefront with a production-structured Express API foundation. Existing frontend pages and mock-data flows remain unchanged while the backend provides MySQL/TiDB-ready authentication, products, orders, and image uploads.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- MySQL 8+ or a compatible TiDB deployment

## Development

```bash
npm install
npm run dev
```

Vite prints the local development URL. The available page entries are:

- `/` or `/index.html` — homepage
- `/product.html` — product detail page

## Backend

Copy the server template, enter your database and secret values, initialize the schema, and seed the single administrator:

```bash
cp server/.env.example server/.env
npm run db:init
npm run db:seed-products
npm run db:seed-admin
npm run server
```

The frontend defaults to the same-origin `/api` path. During development Vite proxies `/api` and `/uploads` to `http://127.0.0.1:5000`, so authenticated uploads continue working if Vite selects a port other than 5173. In production, route those paths to the backend at the web-server level, or set `VITE_API_URL` to the full API origin and add the exact frontend origin to `CLIENT_ORIGIN`. Also use unique 32+ character JWT secrets, enable `COOKIE_SECURE`, and set `DB_REQUIRED=true`.

Useful commands:

```bash
npm run server:dev
npm run server:test
npm run db:init
npm run db:seed-products
npm run db:seed-admin
```

Main API routes:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- `POST /api/admin/login`
- `GET /api/products`, `GET /api/products/:id`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (admin)
- `POST /api/orders`, `GET /api/orders/:id`, `GET /api/orders/user/:userId`
- `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status` (admin)
- `POST /api/uploads/products` (admin)
- `GET /api/health`

## Validation and Production Build

```bash
npm run lint
npm run build
npm run server:test
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
  services/api/ Prepared API client modules; current mock data is retained
  styles/       Approved responsive design system
  App.jsx       Page entry selection
  main.jsx      React bootstrap
server/
  config/       Environment, MySQL pool, and TiDB-compatible schema
  controllers/  HTTP handlers
  middleware/   Authentication, uploads, validation errors, and security
  models/       Parameterized data access
  routes/       Public, customer, and protected admin routes
  services/     Business logic
  tests/        API and service regression coverage
```

Payment processing and replacement of frontend mock data are intentionally deferred. Local uploads are isolated behind an image service so cloud storage can be introduced later without rewriting controllers.
