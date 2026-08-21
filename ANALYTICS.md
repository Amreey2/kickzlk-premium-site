# KICKZ.LK analytics

GA4 is disabled unless `VITE_GA_MEASUREMENT_ID` is configured at build/dev time. No Meta Pixel, GTM, or other marketing tracker is loaded.

## Configuration

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_DEBUG=false
VITE_GOOGLE_SITE_VERIFICATION=
```

Set `VITE_GA_DEBUG=true` only in a local/staging build intended for GA4 DebugView. Leaving the measurement ID empty prevents development and automated tests from sending analytics.

## Verification

1. Open GA4 **Admin → DebugView** and run a build with the measurement ID plus `VITE_GA_DEBUG=true`.
2. In browser DevTools, filter Network by `googletagmanager` or `collect`.
3. Exercise product view, search, add/remove cart, checkout, payment option, coupon, and successful order confirmation.
4. Refresh confirmation. The same `transaction_id` must not produce another `purchase` event.
5. Confirm `/admin/*`, login, account, cart, checkout, and tracking do not send `page_view` events. Cart and checkout still send their explicitly required ecommerce funnel events.

Events contain catalogue/order identifiers and commerce values only. Customer names, email addresses, phone numbers, delivery addresses, passwords, and bank/payment-account details are excluded.
