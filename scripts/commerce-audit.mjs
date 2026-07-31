import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const baseUrl = 'http://127.0.0.1:4174';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewports = [
  [320, 844],
  [375, 844],
  [390, 844],
  [430, 844],
  [768, 1024],
  [1280, 800],
  [1440, 900],
];
const routes = [['cart', '/cart'], ['checkout', '/checkout']];
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite did not start within 15 seconds.');
};

try {
  await waitForServer();
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const failures = [];
  const results = [];

  for (const [width, height] of viewports) {
    for (const [name, route] of routes) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 768, isMobile: width <= 768 });
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const metrics = await page.evaluate(({ pageName, viewportWidth }) => {
        const layout = document.querySelector(pageName === 'cart' ? '.cart-layout' : '.checkout-layout');
        const columns = layout ? getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean).length : 0;
        const clipped = [...document.querySelectorAll('h1, h2, p, a, button, label, strong')]
          .filter((element) => !element.matches('.icon-btn, .cart-item__image')
            && element.getClientRects().length
            && element.scrollWidth > element.clientWidth + 1)
          .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`)
          .slice(0, 10);
        return {
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          columns,
          clipped,
          expectedColumns: viewportWidth > 960 ? 2 : 1,
        };
      }, { pageName: name, viewportWidth: width });

      if (name === 'cart') {
        await page.locator('.cart-remove').click();
        metrics.emptyState = await page.locator('.cart-empty').isVisible();
      } else {
        await page.locator('[name="name"]').fill('Mobile Customer');
        await page.locator('[name="email"]').fill('customer@example.com');
        await page.locator('[name="phone"]').fill('+94771234567');
        await page.locator('[name="address"]').fill('42 Galle Road');
        await page.locator('[name="city"]').fill('Colombo');
        await page.locator('button[type="submit"]').click();
        metrics.confirmationVisible = await page.locator('.form-message').isVisible();
      }

      const result = { page: name, width, ...metrics, consoleErrors: errors.length };
      results.push(result);
      if (metrics.horizontalOverflow > 1 || metrics.clipped.length || metrics.columns !== metrics.expectedColumns
        || errors.length || (name === 'cart' && !metrics.emptyState) || (name === 'checkout' && !metrics.confirmationVisible)) {
        failures.push(result);
      }
      await context.close();
    }
  }

  await browser.close();
  console.table(results.map(({ page, width, horizontalOverflow, columns, clipped, consoleErrors }) => ({
    page, width, overflow: horizontalOverflow, columns, clipped: clipped.length, consoleErrors,
  })));
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
} finally {
  server.kill('SIGTERM');
}
