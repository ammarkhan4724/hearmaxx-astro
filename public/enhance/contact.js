/* Contact form: validation, honeypot, aria status, and submission.
   Destination is set on the <form> with data attributes:
     data-endpoint="https://..."  POST JSON to this URL (preferred)
     data-email="name@domain"     falls back to a mailto: link if no endpoint
   If neither is set, the form validates but reports that it is not connected. */
(function () {
  'use strict';
  var form = document.getElementById('hm-contact-form');
  if (!form) return;

  var status = document.getElementById('hm-form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
    email: function (v) { return !EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : ''; },
    phone: function (v) {
      if (!v.trim()) return '';
      var digits = v.replace(/\D/g, '');
      return (digits.length < 7 || !/^[0-9+()\-.\s]+$/.test(v)) ? 'Please enter a valid phone number, or leave it blank.' : '';
    },
    topic: function (v) { return !v ? 'Please choose a topic.' : ''; },
    message: function (v) { return v.trim().length < 10 ? 'Please write at least 10 characters so we can help.' : ''; },
    consent: function (v, el) { return !el.checked ? 'Please tick the box so we can reply to you.' : ''; }
  };

  function fieldEl(name) { return form.elements.namedItem(name); }
  function errEl(name) { return document.getElementById('hm-' + name + '-err'); }

  function setError(name, msg) {
    var el = fieldEl(name), out = errEl(name);
    if (!el || !out) return;
    out.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }

  function validateField(name) {
    var el = fieldEl(name);
    if (!el || !rules[name]) return true;
    var msg = rules[name](el.type === 'checkbox' ? '' : el.value, el);
    setError(name, msg);
    return !msg;
  }

  function validateAll() {
    var firstBad = null, ok = true;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(name)) {
        ok = false;
        if (!firstBad) firstBad = fieldEl(name);
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = 'hm-form-status' + (kind ? ' is-' + kind : '');
  }

  Object.keys(rules).forEach(function (name) {
    var el = fieldEl(name);
    if (!el) return;
    el.addEventListener('blur', function () { validateField(name); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  function payload() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === 'website') return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else data[el.name] = el.value.trim();
    });
    data.page = window.location.href;
    return data;
  }

  function sendToEndpoint(endpoint, data) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  function openMailto(email, data) {
    var subject = 'Website enquiry: ' + (data.topic || 'General');
    var lines = ['Name: ' + data.name, 'Email: ' + data.email];
    if (data.phone) lines.push('Phone: ' + data.phone);
    lines.push('', data.message);
    var body = lines.join('\n');
    window.location.href = 'mailto:' + encodeURIComponent(email) +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateAll()) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      return;
    }

    // Honeypot: bots fill hidden fields. Pretend success, send nothing.
    var hp = form.elements.namedItem('website');
    if (hp && hp.value) {
      form.reset();
      setStatus('Thank you. We have your message.', 'ok');
      return;
    }

    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    var email = (form.getAttribute('data-email') || '').trim();
    var data = payload();

    if (endpoint) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('', '');
      sendToEndpoint(endpoint, data).then(function () {
        form.reset();
        setStatus('Thank you. Your message has been sent and we will be in touch soon.', 'ok');
      }).catch(function () {
        setStatus('Sorry, we could not send your message. Please try again or call us directly.', 'error');
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      });
      return;
    }

    if (email) {
      openMailto(email, data);
      setStatus('Your email app should open with your message ready to send.', 'ok');
      return;
    }

    setStatus('This form is not connected to an inbox yet. Please call us at +1 (416) 792-8792.', 'error');
  });
})();
