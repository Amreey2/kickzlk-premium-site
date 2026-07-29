import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const baseUrl = 'http://127.0.0.1:4173';
const viewports = [
  { width: 320, height: 844, isMobile: true },
  { width: 375, height: 844, isMobile: true },
  { width: 390, height: 844, isMobile: true },
  { width: 430, height: 844, isMobile: true },
  { width: 768, height: 1024, isMobile: true },
  { width: 1280, height: 800, isMobile: false },
  { width: 1440, height: 900, isMobile: false },
];
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

  for (const viewport of viewports) {
    const { width, height, isMobile } = viewport;
    for (const [name, path] of pages) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile,
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
        const ignored = '.culture-ticker__track, .filter-row, .tabs, .hero-shoe, .hero-orbit, .hero-glow';
        const selectorFor = (element) => {
          const classes = [...element.classList].slice(0, 3).join('.');
          return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes ? `.${classes}` : ''}`;
        };
        const outsideViewport = [...document.querySelectorAll('body *')]
          .filter((element) => !element.matches(ignored) && !element.closest('.culture-ticker, .announcement, .filter-row, .tabs, .hero-badges'))
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > viewportWidth + 1))
          .slice(0, 30)
          .map(({ element, rect }) => ({ selector: selectorFor(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }));
        const clippedText = [...document.querySelectorAll('h1, h2, h3, p, blockquote, a, button, .eyebrow, .section-kicker')]
          .filter((element) => {
            const intentionalDesktopDisplay = viewportWidth > 960 && element.matches('.hero h1, .editorial-card h2, .why-intro h2, .social-copy h2');
            return !intentionalDesktopDisplay && !element.matches('.icon-btn, .brand-tile') && element.scrollWidth > element.clientWidth + 1;
          })
          .map((element) => ({ selector: selectorFor(element), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
          .slice(0, 30);
        const homeUx = document.querySelector('.home-main') ? (() => {
          const rootStyle = getComputedStyle(document.documentElement);
          const hero = document.querySelector('.hero').getBoundingClientRect();
          const heroShoe = document.querySelector('.hero-shoe').getBoundingClientRect();
          const heroFooter = document.querySelector('.hero-footer');
          const heroFooterRect = heroFooter.getBoundingClientRect();
          const ticker = document.querySelector('.culture-ticker');
          const tickerRect = ticker.getBoundingClientRect();
          const tickerTrackStyle = getComputedStyle(document.querySelector('.culture-ticker__track'));
          const tickerGroups = [...document.querySelectorAll('.culture-ticker__group')];
          const snapTargets = [...document.querySelectorAll('.snap-section')];
          return {
            scrollSnapType: rootStyle.scrollSnapType,
            scrollPaddingTop: rootStyle.scrollPaddingTop,
            scrollbarWidth: rootStyle.scrollbarWidth,
            heroHeight: Math.round(hero.height),
            heroArtworkFits: heroShoe.top >= hero.top - 1 && heroShoe.bottom <= hero.bottom + 1,
            heroFooterFits: heroFooter.classList.contains('is-visible') && heroFooterRect.bottom <= window.innerHeight + 1,
            tickerTop: Math.round(tickerRect.top),
            heroFoldError: Math.round(Math.abs(tickerRect.top - window.innerHeight)),
            tickerAnimation: tickerTrackStyle.animationName,
            tickerDuration: tickerTrackStyle.animationDuration,
            tickerGroupWidths: tickerGroups.map((group) => Math.round(group.getBoundingClientRect().width)),
            tickerText: tickerGroups.map((group) => group.textContent.replace(/\s+/g, ' ').trim()),
            snapTargets: snapTargets.map((target) => ({ className: target.className, align: getComputedStyle(target).scrollSnapAlign })),
          };
        })() : null;
        return {
          viewportWidth,
          documentScrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          outsideViewport,
          clippedText,
          homeUx,
        };
      });

      await page.screenshot({ path: `/tmp/kickz-${name}-${width}.png`, fullPage: false });
      const interactionChecks = {};
      const menuToggle = page.locator('.menu-toggle');
      if (await menuToggle.isVisible()) {
        await menuToggle.click();
        interactionChecks.mobileNav = await page.evaluate(() => ({
          expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true',
          drawerOpen: document.querySelector('.mobile-drawer').classList.contains('open'),
          bodyLocked: document.body.classList.contains('nav-open'),
          documentScrollWidth: document.documentElement.scrollWidth,
        }));
        await menuToggle.click();
      }

      if (name === 'home') {
        await page.locator('.hero a[href="#drops"]').click();
        await page.waitForTimeout(900);
        interactionChecks.anchorScroll = await page.evaluate(() => ({
          scrollY: Math.round(window.scrollY),
          targetTop: Math.round(document.querySelector('#drops').getBoundingClientRect().top),
          scrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
        }));
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

      results.push({ page: name, width, height, consoleErrors, interactionChecks, ...metrics });
      await context.close();
    }
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  const reducedMotion = await reducedPage.evaluate(() => ({
    scrollSnapType: getComputedStyle(document.documentElement).scrollSnapType,
    tickerAnimation: getComputedStyle(document.querySelector('.culture-ticker__track')).animationName,
  }));
  await reducedContext.close();

  await browser.close();

  const failures = [];
  const expectedTicker = 'AUTHENTIC SNEAKERS★GLOBAL DROPS★PRE ORDER AVAILABLE★KICKZ.LK★';
  for (const result of results) {
    const label = `${result.page} ${result.width}x${result.height}`;
    if (result.consoleErrors.length) failures.push(`${label}: console errors`);
    if (result.documentScrollWidth !== result.viewportWidth) failures.push(`${label}: horizontal overflow`);
    if (result.outsideViewport.length) failures.push(`${label}: elements outside viewport`);
    if (result.clippedText.length) failures.push(`${label}: clipped text`);

    if (result.page === 'home') {
      const { homeUx, interactionChecks } = result;
      if (homeUx.scrollSnapType !== 'y') failures.push(`${label}: proximity snapping unavailable`);
      if (homeUx.scrollbarWidth !== 'none') failures.push(`${label}: root scrollbar visible`);
      if (homeUx.snapTargets.length !== 9 || homeUx.snapTargets.some(({ align }) => align !== 'start')) failures.push(`${label}: invalid snap targets`);
      if (homeUx.tickerAnimation !== 'culture-ticker') failures.push(`${label}: ticker animation unavailable`);
      if (homeUx.tickerGroupWidths.length !== 2 || Math.abs(homeUx.tickerGroupWidths[0] - homeUx.tickerGroupWidths[1]) > 1) failures.push(`${label}: ticker groups are not seamless`);
      if (homeUx.tickerText.some((text) => text !== expectedTicker)) failures.push(`${label}: ticker text/order changed`);
      if (result.width >= 768 && homeUx.heroFoldError > 3) failures.push(`${label}: hero misses first fold by ${homeUx.heroFoldError}px`);
      if (result.width >= 768 && !homeUx.heroArtworkFits) failures.push(`${label}: hero artwork is cropped`);
      if (result.width >= 768 && !homeUx.heroFooterFits) failures.push(`${label}: hero footer cue is cropped or hidden`);
      if (Math.abs(interactionChecks.anchorScroll.targetTop - Number.parseFloat(homeUx.scrollPaddingTop)) > 2) failures.push(`${label}: sticky anchor offset incorrect`);
      if (!interactionChecks.anchorScroll.scrollable) failures.push(`${label}: root scrolling unavailable`);
      if (interactionChecks.filteredProducts !== 2) failures.push(`${label}: product filtering failed`);
    }
  }
  if (reducedMotion.scrollSnapType !== 'none' || reducedMotion.tickerAnimation !== 'none') failures.push('reduced motion: motion safeguards failed');

  console.log(JSON.stringify({ results, reducedMotion, failures }, null, 2));
  if (failures.length) throw new Error(`Responsive audit failed:\n- ${failures.join('\n- ')}`);
} finally {
  server.kill('SIGTERM');
}
