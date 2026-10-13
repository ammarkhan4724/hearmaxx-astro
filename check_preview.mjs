import http from 'http';

const routes = [
  '/',
  '/explore-hearing-solutions/',
  '/our-services/',
  '/about-us/',
  '/contact-us/',
  '/appointment-form/',
  '/find-our-clinics/',
  '/get-expert-advice/',
  '/the-impact-of-untreated-hearing-loss/',
  '/signs-you-may-have-hearing-loss/',
  '/what-is-tinnitus/',
  '/ear-infections-conditions/',
  '/404.html',
  '/robots.txt',
  '/sitemap-index.xml',
  '/favicon.png',
  '/videos/clinic-tour.mp4',
  '/videos/services-overview.mp4'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    http.get('http://localhost:4321' + route, (res) => {
      resolve({ route, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing local preview endpoints:');
  let errors = 0;
  for (const r of routes) {
    const res = await checkRoute(r);
    const ok = res.status === 200 || (r === '/404.html' && (res.status === 200 || res.status === 404));
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${res.route} -> ${res.status || res.error}`);
    if (!ok) errors++;
  }
  console.log('Total endpoint errors:', errors);
}

run();
