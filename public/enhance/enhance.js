/* wp.i18n stand-in: Lightweight stand-in for WordPress's wp.i18n global, which some lazy
   Elementor Pro chunks reference. Keeps them from throwing on a static site. */
(function () {
  if (window.wp && window.wp.i18n) return;
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    __: function (s) { return s; },
    _x: function (s) { return s; },
    _n: function (s, p, n) { return n === 1 ? s : p; },
    sprintf: function (f) {
      var a = [].slice.call(arguments, 1), i = 0;
      return String(f).replace(/%(s|d)/g, function () { return a[i++]; });
    }
  };
})();

/* Hear Maxx – progressive enhancements (no framework, no dependencies) */
(function () {
  'use strict';

  // 1) Header elevation after scrolling
  var onScroll = function () {
    document.body.classList.toggle('hm-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // 2) Back-to-top button
  var btn = document.createElement('button');
  btn.className = 'hm-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  document.body.appendChild(btn);
  var toggleBtn = function () { btn.classList.toggle('is-visible', window.scrollY > 600); };
  toggleBtn();
  window.addEventListener('scroll', toggleBtn, { passive: true });

  // 3) Lazy-load images that are below the fold (Elementor already lazy-loads some)
  var imgs = document.querySelectorAll('img:not([loading])');
  imgs.forEach(function (img, i) {
    var r = img.getBoundingClientRect();
    if (r.top > window.innerHeight * 1.2) img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });

  // 4) External links open safely in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.host !== window.location.host) {
      a.setAttribute('rel', (a.getAttribute('rel') || '') + ' noopener noreferrer');
    }
  });
})();
