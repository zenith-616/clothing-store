if (!getToken()) {
  window.location.href = "index.html";
}

let currentEmployees = [];

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

  // Tahrirlashda email/parol o'zgartirilmaydi, faqat yangi qo'shishda
  document.getElementById("emailField").classList.toggle("d-none", !!employee);
  document.getElementById("passwordField").classList.toggle("d-none", !!employee);
  document.getElementById("activeField").classList.toggle("d-none", !employee);

  const modal = new bootstrap.Modal(document.getElementById("employeeModal"));
  modal.show();
}

document.getElementById("saveEmployeeBtn").addEventListener("click", async () => {
  const errorBox = document.getElementById("employeeModalError");
  errorBox.classList.add("d-none");

  const employeeId = document.getElementById("employeeId").value;
  const fullName = document.getElementById("eFullName").value.trim();
  const role = document.getElementById("eRole").value;

  if (!fullName) {
    errorBox.textContent = "Ismni kiriting";
    errorBox.classList.remove("d-none");
    return;
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
      const email = document.getElementById("eEmail").value.trim();
      const password = document.getElementById("ePassword").value;
      if (!email || !password) {
        errorBox.textContent = "Email va parolni kiriting";
        errorBox.classList.remove("d-none");
        btn.disabled = false;
        btn.textContent = "Saqlash";
        return;
      }
      await apiFetch("/users/", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
    }
    bootstrap.Modal.getInstance(document.getElementById("employeeModal")).hide();
    loadEmployees();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("d-none");
  } finally {
    btn.disabled = false;
    btn.textContent = "Saqlash";
  }
});

loadEmployees();