# KICKZ.LK Production Checklist

## Required before launch

- Back up the production database and restore that backup in staging before running `npm run db:init`.
- Set `NODE_ENV=production`, `DB_REQUIRED=true`, `COOKIE_SECURE=true`, and two different random JWT secrets of at least 32 characters.
- Set `SITE_URL=https://kickz.lk` and `CLIENT_ORIGIN` to the exact approved HTTPS storefront origin(s).
- Set `TRUST_PROXY=1` only when exactly one trusted reverse proxy/load balancer terminates HTTPS; otherwise leave it `false`.
- Route `/api`, `/uploads`, `/robots.txt`, and `/sitemap.xml` to the API on the production web server, or configure `VITE_API_URL` and CORS for a separate API origin.
- Persist `server/uploads` on durable storage or replace it with an approved object-store/CDN mount. Do not deploy uploads on an ephemeral filesystem.
- Terminate TLS at the web server/load balancer and add HSTS there after HTTPS has been verified on every domain in scope.
- Configure automated encrypted database backups, retention, and a tested restore procedure.
- Run `npm run db:init`, `npm run lint`, `npm run build`, `npm run server:test`, and `git diff --check` against the release candidate.

## Deployment-dependent controls

- Configure the frontend host/CDN with CSP, frame protection, `X-Content-Type-Options`, and `Referrer-Policy`; the API already uses Helmet.
- If GA4 is enabled, set `VITE_GA_MEASUREMENT_ID` only in the production build and complete the applicable consent/privacy review.
- Set `VITE_GOOGLE_SITE_VERIFICATION` only to the verified Search Console token.
- Monitor API 5xx/429 rates using `X-Request-ID`; do not log request bodies, passwords, tokens, bank details, or customer PII.
- Run real-device checkout and accessibility smoke tests on current iPhone Safari and Android Chrome.

## Known launch decision

- Product, brand, and category metadata is currently injected after React loads. Choose prerendering, SSR, or edge metadata rendering before relying on complete initial-HTML SEO/social previews. This sprint intentionally does not introduce that architectural change.
