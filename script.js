/**
 * ═══════════════════════════════════════════════════════════════════
 *  ANNIVERSARY SITE — script.js
 *
 *  Sections handled here:
 *    1. Intro / reveal screen
 *    2. Hero: floating particle generator
 *    3. Live couple-together counter
 *    4. Scroll-reveal via IntersectionObserver
 *    5. Photo gallery + vanilla lightbox
 *    6. Love-letter typewriter effect
 *    7. Background music player
 *    8. Footer next-anniversary countdown
 *
 *  Zero external dependencies. Pure vanilla JS (ES2020+).
 *  Comments explain every non-obvious choice for a reader
 *  new to JavaScript coming from Python/backend land.
 * ═══════════════════════════════════════════════════════════════════
 */

/* ──────────────────────────────────────────────────────────────────
   ⚙️ CONFIGURATION — edit these once, they propagate everywhere
────────────────────────────────────────────────────────────────── */
const CONFIG = {
  // ISO date string: when did you start dating?
  // Format: "YYYY-MM-DD" — e.g. "2025-06-18"
  startDate: '2025-07-19',

  // Total number of photos in the gallery
  // (must match the number of <figure> elements in HTML)
  galleryCount: 6,

  // Typewriter speed in milliseconds per character
  typewriterSpeed: 28,

  // Music file path (relative to the HTML file)
  // Leave empty string '' if you have no music file yet
  musicSrc: 'assets/music/background.mp3',
};

/* ──────────────────────────────────────────────────────────────────
   🔧 UTILITY: wait for the DOM to be fully parsed before running
   In JS, scripts at the bottom of <body> run after parsing, but
   this is still best practice to guard against edge cases.
────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initParticles();
  initCounter();
  initScrollReveal();
  initGallery();
  initTypewriter();
  initMusicPlayer();
  initNextAnniversary();
});

/* ═══════════════════════════════════════════════════════════════════
   1. INTRO / REVEAL SCREEN
   ─────────────────────────────────────────────────────────────────
   The intro cover sits on top of everything (z-index: 9999).
   When the user clicks "Abrir", we:
     a) Animate the cover out (CSS class)
     b) Remove the `inert` attribute from <main> so it's accessible
     c) Remove the cover from the DOM after animation ends
════════════════════════════════════════════════════════════════════ */
function initIntro() {
  const cover   = document.getElementById('intro-cover');
  const openBtn = document.getElementById('open-btn');
  const main    = document.getElementById('main-content');

  if (!cover || !openBtn || !main) return;

  openBtn.addEventListener('click', openSite);

  // Also allow tapping anywhere on the cover to open
  cover.addEventListener('click', (e) => {
    // Only trigger if the click wasn't already on the button
    // (avoids double-firing because button click bubbles up to cover)
    if (e.target !== openBtn && !openBtn.contains(e.target)) {
      openSite();
    }
  });

  function openSite() {
    // 1. Start CSS exit animation
    cover.classList.add('is-leaving');

    // 2. Make main content accessible to keyboard and screen readers
    main.removeAttribute('inert');

    // 3. Start music player as ready (after user interaction)
    //    Browsers require a user gesture before audio can play.
    //    We mark the player visible here; actual playback is user-initiated.
    const musicPlayer = document.getElementById('music-player');
    if (musicPlayer) {
      // Small delay so it appears after the cover leaves
      setTimeout(() => musicPlayer.classList.add('is-ready'), 1000);
    }

    // 4. Remove cover from DOM once animation finishes (~800ms)
    //    `transitionend` fires when the CSS transition completes
    cover.addEventListener('transitionend', () => cover.remove(), { once: true });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   2. HERO PARTICLES
   ─────────────────────────────────────────────────────────────────
   Creates floating emoji particles (hearts, leaves) that rise
   from the bottom of the hero section. Pure CSS animations,
   triggered by injecting <span> elements with random properties.
════════════════════════════════════════════════════════════════════ */
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  // The symbols that will float upward
  const symbols = ['🤍', '🤎', '🍂', '🍁', '✨', '🌿', '🌾'];

  // Create 20 particles with randomized positions, sizes, and timing
  for (let i = 0; i < 20; i++) {
    const span = document.createElement('span');
    span.className = 'particle';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    // CSS custom properties let us randomize directly from JS
    // without needing separate JS animation loops (better performance)
    const size    = (Math.random() * 0.8 + 0.6).toFixed(2);   // 0.6–1.4rem
    const left    = (Math.random() * 95).toFixed(1);           // 0–95% horizontal
    const delay   = (Math.random() * 8).toFixed(2);            // 0–8s delay
    const dur     = (Math.random() * 6 + 7).toFixed(2);        // 7–13s duration

    span.style.setProperty('--sz',    `${size}rem`);
    span.style.setProperty('--delay', `${delay}s`);
    span.style.setProperty('--dur',   `${dur}s`);
    span.style.left = `${left}%`;

    container.appendChild(span);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   3. LIVE COUPLE-TOGETHER COUNTER
   ─────────────────────────────────────────────────────────────────
   Calculates the exact time elapsed since startDate and updates
   the counter every second using setInterval.
   Math note: JS Date objects work in milliseconds since Unix epoch.
════════════════════════════════════════════════════════════════════ */
function initCounter() {
  // Parse start date. Using noon UTC avoids timezone edge cases.
  const [y, m, d] = CONFIG.startDate.split('-').map(Number);
  const startMs = new Date(y, m - 1, d, 12, 0, 0).getTime(); // m-1: JS months are 0-indexed

  // Grab all counter display elements
  const els = {
    years:  document.getElementById('cnt-years'),
    months: document.getElementById('cnt-months'),
    days:   document.getElementById('cnt-days'),
    hours:  document.getElementById('cnt-hours'),
    mins:   document.getElementById('cnt-mins'),
    secs:   document.getElementById('cnt-secs'),
  };

  // If any element is missing (e.g., section was deleted), bail out
  if (!Object.values(els).every(Boolean)) return;

  function tick() {
    const now    = Date.now();
    const totalMs = now - startMs;

    if (totalMs < 0) {
      // Start date is in the future — show zeros
      Object.values(els).forEach(el => el.textContent = '00');
      return;
    }

    // ── Calendar-accurate year/month calculation ──────────────────
    // We can't just divide by days-per-year because months vary in length.
    const nowDate   = new Date(now);
    const startDate = new Date(startMs);

    let years  = nowDate.getFullYear() - startDate.getFullYear();
    let months = nowDate.getMonth()    - startDate.getMonth();
    let days   = nowDate.getDate()     - startDate.getDate();

    // Borrow from months if days went negative
    if (days < 0) {
      months--;
      // Days in the previous month
      const prevMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    // Borrow from years if months went negative
    if (months < 0) { months += 12; years--; }

    // ── Hours / minutes / seconds from remaining milliseconds ─────
    // After subtracting full calendar days, what's left in ms?
    const dayStart  = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const startDay  = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    // Total elapsed whole calendar days
    const elapsedDays = Math.floor((dayStart - startDay) / 86_400_000);
    const remaining  = totalMs - (elapsedDays * 86_400_000);

    const hours = Math.floor(remaining / 3_600_000);
    const mins  = Math.floor((remaining % 3_600_000) / 60_000);
    const secs  = Math.floor((remaining % 60_000) / 1_000);

    // ── Update DOM (pad with leading zeros for 2-digit fields) ────
    // `String(n).padStart(2, '0')` ensures "7" becomes "07"
    els.years.textContent  = years;
    els.months.textContent = months;
    els.days.textContent   = days;
    els.hours.textContent  = String(hours).padStart(2, '0');
    els.mins.textContent   = String(mins).padStart(2, '0');
    els.secs.textContent   = String(secs).padStart(2, '0');
  }

  tick();                          // Run immediately on load
  setInterval(tick, 1000);         // Then every second
}

/* ═══════════════════════════════════════════════════════════════════
   4. SCROLL REVEAL via IntersectionObserver
   ─────────────────────────────────────────────────────────────────
   IntersectionObserver fires a callback when elements enter (or leave)
   the viewport. We use it to add the `.is-visible` class, which
   CSS transitions interpret to animate from hidden → visible.

   Why not CSS Scroll-driven animations?
   They're newer (Baseline 2024) and not yet in all mobile browsers.
   IntersectionObserver has near-universal support since 2018.
════════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Select all elements marked for reveal
  const targets = document.querySelectorAll(
    '.reveal-fade, .reveal-up, .reveal-left, .reveal-right'
  );

  if (!targets.length) return;

  // Stagger gallery items so they fade in one by one
  document.querySelectorAll('.gallery__item').forEach((item, i) => {
    item.style.setProperty('--delay', `${i * 0.07}s`);
    item.classList.add('reveal-fade');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stop observing once revealed — no need to watch further
          observer.unobserve(entry.target);
        }
      });
    },
    {
      // `rootMargin` shifts the trigger point:
      // '0px 0px -60px 0px' means the element must be 60px above the bottom edge
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,  // 10% of the element must be visible to trigger
    }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════════════════
   5. PHOTO GALLERY + VANILLA LIGHTBOX
   ─────────────────────────────────────────────────────────────────
   We use the native <dialog> element for the lightbox, which gives
   us correct focus trapping, Esc-key handling, and ::backdrop for free.
   No third-party libraries needed.
════════════════════════════════════════════════════════════════════ */
function initGallery() {
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');
  const lbClose   = document.getElementById('lb-close');

  if (!lightbox) return;

  // Collect all gallery image data from the DOM
  // Each <img> has data-src (full-res) and data-caption attributes
  const galleryImgs = Array.from(
    document.querySelectorAll('.gallery__img')
  ).map((img) => ({
    src:     img.dataset.src  || img.src,
    alt:     img.alt          || '',
    caption: img.dataset.caption || '',
  }));

  let currentIndex = 0;  // which photo is currently open

  // ── Open lightbox ──────────────────────────────────────────────
  function openLightbox(index) {
    currentIndex = index;
    showImage(currentIndex);
    // `showModal()` opens a <dialog> as a true modal with focus trap
    lightbox.showModal();
  }

  // ── Show a specific image by index ─────────────────────────────
  function showImage(index) {
    // Clamp index to valid range (wrap around)
    currentIndex = ((index % galleryImgs.length) + galleryImgs.length) % galleryImgs.length;
    const data   = galleryImgs[currentIndex];

    // Trigger a brief fade-out/in by toggling a class
    lbImg.style.opacity = '0';
    lbImg.style.transform = 'scale(0.97)';

    setTimeout(() => {
      lbImg.src = data.src;
      lbImg.alt = data.alt;
      lbCaption.textContent = data.caption;
      lbImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    }, 150);

    // Update ARIA: tell screen readers which image is shown
    lightbox.setAttribute('aria-label', `Foto ${currentIndex + 1} de ${galleryImgs.length}`);
  }

  // ── Attach click handlers to gallery buttons ────────────────────
  document.querySelectorAll('.gallery__btn').forEach((btn, i) => {
    btn.addEventListener('click', () => openLightbox(i));
  });

  // ── Navigation buttons ──────────────────────────────────────────
  lbPrev?.addEventListener('click', () => showImage(currentIndex - 1));
  lbNext?.addEventListener('click', () => showImage(currentIndex + 1));

  // ── Close button ────────────────────────────────────────────────
  lbClose?.addEventListener('click', () => lightbox.close());

  // ── Keyboard navigation ─────────────────────────────────────────
  // Arrow Left/Right to navigate, Esc is handled natively by <dialog>
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });

  // ── Click outside (on ::backdrop) to close ─────────────────────
  // The dialog's `click` event fires on the backdrop when clicking outside.
  // We detect this by checking if the click target is the dialog itself
  // (not a child element inside it).
  lightbox.addEventListener('click', (e) => {
    const rect = lightbox.getBoundingClientRect();
    const outsideClick =
      e.clientX < rect.left   ||
      e.clientX > rect.right  ||
      e.clientY < rect.top    ||
      e.clientY > rect.bottom;
    if (outsideClick) lightbox.close();
  });

  // ── Touch/swipe navigation ──────────────────────────────────────
  // Tracks touch start position to determine swipe direction
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {               // 50px threshold for a swipe
      deltaX < 0 ? showImage(currentIndex + 1) : showImage(currentIndex - 1);
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════════
   6. LOVE LETTER TYPEWRITER EFFECT
   ─────────────────────────────────────────────────────────────────
   When the letter section enters the viewport (via IntersectionObserver),
   the text is cleared and re-typed character by character.
   We use a recursive `setTimeout` (not `setInterval`) so the delay
   between characters can be varied easily in CONFIG.typewriterSpeed.
════════════════════════════════════════════════════════════════════ */
function initTypewriter() {
  const letterEl = document.getElementById('letter-text');
  if (!letterEl) return;

  const fullText = letterEl.textContent;  // store the original text
  letterEl.textContent = '';              // clear it so it starts empty

  let started = false;  // prevent the animation from firing twice

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !started) {
        started = true;
        observer.disconnect();  // no need to keep watching
        typeNextChar(0);
      }
    },
    { threshold: 0.4 }   // start when 40% of the element is visible
  );

  observer.observe(letterEl);

  function typeNextChar(index) {
    if (index === 0) {
      // Add blinking cursor at the start
      letterEl.classList.add('is-typing');
    }

    if (index >= fullText.length) {
      // All characters typed — stop the cursor
      letterEl.classList.remove('is-typing');
      letterEl.classList.add('is-done');
      return;
    }

    // Append the next character
    letterEl.textContent += fullText[index];

    // Vary speed slightly for a more natural feel:
    // punctuation and spaces get a longer pause
    const char  = fullText[index];
    const pause = /[.,!?;:\n]/.test(char)
      ? CONFIG.typewriterSpeed * 6     // pause at punctuation
      : CONFIG.typewriterSpeed;

    // `setTimeout(fn, delay)` — schedule the next character
    setTimeout(() => typeNextChar(index + 1), pause);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   7. BACKGROUND MUSIC PLAYER
   ─────────────────────────────────────────────────────────────────
   Browser policy: audio cannot play without a prior user gesture.
   We handle this by:
     • NOT attempting autoplay
     • Showing the play button only after the intro is dismissed
     • Toggling play/pause on button click with full ARIA state

   If the audio file is missing or fails to load, the button is hidden.
════════════════════════════════════════════════════════════════════ */
function initMusicPlayer() {
  const btn   = document.getElementById('music-btn');
  const audio = document.getElementById('bg-audio');

  if (!btn || !audio) return;

  // Set the audio source from config (overrides the HTML src for convenience)
  if (CONFIG.musicSrc) {
    audio.querySelector('source')?.setAttribute('src', CONFIG.musicSrc);
  }

  // Hide the player if the audio file fails to load
  audio.addEventListener('error', () => {
    const player = document.getElementById('music-player');
    if (player) player.style.display = 'none';
  });

  btn.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        // `audio.play()` returns a Promise — we must await it
        // to catch the NotAllowedError if autoplay is blocked
        await audio.play();
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Pausar música de fundo');
      } catch (err) {
        // If the browser blocks playback, log it and do nothing
        console.warn('Playback blocked:', err);
      }
    } else {
      audio.pause();
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Tocar música de fundo');
    }
  });

  // Sync button state if audio stops unexpectedly (e.g., network error)
  audio.addEventListener('pause', () => {
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Tocar música de fundo');
  });
}

/* ═══════════════════════════════════════════════════════════════════
   8. FOOTER — NEXT ANNIVERSARY COUNTDOWN
   ─────────────────────────────────────────────────────────────────
   Calculates time until the next anniversary of the start date,
   then updates every minute (no need for per-second precision here).
════════════════════════════════════════════════════════════════════ */
function initNextAnniversary() {
  const el = document.getElementById('next-anniversary-counter');
  if (!el) return;

  const [y, m, d] = CONFIG.startDate.split('-').map(Number);

  function computeNext() {
    const now        = new Date();
    const thisYear   = now.getFullYear();

    // Try this year's anniversary first
    let next = new Date(thisYear, m - 1, d, 12, 0, 0);
    if (next <= now) {
      // This year's has already passed — use next year
      next = new Date(thisYear + 1, m - 1, d, 12, 0, 0);
    }

    const diff   = next - now;
    const dDays  = Math.floor(diff / 86_400_000);
    const dHours = Math.floor((diff % 86_400_000) / 3_600_000);
    const dMins  = Math.floor((diff % 3_600_000)  / 60_000);

    // Build a human-readable string
    const parts = [];
    if (dDays  > 0) parts.push(`${dDays} dia${dDays  !== 1 ? 's' : ''}`);
    if (dHours > 0) parts.push(`${dHours} hora${dHours !== 1 ? 's' : ''}`);
    if (dMins  > 0) parts.push(`${dMins} minuto${dMins !== 1 ? 's' : ''}`);

    el.textContent = parts.length ? parts.join(', ') : 'Feliz aniversário! 🎉';
  }

  computeNext();
  setInterval(computeNext, 60_000);  // update every minute
}
