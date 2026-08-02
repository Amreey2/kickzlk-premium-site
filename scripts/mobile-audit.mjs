import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const baseUrl = 'http://127.0.0.1:4173';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewports = [
  [320, 844, true],
  [375, 844, true],
  [390, 844, true],
  [430, 844, true],
  [1280, 800, false],
  [1440, 900, false],
  [1920, 1080, false],
];
const routes = [
  ['home', '/'],
  ['shop', '/shop'],
  ['new-drops', '/new-drops'],
  ['brands', '/brands'],
  ['about', '/about'],
  ['community', '/community'],
  ['preorder', '/pre-order'],
  ['contact', '/contact'],
  ['product', '/product/air-jordan-1-retro-high-og'],
];

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
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
  const results = [];

  for (const [width, height, isMobile] of viewports) {
    for (const [name, route] of routes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile, hasTouch: isMobile });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 4000))]));
      await page.waitForTimeout(250);

      const metrics = await page.evaluate(({ pageName, mobile }) => {
        const viewportWidth = document.documentElement.clientWidth;
        const clipped = [...document.querySelectorAll('h1, h2, h3, p, a, button, blockquote, .eyebrow, .section-kicker')]
          .filter((element) => !element.matches('.icon-btn, .floating-action, .brand-tile, .cart-item__image')
            && element.getClientRects().length
            && getComputedStyle(element).visibility !== 'hidden'
            && element.scrollWidth > element.clientWidth + 3)
          .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}[+${element.scrollWidth - element.clientWidth}px]`)
          .slice(0, 12);
        const actions = [...document.querySelectorAll('.floating-action')].map((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
        });
        const pageHero = document.querySelector('.page-hero')?.getBoundingClientRect();
        const home = pageName === 'home' ? (() => {
          const hero = document.querySelector('.hero').getBoundingClientRect();
          const shoe = document.querySelector('.hero-shoe').getBoundingClientRect();
          const drops = document.querySelector('.drops').getBoundingClientRect();
          const builtStyle = getComputedStyle(document.querySelector('.hero h1 span'));
          return {
            heroHeight: Math.round(hero.height),
            heroBottom: Math.round(hero.bottom),
            shoeVerticalFit: shoe.top >= hero.top - 1 && shoe.bottom <= hero.bottom + 1,
            scrollSnapType: getComputedStyle(document.documentElement).scrollSnapType,
            labelsRemoved: document.querySelectorAll('.floating-label').length === 0,
            announcementRemoved: document.querySelector('.announcement') === null,
            indexRemoved: document.querySelector('.hero-index') === null,
            orbitCount: document.querySelectorAll('.hero-orbit').length,
            watermarkRemoved: getComputedStyle(document.querySelector('.hero'), '::after').content === 'none',
            builtStroke: Number.parseFloat(builtStyle.webkitTextStrokeWidth),
            cinematicAsset: document.querySelector('.hero-shoe').currentSrc.includes('hero-jordan-cinematic'),
            correctMobileTitle: getComputedStyle(document.querySelector('.hero-title--mobile')).display !== 'none',
            correctDesktopTitle: getComputedStyle(document.querySelector('.hero-title--desktop')).display !== 'none',
            cardCount: document.querySelectorAll('.drops .product-card').length,
            dropsHeight: Math.round(drops.height),
            viewSneakers: Boolean(document.querySelector('.drops a[href="/shop"].btn')),
            viewBrands: Boolean(document.querySelector('.brands a[href="/brands"].btn')),
          };
        })() : null;
        return {
          viewportWidth,
          documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          clipped,
          pageHeroHeight: pageHero ? Math.round(pageHero.height) : null,
          floatingActions: actions,
          home,
          mobile,
        };
      }, { pageName: name, mobile: isMobile });

      const interactions = {};
      const menu = page.locator('.menu-toggle');
      if (await menu.isVisible()) {
        await menu.click();
        await page.waitForTimeout(350);
        interactions.menu = await page.evaluate(() => ({
          expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true',
          lines: document.querySelectorAll('.menu-toggle span').length,
          drawerVisible: getComputedStyle(document.querySelector('.mobile-drawer')).visibility === 'visible',
          bodyLocked: document.body.classList.contains('nav-open'),
          linkFont: Number.parseFloat(getComputedStyle(document.querySelector('.mobile-drawer nav a')).fontSize),
        }));
        await menu.click();
      }
      if (name === 'home') {
        await page.locator('[data-filter="nike"]').click();
        interactions.filteredProducts = await page.locator('.drops .product-card:not(.is-hidden)').count();
        await page.locator('.drops').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
        interactions.scrollMoved = await page.evaluate(() => window.scrollY > 0);
      }
      if (name === 'product') {
        await page.locator('.size-btn:not(:disabled)').first().click();
        interactions.sizeSelected = await page.locator('.size-btn.active').count() === 1;
      }

      if (name === 'home') await page.screenshot({ path: `/tmp/kickz-home-${width}.png`, fullPage: false });
      results.push({ name, width, height, consoleErrors, interactions, ...metrics });
      await context.close();
    }
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  const reducedMotion = await reducedPage.evaluate(() => ({
    snap: getComputedStyle(document.documentElement).scrollSnapType,
    shoeAnimation: getComputedStyle(document.querySelector('.hero-shoe')).animationName,
  }));
  await reducedContext.close();
  await browser.close();

  const failures = [];
  for (const result of results) {
    const label = `${result.name} ${result.width}x${result.height}`;
    if (result.consoleErrors.length) failures.push(`${label}: console errors`);
    if (result.documentWidth !== result.viewportWidth) failures.push(`${label}: horizontal overflow`);
    if (result.clipped.length) failures.push(`${label}: clipped text (${result.clipped.join(', ')})`);
    if (result.floatingActions.length !== 2) failures.push(`${label}: missing floating actions`);
    if (result.floatingActions.some((rect) => rect.left < 0 || rect.right > result.width || rect.top < 0 || rect.bottom > result.height)) failures.push(`${label}: floating action outside viewport`);
    if (result.floatingActions.length === 2 && result.floatingActions[0].bottom > result.floatingActions[1].top) failures.push(`${label}: floating actions overlap`);
    if (result.mobile && (!result.interactions.menu?.expanded || result.interactions.menu.lines !== 3 || !result.interactions.menu.drawerVisible || !result.interactions.menu.bodyLocked || result.interactions.menu.linkFont > 28)) failures.push(`${label}: mobile navigation regression`);
    if (result.pageHeroHeight && result.pageHeroHeight > (result.mobile ? result.height * .36 : 440)) failures.push(`${label}: page hero remains oversized`);
    if (['shop', 'new-drops', 'brands', 'about', 'community', 'contact'].includes(result.name)
      && result.pageHeroHeight > (result.mobile ? 190 : 250)) failures.push(`${label}: targeted page hero spacing regression`);
    if (result.name === 'home') {
      if (!result.home.scrollSnapType.startsWith('y')) failures.push(`${label}: section snapping unavailable`);
      if (!result.home.labelsRemoved || !result.home.announcementRemoved || !result.home.indexRemoved || result.home.orbitCount !== 2 || !result.home.watermarkRemoved || result.home.builtStroke < 1.5 || !result.home.cinematicAsset) failures.push(`${label}: hero artwork/typography cleanup failed`);
      if (result.mobile && (!result.home.correctMobileTitle || result.home.correctDesktopTitle)) failures.push(`${label}: mobile hero hierarchy failed`);
      if (!result.mobile && (!result.home.correctDesktopTitle || result.home.correctMobileTitle)) failures.push(`${label}: desktop hero hierarchy failed`);
      if (result.home.cardCount !== 6 || !result.home.viewSneakers || !result.home.viewBrands) failures.push(`${label}: homepage CTA/card regression`);
      if (!result.interactions.scrollMoved || result.interactions.filteredProducts !== 2) failures.push(`${label}: homepage interactions failed`);
      if (result.width >= 1280 && result.home.dropsHeight > result.height) failures.push(`${label}: featured drops exceeds one viewport`);
      if (!result.home.shoeVerticalFit) failures.push(`${label}: hero sneaker is vertically cropped`);
    }
    if (result.name === 'product' && !result.interactions.sizeSelected) failures.push(`${label}: product controls failed`);
  }
  if (reducedMotion.snap !== 'none' || reducedMotion.shoeAnimation !== 'none') failures.push('reduced motion safeguards failed');

  console.table(results.map(({ name, width, documentWidth, clipped, consoleErrors }) => ({
    page: name, width, overflow: documentWidth - width, clipped: clipped.length, consoleErrors: consoleErrors.length,
  })));
  console.log(JSON.stringify({ reducedMotion, failures }, null, 2));
  if (failures.length) throw new Error(`Responsive audit failed:\n- ${failures.join('\n- ')}`);
} finally {
  server.kill('SIGTERM');
}
