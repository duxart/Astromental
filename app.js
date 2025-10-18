// app.js — original core with added Admin "Settings" section

// Telegram WebApp init
const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.BackButton?.show?.();
tg?.BackButton?.onClick(() => window.history.back());

// localStorage helpers
function readArray(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}
function writeArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr || []));
}
function readObject(key, fallback = {}) {
  try { 
    const o = JSON.parse(localStorage.getItem(key) || "null");
    return (o && typeof o==="object" && !Array.isArray(o)) ? o : fallback;
  } catch {
    return fallback;
  }
}
function writeObject(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

// Default settings and config
const DEFAULT_SETTINGS = {
  shopName: "Мой магазин услуг",
  welcomeMessage: "Добро пожаловать!",
};
const DEFAULT_CONFIG = {
  TELEGRAM_BOT_TOKEN: "",
  ADMIN_CHAT_ID: "",
  GROUP_INVITE_LINK: "",
  ROBOKASSA: { MERCHANT_LOGIN: "", PASSWORD1: "", PASSWORD2: "", TEST_MODE: false }
};
function getConfig() {
  return Object.assign({}, DEFAULT_CONFIG, readObject("appConfig"));
}

// READ application data
function readSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, readObject("settings"));
}
function readProducts() { return readArray("products"); }
function readCart() { return readArray("cart"); }

// SAVE settings
function saveSettings(s) { writeObject("settings", s); }
function saveConfig(c) { writeObject("appConfig", c); }

// RENDER screens
function showWelcome() {
  const { shopName, welcomeMessage } = readSettings();
  document.getElementById("app").innerHTML = `
    <section id="welcome">
      <h1>${shopName}</h1>
      <p>${welcomeMessage}</p>
      <button id="goShopBtn">Перейти в магазин</button>
    </section>`;
  document.getElementById("goShopBtn").onclick = showCatalog;
}

function showCatalog() {
  const products = readProducts();
  document.getElementById("app").innerHTML = `
    <section class="catalog">
      <button id="backBtn">← Назад</button>
      <div class="grid">
        ${products.map(p=>`
          <div class="product-card" data-id="${p.id}">
            <h3>${p.name}</h3>
            <p>${p.description||""}</p>
            <div>${p.price} ₽</div>
            <button class="addBtn">В корзину</button>
          </div>`).join("")}
      </div>
      <button id="goCartBtn">Корзина (${readCart().length})</button>
    </section>`;
  document.getElementById("backBtn").onclick = showWelcome;
  document.querySelectorAll(".addBtn").forEach(b=>
    b.onclick = ()=>{ 
      const id = b.closest(".product-card").dataset.id;
      const cart = readCart(); cart.push(id); writeArray("cart",cart);
      alert("Добавлено в корзину"); 
      showCatalog();
    }
  );
  document.getElementById("goCartBtn").onclick = showCart;
}

function showCart() {
  const cart = readCart();
  document.getElementById("app").innerHTML = `
    <section class="cart">
      <button id="backBtn">← Назад</button>
      <ul>
        ${cart.map(id=>`<li>Товар ID: ${id}</li>`).join("")}
      </ul>
      <button id="toAdminBtn">Админка</button>
    </section>`;
  document.getElementById("backBtn").onclick = showCatalog;
  document.getElementById("toAdminBtn").onclick = ()=>initAdmin();
}

// ADMIN panel
function initAdmin() {
  document.getElementById("app").innerHTML = `
    <div class="admin-container">
      <nav class="admin-sidebar">
        <button data-section="dashboard" class="active">Dashboard</button>
        <button data-section="settings">Настройки</button>
      </nav>
      <main class="admin-content" id="adminContent"></main>
    </div>`;
  document.querySelectorAll(".admin-sidebar button").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll(".admin-sidebar button")
        .forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      showAdminSection(btn.dataset.section);
    };
  });
  showAdminSection("dashboard");
}

function showAdminSection(section) {
  const c = document.getElementById("adminContent");
  if (section==="dashboard") {
    const orders = readArray("orders").length;
    const customers = readArray("customers").length;
    c.innerHTML = `
      <h2>Dashboard</h2>
      <p>Заказов: ${orders}</p>
      <p>Клиентов: ${customers}</p>`;
  }
  else if (section==="settings") {
    const cfg = getConfig();
    c.innerHTML = `
      <h2>Настройки</h2>
      <form id="settingsForm">
        <label>Shop Name: <input id="sShopName" value="${readSettings().shopName}"></label>
        <label>Welcome Msg: <input id="sWelcome" value="${readSettings().welcomeMessage}"></label>
        <h3>Telegram</h3>
        <label>Bot Token: <input id="sBotToken" value="${cfg.TELEGRAM_BOT_TOKEN}"></label>
        <label>Admin Chat ID: <input id="sAdminChat" value="${cfg.ADMIN_CHAT_ID}"></label>
        <label>Group Link: <input id="sGroupLink" value="${cfg.GROUP_INVITE_LINK}"></label>
        <h3>Robokassa</h3>
        <label>Merchant Login: <input id="sMerchant" value="${cfg.ROBOKASSA.MERCHANT_LOGIN}"></label>
        <label>Password1: <input id="sPass1" type="password" value="${cfg.ROBOKASSA.PASSWORD1}"></label>
        <label>Password2: <input id="sPass2" type="password" value="${cfg.ROBOKASSA.PASSWORD2}"></label>
        <label><input type="checkbox" id="sTestMode" ${cfg.ROBOKASSA.TEST_MODE?"checked":""}> Test Mode</label>
        <button type="submit">Сохранить</button>
      </form>`;
    document.getElementById("settingsForm").onsubmit = evt=>{
      evt.preventDefault();
      const newSettings = {
        shopName: document.getElementById("sShopName").value,
        welcomeMessage: document.getElementById("sWelcome").value
      };
      saveSettings(newSettings);
      const newConfig = {
        TELEGRAM_BOT_TOKEN: document.getElementById("sBotToken").value,
        ADMIN_CHAT_ID: document.getElementById("sAdminChat").value,
        GROUP_INVITE_LINK: document.getElementById("sGroupLink").value,
        ROBOKASSA: {
          MERCHANT_LOGIN: document.getElementById("sMerchant").value,
          PASSWORD1: document.getElementById("sPass1").value,
          PASSWORD2: document.getElementById("sPass2").value,
          TEST_MODE: document.getElementById("sTestMode").checked
        }
      };
      saveConfig(newConfig);
      alert("Настройки сохранены");
    };
  }
}

// INITIALIZE on DOM ready
document.addEventListener("DOMContentLoaded", ()=>{
  showWelcome();
});