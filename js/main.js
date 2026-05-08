/* ================================================================
   ESTETIC CENTER DARLEEN CURIEL — Main JavaScript
   ================================================================ */

'use strict';

/* ─── PRELOADER ─── */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const done = () => {
    preloader.classList.add('done');
    document.getElementById('hero')?.classList.add('loaded');
  };

  if (document.readyState === 'complete') {
    setTimeout(done, 400);
  } else {
    window.addEventListener('load', () => setTimeout(done, 300));
    setTimeout(done, 2200);
  }
})();

/* ─── HEADER SCROLL BEHAVIOR ─── */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastY = 0;
  const threshold = 40;

  const update = () => {
    const y = window.scrollY;
    if (y > threshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastY = y;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ─── MOBILE MENU (slide panel) ─── */
(function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const wrap     = document.getElementById('mobileMenu');
  const backdrop = document.getElementById('mmBackdrop');
  const closeBtn = document.getElementById('mmClose');
  if (!hamburger || !wrap) return;

  const navLinks = wrap.querySelectorAll('.mm-link');
  let isOpen = false;

  const open = () => {
    isOpen = true;
    hamburger.classList.add('open');
    wrap.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    wrap.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // reset animations so links re-animate each open
    navLinks.forEach(link => {
      link.style.animation = 'none';
      link.offsetHeight;
      link.style.animation = '';
    });
    const foot = wrap.querySelector('.mm-foot');
    if (foot) { foot.style.animation = 'none'; foot.offsetHeight; foot.style.animation = ''; }
  };

  const close = () => {
    isOpen = false;
    hamburger.classList.remove('open');
    wrap.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    wrap.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => (isOpen ? close() : open()));
  if (backdrop) backdrop.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  navLinks.forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', e => e.key === 'Escape' && isOpen && close());
})();

/* ─── SMOOTH ANCHOR SCROLL ─── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('header')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ─── SCROLL REVEAL ─── */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

/* ─── HERO PARALLAX ─── */
(function initParallax() {
  const heroBg = document.querySelector('.hero-img');
  if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const update = () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `scale(1.05) translateY(${y * 0.25}px)`;
    }
  };

  window.addEventListener('scroll', update, { passive: true });
})();

/* ─── COUNTER ANIMATION ─── */
(function initCounters() {
  const section = document.querySelector('.section-stats');
  if (!section) return;

  const counters = section.querySelectorAll('.counter');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  let fired = false;

  const runCounter = (el, startDelay) => {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 1800;

    setTimeout(() => {
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(easeOut(progress) * target);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target;
        }
      };
      requestAnimationFrame(tick);
    }, startDelay);
  };

  const observer = new IntersectionObserver((entries) => {
    if (fired) return;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      fired = true;
      observer.disconnect();

      counters.forEach((counter, i) => {
        // Wait for the reveal fade (700ms) + stagger (150ms per counter)
        const stagger = i * 150;
        runCounter(counter, 750 + stagger);
      });
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });

  observer.observe(section);
})();

/* ─── TESTIMONIALS CAROUSEL ─── */
(function initTestimonialsCarousel() {
  const track = document.getElementById('testimonialTrack');
  const prevBtn = document.getElementById('tPrev');
  const nextBtn = document.getElementById('tNext');
  const dotsContainer = document.getElementById('tDots');
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = Array.from(track.querySelectorAll('.tcard'));
  if (!cards.length) return;

  let current = 0;
  let startX = 0;
  let isDragging = false;
  let dragOffset = 0;
  let autoPlayTimer;

  const getVisibleCount = () => {
    if (window.innerWidth < 480) return 1;
    if (window.innerWidth < 900) return 1.5;
    return 3;
  };

  const getCardWidth = () => {
    const visible = Math.floor(getVisibleCount());
    const gap = 24;
    return (track.clientWidth - gap * (visible - 1)) / visible;
  };

  const maxIndex = () => Math.max(0, cards.length - Math.floor(getVisibleCount()));

  const buildDots = () => {
    dotsContainer.innerHTML = '';
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 't-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  };

  const updateDots = () => {
    dotsContainer.querySelectorAll('.t-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  };

  const goTo = (index) => {
    current = Math.max(0, Math.min(index, maxIndex()));
    const cardW = getCardWidth();
    const gap = 24;
    const offset = current * (cardW + gap);
    track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
    restartAutoPlay();
  };

  const autoPlay = () => {
    autoPlayTimer = setTimeout(() => {
      goTo(current >= maxIndex() ? 0 : current + 1);
    }, 5000);
  };

  const restartAutoPlay = () => {
    clearTimeout(autoPlayTimer);
    autoPlay();
  };

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Touch / drag
  const onStart = (x) => {
    isDragging = true;
    startX = x;
    track.style.transition = 'none';
    track.classList.add('dragging');
    clearTimeout(autoPlayTimer);
  };
  const onMove = (x) => {
    if (!isDragging) return;
    dragOffset = x - startX;
    const cardW = getCardWidth();
    const gap = 24;
    const base = current * (cardW + gap);
    track.style.transform = `translateX(${-base + dragOffset}px)`;
  };
  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');
    if (dragOffset < -50) goTo(current + 1);
    else if (dragOffset > 50) goTo(current - 1);
    else goTo(current);
    dragOffset = 0;
  };

  track.addEventListener('mousedown', e => onStart(e.clientX));
  window.addEventListener('mousemove', e => isDragging && onMove(e.clientX));
  window.addEventListener('mouseup', onEnd);
  track.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', onEnd);

  // Init card widths
  const applyWidths = () => {
    const w = getCardWidth();
    cards.forEach(card => {
      card.style.minWidth = `${w}px`;
      card.style.width = `${w}px`;
    });
    goTo(current);
    buildDots();
  };

  applyWidths();
  window.addEventListener('resize', applyWidths);
  autoPlay();
})();

/* ─── GALLERY OVERLAY CURSOR ─── */
(function initGallery() {
  document.querySelectorAll('.g-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9000;background:rgba(28,25,23,.95);
        display:flex;align-items:center;justify-content:center;cursor:zoom-out;
        animation:fadeIn .3s ease;
      `;
      const image = img.cloneNode();
      image.style.cssText = 'max-width:92vw;max-height:90vh;object-fit:contain;border-radius:.75rem;';
      overlay.appendChild(image);
      overlay.addEventListener('click', () => overlay.remove());
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
      });
      document.body.appendChild(overlay);
    });
  });
  const style = document.createElement('style');
  style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);
})();

/* ─── SERVICES TAGS INTERACTION ─── */
(function initServiceTags() {
  document.querySelectorAll('.services-tags span').forEach(tag => {
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', () => {
      const msg = encodeURIComponent(`Hola, me interesa el tratamiento de: ${tag.textContent}`);
      window.open(`https://wa.me/18296321151?text=${msg}`, '_blank', 'noopener');
    });
  });
})();

/* ─── ACTIVE NAV LINK ON SCROLL ─── */
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  const update = () => {
    const y = window.scrollY + 120;
    let active = '';
    sections.forEach(sec => {
      if (y >= sec.offsetTop) active = sec.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href')?.slice(1);
      link.style.color = href === active ? 'var(--c-gold)' : '';
    });
  };

  window.addEventListener('scroll', update, { passive: true });
})();

/* ─── CORP CARD LINK STYLE ─── */
(function initCorpLinks() {
  document.querySelectorAll('.corp-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.gap = '.7rem';
      link.style.color = 'var(--c-black)';
    });
    link.addEventListener('mouseleave', () => {
      link.style.gap = '.4rem';
      link.style.color = 'var(--c-gold)';
    });
  });
})();

/* ─── FAQ ACCORDION ─── */
(function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // close all
      items.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });

      // open clicked (unless it was already open)
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Lazy load images
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img:not([loading])').forEach(img => {
      if (!img.closest('#hero')) img.setAttribute('loading', 'lazy');
    });
  }
});
