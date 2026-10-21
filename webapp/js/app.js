// ==== SOZLAMALAR ====
// Backend va Web App bitta manzilda (Render) ishlaydi, shuning uchun bo'sh qoldiramiz
const API_URL = "";

// ==== TELEGRAM ====
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const tgUser = tg?.initDataUnsafe?.user;
const telegramId = tgUser?.id || 0;

// ==== HOLAT ====
let categories = [];
let products = [];
let selectedCategoryId = null;
let activeProduct = null;
let selectedVariant = null;
let qty = 1;
let cart = []; // {variant_id, product_name, size, color, price, quantity}

// ==== YORDAMCHI ====
function money(n) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

// HTML ichiga qo'yiladigan matnni xavfsiz qilish
function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Bir vaqtda faqat BITTA oyna ochiq bo'ladi
const SHEETS = ["productSheet", "cartSheet", "checkoutSheet", "successSheet"];

function openSheet(id) {
  SHEETS.forEach(s => document.getElementById(s).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closeSheet(id) {
  document.getElementById(id).classList.add("hidden");
  const anyOpen = SHEETS.some(s => !document.getElementById(s).classList.contains("hidden"));
  if (!anyOpen) document.body.classList.remove("no-scroll");
}

// Qora fonni bosganda oynani yopish
SHEETS.forEach(id => {
  document.getElementById(id).addEventListener("click", (e) => {
    if (e.target.id === id && id !== "successSheet") closeSheet(id);
  });
});

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error("Yuklashda xatolik");
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    // FastAPI validatsiya xatosi ro'yxat ko'rinishida kelishi mumkin
    if (Array.isArray(data.detail)) {
      throw new Error(data.detail.map(d => d.msg.replace("Value error, ", "")).join(". "));
    }
    throw new Error(data.detail || "Xatolik yuz berdi");
  }
  return data;
}

// ==== KATALOG ====
async function loadCategories() {
  categories = await apiGet("/storefront/categories");
  const chips = document.getElementById("categoryChips");
  chips.innerHTML = `<div class="chip active" data-id="">Hammasi</div>` +
    categories.map(c => `<div class="chip" data-id="${c.id}">${esc(c.name)}</div>`).join("");

  chips.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chips.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCategoryId = chip.dataset.id || null;
      loadProducts();
    });
  });
}

async function loadProducts() {
  let path = "/storefront/products";
  if (selectedCategoryId) path += `?category_id=${selectedCategoryId}`;
  products = await apiGet(path);
  renderProducts();
}

function stockBadge(product) {
  if (product.total_stock === 0) return `<span class="badge out"><span class="dot"></span>Tugagan</span>`;
  if (product.total_stock <= 5) return `<span class="badge low"><span class="dot"></span>Kam qolgan</span>`;
  return `<span class="badge ok"><span class="dot"></span>Bor</span>`;
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (products.length === 0) {
    grid.innerHTML = `<p class="muted">Mahsulot topilmadi</p>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="card" onclick="openProduct(${p.id})">
      ${p.image_url
        ? `<img src="${esc(p.image_url)}" class="card-image" alt="${esc(p.name)}" loading="lazy">`
        : `<div class="card-image-placeholder">Rasm yo'q</div>`}
      <div class="name">${esc(p.name)}</div>
      <div class="price">${money(p.price)}</div>
      ${stockBadge(p)}
    </div>
  `).join("");
}

// ==== MAHSULOT TAFSILOTI ====
function openProduct(id) {
  activeProduct = products.find(p => p.id === id);
  if (!activeProduct) return;
  selectedVariant = null;
  qty = 1;

  const img = document.getElementById("pImage");
  if (activeProduct.image_url) {
    img.src = activeProduct.image_url;
    img.alt = activeProduct.name;
    img.classList.remove("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
  }

  document.getElementById("pTitle").textContent = activeProduct.name;
  document.getElementById("pDesc").textContent = activeProduct.description || "";
  document.getElementById("pPrice").textContent = money(activeProduct.price);
  document.getElementById("qtyValue").textContent = qty;

  const optionsBox = document.getElementById("variantOptions");
  optionsBox.innerHTML = activeProduct.variants.map(v => `
    <div class="variant-opt ${v.stock === 0 ? "disabled" : ""}" data-id="${v.id}">
      ${esc(v.size)} / ${esc(v.color)}
    </div>
  `).join("");

  optionsBox.querySelectorAll(".variant-opt:not(.disabled)").forEach(el => {
    el.addEventListener("click", () => {
      optionsBox.querySelectorAll(".variant-opt").forEach(o => o.classList.remove("selected"));
      el.classList.add("selected");
      selectedVariant = activeProduct.variants.find(v => v.id == el.dataset.id);
    });
  });

  openSheet("productSheet");
}

function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById("qtyValue").textContent = qty;
}

function addToCart() {
  if (!selectedVariant) {
    alert("Iltimos, o'lcham va rangni tanlang");
    return;
  }
  const existing = cart.find(i => i.variant_id === selectedVariant.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      variant_id: selectedVariant.id,
      product_name: activeProduct.name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: activeProduct.price,
      quantity: qty,
    });
  }
  updateCartCount();
  closeSheet("productSheet");
}

// ==== SAVAT ====
function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

document.getElementById("cartBtn").addEventListener("click", () => {
  renderCart();
  openSheet("cartSheet");
});

function renderCart() {
  const box = document.getElementById("cartItems");
  if (cart.length === 0) {
    box.innerHTML = `<p class="muted">Savat bo'sh</p>`;
    document.getElementById("goCheckoutBtn").disabled = true;
  } else {
    box.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div>
          <div class="name">${esc(item.product_name)}</div>
          <div class="meta">${esc(item.size)} / ${esc(item.color)} × ${item.quantity}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span>${money(item.price * item.quantity)}</span>
          <button onclick="removeFromCart(${idx})">✕</button>
        </div>
      </div>
    `).join("");
    document.getElementById("goCheckoutBtn").disabled = false;
  }
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  document.getElementById("cartTotal").textContent = money(total);
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  renderCart();
  updateCartCount();
}

// ==== CHECKOUT ====
function openCheckout() {
  if (tgUser) {
    document.getElementById("cFullName").value =
      `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim();
  }
  openSheet("checkoutSheet");
}

function showCheckoutError(message) {
  const errorBox = document.getElementById("checkoutError");
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

async function confirmOrder() {
  document.getElementById("checkoutError").classList.add("hidden");

  const fullName = document.getElementById("cFullName").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  const address = document.getElementById("cAddress").value.trim();

  if (!fullName || !phone || !address) {
    showCheckoutError("Barcha maydonlarni to'ldiring");
    return;
  }

  // Ism: faqat harf, bo'shliq, ' va - belgilari
  const namePattern = /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ\s'’-]+$/;
  if (!namePattern.test(fullName) || fullName.length < 3) {
    showCheckoutError("Ism noto'g'ri kiritildi. Faqat harflardan foydalaning");
    return;
  }

  // Telefon: 9-13 ta raqam
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 9 || digitsOnly.length > 13) {
    showCheckoutError("Telefon raqam noto'g'ri. Masalan: +998901234567");
    return;
  }

  // Manzil: faqat raqamdan iborat bo'lmasligi kerak
  if (/^\d+$/.test(address)) {
    showCheckoutError("Manzilni to'liq kiriting (ko'cha, uy raqami)");
    return;
  }

  const btn = document.getElementById("confirmOrderBtn");
  btn.disabled = true;
  btn.textContent = "Yuborilmoqda...";

  try {
    await apiPost("/storefront/register", {
      telegram_id: telegramId,
      full_name: fullName,
      phone,
      address,
    });

    await apiPost("/storefront/orders", {
      telegram_id: telegramId,
      address,
      items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
    });

    cart = [];
    updateCartCount();
    openSheet("successSheet");
  } catch (err) {
    showCheckoutError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Buyurtmani tasdiqlash";
  }
}

function restart() {
  closeSheet("successSheet");
  loadProducts();
}

// ==== BOSHLASH ====
loadCategories();
loadProducts();