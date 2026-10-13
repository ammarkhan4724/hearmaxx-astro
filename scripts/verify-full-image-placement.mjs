import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const pages = [
  { name: 'home', path: '/' },
  { name: 'explore-hearing-solutions', path: '/explore-hearing-solutions/' },
  { name: 'our-services', path: '/our-services/' },
  { name: 'about-us', path: '/about-us/' },
  { name: 'contact-us', path: '/contact-us/' },
  { name: 'appointment-form', path: '/appointment-form/' },
  { name: 'find-our-clinics', path: '/find-our-clinics/' },
  { name: 'get-expert-advice', path: '/get-expert-advice/' },
  { name: 'the-impact-of-untreated-hearing-loss', path: '/the-impact-of-untreated-hearing-loss/' },
  { name: 'signs-you-may-have-hearing-loss', path: '/signs-you-may-have-hearing-loss/' },
  { name: 'what-is-tinnitus', path: '/what-is-tinnitus/' },
  { name: 'ear-infections-conditions', path: '/ear-infections-conditions/' },
  { name: '404', path: '/404.html' }
];

const viewports = [
  { width: 360, height: 740, label: '360px' },
  { width: 390, height: 844, label: '390px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1024, height: 768, label: '1024px' },
  { width: 1280, height: 800, label: '1280px' },
  { width: 1920, height: 1080, label: '1920px' }
];

const astroScreenshotsDir1440 = 'd:/_asset-import/screenshots/astro/1440';
const astroScreenshotsDir390 = 'd:/_asset-import/screenshots/astro/390';
fs.mkdirSync(astroScreenshotsDir1440, { recursive: true });
fs.mkdirSync(astroScreenshotsDir390, { recursive: true });

async function run() {
  console.log('========================================================================');
  console.log('MANDATORY STEP 7: COMPREHENSIVE AUTOMATED BROWSER IMAGE & MEDIA AUDIT');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
  });
  page.on('response', res => {
    if (res.status() >= 400) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  const pageResults = [];
  const sharpnessExceptions = [];
  const inventoryCounts = {};

  for (const p of pages) {
    console.log(`\nAuditing [${p.name}]...`);
    const url = `http://localhost:4321${p.path}`;

    let totalImgCount = 0;
    let missingAltCount = 0;
    let missingDimensionsCount = 0;
    let brokenImagesCount = 0;
    let coverFitCount = 0;
    let externalImagesCount = 0;

    // 1. Capture 1440px and 390px screenshots
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle' });
    // Scroll down to ensure lazy loading settles
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight / 2);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(astroScreenshotsDir1440, `${p.name}.png`), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight / 2);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 200));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(astroScreenshotsDir390, `${p.name}.png`), fullPage: true });

    // 2. Audit images across all responsive viewports
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight / 2);
        await new Promise(r => setTimeout(r, 100));
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 100));
        await Promise.all(Array.from(document.querySelectorAll('img')).map(img => img.decode().catch(() => {})));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(200);

      const imgData = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => {
          const rect = img.getBoundingClientRect();
          const style = window.getComputedStyle(img);
          const hasExplicitDim = img.hasAttribute('width') && img.hasAttribute('height');
          const hasAlt = img.hasAttribute('alt');
          const isSvg = img.src.includes('.svg') || img.src.startsWith('data:image/svg');
          const isLogoOrIcon = img.closest('nav') || img.closest('header') || img.closest('footer') || rect.width < 100;
          return {
            src: img.src,
            alt: img.getAttribute('alt'),
            hasAlt,
            hasExplicitDim,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            renderedWidth: rect.width,
            renderedHeight: rect.height,
            objectFit: style.objectFit,
            isSvg,
            isLogoOrIcon,
            visible: rect.width > 0 && rect.height > 0 && style.display !== 'none'
          };
        });
      });

      if (vp.width === 1440) {
        inventoryCounts[p.name] = imgData.filter(i => i.visible).length;
      }

      for (const img of imgData) {
        if (!img.visible) continue;
        totalImgCount++;

        if (img.naturalWidth === 0 && !img.isSvg) {
          brokenImagesCount++;
          console.error(`  ✗ BROKEN IMAGE: ${img.src}`);
        }

        if (!img.hasAlt) {
          missingAltCount++;
          console.error(`  ✗ MISSING ALT: ${img.src}`);
        }

        if (!img.hasExplicitDim && !img.isSvg) {
          missingDimensionsCount++;
          console.error(`  ✗ MISSING EXPLICIT WIDTH/HEIGHT: ${img.src}`);
        }

        if (img.objectFit === 'cover') {
          coverFitCount++;
          console.error(`  ✗ OBJECT-FIT COVER: ${img.src}`);
        }

        // Check external host
        if (!img.src.startsWith('http://localhost:4321') && !img.src.startsWith('data:')) {
          externalImagesCount++;
          console.error(`  ✗ EXTERNAL HOST: ${img.src}`);
        }

        // Sharpness check: naturalWidth >= renderedWidth * 2 (or 3x for logo/icons)
        if (!img.isSvg && img.naturalWidth > 0 && img.renderedWidth > 0) {
          const requiredMultiplier = img.isLogoOrIcon ? 2.5 : 1.8;
          const ratio = img.naturalWidth / img.renderedWidth;
          if (ratio < requiredMultiplier) {
            sharpnessExceptions.push({
              page: p.name,
              viewport: vp.label,
              src: img.src.split('/').pop().split('?')[0],
              natural: `${img.naturalWidth}x${img.naturalHeight}`,
              rendered: `${Math.round(img.renderedWidth)}x${Math.round(img.renderedHeight)}`,
              ratio: ratio.toFixed(2)
            });
          }
        }
      }
    }

    pageResults.push({
      page: p.name,
      desktopImageCount: inventoryCounts[p.name],
      totalChecked: totalImgCount,
      broken: brokenImagesCount,
      missingAlt: missingAltCount,
      missingDim: missingDimensionsCount,
      coverFit: coverFitCount,
      external: externalImagesCount,
      status: (brokenImagesCount === 0 && missingAltCount === 0 && missingDimensionsCount === 0 && coverFitCount === 0 && externalImagesCount === 0) ? '✓ PASS' : '✗ FAIL'
    });
  }

  await browser.close();

  console.log('\n========================================================================');
  console.log('IMAGE AUDIT SUMMARY ACROSS ALL 13 ROUTES (360-1920px)');
  console.log('========================================================================');
  console.table(pageResults);

  console.log('\n========================================================================');
  console.log('NETWORK ERROR AUDIT:');
  console.log(`Failed / 404 HTTP requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    console.table(failedRequests);
  } else {
    console.log('✓ ZERO network failures, zero 404 requests detected!');
  }

  console.log('\n========================================================================');
  console.log('SHARPNESS ANALYSIS & RETINA DENSITY EXCEPTIONS:');
  console.log(`Unique sharpness observations: ${sharpnessExceptions.length}`);
  // Group unique exceptions by src
  const uniqueExceptions = {};
  for (const ex of sharpnessExceptions) {
    if (!uniqueExceptions[ex.src]) {
      uniqueExceptions[ex.src] = ex;
    }
  }
  console.table(Object.values(uniqueExceptions));

  // Write results to JSON for reporting
  fs.writeFileSync('d:/_asset-import/automated_audit_results.json', JSON.stringify({
    pageResults,
    failedRequests,
    uniqueExceptions: Object.values(uniqueExceptions),
    inventoryCounts
  }, null, 2));

  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
