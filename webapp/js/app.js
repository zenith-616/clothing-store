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

function openSheet(id) { document.getElementById(id).classList.remove("hidden"); }
function closeSheet(id) { document.getElementById(id).classList.add("hidden"); }

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
  if (!res.ok) throw new Error(data.detail || "Xatolik yuz berdi");
  return data;
}

// ==== KATALOG ====
async function loadCategories() {
  categories = await apiGet("/storefront/categories");
  const chips = document.getElementById("categoryChips");
  chips.innerHTML = `<div class="chip active" data-id="">Hammasi</div>` +
    categories.map(c => `<div class="chip" data-id="${c.id}">${c.name}</div>`).join("");

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
      <div class="name">${p.name}</div>
      <div class="price">${money(p.price)}</div>
      ${stockBadge(p)}
    </div>
  `).join("");
}

// ==== MAHSULOT TAFSILOTI ====
function openProduct(id) {
  activeProduct = products.find(p => p.id === id);
  selectedVariant = null;
  qty = 1;

  document.getElementById("pTitle").textContent = activeProduct.name;
  document.getElementById("pDesc").textContent = activeProduct.description || "";
  document.getElementById("pPrice").textContent = money(activeProduct.price);
  document.getElementById("qtyValue").textContent = qty;

  const optionsBox = document.getElementById("variantOptions");
  optionsBox.innerHTML = activeProduct.variants.map(v => `
    <div class="variant-opt ${v.stock === 0 ? "disabled" : ""}" data-id="${v.id}">
      ${v.size} / ${v.color}
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
          <div class="name">${item.product_name}</div>
          <div class="meta">${item.size} / ${item.color} × ${item.quantity}</div>
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
  closeSheet("cartSheet");
  openSheet("checkoutSheet");
}

async function confirmOrder() {
  const errorBox = document.getElementById("checkoutError");
  errorBox.classList.add("hidden");

  const fullName = document.getElementById("cFullName").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  const address = document.getElementById("cAddress").value.trim();

    if (!fullName || !phone || !address) {
    errorBox.textContent = "Barcha maydonlarni to'ldiring";
    errorBox.classList.remove("hidden");
    return;
  }

  // Ism faqat harf, bo'shliq va chiziqchadan iborat bo'lishi kerak
  const namePattern = /^[A-Za-zА-Яа-яЎўҚқҒғҲҳ\s'-]+$/;
  if (!namePattern.test(fullName) || fullName.length < 3) {
    errorBox.textContent = "Ism noto'g'ri kiritildi. Faqat harflardan foydalaning";
    errorBox.classList.remove("hidden");
    return;
  }

  // Telefon: faqal raqam, +, bo'shliq va chiziqcha, kamida 9 ta raqam
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 9 || digitsOnly.length > 13) {
    errorBox.textContent = "Telefon raqam noto'g'ri. Masalan: +998901234567";
    errorBox.classList.remove("hidden");
    return;
  }

  // Manzil: faqat raqamlardan iborat bo'lmasligi kerak
  if (/^\d+$/.test(address.trim())) {
    errorBox.textContent = "Manzilni to'liq kiriting (ko'cha, uy raqami)";
    errorBox.classList.remove("hidden");
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
    closeSheet("checkoutSheet");
    openSheet("successSheet");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
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
