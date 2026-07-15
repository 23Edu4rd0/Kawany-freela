// music.js
//
// ESTRATÉGIA PARA AUTOPLAY:
//   O browser só permite audio.play() dentro da janela de gesto do usuário
//   (alguns ms após o clique). Qualquer await antes disso invalida a janela.
//
//   Solução: window.__startMusic é definida de forma SÍNCRONA no
//   DOMContentLoaded (sem await nenhum antes). A playlist é carregada em
//   paralelo e, quando chega, apenas atualiza o src da faixa ativa.
//   Se o usuário clicar antes da playlist chegar, toca a faixa já definida
//   no fallback (src já setado no HTML ou via fallback imediato).

const FALLBACK_PLAYLIST = [
  "so-voce-tim-maia.mp3",
  "01-eu-te-darei-o-ceu.mp3",
  "SALA-DE-REBOCO.mp3",
];

function initMusicPlayer() {
  const playerWrapper = document.getElementById("music-player");
  const mainBtn = document.getElementById("music-btn");
  const audio = document.getElementById("bg-audio");
  const source = audio?.querySelector("source");
  const trackNameEl = document.getElementById("music-track-name");
  const btnPrev = document.getElementById("music-prev");
  const btnPlayPause = document.getElementById("music-playpause");
  const btnNext = document.getElementById("music-next");
  const btnRestart = document.getElementById("music-restart");
  const progressBar = document.getElementById("music-progress-bar");
  const progressFilled = document.getElementById("music-progress-filled");
  const timeCurrent = document.getElementById("music-time-current");
  const timeTotal = document.getElementById("music-time-total");

  if (!playerWrapper || !mainBtn || !audio || !source) return;

  let playlist = [...FALLBACK_PLAYLIST];
  let songIndex = 0;

  const SVG_PLAY = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  const SVG_PAUSE = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

  function normalize(str) {
    return (str || "").normalize("NFC");
  }

  function formatTime(s) {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  function syncIcons() {
    const playing = !audio.paused;
    if (btnPlayPause) btnPlayPause.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
    mainBtn.setAttribute("aria-pressed", String(playing));
    if (playing) mainBtn.classList.remove("needs-tap");
  }

  function showFallback() {
    mainBtn.classList.add("needs-tap");
    playerWrapper.classList.add("is-ready");
  }

  function doPlay() {
    return audio.play().then(syncIcons).catch(showFallback);
  }

  function setSrc(fileName) {
    const newSrc = `assets/music/${encodeURI(fileName)}`;
    const currentRaw = source.getAttribute("src") || "";
    const currentSrc = currentRaw
      ? `assets/music/${encodeURI(decodeURIComponent(currentRaw.replace(/^assets\/music\//, "")))}`
      : "";

    if (trackNameEl) {
      trackNameEl.textContent = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/_/g, " ");
    }

    if (normalize(currentSrc) === normalize(newSrc)) return false; // já é o mesmo
    source.setAttribute("src", newSrc);
    return true; // src mudou
  }

  function loadSong(index, playAfter = false) {
    if (!playlist[index]) return;
    const changed = setSrc(playlist[index]);
    if (changed) {
      audio.load();
      if (playAfter) audio.addEventListener("canplay", doPlay, { once: true });
    } else {
      if (playAfter) doPlay();
    }
  }

  // ── Define src do fallback IMEDIATAMENTE (síncrono) ──────────────────────
  // Garante que quando __startMusic for chamada no clique, o audio já tem src
  setSrc(playlist[songIndex]);
  audio.load();

  // ── Expõe __startMusic de forma SÍNCRONA — sem await antes disso ─────────
  // initIntro() pode chamar isso imediatamente após DOMContentLoaded
  window.__startMusic = () => doPlay().catch(showFallback);

  // ── Carrega playlist da API em background (não bloqueia nada) ────────────
  (async () => {
    try {
      const resList = await fetch("/api/moments?action=list-music");
      if (!resList.ok) return;
      const apiPlaylist = await resList.json();
      if (!apiPlaylist?.length) return;

      let activeIndex = 0;
      try {
        const resActive = await fetch("/api/moments?action=get-active-music");
        if (resActive.ok) {
          const data = await resActive.json();
          if (data.activeFile) {
            const idx = apiPlaylist.findIndex(
              (f) => normalize(f) === normalize(data.activeFile),
            );
            if (idx !== -1) activeIndex = idx;
          }
        }
      } catch {
        /* ignora */
      }

      playlist = apiPlaylist;
      songIndex = activeIndex;

      // Só atualiza o src se o áudio ainda não estiver tocando
      if (audio.paused) {
        const changed = setSrc(playlist[songIndex]);
        if (changed) audio.load();
      }
    } catch {
      /* API indisponível — permanece no fallback */
    }
  })();

  // ── Eventos do <audio> ────────────────────────────────────────────────────
  audio.addEventListener("play", syncIcons);
  audio.addEventListener("playing", syncIcons);
  audio.addEventListener("pause", syncIcons);
  audio.addEventListener("ended", syncIcons);

  audio.removeAttribute("loop");
  audio.addEventListener("ended", () => {
    songIndex = (songIndex + 1) % playlist.length;
    loadSong(songIndex, true);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFilled) progressFilled.style.width = `${pct}%`;
    if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
    if (timeTotal && timeTotal.textContent === "0:00")
      timeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("error", () => {
    console.error("[music] Falha ao carregar:", source.getAttribute("src"));
  });

  if (progressBar) {
    progressBar.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      audio.currentTime =
        ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  // ── Botão flutuante ───────────────────────────────────────────────────────
  mainBtn.addEventListener("click", () => {
    playerWrapper.classList.toggle("is-open");
    mainBtn.setAttribute(
      "aria-expanded",
      String(playerWrapper.classList.contains("is-open")),
    );
    if (mainBtn.classList.contains("needs-tap")) {
      mainBtn.classList.remove("needs-tap");
      doPlay();
    }
  });

  function togglePlay() {
    if (audio.paused) doPlay();
    else audio.pause();
  }

  btnPlayPause?.addEventListener("click", togglePlay);

  btnNext?.addEventListener("click", () => {
    songIndex = (songIndex + 1) % playlist.length;
    loadSong(songIndex, true);
  });

  btnPrev?.addEventListener("click", () => {
    songIndex = (songIndex - 1 + playlist.length) % playlist.length;
    loadSong(songIndex, true);
  });

  btnRestart?.addEventListener("click", () => {
    audio.currentTime = 0;
    if (audio.paused) doPlay();
  });
}
