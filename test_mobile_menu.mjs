import { chromium } from 'playwright';

(async () => {
  console.log('Testing Mobile Menu Interaction in Playwright...');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  const hamburger = page.locator('#open-mobile-menu');
  if (await hamburger.count() === 0) {
    throw new Error('Hamburger button #open-mobile-menu not found!');
  }

  // 1. Click to open
  await hamburger.click();
  await page.waitForTimeout(400);

  const panel = page.locator('#mobile-panel');
  const isPanelVisible = await panel.isVisible();
  console.log('1. Mobile menu opens on trigger click:', isPanelVisible ? 'PASS' : 'FAIL');

  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  console.log('2. Body scroll locked (overflow: hidden):', bodyOverflow === 'hidden' ? 'PASS' : 'FAIL');

  // 3. Test accordion toggle
  const accordionToggle = page.locator('#mobile-accordion-toggle');
  const accordionContent = page.locator('#mobile-accordion-content');
  console.log('3. Accordion content visible by default:', await accordionContent.isVisible() ? 'PASS' : 'FAIL');

  // Click to collapse
  await accordionToggle.click();
  await page.waitForTimeout(200);
  console.log('4. Accordion collapses on click:', !(await accordionContent.isVisible()) ? 'PASS' : 'FAIL');

  // Click to expand again
  await accordionToggle.click();
  await page.waitForTimeout(200);
  console.log('5. Accordion re-expands on click:', await accordionContent.isVisible() ? 'PASS' : 'FAIL');

  // 6. Test Escape key closes menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const isClosedEsc = await page.evaluate(() => {
    const drawer = document.getElementById('mobile-menu-drawer');
    return drawer.classList.contains('invisible');
  });
  console.log('6. Mobile menu closes on Escape:', isClosedEsc ? 'PASS' : 'FAIL');

  const bodyOverflowRestored = await page.evaluate(() => document.body.style.overflow);
  console.log('7. Body scroll restored after close:', bodyOverflowRestored === '' ? 'PASS' : 'FAIL');

  // 8. Re-open and test close button
  await hamburger.click();
  await page.waitForTimeout(400);
  const closeBtn = page.locator('#close-mobile-menu');
  await closeBtn.click();
  await page.waitForTimeout(400);
  const isClosedBtn = await page.evaluate(() => {
    const drawer = document.getElementById('mobile-menu-drawer');
    return drawer.classList.contains('invisible');
  });
  console.log('8. Mobile menu closes on close button click:', isClosedBtn ? 'PASS' : 'FAIL');

  await browser.close();
  console.log('Mobile menu tests completed successfully!');
})();
