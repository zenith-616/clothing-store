if (!getToken()) {
  window.location.href = "index.html";
}

let currentEmployees = [];

// ----- Kuchli parol qoidalari (backend'dagi qoidalar bilan bir xil) -----
const PASSWORD_RULES = {
  len: (p) => p.length >= 8,            // kamida 8 ta belgi
  digit: (p) => /[0-9]/.test(p),        // kamida 1 ta raqam
  upper: (p) => /\p{Lu}/u.test(p),      // kamida 1 ta katta harf
};

function passwordIsStrong(password) {
  return Object.values(PASSWORD_RULES).every((rule) => rule(password));
}

// Parol yozilayotganda har bir talab yonida belgi (✓ / ✗) ko'rsatiladi
function updatePasswordRules() {
  const password = document.getElementById("ePassword").value;
  document.querySelectorAll("#pwRules li").forEach((li) => {
    const ok = PASSWORD_RULES[li.dataset.rule](password);
    li.classList.toggle("ok", ok);
    li.classList.toggle("bad", !ok && password.length > 0);
  });
}

document.getElementById("ePassword").addEventListener("input", updatePasswordRules);

function roleBadge(role) {
  if (role === "admin") {
    return `<span class="status status-active"><span class="dot"></span>Admin</span>`;
  }
  return `<span class="status status-new"><span class="dot"></span>Operator</span>`;
}

function activeBadge(isActive) {
  return isActive
    ? `<span class="status status-active"><span class="dot"></span>Faol</span>`
    : `<span class="status status-inactive"><span class="dot"></span>Nofaol</span>`;
}

async function loadEmployees() {
  const tbody = document.getElementById("employeesBody");
  const errorBox = document.getElementById("errorBox");
  errorBox.classList.add("d-none");

  try {
    const employees = await apiFetch("/users/");
    currentEmployees = employees || [];

    if (currentEmployees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Xodim topilmadi</td></tr>`;
      return;
    }

    tbody.innerHTML = currentEmployees.map((e, idx) => `
      <tr>
        <td data-label="Ism">${e.full_name}</td>
        <td data-label="Email">${e.email}</td>
        <td data-label="Rol">${roleBadge(e.role)}</td>
        <td data-label="Holati">${activeBadge(e.is_active)}</td>
        <td class="text-end">
          <button class="btn-edit" onclick="openEmployeeModal(currentEmployees[${idx}])">Tahrirlash</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  }
}

function openEmployeeModal(employee = null) {
  document.getElementById("employeeModalError").classList.add("d-none");
  document.getElementById("employeeModalTitle").textContent = employee ? "Xodimni tahrirlash" : "Yangi xodim";
  document.getElementById("employeeId").value = employee ? employee.id : "";
  document.getElementById("eFullName").value = employee ? employee.full_name : "";
  document.getElementById("eEmail").value = employee ? employee.email : "";
  document.getElementById("ePassword").value = "";
  document.getElementById("eRole").value = employee ? employee.role : "operator";
  document.getElementById("eActive").checked = employee ? employee.is_active : true;
  updatePasswordRules();

  // Tahrirlashda email/parol o'zgartirilmaydi, faqat yangi qo'shishda
  document.getElementById("emailField").classList.toggle("d-none", !!employee);
  document.getElementById("passwordField").classList.toggle("d-none", !!employee);
  document.getElementById("activeField").classList.toggle("d-none", !employee);

  const modal = new bootstrap.Modal(document.getElementById("employeeModal"));
  modal.show();
}

function showModalError(message) {
  const errorBox = document.getElementById("employeeModalError");
  errorBox.textContent = message;
  errorBox.classList.remove("d-none");
}

document.getElementById("saveEmployeeBtn").addEventListener("click", async () => {
  document.getElementById("employeeModalError").classList.add("d-none");

  const employeeId = document.getElementById("employeeId").value;
  const fullName = document.getElementById("eFullName").value.trim();
  const role = document.getElementById("eRole").value;

  if (!fullName) {
    showModalError("Ismni kiriting");
    return;
  }

  // Yangi xodim uchun email va kuchli parol tekshiriladi
  let email = "";
  let password = "";
  if (!employeeId) {
    email = document.getElementById("eEmail").value.trim();
    password = document.getElementById("ePassword").value;

    if (!email || !password) {
      showModalError("Email va parolni kiriting");
      return;
    }
    if (!passwordIsStrong(password)) {
      showModalError("Parol talablarga javob bermaydi: kamida 8 ta belgi, 1 ta raqam va 1 ta katta harf bo'lishi kerak");
      return;
    }
  }

  const btn = document.getElementById("saveEmployeeBtn");
  btn.disabled = true;
  btn.textContent = "Saqlanmoqda...";

  try {
    if (employeeId) {
      await apiFetch(`/users/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName,
          role,
          is_active: document.getElementById("eActive").checked,
        }),
      });
    } else {
      await apiFetch("/users/", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
    }
    bootstrap.Modal.getInstance(document.getElementById("employeeModal")).hide();
    loadEmployees();
  } catch (err) {
    showModalError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Saqlash";
  }
});

loadEmployees();