const DB_NAME = "erasmus_plus_management";
const DB_VERSION = 2;
const STORES = ["projects", "students", "expenses", "tasks", "documents"];

const state = {
  projects: [],
  students: [],
  expenses: [],
  tasks: [],
  documents: [],
  view: "dashboard",
  search: "",
};

let db;

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("de-DE");

document.addEventListener("DOMContentLoaded", async () => {
  db = await openDatabase();
  await loadState();
  bindNavigation();
  bindForms();
  bindFilters();
  bindBackup();
  render();
});

// IndexedDB-Datenhaltung: Die App speichert alle Entitäten lokal im Browser.
// Es gibt keinen externen Server; die Object Stores entsprechen den Tabellen.
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      STORES.forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function put(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").put({
      ...value,
      updatedAt: new Date().toISOString(),
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadState() {
  const [projects, students, expenses, tasks, documents] = await Promise.all(STORES.map(getAll));
  state.projects = projects.sort(sortByName);
  state.students = students.sort(sortByName);
  state.expenses = expenses.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  state.tasks = tasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  state.documents = documents.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

async function persist(storeName, value) {
  await put(storeName, value);
  await loadState();
  render();
  toast("Gespeichert");
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelector("#global-search").addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });
}

function bindForms() {
  document.querySelector("#project-form").addEventListener("submit", onProjectSubmit);
  document.querySelector("#student-form").addEventListener("submit", onStudentSubmit);
  document.querySelector("#expense-form").addEventListener("submit", onExpenseSubmit);
  document.querySelector("#task-form").addEventListener("submit", onTaskSubmit);
  document.querySelector("#document-form").addEventListener("submit", onDocumentSubmit);
  document.querySelectorAll("[data-reset-form]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`#${button.dataset.resetForm}`).reset();
      document.querySelector(`#${button.dataset.resetForm} [name=id]`).value = "";
    });
  });
}

function bindFilters() {
  ["dashboard-status-filter", "project-filter", "student-filter", "receipt-filter", "task-filter", "document-filter"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("change", render);
  });
}

function bindBackup() {
  document.querySelector("#export-data").addEventListener("click", exportData);
  document.querySelector("#import-data").addEventListener("click", importData);
  document.querySelector("#seed-data").addEventListener("click", seedData);
}

async function onProjectSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  if (new Date(data.endDate) < new Date(data.startDate)) {
    toast("Enddatum darf nicht vor dem Startdatum liegen");
    return;
  }

  await persist("projects", {
    id: data.id || createId(),
    name: data.name.trim(),
    action: data.action,
    partners: data.partners.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    budget: Number(data.budget),
    status: data.status,
  });
  form.reset();
}

async function onStudentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const projectIds = [...form.elements.projectIds.selectedOptions].map((option) => option.value);
  if (!projectIds.length) {
    toast("Bitte mindestens ein Projekt auswählen");
    return;
  }

  await persist("students", {
    id: data.get("id") || createId(),
    name: data.get("name").trim(),
    className: data.get("className").trim(),
    birthDate: data.get("birthDate"),
    projectIds,
    role: data.get("role"),
    documentStatus: data.get("documentStatus"),
    documents: {
      consent: data.has("consent"),
      emergency: data.has("emergency"),
      insurance: data.has("insurance"),
    },
  });
  form.reset();
}

async function onExpenseSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  await persist("expenses", {
    id: data.id || createId(),
    projectId: data.projectId,
    studentId: data.studentId,
    category: data.category,
    amount: Number(data.amount),
    date: data.date,
    receiptStatus: data.receiptStatus,
    note: data.note.trim(),
  });
  form.reset();
}

async function onTaskSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  await persist("tasks", {
    id: data.id || createId(),
    projectId: data.projectId,
    title: data.title.trim(),
    dueDate: data.dueDate,
    status: data.status,
    priority: data.priority,
  });
  form.reset();
}

async function onDocumentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  await persist("documents", {
    id: data.id || createId(),
    title: data.title.trim(),
    type: data.type,
    projectId: data.projectId,
    studentId: data.studentId,
    date: data.date,
    status: data.status,
    storageHint: data.storageHint.trim(),
  });
  form.reset();
}

function render() {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === state.view));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === state.view));
  document.querySelector("#page-title").textContent = document.querySelector(`[data-view="${state.view}"]`).textContent;
  fillSelects();
  renderDashboard();
  renderProjects();
  renderStudents();
  renderExpenses();
  renderTasks();
  renderDocuments();
}

function renderDashboard() {
  const activeProjects = state.projects.filter((project) => project.status === "Aktiv");
  const openTasks = state.tasks.filter((task) => task.status !== "Erledigt");
  const travellingStudents = state.students.filter((student) => student.role === "Teilnehmer").length;
  const remainingBudget = state.projects.reduce((sum, project) => sum + budgetRemaining(project.id), 0);

  document.querySelector("#kpi-grid").innerHTML = [
    kpi("Aktive Projekte", activeProjects.length),
    kpi("Verbleibendes Budget", money.format(remainingBudget)),
    kpi("Offene Aufgaben", openTasks.length),
    kpi("Reisende Schüler", travellingStudents),
  ].join("");

  const statusFilter = document.querySelector("#dashboard-status-filter").value;
  const projects = filterText(state.projects).filter((project) => !statusFilter || project.status === statusFilter);
  renderList("#project-status-list", projects.map(projectStatusCard));

  const risks = [
    ...state.expenses.filter((expense) => expense.receiptStatus === "Fehlend").map((expense) => `Fehlender Beleg: ${projectName(expense.projectId)} - ${expense.category}`),
    ...state.students.filter((student) => missingDocs(student).length).map((student) => `Dokumente offen: ${student.name} (${missingDocs(student).join(", ")})`),
    ...state.tasks.filter((task) => task.status !== "Erledigt" && isOverdue(task.dueDate)).map((task) => `Überfällig: ${task.title}`),
  ];
  renderList("#risk-list", risks.map((risk) => `<div class="item"><span class="badge danger">Offen</span><p>${escapeHtml(risk)}</p></div>`));
}

function renderProjects() {
  const status = document.querySelector("#project-filter").value;
  const rows = filterText(state.projects).filter((project) => !status || project.status === status);
  renderTable("#projects-table", ["Projekt", "Zeitraum", "Budget", "Status", "Fortschritt", ""], rows.map((project) => [
    `<strong>${escapeHtml(project.name)}</strong><div class="meta">${escapeHtml(project.action)} · ${escapeHtml(project.partners || "Keine Partner erfasst")}</div>`,
    `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
    `${money.format(project.budget)}<div class="meta">Rest ${money.format(budgetRemaining(project.id))}</div>`,
    badge(project.status, statusTone(project.status)),
    progressHtml(taskProgress(project.id)),
    actions("projects", project.id),
  ]));
}

function renderStudents() {
  const role = document.querySelector("#student-filter").value;
  const rows = filterText(state.students).filter((student) => !role || student.role === role);
  renderTable("#students-table", ["Name", "Projekte", "Rolle", "Dokumente", ""], rows.map((student) => [
    `<strong>${escapeHtml(student.name)}</strong><div class="meta">${escapeHtml(student.className)} · ${formatDate(student.birthDate)}</div>`,
    student.projectIds.map(projectName).map(escapeHtml).join("<br>"),
    badge(student.role, student.role === "Teilnehmer" ? "ok" : "warn"),
    documentBadges(student),
    actions("students", student.id),
  ]));
}

function renderExpenses() {
  const receipt = document.querySelector("#receipt-filter").value;
  const rows = filterText(state.expenses).filter((expense) => !receipt || expense.receiptStatus === receipt);
  renderTable("#expenses-table", ["Datum", "Projekt", "Schüler", "Kategorie", "Betrag", "Beleg", ""], rows.map((expense) => [
    formatDate(expense.date),
    escapeHtml(projectName(expense.projectId)),
    escapeHtml(studentName(expense.studentId)),
    escapeHtml(expense.category),
    money.format(expense.amount),
    badge(expense.receiptStatus, expense.receiptStatus === "Vorhanden" ? "ok" : "danger"),
    actions("expenses", expense.id),
  ]));
}

function renderTasks() {
  const projectId = document.querySelector("#task-filter").value;
  const rows = filterText(state.tasks).filter((task) => !projectId || task.projectId === projectId);
  renderList("#task-progress-list", state.projects.map((project) => {
    const progress = taskProgress(project.id);
    return `<div class="item"><h3>${escapeHtml(project.name)}</h3><div class="meta">${progress.done}/${progress.total} erledigt</div>${progressHtml(progress)}</div>`;
  }));
  renderTable("#tasks-table", ["Fällig", "Projekt", "Aufgabe", "Priorität", "Status", ""], rows.map((task) => [
    formatDate(task.dueDate),
    escapeHtml(projectName(task.projectId)),
    escapeHtml(task.title),
    badge(task.priority, task.priority === "Hoch" ? "danger" : "warn"),
    badge(task.status, task.status === "Erledigt" ? "ok" : isOverdue(task.dueDate) ? "danger" : "warn"),
    actions("tasks", task.id),
  ]));
}

function renderDocuments() {
  const onlyMissing = document.querySelector("#document-filter").value === "missing";
  const rows = filterText(state.documents).filter((doc) => !onlyMissing || doc.status !== "Abgelegt");
  renderTable("#document-index-table", ["Datum", "Dokument", "Projekt", "Schüler", "Status", ""], rows.map((doc) => [
    formatDate(doc.date),
    `<strong>${escapeHtml(doc.title)}</strong><div class="meta">${escapeHtml(doc.type)} - ${escapeHtml(doc.storageHint || "Kein Ablageort erfasst")}</div>`,
    escapeHtml(projectName(doc.projectId)),
    escapeHtml(studentName(doc.studentId)),
    badge(doc.status, doc.status === "Abgelegt" ? "ok" : doc.status === "Fehlt" ? "danger" : "warn"),
    actions("documents", doc.id),
  ]));

  const studentRows = filterText(state.students).filter((student) => !onlyMissing || missingDocs(student).length);
  renderTable("#documents-table", ["Schüler", "Einverständnis", "Notfallkontakt", "Versicherung", "Status"], studentRows.map((student) => [
    `<strong>${escapeHtml(student.name)}</strong><div class="meta">${student.projectIds.map(projectName).map(escapeHtml).join(", ")}</div>`,
    yesNo(student.documents?.consent),
    yesNo(student.documents?.emergency),
    yesNo(student.documents?.insurance),
    badge(missingDocs(student).length ? "Unvollständig" : "Vollständig", missingDocs(student).length ? "danger" : "ok"),
  ]));
}

function fillSelects() {
  fillProjectSelect("#student-form [name=projectIds]", true);
  fillProjectSelect("#expense-form [name=projectId]");
  fillProjectSelect("#task-form [name=projectId]");
  fillProjectSelect("#document-form [name=projectId]");
  fillProjectSelect("#task-filter", false, "Alle Projekte");
  fillStudentSelect("#expense-form [name=studentId]");
  fillStudentSelect("#document-form [name=studentId]");
}

function fillProjectSelect(selector, multiple = false, emptyLabel = null) {
  const select = document.querySelector(selector);
  const current = multiple ? [...select.selectedOptions].map((option) => option.value) : select.value;
  select.innerHTML = emptyLabel ? `<option value="">${emptyLabel}</option>` : "";
  state.projects.forEach((project) => {
    const option = new Option(project.name, project.id);
    option.selected = multiple ? current.includes(project.id) : current === project.id;
    select.add(option);
  });
}

function fillStudentSelect(selector) {
  const select = document.querySelector(selector);
  const current = select.value;
  select.innerHTML = `<option value="">Ohne Schülerbezug</option>`;
  state.students.forEach((student) => {
    const option = new Option(student.name, student.id);
    option.selected = current === student.id;
    select.add(option);
  });
}

function renderTable(selector, headers, rows) {
  const table = document.querySelector(selector);
  if (!rows.length) {
    table.innerHTML = `<tbody><tr><td>${emptyState()}</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  `;
  table.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editItem(button.dataset.store, button.dataset.id)));
  table.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.store, button.dataset.id)));
}

function renderList(selector, items) {
  document.querySelector(selector).innerHTML = items.length ? items.join("") : emptyState();
}

function projectStatusCard(project) {
  const progress = taskProgress(project.id);
  const tone = budgetRemaining(project.id) < 0 ? "danger" : progress.percent < 50 ? "warn" : "ok";
  return `
    <div class="item">
      <h3><span class="traffic ${tone}"></span> ${escapeHtml(project.name)}</h3>
      <div class="meta">${escapeHtml(project.status)} · ${formatDate(project.startDate)} - ${formatDate(project.endDate)} · Restbudget ${money.format(budgetRemaining(project.id))}</div>
      ${progressHtml(progress)}
    </div>
  `;
}

function kpi(label, value) {
  return `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`;
}

function actions(store, id) {
  return `<div class="row-actions"><button class="small secondary" data-edit data-store="${store}" data-id="${id}">Bearbeiten</button><button class="small danger" data-delete data-store="${store}" data-id="${id}">Löschen</button></div>`;
}

function editItem(store, id) {
  const item = state[store].find((entry) => entry.id === id);
  const form = document.querySelector(`#${store.slice(0, -1)}-form`);
  if (!item || !form) return;

  Object.entries(item).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field instanceof RadioNodeList || field.options) {
      if (field.multiple && Array.isArray(value)) {
        [...field.options].forEach((option) => (option.selected = value.includes(option.value)));
      } else {
        field.value = value;
      }
    } else if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });

  if (store === "students") {
    form.elements.consent.checked = Boolean(item.documents?.consent);
    form.elements.emergency.checked = Boolean(item.documents?.emergency);
    form.elements.insurance.checked = Boolean(item.documents?.insurance);
  }

  state.view = store;
  render();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteItem(store, id) {
  if (!confirm("Eintrag wirklich löschen?")) return;
  if (store === "projects") {
    await cleanupProjectReferences(id);
  }
  if (store === "students") {
    await cleanupStudentReferences(id);
  }
  await remove(store, id);
  await loadState();
  render();
  toast("Gelöscht");
}

async function cleanupProjectReferences(projectId) {
  for (const task of state.tasks.filter((entry) => entry.projectId === projectId)) {
    await remove("tasks", task.id);
  }
  for (const expense of state.expenses.filter((entry) => entry.projectId === projectId)) {
    await remove("expenses", expense.id);
  }
  for (const document of state.documents.filter((entry) => entry.projectId === projectId)) {
    await remove("documents", document.id);
  }
  for (const student of state.students.filter((entry) => entry.projectIds.includes(projectId))) {
    await put("students", { ...student, projectIds: student.projectIds.filter((id) => id !== projectId) });
  }
}

async function cleanupStudentReferences(studentId) {
  for (const expense of state.expenses.filter((entry) => entry.studentId === studentId)) {
    await put("expenses", { ...expense, studentId: "" });
  }
  for (const document of state.documents.filter((entry) => entry.studentId === studentId)) {
    await put("documents", { ...document, studentId: "" });
  }
}

function taskProgress(projectId) {
  const tasks = state.tasks.filter((task) => task.projectId === projectId);
  const done = tasks.filter((task) => task.status === "Erledigt").length;
  return { done, total: tasks.length, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

function progressHtml(progress) {
  return `<div class="progress" aria-label="${progress.percent}% erledigt"><span style="width:${progress.percent}%"></span></div>`;
}

function budgetRemaining(projectId) {
  const project = state.projects.find((entry) => entry.id === projectId);
  const spent = state.expenses.filter((expense) => expense.projectId === projectId).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  return Number(project?.budget || 0) - spent;
}

function filterText(items) {
  if (!state.search) return items;
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(state.search));
}

function projectName(id) {
  return state.projects.find((project) => project.id === id)?.name || "Nicht zugeordnet";
}

function studentName(id) {
  return state.students.find((student) => student.id === id)?.name || "Nicht zugeordnet";
}

function missingDocs(student) {
  const docs = student.documents || {};
  return [
    ["consent", "Einverständnis"],
    ["emergency", "Notfallkontakt"],
    ["insurance", "Versicherung"],
  ].filter(([key]) => !docs[key]).map(([, label]) => label);
}

function documentBadges(student) {
  return [
    ["Einverständnis", student.documents?.consent],
    ["Notfall", student.documents?.emergency],
    ["Versicherung", student.documents?.insurance],
  ].map(([label, ok]) => badge(label, ok ? "ok" : "danger")).join(" ");
}

function yesNo(value) {
  return badge(value ? "Vorhanden" : "Fehlt", value ? "ok" : "danger");
}

function badge(text, tone = "") {
  return `<span class="badge ${tone}">${escapeHtml(text)}</span>`;
}

function statusTone(status) {
  return status === "Aktiv" ? "ok" : status === "Abrechnung" ? "warn" : "";
}

function isOverdue(date) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

function formatDate(date) {
  return date ? dateFmt.format(new Date(date)) : "-";
}

function sortByName(a, b) {
  return (a.name || "").localeCompare(b.name || "", "de");
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyState() {
  return document.querySelector("#empty-state").innerHTML;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function toast(message) {
  const toastEl = document.querySelector("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2400);
}

// Export/Import der IndexedDB-Inhalte als Backup-Datei.
function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    data: Object.fromEntries(STORES.map((store) => [store, state[store]])),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `erasmus-plus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData() {
  const file = document.querySelector("#import-file").files[0];
  if (!file) {
    toast("Bitte Backup-Datei auswählen");
    return;
  }
  if (!confirm("Import ersetzt alle lokalen Daten. Fortfahren?")) return;

  const payload = JSON.parse(await file.text());
  for (const store of STORES) {
    await clearStore(store);
    for (const item of payload.data?.[store] || []) {
      await put(store, item);
    }
  }
  await loadState();
  render();
  toast("Import abgeschlossen");
}

async function seedData() {
  const ids = {
    p1: createId(),
    p2: createId(),
    s1: createId(),
    s2: createId(),
  };
  const seed = {
    projects: [
      { id: ids.p1, name: "Brücken nach Valencia", action: "KA1", partners: "Spanien - IES Valencia", startDate: "2026-10-01", endDate: "2027-03-31", budget: 18500, status: "Aktiv" },
      { id: ids.p2, name: "Green Schools Network", action: "KA2", partners: "Finnland - Helsinki Upper School; Italien - Liceo Verona", startDate: "2027-02-10", endDate: "2027-09-30", budget: 42000, status: "Geplant" },
    ],
    students: [
      { id: ids.s1, name: "Mila Schneider", className: "10b", birthDate: "2010-04-12", projectIds: [ids.p1], role: "Teilnehmer", documentStatus: "Vollständig", documents: { consent: true, emergency: true, insurance: true } },
      { id: ids.s2, name: "Jonas Weber", className: "9a", birthDate: "2011-08-25", projectIds: [ids.p1, ids.p2], role: "Nachrücker", documentStatus: "Unvollständig", documents: { consent: true, emergency: false, insurance: false } },
    ],
    expenses: [
      { id: createId(), projectId: ids.p1, studentId: ids.s1, category: "Reisekosten", amount: 390, date: "2026-10-15", receiptStatus: "Vorhanden", note: "Flug Frankfurt-Valencia" },
      { id: createId(), projectId: ids.p1, studentId: ids.s2, category: "Taschengeld", amount: 120, date: "2026-10-16", receiptStatus: "Fehlend", note: "" },
    ],
    tasks: [
      { id: createId(), projectId: ids.p1, title: "Flüge gebucht", dueDate: "2026-09-25", status: "Erledigt", priority: "Hoch" },
      { id: createId(), projectId: ids.p1, title: "Mobilitätsbericht einreichen", dueDate: "2027-04-15", status: "Offen", priority: "Normal" },
      { id: createId(), projectId: ids.p2, title: "Partnervertrag prüfen", dueDate: "2027-01-10", status: "In Arbeit", priority: "Hoch" },
    ],
    documents: [
      { id: createId(), title: "Einverständnis Mila Schneider", type: "Einverständniserklärung", projectId: ids.p1, studentId: ids.s1, date: "2026-09-08", status: "Abgelegt", storageHint: "Ordner Valencia / Mila-Schneider.pdf" },
      { id: createId(), title: "Versicherungsnachweis Jonas Weber", type: "Versicherung", projectId: ids.p1, studentId: ids.s2, date: "2026-09-10", status: "Fehlt", storageHint: "" },
    ],
  };

  for (const store of STORES) {
    for (const item of seed[store]) {
      await put(store, item);
    }
  }
  await loadState();
  render();
  toast("Beispieldaten geladen");
}
