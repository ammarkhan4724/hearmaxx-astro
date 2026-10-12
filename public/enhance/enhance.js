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

  // 1) Header elevation & Back-to-top button (deferred to avoid forced reflow during page load)
  function initScrollEnhancements() {
    var ticking = false;
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

    var updateScrollState = function () {
      var y = window.scrollY || window.pageYOffset || 0;
      document.body.classList.toggle('hm-scrolled', y > 40);
      btn.classList.toggle('is-visible', y > 600);
      ticking = false;
    };

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    }, { passive: true });
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initScrollEnhancements, { timeout: 1500 });
  } else {
    setTimeout(initScrollEnhancements, 300);
  }

  // 2) Lazy-load images that are below the fold (Elementor already lazy-loads some)
  function initLazyImages() {
    var imgs = document.querySelectorAll('img:not([loading])');
    var wh = window.innerHeight || 800;
    imgs.forEach(function (img) {
      var r = img.getBoundingClientRect();
      if (r.top > wh * 1.2) img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initLazyImages, { timeout: 2000 });
  } else {
    setTimeout(initLazyImages, 100);
  }

  // 3) External links open safely in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.host !== window.location.host) {
      a.setAttribute('rel', (a.getAttribute('rel') || '') + ' noopener noreferrer');
    }
  });

  // 4) Mobile Navigation Drawer & White Logo Sync (Screens <= 1203px)
  function syncMobileLogo() {
    if (document.body.classList.contains('home')) return;
    var isMobile = window.innerWidth <= 1203;
    document.querySelectorAll('body:not(.home) .elementor-section:has(#mega-menu-wrap-max_mega_menu_1) img').forEach(function (img) {
      if (isMobile) {
        if (!img.dataset.origSrc && img.src && !img.src.includes('Footer-Logo-HearMaXXsMALL')) {
          img.dataset.origSrc = img.src;
          img.dataset.origSrcset = img.getAttribute('srcset') || '';
        }
        if (img.src && !img.src.includes('Footer-Logo-HearMaXXsMALL')) {
          img.src = '/wp-content/uploads/2025/03/Footer-Logo-HearMaXXsMALL.png';
          img.removeAttribute('srcset');
        }
      } else if (img.dataset.origSrc) {
        img.src = img.dataset.origSrc;
        if (img.dataset.origSrcset) {
          img.setAttribute('srcset', img.dataset.origSrcset);
        }
      }
    });
  }

  if (!document.body.classList.contains('home')) {
    syncMobileLogo();
  }

  function initMobileDrawer() {
    function handleResize() {
      syncMobileLogo();
      if (window.innerWidth > 1203 && document.body.classList.contains('hm-drawer-open')) {
        toggleDrawer(false);
      }
    }
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    function toggleDrawer(open) {
      var willOpen = open !== undefined ? open : !document.body.classList.contains('hm-drawer-open');
      document.body.classList.toggle('hm-drawer-open', willOpen);
      document.querySelectorAll('.mega-menu-wrap').forEach(function (w) {
        w.classList.toggle('mega-menu-open', willOpen);
        var btn = w.querySelector('.mega-menu-toggle button');
        if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    }

    // Ensure a dedicated backdrop element exists in the DOM
    var backdrop = document.querySelector('.hm-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'hm-drawer-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    backdrop.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDrawer(false);
    });

    // Ensure a clean close button is embedded in the top-right of each drawer
    document.querySelectorAll('#mega-menu-max_mega_menu_1, #mega-menu-max_mega_menu_2').forEach(function (menu) {
      if (!menu.querySelector('.hm-drawer-close')) {
        var closeBtn = document.createElement('button');
        closeBtn.className = 'hm-drawer-close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close menu');
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggleDrawer(false);
        });
        menu.prepend(closeBtn);
      }
    });

    // Primary mobile drawer event delegation
    document.addEventListener('click', function (e) {
      if (window.innerWidth > 1203) return;

      // 1. Toggle hamburger button click
      var toggle = e.target.closest('.mega-menu-toggle button, .mega-menu-toggle');
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        toggleDrawer();
        return;
      }

      // 2. Explicit close button click
      var closeBtn = e.target.closest('.hm-drawer-close, button.mega-close, .mega-close');
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        toggleDrawer(false);
        return;
      }

      // 3. Top-level parent category accordion toggle (e.g. "Hearing Health")
      var parentLink = e.target.closest(
        '#mega-menu-max_mega_menu_1 > li.mega-menu-item-has-children > a.mega-menu-link, ' +
        '#mega-menu-max_mega_menu_2 > li.mega-menu-item-has-children > a.mega-menu-link'
      );
      if (parentLink) {
        var parentLi = parentLink.closest('li.mega-menu-item-has-children');
        if (parentLi) {
          e.preventDefault();
          e.stopPropagation();
          parentLi.classList.toggle('mega-toggle-on');
          var isExpanded = parentLi.classList.contains('mega-toggle-on');
          parentLink.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          return;
        }
      }

      // 4. Any navigation link inside drawer: close drawer and let navigation proceed
      var navLink = e.target.closest(
        '#mega-menu-max_mega_menu_1 a[href], ' +
        '#mega-menu-max_mega_menu_2 a[href]'
      );
      if (navLink && navLink.getAttribute('href') && !navLink.getAttribute('href').startsWith('#')) {
        toggleDrawer(false);
        return;
      }

      // 5. Click outside drawer while open: close drawer
      if (document.body.classList.contains('hm-drawer-open')) {
        var inDrawer = e.target.closest('#mega-menu-max_mega_menu_1, #mega-menu-max_mega_menu_2');
        if (!inDrawer) {
          e.preventDefault();
          e.stopPropagation();
          toggleDrawer(false);
        }
      }
    }, true);

    // Close on Escape key press
    function onKeyDown(e) {
      if ((e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) && document.body.classList.contains('hm-drawer-open')) {
        toggleDrawer(false);
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keydown', onKeyDown, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileDrawer);
  } else {
    initMobileDrawer();
  }
})();

