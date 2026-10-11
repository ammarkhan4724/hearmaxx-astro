/* Hear Maxx – High-performance enhancements (zero forced reflows, WCAG accessible) */
(function () {
  'use strict';

  // 1) Header elevation on scroll using rAF to prevent layout thrashing
  var ticking = false;
  var onScroll = function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        document.body.classList.toggle('hm-scrolled', window.scrollY > 40);
        var btn = document.querySelector('.hm-to-top');
        if (btn) btn.classList.toggle('is-visible', window.scrollY > 600);
        ticking = false;
      });
      ticking = true;
    }
  };
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

  // 3) Fix Max Mega Menu invalid ARIA roles on <ul> and duplicate IDs
  var fixAria = function () {
    var menus = document.querySelectorAll('#mega-menu-max_mega_menu_2');
    if (menus.length > 1) {
      for (var k = 1; k < menus.length; k++) {
        menus[k].id = 'mega-menu-max_mega_menu_2-clone-' + k;
      }
    }
    document.querySelectorAll('ul.mega-menu, ul.max-mega-menu').forEach(function (ul) {
      if (ul.getAttribute('role') === 'dialog') ul.removeAttribute('role');
      if (ul.hasAttribute('aria-modal')) ul.removeAttribute('aria-modal');
    });
    // Ensure all logo links have accessible names
    document.querySelectorAll('a[href="/"], a[href="https://hearmaxx.ca/"]').forEach(function (a) {
      if (!a.getAttribute('aria-label') && !a.textContent.trim()) {
        a.setAttribute('aria-label', 'Hear Maxx - Ultimate Hearing Solutions');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixAria);
  } else {
    fixAria();
  }

  // MutationObserver to sanitize dynamic attribute additions from plugins
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes') {
          if (m.target.nodeName === 'UL') {
            if (m.target.getAttribute('role') === 'dialog') m.target.removeAttribute('role');
            if (m.target.hasAttribute('aria-modal')) m.target.removeAttribute('aria-modal');
          }
        } else if (m.type === 'childList') {
          var duplicates = document.querySelectorAll('#mega-menu-max_mega_menu_2');
          if (duplicates.length > 1) {
            for (var d = 1; d < duplicates.length; d++) {
              duplicates[d].id = 'mega-menu-max_mega_menu_2-clone-' + d;
            }
          }
        }
      }
    });
    var menuWrap = document.getElementById('mega-menu-wrap-max_mega_menu_2') || document.body;
    if (menuWrap) observer.observe(menuWrap, { attributes: true, childList: true, subtree: true, attributeFilter: ['role', 'aria-modal'] });
  }

  // 4) External links security
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.host && a.host !== window.location.host) {
      var rel = a.getAttribute('rel') || '';
      if (!rel.includes('noopener')) rel += ' noopener';
      if (!rel.includes('noreferrer')) rel += ' noreferrer';
      a.setAttribute('rel', rel.trim());
    }
  });
})();
