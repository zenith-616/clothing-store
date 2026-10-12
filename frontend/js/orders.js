if (!getToken()) {
  window.location.href = "index.html";
}

let currentOrders = [];

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

// Backend'dagi ALLOWED_TRANSITIONS bilan bir xil
const ALLOWED_TRANSITIONS = {
  "yangi": ["tasdiqlandi", "bekor qilindi"],
  "tasdiqlandi": ["tayyorlanmoqda", "bekor qilindi"],
  "tayyorlanmoqda": ["yetkazilmoqda", "bekor qilindi"],
  "yetkazilmoqda": ["yetkazildi", "bekor qilindi"],
  "yetkazildi": [],
  "bekor qilindi": [],
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
  return d.toLocaleDateString("uz-UZ") + " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

async function loadOrders() {
  const tbody = document.getElementById("ordersBody");
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  const status = document.getElementById("statusFilter").value;
  let path = "/orders/?limit=50";
  if (status) path += `&status=${encodeURIComponent(status)}`;

  try {
    const orders = await apiFetch(path);
    currentOrders = orders || [];

    if (currentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Buyurtma topilmadi</td></tr>`;
      return;
    }

    tbody.innerHTML = currentOrders.map((o, idx) => `
      <tr>
        <td data-label="#">#${o.id}</td>
        <td data-label="Mijoz">${o.customer.full_name}</td>
        <td data-label="Sana">${formatDate(o.created_at)}</td>
        <td data-label="Summa">${formatPrice(o.total_price)}</td>
        <td data-label="Holati">${orderStatusBadge(o.status)}</td>
        <td class="text-end">
          <button class="btn-edit" onclick="openOrderModal(currentOrders[${idx}])">Ko'rish</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

function openOrderModal(order) {
  document.getElementById("orderModalError").classList.add("d-none");
  document.getElementById("orderModalTitle").textContent = `Buyurtma #${order.id}`;
  document.getElementById("oCustomer").textContent = `${order.customer.full_name} (${order.customer.phone})`;
  document.getElementById("oAddress").textContent = order.address || "-";
  document.getElementById("oTotal").textContent = formatPrice(order.total_price);

  document.getElementById("orderItemsBody").innerHTML = order.items.map(item => `
    <tr>
      <td>Variant #${item.variant_id}</td>
      <td>${item.variant ? `${item.variant.size} / ${item.variant.color}` : "O'chirilgan"}</td>
      <td>${item.quantity}</td>
      <td>${formatPrice(item.price)}</td>
    </tr>
  `).join("");

  const statusSelect = document.getElementById("statusSelect");
  const options = [order.status, ...ALLOWED_TRANSITIONS[order.status]];
  statusSelect.innerHTML = options.map(s =>
    `<option value="${s}" ${s === order.status ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
  ).join("");

  const updateBtn = document.getElementById("updateStatusBtn");
  updateBtn.disabled = ALLOWED_TRANSITIONS[order.status].length === 0;
  updateBtn.onclick = () => updateOrderStatus(order.id);

  const modal = new bootstrap.Modal(document.getElementById("orderModal"));
  modal.show();
}

async function updateOrderStatus(orderId) {
  const errorBox = document.getElementById("orderModalError");
  errorBox.classList.add("d-none");
  const newStatus = document.getElementById("statusSelect").value;
  const btn = document.getElementById("updateStatusBtn");
  btn.disabled = true;
  btn.textContent = "Yangilanmoqda...";

  try {
    await apiFetch(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    bootstrap.Modal.getInstance(document.getElementById("orderModal")).hide();
    loadOrders();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  } finally {
    btn.disabled = false;
    btn.textContent = "Yangilash";
  }
}

loadOrders();