/* --- 1. CONFIGURAÇÕES E CONSTANTES --- */
const ADMIN_PASSWORD = "kawany2025";
const STORAGE_KEY = "kawany_admin_items";
const MAX_SIZE = 5 * 1024 * 1024;

/* --- 2. ELEMENTOS DO DOM --- */
const lockScreen = document.getElementById("lock-screen");
const lockForm = document.getElementById("lock-form");
const lockPassword = document.getElementById("lock-password");
const lockError = document.getElementById("lock-error");
const lockSubmit = document.getElementById("lock-submit");
const adminPanel = document.getElementById("admin-panel");
const addForm = document.getElementById("add-form");
const imageInput = document.getElementById("image-input");
const uploadZone = document.getElementById("upload-zone");
const previewImg = document.getElementById("preview-img");
const imagePreview = document.getElementById("image-preview");
const itemTitle = document.getElementById("item-title");
const itemDate = document.getElementById("item-date");
const itemDesc = document.getElementById("item-description");
const formAlert = document.getElementById("form-alert");
const itemsList = document.getElementById("items-list");
const clearAllBtn = document.getElementById("clear-all-btn");
const musicList = document.getElementById("music-list");
const clearMusicBtn = document.getElementById("clear-music-btn");

let currentImageBase64 = "";

/* --- 3. FUNÇÕES UTILITÁRIAS --- */
function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showAlert(msg, type) {
  formAlert.textContent = msg;
  formAlert.className = "alert show alert-" + type;
  setTimeout(() => formAlert.classList.remove("show"), 4000);
}

function getLocalItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveLocalItems(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

/* --- 4. RENDERIZAÇÃO DE MOMENTOS --- */
async function renderList() {
  let items = [];
  try {
    const res = await fetch("/api/moments");
    items = res.ok ? await res.json() : getLocalItems();
  } catch (e) { items = getLocalItems(); }

  itemsList.innerHTML = "";
  if (!items.length) {
    itemsList.innerHTML = '<div class="empty-state">Nenhum momento adicionado ainda.</div>';
    return;
  }

  [...items].reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <div class="item-card__thumb">${item.imageBase64 ? `<img src="${item.imageBase64}" />` : "📷"}</div>
      <div class="item-card__info">
        <div class="item-card__title">${esc(item.title)}</div>
      </div>
      <button class="btn btn-danger" data-id="${item.id}">Excluir</button>
    `;
    div.querySelector(".btn-danger").addEventListener("click", async () => {
      if (confirm("Excluir este momento?")) {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 300);
        await fetch(`/api/moments?id=${item.id}`, { method: "DELETE", headers: { "X-Admin-Password": ADMIN_PASSWORD } });
        renderList();
      }
    });
    itemsList.appendChild(div);
  });
}

/* --- 5. RENDERIZAÇÃO DE MÚSICAS (API AUTOMÁTICA) --- */
async function renderMusicList() {
  musicList.innerHTML = "Carregando músicas...";
  try {
    const response = await fetch('/api/moments?action=list-music');
    const files = await response.json();
    
    musicList.innerHTML = "";
    const activeFile = localStorage.getItem("kawany_active_music_file");

    if (!Array.isArray(files) || files.length === 0) {
      musicList.innerHTML = '<p>Nenhuma música encontrada em assets/music/</p>';
      return;
    }

    files.forEach((file) => {
      const isActive = file === activeFile;
      const div = document.createElement("div");
      div.className = `music-card ${isActive ? "active" : ""}`;
      div.innerHTML = `
        <div class="music-card__info"><div class="music-card__title">${esc(file)}</div></div>
        <button class="btn ${isActive ? 'btn-active' : 'btn-outline'}">
          ${isActive ? "⏸ Ativa" : "▶ Ativar"}
        </button>
      `;
      div.querySelector("button").addEventListener("click", () => {
        localStorage.setItem("kawany_active_music_file", file);
        renderMusicList();
      });
      musicList.appendChild(div);
    });
  } catch (e) {
    musicList.innerHTML = '<p>Erro ao carregar músicas da pasta.</p>';
  }
}

/* --- 6. LÓGICA DE IMAGEM --- */
function handleFile(file) {
  if (file.size > MAX_SIZE) return showAlert("Imagem muito grande.", "error");
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > 1200) { h *= 1200/w; w = 1200; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      currentImageBase64 = canvas.toDataURL("image/jpeg", 0.7);
      previewImg.src = currentImageBase64;
      imagePreview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* --- 7. INICIALIZAÇÃO E EVENTOS --- */
function unlock() {
  lockScreen.style.display = "none";
  adminPanel.classList.add("visible");
  renderList();
  renderMusicList();
}

if (sessionStorage.getItem("admin_auth") === "true") unlock();

lockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (lockPassword.value.trim() === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_auth", "true");
    lockSubmit.textContent = "✓ Acessando...";
    setTimeout(() => unlock(), 500);
  } else {
    lockError.classList.add("show");
  }
});

imageInput.addEventListener("change", (e) => e.target.files[0] && handleFile(e.target.files[0]));

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newItem = { 
      id: Date.now().toString(), 
      title: itemTitle.value, 
      date: itemDate.value,
      description: itemDesc.value,
      imageBase64: currentImageBase64,
      destination: document.querySelector('input[name="destination"]:checked').value
  };
  await fetch("/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD },
      body: JSON.stringify(newItem),
  });
  renderList();
  addForm.reset();
  imagePreview.style.display = "none";
});

clearAllBtn.addEventListener("click", async () => { 
    if(confirm("Apagar todos os momentos?")) { 
        await fetch("/api/moments?clearAll=true", { method: "DELETE", headers: { "X-Admin-Password": ADMIN_PASSWORD } });
        renderList(); 
    } 
});

clearMusicBtn.addEventListener("click", () => {
    localStorage.removeItem("kawany_active_music_file");
    renderMusicList();
});