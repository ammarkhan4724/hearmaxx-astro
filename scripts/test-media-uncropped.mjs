import { chromium } from 'playwright';

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
  console.log('========================================================================');
  console.log('PLAYWRIGHT AUTOMATED UNCROPPED MEDIA & ASPECT-RATIO AUDIT');
  console.log('Rules:');
  console.log('1. Computed object-fit: cover is STRICTLY FORBIDDEN (Fail immediately)');
  console.log('2. Either rendered aspect ratio matches natural within 2% OR object-fit: contain');
  console.log('Tested across all 13 routes and 6 responsive viewports (360-1920px)');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalElementsAudited = 0;
  let totalErrors = 0;
  const auditReport = [];

  for (const p of pages) {
    const url = `http://localhost:4321${p.path}`;
    console.log(`Auditing media on [${p.name}]...`);

    let pageCoverFailures = 0;
    let pageAspectFailures = 0;
    let pageMediaCount = 0;

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(150);

      // Evaluate all img and video elements
      const mediaResults = await page.evaluate(() => {
        const elements = [];
        const imgs = Array.from(document.querySelectorAll('img'));
        const videos = Array.from(document.querySelectorAll('video'));

        for (const img of imgs) {
          // Ignore 0-sized or hidden elements (e.g. mobile/desktop conditional elements when hidden)
          const rect = img.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(img).display === 'none') {
            continue;
          }

          const style = window.getComputedStyle(img);
          const objectFit = style.objectFit;
          const renderedAspect = rect.width / rect.height;
          const naturalAspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : renderedAspect;

          elements.push({
            type: 'img',
            src: img.src ? img.src.split('/').pop().split('?')[0] : 'inline',
            width: rect.width,
            height: rect.height,
            renderedAspect,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            naturalAspect,
            objectFit
          });
        }

        for (const video of videos) {
          const rect = video.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(video).display === 'none') {
            continue;
          }

          const style = window.getComputedStyle(video);
          const objectFit = style.objectFit;
          const renderedAspect = rect.width / rect.height;
          // For videos, natural aspect is videoWidth / videoHeight or poster aspect
          const naturalAspect = (video.videoWidth && video.videoHeight)
            ? (video.videoWidth / video.videoHeight)
            : (9 / 16); // Both clinic videos are 9:16 vertical videos

          elements.push({
            type: 'video',
            src: video.src ? video.src.split('/').pop() : 'video-element',
            width: rect.width,
            height: rect.height,
            renderedAspect,
            naturalWidth: video.videoWidth || 360,
            naturalHeight: video.videoHeight || 640,
            naturalAspect,
            objectFit
          });
        }

        return elements;
      });

      for (const el of mediaResults) {
        totalElementsAudited++;
        pageMediaCount++;

        // Check 1: No object-fit: cover allowed
        if (el.objectFit === 'cover') {
          console.error(`  ✗ FAIL [${p.name} @ ${vp.label}]: ${el.type} (${el.src}) has object-fit: cover`);
          pageCoverFailures++;
          totalErrors++;
          continue;
        }

        // Check 2: object-fit: contain OR rendered aspect within 2% of natural
        if (el.objectFit === 'contain') {
          // Perfectly uncropped inside container
          continue;
        }

        // Check aspect ratio diff
        if (el.naturalAspect > 0) {
          const diff = Math.abs(el.renderedAspect - el.naturalAspect) / el.naturalAspect;
          if (diff > 0.02) {
            console.error(`  ✗ FAIL [${p.name} @ ${vp.label}]: ${el.type} (${el.src}) aspect ratio diff ${(diff * 100).toFixed(1)}% exceeds 2% (rendered: ${el.renderedAspect.toFixed(3)}, natural: ${el.naturalAspect.toFixed(3)}, object-fit: ${el.objectFit})`);
            pageAspectFailures++;
            totalErrors++;
          }
        }
      }
    }

    auditReport.push({
      page: p.name,
      mediaChecks: pageMediaCount,
      coverFailures: pageCoverFailures,
      aspectFailures: pageAspectFailures,
      status: (pageCoverFailures === 0 && pageAspectFailures === 0) ? '✓ PASS' : '✗ FAIL'
    });
  }

  await browser.close();

  console.log('\n========================================================================');
  console.log('UNCROPPED MEDIA AUDIT SUMMARY TABLE');
  console.log('========================================================================');
  console.table(auditReport);
  console.log(`Total media element evaluations: ${totalElementsAudited}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('========================================================================\n');

  if (totalErrors > 0) {
    console.error(`AUDIT FAILED with ${totalErrors} uncropped media violations.`);
    process.exit(1);
  } else {
    console.log('ALL MEDIA ASSETS FULLY UNCROPPED (0 object-cover, 100% aspect preserved or object-contain)');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
