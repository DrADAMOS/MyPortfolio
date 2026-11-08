/* NINURTA TECH — main.js
   Lenis smooth scroll · GSAP ScrollTrigger · custom interactions
   Everything degrades gracefully: if GSAP or Lenis fails to load,
   reveals fall back to IntersectionObserver and CSS defaults show. */

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST   = typeof window.ScrollTrigger !== 'undefined';

  if (hasGSAP && hasST) gsap.registerPlugin(ScrollTrigger);

  /* 1. LOADER */
  (function loader() {
    const el   = $('#loader');
    const bar  = $('#loaderBar');
    const pct  = $('#loaderPct');
    if (!el) return;

    if (reduced) { el.classList.add('is-done'); return; }

    let p = 0;
    const tick = setInterval(() => {
      p += Math.max(1, (100 - p) * 0.14);
      if (p > 99.4) p = 100;

      bar.style.insetInlineEnd = (100 - p) + '%';
      pct.textContent = Math.round(p);

      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          el.classList.add('is-done');
          heroIntro();
          setTimeout(() => el.remove(), 800);
        }, 220);
      }
    }, 60);
  })();

  /* 2. HERO INTRO */
  function heroIntro() {
    const lines = $$('.hero__title .line__in');
    const rest  = $$('.hero__inner .reveal-fade, .hero__foot .pull, .hero__socials a');

    lines.forEach(l => { l.style.opacity = ''; l.style.transform = ''; });
    rest.forEach(r => { r.style.opacity = ''; r.style.transform = ''; });

    if (!hasGSAP || reduced) {
      lines.forEach(l => l.classList.add('is-in'));
      rest.forEach(r => r.classList.add('is-in'));
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from(lines, {
      yPercent: 108,
      opacity: 0,
      duration: 1.25,
      stagger: 0.1
    })
    .from($$('.hero__tag'), { y: 22, opacity: 0, duration: 0.8 }, 0.15)
    .from($$('.hero__sub'), { y: 26, opacity: 0, duration: 0.9 }, '-=0.75')
    .from($$('.hero__chips li'), { y: 16, opacity: 0, duration: 0.6, stagger: 0.06 }, '-=0.65')
    .from($$('.hero__actions .btn'), { y: 22, opacity: 0, duration: 0.7, stagger: 0.09 }, '-=0.55')
    .from($$('.hero__foot > *'), { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
    .from($$('.hero__socials a'), { scale: 0.7, opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.45');
  }

  /* 3. SMOOTH SCROLL */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduced) {
    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true
    });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.3 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* 4. SCROLL REVEALS */
  const groups = [
    '.hero__inner .reveal-fade',
    '.head .reveal-fade',
    '.services .reveal-fade',
    '.about .reveal-fade',
    '.work__hint',
    '.contact .reveal-fade'
  ];

  if (reduced) {
    $$('.reveal-fade, .reveal-card, .reveal-text').forEach(el => el.classList.add('is-in'));
  } else if (hasGSAP && hasST) {
    groups.forEach(sel => {
      $$(sel).forEach(el => {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
    });

    $$('.reveal-card').forEach((el, i) => {
      gsap.from(el, {
        y: 50, opacity: 0, duration: 1, ease: 'expo.out',
        delay: (i % 6) * 0.07,
        scrollTrigger: { trigger: el.parentElement, start: 'top 84%', once: true }
      });
    });

    $$('.reveal-text').forEach(el => {
      const inner = $$('.line__in', el);
      const targets = inner.length ? inner : [el];
      gsap.from(targets, {
        yPercent: 108, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = (i * 0.08) + 's';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    $$('.reveal-fade, .reveal-card, .reveal-text').forEach(el => io.observe(el));
  }

  /* 5. COUNTERS */
  (function counters() {
    const els = $$('[data-count]');
    if (!els.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      if (reduced) { el.textContent = target; return; }

      const dur = 1500;
      let start = null;
      const step = (ts) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    els.forEach(el => { el.textContent = '0'; io.observe(el); });
  })();

  /* 6. PROJECT SLIDER */
  (function slider() {
    const track = $('#track');
    const viewport = $('#viewport');
    const prev = $('#prev');
    const next = $('#next');
    const idxEl = $('#workIdx');
    const totEl = $('#workTotal');
    if (!track) return;

    const slides = $$('.slide', track);
    if (totEl) totEl.textContent = String(slides.length).padStart(2, '0');

    const pad = (n) => String(n).padStart(2, '0');
    let index = 0;
    let x = 0, targetX = 0;
    let dragging = false, startPointer = 0, startX = 0;

    const stepSize = () => {
      const s = slides[0];
      if (!s) return 0;
      const gap = parseFloat(getComputedStyle(track).columnGap || '22') || 22;
      return s.getBoundingClientRect().width + gap;
    };

    const maxShift = () =>
      Math.max(0, track.scrollWidth - viewport.clientWidth + 4);

    const clamp = (v) => Math.max(-maxShift(), Math.min(0, v));

    const setIndex = (i) => {
      index = Math.max(0, Math.min(slides.length - 1, i));
      targetX = clamp(-index * stepSize());
      if (idxEl) idxEl.textContent = pad(index + 1);
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
    };

    (function loop() {
      x += (targetX - x) * (reduced ? 1 : 0.13);
      if (Math.abs(targetX - x) < 0.05) x = targetX;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    })();

    const go = (dir) => {
      if (dir > 0 && index >= slides.length - 1) setIndex(0);
      else if (dir < 0 && index <= 0) setIndex(slides.length - 1);
      else setIndex(index + dir);
    };

    if (next) next.addEventListener('click', () => go(1));
    if (prev) prev.addEventListener('click', () => go(-1));

    const down = (clientX) => {
      dragging = true;
      startPointer = clientX;
      startX = x;
      track.classList.add('is-dragging');
    };
    const move = (clientX) => {
      if (!dragging) return;
      const dx = clientX - startPointer;
      targetX = clamp(startX + dx);
      x = targetX;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      const moved = Math.abs(targetX - startX);
      if (moved > 8) {
        const step = stepSize() || 1;
        setIndex(Math.round(-targetX / step));
      } else {
        setIndex(index);
      }
    };

    track.addEventListener('pointerdown', (e) => { down(e.clientX); });
    window.addEventListener('pointermove', (e) => move(e.clientX));
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });

    window.addEventListener('resize', () => setIndex(index));
    setIndex(0);
  })();

  /* 7. HORIZONTAL SECTION */
  (function horizontal() {
    const section = $('#why');
    const track = $('#whyTrack');
    const bar = $('#whyBar');
    const idxEl = $('#whyIdx');
    if (!section || !track) return;

    let st = null;

    const build = () => {
      if (st) { st.kill(); st = null; }
      if (reduced) { gsap && gsap.set(track, { x: 0 }); return; }

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);

      st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: '.why__pin',
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (bar) bar.style.width = (self.progress * 100) + '%';
          if (idxEl) {
            const n = Math.min(5, Math.floor(self.progress * 5) + 1);
            idxEl.textContent = String(n).padStart(2, '0');
          }
        }
      });

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    };

    if (hasGSAP && hasST && !reduced) build();
    else {
      track.style.overflowX = 'auto';
      track.style.scrollSnapType = 'x mandatory';
      $$('.why__panel', track).forEach(p => { p.style.scrollSnapAlign = 'start'; });
      track.style.paddingBottom = '12px';
    }

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (hasGSAP && hasST && !reduced) build(); }, 220);
    });
  })();

  /* 8. PARALLAX GLOWS */
  (function parallax() {
    const items = $$('[data-parallax]');
    if (!items.length || !hasGSAP || !hasST || reduced) return;

    items.forEach(el => {
      const depth = parseFloat(el.dataset.parallax) || 0.15;
      gsap.to(el, {
        yPercent: depth * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  })();

  /* 9. CARD TILT + SPOTLIGHT */
  (function tilt() {
    if (reduced || window.matchMedia('(hover:none)').matches) return;

    const bind = (el, max) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;

        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');

        if (hasGSAP) {
          gsap.to(el, {
            rotateX: rx, rotateY: ry,
            transformPerspective: 900,
            duration: 0.5, ease: 'power2.out'
          });
        }
      });

      el.addEventListener('pointerleave', () => {
        if (hasGSAP) gsap.to(el, {
          rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out'
        });
      });
    };

    $$('.card').forEach(el => bind(el, 5));
    $$('.slide').forEach(el => bind(el, 3.5));
  })();

  /* 10. MAGNETIC BUTTONS */
  (function magnetic() {
    if (reduced || !hasGSAP || window.matchMedia('(hover:none)').matches) return;

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(el, {
          x: dx * 0.22, y: dy * 0.32,
          duration: 0.6, ease: 'power3.out'
        });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.5)' });
      });
    });
  })();

  /* 11. CUSTOM CURSOR */
  (function cursor() {
    const dot = $('#cursor');
    if (!dot || reduced || window.matchMedia('(hover:none)').matches) return;

    let mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.classList.add('is-on');
    });
    document.addEventListener('pointerleave', () => dot.classList.remove('is-on'));

    (function loop() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverables = 'a, button, .card, .slide, .poster, [data-magnetic]';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(hoverables)) dot.classList.add('is-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(hoverables)) dot.classList.remove('is-hover');
    });
  })();

  /* 12. HEADER STATE + PROGRESS BAR */
  (function chrome() {
    const header = $('#header');
    const progress = $('#progress');
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;

      if (header) {
        header.classList.toggle('is-stuck', y > 40);
        const goingDown = y > lastY && y > 320;
        header.classList.toggle('is-hidden', goingDown);
      }

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }

      lastY = y;
    };

    if (lenis) lenis.on('scroll', onScroll);
    else window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* 13. MOBILE MENU */
  let closeMenu = () => {};
  (function menu() {
    const burger = $('#burger');
    const panel = $('#menu');
    if (!burger || !panel) return;

    const open = () => {
      panel.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      if (lenis) lenis.stop();
    };

    closeMenu = () => {
      panel.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
    };

    burger.addEventListener('click', () => {
      panel.classList.contains('is-open') ? closeMenu() : open();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  })();

  /* 14. MISC */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  window.addEventListener('load', () => {
    setTimeout(() => { if (hasST) ScrollTrigger.refresh(); }, 120);
  });

})();
