if (!getToken()) {
  window.location.href = "index.html";
}

let currentProducts = [];
let deletedVariantIds = [];

function statusBadge(product) {
  if (!product.is_active) {
    return `<span class="status status-inactive"><span class="dot"></span>Nofaol</span>`;
  }
  if (product.total_stock === 0) {
    return `<span class="status status-out"><span class="dot"></span>Tugagan</span>`;
  }
  if (product.total_stock <= 5) {
    return `<span class="status status-low"><span class="dot"></span>Kam qolgan</span>`;
  }
  return `<span class="status status-active"><span class="dot"></span>Sotuvda</span>`;
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
    currentProducts = products || [];

    if (currentProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Mahsulot topilmadi</td></tr>`;
      return;
    }

    tbody.innerHTML = currentProducts.map((p, idx) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.category ? p.category.name : "-"}</td>
        <td>${p.brand ? p.brand.name : "-"}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${statusBadge(p)}</td>
        <td class="text-end">
          <button class="btn-edit" onclick="openProductModal(currentProducts[${idx}])">Tahrirlash</button>
          <button class="btn-edit btn-delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">O'chirish</button>
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

// ---------- MODAL ----------

function addVariantRow(variant = null) {
  const tbody = document.getElementById("variantRows");
  const row = document.createElement("tr");
  if (variant) row.dataset.variantId = variant.id;

  row.innerHTML = `
    <td><input type="text" class="form-control form-control-sm v-size" value="${variant ? variant.size : ""}" placeholder="M"></td>
    <td><input type="text" class="form-control form-control-sm v-color" value="${variant ? variant.color : ""}" placeholder="Qora"></td>
    <td><input type="number" min="0" class="form-control form-control-sm v-stock" value="${variant ? variant.stock : 0}"></td>
    <td><input type="text" class="form-control form-control-sm v-sku" value="${variant ? (variant.sku || "") : ""}" placeholder="ixtiyoriy"></td>
    <td><button type="button" class="btn-remove-variant" onclick="removeVariantRow(this)">&times;</button></td>
  `;
  tbody.appendChild(row);
}

function removeVariantRow(btn) {
  const row = btn.closest("tr");
  if (row.dataset.variantId) {
    deletedVariantIds.push(Number(row.dataset.variantId));
  }
  row.remove();
}

async function loadModalOptions() {
  const catSelect = document.getElementById("pCategory");
  const brandSelect = document.getElementById("pBrand");
  const [categories, brands] = await Promise.all([
    apiFetch("/categories/"),
    apiFetch("/brands/"),
  ]);
  catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  brandSelect.innerHTML =
    `<option value="">Brendsiz</option>` +
    brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
}

function openProductModal(product = null) {
  document.getElementById("modalError").classList.add("d-none");
  deletedVariantIds = [];

  document.getElementById("productModalTitle").textContent =
    product ? "Mahsulotni tahrirlash" : "Yangi mahsulot";
  document.getElementById("productId").value = product ? product.id : "";
  document.getElementById("pName").value = product ? product.name : "";
  document.getElementById("pPrice").value = product ? product.price : "";
  document.getElementById("pDescription").value = product ? (product.description || "") : "";
  document.getElementById("pActive").checked = product ? product.is_active : true;

  document.getElementById("pCategory").dataset.selected = product?.category?.id ?? "";
  document.getElementById("pBrand").dataset.selected = product?.brand?.id ?? "";

  document.getElementById("variantRows").innerHTML = "";
  if (product && product.variants && product.variants.length) {
    product.variants.forEach(v => addVariantRow(v));
  } else {
    addVariantRow();
  }

  const modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();
}

document.getElementById("productModal").addEventListener("show.bs.modal", async () => {
  try {
    await loadModalOptions();
    const cat = document.getElementById("pCategory");
    const brand = document.getElementById("pBrand");
    if (cat.dataset.selected) cat.value = cat.dataset.selected;
    if (brand.dataset.selected) brand.value = brand.dataset.selected;
  } catch (err) {
    console.error(err);
  }
});

document.getElementById("addVariantRow").addEventListener("click", () => addVariantRow());

document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const errorBox = document.getElementById("modalError");
  errorBox.classList.add("d-none");

  const name = document.getElementById("pName").value.trim();
  const price = parseFloat(document.getElementById("pPrice").value);
  const categoryId = document.getElementById("pCategory").value;

  if (!name || !price || !categoryId) {
    errorBox.textContent = "Nomi, narxi va kategoriya to'ldirilishi shart";
    errorBox.classList.remove("d-none");
    return;
  }

  const payload = {
    name,
    description: document.getElementById("pDescription").value.trim() || null,
    price,
    category_id: Number(categoryId),
    brand_id: document.getElementById("pBrand").value ? Number(document.getElementById("pBrand").value) : null,
    is_active: document.getElementById("pActive").checked,
  };

  const saveBtn = document.getElementById("saveProductBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saqlanmoqda...";

  try {
    const productId = document.getElementById("productId").value;
    let product;
    if (productId) {
      product = await apiFetch(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      product = await apiFetch("/products/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    for (const id of deletedVariantIds) {
      await apiFetch(`/products/${product.id}/variants/${id}`, { method: "DELETE" });
    }

    const rows = document.querySelectorAll("#variantRows tr");
    for (const row of rows) {
      const size = row.querySelector(".v-size").value.trim();
      const color = row.querySelector(".v-color").value.trim();
      const stock = Number(row.querySelector(".v-stock").value);
      const sku = row.querySelector(".v-sku").value.trim() || null;
      if (!size || !color) continue;

      const variantPayload = { size, color, stock, sku };
      if (row.dataset.variantId) {
        await apiFetch(`/products/${product.id}/variants/${row.dataset.variantId}`, {
          method: "PUT",
          body: JSON.stringify(variantPayload),
        });
      } else {
        await apiFetch(`/products/${product.id}/variants`, {
          method: "POST",
          body: JSON.stringify(variantPayload),
        });
      }
    }

    bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
    loadProducts();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Saqlash";
  }
});


async function deleteProduct(id, name) {
  if (!confirm(`"${name}" mahsulotini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`)) {
    return;
  }
  try {
    await apiFetch(`/products/${id}`, { method: "DELETE" });
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

loadCategories();
loadProducts();