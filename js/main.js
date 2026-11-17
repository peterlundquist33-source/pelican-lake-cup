/* ==========================================================================
   THE PELICAN LAKE CUP — Behaviour
   Vanilla JS. No dependencies, no build step.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Countdown — September 1, 2027, 8:00 AM Central (CDT, UTC-5)
     Kept from the original site; the event is real and still ahead.
     ------------------------------------------------------------------ */
  var TARGET = Date.parse('2027-09-01T13:00:00Z');

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tick() {
    var days = document.getElementById('cd-days');
    if (!days) return;

    var hrs  = document.getElementById('cd-hours');
    var mins = document.getElementById('cd-mins');
    var secs = document.getElementById('cd-secs');
    var note = document.getElementById('cd-note');
    var diff = TARGET - Date.now();

    if (diff <= 0) {
      days.textContent = '0';
      if (hrs)  hrs.textContent  = '00';
      if (mins) mins.textContent = '00';
      if (secs) secs.textContent = '00';
      if (note) note.textContent = 'Championship Weekend is here';
      return true;
    }

    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600);  s -= h * 3600;
    var m = Math.floor(s / 60);    s -= m * 60;

    days.textContent = d;
    if (hrs)  hrs.textContent  = pad(h);
    if (mins) mins.textContent = pad(m);
    if (secs) secs.textContent = pad(s);
    return false;
  }

  if (document.getElementById('cd-days')) {
    if (!tick()) {
      var timer = setInterval(function () {
        if (tick()) clearInterval(timer);
      }, 1000);
    }
  }

  /* ------------------------------------------------------------------
     Masthead — transparent over the hero, solid once you leave it
     ------------------------------------------------------------------ */
  var masthead = document.querySelector('.masthead');

  if (masthead && !masthead.classList.contains('is-static')) {
    var solidAt = 60;
    var queuedNav = false;

    var syncNav = function () {
      masthead.classList.toggle('is-solid', window.scrollY > solidAt);
      queuedNav = false;
    };

    window.addEventListener('scroll', function () {
      if (queuedNav) return;
      queuedNav = true;
      window.requestAnimationFrame(syncNav);
    }, { passive: true });

    syncNav();
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');

  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Active nav link
     ------------------------------------------------------------------ */
  var here = window.location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0];
    if (href && href === here) a.classList.add('is-active');
  });

  /* ------------------------------------------------------------------
     Slow reveals on scroll
     ------------------------------------------------------------------ */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealables, function (el, i) {
      // Stagger siblings so a row of cards arrives in sequence, not as a block.
      var group = el.parentElement;
      var peers = group ? group.querySelectorAll(':scope > [data-reveal]') : null;
      var index = peers ? Array.prototype.indexOf.call(peers, el) : i;
      if (index > 0) el.style.setProperty('--reveal-delay', Math.min(index, 5) * 90 + 'ms');
      revealer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Figures that count up when they come into view
     ------------------------------------------------------------------ */
  function animateFigure(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;

    var decimals = (el.getAttribute('data-decimals') | 0);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    var render = function (value) {
      var n = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
      el.textContent = prefix + n + suffix;
    };

    if (reduced) { render(target); return; }

    var duration = 1400;
    var start = null;

    var step = function (now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast, then a long settle
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      render(target * eased);
      if (p < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }

  var figures = document.querySelectorAll('[data-count]');

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(figures, animateFigure);
  } else {
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateFigure(entry.target);
        counter.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    Array.prototype.forEach.call(figures, function (el) { counter.observe(el); });
  }

  /* ------------------------------------------------------------------
     Hero parallax — a few pixels of drift, nothing more
     ------------------------------------------------------------------ */
  var heroBg = document.querySelector('.hero-bg');

  if (heroBg && !reduced) {
    var queuedHero = false;

    var syncHero = function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        heroBg.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(2) + 'px,0)';
      }
      queuedHero = false;
    };

    window.addEventListener('scroll', function () {
      if (queuedHero) return;
      queuedHero = true;
      window.requestAnimationFrame(syncHero);
    }, { passive: true });
  }
})();
