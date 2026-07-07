const ADMIN_PASSWORD = "kawany2025";
const STORAGE_KEY = "kawany_admin_items";
const MAX_SIZE = 5 * 1024 * 1024;

const lockScreen = document.getElementById("lock-screen");
const lockForm = document.getElementById("lock-form");
const lockPassword = document.getElementById("lock-password");
const lockError = document.getElementById("lock-error");
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

let currentImageBase64 = "";

if (sessionStorage.getItem("admin_auth") === "true") unlock();

lockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (lockPassword.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_auth", "true");
    lockError.classList.remove("show");
    unlock();
  } else {
    lockError.classList.add("show");
    lockPassword.value = "";
    lockPassword.focus();
  }
});

function unlock() {
  lockScreen.style.display = "none";
  adminPanel.classList.add("visible");
  renderList();
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) handleFile(file);
});

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () =>
  uploadZone.classList.remove("drag-over"),
);
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleFile(file);
});

function handleFile(file) {
  if (file.size > MAX_SIZE) {
    showAlert("Imagem muito grande. Máximo 5 MB.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      const MAX_DIM = 1200;
      if (width > height) {
        if (width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      currentImageBase64 = canvas.toDataURL("image/jpeg", 0.7);
      previewImg.src = currentImageBase64;
      imagePreview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = itemTitle.value.trim();
  if (!title) {
    showAlert("Adicione um título.", "error");
    itemTitle.focus();
    return;
  }

  const destination = document.querySelector(
    'input[name="destination"]:checked',
  ).value;
  const newItem = {
    id: Date.now().toString(),
    title,
    date: itemDate.value.trim(),
    description: itemDesc.value.trim(),
    imageBase64: currentImageBase64,
    destination,
    createdAt: new Date().toISOString(),
  };

  try {
    const password = sessionStorage.getItem("admin_pwd") || ADMIN_PASSWORD;
    const res = await fetch("/api/moments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify(newItem),
    });

    if (res.ok) {
      showAlert("Momento salvo com sucesso no banco de dados! ✨", "success");
    } else {
      const errData = await res.json();
      throw new Error(errData.error || "Erro ao salvar na API");
    }
  } catch (e) {
    const items = getLocalItems();
    items.push(newItem);
    saveLocalItems(items);
    showAlert("Salvo localmente (banco de dados offline). ✨", "success");
  }

  addForm.reset();
  currentImageBase64 = "";
  imagePreview.style.display = "none";
  previewImg.src = "";
  renderList();
});

async function renderList() {
  let items = [];
  try {
    const res = await fetch("/api/moments");
    if (res.ok) {
      items = await res.json();
    } else {
      items = getLocalItems();
    }
  } catch (e) {
    items = getLocalItems();
  }

  itemsList.innerHTML = "";
  if (!items || !items.length) {
    itemsList.innerHTML =
      '<div class="empty-state"><div class="empty-state__icon">📭</div><p>Nenhum momento adicionado ainda.</p></div>';
    return;
  }

  [...items].reverse().forEach((item) => {
    const badgeClass =
      {
        timeline: "badge-timeline",
        gallery: "badge-gallery",
        both: "badge-both",
      }[item.destination] || "badge-gallery";
    const badgeLabel =
      {
        timeline: "📅 Timeline",
        gallery: "🖼️ Galeria",
        both: "✨ Ambos",
      }[item.destination] || "Galeria";
    const div = document.createElement("div");
    div.className = "item-card";
    div.setAttribute("role", "listitem");
    div.innerHTML = `
      <div class="item-card__thumb">${item.imageBase64 ? `<img src="${item.imageBase64}" alt="" loading="lazy" />` : "📷"}</div>
      <div class="item-card__info">
        <div class="item-card__title">${esc(item.title)}</div>
        <div class="item-card__meta"><span class="item-card__badge ${badgeClass}">${badgeLabel}</span>${item.date ? "· " + esc(item.date) : ""}</div>
      </div>
      <button class="btn btn-danger" data-id="${item.id}" aria-label="Excluir ${esc(item.title)}">Excluir</button>
    `;
    div.querySelector(".btn-danger").addEventListener("click", async () => {
      if (confirm("Excluir este momento?")) {
        try {
          const password =
            sessionStorage.getItem("admin_pwd") || ADMIN_PASSWORD;
          const res = await fetch(`/api/moments?id=${item.id}`, {
            method: "DELETE",
            headers: {
              "X-Admin-Password": password,
            },
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Erro ao deletar da API");
          }
          showAlert("Item excluído com sucesso! 🗑️", "success");
        } catch (e) {
          const itemsFiltered = getLocalItems().filter(
            (i) => i.id !== item.id,
          );
          saveLocalItems(itemsFiltered);
          showAlert("Item excluído localmente.", "success");
        }
        renderList();
      }
    });
    itemsList.appendChild(div);
  });
}

clearAllBtn.addEventListener("click", async () => {
  if (confirm("Apagar TODOS os momentos do banco de dados?")) {
    try {
      const password = sessionStorage.getItem("admin_pwd") || ADMIN_PASSWORD;
      const res = await fetch("/api/moments?clearAll=true", {
        method: "DELETE",
        headers: {
          "X-Admin-Password": password,
        },
      });
      if (res.ok) {
        showAlert("Todos os momentos foram removidos do banco! 🗑️", "success");
      } else {
        throw new Error("Erro ao limpar banco");
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      showAlert("Todos os momentos locais foram removidos.", "success");
    }
    renderList();
  }
});

function getLocalItems() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    showAlert("Armazenamento cheio. Tente imagens menores.", "error");
  }
}

function showAlert(msg, type) {
  formAlert.textContent = msg;
  formAlert.className = "alert show alert-" + type;
  setTimeout(() => formAlert.classList.remove("show"), 4000);
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}