import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'screenshots/after';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('Capturing targeted AFTER screenshots at 390px and 1280px...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Helper to wait and capture
  async function capture(url, vp, filename, setupFn) {
    await page.setViewportSize(vp);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    if (setupFn) await setupFn(page);
    await page.waitForTimeout(300);
    const savePath = `${outDir}/${filename}`;
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`✓ Saved: ${savePath}`);
  }

  // 1. Home Hero
  await capture('http://localhost:4321/', { width: 1280, height: 800 }, 'desktop_1280px_home_hero.png');
  await capture('http://localhost:4321/', { width: 390, height: 844 }, 'mobile_390px_home_hero.png');

  // 2. Open Dropdown with Scrim (Desktop 1280px) and Mobile Menu (390px)
  await capture('http://localhost:4321/the-impact-of-untreated-hearing-loss/', { width: 1280, height: 800 }, 'desktop_1280px_open_dropdown.png', async (p) => {
    // Scroll down slightly so text is behind the header
    await p.evaluate(() => window.scrollTo(0, 220));
    await p.waitForTimeout(200);
    // Click dropdown trigger
    await p.click('#desktop-dropdown-trigger');
    await p.waitForTimeout(400);
  });

  await capture('http://localhost:4321/the-impact-of-untreated-hearing-loss/', { width: 390, height: 844 }, 'mobile_390px_open_dropdown.png', async (p) => {
    await p.click('#open-mobile-menu');
    await p.waitForTimeout(300);
    await p.click('#mobile-accordion-toggle');
    await p.waitForTimeout(400);
  });

  // 3. Impact Page (Reading Column & Spacing)
  await capture('http://localhost:4321/the-impact-of-untreated-hearing-loss/', { width: 1280, height: 950 }, 'desktop_1280px_impact_page.png', async (p) => {
    await p.evaluate(() => {
      const heading = document.querySelector('h2');
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  });

  await capture('http://localhost:4321/the-impact-of-untreated-hearing-loss/', { width: 390, height: 844 }, 'mobile_390px_impact_page.png', async (p) => {
    await p.evaluate(() => {
      const heading = document.querySelector('h2');
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  });

  // 4. Tinnitus FAQ (Accordion open state with brand glow)
  await capture('http://localhost:4321/what-is-tinnitus/', { width: 1280, height: 900 }, 'desktop_1280px_tinnitus_faq.png', async (p) => {
    await p.evaluate(() => {
      const faqSec = document.querySelector('details');
      if (faqSec) {
        faqSec.scrollIntoView({ behavior: 'instant', block: 'center' });
        faqSec.setAttribute('open', '');
      }
    });
  });

  await capture('http://localhost:4321/what-is-tinnitus/', { width: 390, height: 844 }, 'mobile_390px_tinnitus_faq.png', async (p) => {
    await p.evaluate(() => {
      const faqSec = document.querySelector('details');
      if (faqSec) {
        faqSec.scrollIntoView({ behavior: 'instant', block: 'center' });
        faqSec.setAttribute('open', '');
      }
    });
  });

  // 5. About Page Videos (9:16 Uncropped vertical videos)
  await capture('http://localhost:4321/about-us/', { width: 1280, height: 950 }, 'desktop_1280px_about_videos.png', async (p) => {
    await p.evaluate(() => {
      const vid = document.querySelector('video');
      if (vid) vid.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
  });

  await capture('http://localhost:4321/about-us/', { width: 390, height: 844 }, 'mobile_390px_about_videos.png', async (p) => {
    await p.evaluate(() => {
      const vid = document.querySelector('video');
      if (vid) vid.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
  });

  await browser.close();
  console.log('Targeted screenshots capture complete!');
}

run().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
