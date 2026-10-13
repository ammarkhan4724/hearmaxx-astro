import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

async function run() {
  console.log('=== STARTING PLAYWRIGHT + AXE-CORE ACCESSIBILITY & RESPONSIVE AUDIT ===\n');

  // Read axe-core source
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {};
  let totalViolations = 0;
  let totalOverflowErrors = 0;

  for (const p of pages) {
    const url = `http://localhost:4321${p.path}`;
    console.log(`Auditing [${p.name}]...`);
    results[p.name] = {
      a11yViolations: 0,
      violationsList: [],
      responsive: {}
    };

    // 1. Accessibility via axe-core
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.evaluate(axeSource);
    const axeResults = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });

    results[p.name].a11yViolations = axeResults.violations.length;
    results[p.name].violationsList = axeResults.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length
    }));

    if (axeResults.violations.length > 0) {
      console.warn(`  ⚠️ axe violations on ${p.name}:`, axeResults.violations.map(v => v.id));
      totalViolations += axeResults.violations.length;
    } else {
      console.log(`  ✓ axe-core: 0 violations (WCAG AA Compliant)`);
    }

    // 2. Responsive testing across viewports
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasHorizontalScroll = docWidth > winWidth;
        return {
          docWidth,
          winWidth,
          hasHorizontalScroll
        };
      });

      results[p.name].responsive[vp.label] = overflow.hasHorizontalScroll ? 'OVERFLOW' : 'OK';
      if (overflow.hasHorizontalScroll) {
        console.error(`  ✗ Responsive overflow at ${vp.label}: docWidth=${overflow.docWidth}, winWidth=${overflow.winWidth}`);
        totalOverflowErrors++;
      }
    }

    // Capture screenshots for 390px and 1280px
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `screenshots/mobile_390px_${p.name}.png`, fullPage: false });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: `screenshots/desktop_1280px_${p.name}.png`, fullPage: false });
  }

  await browser.close();

  fs.writeFileSync('a11y_responsive_results.json', JSON.stringify(results, null, 2));

  console.log('\n==================================================');
  console.log(`AUDIT FINISHED. Total Axe Violations: ${totalViolations}, Total Overflow Errors: ${totalOverflowErrors}`);
  console.log('==================================================');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
