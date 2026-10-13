import { chromium } from 'playwright';
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

(async () => {
  const browser = await chromium.launch();
  const baseUrl = 'http://localhost:4321';

  for (const pageInfo of pages) {
    // Mobile 390px
    const mobPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobPage.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: 'networkidle' });
    await mobPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mobPage.waitForTimeout(400);
    await mobPage.evaluate(() => window.scrollTo(0, 0));
    await mobPage.waitForTimeout(200);
    await mobPage.screenshot({ path: path.join('screenshots', `mobile_390px_${pageInfo.name}.png`), fullPage: true });
    await mobPage.close();

    // Desktop 1280px
    const dtPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await dtPage.goto(`${baseUrl}${pageInfo.path}`, { waitUntil: 'networkidle' });
    await dtPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await dtPage.waitForTimeout(400);
    await dtPage.evaluate(() => window.scrollTo(0, 0));
    await dtPage.waitForTimeout(200);
    await dtPage.screenshot({ path: path.join('screenshots', `desktop_1280px_${pageInfo.name}.png`), fullPage: true });
    await dtPage.close();

    console.log(`✓ Recaptured screenshots for: ${pageInfo.name}`);
  }

  await browser.close();
  console.log('All screenshots freshly captured!');
})();
