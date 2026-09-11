const DB_NAME = "erasmus_plus_management";
const DB_VERSION = 6;
const STORES = ["projects", "students", "expenses", "tasks", "documents", "users", "settings", "institutions", "fundingBudgets"];
const SESSION_KEY = "erasmus_plus_management_user";
const DEFAULT_SETTINGS = {
  leadActions: ["KA1", "KA2", "KA3"],
  expenseCategories: ["Reisekosten", "Unterkunft", "Verpflegung", "Taschengeld", "Sonstiges"],
  documentTypes: ["Einverständniserklärung", "Notfallkontakt", "Versicherung", "Beleg", "Vertrag", "Bericht", "Sonstiges"],
};

const state = {
  projects: [],
  students: [],
  expenses: [],
  tasks: [],
  documents: [],
  users: [],
  settings: { ...DEFAULT_SETTINGS },
  institutions: [],
  fundingBudgets: [],
  currentUser: null,
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
  bindAuth();
  ensureAuth();
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
  const [projects, students, expenses, tasks, documents, users, settings, institutions, fundingBudgets] = await Promise.all(STORES.map(getAll));
  state.projects = projects.sort(sortByName);
  state.students = students.sort(sortByName);
  state.expenses = expenses.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  state.tasks = tasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  state.documents = documents.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  state.users = users.sort(sortByName);
  state.settings = settings.reduce((config, item) => ({ ...config, [item.id]: item.values || [] }), { ...DEFAULT_SETTINGS });
  state.institutions = institutions.sort(sortByName);
  state.fundingBudgets = fundingBudgets.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  if (state.currentUser) {
    state.currentUser = state.users.find((user) => user.id === state.currentUser.id && user.status === "Aktiv") || null;
  }
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
  document.querySelector("#user-form").addEventListener("submit", onUserSubmit);
  document.querySelector("#institution-form").addEventListener("submit", onInstitutionSubmit);
  document.querySelector("#fundingBudget-form").addEventListener("submit", onFundingBudgetSubmit);
  document.querySelectorAll("[data-setting-form]").forEach((form) => form.addEventListener("submit", onSettingSubmit));
  document.querySelectorAll("[data-reset-form]").forEach((button) => {
    button.addEventListener("click", () => {
      resetForm(button.dataset.resetForm);
    });
  });
}

function resetForm(formId) {
  const form = document.querySelector(`#${formId}`);
  form.reset();
  form.querySelector("[name=id]").value = "";
  if (formId === "user-form") {
    document.querySelector("#user-form-title").textContent = "Benutzer anlegen";
    form.elements.password.placeholder = "Pflicht bei neuem Benutzer";
  }
  if (formId === "institution-form") {
    form.elements.visible.checked = true;
  }
}

function bindAuth() {
  document.querySelector("#setup-form").addEventListener("submit", onSetupSubmit);
  document.querySelector("#login-form").addEventListener("submit", onLoginSubmit);
  document.querySelector("#logout").addEventListener("click", logout);
}

function bindFilters() {
  ["dashboard-status-filter", "project-filter", "student-filter", "receipt-filter", "task-filter", "document-filter", "user-role-filter", "user-status-filter"].forEach((id) => {
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
  if (data.fundingBudgetId) {
    const fundingBudget = state.fundingBudgets.find((budget) => budget.id === data.fundingBudgetId);
    if (!fundingBudget) {
      toast("Förderbudget wurde nicht gefunden");
      return;
    }
    if (new Date(data.startDate) < new Date(fundingBudget.startDate) || new Date(data.endDate) > new Date(fundingBudget.endDate)) {
      toast("Projektzeitraum muss im Zeitraum des Förderbudgets liegen");
      return;
    }
    const assigned = fundingBudgetAssigned(fundingBudget.id, data.id || null) + Number(data.budget || 0);
    if (assigned > Number(fundingBudget.amount || 0)) {
      toast("Projektbudget überschreitet das verfügbare Förderbudget");
      return;
    }
  }

  await persist("projects", {
    id: data.id || createId(),
    name: data.name.trim(),
    action: data.action,
    institutionIds: [...form.elements.institutionIds.selectedOptions].map((option) => option.value),
    fundingBudgetId: data.fundingBudgetId,
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
    documents: Object.fromEntries(getSettingValues("documentTypes").map((type) => [type, data.getAll("requiredDocuments").includes(type)])),
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

async function onUserSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen Benutzer verwalten");
    return;
  }

  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const existing = data.id ? state.users.find((user) => user.id === data.id) : null;
  const normalizedEmail = data.email.trim().toLowerCase();
  const duplicate = state.users.find((user) => user.email.toLowerCase() === normalizedEmail && user.id !== data.id);

  if (duplicate) {
    toast("Diese E-Mail ist bereits vergeben");
    return;
  }
  if (!existing && data.password.length < 8) {
    toast("Passwort braucht mindestens 8 Zeichen");
    return;
  }
  if (existing && existing.id === state.currentUser.id && data.status !== "Aktiv") {
    toast("Der eigene Benutzer kann nicht gesperrt werden");
    return;
  }
  if (existing && existing.role === "Admin" && data.role !== "Admin" && activeAdmins().length === 1) {
    toast("Der letzte aktive Admin muss Admin bleiben");
    return;
  }

  const passwordFields = data.password ? await createPasswordFields(data.password) : {};
  await persist("users", {
    ...existing,
    id: data.id || createId(),
    name: data.name.trim(),
    email: normalizedEmail,
    role: data.role,
    status: data.status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    ...passwordFields,
  });
  resetForm("user-form");
}

async function onInstitutionSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen Partnereinrichtungen verwalten");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = data.get("id") || createId();
  const existing = state.institutions.find((institution) => institution.id === id);
  await persist("institutions", {
    ...existing,
    id,
    name: data.get("name").trim(),
    country: data.get("country").trim(),
    city: data.get("city").trim(),
    type: data.get("type"),
    note: data.get("note").trim(),
    visible: data.has("visible"),
    createdAt: existing?.createdAt || new Date().toISOString(),
  });
  resetForm("institution-form");
}

async function onFundingBudgetSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderbudgets verwalten");
    return;
  }
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  if (new Date(data.endDate) < new Date(data.startDate)) {
    toast("Enddatum darf nicht vor dem Startdatum liegen");
    return;
  }
  const linkedProjects = state.projects.filter((project) => project.fundingBudgetId === data.id);
  if (linkedProjects.some((project) => new Date(project.startDate) < new Date(data.startDate) || new Date(project.endDate) > new Date(data.endDate))) {
    toast("Bestehende Projekte liegen außerhalb dieses Förderzeitraums");
    return;
  }
  const assigned = linkedProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  if (assigned > Number(data.amount || 0)) {
    toast("Gesamtbudget ist kleiner als bereits zugewiesene Projektbudgets");
    return;
  }
  await persist("fundingBudgets", {
    id: data.id || createId(),
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    durationMonths: Number(data.durationMonths),
    amount: Number(data.amount),
    status: data.status,
    note: data.note.trim(),
  });
  form.reset();
}

async function onSetupSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  if (state.users.length) {
    toast("Die Ersteinrichtung ist bereits abgeschlossen");
    return;
  }
  const passwordFields = await createPasswordFields(data.password);
  const user = {
    id: createId(),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: "Admin",
    status: "Aktiv",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...passwordFields,
  };
  await put("users", user);
  await loadState();
  loginAs(user);
  form.reset();
  render();
  toast("Admin wurde angelegt");
}

async function onLoginSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const user = state.users.find((entry) => entry.email.toLowerCase() === data.email.trim().toLowerCase());
  if (!user || user.status !== "Aktiv" || !(await verifyPassword(data.password, user))) {
    toast("Login fehlgeschlagen");
    return;
  }
  user.lastLoginAt = new Date().toISOString();
  await put("users", user);
  await loadState();
  loginAs(user);
  form.reset();
  render();
}

async function onSettingSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen Stammdaten ändern");
    return;
  }
  const form = event.currentTarget;
  const key = form.dataset.settingForm;
  const value = new FormData(form).get("value").trim();
  const values = getSettingValues(key);
  if (values.some((item) => item.toLowerCase() === value.toLowerCase())) {
    toast("Eintrag ist bereits vorhanden");
    return;
  }
  await saveSetting(key, [...values, value].sort((a, b) => a.localeCompare(b, "de")));
  form.reset();
}

function render() {
  renderAuth();
  if (!state.currentUser) return;
  if (state.view === "admin" && !isAdmin()) state.view = "dashboard";
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === state.view));
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.hidden = item.hasAttribute("data-admin-only") && !isAdmin();
    item.classList.toggle("active", item.dataset.view === state.view);
  });
  document.querySelector("#page-title").textContent = document.querySelector(`[data-view="${state.view}"]`).textContent;
  document.querySelector("#current-user").textContent = `${state.currentUser.name} · ${state.currentUser.role}`;
  fillSelects();
  renderDashboard();
  renderProjects();
  renderStudents();
  renderExpenses();
  renderTasks();
  renderDocuments();
  renderUsers();
  renderFundingBudgets();
  renderInstitutions();
  renderSettings();
}

function renderDashboard() {
  const activeProjects = state.projects.filter((project) => project.status === "Aktiv");
  const openTasks = state.tasks.filter((task) => task.status !== "Erledigt");
  const travellingStudents = state.students.filter((student) => student.role === "Teilnehmer").length;
  const remainingBudget = state.projects.reduce((sum, project) => sum + budgetRemaining(project.id), 0);
  const fundingRemaining = state.fundingBudgets.reduce((sum, budget) => sum + fundingBudgetRemaining(budget.id), 0);

  document.querySelector("#kpi-grid").innerHTML = [
    kpi("Aktive Projekte", activeProjects.length),
    kpi("Projekt-Restbudgets", money.format(remainingBudget)),
    kpi("Fördermittel Rest", money.format(fundingRemaining)),
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
  renderTable("#projects-table", ["Projekt", "Zeitraum", "Budget", "Fördertopf", "Status", "Fortschritt", ""], rows.map((project) => [
    `<strong>${escapeHtml(project.name)}</strong><div class="meta">${escapeHtml(project.action)} · ${projectInstitutionNames(project)}${project.partners ? `<br>${escapeHtml(project.partners)}` : ""}</div>`,
    `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
    `${money.format(project.budget)}<div class="meta">Rest ${money.format(budgetRemaining(project.id))}</div>`,
    escapeHtml(fundingBudgetName(project.fundingBudgetId)),
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
  const documentTypes = getSettingValues("documentTypes");
  renderTable("#documents-table", ["Schüler", ...documentTypes, "Status"], studentRows.map((student) => [
    `<strong>${escapeHtml(student.name)}</strong><div class="meta">${student.projectIds.map(projectName).map(escapeHtml).join(", ")}</div>`,
    ...documentTypes.map((type) => yesNo(hasDocument(student, type))),
    badge(missingDocs(student).length ? "Unvollständig" : "Vollständig", missingDocs(student).length ? "danger" : "ok"),
  ]));
}

function renderUsers() {
  if (!isAdmin()) return;
  const roleFilter = document.querySelector("#user-role-filter").value;
  const statusFilter = document.querySelector("#user-status-filter").value;
  const users = filterText(state.users)
    .filter((user) => !roleFilter || user.role === roleFilter)
    .filter((user) => !statusFilter || user.status === statusFilter);
  const activeCount = state.users.filter((user) => user.status === "Aktiv").length;
  const adminCount = activeAdmins().length;
  const lockedCount = state.users.filter((user) => user.status === "Gesperrt").length;

  document.querySelector("#admin-user-kpis").innerHTML = [
    kpi("Benutzer gesamt", state.users.length),
    kpi("Aktiv", activeCount),
    kpi("Admins", adminCount),
    kpi("Gesperrt", lockedCount),
  ].join("");

  renderTable("#users-table", ["Name", "E-Mail", "Rolle", "Status", "Angelegt", "Letzter Login", ""], users.map((user) => [
    `<strong>${escapeHtml(user.name)}</strong>${user.id === state.currentUser.id ? `<div class="meta">Aktueller Benutzer</div>` : ""}`,
    escapeHtml(user.email),
    badge(user.role, user.role === "Admin" ? "ok" : ""),
    badge(user.status, user.status === "Aktiv" ? "ok" : "danger"),
    formatDate(user.createdAt),
    formatDate(user.lastLoginAt),
    userActions(user),
  ]));
}

function userActions(user) {
  const canDelete = user.id !== state.currentUser.id && !(user.role === "Admin" && activeAdmins().length === 1);
  const canToggle = user.id !== state.currentUser.id && !(user.role === "Admin" && user.status === "Aktiv" && activeAdmins().length === 1);
  const toggleLabel = user.status === "Aktiv" ? "Sperren" : "Entsperren";
  return `
    <div class="row-actions">
      <button class="small secondary" data-edit data-store="users" data-id="${user.id}">Bearbeiten</button>
      <button class="small secondary" data-user-toggle="${user.id}" ${canToggle ? "" : "disabled"}>${toggleLabel}</button>
      <button class="small danger" data-delete data-store="users" data-id="${user.id}" ${canDelete ? "" : "disabled"}>Löschen</button>
    </div>
  `;
}

function renderInstitutions() {
  if (!isAdmin()) return;
  renderTable("#institutions-table", ["Name", "Land/Ort", "Typ", "Sichtbarkeit", "Verknüpft", ""], state.institutions.map((institution) => [
    `<strong>${escapeHtml(institution.name)}</strong><div class="meta">${escapeHtml(institution.note || "")}</div>`,
    `${escapeHtml(institution.country)}${institution.city ? ` / ${escapeHtml(institution.city)}` : ""}`,
    escapeHtml(institution.type),
    badge(institution.visible === false ? "Ausgeblendet" : "Sichtbar", institution.visible === false ? "warn" : "ok"),
    String(state.projects.filter((project) => (project.institutionIds || []).includes(institution.id)).length),
    institutionActions(institution),
  ]));
}

function renderFundingBudgets() {
  if (!isAdmin()) return;
  renderTable("#funding-budgets-table", ["Name", "Zeitraum", "Laufzeit", "Budget", "Zugewiesen", "Rest", "Status", ""], state.fundingBudgets.map((budget) => [
    `<strong>${escapeHtml(budget.name)}</strong><div class="meta">${escapeHtml(budget.note || "")}</div>`,
    `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`,
    `${Number(budget.durationMonths || 0)} Monate`,
    money.format(Number(budget.amount || 0)),
    money.format(fundingBudgetAssigned(budget.id)),
    money.format(fundingBudgetRemaining(budget.id)),
    badge(budget.status || "Aktiv", budget.status === "Inaktiv" ? "warn" : "ok"),
    fundingBudgetActions(budget),
  ]));
}

function fundingBudgetActions(budget) {
  const toggleLabel = budget.status === "Inaktiv" ? "Aktivieren" : "Deaktivieren";
  return `
    <div class="row-actions">
      <button class="small secondary" data-edit data-store="fundingBudgets" data-id="${budget.id}">Bearbeiten</button>
      <button class="small secondary" data-funding-budget-toggle="${budget.id}">${toggleLabel}</button>
    </div>
  `;
}

function institutionActions(institution) {
  const toggleLabel = institution.visible === false ? "Einblenden" : "Ausblenden";
  return `
    <div class="row-actions">
      <button class="small secondary" data-edit data-store="institutions" data-id="${institution.id}">Bearbeiten</button>
      <button class="small secondary" data-institution-toggle="${institution.id}">${toggleLabel}</button>
    </div>
  `;
}

function renderSettings() {
  if (!isAdmin()) return;
  renderSettingList("expenseCategories", "#expense-categories-list", (value) => state.expenses.some((expense) => expense.category === value));
  renderSettingList("documentTypes", "#document-types-list", (value) => state.documents.some((doc) => doc.type === value));
  renderSettingList("leadActions", "#lead-actions-list", (value) => state.projects.some((project) => project.action === value));
}

function renderSettingList(key, selector, isUsed) {
  const values = getSettingValues(key);
  document.querySelector(selector).innerHTML = values.map((value) => `
    <span class="chip">
      ${escapeHtml(value)}
      <button type="button" title="Entfernen" data-setting-delete="${key}" data-value="${escapeHtml(value)}" ${isUsed(value) ? "disabled" : ""}>x</button>
    </span>
  `).join("");
  document.querySelectorAll(`[data-setting-delete="${key}"]`).forEach((button) => {
    button.addEventListener("click", () => deleteSettingValue(key, button.dataset.value));
  });
}

function renderAuth() {
  const hasUsers = state.users.length > 0;
  document.body.classList.toggle("auth-locked", !state.currentUser);
  document.querySelector("#auth-screen").hidden = Boolean(state.currentUser);
  document.querySelector("#setup-form").hidden = hasUsers;
  document.querySelector("#login-form").hidden = !hasUsers;
}

function ensureAuth() {
  const sessionUserId = sessionStorage.getItem(SESSION_KEY);
  state.currentUser = state.users.find((user) => user.id === sessionUserId && user.status === "Aktiv") || null;
}

function loginAs(user) {
  sessionStorage.setItem(SESSION_KEY, user.id);
  state.currentUser = user;
  document.body.classList.remove("auth-locked");
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  state.currentUser = null;
  state.view = "dashboard";
  render();
}

function isAdmin() {
  return state.currentUser?.role === "Admin";
}

function activeAdmins() {
  return state.users.filter((user) => user.role === "Admin" && user.status === "Aktiv");
}

async function toggleUserStatus(id) {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Benutzer verwalten");
    return;
  }
  const user = state.users.find((entry) => entry.id === id);
  if (!user) return;
  if (user.id === state.currentUser.id) {
    toast("Der eigene Benutzer kann nicht gesperrt werden");
    return;
  }
  if (user.role === "Admin" && user.status === "Aktiv" && activeAdmins().length === 1) {
    toast("Der letzte aktive Admin kann nicht gesperrt werden");
    return;
  }
  await persist("users", {
    ...user,
    status: user.status === "Aktiv" ? "Gesperrt" : "Aktiv",
  });
}

function getSettingValues(key) {
  return state.settings[key]?.length ? state.settings[key] : DEFAULT_SETTINGS[key] || [];
}

async function saveSetting(key, values) {
  await put("settings", { id: key, values });
  await loadState();
  render();
  toast("Stammdaten gespeichert");
}

async function deleteSettingValue(key, value) {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Stammdaten ändern");
    return;
  }
  if (settingValueInUse(key, value)) {
    toast("Eintrag wird noch verwendet");
    return;
  }
  const next = getSettingValues(key).filter((item) => item !== value);
  if (!next.length) {
    toast("Mindestens ein Eintrag muss bleiben");
    return;
  }
  await saveSetting(key, next);
}

function settingValueInUse(key, value) {
  if (key === "expenseCategories") return state.expenses.some((expense) => expense.category === value);
  if (key === "documentTypes") return state.documents.some((doc) => doc.type === value) || state.students.some((student) => Object.prototype.hasOwnProperty.call(student.documents || {}, value));
  if (key === "leadActions") return state.projects.some((project) => project.action === value);
  return false;
}

async function toggleInstitution(id) {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Partnereinrichtungen verwalten");
    return;
  }
  const institution = state.institutions.find((entry) => entry.id === id);
  if (!institution) return;
  await persist("institutions", { ...institution, visible: institution.visible === false });
}

async function toggleFundingBudget(id) {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderbudgets verwalten");
    return;
  }
  const budget = state.fundingBudgets.find((entry) => entry.id === id);
  if (!budget) return;
  await persist("fundingBudgets", { ...budget, status: budget.status === "Inaktiv" ? "Aktiv" : "Inaktiv" });
}

function institutionName(id) {
  const institution = state.institutions.find((entry) => entry.id === id);
  if (!institution) return "Unbekannte Partnereinrichtung";
  return `${institution.name} (${institution.country})${institution.visible === false ? " [ausgeblendet]" : ""}`;
}

function projectInstitutionNames(project) {
  const ids = project.institutionIds || [];
  if (!ids.length) return escapeHtml(project.partners || "Keine Partnereinrichtungen erfasst");
  return ids.map(institutionName).map(escapeHtml).join(", ");
}

function fundingBudgetName(id) {
  if (!id) return "Nicht zugeordnet";
  const budget = state.fundingBudgets.find((entry) => entry.id === id);
  if (!budget) return "Unbekanntes Förderbudget";
  return `${budget.name}${budget.status === "Inaktiv" ? " [inaktiv]" : ""}`;
}

function fundingBudgetAssigned(id, excludeProjectId = null) {
  return state.projects
    .filter((project) => project.fundingBudgetId === id && project.id !== excludeProjectId)
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
}

function fundingBudgetRemaining(id) {
  const budget = state.fundingBudgets.find((entry) => entry.id === id);
  return Number(budget?.amount || 0) - fundingBudgetAssigned(id);
}

function fillSelects() {
  fillOptionSelect("#project-form [name=action]", getSettingValues("leadActions"), "Bitte wählen");
  fillOptionSelect("#expense-form [name=category]", getSettingValues("expenseCategories"));
  fillOptionSelect("#document-form [name=type]", getSettingValues("documentTypes"));
  renderRequiredDocumentFields();
  fillInstitutionSelect();
  fillFundingBudgetSelect();
  fillProjectSelect("#student-form [name=projectIds]", true);
  fillProjectSelect("#expense-form [name=projectId]");
  fillProjectSelect("#task-form [name=projectId]");
  fillProjectSelect("#document-form [name=projectId]");
  fillProjectSelect("#task-filter", false, "Alle Projekte");
  fillStudentSelect("#expense-form [name=studentId]");
  fillStudentSelect("#document-form [name=studentId]");
}

function fillFundingBudgetSelect(selectedId = null) {
  const select = document.querySelector("#project-form [name=fundingBudgetId]");
  const selected = selectedId ?? select.value;
  select.innerHTML = `<option value="">Kein Förderbudget zugeordnet</option>`;
  state.fundingBudgets
    .filter((budget) => budget.status !== "Inaktiv" || budget.id === selected)
    .forEach((budget) => {
      const label = `${budget.name} · ${formatDate(budget.startDate)}-${formatDate(budget.endDate)} · Rest ${money.format(fundingBudgetRemaining(budget.id))}${budget.status === "Inaktiv" ? " · inaktiv" : ""}`;
      const option = new Option(label, budget.id);
      option.selected = selected === budget.id;
      select.add(option);
    });
}

function fillInstitutionSelect(selectedIds = null) {
  const select = document.querySelector("#project-form [name=institutionIds]");
  const selected = selectedIds || [...select.selectedOptions].map((option) => option.value);
  select.innerHTML = "";
  state.institutions
    .filter((institution) => institution.visible !== false || selected.includes(institution.id))
    .forEach((institution) => {
      const label = `${institution.name} (${institution.country}${institution.city ? `, ${institution.city}` : ""})${institution.visible === false ? " - ausgeblendet" : ""}`;
      const option = new Option(label, institution.id);
      option.selected = selected.includes(institution.id);
      select.add(option);
    });
}

function renderRequiredDocumentFields() {
  const container = document.querySelector("#required-document-fields");
  const checked = [...container.querySelectorAll("[name=requiredDocuments]:checked")].map((input) => input.value);
  container.innerHTML = getSettingValues("documentTypes").map((type) => `
    <label class="check"><input type="checkbox" name="requiredDocuments" value="${escapeHtml(type)}" ${checked.includes(type) ? "checked" : ""} /> ${escapeHtml(type)}</label>
  `).join("");
}

function fillOptionSelect(selector, values, emptyLabel = null) {
  const select = document.querySelector(selector);
  const current = select.value;
  select.innerHTML = emptyLabel ? `<option value="">${emptyLabel}</option>` : "";
  values.forEach((value) => {
    const option = new Option(value, value);
    option.selected = current === value;
    select.add(option);
  });
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
  table.querySelectorAll("[data-institution-toggle]").forEach((button) => button.addEventListener("click", () => toggleInstitution(button.dataset.institutionToggle)));
  table.querySelectorAll("[data-user-toggle]").forEach((button) => button.addEventListener("click", () => toggleUserStatus(button.dataset.userToggle)));
  table.querySelectorAll("[data-funding-budget-toggle]").forEach((button) => button.addEventListener("click", () => toggleFundingBudget(button.dataset.fundingBudgetToggle)));
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
  if (!item) return;

  state.view = store;
  render();

  const form = document.querySelector(`#${store.slice(0, -1)}-form`);
  if (!form) return;

  if (store === "projects") {
    fillInstitutionSelect(item.institutionIds || []);
    fillFundingBudgetSelect(item.fundingBudgetId || "");
  }

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
    form.querySelectorAll("[name=requiredDocuments]").forEach((input) => {
      input.checked = hasDocument(item, input.value);
    });
  }

  if (store === "users") {
    document.querySelector("#user-form-title").textContent = "Benutzer bearbeiten";
    form.elements.password.value = "";
    form.elements.password.placeholder = "Leer lassen, wenn unverändert";
  }

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteItem(store, id) {
  if (!confirm("Eintrag wirklich löschen?")) return;
  if (store === "institutions") {
    await toggleInstitution(id);
    return;
  }
  if (store === "fundingBudgets") {
    await toggleFundingBudget(id);
    return;
  }
  if (store === "users") {
    const user = state.users.find((entry) => entry.id === id);
    if (!isAdmin()) {
      toast("Nur Admins dürfen Benutzer löschen");
      return;
    }
    if (id === state.currentUser.id) {
      toast("Der eigene Benutzer kann nicht gelöscht werden");
      return;
    }
    if (user?.role === "Admin" && activeAdmins().length === 1) {
      toast("Der letzte aktive Admin kann nicht gelöscht werden");
      return;
    }
  }
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
  return getSettingValues("documentTypes").filter((type) => !hasDocument(student, type));
}

function documentBadges(student) {
  return getSettingValues("documentTypes").map((type) => badge(type, hasDocument(student, type) ? "ok" : "danger")).join(" ");
}

function hasDocument(student, type) {
  const docs = student.documents || {};
  const legacy = {
    "Einverständniserklärung": "consent",
    "Notfallkontakt": "emergency",
    "Versicherung": "insurance",
  };
  return Boolean(docs[type] ?? docs[legacy[type]]);
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

// Lokale Passwortspeicherung: Es wird nur Salt + PBKDF2-Hash in IndexedDB abgelegt,
// niemals das Klartextpasswort. In einer statischen Browser-App bleibt das ein lokaler Schutz.
async function createPasswordFields(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToBase64(saltBytes);
  return {
    passwordSalt: salt,
    passwordHash: await hashPassword(password, salt),
    passwordUpdatedAt: new Date().toISOString(),
  };
}

async function verifyPassword(password, user) {
  if (!user.passwordSalt || !user.passwordHash) return false;
  return (await hashPassword(password, user.passwordSalt)) === user.passwordHash;
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
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
  const hasUserBackup = Array.isArray(payload.data?.users);
  const importedUsers = hasUserBackup ? payload.data.users : [];
  if (hasUserBackup && !importedUsers.some((user) => user.role === "Admin" && user.status === "Aktiv")) {
    toast("Import braucht mindestens einen aktiven Admin");
    return;
  }
  for (const store of STORES) {
    if (store === "users" && !hasUserBackup) continue;
    await clearStore(store);
    for (const item of payload.data?.[store] || []) {
      await put(store, item);
    }
  }
  await loadState();
  ensureAuth();
  render();
  toast("Import abgeschlossen");
}

async function seedData() {
  const ids = {
    p1: createId(),
    p2: createId(),
    s1: createId(),
    s2: createId(),
    i1: createId(),
    i2: createId(),
    i3: createId(),
    f1: createId(),
    f2: createId(),
  };
  const seed = {
    fundingBudgets: [
      { id: ids.f1, name: "Erasmus+ Förderbudget 2026/27", startDate: "2026-09-01", endDate: "2027-11-30", durationMonths: 15, amount: 65000, status: "Aktiv", note: "Kurzlaufzeit fuer Mobilitaeten und Abschlussbericht" },
      { id: ids.f2, name: "Erasmus+ Förderbudget 2027/29", startDate: "2027-01-01", endDate: "2028-12-31", durationMonths: 24, amount: 98000, status: "Aktiv", note: "Mehrjaehrige Projektlinie" },
    ],
    institutions: [
      { id: ids.i1, name: "IES Valencia", country: "Spanien", city: "Valencia", type: "Schule", note: "Koordination: International Office", visible: true },
      { id: ids.i2, name: "Helsinki Upper School", country: "Finnland", city: "Helsinki", type: "Schule", note: "", visible: true },
      { id: ids.i3, name: "Liceo Verona", country: "Italien", city: "Verona", type: "Schule", note: "", visible: true },
    ],
    projects: [
      { id: ids.p1, name: "Brücken nach Valencia", action: "KA1", institutionIds: [ids.i1], fundingBudgetId: ids.f1, partners: "Austauschgruppe Klasse 10", startDate: "2026-10-01", endDate: "2027-03-31", budget: 18500, status: "Aktiv" },
      { id: ids.p2, name: "Green Schools Network", action: "KA2", institutionIds: [ids.i2, ids.i3], fundingBudgetId: ids.f2, partners: "Nachhaltigkeitsprojekt mit zwei Partnerschulen", startDate: "2027-02-10", endDate: "2027-09-30", budget: 42000, status: "Geplant" },
    ],
    students: [
      { id: ids.s1, name: "Mila Schneider", className: "10b", birthDate: "2010-04-12", projectIds: [ids.p1], role: "Teilnehmer", documentStatus: "Vollständig", documents: { "Einverständniserklärung": true, Notfallkontakt: true, Versicherung: true, Beleg: true, Vertrag: true, Bericht: true, Sonstiges: true } },
      { id: ids.s2, name: "Jonas Weber", className: "9a", birthDate: "2011-08-25", projectIds: [ids.p1, ids.p2], role: "Nachrücker", documentStatus: "Unvollständig", documents: { "Einverständniserklärung": true, Notfallkontakt: false, Versicherung: false, Beleg: true, Vertrag: true, Bericht: false, Sonstiges: true } },
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
    settings: Object.entries(DEFAULT_SETTINGS).map(([id, values]) => ({ id, values })),
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
