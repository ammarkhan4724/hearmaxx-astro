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

const results = {};

for (const p of pages) {
  const tempJson = `lh-temp-${p.name}.json`;
  const url = `http://localhost:4321${p.path}`;
  console.log(`Auditing: ${p.name} (${url})...`);
  try {
    execSync(
      `npx lighthouse ${url} --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=${tempJson} --chrome-flags="--headless" --quiet`,
      { stdio: 'ignore' }
    );
    const data = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
    results[p.name] = {
      performance: Math.round(data.categories.performance.score * 100),
      accessibility: Math.round(data.categories.accessibility.score * 100),
      bestPractices: Math.round(data.categories['best-practices'].score * 100),
      seo: Math.round(data.categories.seo.score * 100)
    };
    fs.unlinkSync(tempJson);
    console.log(`  ✓ ${p.name}: Perf=${results[p.name].performance}, A11y=${results[p.name].accessibility}, BP=${results[p.name].bestPractices}, SEO=${results[p.name].seo}`);
  } catch (err) {
    console.error(`  ✗ Error auditing ${p.name}:`, err.message);
  }
}

fs.writeFileSync('lighthouse_results.json', JSON.stringify(results, null, 2));
console.log('\n--- ALL LIGHTHOUSE RESULTS ---');
console.table(results);
