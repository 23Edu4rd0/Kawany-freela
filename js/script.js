const CONFIG = {
  startDate: "2026-08-17",
  typewriterSpeed: 28,
};

// ─── MÍDIA DA GALERIA ────────────────────────────────────────────────────────
// Para adicionar uma foto: coloque o arquivo em assets/photos/ e some uma linha.
// Para adicionar um vídeo: coloque o arquivo em assets/videos/ e use
//   { type: "video", src: "assets/videos/nome.mp4", poster: "assets/photos/capa.jpeg", caption: "..." }
// O campo "poster" é opcional (é a imagem de capa do vídeo).
const GALLERY_MEDIA = [
  { type: "image", src: "assets/photos/foto1.jpeg", caption: "Seu jeitinho doce 🤎" },
  { type: "video", src: "assets/videos/video1.mp4", caption: "Você faz tudo ficar mais leve" },
  { type: "image", src: "assets/photos/foto2.jpeg", caption: "Guardo esse sorriso" },
  { type: "video", src: "assets/videos/video2.mp4", caption: "Sua alegria contagia todo mundo" },
  { type: "image", src: "assets/photos/foto3.jpeg", caption: "Você ilumina qualquer lugar" },
  { type: "video", src: "assets/videos/video3.mp4", caption: "Nunca duvide de você" },
  { type: "image", src: "assets/photos/foto4.jpeg", caption: "Meiga do jeitinho que só você é" },
  { type: "video", src: "assets/videos/video4.mp4", caption: "Você merece o mundo inteiro" },
  { type: "image", src: "assets/photos/foto5.jpeg", caption: "Eu te amo 🤎" },
  { type: "video", src: "assets/videos/video5.mp4", caption: "Estou aqui, sempre" },
  { type: "image", src: "assets/photos/foto6.jpeg", caption: "Sua força me inspira" },
  { type: "video", src: "assets/videos/video6.mp4", caption: "Você não está sozinha" },
  { type: "image", src: "assets/photos/foto7.jpeg", caption: "Continua sendo você" },
  { type: "video", src: "assets/videos/video7.mp4", caption: "Tudo vai ficar bem, prometo" },
  { type: "video", src: "assets/videos/video8.mp4", caption: "Seu coração é enorme" },
  { type: "video", src: "assets/videos/video9.mp4", caption: "Obrigado por existir" },
  { type: "video", src: "assets/videos/video10.mp4", caption: "Você é insubstituível 🤎" },
];

let globalRevealObserver = null;
let isGalleryInitialized = false;
let galleryImgs = [];
let currentGalleryIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initCounter();
  renderGalleryMedia();
  initScrollReveal();
  initGallery();
  initTypewriter();
  initNextAnniversary();
  loadAdminItems();
  // Ambos rodam em paralelo — initIntro NÃO espera a música
  initMusicPlayer();
  initIntro();
});

// ─── INTRO ───────────────────────────────────────────────────────────────────

function initIntro() {
  const cover = document.getElementById("intro-cover");
  const openBtn = document.getElementById("open-btn");
  const main = document.getElementById("main-content");

  if (!cover || !openBtn || !main) return;

  openBtn.addEventListener("click", openSite);
  cover.addEventListener("click", (e) => {
    if (e.target !== openBtn && !openBtn.contains(e.target)) openSite();
  });

  function openSite() {
    if (
      cover.classList.contains("is-leaving") ||
      cover.classList.contains("is-opening-envelope")
    )
      return;

    cover.classList.add("is-opening-envelope");
    const envelope = cover.querySelector(".intro-envelope");
    if (envelope) envelope.classList.add("is-opening");

    main.removeAttribute("inert");

    // Se a música já carregou, toca agora (dentro do gesto = autoplay ok).
    // Se ainda não carregou, sinaliza pra tocar assim que estiver pronta.
    if (typeof window.__startMusic === "function") {
      window.__startMusic();
    } else {
      window.__pendingPlay = true;
    }

    const musicPlayer = document.getElementById("music-player");
    if (musicPlayer)
      setTimeout(() => musicPlayer.classList.add("is-ready"), 2200);

    setTimeout(() => {
      cover.classList.add("is-leaving");
      cover.addEventListener("transitionend", () => cover.remove(), {
        once: true,
      });
    }, 2200);
  }
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────

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
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="${color}" style="width:100%;height:100%;display:block;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

    const maxSz = isMobile ? 0.9 : 1.4;
    const minSz = isMobile ? 0.5 : 0.6;
    const size = (Math.random() * (maxSz - minSz) + minSz).toFixed(2);
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

// ─── COUNTER ─────────────────────────────────────────────────────────────────

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
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
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

// ─── SCROLL REVEAL ───────────────────────────────────────────────────────────

function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".reveal-fade,.reveal-up,.reveal-left,.reveal-right",
  );
  if (!targets.length) return;

  document.querySelectorAll(".gallery__item").forEach((item, i) => {
    item.style.setProperty("--delay", `${Math.min(i, 8) * 0.045}s`);
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
    { rootMargin: "0px 0px 15% 0px", threshold: 0 },
  );

  targets.forEach((el) => globalRevealObserver.observe(el));
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────

// Monta o HTML de um item da galeria (foto ou vídeo)
function galleryItemHTML({ type, src, poster, caption, alt }) {
  const cap = escapeHtml(caption || "");
  const label = cap || "mídia";
  const media =
    type === "video"
      ? `<video
            class="gallery__media gallery__video"
            src="${src}"
            data-src="${src}"
            data-type="video"
            data-caption="${cap}"
            ${poster ? `poster="${poster}"` : ""}
            muted
            playsinline
            preload="metadata"
          ></video>
          <span class="gallery__play" aria-hidden="true">▶</span>`
      : `<img
            class="gallery__media gallery__img"
            src="${src}"
            data-src="${src}"
            data-type="image"
            data-caption="${cap}"
            alt="${escapeHtml(alt || caption || "Kawany")}"
            loading="lazy"
          />`;

  return `<figure class="gallery__item reveal-fade" role="listitem">
      <button class="gallery__btn" aria-label="Abrir ${escapeHtml(label)} em tamanho completo">
        ${media}
      </button>
    </figure>`;
}

// Renderiza a galeria a partir de GALLERY_MEDIA
function renderGalleryMedia() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = GALLERY_MEDIA.map(galleryItemHTML).join("");
}

function initGallery() {
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbVideo = document.getElementById("lb-video");
  const lbCaption = document.getElementById("lb-caption");
  const lbPrev = document.getElementById("lb-prev");
  const lbNext = document.getElementById("lb-next");
  const lbClose = document.getElementById("lb-close");

  if (!lightbox) return;

  galleryImgs = Array.from(document.querySelectorAll(".gallery__media")).map(
    (el) => ({
      src: el.dataset.src || el.getAttribute("src"),
      type: el.dataset.type === "video" ? "video" : "image",
      poster: el.getAttribute("poster") || "",
      alt: el.alt || "",
      caption: el.dataset.caption || "",
    }),
  );

  if (isGalleryInitialized) return;
  isGalleryInitialized = true;

  function openLightbox(index) {
    currentGalleryIndex = index;
    showImage(currentGalleryIndex);
    lightbox.showModal();
  }

  function showImage(index) {
    currentGalleryIndex =
      ((index % galleryImgs.length) + galleryImgs.length) % galleryImgs.length;
    const data = galleryImgs[currentGalleryIndex];

    const isVideo = data.type === "video";
    const active = isVideo ? lbVideo : lbImg;
    const inactive = isVideo ? lbImg : lbVideo;

    // Pausa/limpa o que estava em cena antes de trocar
    if (lbVideo) {
      lbVideo.pause();
      if (!isVideo) lbVideo.removeAttribute("src");
    }

    if (inactive) inactive.hidden = true;
    if (!active) return;
    active.hidden = false;

    active.style.opacity = "0";
    active.style.transform = "scale(0.97)";

    setTimeout(() => {
      active.src = data.src;
      if (isVideo) {
        if (data.poster) active.setAttribute("poster", data.poster);
        else active.removeAttribute("poster");
        active.load();
      } else {
        active.alt = data.alt;
      }
      lbCaption.textContent = data.caption;
      active.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      active.style.opacity = "1";
      active.style.transform = "scale(1)";
    }, 150);

    lightbox.setAttribute(
      "aria-label",
      `${isVideo ? "Vídeo" : "Foto"} ${currentGalleryIndex + 1} de ${galleryImgs.length}`,
    );
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery__btn");
    if (btn) {
      const idx = Array.from(
        document.querySelectorAll(".gallery__btn"),
      ).indexOf(btn);
      if (idx !== -1) openLightbox(idx);
    }
  });

  lbPrev?.addEventListener("click", () => showImage(currentGalleryIndex - 1));
  lbNext?.addEventListener("click", () => showImage(currentGalleryIndex + 1));
  lbClose?.addEventListener("click", () => lightbox.close());

  // Ao fechar, para o vídeo pra não continuar tocando em segundo plano
  lightbox.addEventListener("close", () => lbVideo?.pause());

  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showImage(currentGalleryIndex - 1);
    if (e.key === "ArrowRight") showImage(currentGalleryIndex + 1);
  });

  lightbox.addEventListener("click", (e) => {
    const r = lightbox.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      lightbox.close();
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
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50)
        dx < 0
          ? showImage(currentGalleryIndex + 1)
          : showImage(currentGalleryIndex - 1);
    },
    { passive: true },
  );
}

// ─── TYPEWRITER ──────────────────────────────────────────────────────────────

function initTypewriter() {
  const letterEl = document.getElementById("letter-text");
  const paperEl = document.getElementById("love-letter-paper");
  const openBtn = document.getElementById("letter-open-btn");
  const coverEl = document.getElementById("letter-cover");

  if (!letterEl || !paperEl || !openBtn) return;

  const fullText = letterEl.innerHTML
    .split(/<br\s*\/?>/i)
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .join("<br>")
    .trim();

  letterEl.innerHTML = "";
  let started = false;

  function openLetter() {
    if (started) return;
    started = true;
    paperEl.classList.remove("letter__paper--closed");
    paperEl.classList.add("letter__paper--open");
    setTimeout(() => {
      if (coverEl) coverEl.style.display = "none";
      typeNextChar(0);
    }, 600);
  }

  openBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openLetter();
  });
  paperEl.addEventListener("click", () => {
    if (paperEl.classList.contains("letter__paper--closed")) openLetter();
  });
  openBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLetter();
    }
  });

  function typeNextChar(index) {
    if (index === 0) letterEl.classList.add("is-typing");

    if (index >= fullText.length) {
      letterEl.classList.remove("is-typing");
      letterEl.classList.add("is-done");
      return;
    }

    if (fullText.substring(index, index + 4) === "<br>") {
      letterEl.innerHTML += "<br>";
      setTimeout(() => typeNextChar(index + 4), CONFIG.typewriterSpeed * 3);
      return;
    }

    letterEl.innerHTML += fullText[index];
    const pause = /[.,!?;:]/.test(fullText[index])
      ? CONFIG.typewriterSpeed * 4
      : CONFIG.typewriterSpeed;
    setTimeout(() => typeNextChar(index + 1), pause);
  }
}

// ─── NEXT ANNIVERSARY ────────────────────────────────────────────────────────

function initNextAnniversary() {
  const el = document.getElementById("next-anniversary-counter");
  if (!el) return;

  const [, m, d] = CONFIG.startDate.split("-").map(Number);

  function computeNext() {
    const now = new Date();
    let next = new Date(now.getFullYear(), m - 1, d, 12, 0, 0);
    if (next <= now) next = new Date(now.getFullYear() + 1, m - 1, d, 12, 0, 0);

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

// ─── ADMIN ITEMS ─────────────────────────────────────────────────────────────

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
  } catch {
    const raw = localStorage.getItem("kawany_admin_items");
    if (raw) items = JSON.parse(raw);
  }

  if (!items?.length) return;

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
            !item.imageBase64
              ? `<div class="timeline__photo-placeholder">📷</div>`
              : item.mediaType === "video"
                ? `<video src="${item.imageBase64}" class="timeline__photo" controls playsinline preload="metadata"></video>`
                : `<img src="${item.imageBase64}" alt="${escapeHtml(item.title)}" class="timeline__photo" loading="lazy" />`
          }
        </div>
        <div class="timeline__content">
          <time class="timeline__date">${escapeHtml(item.date || "")}</time>
          <h3 class="timeline__title">${escapeHtml(item.title)}</h3>
          <p class="timeline__caption">${escapeHtml(item.description)}</p>
        </div>`;
      timelineTrack.appendChild(article);
      globalRevealObserver?.observe(article);
    }

    if (isGallery && galleryGrid && item.imageBase64) {
      const wrap = document.createElement("div");
      wrap.innerHTML = galleryItemHTML({
        type: item.mediaType === "video" ? "video" : "image",
        src: item.imageBase64,
        poster: item.posterBase64 || "",
        caption: item.description || item.title,
        alt: item.title,
      });
      const figure = wrap.firstElementChild;
      galleryGrid.appendChild(figure);
      globalRevealObserver?.observe(figure);
    }
  });

  initGallery();
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
