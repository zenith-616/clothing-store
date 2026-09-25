if (!getToken()) {
  window.location.href = "index.html";
}

function formatPrice(price) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

async function loadDashboard() {
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  try {
    const data = await apiFetch("/dashboard/");

    document.getElementById("statTodayOrders").textContent = data.today_orders;
    document.getElementById("statTodayRevenue").textContent = formatPrice(data.today_revenue);
    document.getElementById("statNewOrders").textContent = data.new_orders;
    document.getElementById("statLowStock").textContent = data.low_stock_variants;
    document.getElementById("statTotalOrders").textContent = data.total_orders;
    document.getElementById("statTotalRevenue").textContent = formatPrice(data.total_revenue);

    const container = document.getElementById("topProducts");
    if (!data.top_products || data.top_products.length === 0) {
      container.innerHTML = `<p class="text-muted mb-0">Hali sotuv yo'q</p>`;
      return;
    }

    const maxSold = Math.max(...data.top_products.map(p => p.sold));
    container.innerHTML = data.top_products.map(p => `
      <div class="top-product-row">
        <div class="w-100">
          <div class="d-flex justify-content-between">
            <span>${p.name}</span>
            <span class="text-muted">${p.sold} dona</span>
          </div>
          <div class="top-product-bar"><span style="width:${(p.sold / maxSold) * 100}%"></span></div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

loadDashboard();