const ADMIN_PASSWORD = "kawany2025";
const STORAGE_KEY = "kawany_admin_items";
const MAX_SIZE = 5 * 1024 * 1024;

const lockScreen = document.getElementById("lock-screen");
const lockForm = document.getElementById("lock-form");
const lockPassword = document.getElementById("lock-password");
const lockSubmit = document.getElementById("lock-submit");
const adminPanel = document.getElementById("admin-panel");
const addForm = document.getElementById("add-form");
const imageInput = document.getElementById("image-input");
const previewImg = document.getElementById("preview-img");
const imagePreview = document.getElementById("image-preview");
const itemTitle = document.getElementById("item-title");
const itemDate = document.getElementById("item-date");
const itemDesc = document.getElementById("item-description");
const itemsList = document.getElementById("items-list");
const clearAllBtn = document.getElementById("clear-all-btn");
const musicList = document.getElementById("music-list");

let currentImageBase64 = "";

function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

async function renderList() {
  let items = [];
  try {
    const res = await fetch("/api/moments");
    items = res.ok ? await res.json() : [];
  } catch (e) { items = []; }

  itemsList.innerHTML = "";
  [...items].reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <div class="item-card__thumb">${item.imageBase64 ? `<img src="${item.imageBase64}" />` : "📷"}</div>
      <div class="item-card__info"><div>${esc(item.title)}</div></div>
      <button class="btn btn-danger">Excluir</button>
    `;
    div.querySelector(".btn-danger").onclick = async () => {
      if (confirm("Excluir?")) {
        await fetch(`/api/moments?id=${item.id}`, { method: "DELETE", headers: { "X-Admin-Password": ADMIN_PASSWORD } });
        renderList();
      }
    };
    itemsList.appendChild(div);
  });
}

async function renderMusicList() {
  musicList.innerHTML = "Carregando músicas...";
  try {
    const res = await fetch('/api/moments?action=list-music');
    const files = await res.json();
    const activeRes = await fetch('/api/moments?action=get-active-music');
    const { activeFile } = await activeRes.json();

    musicList.innerHTML = "";
    files.forEach(file => {
      const isActive = file === activeFile;
      const div = document.createElement("div");
      div.className = `music-card ${isActive ? "active" : ""}`;
      div.innerHTML = `<div>${esc(file)}</div><button class="btn">${isActive ? "⏸ Ativa" : "▶ Ativar"}</button>`;
      div.querySelector("button").onclick = async () => {
        await fetch('/api/moments?action=set-music', {
          method: 'POST',
          headers: { 'X-Admin-Password': ADMIN_PASSWORD, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file })
        });
        renderMusicList();
      };
      musicList.appendChild(div);
    });
  } catch(e) { musicList.innerHTML = "Erro ao carregar."; }
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageBase64 = e.target.result;
    previewImg.src = currentImageBase64;
    imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function unlock() {
  lockScreen.style.display = "none";
  adminPanel.classList.add("visible");
  renderList();
  renderMusicList();
}

if (sessionStorage.getItem("admin_auth") === "true") unlock();

lockForm.onsubmit = (e) => {
  e.preventDefault();
  if (lockPassword.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_auth", "true");
    unlock();
  } else alert("Senha incorreta");
};

imageInput.onchange = (e) => e.target.files[0] && handleFile(e.target.files[0]);

addForm.onsubmit = async (e) => {
  e.preventDefault();
  const newItem = { id: Date.now().toString(), title: itemTitle.value, imageBase64: currentImageBase64 };
  await fetch("/api/moments", { method: "POST", headers: { "X-Admin-Password": ADMIN_PASSWORD, "Content-Type": "application/json" }, body: JSON.stringify(newItem) });
  renderList();
  addForm.reset();
  imagePreview.style.display = "none";
};

clearAllBtn.onclick = async () => { if(confirm("Apagar tudo?")) { await fetch("/api/moments?clearAll=true", { method: "DELETE", headers: { "X-Admin-Password": ADMIN_PASSWORD } }); renderList(); } };