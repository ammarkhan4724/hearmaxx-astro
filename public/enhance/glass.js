/* Hear Maxx – glassmorphism classifier.
   Scans rendered surfaces and tags them with glass classes. Pure CSS
   handles the look; this only decides which elements get it. */
(function () {
  'use strict';

  function parse(c) {
    var m = c && c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : parseFloat(m[4]) };
  }

  function classify() {
    // Narrow down from 'body *' (839 elements) to target sections and cards (~35 elements)
    var all = document.querySelectorAll(
      '.elementor-section, .elementor-column > .elementor-widget-wrap, .elementor-flip-box__layer, footer, .elementor-location-footer'
    );
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (
        el.closest(
          '.hm-to-top, .mega-menu-toggle, .elementor-element-3a844cf, .mega-menu-wrap, #mega-menu-wrap-max_mega_menu_1, .elementor-section:has(#mega-menu-wrap-max_mega_menu_1), .elementor-element-b3b6838, .elementor-element-a82d207, .elementor-element-905bc04, .elementor-element-39ce786'
        ) ||
        el.closest('.hm-glass, .hm-glass-strong, .hm-glass-dark')
      )
        continue;
      if (el.querySelector('img[src*="hear_maxx_logo"], img[src*="Footer-Logo"], .hm-hearing-loss-hero-img')) continue;
      // Never apply glass to swiper slides/slide backgrounds to keep hardware compositing pure
      if (el.classList.contains('swiper-slide-bg') || el.classList.contains('swiper-slide') || el.closest('.swiper-slide')) continue;

      var bgImg = getComputedStyle(el).backgroundImage;
      if (bgImg && bgImg !== 'none' && !bgImg.includes('gradient') && !bgImg.includes('data:image/svg')) continue;
      var c = parse(getComputedStyle(el).backgroundColor);
      if (!c || c.a < 0.5) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 50) continue;

      var lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      var isFooter = el.classList.contains('elementor-location-footer') || el.tagName === 'FOOTER';
      var isFlipBack = el.classList.contains('elementor-flip-box__back') || el.classList.contains('elementor-flip-box__layer');

      if (isFooter || (lum < 120 && isFlipBack)) {
        el.classList.add('hm-glass-dark');
        continue;
      }
      if (lum < 200) continue; // leave other dark design blocks alone

      // Light surfaces
      if (el.tagName === 'SECTION' && r.width >= 1000) {
        if (r.top + window.scrollY < 100) el.classList.add('hm-glass-strong');
        else el.classList.add('hm-clear');
        continue;
      }
      if (el.closest('.mega-menu-wrap, .mega-menu, .mega-sub-menu')) continue;
      el.classList.add('hm-glass');
    }
  }

  // Text sitting on photos/images must stay light; detect image-backed ancestors
  function markMediaText() {
    document.querySelectorAll('.elementor-widget-text-editor, .elementor-widget-heading').forEach(function (w) {
      var n = w, depth = 0, onMedia = false;
      while (n && depth < 6) {
        var bi = getComputedStyle(n).backgroundImage;
        if (bi && bi !== 'none') { onMedia = true; break; }
        n = n.parentElement; depth++;
      }
      if (onMedia) w.classList.add('hm-on-media');
    });
  }

  // Reveal-on-scroll for glass cards. Skipped inside sliders/flip boxes
  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('.hm-glass.elementor-widget-wrap, .hm-glass.elementor-flip-box__layer');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) {
      if (el.closest('.swiper, .elementor-flip-box, .elementor-element-populated.hm-noreveal')) return;
      el.classList.add('hm-reveal');
      io.observe(el);
    });
  }

  function runIdle(fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 60);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      runIdle(function () {
        markMediaText();
        classify();
      });
    });
  } else {
    runIdle(function () {
      markMediaText();
      classify();
    });
  }
  window.addEventListener('load', function () {
    runIdle(function () {
      classify();
      reveal();
    });
  });
})();
