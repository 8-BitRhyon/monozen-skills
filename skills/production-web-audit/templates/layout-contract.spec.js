const { test, expect } = require('@playwright/test');

async function sectionMetrics(page, selector) {
  return page.evaluate((target) => {
    const section = document.querySelector(target);
    const rect = section.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
    };
  }, selector);
}

test.describe('layout contract', () => {
  test('target section fills the bottom viewport', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);

    const metrics = await sectionMetrics(page, '#targetSection');
    expect(metrics.height).toBeGreaterThanOrEqual(metrics.viewportHeight - 2);
    expect(metrics.top).toBeLessThanOrEqual(2);
    expect(metrics.bottom).toBeGreaterThanOrEqual(metrics.viewportHeight - 2);
  });

  test('pointer effect stays under the cursor', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);

    const target = await page.locator('#pointerTarget').boundingBox();
    const x = target.x + target.width * 0.55;
    const y = target.y + target.height * 0.52;
    await page.mouse.move(x, y);
    await page.waitForTimeout(400);

    const result = await page.evaluate(
      ({ cursorX, cursorY }) => {
        const canvas = document.getElementById('effectCanvas');
        const rect = canvas.getBoundingClientRect();
        const context = canvas.getContext('2d');
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let sumX = 0;
        let sumY = 0;
        let count = 0;

        for (let py = 0; py < canvas.height; py += 2) {
          for (let px = 0; px < canvas.width; px += 2) {
            const alpha = data[(py * canvas.width + px) * 4 + 3];
            if (alpha > 10) {
              sumX += px;
              sumY += py;
              count++;
            }
          }
        }

        return {
          count,
          centroid: count ? { x: sumX / count, y: sumY / count } : null,
          localCursor: {
            x: (cursorX - rect.left) * (canvas.width / rect.width),
            y: (cursorY - rect.top) * (canvas.height / rect.height),
          },
        };
      },
      { cursorX: x, cursorY: y }
    );

    expect(result.count).toBeGreaterThan(0);
    expect(Math.abs(result.centroid.x - result.localCursor.x)).toBeLessThan(30);
    expect(Math.abs(result.centroid.y - result.localCursor.y)).toBeLessThan(30);
  });

  test('service worker installs without a missing precache asset', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const ready = await Promise.race([
        navigator.serviceWorker.ready.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 8000)),
      ]);
      const keys = await caches.keys();
      return { ready, keys };
    });

    expect(result.ready).toBe(true);
    // Replace with your cache prefix if the app uses one.
    expect(result.keys.length).toBeGreaterThan(0);
  });
});
