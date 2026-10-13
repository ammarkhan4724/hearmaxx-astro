import fs from 'fs';
import path from 'path';

function list(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === '.astro') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res.push(...list(p));
    else res.push(p);
  }
  return res;
}

const terms = [
  'wp-content',
  'wp-includes',
  'wp-json',
  'wp-admin',
  'wordpress',
  'elementor',
  'xmlrpc',
  'e-con',
  'wp-block',
  'wp-image',
  '?ver=',
  'hostingersite'
];

console.log('================================================================');
console.log('CHECK 1: CASE-INSENSITIVE SEARCH FOR FORBIDDEN WP/ELEMENTOR TERMS');
console.log('================================================================');
const allProjectFiles = list('.').filter(f => 
  !f.endsWith('MIGRATION_REPORT.md') && 
  !f.endsWith('verify.js') && 
  !f.endsWith('verify.mjs') && 
  !f.endsWith('lighthouse-report.json') &&
  !f.endsWith('package-lock.json') &&
  !f.endsWith('content-manifest.json') &&
  !f.startsWith('scripts')
);

let totalMatches = 0;
for (const term of terms) {
  const matches = [];
  for (const f of allProjectFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const isECon = term === 'e-con';
    const hasMatch = isECon
      ? /\be-con[-\s"']/i.test(content)
      : content.toLowerCase().includes(term.toLowerCase());
    if (hasMatch) {
      matches.push(f);
    }
  }
  console.log(`Pattern "${term}": ${matches.length} matches${matches.length > 0 ? ' -> ' + matches.join(', ') : ''}`);
  totalMatches += matches.length;
}
console.log(`TOTAL FORBIDDEN MATCHES: ${totalMatches}`);

console.log('\n================================================================');
console.log('CHECK 2: CONFIRM NO FILE/FOLDER NAME CONTAINS FORBIDDEN PATTERNS');
console.log('================================================================');
const forbiddenNamePatterns = ['wp-', 'elementor', 'untitled', '-300x', '-768x', '-1024x', '-scaled'];
const allFiles = list('.');
let forbiddenNameMatches = 0;
for (const f of allFiles) {
  const base = path.basename(f).toLowerCase();
  for (const pat of forbiddenNamePatterns) {
    if (base.includes(pat)) {
      console.log(`Forbidden name match: ${f} contains ${pat}`);
      forbiddenNameMatches++;
    }
  }
}
console.log(`TOTAL FORBIDDEN FILENAME MATCHES: ${forbiddenNameMatches}`);

console.log('\n================================================================');
console.log('CHECK 3: ALL ASSETS IN src/assets/ AND public/ REFERENCED CHECK');
console.log('================================================================');
const codeFiles = [
  ...list('src/pages'),
  ...list('src/components'),
  ...list('src/layouts'),
  ...list('src/data'),
  ...list('src/content')
];
const codeText = codeFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const assets = list('src/assets');
const unrefAssets = [];
for (const a of assets) {
  const base = path.basename(a);
  if (!codeText.includes(base)) {
    unrefAssets.push(a);
  }
}
console.log(`src/assets/: ${assets.length} total files, ${unrefAssets.length} unreferenced.`);
if (unrefAssets.length > 0) {
  unrefAssets.forEach(u => console.log('  UNREFERENCED: ' + u));
}

const publicFiles = list('public');
console.log(`public/: ${publicFiles.length} files:`);
publicFiles.forEach(p => console.log('  - ' + p));

console.log('\n================================================================');
console.log('CHECK 4: VERIFY dist/robots.txt AND dist/sitemap-index.xml');
console.log('================================================================');
const robotsExists = fs.existsSync('dist/robots.txt');
const sitemapIndexExists = fs.existsSync('dist/sitemap-index.xml');
console.log(`dist/robots.txt exists: ${robotsExists}`);
if (robotsExists) {
  console.log('--- robots.txt content ---');
  console.log(fs.readFileSync('dist/robots.txt', 'utf8').trim());
  console.log('--------------------------');
}
console.log(`dist/sitemap-index.xml exists: ${sitemapIndexExists}`);

console.log('\n================================================================');
console.log('CHECK 5: VERIFY ALL 12 CANONICAL URLS PLUS 404 EXIST IN dist/');
console.log('================================================================');
const requiredRoutes = [
  'dist/index.html',
  'dist/explore-hearing-solutions/index.html',
  'dist/our-services/index.html',
  'dist/about-us/index.html',
  'dist/contact-us/index.html',
  'dist/appointment-form/index.html',
  'dist/find-our-clinics/index.html',
  'dist/get-expert-advice/index.html',
  'dist/the-impact-of-untreated-hearing-loss/index.html',
  'dist/signs-you-may-have-hearing-loss/index.html',
  'dist/what-is-tinnitus/index.html',
  'dist/ear-infections-conditions/index.html',
  'dist/404.html'
];

let missingRoutes = 0;
for (const r of requiredRoutes) {
  const exists = fs.existsSync(r);
  console.log(`${exists ? '✓' : '✗'} ${r}`);
  if (!exists) missingRoutes++;
}
console.log(`TOTAL MISSING ROUTES: ${missingRoutes}`);
