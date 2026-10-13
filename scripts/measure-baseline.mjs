import { execSync } from 'child_process';
import fs from 'fs';

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

const baseline = {};

console.log('=== COLLECTING FULL BASELINE PERFORMANCE METRICS (MOBILE THROTTLED) ===\n');

for (const p of pages) {
  const tempJson = `lh-base-${p.name}.json`;
  const url = `http://localhost:4321${p.path}`;
  console.log(`Auditing baseline for [${p.name}]...`);

  try {
    execSync(
      `npx lighthouse ${url} --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=${tempJson} --chrome-flags="--headless" --quiet`,
      { stdio: 'ignore' }
    );
    const data = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
    const audits = data.audits;

    // Resource breakdown from network requests
    const networkItems = audits['network-requests']?.details?.items || [];
    let totalBytes = 0;
    let jsBytes = 0;
    let cssBytes = 0;
    let imgBytes = 0;
    let fontBytes = 0;
    let videoBytes = 0;
    let docBytes = 0;

    networkItems.forEach(item => {
      const size = item.transferSize || item.resourceSize || 0;
      totalBytes += size;
      const type = (item.resourceType || '').toLowerCase();
      if (type === 'script') jsBytes += size;
      else if (type === 'stylesheet') cssBytes += size;
      else if (type === 'image') imgBytes += size;
      else if (type === 'font') fontBytes += size;
      else if (type === 'media') videoBytes += size;
      else if (type === 'document') docBytes += size;
    });

    const lcpElement = audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || 'N/A';

    baseline[p.name] = {
      performance: Math.round(data.categories.performance.score * 100),
      accessibility: Math.round(data.categories.accessibility.score * 100),
      bestPractices: Math.round(data.categories['best-practices'].score * 100),
      seo: Math.round(data.categories.seo.score * 100),
      fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
      lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      cls: Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
      tbt: Math.round(audits['total-blocking-time']?.numericValue || 0),
      ttfb: Math.round(audits['server-response-time']?.numericValue || 0),
      requestCount: networkItems.length,
      totalWeightKb: Math.round(totalBytes / 1024),
      docKb: Number((docBytes / 1024).toFixed(1)),
      cssKb: Number((cssBytes / 1024).toFixed(1)),
      jsKb: Number((jsBytes / 1024).toFixed(1)),
      imgKb: Number((imgBytes / 1024).toFixed(1)),
      fontKb: Number((fontBytes / 1024).toFixed(1)),
      videoKb: Number((videoBytes / 1024).toFixed(1)),
      lcpElement: lcpElement.slice(0, 60)
    };

    fs.unlinkSync(tempJson);
    console.log(`  ✓ ${p.name}: Perf=${baseline[p.name].performance}, LCP=${baseline[p.name].lcp}ms, Weight=${baseline[p.name].totalWeightKb}KB, Requests=${baseline[p.name].requestCount}`);
  } catch (err) {
    console.error(`  ✗ Error auditing ${p.name}:`, err.message);
  }
}

fs.writeFileSync('baseline_metrics.json', JSON.stringify(baseline, null, 2));
console.log('\n=== BASELINE AUDIT COMPLETE ===');
console.table(baseline);
