const CONFIG = {
  startDate: "2025-07-19",
  typewriterSpeed: 28,
  musicSrc: "assets/music/Um_Amor_Puro.mp3",
};

let globalRevealObserver = null;
let isGalleryInitialized = false;
let galleryImgs = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  initIntro();
  initParticles();
  initCounter();
  initScrollReveal();
  initGallery();
  initTypewriter();
  initMusicPlayer();
  initNextAnniversary();
  loadAdminItems();
});

function initIntro() {
  const cover = document.getElementById("intro-cover");
  const openBtn = document.getElementById("open-btn");
  const main = document.getElementById("main-content");

  if (!cover || !openBtn || !main) return;

  openBtn.addEventListener("click", openSite);

  cover.addEventListener("click", (e) => {
    if (e.target !== openBtn && !openBtn.contains(e.target)) {
      openSite();
    }
  });

  function openSite() {
    if (
      cover.classList.contains("is-leaving") ||
      cover.classList.contains("is-opening-envelope")
    )
      return;

    cover.classList.add("is-opening-envelope");
    const envelope = cover.querySelector(".intro-envelope");
    if (envelope) {
      envelope.classList.add("is-opening");
    }

    main.removeAttribute("inert");

    const audio = document.getElementById("bg-audio");
    const musicBtn = document.getElementById("music-btn");
    if (audio && musicBtn) {
      audio.load();
      audio
        .play()
        .then(() => {
          musicBtn.setAttribute("aria-pressed", "true");
          musicBtn.setAttribute("aria-label", "Pausar música de fundo");
        })
        .catch(() => {
          console.info(
            "Autoplay bloqueado pelo navegador — use o botão de música.",
          );
        });
    }

    const musicPlayer = document.getElementById("music-player");
    if (musicPlayer) {
      setTimeout(() => musicPlayer.classList.add("is-ready"), 2200);
    }

    setTimeout(() => {
      cover.classList.add("is-leaving");
      cover.addEventListener("transitionend", () => cover.remove(), {
        once: true,
      });
    }, 2200);
  }
}

function initParticles() {
  const container = document.getElementById("hero-particles");
  if (!container) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const count = isMobile ? 8 : 20;
  const colors = ["#54382F", "#4D126B", "#700F0F"];

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.className = "particle";
    span.setAttribute("aria-hidden", "true");

    const color = colors[Math.floor(Math.random() * colors.length)];
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="${color}" style="width: 100%; height: 100%; display: block;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    const maxSize = isMobile ? 0.9 : 1.4;
    const minSize = isMobile ? 0.5 : 0.6;
    const size = (Math.random() * (maxSize - minSize) + minSize).toFixed(2);
    const left = (Math.random() * 90).toFixed(1);
    const delay = (Math.random() * 6).toFixed(2);
    const durMin = isMobile ? 6 : 7;
    const durMax = isMobile ? 10 : 13;
    const dur = (Math.random() * (durMax - durMin) + durMin).toFixed(2);

    span.style.setProperty("--sz", `${size}rem`);
    span.style.setProperty("--delay", `${delay}s`);
    span.style.setProperty("--dur", `${dur}s`);
    span.style.left = `${left}%`;
    span.style.bottom = `${Math.random() * 20}%`;

    container.appendChild(span);
  }
}

function initCounter() {
  const [y, m, d] = CONFIG.startDate.split("-").map(Number);
  const startMs = new Date(y, m - 1, d, 12, 0, 0).getTime();

  const els = {
    years: document.getElementById("cnt-years"),
    months: document.getElementById("cnt-months"),
    days: document.getElementById("cnt-days"),
    hours: document.getElementById("cnt-hours"),
    mins: document.getElementById("cnt-mins"),
    secs: document.getElementById("cnt-secs"),
  };

  if (!Object.values(els).every(Boolean)) return;

  function tick() {
    const now = new Date();
    const startDate = new Date(startMs);

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      months += 12;
      years--;
    }

    const lastAnniversary = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
    );

    let diffMs = now - lastAnniversary;

    if (diffMs < 0) {
      const yesterday = new Date(lastAnniversary);
      yesterday.setDate(yesterday.getDate() - 1);
      diffMs = now - yesterday;
    }

    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    els.years.textContent = years;
    els.months.textContent = months;
    els.days.textContent = days;
    els.hours.textContent = String(hours).padStart(2, "0");
    els.mins.textContent = String(mins).padStart(2, "0");
    els.secs.textContent = String(secs).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".reveal-fade, .reveal-up, .reveal-left, .reveal-right",
  );

  if (!targets.length) return;

  document.querySelectorAll(".gallery__item").forEach((item, i) => {
    const staggerDelay = Math.min(i, 8) * 0.045;
    item.style.setProperty("--delay", `${staggerDelay}s`);
    item.classList.add("reveal-fade");
  });

  globalRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          globalRevealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px 15% 0px",
      threshold: 0,
    },
  );

  targets.forEach((el) => globalRevealObserver.observe(el));
}

function initGallery() {
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCaption = document.getElementById("lb-caption");
  const lbPrev = document.getElementById("lb-prev");
  const lbNext = document.getElementById("lb-next");
  const lbClose = document.getElementById("lb-close");

  if (!lightbox) return;

  galleryImgs = Array.from(document.querySelectorAll(".gallery__img")).map(
    (img) => ({
      src: img.dataset.src || img.src,
      alt: img.alt || "",
      caption: img.dataset.caption || "",
    }),
  );

  if (isGalleryInitialized) return;
  isGalleryInitialized = true;

  function openLightbox(index) {
    currentIndex = index;
    showImage(currentIndex);
    lightbox.showModal();
  }

  function showImage(index) {
    currentIndex =
      ((index % galleryImgs.length) + galleryImgs.length) %
      galleryImgs.length;
    const data = galleryImgs[currentIndex];

    lbImg.style.opacity = "0";
    lbImg.style.transform = "scale(0.97)";

    setTimeout(() => {
      lbImg.src = data.src;
      lbImg.alt = data.alt;
      lbCaption.textContent = data.caption;
      lbImg.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      lbImg.style.opacity = "1";
      lbImg.style.transform = "scale(1)";
    }, 150);

    lightbox.setAttribute(
      "aria-label",
      `Foto ${currentIndex + 1} de ${galleryImgs.length}`,
    );
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery__btn");
    if (btn) {
      const allBtns = Array.from(document.querySelectorAll(".gallery__btn"));
      const index = allBtns.indexOf(btn);
      if (index !== -1) openLightbox(index);
    }
  });

  lbPrev?.addEventListener("click", () => showImage(currentIndex - 1));
  lbNext?.addEventListener("click", () => showImage(currentIndex + 1));
  lbClose?.addEventListener("click", () => lightbox.close());

  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    if (e.key === "ArrowRight") showImage(currentIndex + 1);
  });

  lightbox.addEventListener("click", (e) => {
    const rect = lightbox.getBoundingClientRect();
    const outsideClick =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (outsideClick) lightbox.close();
  });

  let touchStartX = 0;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 50) {
        deltaX < 0 ? showImage(currentIndex + 1) : showImage(currentIndex - 1);
      }
    },
    { passive: true },
  );
}

function initTypewriter() {
  const letterEl = document.getElementById("letter-text");
  const paperEl = document.getElementById("love-letter-paper");
  const openBtn = document.getElementById("letter-open-btn");
  const coverEl = document.getElementById("letter-cover");

  if (!letterEl || !paperEl || !openBtn) return;

  const fullText = letterEl.innerHTML;
  letterEl.innerHTML = "";

  let started = false;

  function openLetter() {
    if (started) return;
    started = true;

    paperEl.classList.remove("letter__paper--closed");
    paperEl.classList.add("letter__paper--open");

    setTimeout(() => {
      if (coverEl) {
        coverEl.style.display = "none";
      }
      typeNextChar(0);
    }, 600);
  }

  openBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openLetter();
  });

  paperEl.addEventListener("click", () => {
    if (paperEl.classList.contains("letter__paper--closed")) {
      openLetter();
    }
  });

  openBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLetter();
    }
  });

  function typeNextChar(index) {
    if (index === 0) {
      letterEl.classList.add("is-typing");
    }

    if (index >= fullText.length) {
      letterEl.classList.remove("is-typing");
      letterEl.classList.add("is-done");
      return;
    }

    if (fullText.substring(index, index + 4) === "<br>") {
      letterEl.innerHTML += "<br>";
      setTimeout(() => typeNextChar(index + 4), CONFIG.typewriterSpeed * 6);
      return;
    }
    if (fullText.substring(index, index + 5) === "<br/>") {
      letterEl.innerHTML += "<br/>";
      setTimeout(() => typeNextChar(index + 5), CONFIG.typewriterSpeed * 6);
      return;
    }

    letterEl.innerHTML += fullText[index];

    const char = fullText[index];
    const pause = /[.,!?;:\n]/.test(char)
      ? CONFIG.typewriterSpeed * 6
      : CONFIG.typewriterSpeed;

    setTimeout(() => typeNextChar(index + 1), pause);
  }
}

// ─────────────────────────────────────────
// Música de fundo — busca a escolha do admin
// direto do servidor, então vale para TODOS
// os visitantes (não é mais por navegador).
// ─────────────────────────────────────────
async function initMusicPlayer() {
  const btn = document.getElementById("music-btn");
  const audio = document.getElementById("bg-audio");
  const source = audio?.querySelector("source");

  if (!btn || !audio || !source) return;

  let activeFile = "Um_Amor_Puro.mp3";
  try {
    const res = await fetch("/api/moments?action=get-active-music");
    if (res.ok) {
      const data = await res.json();
      if (data.activeFile) activeFile = data.activeFile;
    }
  } catch (e) {
    console.warn(
      "Não foi possível buscar a música definida pelo admin, usando a padrão:",
      e,
    );
  }

  source.setAttribute("src", `assets/music/${activeFile}`);
  audio.load();

  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        btn.setAttribute("aria-pressed", "true");
        btn.setAttribute("aria-label", "Pausar música de fundo");
      } catch (err) {
        console.warn("Playback bloqueado pelo navegador:", err);
      }
    } else {
      audio.pause();
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Tocar música de fundo");
    }
  });

  audio.addEventListener("pause", () => {
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Tocar música de fundo");
  });
}

function initNextAnniversary() {
  const el = document.getElementById("next-anniversary-counter");
  if (!el) return;

  const [y, m, d] = CONFIG.startDate.split("-").map(Number);

  function computeNext() {
    const now = new Date();
    const thisYear = now.getFullYear();

    let next = new Date(thisYear, m - 1, d, 12, 0, 0);
    if (next <= now) {
      next = new Date(thisYear + 1, m - 1, d, 12, 0, 0);
    }

    const diff = next - now;
    const dDays = Math.floor(diff / 86_400_000);
    const dHours = Math.floor((diff % 86_400_000) / 3_600_000);
    const dMins = Math.floor((diff % 3_600_000) / 60_000);

    const parts = [];
    if (dDays > 0) parts.push(`${dDays} dia${dDays !== 1 ? "s" : ""}`);
    if (dHours > 0) parts.push(`${dHours} hora${dHours !== 1 ? "s" : ""}`);
    if (dMins > 0) parts.push(`${dMins} minuto${dMins !== 1 ? "s" : ""}`);

    el.textContent = parts.length ? parts.join(", ") : "Feliz aniversário! 🎉";
  }

  computeNext();
  setInterval(computeNext, 60_000);
}

async function loadAdminItems() {
  let items = [];
  try {
    const res = await fetch("/api/moments");
    if (res.ok) {
      items = await res.json();
    } else {
      const raw = localStorage.getItem("kawany_admin_items");
      if (raw) items = JSON.parse(raw);
    }
  } catch (e) {
    const raw = localStorage.getItem("kawany_admin_items");
    if (raw) items = JSON.parse(raw);
  }

  if (!items || !items.length) return;

  const timelineTrack = document.querySelector(".timeline__track");
  const galleryGrid = document.getElementById("gallery-grid");

  items.forEach((item, i) => {
    const isTimeline =
      item.destination === "timeline" || item.destination === "both";
    const isGallery =
      item.destination === "gallery" || item.destination === "both";

    if (isTimeline && timelineTrack) {
      const isRight = i % 2 === 0;
      const article = document.createElement("article");
      article.className = `timeline__item${isRight ? " timeline__item--right reveal-right" : " reveal-left"}`;
      article.setAttribute("role", "listitem");

      article.innerHTML = `
        <div class="timeline__photo-wrap">
          ${
            item.imageBase64
              ? `<img src="${item.imageBase64}" alt="${escapeHtml(item.title)}" class="timeline__photo" loading="lazy" />`
              : `<div class="timeline__photo-placeholder">📷</div>`
          }
        </div>
        <div class="timeline__content">
          <time class="timeline__date">${escapeHtml(item.date || "")}</time>
          <h3 class="timeline__title">${escapeHtml(item.title)}</h3>
          <p class="timeline__caption">${escapeHtml(item.description)}</p>
        </div>
      `;

      timelineTrack.appendChild(article);

      if (globalRevealObserver) globalRevealObserver.observe(article);
    }

    if (isGallery && galleryGrid && item.imageBase64) {
      const figure = document.createElement("figure");
      figure.className = "gallery__item reveal-fade";
      figure.setAttribute("role", "listitem");

      figure.innerHTML = `
        <button
          class="gallery__btn"
          aria-label="Abrir ${escapeHtml(item.title)} em tamanho completo"
        >
          <img
            src="${item.imageBase64}"
            data-src="${item.imageBase64}"
            data-caption="${escapeHtml(item.description || item.title)}"
            alt="${escapeHtml(item.title)}"
            class="gallery__img"
            loading="lazy"
          />
        </button>
      `;

      galleryGrid.appendChild(figure);
      if (globalRevealObserver) globalRevealObserver.observe(figure);
    }
  });

  initGallery();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}