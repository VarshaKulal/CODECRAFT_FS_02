// Make sure frontend & backend both use localhost
const apiBase = "http://localhost:3000";  
const msg = id => document.getElementById(id);

let editingId = null;

async function whoami() {
  try {
    const res = await fetch(`${apiBase}/api/me`, { credentials: "include" });
    if (!res.ok) { window.location.href = "login.html"; return; }
    const data = await res.json();
    msg("whoami").innerText = `Logged in as ${data.username} (${data.role})`;
    if (data.role !== "admin") {
      alert("Admin only");
      window.location.href = "login.html";
      return;
    }
    loadEmployees();
  } catch (err) {
    window.location.href = "login.html";
  }
}

async function loadEmployees() {
  try {
    const res = await fetch(`${apiBase}/api/employees`, { credentials: "include" });
    if (!res.ok) {
      const d = await res.json();
      msg("msg").className = "error"; msg("msg").innerText = d.error || "Could not load";
      return;
    }
    const list = await res.json();
    const tbody = document.querySelector("#empTable tbody");
    tbody.innerHTML = "";
    list.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${e.name}</td><td>${e.email}</td><td>${e.position}</td><td>${e.salary}</td>
        <td>
          <button class="edit" data-id="${e._id}">Edit</button>
          <button class="del" data-id="${e._id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll(".edit").forEach(b => b.onclick = () => editEmployee(b.dataset.id));
    document.querySelectorAll(".del").forEach(b => b.onclick = () => deleteEmployee(b.dataset.id));
  } catch (err) {
    msg("msg").className = "error"; msg("msg").innerText = "Network error";
  }
}

async function addEmployee() {
  const name = msg("name").value.trim();
  const email = msg("email").value.trim();
  const position = msg("position").value.trim();
  const salary = Number(msg("salary").value);
  msg("msg").innerText = "";

  try {
    const res = await fetch(`${apiBase}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, position, salary })
    });
    const d = await res.json();
    if (!res.ok) { msg("msg").className = "error"; msg("msg").innerText = d.error || (d.errors && d.errors[0].msg) || "Error"; return; }
    msg("msg").className = "message"; msg("msg").innerText = "Added";
    clearForm();
    loadEmployees();
  } catch (err) {
    msg("msg").className = "error"; msg("msg").innerText = err.message;
  }
}

async function editEmployee(id) {
  try {
    const res = await fetch(`${apiBase}/api/employees/${id}`, { credentials: "include" });
    if (!res.ok) { msg("msg").className = "error"; msg("msg").innerText = "Could not fetch"; return; }
    const e = await res.json();
    msg("name").value = e.name;
    msg("email").value = e.email;
    msg("position").value = e.position;
    msg("salary").value = e.salary;
    editingId = id;
    msg("btnAdd").style.display = "none";
    msg("btnUpdate").style.display = "inline-block";
    msg("btnCancel").style.display = "inline-block";
  } catch (err) { msg("msg").className = "error"; msg("msg").innerText = err.message; }
}

async function updateEmployee() {
  if (!editingId) return;
  const name = msg("name").value.trim();
  const email = msg("email").value.trim();
  const position = msg("position").value.trim();
  const salary = Number(msg("salary").value);
  try {
    const res = await fetch(`${apiBase}/api/employees/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, position, salary })
    });
    const d = await res.json();
    if (!res.ok) { msg("msg").className="error"; msg("msg").innerText = d.error || (d.errors && d.errors[0].msg) || "Update failed"; return; }
    msg("msg").className="message"; msg("msg").innerText = "Updated";
    clearForm(); editingId = null;
    msg("btnAdd").style.display = "inline-block";
    msg("btnUpdate").style.display = "none";
    msg("btnCancel").style.display = "none";
    loadEmployees();
  } catch (err) { msg("msg").className="error"; msg("msg").innerText = err.message; }
}

async function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;
  try {
    const res = await fetch(`${apiBase}/api/employees/${id}`, { method: "DELETE", credentials: "include" });
    const d = await res.json();
    if (!res.ok) { msg("msg").className="error"; msg("msg").innerText = d.error || "Delete failed"; return; }
    msg("msg").className="message"; msg("msg").innerText = "Deleted";
    loadEmployees();
  } catch (err) { msg("msg").className="error"; msg("msg").innerText = err.message; }
}

function clearForm(){
  msg("name").value=""; msg("email").value=""; msg("position").value=""; msg("salary").value="";
}

msg("btnAdd").addEventListener("click", addEmployee);
msg("btnUpdate").addEventListener("click", updateEmployee);
msg("btnCancel").addEventListener("click", ()=>{
  clearForm(); editingId=null; msg("btnAdd").style.display="inline-block";
  msg("btnUpdate").style.display="none"; msg("btnCancel").style.display="none";
});

msg("btnLogout").addEventListener("click", async ()=>{
  await fetch(`${apiBase}/api/logout`, { method: "POST", credentials: "include" });
  window.location.href = "login.html";
});

// On load
whoami();
