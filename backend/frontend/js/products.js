// Sahifa ochilganda token yo'q bo'lsa, login sahifasiga qaytaramiz
if (!getToken()) {
  window.location.href = "index.html";
}

function statusBadge(product) {
  if (!product.is_active) {
    return `<span class="badge bg-secondary">Nofaol</span>`;
  }
  if (product.total_stock === 0) {
    return `<span class="badge bg-danger">Tugagan</span>`;
  }
  if (product.total_stock <= 5) {
    return `<span class="badge bg-warning text-dark">Kam qolgan</span>`;
  }
  return `<span class="badge bg-success">Sotuvda</span>`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

async function loadProducts() {
  const tbody = document.getElementById("productsBody");
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  const q = document.getElementById("searchInput").value;
  const categoryId = document.getElementById("categoryFilter").value;

  let path = "/products/?limit=50";
  if (q) path += `&q=${encodeURIComponent(q)}`;
  if (categoryId) path += `&category_id=${categoryId}`;

  try {
    const products = await apiFetch(path);
    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Mahsulot topilmadi</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.category ? p.category.name : "-"}</td>
        <td>${p.brand ? p.brand.name : "-"}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${statusBadge(p)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary">Tahrirlash</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

async function loadCategories() {
  const select = document.getElementById("categoryFilter");
  try {
    const categories = await apiFetch("/categories/");
    categories.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Kategoriyalarni yuklashda xato:", err);
  }
}

loadCategories();
loadProducts();