const DB_NAME = "erasmus_plus_management";
const DB_VERSION = 6;
const STORES = ["projects", "students", "expenses", "tasks", "documents", "users", "settings", "institutions", "fundingBudgets"];
const SESSION_KEY = "erasmus_plus_management_user";
const DEFAULT_SETTINGS = {
  leadActions: ["KA1", "KA2", "KA3"],
  expenseCategories: ["Reisekosten", "Unterkunft", "Verpflegung", "Taschengeld", "Sonstiges"],
  documentTypes: ["Einverständniserklärung", "Notfallkontakt", "Versicherung", "Beleg", "Vertrag", "Bericht", "Sonstiges"],
};
const GRANT_SOURCE = "Erasmus+ Programme Guide 2026 / PAD Dokumentencenter Anhang 3";
const COUNTRY_GRANT_GROUPS = {
  "Österreich": { group: 1, dailyMin: 48, dailyMax: 85 },
  Belgien: { group: 1, dailyMin: 48, dailyMax: 85 },
  Dänemark: { group: 1, dailyMin: 48, dailyMax: 85 },
  Finnland: { group: 1, dailyMin: 48, dailyMax: 85 },
  Frankreich: { group: 1, dailyMin: 48, dailyMax: 85 },
  Deutschland: { group: 1, dailyMin: 48, dailyMax: 85 },
  Island: { group: 1, dailyMin: 48, dailyMax: 85 },
  Italien: { group: 1, dailyMin: 48, dailyMax: 85 },
  Liechtenstein: { group: 1, dailyMin: 48, dailyMax: 85 },
  Luxemburg: { group: 1, dailyMin: 48, dailyMax: 85 },
  Niederlande: { group: 1, dailyMin: 48, dailyMax: 85 },
  Norwegen: { group: 1, dailyMin: 48, dailyMax: 85 },
  Schweden: { group: 1, dailyMin: 48, dailyMax: 85 },
  Zypern: { group: 2, dailyMin: 41, dailyMax: 74 },
  Tschechien: { group: 2, dailyMin: 41, dailyMax: 74 },
  Estland: { group: 2, dailyMin: 41, dailyMax: 74 },
  Griechenland: { group: 2, dailyMin: 41, dailyMax: 74 },
  Lettland: { group: 2, dailyMin: 41, dailyMax: 74 },
  Malta: { group: 2, dailyMin: 41, dailyMax: 74 },
  Portugal: { group: 2, dailyMin: 41, dailyMax: 74 },
  Slowakei: { group: 2, dailyMin: 41, dailyMax: 74 },
  Slowenien: { group: 2, dailyMin: 41, dailyMax: 74 },
  Spanien: { group: 2, dailyMin: 41, dailyMax: 74 },
  Bulgarien: { group: 3, dailyMin: 36, dailyMax: 64 },
  Kroatien: { group: 3, dailyMin: 36, dailyMax: 64 },
  Ungarn: { group: 3, dailyMin: 36, dailyMax: 64 },
  Polen: { group: 3, dailyMin: 36, dailyMax: 64 },
  Rumänien: { group: 3, dailyMin: 36, dailyMax: 64 },
  Serbien: { group: 3, dailyMin: 36, dailyMax: 64 },
  Nordmazedonien: { group: 3, dailyMin: 36, dailyMax: 64 },
  Türkei: { group: 3, dailyMin: 36, dailyMax: 64 },
};
const TRAVEL_GRANT_BANDS = [
  { id: "10-99", label: "10-99 km", green: 56, standard: 28 },
  { id: "100-499", label: "100-499 km", green: 285, standard: 211 },
  { id: "500-1999", label: "500-1999 km", green: 417, standard: 309 },
  { id: "2000-2999", label: "2000-2999 km", green: 535, standard: 395 },
  { id: "3000-3999", label: "3000-3999 km", green: 785, standard: 580 },
  { id: "4000-7999", label: "4000-7999 km", green: 1180, standard: 1180 },
  { id: "8000+", label: "8000 km oder mehr", green: 1735, standard: 1735 },
];
const FORM_BY_STORE = {
  projects: "project-form",
  students: "student-form",
  expenses: "expense-form",
  tasks: "task-form",
  documents: "document-form",
  users: "user-form",
  institutions: "institution-form",
  fundingBudgets: "fundingBudget-form",
};
const VIEW_BY_STORE = {
  projects: "projects",
  students: "students",
  expenses: "expenses",
  tasks: "tasks",
  documents: "documents",
  users: "admin",
  institutions: "admin",
  fundingBudgets: "admin",
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
  participantListProjectId: null,
};

let db;

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("de-DE");

document.addEventListener("DOMContentLoaded", async () => {
  db = await openDatabase();
  await loadState();
  await restoreFromSQLiteIfLocalEmpty();
  bindNavigation();
  bindForms();
  bindFilters();
  bindBackup();
  bindAuth();
  bindBackToTop();
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
  syncSQLiteSnapshot();
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
  document.querySelector("#student-form [name=projectIds]").addEventListener("change", () => renderRequiredDocumentFields());
  document.querySelector("#fundingBudget-form [name=startDate]").addEventListener("change", updateFundingBudgetEndDate);
  document.querySelector("#fundingBudget-form [name=durationMonths]").addEventListener("change", updateFundingBudgetEndDate);
  ["startDate", "endDate"].forEach((name) => {
    document.querySelector(`#project-form [name=${name}]`).addEventListener("change", () => fillFundingBudgetSelect());
  });
  ["destinationCountry", "participantCount", "durationDays", "travelDays", "distanceBand", "greenTravel", "dailySupportRate", "travelGrantRate"].forEach((name) => {
    document.querySelector(`#project-form [name=${name}]`).addEventListener("input", updateGrantSuggestion);
    document.querySelector(`#project-form [name=${name}]`).addEventListener("change", updateGrantSuggestion);
  });
  document.querySelector("#project-form [name=budget]").addEventListener("input", (event) => {
    event.currentTarget.dataset.autoGrant = "false";
  });
  document.querySelector("#refresh-grant-templates").addEventListener("click", refreshGrantTemplates);
  document.querySelector("#save-grant-templates").addEventListener("click", saveGrantTemplates);
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
  if (formId === "fundingBudget-form") {
    updateFundingBudgetEndDate();
  }
  if (formId === "project-form") {
    form.elements.budget.dataset.autoGrant = "true";
    updateGrantSuggestion();
  }
  if (formId === "student-form") {
    renderRequiredDocumentFields();
  }
}

function bindAuth() {
  document.querySelector("#setup-form").addEventListener("submit", onSetupSubmit);
  document.querySelector("#login-form").addEventListener("submit", onLoginSubmit);
  document.querySelector("#logout").addEventListener("click", logout);
}

function bindBackToTop() {
  const button = document.querySelector("#back-to-top");
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    button.classList.toggle("show", window.scrollY > 420);
  }, { passive: true });
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
  document.querySelector("#close-participant-list").addEventListener("click", closeParticipantList);
  document.querySelector("#print-participant-list").addEventListener("click", printParticipantList);
  document.querySelector("#export-grant-templates").addEventListener("click", exportGrantTemplates);
  document.querySelector("#import-grant-templates").addEventListener("click", importGrantTemplates);
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-participant-list"));
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
    if (!fundingBudget || fundingBudget.status === "Inaktiv" || !projectOverlapsFundingBudget(data, fundingBudget)) {
      toast("Das ausgewählte Förderbudget passt nicht zum Projektzeitraum");
      return;
    }
    const assigned = fundingBudgetAssigned(data.fundingBudgetId, data.id || null) + Number(data.budget || 0);
    if (assigned > Number(fundingBudget?.amount || 0)) {
      toast("Projektbudget überschreitet das verfügbare Förderbudget");
      return;
    }
  }

  await persist("projects", {
    id: data.id || createId(),
    name: data.name.trim(),
    action: data.action,
    institutionIds: [...form.elements.institutionIds.selectedOptions].map((option) => option.value),
    partners: data.partners.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    fundingBudgetId: data.fundingBudgetId || "",
    destinationCountry: data.destinationCountry,
    participantCount: Number(data.participantCount || 0),
    durationDays: Number(data.durationDays || 0),
    travelDays: Number(data.travelDays || 0),
    distanceBand: data.distanceBand,
    greenTravel: new FormData(form).has("greenTravel"),
    dailySupportRate: Number(data.dailySupportRate || 0),
    travelGrantRate: Number(data.travelGrantRate || 0),
    calculatedGrant: Number(data.calculatedGrant || 0),
    grantSource: GRANT_SOURCE,
    budget: Number(data.budget),
    status: data.status,
  });
  resetForm("project-form");
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
    documents: Object.fromEntries(getSettingValues("documentTypes").map((type) => [type, projectIds.every((projectId) => data.getAll(`requiredDocuments:${projectId}`).includes(type))])),
    documentsByProject: Object.fromEntries(projectIds.map((projectId) => [
      projectId,
      Object.fromEntries(getSettingValues("documentTypes").map((type) => [type, data.getAll(`requiredDocuments:${projectId}`).includes(type)])),
    ])),
  });
  resetForm("student-form");
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
  const computedEndDate = data.durationMonths ? calculateEndDate(data.startDate, Number(data.durationMonths)) : data.endDate;
  if (!computedEndDate) {
    toast("Bei keiner festen Laufzeit bitte ein Enddatum angeben");
    return;
  }
  if (new Date(computedEndDate) < new Date(data.startDate)) {
    toast("Enddatum darf nicht vor dem Startdatum liegen");
    return;
  }
  const budgetDraft = { id: data.id || "new", startDate: data.startDate, endDate: computedEndDate };
  const linkedProjects = state.projects.filter((project) => projectOverlapsFundingBudget(project, budgetDraft));
  const assigned = linkedProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  if (assigned > Number(data.amount || 0)) {
    toast("Gesamtbudget ist kleiner als bereits zugewiesene Projektbudgets");
    return;
  }
  await persist("fundingBudgets", {
    id: data.id || createId(),
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: computedEndDate,
    durationMonths: data.durationMonths ? Number(data.durationMonths) : null,
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
  syncSQLiteSnapshot();
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
  syncSQLiteSnapshot();
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
  const activeNav = document.querySelector(`[data-view="${state.view}"]`);
  document.querySelector("#page-title").textContent = activeNav?.textContent || "Dashboard";
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
  const overview = fundingOverview();
  const activeFundingCount = state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv").length;
  const unplannedDetail = activeFundingCount > 1 ? `Summe aus ${activeFundingCount} aktiven Förderbudgets` : "aus einem aktiven Förderbudget";

  document.querySelector("#kpi-grid").innerHTML = [
    kpi("Aktive Projekte", activeProjects.length),
    kpi("In Projekten offen", money.format(overview.plannedOpen)),
    kpi("nicht verplantes Budget", money.format(overview.unplanned), unplannedDetail),
    kpi("Offene Aufgaben", openTasks.length),
    kpi("Reisende Teilnehmende", travellingStudents),
  ].join("");

  const statusFilter = document.querySelector("#dashboard-status-filter").value;
  const projects = filterText(state.projects).filter((project) => !statusFilter || project.status === statusFilter);
  renderProjectStatusSummary();
  renderFundingChart();
  renderList("#project-status-list", projects.map(projectStatusCard));

  renderRiskCenter();
}

function renderProjectStatusSummary() {
  const statuses = ["Geplant", "Aktiv", "Abrechnung", "Abgeschlossen"];
  const total = state.projects.length;
  document.querySelector("#project-status-summary").innerHTML = `
    <div class="status-total"><strong>${total}</strong><span>Projekte gesamt</span></div>
    <div class="status-bars">
      ${statuses.map((status) => {
        const count = state.projects.filter((project) => project.status === status).length;
        const percent = total ? Math.round((count / total) * 100) : 0;
        return `
          <div class="status-row">
            <div class="status-row-head">
              ${badge(status, statusTone(status))}
              <strong>${count}</strong>
            </div>
            <div class="mini-progress" aria-label="${status}: ${percent}%"><span style="width:${percent}%"></span></div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderFundingChart() {
  const { totalFunding, plannedBudget, spent, unplanned, plannedOpen, overplanned } = fundingOverview();
  const remaining = Math.max(unplanned, 0);
  const base = Math.max(totalFunding, plannedBudget, 1);
  const spentPercent = Math.round((spent / base) * 100);
  const plannedPercent = Math.round((plannedOpen / base) * 100);
  const remainingPercent = Math.round((remaining / base) * 100);
  const spentDeg = Math.min(360, (spent / base) * 360);
  const plannedDeg = Math.min(360, ((spent + plannedOpen) / base) * 360);
  const remainingDeg = Math.min(360, ((spent + plannedOpen + remaining) / base) * 360);
  const chartStyle = `--spent:${spentDeg}deg; --planned:${plannedDeg}deg; --remaining:${remainingDeg}deg;`;
  const chartTitle = `Gesamttopf: ${money.format(totalFunding)} | Verbraucht: ${money.format(spent)} (${spentPercent}%) | Verplant offen: ${money.format(plannedOpen)} (${plannedPercent}%) | Nicht verplant: ${money.format(remaining)} (${remainingPercent}%)`;

  document.querySelector("#funding-chart").innerHTML = `
    <div class="donut" style="${chartStyle}" aria-label="Fördergeldverteilung" title="${escapeHtml(chartTitle)}">
      <span><strong>${money.format(spent)}</strong><small>${spentPercent}% verbraucht</small></span>
    </div>
    <div class="chart-legend">
      ${legendItem("Verbraucht", money.format(spent), "spent", `${spentPercent}% vom Fördertopf`)}
      ${legendItem("Verplant offen", money.format(plannedOpen), "planned", `${plannedPercent}% vom Fördertopf`)}
      ${legendItem("Nicht verplant", money.format(remaining), "remaining", `${remainingPercent}% vom Fördertopf`)}
      ${overplanned ? legendItem("Überplant", money.format(overplanned), "danger", "Projektbudgets überschreiten den Fördertopf") : ""}
    </div>
  `;
}

function fundingOverview() {
  const activeBudgets = state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv");
  const activeBudgetIds = new Set(activeBudgets.map((budget) => budget.id));
  const fundedProjects = state.projects.filter((project) => activeBudgetIds.has(effectiveProjectFundingBudgetId(project)));
  const fundedProjectIds = new Set(fundedProjects.map((project) => project.id));
  const totalFunding = activeBudgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0);
  const plannedBudget = fundedProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const spent = state.expenses
    .filter((expense) => fundedProjectIds.has(expense.projectId))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return {
    totalFunding,
    plannedBudget,
    spent,
    plannedOpen: Math.max(plannedBudget - spent, 0),
    unplanned: totalFunding - plannedBudget,
    overplanned: Math.max(plannedBudget - totalFunding, 0),
  };
}

function legendItem(label, value, tone, detail = "") {
  const title = `${label}: ${value}${detail ? ` · ${detail}` : ""}`;
  return `<div class="legend-item" tabindex="0" title="${escapeHtml(title)}"><span class="legend-dot ${tone}"></span><div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}${detail ? ` · ${escapeHtml(detail)}` : ""}</small></div></div>`;
}

function renderRiskCenter() {
  const overdueTasks = state.tasks
    .filter((task) => task.status !== "Erledigt" && isOverdue(task.dueDate))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .map((task) => riskItem({
      tone: "danger",
      label: "Überfällig",
      title: task.title,
      context: projectName(task.projectId),
      detail: `Fällig am ${formatDate(task.dueDate)} · Status ${task.status}`,
    }));

  const missingReceipts = state.expenses
    .filter((expense) => expense.receiptStatus === "Fehlend")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .map((expense) => riskItem({
      tone: "warn",
      label: "Beleg fehlt",
      title: `${expense.category} · ${money.format(expense.amount)}`,
      context: projectName(expense.projectId),
      detail: `${studentName(expense.studentId)} · ${formatDate(expense.date)}`,
    }));

  const missingDocumentItems = studentProjectRows()
    .map(({ student, projectId }) => ({ student, projectId, missing: missingDocs(student, projectId) }))
    .filter((entry) => entry.missing.length)
    .sort((a, b) => b.missing.length - a.missing.length || a.student.name.localeCompare(b.student.name, "de"))
    .map(({ student, projectId, missing }) => riskItem({
      tone: "warn",
      label: `${missing.length} Dokument${missing.length === 1 ? "" : "e"}`,
      title: student.name,
      context: projectName(projectId),
      detail: `Fehlt: ${missing.join(", ")}`,
    }));

  const fundingIssues = state.projects
    .map((project) => ({ project, budget: state.fundingBudgets.find((entry) => entry.id === effectiveProjectFundingBudgetId(project)) }))
    .filter(({ project, budget }) => !budget || budget.status === "Inaktiv" || !projectOverlapsFundingBudget(project, budget))
    .map(({ project, budget }) => riskItem({
      tone: "danger",
      label: "Fördertopf",
      title: project.name,
      context: budget ? fundingBudgetName(budget.id) : "Nicht eindeutig zugeordnet",
      detail: budget ? "Projektzeitraum passt nicht zum Förderzeitraum" : "Budget wird nicht in den Fördergeldsummen gezählt",
    }));

  const items = [...fundingIssues, ...overdueTasks, ...missingReceipts, ...missingDocumentItems];
  document.querySelector("#risk-list").innerHTML = items.length
    ? `<div class="risk-stack">${items.join("")}</div>`
    : `<div class="empty success">Alles im grünen Bereich.</div>`;
}

function riskItem({ tone, label, title, context, detail }) {
  return `
    <article class="risk-item ${tone}">
      <span class="risk-marker"></span>
      <div>
        <div class="risk-head">
          ${badge(label, tone)}
          <strong>${escapeHtml(title)}</strong>
        </div>
        <p>${escapeHtml(context || "Nicht zugeordnet")}</p>
        <small>${escapeHtml(detail || "")}</small>
      </div>
    </article>
  `;
}

function renderProjects() {
  const status = document.querySelector("#project-filter").value;
  const rows = filterText(state.projects).filter((project) => !status || project.status === status);
  renderTable("#projects-table", ["Projekt", "Zeitraum", "Budget", "Fördertopf", "Status", "Fortschritt", ""], rows.map((project) => [
    `<strong>${escapeHtml(project.name)}</strong><div class="meta">${escapeHtml(project.action)} · ${projectInstitutionNames(project)}${project.partners ? `<br>${escapeHtml(project.partners)}` : ""}${project.destinationCountry ? `<br>${escapeHtml(project.destinationCountry)} · ${Number(project.participantCount || 0)} Pers. · Vorschlag ${money.format(Number(project.calculatedGrant || 0))}` : ""}</div>`,
    `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
    `${money.format(project.budget)}<div class="meta">Rest ${money.format(budgetRemaining(project.id))}</div>`,
    projectFundingBudgetNames(project),
    badge(project.status, statusTone(project.status)),
    progressHtml(taskProgress(project.id)),
    projectActions(project.id),
  ]));
  if (state.participantListProjectId && state.projects.some((project) => project.id === state.participantListProjectId)) {
    renderParticipantList(state.participantListProjectId);
  } else {
    closeParticipantList(false);
  }
}

function showParticipantList(projectId) {
  state.participantListProjectId = projectId;
  renderParticipantList(projectId, true);
}

function renderParticipantList(projectId, shouldScroll = false) {
  const project = state.projects.find((entry) => entry.id === projectId);
  const panel = document.querySelector("#participant-list-panel");
  const report = document.querySelector("#participant-list-report");
  if (!project || !panel || !report) return;

  const documentTypes = getSettingValues("documentTypes");
  const students = state.students
    .filter((student) => (student.projectIds || []).includes(projectId))
    .sort(sortByName);
  const incomplete = students.filter((student) => missingDocs(student, projectId).length);
  const completeCount = students.length - incomplete.length;
  const createdAt = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const documentHeaders = documentTypes.map((type) => `<th>${escapeHtml(type)}</th>`).join("");
  const rows = students.map((student, index) => {
    const missing = missingDocs(student, projectId);
    return `
      <tr class="${missing.length ? "is-incomplete" : "is-complete"}">
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(student.name)}</strong><div class="meta">${escapeHtml(student.className)}</div></td>
        <td>${formatDate(student.birthDate)}</td>
        ${documentTypes.map((type) => `<td class="status-cell">${hasProjectDocument(student, type, projectId) ? '<span class="print-status ok" title="Vorhanden">✓</span>' : '<span class="print-status missing" title="Fehlt">x</span>'}</td>`).join("")}
        <td class="missing-list">${missing.length ? `<strong>${escapeHtml(missing.join(", "))}</strong>` : '<span class="print-status ok" title="Vollständig">✓</span>'}</td>
      </tr>
    `;
  }).join("");

  report.innerHTML = `
    <div class="report-title">
      <p>Erasmus+ Schüler*innenaustausch</p>
      <h2>Teilnehmendenliste ${escapeHtml(project.name)}</h2>
    </div>
    <div class="report-meta">
      <span><strong>Leitaktion:</strong> ${escapeHtml(project.action)}</span>
      <span><strong>Zeitraum:</strong> ${formatDate(project.startDate)} - ${formatDate(project.endDate)}</span>
      <span><strong>Partnereinrichtungen:</strong> ${projectInstitutionNames(project)}</span>
      <span><strong>Erstellt:</strong> ${escapeHtml(createdAt)}</span>
    </div>
    <div class="report-summary">
      <article><span>Teilnehmende</span><strong>${students.length}</strong></article>
      <article><span>Vollständig</span><strong>${completeCount}</strong></article>
      <article class="${incomplete.length ? "warn" : "ok"}"><span>Mit fehlenden Dokumenten</span><strong>${incomplete.length}</strong></article>
    </div>
    <div class="table-wrap">
      <table class="participant-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Teilnehmende*r</th>
            <th>Geburtsdatum</th>
            ${documentHeaders}
            <th>Fehlt</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="${4 + documentTypes.length}">${emptyState()}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  panel.hidden = false;
  if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeParticipantList(resetState = true) {
  const panel = document.querySelector("#participant-list-panel");
  const report = document.querySelector("#participant-list-report");
  if (resetState) state.participantListProjectId = null;
  if (panel) panel.hidden = true;
  if (report) report.innerHTML = "";
}

function printParticipantList() {
  if (!state.participantListProjectId) {
    toast("Bitte zuerst eine Teilnehmendenliste öffnen");
    return;
  }
  document.body.classList.add("printing-participant-list");
  window.print();
  setTimeout(() => document.body.classList.remove("printing-participant-list"), 1000);
}

function renderStudents() {
  const role = document.querySelector("#student-filter").value;
  const rows = filterText(state.students).filter((student) => !role || student.role === role);
  renderTable("#students-table", ["Name", "Rolle", "Dokumente je Projekt", "Gesamt", ""], rows.map((student) => {
    const missing = missingDocsByProject(student);
    return [
    `<strong>${escapeHtml(student.name)}</strong><div class="meta">${escapeHtml(student.className)} · ${formatDate(student.birthDate)}</div>`,
    badge(roleLabel(student.role), student.role === "Teilnehmer" ? "ok" : "warn"),
    documentProjectSummary(student),
    badge(missing.total ? `${missing.total} fehlt` : "Vollständig", missing.total ? "danger" : "ok"),
    actions("students", student.id),
  ];
  }));
}

function renderExpenses() {
  const receipt = document.querySelector("#receipt-filter").value;
  const rows = filterText(state.expenses).filter((expense) => !receipt || expense.receiptStatus === receipt);
  renderTable("#expenses-table", ["Datum", "Projekt", "Teilnehmende*r", "Kategorie", "Betrag", "Beleg", ""], rows.map((expense) => [
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
  renderTable("#document-index-table", ["Datum", "Dokument", "Projekt", "Teilnehmende*r", "Status", ""], rows.map((doc) => [
    formatDate(doc.date),
    `<strong>${escapeHtml(doc.title)}</strong><div class="meta">${escapeHtml(doc.type)} - ${escapeHtml(doc.storageHint || "Kein Ablageort erfasst")}</div>`,
    escapeHtml(projectName(doc.projectId)),
    escapeHtml(studentName(doc.studentId)),
    badge(doc.status, doc.status === "Abgelegt" ? "ok" : doc.status === "Fehlt" ? "danger" : "warn"),
    actions("documents", doc.id),
  ]));

  const studentRows = filterText(studentProjectRows()).filter((row) => !onlyMissing || missingDocs(row.student, row.projectId).length);
  const documentTypes = getSettingValues("documentTypes");
  renderTable("#documents-table", ["Teilnehmende*r / Projekt", ...documentTypes, "Status"], studentRows.map(({ student, projectId }) => [
    `<strong>${escapeHtml(student.name)}</strong><div class="meta">${escapeHtml(student.className)} · ${escapeHtml(projectName(projectId))}</div>`,
    ...documentTypes.map((type) => yesNo(hasProjectDocument(student, type, projectId))),
    badge(missingDocs(student, projectId).length ? "Unvollständig" : "Vollständig", missingDocs(student, projectId).length ? "danger" : "ok"),
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
    budget.durationMonths ? `${Number(budget.durationMonths)} Monate` : "Keine feste Laufzeit",
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
  renderSettingList("documentTypes", "#document-types-list", (value) => settingValueInUse("documentTypes", value));
  renderSettingList("leadActions", "#lead-actions-list", (value) => state.projects.some((project) => project.action === value));
  renderGrantSettings();
}

function renderGrantSettings() {
  renderTable("#country-grant-table", ["Land", "Gruppe", "Tageswert"], getCountryGrantRates().map((rate) => [
    escapeHtml(rate.country),
    `Gruppe ${Number(rate.group || 0)}`,
    `<span class="input-addon table-money"><input data-country-rate="${escapeHtml(rate.country)}" type="number" min="0" step="0.01" value="${Number(rate.dailyRate || rate.dailyMax || 0)}" /><span>€</span></span>`,
  ]));
  renderTable("#travel-grant-table", ["Distanz", "Standard", "Green Travel"], getTravelGrantBands().map((band) => [
    escapeHtml(band.label),
    `<span class="input-addon table-money"><input data-travel-standard="${escapeHtml(band.id)}" type="number" min="0" step="0.01" value="${Number(band.standard || 0)}" /><span>€</span></span>`,
    `<span class="input-addon table-money"><input data-travel-green="${escapeHtml(band.id)}" type="number" min="0" step="0.01" value="${Number(band.green || 0)}" /><span>€</span></span>`,
  ]));
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

function updateFundingBudgetEndDate() {
  const form = document.querySelector("#fundingBudget-form");
  const startDate = form.elements.startDate.value;
  const durationMonths = form.elements.durationMonths.value;
  const endDateField = form.elements.endDate;
  const hasFixedDuration = Boolean(durationMonths);

  endDateField.required = !hasFixedDuration;
  endDateField.disabled = hasFixedDuration;
  if (hasFixedDuration) {
    endDateField.value = startDate ? calculateEndDate(startDate, Number(durationMonths)) : "";
  }
}

function calculateEndDate(startDate, durationMonths) {
  if (!startDate || !durationMonths) return "";
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + durationMonths);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
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
  syncSQLiteSnapshot();
  render();
  toast("Stammdaten gespeichert");
}

function defaultCountryGrantRates() {
  return Object.entries(COUNTRY_GRANT_GROUPS)
    .map(([country, rate]) => ({
      country,
      group: rate.group,
      dailyMin: rate.dailyMin,
      dailyMax: rate.dailyMax,
      dailyRate: rate.dailyMax,
    }))
    .sort((a, b) => a.country.localeCompare(b.country, "de"));
}

function defaultTravelGrantBands() {
  return TRAVEL_GRANT_BANDS.map((band) => ({ ...band }));
}

function getCountryGrantRates() {
  return Array.isArray(state.settings.countryGrantRates) && state.settings.countryGrantRates.length
    ? state.settings.countryGrantRates
    : defaultCountryGrantRates();
}

function getTravelGrantBands() {
  return Array.isArray(state.settings.travelGrantBands) && state.settings.travelGrantBands.length
    ? state.settings.travelGrantBands
    : defaultTravelGrantBands();
}

async function refreshGrantTemplates() {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderpauschalen aktualisieren");
    return;
  }
  await persistGrantTemplates(defaultCountryGrantRates(), defaultTravelGrantBands());
  toast("Förderpauschalen-Vorlage aktualisiert");
}

async function saveGrantTemplates() {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderpauschalen speichern");
    return;
  }
  const countryRates = getCountryGrantRates().map((rate) => {
    const input = document.querySelector(`[data-country-rate="${cssEscape(rate.country)}"]`);
    return { ...rate, dailyRate: Number(input?.value || 0) };
  });
  const travelBands = getTravelGrantBands().map((band) => {
    const standard = document.querySelector(`[data-travel-standard="${cssEscape(band.id)}"]`);
    const green = document.querySelector(`[data-travel-green="${cssEscape(band.id)}"]`);
    return { ...band, standard: Number(standard?.value || 0), green: Number(green?.value || 0) };
  });
  if (countryRates.some((rate) => rate.dailyRate <= 0) || travelBands.some((band) => band.standard <= 0 || band.green <= 0)) {
    toast("Alle Förderpauschalen müssen größer als 0 sein");
    return;
  }
  await persistGrantTemplates(countryRates, travelBands);
  toast("Förderpauschalen gespeichert");
}

async function persistGrantTemplates(countryRates, travelBands) {
  await put("settings", { id: "countryGrantRates", values: countryRates });
  await put("settings", { id: "travelGrantBands", values: travelBands });
  await loadState();
  syncSQLiteSnapshot();
  render();
}

function exportGrantTemplates() {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderpauschalen exportieren");
    return;
  }
  const payload = {
    schema: "erasmus-plus-grant-template",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    source: state.settings.grantTemplateSource || GRANT_SOURCE,
    countryGrantRates: getCountryGrantRates(),
    travelGrantBands: getTravelGrantBands(),
  };
  downloadJson(payload, `erasmus-plus-foerderpauschalen-${new Date().toISOString().slice(0, 10)}.json`);
}

async function importGrantTemplates() {
  if (!isAdmin()) {
    toast("Nur Admins dürfen Förderpauschalen importieren");
    return;
  }
  const file = document.querySelector("#grant-template-file").files[0];
  if (!file) {
    toast("Bitte Vorlagendatei auswählen");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    const countryRates = normalizeCountryGrantRates(payload.countryGrantRates);
    const travelBands = normalizeTravelGrantBands(payload.travelGrantBands);
    if (!countryRates.length || !travelBands.length) {
      toast("Vorlagendatei enthält keine gültigen Förderpauschalen");
      return;
    }
    await persistGrantTemplates(countryRates, travelBands);
    await put("settings", { id: "grantTemplateSource", values: payload.source || file.name });
    await loadState();
    syncSQLiteSnapshot();
    render();
    toast("Förderpauschalen importiert");
  } catch (error) {
    toast("Vorlagendatei konnte nicht gelesen werden");
  }
}

function normalizeCountryGrantRates(items = []) {
  return items
    .map((item) => ({
      country: String(item.country || "").trim(),
      group: Number(item.group || 0),
      dailyMin: Number(item.dailyMin || item.dailyRate || 0),
      dailyMax: Number(item.dailyMax || item.dailyRate || 0),
      dailyRate: Number(item.dailyRate || item.dailyMax || 0),
    }))
    .filter((item) => item.country && item.group && item.dailyRate > 0)
    .sort((a, b) => a.country.localeCompare(b.country, "de"));
}

function normalizeTravelGrantBands(items = []) {
  return items
    .map((item) => ({
      id: String(item.id || "").trim(),
      label: String(item.label || item.id || "").trim(),
      standard: Number(item.standard || 0),
      green: Number(item.green || 0),
    }))
    .filter((item) => item.id && item.label && item.standard > 0 && item.green > 0);
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
  if (key === "documentTypes") {
    await removeUnusedStudentDocumentField(value);
  }
  await saveSetting(key, next);
}

function settingValueInUse(key, value) {
  if (key === "expenseCategories") return state.expenses.some((expense) => expense.category === value);
  if (key === "documentTypes") return state.documents.some((doc) => doc.type === value) || state.students.some((student) => student.documents?.[value] === true);
  if (key === "leadActions") return state.projects.some((project) => project.action === value);
  return false;
}

async function removeUnusedStudentDocumentField(value) {
  for (const student of state.students) {
    if (!Object.prototype.hasOwnProperty.call(student.documents || {}, value)) continue;
    const documents = { ...student.documents };
    delete documents[value];
    await put("students", { ...student, documents });
  }
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

function projectFundingBudgetNames(project) {
  const id = effectiveProjectFundingBudgetId(project);
  if (!id) return `<span class="muted">Nicht zugeordnet</span>`;
  const budget = state.fundingBudgets.find((entry) => entry.id === id);
  if (!budget) return `<span class="badge danger">Fördertopf fehlt</span>`;
  const mismatch = !projectOverlapsFundingBudget(project, budget);
  return `${escapeHtml(fundingBudgetName(id))}${mismatch ? '<div class="meta danger-text">Zeitraum passt nicht</div>' : ""}`;
}

function fundingBudgetAssigned(id, excludeProjectId = null) {
  return state.projects
    .filter((project) => project.id !== excludeProjectId && effectiveProjectFundingBudgetId(project) === id)
    .reduce((sum, project) => sum + Number(project.budget || 0), 0);
}

function fundingBudgetRemaining(id, excludeProjectId = null) {
  const budget = state.fundingBudgets.find((entry) => entry.id === id);
  return Number(budget?.amount || 0) - fundingBudgetAssigned(id, excludeProjectId);
}

function effectiveProjectFundingBudgetId(project) {
  if (project.fundingBudgetId) return project.fundingBudgetId;
  const matches = matchingFundingBudgets(project);
  return matches.length === 1 ? matches[0].id : "";
}

function calculateIndividualSupport(days, dailyRate) {
  const fullRateDays = Math.min(days, 14);
  const reducedRateDays = Math.max(days - 14, 0);
  return (fullRateDays * dailyRate) + (reducedRateDays * dailyRate * 0.7);
}

function updateGrantSuggestion() {
  const form = document.querySelector("#project-form");
  const country = form.elements.destinationCountry.value;
  const countryRate = getCountryGrantRates().find((entry) => entry.country === country);
  const band = getTravelGrantBands().find((entry) => entry.id === form.elements.distanceBand.value);

  if (countryRate && !form.elements.dailySupportRate.matches(":focus")) {
    form.elements.dailySupportRate.value = countryRate.dailyRate || countryRate.dailyMax;
  }
  if (band && !form.elements.travelGrantRate.matches(":focus")) {
    form.elements.travelGrantRate.value = form.elements.greenTravel.checked ? band.green : band.standard;
  }

  const participants = Number(form.elements.participantCount.value || 0);
  const durationDays = Number(form.elements.durationDays.value || 0);
  const travelDays = Number(form.elements.travelDays.value || 0);
  const dailyRate = Number(form.elements.dailySupportRate.value || 0);
  const travelRate = Number(form.elements.travelGrantRate.value || 0);
  const supportDays = durationDays + travelDays;
  const individualSupport = calculateIndividualSupport(supportDays, dailyRate);
  const grant = participants * (individualSupport + travelRate);

  form.elements.calculatedGrant.value = grant ? grant.toFixed(2) : "";
  if (form.elements.budget.dataset.autoGrant !== "false" && grant) {
    form.elements.budget.value = grant.toFixed(2);
    form.elements.budget.dataset.autoGrant = "true";
  }
}

function matchingFundingBudgets(project) {
  return state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv" && projectOverlapsFundingBudget(project, budget));
}

function projectOverlapsFundingBudget(project, budget) {
  if (!project.startDate || !project.endDate || !budget.startDate || !budget.endDate) return false;
  return new Date(project.startDate) <= new Date(budget.endDate) && new Date(project.endDate) >= new Date(budget.startDate);
}

function fillSelects() {
  fillOptionSelect("#project-form [name=action]", getSettingValues("leadActions"), "Bitte wählen");
  fillCountrySelect();
  fillTravelBandSelect();
  fillFundingBudgetSelect();
  fillOptionSelect("#expense-form [name=category]", getSettingValues("expenseCategories"));
  fillOptionSelect("#document-form [name=type]", getSettingValues("documentTypes"));
  renderRequiredDocumentFields();
  fillInstitutionSelect();
  fillProjectSelect("#student-form [name=projectIds]", true);
  fillProjectSelect("#expense-form [name=projectId]");
  fillProjectSelect("#task-form [name=projectId]");
  fillProjectSelect("#document-form [name=projectId]");
  fillProjectSelect("#task-filter", false, "Alle Projekte");
  fillStudentSelect("#expense-form [name=studentId]");
  fillStudentSelect("#document-form [name=studentId]");
}

function fillCountrySelect() {
  const select = document.querySelector("#project-form [name=destinationCountry]");
  const current = select.value;
  select.innerHTML = `<option value="">Zielland wählen</option>`;
  getCountryGrantRates().forEach((rate) => {
    const option = new Option(`${rate.country} · Gruppe ${rate.group} · ${Number(rate.dailyRate || rate.dailyMax || 0)} €/Tag`, rate.country);
    option.selected = current === rate.country;
    select.add(option);
  });
}

function fillTravelBandSelect() {
  const select = document.querySelector("#project-form [name=distanceBand]");
  const current = select.value;
  select.innerHTML = `<option value="">Reisedistanz wählen</option>`;
  getTravelGrantBands().forEach((band) => {
    const option = new Option(`${band.label} · ${band.standard}/${band.green} €`, band.id);
    option.selected = current === band.id;
    select.add(option);
  });
}

function fillFundingBudgetSelect(selectedId = null) {
  const select = document.querySelector("#project-form [name=fundingBudgetId]");
  const selected = selectedId ?? select.value;
  const form = document.querySelector("#project-form");
  const currentProjectId = form.elements.id.value || null;
  const projectDates = {
    startDate: form.elements.startDate.value,
    endDate: form.elements.endDate.value,
  };
  select.innerHTML = `<option value="">Kein Förderbudget zugeordnet</option>`;
  state.fundingBudgets
    .filter((budget) => budget.id === selected || (budget.status !== "Inaktiv" && (!projectDates.startDate || !projectDates.endDate || projectOverlapsFundingBudget(projectDates, budget))))
    .forEach((budget) => {
      const dateMismatch = projectDates.startDate && projectDates.endDate && !projectOverlapsFundingBudget(projectDates, budget);
      const label = `${budget.name} · ${formatDate(budget.startDate)}-${formatDate(budget.endDate)} · frei ${money.format(fundingBudgetRemaining(budget.id, currentProjectId))}${budget.status === "Inaktiv" ? " · inaktiv" : ""}${dateMismatch ? " · Zeitraum passt nicht" : ""}`;
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
  const tabs = document.querySelector("#project-document-tabs");
  const form = document.querySelector("#student-form");
  const projectIds = [...form.elements.projectIds.selectedOptions].map((option) => option.value);
  const previous = collectProjectDocumentChecks(container);

  if (!projectIds.length) {
    tabs.innerHTML = "";
    container.innerHTML = `<p class="hint">Bitte zuerst mindestens ein Projekt auswählen.</p>`;
    return;
  }

  tabs.innerHTML = projectIds.map((projectId, index) => `
    <button type="button" class="doc-tab ${index === 0 ? "active" : ""}" data-doc-tab="${escapeHtml(projectId)}">${escapeHtml(projectName(projectId))}</button>
  `).join("");

  container.innerHTML = projectIds.map((projectId, index) => `
    <div class="doc-tab-panel ${index === 0 ? "active" : ""}" data-doc-panel="${escapeHtml(projectId)}">
      ${getSettingValues("documentTypes").map((type) => {
        const checked = previous[projectId]?.[type] ?? currentStudentDocumentValue(form.elements.id.value, projectId, type);
        return `<label class="check"><input type="checkbox" name="requiredDocuments:${escapeHtml(projectId)}" value="${escapeHtml(type)}" ${checked ? "checked" : ""} /> ${escapeHtml(type)}</label>`;
      }).join("")}
    </div>
  `).join("");

  tabs.querySelectorAll("[data-doc-tab]").forEach((button) => {
    button.addEventListener("click", () => activateDocumentTab(button.dataset.docTab));
  });
}

function collectProjectDocumentChecks(container) {
  const checks = {};
  container.querySelectorAll("[data-doc-panel]").forEach((panel) => {
    const projectId = panel.dataset.docPanel;
    checks[projectId] = {};
    panel.querySelectorAll("input[type=checkbox]").forEach((input) => {
      checks[projectId][input.value] = input.checked;
    });
  });
  return checks;
}

function currentStudentDocumentValue(studentId, projectId, type) {
  const student = state.students.find((entry) => entry.id === studentId);
  if (!student) return false;
  return hasProjectDocument(student, type, projectId);
}

function activateDocumentTab(projectId) {
  document.querySelectorAll("#project-document-tabs [data-doc-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.docTab === projectId);
  });
  document.querySelectorAll("#required-document-fields [data-doc-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.docPanel === projectId);
  });
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
  select.innerHTML = `<option value="">Ohne Personenbezug</option>`;
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
  table.querySelectorAll("[data-participant-list]").forEach((button) => button.addEventListener("click", () => showParticipantList(button.dataset.participantList)));
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

function kpi(label, value, detail = "") {
  return `<article class="kpi"><span>${label}</span><strong>${value}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</article>`;
}

function actions(store, id) {
  return `<div class="row-actions"><button class="small secondary" data-edit data-store="${store}" data-id="${id}">Bearbeiten</button><button class="small danger" data-delete data-store="${store}" data-id="${id}">Löschen</button></div>`;
}

function projectActions(id) {
  return `
    <div class="row-actions">
      <button class="small" data-participant-list="${id}">Teilnehmendenliste</button>
      <button class="small secondary" data-edit data-store="projects" data-id="${id}">Bearbeiten</button>
      <button class="small danger" data-delete data-store="projects" data-id="${id}">Löschen</button>
    </div>
  `;
}

function editItem(store, id) {
  const item = state[store].find((entry) => entry.id === id);
  if (!item) return;

  state.view = VIEW_BY_STORE[store] || "dashboard";
  render();

  const form = document.querySelector(`#${FORM_BY_STORE[store]}`);
  if (!form) return;

  if (store === "projects") {
    fillInstitutionSelect(item.institutionIds || []);
    form.elements.budget.dataset.autoGrant = "false";
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
    renderRequiredDocumentFields();
  }

  if (store === "projects") {
    fillFundingBudgetSelect(item.fundingBudgetId || effectiveProjectFundingBudgetId(item));
  }

  if (store === "users") {
    document.querySelector("#user-form-title").textContent = "Benutzer bearbeiten";
    form.elements.password.value = "";
    form.elements.password.placeholder = "Leer lassen, wenn unverändert";
  }

  if (store === "fundingBudgets") {
    updateFundingBudgetEndDate();
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
  syncSQLiteSnapshot();
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

function roleLabel(role) {
  if (role === "Teilnehmer") return "Teilnehmende*r";
  if (role === "Nachrücker") return "Nachrücker*in";
  return role || "-";
}

function studentName(id) {
  return state.students.find((student) => student.id === id)?.name || "Nicht zugeordnet";
}

function studentProjectRows() {
  return state.students.flatMap((student) => {
    const projectIds = student.projectIds?.length ? student.projectIds : [""];
    return projectIds.map((projectId) => ({ student, projectId }));
  });
}

function missingDocs(student, projectId = null) {
  return getSettingValues("documentTypes").filter((type) => !(projectId ? hasProjectDocument(student, type, projectId) : hasDocument(student, type)));
}

function missingDocsByProject(student) {
  const projectIds = student.projectIds?.length ? student.projectIds : [""];
  const rows = projectIds.map((projectId) => ({ projectId, missing: missingDocs(student, projectId) }));
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.missing.length, 0),
  };
}

function documentProjectSummary(student) {
  const { rows } = missingDocsByProject(student);
  return `<div class="project-doc-summary">${rows.map(({ projectId, missing }) => {
    const complete = missing.length === 0;
    return `
      <div class="project-doc-row ${complete ? "ok" : "missing"}">
        <div>
          <strong>${escapeHtml(projectName(projectId))}</strong>
          <span>${complete ? "Alle Dokumente vorhanden" : `Fehlt: ${escapeHtml(missing.join(", "))}`}</span>
        </div>
        ${badge(complete ? "OK" : `${missing.length} offen`, complete ? "ok" : "danger")}
      </div>
    `;
  }).join("")}</div>`;
}

function hasProjectDocument(student, type, projectId) {
  const projectDocs = student.documentsByProject?.[projectId];
  if (projectDocs && Object.prototype.hasOwnProperty.call(projectDocs, type)) {
    return Boolean(projectDocs[type]);
  }
  const matchingDocs = state.documents.filter((doc) => doc.projectId === projectId && doc.studentId === student.id && doc.type === type);
  if (matchingDocs.some((doc) => doc.status === "Abgelegt")) return true;
  if (matchingDocs.length) return false;
  return hasDocument(student, type);
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

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function toast(message) {
  const toastEl = document.querySelector("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2400);
}

// Export/Import der IndexedDB-Inhalte als Backup-Datei.
function exportData() {
  downloadJson(buildBackupPayload(), `erasmus-plus-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

function exportStores() {
  return Object.fromEntries(STORES.map((store) => {
    if (store === "settings") {
      return [store, Object.entries(state.settings).map(([id, values]) => ({ id, values }))];
    }
    return [store, state[store]];
  }));
}

function buildBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    data: exportStores(),
  };
}

function hasLocalData() {
  return STORES.some((store) => Array.isArray(state[store]) && state[store].length > 0);
}

async function restoreFromSQLiteIfLocalEmpty() {
  if (hasLocalData() || location.protocol !== "http:") return;
  try {
    const response = await fetch("/api/sqlite/latest", { cache: "no-store" });
    if (response.status === 204 || !response.ok) return;
    const payload = await response.json();
    const normalizedData = normalizeImportData(payload);
    if (!normalizedData) return;
    for (const store of STORES) {
      await clearStore(store);
      for (const item of normalizedData[store]) {
        await put(store, item);
      }
    }
    await loadState();
  } catch (error) {
    console.warn("SQLite-Restore nicht verfügbar", error);
  }
}

function syncSQLiteSnapshot() {
  if (location.protocol !== "http:") return;
  fetch("/api/sqlite/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBackupPayload()),
    keepalive: true,
  }).catch((error) => console.warn("SQLite-Snapshot nicht gespeichert", error));
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
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

  try {
    const payload = JSON.parse(await file.text());
    const normalizedData = normalizeImportData(payload);
    if (!normalizedData) {
      toast("Datei ist kein vollständiges Erasmus+ Backup");
      return;
    }
    const hasUserBackup = Array.isArray(payload.data?.users);
    const importedUsers = hasUserBackup ? normalizedData.users : [];
    if (hasUserBackup && !importedUsers.some((user) => user.role === "Admin" && user.status === "Aktiv")) {
      toast("Import braucht mindestens einen aktiven Admin");
      return;
    }
    for (const store of STORES) {
      if (store === "users" && !hasUserBackup) continue;
      await clearStore(store);
      for (const item of normalizedData[store]) {
        await put(store, item);
      }
    }
    await loadState();
    ensureAuth();
    syncSQLiteSnapshot();
    render();
    document.querySelector("#import-file").value = "";
    toast(`Import abgeschlossen: ${importCount(normalizedData)} Einträge`);
  } catch (error) {
    toast(`Backup konnte nicht importiert werden: ${error.message || "Unbekannter Fehler"}`);
  }
}

function normalizeImportData(payload) {
  if (!payload?.data || typeof payload.data !== "object") return null;
  const data = {};
  for (const store of STORES) {
    const value = payload.data[store];
    if (store === "settings") {
      data.settings = normalizeImportedSettings(value);
    } else {
      data[store] = Array.isArray(value) ? value : [];
    }
  }
  return STORES.some((store) => data[store].length) ? data : null;
}

function normalizeImportedSettings(value) {
  if (Array.isArray(value)) return value.filter((item) => item && item.id);
  if (value && typeof value === "object") {
    return Object.entries(value).map(([id, values]) => ({ id, values }));
  }
  return [];
}

function importCount(data) {
  return STORES.reduce((sum, store) => sum + (Array.isArray(data?.[store]) ? data[store].length : 0), 0);
}

async function seedData() {
  if (!confirm("Beispieldaten ersetzen alle lokalen Daten. Fortfahren?")) return;
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
      { id: ids.p1, name: "Brücken nach Valencia", action: "KA1", institutionIds: [ids.i1], partners: "Austauschgruppe Klasse 10", startDate: "2026-10-01", endDate: "2027-03-31", budget: 11700, status: "Aktiv", destinationCountry: "Spanien", participantCount: 12, durationDays: 7, travelDays: 2, distanceBand: "500-1999", greenTravel: false, dailySupportRate: 74, travelGrantRate: 309, calculatedGrant: 11700, grantSource: GRANT_SOURCE },
      { id: ids.p2, name: "Green Schools Network", action: "KA2", institutionIds: [ids.i2, ids.i3], partners: "Nachhaltigkeitsprojekt mit zwei Partnerschulen", startDate: "2027-02-10", endDate: "2027-09-30", budget: 26982, status: "Geplant", destinationCountry: "Finnland", participantCount: 18, durationDays: 12, travelDays: 2, distanceBand: "500-1999", greenTravel: false, dailySupportRate: 85, travelGrantRate: 309, calculatedGrant: 26982, grantSource: GRANT_SOURCE },
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
    if (store === "users" && !Array.isArray(seed.users)) continue;
    await clearStore(store);
    for (const item of seed[store] || []) {
      await put(store, item);
    }
  }
  await loadState();
  syncSQLiteSnapshot();
  render();
  toast("Beispieldaten geladen");
}
