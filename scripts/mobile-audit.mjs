import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const baseUrl = 'http://127.0.0.1:4173';
const widths = [320, 375, 390, 430, 768];
const pages = [['home', '/'], ['product', '/product.html']];
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
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
  const results = [];

  for (const width of widths) {
    for (const [name, path] of pages) {
      const context = await browser.newContext({
        viewport: { width, height: width === 768 ? 1024 : 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 5000))]));
      await page.waitForTimeout(300);

      const metrics = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const ignored = '.marquee__track, .filter-row, .tabs, .hero-shoe, .hero-orbit, .hero-glow';
        const selectorFor = (element) => {
          const classes = [...element.classList].slice(0, 3).join('.');
          return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes ? `.${classes}` : ''}`;
        };
        const outsideViewport = [...document.querySelectorAll('body *')]
          .filter((element) => !element.matches(ignored) && !element.closest('.marquee, .announcement, .filter-row, .tabs, .hero-badges'))
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > viewportWidth + 1))
          .slice(0, 30)
          .map(({ element, rect }) => ({ selector: selectorFor(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }));
        const clippedText = [...document.querySelectorAll('h1, h2, h3, p, blockquote, a, button, .eyebrow, .section-kicker')]
          .filter((element) => !element.matches('.icon-btn, .brand-tile') && element.scrollWidth > element.clientWidth + 1)
          .map((element) => ({ selector: selectorFor(element), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
          .slice(0, 30);
        return {
          viewportWidth,
          documentScrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          outsideViewport,
          clippedText,
        };
      });

      await page.screenshot({ path: `/tmp/kickz-${name}-${width}.png`, fullPage: true });
      const interactionChecks = {};
      await page.locator('.menu-toggle').click();
      interactionChecks.mobileNav = await page.evaluate(() => ({
        expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true',
        drawerOpen: document.querySelector('.mobile-drawer').classList.contains('open'),
        bodyLocked: document.body.classList.contains('nav-open'),
        documentScrollWidth: document.documentElement.scrollWidth,
      }));
      await page.locator('.menu-toggle').click();

      if (name === 'home') {
        await page.locator('[data-filter="nike"]').click();
        interactionChecks.filteredProducts = await page.locator('.product-card:not(.is-hidden)').count();
      } else {
        await page.locator('.size-btn:not(:disabled)').first().click();
        const preorder = width <= 650 ? page.locator('.mobile-buybar .btn--acid') : page.locator('#preorder-button');
        await preorder.click();
        await page.locator('.tab-btn').nth(2).click();
        interactionChecks.productControls = await page.evaluate(() => ({
          bagCount: document.querySelector('.bag-count').textContent,
          sizeSelected: document.querySelector('.size-btn.active')?.textContent,
          activeTab: document.querySelector('.tab-btn.active')?.textContent,
        }));
      }

      results.push({ page: name, width, consoleErrors, interactionChecks, ...metrics });
      await context.close();
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
} finally {
  server.kill('SIGTERM');
}
