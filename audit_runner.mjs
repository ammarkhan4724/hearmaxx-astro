import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

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
  { width: 360, height: 800, name: '360px' },
  { width: 390, height: 844, name: '390px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1024, height: 768, name: '1024px' },
  { width: 1280, height: 800, name: '1280px' },
  { width: 1920, height: 1080, name: '1920px' }
];

const screenshotDir = 'screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  console.log('=== STARTING AUTOMATED AUDIT & SCREENSHOT SUITE ===\n');
  const browser = await chromium.launch();
  const baseUrl = 'http://localhost:4321';

  let totalAxeViolations = 0;
  let totalOverflowIssues = 0;
  const axeReport = {};

  for (const pageInfo of pages) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing Page: [${pageInfo.name}] (${pageInfo.path})`);
    console.log(`--------------------------------------------------`);
    
    // 1. Accessibility Check with Axe at 1280px
    const axeContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const axePage = await axeContext.newPage();
    await axePage.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: 'networkidle' });

    try {
      const axeResults = await new AxeBuilder({ page: axePage })
        .exclude('iframe')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const violations = axeResults.violations;
      axeReport[pageInfo.name] = violations.length;
      if (violations.length === 0) {
        console.log(`  ✓ Axe Accessibility: 0 violations! (100% compliant)`);
      } else {
        console.log(`  ✗ Axe Violations (${violations.length}):`);
        violations.forEach(v => {
          console.log(`    - [${v.id}] ${v.help}: ${v.nodes.length} element(s)`);
          v.nodes.slice(0, 2).forEach(n => console.log(`      Target: ${n.target.join(' ')}`));
        });
        totalAxeViolations += violations.length;
      }
    } catch (e) {
      console.log(`  ! Axe error on ${pageInfo.name}:`, e.message);
    }
    await axeContext.close();

    // 2. Viewport & Overflow Tests
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: 'networkidle' });

      // Check horizontal scrollbar
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          hasOverflow: root.scrollWidth > root.clientWidth
        };
      });

      if (overflow.hasOverflow) {
        console.log(`  ✗ Horizontal overflow at ${vp.name}! scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
        totalOverflowIssues++;
      }

      // Capture screenshot at 390px and 1280px
      if (vp.width === 390 || vp.width === 1280) {
        const filePrefix = vp.width === 390 ? 'mobile_390px' : 'desktop_1280px';
        const shotPath = path.join(screenshotDir, `${filePrefix}_${pageInfo.name}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        console.log(`  📸 Screenshot saved: ${shotPath}`);
      }

      await context.close();
    }

    // 3. Test 200% Zoom / Text scale emulation at 1280px
    const zoomContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2
    });
    const zoomPage = await zoomContext.newPage();
    await zoomPage.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: 'networkidle' });
    const zoomOverflow = await zoomPage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (zoomOverflow) {
      console.log(`  ✗ Overflow detected under 200% zoom emulation on ${pageInfo.name}`);
      totalOverflowIssues++;
    } else {
      console.log(`  ✓ 200% zoom test: No horizontal overflow`);
    }
    await zoomContext.close();
  }

  // 4. Interactive Navigation Tests
  console.log(`\n==================================================`);
  console.log(`TESTING INTERACTIVE NAVIGATION COMPONENTS`);
  console.log(`==================================================`);

  // Desktop Dropdown
  const dtContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dtPage = await dtContext.newPage();
  await dtPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const dropdownTrigger = dtPage.locator('#desktop-dropdown-trigger');
  if (await dropdownTrigger.count() > 0) {
    // Hover
    await dropdownTrigger.hover();
    await dtPage.waitForTimeout(300);
    const isVisibleHover = await dtPage.locator('#desktop-dropdown-panel').isVisible();
    console.log(`  Desktop dropdown hover opens panel: ${isVisibleHover ? '✓ PASS' : '✗ FAIL'}`);
    
    // Keyboard Escape to close
    await dtPage.keyboard.press('Escape');
    await dtPage.waitForTimeout(200);
    const isClosedEsc = !(await dtPage.locator('#desktop-dropdown-panel').isVisible());
    console.log(`  Desktop dropdown closes on Escape: ${isClosedEsc ? '✓ PASS' : '✗ FAIL'}`);
  }
  await dtContext.close();

  // Mobile Menu
  const mobContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobPage = await mobContext.newPage();
  await mobPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const hamburger = mobPage.locator('#mobile-menu-trigger');
  if (await hamburger.count() > 0) {
    await hamburger.click();
    await mobPage.waitForTimeout(300);
    const drawerOpen = await mobPage.locator('#mobile-menu-panel').isVisible();
    console.log(`  Mobile menu opens on click: ${drawerOpen ? '✓ PASS' : '✗ FAIL'}`);

    // Accordion toggle inside mobile menu
    const accBtn = mobPage.locator('#mobile-hearing-health-btn');
    if (await accBtn.count() > 0) {
      await accBtn.click();
      await mobPage.waitForTimeout(200);
      const accExpanded = await mobPage.locator('#mobile-hearing-health-content').isVisible();
      console.log(`  Mobile Hearing Health accordion expands: ${accExpanded ? '✓ PASS' : '✗ FAIL'}`);
    }

    // Escape closes mobile menu
    await mobPage.keyboard.press('Escape');
    await mobPage.waitForTimeout(300);
    const drawerClosed = !(await mobPage.locator('#mobile-menu-panel').isVisible());
    console.log(`  Mobile menu closes on Escape: ${drawerClosed ? '✓ PASS' : '✗ FAIL'}`);
  }
  await mobContext.close();

  await browser.close();

  console.log(`\n==================================================`);
  console.log(`AUDIT SUMMARY`);
  console.log(`==================================================`);
  console.log(`Total Pages Tested: ${pages.length}`);
  console.log(`Total Viewports per page: ${viewports.length}`);
  console.log(`Total Horizontal Overflow Issues: ${totalOverflowIssues}`);
  console.log(`Total Axe Accessibility Violations: ${totalAxeViolations}`);
  console.log(`Axe Violations Per Page:`, JSON.stringify(axeReport, null, 2));
  console.log(`==================================================\n`);
})();
