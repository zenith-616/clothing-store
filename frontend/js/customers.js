if (!getToken()) {
  window.location.href = "index.html";
}

let currentCustomers = [];

const STATUS_LABELS = {
  "yangi": "Yangi",
  "tasdiqlandi": "Tasdiqlandi",
  "tayyorlanmoqda": "Tayyorlanmoqda",
  "yetkazilmoqda": "Yetkazilmoqda",
  "yetkazildi": "Yetkazildi",
  "bekor qilindi": "Bekor qilindi",
};

const STATUS_CLASS = {
  "yangi": "status-new",
  "tasdiqlandi": "status-confirmed",
  "tayyorlanmoqda": "status-preparing",
  "yetkazilmoqda": "status-shipping",
  "yetkazildi": "status-delivered",
  "bekor qilindi": "status-cancelled",
};

function orderStatusBadge(status) {
  const cls = STATUS_CLASS[status] || "status-new";
  const label = STATUS_LABELS[status] || status;
  return `<span class="status ${cls}"><span class="dot"></span>${label}</span>`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ");
}

async function loadCustomers() {
  const tbody = document.getElementById("customersBody");
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  const q = document.getElementById("searchInput").value;
  let path = "/customers/?limit=50";
  if (q) path += `&q=${encodeURIComponent(q)}`;

  try {
    const customers = await apiFetch(path);
    currentCustomers = customers || [];

    if (currentCustomers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Mijoz topilmadi</td></tr>`;
      return;
    }

    tbody.innerHTML = currentCustomers.map((c, idx) => `
      <tr>
        <td data-label="Ism">${c.full_name}</td>
        <td data-label="Telefon">${c.phone}</td>
        <td data-label="Manzil">${c.address || "-"}</td>
        <td data-label="Buyurtmalar"><button class="btn-edit" onclick="viewCustomerOrders(currentCustomers[${idx}])">Ko'rish</button></td>
        <td class="text-end"><button class="btn-edit" onclick="openCustomerModal(currentCustomers[${idx}])">Tahrirlash</button></td>
      </tr>
    `).join("");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

function openCustomerModal(customer = null) {
  document.getElementById("customerModalError").classList.add("d-none");
  document.getElementById("customerModalTitle").textContent = customer ? "Mijozni tahrirlash" : "Yangi mijoz";
  document.getElementById("customerId").value = customer ? customer.id : "";
  document.getElementById("cFullName").value = customer ? customer.full_name : "";
  document.getElementById("cPhone").value = customer ? customer.phone : "";
  document.getElementById("cAddress").value = customer ? (customer.address || "") : "";

  const modal = new bootstrap.Modal(document.getElementById("customerModal"));
  modal.show();
}

document.getElementById("saveCustomerBtn").addEventListener("click", async () => {
  const errorBox = document.getElementById("customerModalError");
  errorBox.classList.add("d-none");

  const fullName = document.getElementById("cFullName").value.trim();
  const phone = document.getElementById("cPhone").value.trim();

  if (!fullName || !phone) {
    errorBox.textContent = "Ism va telefon raqam to'ldirilishi shart";
    errorBox.classList.remove("d-none");
    return;
  }

  const payload = {
    full_name: fullName,
    phone,
    address: document.getElementById("cAddress").value.trim() || null,
  };

  const btn = document.getElementById("saveCustomerBtn");
  btn.disabled = true;
  btn.textContent = "Saqlanmoqda...";

  try {
    const customerId = document.getElementById("customerId").value;
    if (customerId) {
      await apiFetch(`/customers/${customerId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/customers/", { method: "POST", body: JSON.stringify(payload) });
    }
    bootstrap.Modal.getInstance(document.getElementById("customerModal")).hide();
    loadCustomers();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  } finally {
    btn.disabled = false;
    btn.textContent = "Saqlash";
  }
});

async function viewCustomerOrders(customer) {
  document.getElementById("customerOrdersTitle").textContent = `${customer.full_name} — buyurtmalar`;
  const tbody = document.getElementById("customerOrdersBody");
  tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Yuklanmoqda...</td></tr>`;

  const modal = new bootstrap.Modal(document.getElementById("customerOrdersModal"));
  modal.show();

  try {
    const orders = await apiFetch(`/customers/${customer.id}/orders`);
    if (!orders || orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Buyurtma yo'q</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${formatDate(o.created_at)}</td>
        <td>${formatPrice(o.total_price)}</td>
        <td>${orderStatusBadge(o.status)}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">${err.message}</td></tr>`;
  }
}

loadCustomers();