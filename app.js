const DB_NAME = "erasmus_plus_management";
const DB_VERSION = 8;
const STORES = ["projects", "students", "expenses", "tasks", "documents", "users", "settings", "institutions", "fundingBudgets", "auditLogs", "templateData"];
const SESSION_KEY = "erasmus_plus_management_user";
const AUTO_BACKUP_KEY = "erasmus_plus_management_auto_backups";
const AUTO_BACKUP_LIMIT = 8;
const MOBILITY_PROFILE_FIELDS = [
  "mobilityNote",
  "emergencyContact1",
  "emergencyContact2",
  "allergies",
  "medicalNotes",
  "insurance",
  "mediaConsent",
];
const MOBILITY_TYPES = [
  "Gruppenmobilität",
  "Individuelle Kurzzeitmobilität",
  "Individuelle Langzeitmobilität",
  "Sonstige / gemischt",
];
const DEFAULT_MOBILITY_FORM_TEMPLATES = [
  {
    id: "grantAgreement",
    title: "Teilnehmervereinbarung",
    subtitle: "Grant Agreement",
    notice: "Rechtliche Arbeitsvorlage für Teilnahmebedingungen, Pflichten und Zuschüsse. Bei minderjährigen Schüler*innen durch Erziehungsberechtigte unterzeichnen lassen.",
    body: "{name}, Klasse {klasse}, nimmt im Zeitraum {zeitraum} am Erasmus+ Projekt \"{projekt}\" teil. Mobilitätsart: {mobilitaetsart}. Die Mobilität findet in {zielland} bei {aufnehmende_einrichtung} statt. Die entsendende Einrichtung ist {entsendende_schule}.\n\nDie teilnehmende Person verpflichtet sich zur aktiven Teilnahme, zur Einhaltung der vereinbarten Regeln, zur fristgerechten Abgabe notwendiger Unterlagen und zur Mitwirkung an der Dokumentation der Lernergebnisse.\n\nFür die Mobilität ist ein Projektbudget von {projektbudget} hinterlegt. Individuelle Zuschüsse, Auszahlungsmodalitäten und Nachweispflichten werden schulintern ergänzt.",
    signatures: "Teilnehmende*r, Erziehungsberechtigte, Entsendende Schule",
  },
  {
    id: "learningAgreement",
    title: "Lernvereinbarung",
    subtitle: "Learning Agreement / Learning Programme",
    notice: "Für Gruppenmobilitäten als gemeinsames Lernprogramm nutzbar; für Einzelmobilitäten können die Felder pro Schüler*in angepasst und gespeichert werden.",
    body: "Mobilitätsart: {mobilitaetsart}\n\nLernziele und erwartete Lernergebnisse:\n{lernziele}\n\nGeplante Aktivitäten:\n{aktivitaeten}\n\nBegleitung, Monitoring und Anerkennung:\n{anerkennung}",
    signatures: "Teilnehmende*r, Erziehungsberechtigte, Entsendende Schule, Aufnehmende Schule",
  },
  {
    id: "consentPrivacy",
    title: "Einverständnis- und Datenschutzerklärung",
    subtitle: "Einwilligung für Mobilität, Datenaustausch und Mediennutzung",
    notice: "Arbeitsvorlage für Einwilligungen. Rechtliche Vorgaben der Schule oder des Trägers bitte bei Bedarf ergänzen.",
    body: "Ich/Wir bestätige(n), dass {name} am Projekt \"{projekt}\" im Zeitraum {zeitraum} teilnehmen darf.\n\nIch/Wir willige(n) ein, dass die für Organisation und Sicherheit notwendigen personenbezogenen Daten an beteiligte Einrichtungen, Gastfamilien und betreuende Personen weitergegeben werden dürfen.\n\nDie Nutzung von Fotos, kurzen Videos und Projektergebnissen für schulische Erasmus+ Projektarbeit wird wie folgt geregelt: {medienregelung}",
    signatures: "Erziehungsberechtigte, Teilnehmende*r, Entsendende Schule",
  },
  {
    id: "emergencyCard",
    title: "Medizinische Notfallkarte",
    subtitle: "Gesundheitsblatt und Notfallkontakte",
    notice: "Für die Mitnahme durch betreuende Lehrkräfte. Medizinische Angaben bitte vor Ausgabe prüfen und ergänzen.",
    body: "Teilnehmende Person: {name}, Klasse {klasse}, Geburtsdatum {geburtsdatum}\nProjekt: {projekt}, Zielland: {zielland}, Zeitraum: {zeitraum}\n\nNotfallkontakt 1: {notfallkontakt_1}\nNotfallkontakt 2: {notfallkontakt_2}\n\nAllergien / Unverträglichkeiten: {allergien}\nMedikamente / Vorerkrankungen: {medizinische_hinweise}\nVersicherung / Besonderheiten: {versicherung}",
    signatures: "Erziehungsberechtigte, Betreuende Lehrkraft",
  },
];
const HELP_TOPICS = [
  {
    category: "Start",
    title: "Grundidee der Anwendung",
    text: "Die App verwaltet Erasmus+ Projekte, Schüler*innen, Budgets, Aufwände, Aufgaben, Dokumente, Formulare und Akten lokal im Browser. Alles bleibt auf dem Gerät und kann als JSON-Backup exportiert werden.",
    steps: ["Dashboard öffnen", "Projektstatus, Budget und Meldungen prüfen", "Bei Bedarf über die Suche direkt nach Projekt, Person oder Beleg filtern"],
    view: "dashboard",
    keywords: "übersicht dashboard status kpi lokal indexeddb hub",
  },
  {
    category: "Projekte",
    title: "Projekt anlegen oder bearbeiten",
    text: "Ein Projekt enthält Leitaktion, Status, Zeitraum, Partnereinrichtungen, Zielland, Förderbudget, Budget und Förderpauschalen. Die Projektakte bündelt später alle Einzelheiten.",
    steps: ["Menü Projekte öffnen", "Projektformular ausfüllen", "Förderbudget und Zielland wählen", "Speichern"],
    view: "projects",
    keywords: "projekt katalog leitaktion partner schule förderpauschale budget projektakte archivieren",
  },
  {
    category: "Teilnehmende",
    title: "Schüler*innen mehreren Projekten zuordnen",
    text: "Eine Schüler*in kann mehreren Projekten zugeordnet werden. Rollen, Dokumentstatus, Notfallkontakte, Gesundheitsangaben, Versicherung und Einwilligungen werden projektbezogen gepflegt.",
    steps: ["Menü Teilnehmende öffnen", "Person auswählen oder neu anlegen", "Mehrere Projekte markieren", "Projekt-Tab öffnen", "Mobilitätsrelevante Angaben pflegen"],
    view: "students",
    keywords: "schüler schülerin teilnehmende projektzuordnung dokumente tabs rolle mobilitätsakte notfallkontakt allergien versicherung medien",
  },
  {
    category: "Dokumente",
    title: "Fehlende Dokumente finden",
    text: "Der Dokumentenmonitor zeigt je Schüler*in und Projekt, welche Pflichtdokumente vorhanden sind und welche fehlen. Die benötigten Dokumenttypen werden im Adminbereich konfiguriert.",
    steps: ["Menü Dokumente öffnen", "Filter auf Nur offene Dokumente stellen", "Fehlende Unterlagen nachpflegen"],
    view: "documents",
    keywords: "dokument einverständnis notfallkontakt versicherung fehlend pflichtdokument monitor",
  },
  {
    category: "Formulare",
    title: "Formulare pro Schüler*in drucken",
    text: "Die Formularzentrale erzeugt Teilnehmervereinbarung, Lernvereinbarung, Einverständnis/Datenschutz, Notfallkarte, Teilnahmebescheinigung und Europass Mobilität mit vorausgefüllten Daten aus Projekt, Schule und projektbezogener Schüler*innenakte.",
    steps: ["Menü Formulare öffnen", "Projekt wählen", "Formular wählen", "Schüler*in wählen", "Einzelformular öffnen und Drucken / PDF nutzen"],
    view: "forms",
    keywords: "formular vorlage teilnehmervereinbarung grant agreement lernvereinbarung europass notfallkarte datenschutz drucken pdf",
  },
  {
    category: "Formulare",
    title: "Batch-Ausgabe für ein ganzes Projekt",
    text: "Für ein Projekt können alle Formulare einer Art für alle zugeordneten Schüler*innen am Stück erstellt werden. Beim Druck beginnt jedes Dokument auf einer neuen A4-Seite.",
    steps: ["Menü Formulare öffnen", "Projekt und Formular wählen", "Ganzes Projekt anklicken", "Drucken / PDF starten"],
    view: "forms",
    keywords: "batch serienbrief alle projekt a4 neue seite ausdrucken aushändigen",
  },
  {
    category: "Admin",
    title: "Formular-Templates mit Platzhaltern bearbeiten",
    text: "Admins können die Texte der Mobilitätsformulare anpassen. Platzhalter wie {name}, {projekt}, {zeitraum}, {entsendende_schule} und {aufnehmende_einrichtung} werden beim Erzeugen ersetzt.",
    steps: ["Menü Admin öffnen", "Grunddaten & Vorlagen aufklappen", "Formular-Templates bearbeiten", "Template speichern"],
    view: "admin",
    adminOnly: true,
    keywords: "template editor platzhalter admin formular texte standard wiederherstellen",
  },
  {
    category: "Admin",
    title: "Stammdaten verwalten",
    text: "Im Adminbereich werden Benutzer, Förderbudgets, Partnereinrichtungen, Klassen/Gruppen, Leitaktionen, Dokumenttypen, Aufwandskategorien, feste Formulardaten und Förderpauschalen gepflegt.",
    steps: ["Als Admin anmelden", "Admin öffnen", "Passende Gruppe aufklappen", "Änderungen speichern"],
    view: "admin",
    adminOnly: true,
    keywords: "benutzer rollen förderbudget partnereinrichtungen klassen gruppen leitaktionen kategorien pauschalen",
  },
  {
    category: "Backup",
    title: "Backup exportieren und importieren",
    text: "Backups enthalten Projekte, Schüler*innen, Aufwände, Aufgaben, Dokumente, Benutzer, Einstellungen, Formularwerte, Akten- und Historieneinträge. Vor riskanten Vorgängen wird zusätzlich eine Sicherung angeboten.",
    steps: ["Menü Backup öffnen", "Export herunterladen", "Zum Wiederherstellen Datei auswählen und Import starten"],
    view: "backup",
    keywords: "backup export import json sicherung wiederherstellen indexeddb daten",
  },
  {
    category: "Archiv",
    title: "Archivmodus verwenden",
    text: "Archivierte Projekte und Schüler*innen bleiben nachvollziehbar, werden aber gegen Bearbeiten, Löschen und neue Folgedaten geschützt. So bleiben alte Zuordnungen und Akten erhalten.",
    steps: ["Projekt oder Schüler*in im Index suchen", "Mehr-Menü öffnen", "Archivieren oder Wieder öffnen wählen"],
    view: "projects",
    keywords: "archiv archivieren sperren abgeschlossen wieder öffnen löschen schutz",
  },
];
const DEFAULT_SETTINGS = {
  leadActions: ["KA1", "KA2", "KA3"],
  classGroups: ["8a", "8b", "8c", "9a", "9b", "9c", "10a", "10b", "10c"],
  templateDefaults: {
    sendingInstitution: "",
    sendingCity: "",
    contactPerson: "",
    contactEmail: "",
    recognitionText: "",
  },
  mobilityFormTemplates: DEFAULT_MOBILITY_FORM_TEMPLATES,
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
const STORE_LABELS = {
  projects: "Projekt",
  students: "Teilnehmende*r",
  expenses: "Aufwand",
  tasks: "Aufgabe",
  documents: "Dokument",
  users: "Benutzer",
  settings: "Stammdaten",
  institutions: "Partnereinrichtung",
  fundingBudgets: "Förderbudget",
  templateData: "Dokumentvorlage",
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
  auditLogs: [],
  templateData: [],
  currentUser: null,
  view: "dashboard",
  search: "",
  participantListProjectId: null,
  projectFileProjectId: null,
  studentFileStudentId: null,
  templateDocument: null,
};

let db;
let templateAutoSaveTimer;

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("de-DE");
const THEME_KEY = "erasmusPlusTheme";

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme(loadTheme());
  db = await openDatabase();
  await loadState();
  await restoreFromSQLiteIfLocalEmpty();
  bindNavigation();
  bindForms();
  bindFilters();
  bindBackup();
  bindAuth();
  bindTheme();
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
  const [projects, students, expenses, tasks, documents, users, settings, institutions, fundingBudgets, auditLogs, templateData] = await Promise.all(STORES.map(getAll));
  state.projects = projects.sort(sortByName);
  state.students = students.sort(sortByName);
  state.expenses = expenses.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  state.tasks = tasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  state.documents = documents.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  state.users = users.sort(sortByName);
  state.settings = settings.reduce((config, item) => ({ ...config, [item.id]: item.values || [] }), { ...DEFAULT_SETTINGS });
  state.institutions = institutions.sort(sortByName);
  state.fundingBudgets = fundingBudgets.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  state.auditLogs = auditLogs.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  state.templateData = templateData;
  if (state.currentUser) {
    state.currentUser = state.users.find((user) => user.id === state.currentUser.id && user.status === "Aktiv") || null;
  }
}

async function persist(storeName, value) {
  const exists = state[storeName]?.some((entry) => entry.id === value.id);
  await put(storeName, value);
  if (storeName !== "auditLogs") {
    await addAuditLog(exists ? "Aktualisiert" : "Angelegt", storeName, value);
  }
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup(`${STORE_LABELS[storeName] || storeName}-${exists ? "aktualisiert" : "angelegt"}`);
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
  document.querySelector("#project-form").addEventListener("invalid", (event) => {
    const section = event.target.closest("details");
    if (section) section.open = true;
  }, true);
  document.querySelector("#student-form").addEventListener("submit", onStudentSubmit);
  document.querySelector("#expense-form").addEventListener("submit", onExpenseSubmit);
  document.querySelector("#task-form").addEventListener("submit", onTaskSubmit);
  document.querySelector("#document-form").addEventListener("submit", onDocumentSubmit);
  document.querySelector("#user-form").addEventListener("submit", onUserSubmit);
  document.querySelector("#institution-form").addEventListener("submit", onInstitutionSubmit);
  document.querySelector("#fundingBudget-form").addEventListener("submit", onFundingBudgetSubmit);
  document.querySelector("#templateDefaults-form").addEventListener("submit", onTemplateDefaultsSubmit);
  document.querySelector("#mobility-template-form").addEventListener("submit", onMobilityTemplateSubmit);
  document.querySelector("#mobility-template-form [name=type]").addEventListener("change", renderMobilityTemplateEditor);
  document.querySelector("#reset-mobility-template").addEventListener("click", resetMobilityTemplate);
  document.querySelector("#mobility-form-project").addEventListener("change", () => {
    fillMobilityFormStudentSelect();
    renderMobilityFormOverview();
  });
  document.querySelector("#mobility-form-type").addEventListener("change", renderMobilityFormOverview);
  document.querySelector("#open-mobility-form").addEventListener("click", openSelectedMobilityForm);
  document.querySelector("#batch-mobility-form").addEventListener("click", batchSelectedMobilityForm);
  document.querySelector("#help-search").addEventListener("input", renderHelp);
  document.querySelector("#help-category").addEventListener("change", renderHelp);
  document.querySelector("[data-reset-template-defaults]").addEventListener("click", resetTemplateDefaultsForm);
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
    form.querySelector("h2").textContent = "Projekt erfassen";
    form.querySelectorAll(".project-form-section").forEach((section, index) => { section.open = index === 0; });
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

function bindTheme() {
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.querySelector("#theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "Hell" : "Dunkel";
    button.title = theme === "dark" ? "Helles Design aktivieren" : "Dunkles Design aktivieren";
    button.setAttribute("aria-label", button.title);
  }
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
  document.querySelector("#safety-backup").addEventListener("click", () => {
    toast(createSafetyBackup("manuell") ? "Sicherheitsbackup erstellt" : "Keine lokalen Daten für ein Sicherheitsbackup vorhanden");
  });
  document.querySelector("#download-auto-backup").addEventListener("click", downloadLatestAutomaticBackup);
  document.querySelector("#import-data").addEventListener("click", importData);
  document.querySelector("#seed-data").addEventListener("click", seedData);
  document.querySelector("#close-participant-list").addEventListener("click", closeParticipantList);
  document.querySelector("#print-participant-list").addEventListener("click", printParticipantList);
  document.querySelector("#close-project-file").addEventListener("click", closeProjectFile);
  document.querySelector("#close-student-file").addEventListener("click", closeStudentFile);
  document.querySelector("#close-template-document").addEventListener("click", closeTemplateDocument);
  document.querySelector("#print-template-document").addEventListener("click", printTemplateDocument);
  document.querySelector("#save-template-values").addEventListener("click", saveTemplateValues);
  document.querySelector("#reset-template-values").addEventListener("click", resetTemplateValues);
  document.querySelector("#export-grant-templates").addEventListener("click", exportGrantTemplates);
  document.querySelector("#import-grant-templates").addEventListener("click", importGrantTemplates);
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-participant-list"));
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-template-document"));
  window.addEventListener("beforeprint", () => {
    if (!document.querySelector("#template-document-panel").hidden) {
      document.body.classList.add("printing-template-document");
    }
  });
}

async function onProjectSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const existing = state.projects.find((project) => project.id === data.id);
  const archived = data.status === "Archiviert";
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
    mobilityType: data.mobilityType || "Gruppenmobilität",
    institutionIds: [...form.elements.institutionIds.selectedOptions].map((option) => option.value),
    partners: data.partners.trim(),
    // Stored with the project in IndexedDB and included in JSON/SQLite snapshots.
    completedActivities: (data.completedActivities || "").trim(),
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
    archivedAt: archived ? existing?.archivedAt || new Date().toISOString() : "",
    archivedBy: archived ? existing?.archivedBy || state.currentUser?.id || "" : "",
  });
  resetForm("project-form");
}

async function onStudentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const existing = state.students.find((student) => student.id === data.get("id"));
  if (existing?.archived === true) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  const projectIds = [...form.elements.projectIds.selectedOptions].map((option) => option.value);
  if (!projectIds.length) {
    toast("Bitte mindestens ein Projekt auswählen");
    return;
  }

  if (studentArchivedProjectDataWouldChange(data.get("id"), projectIds, data)) {
    toast("Archivierte Projektzuordnungen sind gesperrt. Bitte Projekt erst wieder öffnen.");
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
    projectDataByProject: Object.fromEntries(projectIds.map((projectId) => [
      projectId,
      {
        role: data.get(`projectRole:${projectId}`) || data.get("role"),
        documentStatus: data.get(`projectDocumentStatus:${projectId}`) || data.get("documentStatus"),
        mobilityNote: (data.get(`projectMobilityNote:${projectId}`) || "").trim(),
        emergencyContact1: (data.get(`projectEmergencyContact1:${projectId}`) || "").trim(),
        emergencyContact2: (data.get(`projectEmergencyContact2:${projectId}`) || "").trim(),
        allergies: (data.get(`projectAllergies:${projectId}`) || "").trim(),
        medicalNotes: (data.get(`projectMedicalNotes:${projectId}`) || "").trim(),
        insurance: (data.get(`projectInsurance:${projectId}`) || "").trim(),
        mediaConsent: (data.get(`projectMediaConsent:${projectId}`) || "").trim(),
      },
    ])),
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
  if (projectIsArchived(data.projectId)) {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }
  if (studentIsArchived(data.studentId)) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
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
  if (projectIsArchived(data.projectId)) {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }
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
  if (projectIsArchived(data.projectId)) {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }
  if (studentIsArchived(data.studentId)) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
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
  const linkedProjects = state.projects.filter((project) => effectiveProjectFundingBudgetId(project) === data.id && projectOverlapsFundingBudget(project, budgetDraft));
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

async function onTemplateDefaultsSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen feste Formulardaten verwalten");
    return;
  }
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  await put("settings", { id: "templateDefaults", values });
  await addAuditLog("Aktualisiert", "settings", { id: "templateDefaults", name: "Feste Formulardaten" });
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup("feste-formulardaten-aktualisiert");
  render();
  toast("Feste Formulardaten gespeichert");
}

function resetTemplateDefaultsForm() {
  fillTemplateDefaultsForm({});
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
  renderForms();
  renderUsers();
  renderFundingBudgets();
  renderInstitutions();
  renderSettings();
  renderHelp();
  renderAutomaticBackupStatus();
  enhanceClearableFields();
}

function renderDashboard() {
  const activeProjects = state.projects.filter((project) => project.status === "Aktiv");
  const openTasks = state.tasks.filter((task) => task.status !== "Erledigt");
  const travellingStudents = state.students.filter((student) => (student.projectIds || []).some((projectId) => {
    const project = state.projects.find((entry) => entry.id === projectId);
    return project?.status === "Aktiv" && studentProjectProfile(student, projectId).role === "Teilnehmer";
  })).length;
  const overview = fundingOverview();
  const activeFundingCount = state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv").length;
  const unplannedDetail = activeFundingCount > 1 ? `Summe aus ${activeFundingCount} aktiven Förderbudgets` : "aus einem aktiven Förderbudget";

  document.querySelector("#kpi-grid").innerHTML = [
    kpi("Aktive Projekte", activeProjects.length),
    kpi("In Projekten offen", money.format(overview.plannedOpen)),
    kpi("nicht verplantes Budget", money.format(overview.unplanned), unplannedDetail),
    kpi("Projektbudget ohne Förderbudget", money.format(overview.unassignedPlannedBudget), "wird nicht vom Förderbudget abgezogen"),
    kpi("Offene Aufgaben", openTasks.length),
    kpi("Reisende Teilnehmende", travellingStudents),
  ].join("");

  const statusFilter = document.querySelector("#dashboard-status-filter").value;
  const projects = filterText(state.projects).filter((project) => !statusFilter || project.status === statusFilter);
  renderProjectStatusSummary();
  renderFundingChart();
  renderFundingBudgetBreakdown();
  renderList("#project-status-list", projects.map(projectStatusCard));

  renderRiskCenter();
  renderAuditLog();
}

function renderProjectStatusSummary() {
  const statuses = ["Geplant", "Aktiv", "Abrechnung", "Abgeschlossen", "Archiviert"];
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
  const { totalFunding, plannedBudget, spent, unplanned, plannedOpen, overplanned, unassignedPlannedBudget } = fundingOverview();
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
      ${legendItem("Verbraucht", money.format(spent), "spent", `${spentPercent}% vom Förderbudget`)}
      ${legendItem("Verplant offen", money.format(plannedOpen), "planned", `${plannedPercent}% vom Förderbudget`)}
      ${legendItem("Nicht verplant", money.format(remaining), "remaining", `${remainingPercent}% vom Förderbudget`)}
      ${overplanned ? legendItem("Überplant", money.format(overplanned), "danger", "Projektbudgets überschreiten das Förderbudget") : ""}
      ${unassignedPlannedBudget ? legendItem("Ohne Förderbudget", money.format(unassignedPlannedBudget), "danger", "nicht in dieser Verteilung enthalten") : ""}
    </div>
  `;
}

function fundingOverview() {
  const activeBudgets = state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv");
  const activeBudgetIds = new Set(activeBudgets.map((budget) => budget.id));
  const fundedProjects = state.projects.filter((project) => {
    const budgetId = effectiveProjectFundingBudgetId(project);
    const budget = state.fundingBudgets.find((entry) => entry.id === budgetId);
    return activeBudgetIds.has(budgetId) && projectOverlapsFundingBudget(project, budget);
  });
  const fundedProjectIds = new Set(fundedProjects.map((project) => project.id));
  const unassignedProjects = state.projects.filter((project) => !fundedProjectIds.has(project.id));
  const totalFunding = activeBudgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0);
  const plannedBudget = fundedProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const unassignedPlannedBudget = unassignedProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
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
    unassignedPlannedBudget,
  };
}

function renderFundingBudgetBreakdown() {
  const rows = state.fundingBudgets
    .filter((budget) => budget.status !== "Inaktiv")
    .map(fundingBudgetSummary);
  const orphanSummary = fundingOrphanSummary();
  const container = document.querySelector("#funding-budget-breakdown");

  container.innerHTML = `
    <div class="budget-breakdown-grid">
      ${rows.map(budgetBreakdownCard).join("") || emptyState()}
      ${orphanSummary.planned || orphanSummary.spent ? budgetBreakdownCard(orphanSummary, true) : ""}
    </div>
  `;
}

function fundingBudgetSummary(budget) {
  const projects = state.projects.filter((project) => effectiveProjectFundingBudgetId(project) === budget.id && projectOverlapsFundingBudget(project, budget));
  const projectIds = new Set(projects.map((project) => project.id));
  const planned = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const spent = state.expenses
    .filter((expense) => projectIds.has(expense.projectId))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const total = Number(budget.amount || 0);
  return {
    id: budget.id,
    name: budget.name,
    period: `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`,
    total,
    planned,
    spent,
    plannedOpen: Math.max(planned - spent, 0),
    unplanned: total - planned,
    overplanned: Math.max(planned - total, 0),
    projectCount: projects.length,
  };
}

function fundingOrphanSummary() {
  const activeBudgetIds = new Set(state.fundingBudgets.filter((budget) => budget.status !== "Inaktiv").map((budget) => budget.id));
  const projects = state.projects.filter((project) => {
    const budgetId = effectiveProjectFundingBudgetId(project);
    const budget = state.fundingBudgets.find((entry) => entry.id === budgetId);
    return !activeBudgetIds.has(budgetId) || !budget || !projectOverlapsFundingBudget(project, budget);
  });
  const projectIds = new Set(projects.map((project) => project.id));
  const planned = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const spent = state.expenses
    .filter((expense) => projectIds.has(expense.projectId))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  return {
    id: "orphan",
    name: "Ohne gültiges Förderbudget",
    period: "Bitte im Projekt bearbeiten",
    total: 0,
    planned,
    spent,
    plannedOpen: Math.max(planned - spent, 0),
    unplanned: 0,
    overplanned: planned,
    projectCount: projects.length,
  };
}

function budgetBreakdownCard(summary, isOrphan = false) {
  const base = Math.max(summary.total, summary.planned, summary.spent, 1);
  const spentPercent = Math.min(100, Math.round((summary.spent / base) * 100));
  const plannedPercent = Math.min(100, Math.round((summary.plannedOpen / base) * 100));
  const freePercent = Math.min(100, Math.round((Math.max(summary.unplanned, 0) / base) * 100));
  return `
    <article class="budget-card ${isOrphan || summary.overplanned ? "warn" : ""}">
      <div class="budget-card-head">
        <div>
          <strong>${escapeHtml(summary.name)}</strong>
          <span>${escapeHtml(summary.period)} · ${summary.projectCount} Projekt${summary.projectCount === 1 ? "" : "e"}</span>
        </div>
        ${summary.overplanned ? badge(isOrphan ? "Zuordnen" : "Überplant", "danger") : badge("OK", "ok")}
      </div>
      <div class="budget-meter" title="${escapeHtml(`Gesamt: ${money.format(summary.total)} | Verplant: ${money.format(summary.planned)} | Ausgegeben: ${money.format(summary.spent)} | Nicht verplant: ${money.format(summary.unplanned)}`)}">
        <span class="spent" style="width:${spentPercent}%"></span>
        <span class="planned" style="width:${plannedPercent}%"></span>
        <span class="free" style="width:${freePercent}%"></span>
      </div>
      <div class="budget-values">
        <span><small>Gesamt</small><strong>${money.format(summary.total)}</strong></span>
        <span><small>Verplant</small><strong>${money.format(summary.planned)}</strong></span>
        <span><small>Ausgegeben</small><strong>${money.format(summary.spent)}</strong></span>
        <span><small>In Projekten offen</small><strong>${money.format(summary.plannedOpen)}</strong></span>
        <span><small>Nicht verplant</small><strong>${money.format(summary.unplanned)}</strong></span>
      </div>
    </article>
  `;
}

function detailCard(title, rows) {
  return `
    <section class="detail-card">
      <h3>${escapeHtml(title)}</h3>
      <dl>
        ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function projectFileTable(title, headers, rows) {
  return `
    <section class="detail-card wide">
      <h3>${escapeHtml(title)}</h3>
      <div class="table-wrap project-file-table">
        <table>
          ${rows.length ? `
            <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
            <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
          ` : `<tbody><tr><td>${emptyState()}</td></tr></tbody>`}
        </table>
      </div>
    </section>
  `;
}

function templateActions(projectId, studentId) {
  return `
    <div class="row-actions">
      <button class="small secondary" data-template-doc="certificate" data-project-id="${projectId}" data-student-id="${studentId}">Bescheinigung</button>
      <button class="small secondary" data-template-doc="learningAgreement" data-project-id="${projectId}" data-student-id="${studentId}">Lernvereinbarung</button>
      <button class="small secondary" data-template-doc="europass" data-project-id="${projectId}" data-student-id="${studentId}">Europass</button>
    </div>
  `;
}

function showTemplateDocument(type, projectId, studentId) {
  const project = state.projects.find((entry) => entry.id === projectId);
  const student = state.students.find((entry) => entry.id === studentId);
  if (!project || !student) {
    toast("Vorlage konnte nicht erstellt werden");
    return;
  }
  if (state.view !== "forms") {
    state.view = "forms";
    render();
  }
  state.templateDocument = { type, projectId, studentId };
  document.querySelector("#mobility-form-project").value = projectId;
  fillMobilityFormStudentSelect();
  document.querySelector("#mobility-form-type").value = type;
  document.querySelector("#mobility-form-student").value = studentId;
  const values = templateValues(type, project, student);
  document.querySelector("#template-document-title").textContent = templateTitleForProject(type, project);
  document.querySelector("#template-document").innerHTML = renderTemplateByType(type, project, student, values);
  bindTemplateSaveTracking();
  setTemplateDocumentLocked(project.status === "Archiviert" || student.archived === true);
  setTemplateSaveStatus(templateHasSavedValues(type, projectId, studentId) ? "saved" : "new");
  enhanceClearableFields();
  resizeTemplateTextareas();
  document.querySelector("#template-document-panel").hidden = false;
  document.querySelector("#template-document-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openTemplateDocument(type, projectId, studentId) {
  if (state.view !== "projects") {
    state.view = "projects";
    render();
  }
  showTemplateDocument(type, projectId, studentId);
}

function showTemplateBatch(type, projectId) {
  const project = state.projects.find((entry) => entry.id === projectId);
  const students = projectStudents(projectId);
  if (!project || !students.length) {
    toast("Keine Teilnehmenden für die Batch-Ausgabe gefunden");
    return;
  }
  if (state.view !== "forms") {
    state.view = "forms";
    render();
  }
  state.templateDocument = { type, projectId, studentId: "" };
  document.querySelector("#mobility-form-project").value = projectId;
  fillMobilityFormStudentSelect();
  document.querySelector("#mobility-form-type").value = type;
  document.querySelector("#mobility-form-student").value = "";
  document.querySelector("#template-document-title").textContent = `${templateTitleForProject(type, project)} · ${students.length} Teilnehmende`;
  document.querySelector("#template-document").innerHTML = `
    <div class="template-batch">
      ${students.map((student) => `<div class="template-page">${renderTemplateByType(type, project, student, templateValues(type, project, student))}</div>`).join("")}
    </div>
  `;
  setTemplateDocumentLocked(true);
  setTemplateSaveStatus("batch");
  enhanceClearableFields();
  resizeTemplateTextareas();
  document.querySelector("#template-document-panel").hidden = false;
  document.querySelector("#template-document-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function templateTitle(type) {
  const customTemplate = getPrintableFormTemplates().find((template) => template.id === type);
  if (customTemplate) return customTemplate.title;
  if (type === "europass") return "Europass Mobilität";
  if (type === "certificate") return "Teilnahmebescheinigung";
  return "Europass Lernvereinbarung";
}

function templateTitleForProject(type, project) {
  if (!project) return templateTitle(type);
  if (type === "learningAgreement" && !projectIsIndividual(project)) return "Lernprogramm";
  return templateTitle(type);
}

function renderTemplateByType(type, project, student, values) {
  if (type === "europass") return europassTemplate(project, student, values);
  if (type === "certificate") return certificateTemplate(project, student, values);
  if (type === "emergencyCard") return emergencyCardTemplate(project, student, values);
  const customTemplate = getMobilityFormTemplate(type);
  if (customTemplate) return mobilityFormTemplate(customTemplate, project, student, values);
  return learningAgreementTemplate(project, student, values);
}

function closeTemplateDocument() {
  state.templateDocument = null;
  clearTimeout(templateAutoSaveTimer);
  document.querySelector("#template-document-panel").hidden = true;
  document.querySelector("#template-document").innerHTML = "";
  setTemplateSaveStatus("hidden");
}

function printTemplateDocument() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    document.body.classList.add("printing-template-document");
    window.print();
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildTemplatePrintDocument());
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  });
}

function buildTemplatePrintDocument() {
  const title = document.querySelector("#template-document-title")?.textContent || "Erasmus+ Dokument";
  return `<!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <link rel="stylesheet" href="${new URL("styles.css", document.baseURI).href}" />
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          html, body { margin: 0; padding: 0; background: #fff; color: #17202a; }
          .print-document { margin: 0; padding: 0; background: #fff; }
          .print-page {
            display: block;
            box-sizing: border-box;
            background: #fff;
          }
          .print-page + .print-page {
            break-before: page;
            page-break-before: always;
          }
          .template-document {
            border: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .template-batch {
            display: block !important;
            gap: 0 !important;
          }
          .template-page {
            min-height: 0 !important;
            break-before: auto !important;
            page-break-before: auto !important;
            break-after: auto !important;
            page-break-after: auto !important;
          }
          .eu-template {
            max-width: none !important;
            margin: 0 !important;
            color: #17202a !important;
            font-size: 9.5pt !important;
          }
          .eu-template,
          .eu-template section,
          .eu-template header,
          .template-notice {
            background: #fff !important;
            box-shadow: none !important;
          }
          .eu-template header {
            padding: 8px 10px !important;
            margin-bottom: 5px !important;
          }
          .eu-template header h1 {
            font-size: 15pt !important;
          }
          .eu-template section {
            padding: 6px 8px !important;
            margin-top: 5px !important;
          }
          .eu-template section h2 {
            margin-bottom: 4px !important;
            font-size: 9.5pt !important;
          }
          .eu-template th,
          .eu-template td {
            padding: 3px 4px !important;
            line-height: 1.15 !important;
          }
          .eu-template p {
            line-height: 1.25 !important;
          }
          .template-print-value,
          .template-print-text {
            display: block !important;
            min-height: 1.2em !important;
            color: #17202a !important;
          }
          .template-print-text {
            white-space: pre-wrap !important;
            line-height: 1.25 !important;
          }
          .template-notice {
            padding: 5px 7px !important;
            font-size: 8.5pt !important;
          }
          .signature-grid {
            gap: 7px !important;
          }
          .signature-grid span {
            height: 28px !important;
            margin-bottom: 4px !important;
          }
          .template-batch .eu-template {
            border-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
          .clear-field,
          .no-print {
            display: none !important;
          }
          .template-input,
          .template-textarea {
            border: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            color: #17202a !important;
            resize: none !important;
            min-height: 0 !important;
            line-height: 1.2 !important;
          }
        </style>
      </head>
      <body>
        <main class="print-document">${templatePrintPagesHtml()}</main>
      </body>
    </html>`;
}

function templatePrintPagesHtml() {
  const source = document.querySelector("#template-document");
  if (!source) return "";
  const clone = source.cloneNode(true);
  copyTemplateFieldValuesForPrint(source, clone);
  const batchPages = [...clone.querySelectorAll(".template-page")];
  if (batchPages.length) {
    return batchPages.map((page) => `<section class="print-page">${page.innerHTML}</section>`).join("");
  }
  return `<section class="print-page">${clone.innerHTML}</section>`;
}

function copyTemplateFieldValuesForPrint(source, clone) {
  const sourceFields = source.querySelectorAll("input, textarea, select");
  const cloneFields = clone.querySelectorAll("input, textarea, select");
  sourceFields.forEach((sourceField, index) => {
    const cloneField = cloneFields[index];
    if (!cloneField) return;
    const replacement = document.createElement(cloneField.tagName === "TEXTAREA" ? "div" : "span");
    replacement.className = cloneField.tagName === "TEXTAREA" ? "template-print-text" : "template-print-value";
    replacement.textContent = fieldDisplayValue(sourceField);
    cloneField.replaceWith(replacement);
  });
}

function fieldDisplayValue(field) {
  if (field.tagName === "SELECT") {
    return field.selectedOptions?.[0]?.textContent || field.value || "";
  }
  return field.value || "";
}

async function saveTemplateValues(options = {}) {
  if (!state.templateDocument) return;
  if (!state.templateDocument.studentId) {
    toast("Batch-Ausgaben werden aus den Einzelwerten erzeugt. Bitte Einzelvorlage speichern.");
    return;
  }
  if (projectIsArchived(state.templateDocument.projectId) || studentIsArchived(state.templateDocument.studentId)) {
    setTemplateSaveStatus("locked");
    if (!options.silent) toast("Archivierte Projekte oder Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  clearTimeout(templateAutoSaveTimer);
  const fields = {};
  document.querySelectorAll("#template-document [data-template-field]").forEach((field) => {
    fields[field.dataset.templateField] = field.value;
  });
  setTemplateSaveStatus(options.silent ? "autosaving" : "saving");
  const record = {
    id: templateDataId(state.templateDocument.type, state.templateDocument.projectId, state.templateDocument.studentId),
    ...state.templateDocument,
    fields,
  };
  await put("templateData", record);
  await addAuditLog("Aktualisiert", "templateData", record);
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup("vorlagenwerte-aktualisiert");
  setTemplateSaveStatus("saved", new Date().toISOString());
  if (!options.silent) toast("Vorlagenwerte gespeichert");
}

async function resetTemplateValues() {
  if (!state.templateDocument || !confirm("Gespeicherte Werte für diese Vorlage zurücksetzen?")) return;
  await remove("templateData", templateDataId(state.templateDocument.type, state.templateDocument.projectId, state.templateDocument.studentId));
  await addAuditLog("Gelöscht", "templateData", {
    ...state.templateDocument,
    id: templateDataId(state.templateDocument.type, state.templateDocument.projectId, state.templateDocument.studentId),
  });
  await loadState();
  const current = state.templateDocument;
  showTemplateDocument(current.type, current.projectId, current.studentId);
  syncSQLiteSnapshot();
  createAutomaticBackup("vorlagenwerte-zurueckgesetzt");
  setTemplateSaveStatus("new");
  toast("Standardwerte wiederhergestellt");
}

function templateValues(type, project, student) {
  const defaults = defaultTemplateValues(type, project, student);
  const saved = state.templateData.find((entry) => entry.id === templateDataId(type, project.id, student.id))?.fields || {};
  return { ...defaults, ...saved };
}

function templateHasSavedValues(type, projectId, studentId) {
  return state.templateData.some((entry) => entry.id === templateDataId(type, projectId, studentId));
}

function bindTemplateSaveTracking() {
  clearTimeout(templateAutoSaveTimer);
  document.querySelectorAll("#template-document [data-template-field]").forEach((field) => {
    if (field.tagName === "TEXTAREA") resizeTemplateTextarea(field);
    field.addEventListener("input", () => {
      if (field.tagName === "TEXTAREA") resizeTemplateTextarea(field);
      setTemplateSaveStatus("dirty");
      clearTimeout(templateAutoSaveTimer);
      templateAutoSaveTimer = setTimeout(() => {
        saveTemplateValues({ silent: true }).catch((error) => {
          console.warn("Vorlagenwerte konnten nicht automatisch gespeichert werden", error);
          setTemplateSaveStatus("error");
        });
      }, 900);
    });
  });
}

function resizeTemplateTextareas() {
  document.querySelectorAll("#template-document textarea.template-textarea").forEach(resizeTemplateTextarea);
}

function resizeTemplateTextarea(field) {
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight + 2}px`;
}

function setTemplateDocumentLocked(locked) {
  document.querySelectorAll("#template-document [data-template-field]").forEach((field) => {
    if (field.tagName === "TEXTAREA" || field.tagName === "INPUT") field.readOnly = locked;
    if (field.tagName === "SELECT") field.disabled = locked;
  });
  document.querySelector("#save-template-values").disabled = locked;
  document.querySelector("#reset-template-values").disabled = locked;
}

function setTemplateSaveStatus(status, savedAt = "") {
  const element = document.querySelector("#template-save-status");
  if (!element) return;
  element.dataset.status = status;
  const savedTime = savedAt ? new Date(savedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
  const labels = {
    hidden: "",
    batch: "Batch-Ausgabe",
    new: "Noch nicht gespeichert",
    dirty: "Änderungen nicht gespeichert",
    saving: "Speichere...",
    autosaving: "Autospeichern...",
    saved: savedTime ? `Gesichert um ${savedTime}` : "Gespeichert",
    locked: "Archiviert · nur lesbar",
    error: "Nicht gesichert",
  };
  element.textContent = labels[status] || "";
}

function defaultTemplateValues(type, project, student) {
  const defaults = getTemplateDefaults();
  const profile = studentProjectProfile(student, project.id);
  const sendingInstitution = defaults.sendingInstitution || "Bitte Schulname ergänzen";
  const recognitionText = defaults.recognitionText || "Die erreichten Lernergebnisse wurden durch die beteiligten Einrichtungen bestätigt. Details bitte nach Abschluss der Mobilität ergänzen.";
  const common = {
    sendingInstitution,
    sendingCity: defaults.sendingCity || "",
    contactPerson: defaults.contactPerson || "",
    contactEmail: defaults.contactEmail || "",
    receivingInstitution: stripHtml(projectInstitutionNames(project)),
    learningOutcomes: projectLearningOutcomes(project),
    activities: project.completedActivities || projectTaskList(project.id, type === "europass" ? "Aus Projektaufgaben übernehmen und nach der Mobilität anpassen" : "Offen, In Arbeit oder geplant"),
    completedActivities: project.completedActivities || "",
    recognitionText,
    mediaConsent: profile.mediaConsent || "Bitte Auswahl / Einschränkungen ergänzen.",
    emergencyContact1: profile.emergencyContact1 || "Bitte Name, Beziehung und Telefonnummer ergänzen.",
    emergencyContact2: profile.emergencyContact2 || "Bitte optional ergänzen.",
    allergies: profile.allergies || "Keine Angaben / bitte ergänzen.",
    medicalNotes: profile.medicalNotes || "Keine Angaben / bitte ergänzen.",
    insurance: profile.insurance || "Bitte Versicherung / Auslandsschutz ergänzen.",
  };
  const customTemplate = getMobilityFormTemplate(type);
  if (customTemplate) {
    return {
      ...common,
      formBody: applyTemplatePlaceholders(customTemplate.body, project, student, common),
    };
  }
  if (type === "europass") {
    return {
      ...common,
      mobilityDescription: `Teilnahme an ${project.name} im Rahmen von Erasmus+ ${project.action}.`,
      acquiredCompetences: common.learningOutcomes,
      assessmentRecognition: recognitionText,
    };
  }
  if (type === "certificate") {
    return {
      ...common,
      certificateText: `${student.name} hat im Zeitraum ${formatDate(project.startDate)} bis ${formatDate(project.endDate)} am Erasmus+ Projekt "${project.name}" teilgenommen.`,
      certificateDetails: `Mobilität nach ${project.destinationCountry || "Bitte Land ergänzen"} mit der aufnehmenden Einrichtung ${common.receivingInstitution}.${project.completedActivities ? `\n\nDurchgeführte Aktivitäten:\n${project.completedActivities}` : ""}`,
      certificateRecognition: recognitionText,
    };
  }
  return {
    ...common,
    responsibilities: "Teilnehmende Person: aktive Teilnahme, Dokumentation der Lernergebnisse, Einhaltung der Vereinbarungen. Entsendende Einrichtung: Vorbereitung, Betreuung, Anerkennung. Aufnehmende Einrichtung: Lerngelegenheiten, Begleitung, Rückmeldung.",
    monitoringRecognition: recognitionText,
  };
}

function templateDataId(type, projectId, studentId) {
  return `${type}:${projectId}:${studentId}`;
}

function getPrintableFormTemplates() {
  const customTemplates = getMobilityFormTemplates();
  const builtIns = [
    { id: "certificate", title: "Teilnahmebescheinigung", subtitle: "Nachweis zur Ausgabe nach der Mobilität", notice: "Vorgefüllte Bescheinigung aus Projektdaten." },
    { id: "europass", title: "Europass Mobilität", subtitle: "Nachweis einer Lernmobilität im Ausland", notice: "Europass-ähnliche Arbeitsvorlage mit Lernergebnissen." },
  ];
  return [...customTemplates, ...builtIns.filter((item) => !customTemplates.some((template) => template.id === item.id))];
}

function getMobilityFormTemplates() {
  const saved = Array.isArray(state.settings.mobilityFormTemplates) ? state.settings.mobilityFormTemplates : [];
  return DEFAULT_MOBILITY_FORM_TEMPLATES.map((defaultTemplate) => ({
    ...defaultTemplate,
    ...(saved.find((template) => template.id === defaultTemplate.id) || {}),
  }));
}

function getMobilityFormTemplate(type) {
  return getMobilityFormTemplates().find((template) => template.id === type);
}

function applyTemplatePlaceholders(text, project, student, values) {
  const replacements = {
    name: student.name,
    klasse: student.className,
    geburtsdatum: formatDate(student.birthDate),
    projekt: project.name,
    leitaktion: project.action,
    mobilitaetsart: projectMobilityType(project),
    zeitraum: `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
    zielland: project.destinationCountry || "",
    projektbudget: money.format(Number(project.budget || 0)),
    entsendende_schule: values.sendingInstitution,
    aufnehmende_einrichtung: values.receivingInstitution,
    lernziele: values.learningOutcomes,
    aktivitaeten: values.activities,
    durchgefuehrte_aktivitaeten: values.completedActivities,
    anerkennung: values.recognitionText || values.assessmentRecognition || getTemplateDefaults().recognitionText || "",
    medienregelung: values.mediaConsent,
    notfallkontakt_1: values.emergencyContact1,
    notfallkontakt_2: values.emergencyContact2,
    allergien: values.allergies,
    medizinische_hinweise: values.medicalNotes,
    versicherung: values.insurance,
  };
  return String(text || "").replace(/\{([a-zA-Z0-9_äöüÄÖÜß]+)\}/g, (match, key) => replacements[key] ?? match);
}

function learningAgreementTemplate(project, student, values) {
  return `
    <article class="eu-template">
      <header>
        <p>Erasmus+ Schulbildung</p>
        <h1>Europass Lernvereinbarung</h1>
      </header>
      ${templateNotice("Vorlage ist vorausgefüllt und editierbar. Sie dient als Arbeitsvorlage für die Lernvereinbarung in Erasmus+ Schulbildung.")}
      ${templateSection("1. Teilnehmende Person", [
        ["Name", student.name],
        ["Klasse", student.className],
        ["Geburtsdatum", formatDate(student.birthDate)],
      ])}
      ${templateSection("2. Mobilität", [
        ["Projekt", project.name],
        ["Leitaktion", project.action],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
        ["Zielland", project.destinationCountry || "-"],
        ["Aufnehmende Einrichtung", values.receivingInstitution, "receivingInstitution"],
        ["Entsendende Einrichtung", values.sendingInstitution, "sendingInstitution"],
        ["Schulort", values.sendingCity, "sendingCity"],
        ["Ansprechpartner*in", values.contactPerson, "contactPerson"],
        ["Kontakt E-Mail", values.contactEmail, "contactEmail"],
      ])}
      ${templateTextSection("3. Lernziele und erwartete Lernergebnisse", values.learningOutcomes, "learningOutcomes")}
      ${templateTextSection("4. Geplante Aktivitäten", values.activities, "activities")}
      ${templateTextSection("5. Aufgaben und Zuständigkeiten", values.responsibilities, "responsibilities")}
      ${templateTextSection("6. Begleitung, Monitoring und Anerkennung", values.monitoringRecognition, "monitoringRecognition")}
      ${signatureGrid(["Teilnehmende*r", "Erziehungsberechtigte", "Entsendende Schule", "Aufnehmende Schule"])}
    </article>
  `;
}

function mobilityFormTemplate(template, project, student, values) {
  const signatures = String(template.signatures || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return `
    <article class="eu-template mobility-form-template">
      <header>
        <p>Erasmus+ Schulbildung</p>
        <h1>${escapeHtml(templateTitleForProject(template.id, project))}</h1>
        ${template.subtitle ? `<span>${escapeHtml(template.subtitle)}</span>` : ""}
      </header>
      ${template.notice ? templateNotice(template.notice) : ""}
      ${templateSection("Teilnehmende Person", [
        ["Name", student.name],
        ["Klasse / Gruppe", student.className],
        ["Geburtsdatum", formatDate(student.birthDate)],
      ])}
      ${templateSection("Projekt und Einrichtungen", [
        ["Projekt", project.name],
        ["Leitaktion", project.action],
        ["Mobilitätsart", projectMobilityType(project)],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
        ["Zielland", project.destinationCountry || "-"],
        ["Aufnehmende Einrichtung", values.receivingInstitution, "receivingInstitution"],
        ["Entsendende Einrichtung", values.sendingInstitution, "sendingInstitution"],
        ["Ansprechpartner*in", values.contactPerson, "contactPerson"],
        ["Kontakt E-Mail", values.contactEmail, "contactEmail"],
      ])}
      ${templateTextSection("Formularinhalt", values.formBody, "formBody")}
      ${signatures.length ? signatureGrid(signatures) : ""}
    </article>
  `;
}

function emergencyCardTemplate(project, student, values) {
  const template = getMobilityFormTemplate("emergencyCard") || {};
  const signatures = String(template.signatures || "Erziehungsberechtigte, Betreuende Lehrkraft")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return `
    <article class="eu-template mobility-form-template emergency-card-template">
      <header>
        <p>Erasmus+ Schulbildung</p>
        <h1>${escapeHtml(template.title || "Medizinische Notfallkarte")}</h1>
        <span>${escapeHtml(template.subtitle || "Gesundheitsblatt und Notfallkontakte")}</span>
      </header>
      ${template.notice ? templateNotice(template.notice) : ""}
      ${templateSection("Teilnehmende Person", [
        ["Name", student.name],
        ["Klasse / Gruppe", student.className],
        ["Geburtsdatum", formatDate(student.birthDate)],
      ])}
      ${templateSection("Mobilität", [
        ["Projekt", project.name],
        ["Mobilitätsart", projectMobilityType(project)],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
        ["Zielland", project.destinationCountry || "-"],
        ["Aufnehmende Einrichtung", values.receivingInstitution, "receivingInstitution"],
        ["Entsendende Einrichtung", values.sendingInstitution, "sendingInstitution"],
      ])}
      ${templateSection("Notfallkontakte", [
        ["Notfallkontakt 1", values.emergencyContact1, "emergencyContact1"],
        ["Notfallkontakt 2", values.emergencyContact2, "emergencyContact2"],
      ])}
      ${templateTextSection("Allergien / Unverträglichkeiten", values.allergies, "allergies")}
      ${templateTextSection("Medizinische Hinweise", values.medicalNotes, "medicalNotes")}
      ${templateTextSection("Versicherung / Besonderheiten", values.insurance, "insurance")}
      ${template.body ? templateTextSection("Weitere Hinweise", values.formBody, "formBody") : ""}
      ${signatures.length ? signatureGrid(signatures) : ""}
    </article>
  `;
}

function europassTemplate(project, student, values) {
  return `
    <article class="eu-template">
      <header>
        <p>Europass</p>
        <h1>Europass Mobilität</h1>
        <span>Nachweis einer Lernmobilität im Ausland</span>
      </header>
      ${templateNotice("Dieses Dokument wird nach der Mobilität aus der Lernvereinbarung abgeleitet und um erreichte Lernergebnisse ergänzt.")}
      ${templateSection("1. Inhaber*in des Dokuments", [
        ["Name", student.name],
        ["Geburtsdatum", formatDate(student.birthDate)],
        ["Klasse", student.className],
      ])}
      ${templateSection("2. Beteiligte Einrichtungen", [
        ["Entsendende Einrichtung", values.sendingInstitution, "sendingInstitution"],
        ["Aufnehmende Einrichtung", values.receivingInstitution, "receivingInstitution"],
        ["Schulort", values.sendingCity, "sendingCity"],
        ["Ansprechpartner*in", values.contactPerson, "contactPerson"],
        ["Kontakt E-Mail", values.contactEmail, "contactEmail"],
        ["Projekt", project.name],
        ["Mobilitätsart", projectMobilityType(project)],
        ["Land", project.destinationCountry || "-"],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
      ])}
      ${templateTextSection("3. Beschreibung der Mobilität", values.mobilityDescription, "mobilityDescription")}
      ${templateTextSection("4. Durchgeführte Aktivitäten", values.activities, "activities")}
      ${templateTextSection("5. Erworbene Kenntnisse, Fähigkeiten und Kompetenzen", values.acquiredCompetences, "acquiredCompetences")}
      ${templateTextSection("6. Bewertung / Anerkennung", values.assessmentRecognition, "assessmentRecognition")}
      ${signatureGrid(["Entsendende Einrichtung", "Aufnehmende Einrichtung"])}
    </article>
  `;
}

function certificateTemplate(project, student, values) {
  return `
    <article class="eu-template certificate-template">
      <header>
        <p>Erasmus+ Schulbildung</p>
        <h1>Teilnahmebescheinigung</h1>
        <span>${escapeHtml(project.name)}</span>
      </header>
      ${templateSection("Teilnehmende Person", [
        ["Name", student.name],
        ["Klasse", student.className],
        ["Geburtsdatum", formatDate(student.birthDate)],
      ])}
      ${templateSection("Projekt", [
        ["Projektname", project.name],
        ["Leitaktion", project.action],
        ["Mobilitätsart", projectMobilityType(project)],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
        ["Zielland", project.destinationCountry || "-"],
        ["Aufnehmende Einrichtung", values.receivingInstitution, "receivingInstitution"],
        ["Entsendende Einrichtung", values.sendingInstitution, "sendingInstitution"],
        ["Schulort", values.sendingCity, "sendingCity"],
        ["Ansprechpartner*in", values.contactPerson, "contactPerson"],
        ["Kontakt E-Mail", values.contactEmail, "contactEmail"],
      ])}
      ${templateTextSection("Bescheinigung", values.certificateText, "certificateText")}
      ${templateTextSection("Angaben zur Mobilität", values.certificateDetails, "certificateDetails")}
      ${templateTextSection("Bestätigung / Anerkennung", values.certificateRecognition, "certificateRecognition")}
      ${signatureGrid(["Entsendende Schule", "Aufnehmende Schule"])}
    </article>
  `;
}

function templateSection(title, rows) {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <table>
        <tbody>${rows.map(([label, value, field]) => `<tr><th>${escapeHtml(label)}</th><td>${field ? templateInput(field, value) : escapeHtml(value)}</td></tr>`).join("")}</tbody>
      </table>
    </section>
  `;
}

function templateTextSection(title, text, field) {
  return `<section><h2>${escapeHtml(title)}</h2>${field ? templateTextarea(field, text) : `<p>${escapeHtml(text)}</p>`}</section>`;
}

function templateInput(field, value) {
  return `<input class="template-input" data-template-field="${escapeHtml(field)}" value="${escapeHtml(value)}" />`;
}

function templateTextarea(field, value) {
  return `<textarea class="template-textarea" data-template-field="${escapeHtml(field)}" rows="4">${escapeHtml(value)}</textarea>`;
}

function templateNotice(text) {
  return `<div class="template-notice">${escapeHtml(text)}</div>`;
}

function signatureGrid(labels) {
  return `<section><h2>Unterschriften</h2><div class="signature-grid">${labels.map((label) => `<div><span></span><strong>${escapeHtml(label)}</strong><small>Ort, Datum, Unterschrift</small></div>`).join("")}</div></section>`;
}

function projectLearningOutcomes(project) {
  const taskTitles = state.tasks.filter((task) => task.projectId === project.id).map((task) => task.title);
  if (taskTitles.length) return `Erwartete bzw. erreichte Lernergebnisse aus dem Projekt: ${taskTitles.join("; ")}.`;
  return "Fachliche, sprachliche, interkulturelle und persönliche Kompetenzen aus der Mobilität bitte konkret ergänzen.";
}

function projectTaskList(projectId, fallback) {
  const tasks = state.tasks.filter((task) => task.projectId === projectId);
  return tasks.length ? tasks.map((task) => `${task.title} (${task.status})`).join("; ") : fallback;
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
      label: "Förderbudget",
      title: project.name,
      context: budget ? fundingBudgetName(budget.id) : "Nicht eindeutig zugeordnet",
      detail: budget ? "Projektzeitraum passt nicht zum Förderzeitraum" : "Budget wird nicht in den Fördergeldsummen gezählt",
    }));

  const individualMobilityIssues = state.projects
    .filter((project) => projectIsIndividual(project) && project.status !== "Archiviert")
    .flatMap((project) => projectStudents(project.id).map((student) => ({ project, student, profile: studentProjectProfile(student, project.id) })))
    .filter(({ project, student, profile }) => {
      const hasLearningAgreement = state.templateData.some((entry) => entry.type === "learningAgreement" && entry.projectId === project.id && entry.studentId === student.id);
      return !hasLearningAgreement || !profile.emergencyContact1;
    })
    .map(({ project, student, profile }) => {
      const missing = [
        !state.templateData.some((entry) => entry.type === "learningAgreement" && entry.projectId === project.id && entry.studentId === student.id) ? "Lernvereinbarung" : "",
        !profile.emergencyContact1 ? "Notfallkontakt 1" : "",
      ].filter(Boolean);
      return riskItem({
        tone: "warn",
        label: "Mobilität",
        title: student.name,
        context: project.name,
        detail: `Individuelle Mobilität: ${missing.join(", ")} fehlt`,
      });
    });

  const items = [...fundingIssues, ...individualMobilityIssues, ...overdueTasks, ...missingReceipts, ...missingDocumentItems];
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

function renderAuditLog() {
  const rows = filterText(state.auditLogs).slice(0, 25);
  renderTable("#audit-log-table", ["Zeitpunkt", "Aktion", "Bereich", "Eintrag", "Projekt", "Benutzer"], rows.map((entry) => [
    formatDateTime(entry.createdAt),
    badge(entry.action, entry.action === "Gelöscht" ? "danger" : entry.action === "Angelegt" ? "ok" : "warn"),
    escapeHtml(entry.storeLabel || entry.store),
    escapeHtml(entry.entityLabel || "-"),
    escapeHtml(projectName(entry.projectId || entry.projectIds?.[0] || "")),
    escapeHtml(entry.userName || "System"),
  ]));
}

function renderProjects() {
  const status = document.querySelector("#project-filter").value;
  const rows = filterText(state.projects).filter((project) => !status || project.status === status);
  renderTable("#projects-table", ["Projekt", "Zeitraum", "Budget", "Förderbudget", "Status", "Fortschritt", ""], rows.map((project) => [
    `<strong>${escapeHtml(project.name)}</strong><div class="meta">${escapeHtml(project.action)} · ${escapeHtml(projectMobilityType(project))} · ${projectInstitutionNames(project)}${project.partners ? `<br>${escapeHtml(project.partners)}` : ""}${project.destinationCountry ? `<br>${escapeHtml(project.destinationCountry)} · ${Number(project.participantCount || 0)} Pers. · Vorschlag ${money.format(Number(project.calculatedGrant || 0))}` : ""}</div>`,
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
  if (state.projectFileProjectId && state.projects.some((project) => project.id === state.projectFileProjectId)) {
    renderProjectFile(state.projectFileProjectId);
  } else {
    closeProjectFile(false);
  }
  if (state.studentFileStudentId && state.students.some((student) => student.id === state.studentFileStudentId)) {
    renderStudentFile(state.studentFileStudentId);
  } else {
    closeStudentFile(false);
  }
}

function showParticipantList(projectId) {
  state.participantListProjectId = projectId;
  renderParticipantList(projectId, true);
}

function showProjectFile(projectId) {
  state.projectFileProjectId = projectId;
  renderProjectFile(projectId, true);
}

function closeProjectFile(resetState = true) {
  const panel = document.querySelector("#project-file-panel");
  const container = document.querySelector("#project-file");
  if (resetState) state.projectFileProjectId = null;
  if (panel) panel.hidden = true;
  if (container) container.innerHTML = "";
}

function showStudentFile(studentId) {
  state.studentFileStudentId = studentId;
  renderStudentFile(studentId, true);
}

function closeStudentFile(resetState = true) {
  const panel = document.querySelector("#student-file-panel");
  const container = document.querySelector("#student-file");
  if (resetState) state.studentFileStudentId = null;
  if (panel) panel.hidden = true;
  if (container) container.innerHTML = "";
}

function renderStudentFile(studentId, shouldScroll = false) {
  const student = state.students.find((entry) => entry.id === studentId);
  const panel = document.querySelector("#student-file-panel");
  const container = document.querySelector("#student-file");
  if (!student) {
    closeStudentFile();
    return;
  }

  const projects = (student.projectIds || [])
    .map((projectId) => state.projects.find((project) => project.id === projectId))
    .filter(Boolean);
  const expenses = state.expenses.filter((expense) => expense.studentId === student.id);
  const docs = state.documents.filter((doc) => doc.studentId === student.id);
  const templateRows = state.templateData
    .filter((entry) => entry.studentId === student.id)
    .sort((a, b) => (a.type || "").localeCompare(b.type || "", "de"))
    .map((entry) => [
      escapeHtml(projectName(entry.projectId)),
      escapeHtml(templateTitle(entry.type)),
      badge("Gespeichert", "ok"),
    ]);
  const history = state.auditLogs
    .filter((entry) => auditTouchesStudent(entry, student.id))
    .slice(0, 25);
  const archived = student.archived === true;

  container.innerHTML = `
    <div class="project-file-title">
      <div>
        <p>Mobilitätsakte Schüler*in</p>
        <h2>${escapeHtml(student.name)} ${archived ? badge("Archiviert", "neutral") : ""}</h2>
      </div>
      <div class="project-file-actions">
        <button class="small secondary" data-student-archive="${student.id}">${archived ? "Wieder öffnen" : "Archivieren"}</button>
        <button class="small secondary" data-edit data-store="students" data-id="${student.id}" ${archived ? "disabled" : ""}>Stammdaten bearbeiten</button>
      </div>
    </div>
    ${archived ? `<div class="project-file-warning">${badge("Archiviert", "warn")} Diese Schüler*in ist gesperrt und bleibt nur lesbar. Zum Bearbeiten bitte wieder öffnen.</div>` : ""}
    <div class="project-file-grid">
      ${detailCard("Stammdaten", [
        ["Name", student.name],
        ["Klasse", student.className],
        ["Geburtsdatum", formatDate(student.birthDate)],
        ["Projekte", String(projects.length)],
      ])}
      ${detailCard("Status", [
        ["Offene Dokumente", String(missingDocsByProject(student).total)],
        ["Aufwände gesamt", money.format(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))],
        ["Gespeicherte Vorlagen", String(templateRows.length)],
      ])}
    </div>
    <div class="project-file-sections">
      ${projectFileTable("Projektbezogene Mobilitäten", ["Projekt", "Zeitraum", "Rolle", "Dokumente", "Notiz", "Vorlagen"], projects.map((project) => {
        const profile = studentProjectProfile(student, project.id);
        const missing = missingDocs(student, project.id);
        return [
          `<strong>${escapeHtml(project.name)}</strong><div class="meta">${escapeHtml(project.action)} · ${projectInstitutionNames(project)}</div>`,
          `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
          badge(roleLabel(profile.role), profile.role === "Teilnehmer" ? "ok" : "warn"),
          missing.length ? badge(`${missing.length} fehlt`, "danger") + `<div class="meta">${escapeHtml(missing.join(", "))}</div>` : badge("Vollständig", "ok"),
          escapeHtml(profile.mobilityNote || "-"),
          templateActions(project.id, student.id),
        ];
      }))}
      ${projectFileTable("Mobilitätsrelevante Angaben", ["Projekt", "Notfallkontakte", "Gesundheit", "Versicherung / Medien"], projects.map((project) => {
        const profile = studentProjectProfile(student, project.id);
        return [
          `<strong>${escapeHtml(project.name)}</strong>`,
          compactLines([
            ["Kontakt 1", profile.emergencyContact1],
            ["Kontakt 2", profile.emergencyContact2],
          ]),
          compactLines([
            ["Allergien", profile.allergies],
            ["Medizin", profile.medicalNotes],
          ]),
          compactLines([
            ["Versicherung", profile.insurance],
            ["Medien", profile.mediaConsent],
          ]),
        ];
      }))}
      ${projectFileTable("Aufwände", ["Datum", "Projekt", "Kategorie", "Betrag", "Beleg"], expenses.map((expense) => [
        formatDate(expense.date),
        escapeHtml(projectName(expense.projectId)),
        escapeHtml(expense.category),
        money.format(expense.amount),
        badge(expense.receiptStatus, expense.receiptStatus === "Vorhanden" ? "ok" : "danger"),
      ]))}
      ${projectFileTable("Dokumentenindex", ["Datum", "Projekt", "Dokument", "Status", "Ablage"], docs.map((doc) => [
        formatDate(doc.date),
        escapeHtml(projectName(doc.projectId)),
        escapeHtml(doc.title || doc.type),
        badge(doc.status, doc.status === "Abgelegt" ? "ok" : doc.status === "Fehlt" ? "danger" : "warn"),
        escapeHtml(doc.storageHint || "-"),
      ]))}
      ${projectFileTable("Gespeicherte Formularwerte", ["Projekt", "Vorlage", "Status"], templateRows)}
      ${projectFileTable("Änderungshistorie", ["Zeitpunkt", "Aktion", "Bereich", "Eintrag", "Projekt"], history.map((entry) => [
        formatDateTime(entry.createdAt),
        badge(entry.action, entry.action === "Gelöscht" ? "danger" : entry.action === "Angelegt" ? "ok" : "warn"),
        escapeHtml(entry.storeLabel || entry.store),
        escapeHtml(entry.entityLabel || "-"),
        escapeHtml(projectName(entry.projectId || entry.projectIds?.[0] || "")),
      ]))}
    </div>
  `;
  panel.hidden = false;
  container.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editItem(button.dataset.store, button.dataset.id)));
  container.querySelectorAll("[data-student-archive]").forEach((button) => button.addEventListener("click", () => toggleStudentArchive(button.dataset.studentArchive)));
  container.querySelectorAll("[data-template-doc]").forEach((button) => {
    button.addEventListener("click", () => openTemplateDocument(button.dataset.templateDoc, button.dataset.projectId, button.dataset.studentId));
  });
  if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProjectFile(projectId, shouldScroll = false) {
  const project = state.projects.find((entry) => entry.id === projectId);
  const panel = document.querySelector("#project-file-panel");
  const container = document.querySelector("#project-file");
  if (!project) {
    closeProjectFile();
    return;
  }

  const budget = state.fundingBudgets.find((entry) => entry.id === effectiveProjectFundingBudgetId(project));
  const expenses = state.expenses.filter((entry) => entry.projectId === project.id);
  const tasks = state.tasks.filter((entry) => entry.projectId === project.id);
  const docs = state.documents.filter((entry) => entry.projectId === project.id);
  const students = state.students.filter((entry) => (entry.projectIds || []).includes(project.id));
  const spent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = Number(project.budget || 0) - spent;
  const progress = taskProgress(project.id);
  const archived = project.status === "Archiviert";
  const missingDocumentRows = students
    .map((student) => ({ student, missing: missingDocs(student, project.id) }))
    .filter((entry) => entry.missing.length);
  const history = state.auditLogs
    .filter((entry) => auditTouchesProject(entry, project.id))
    .slice(0, 20);

  container.innerHTML = `
    <div class="project-file-title">
      <div>
        <p>${escapeHtml(project.action)} · ${escapeHtml(projectMobilityType(project))} · ${escapeHtml(project.status)}</p>
        <h2>${escapeHtml(project.name)}</h2>
      </div>
      <div class="project-file-actions">
        ${badge(remaining < 0 ? "Budget überschritten" : "Budget OK", remaining < 0 ? "danger" : "ok")}
        <button class="small secondary" data-template-batch="certificate" data-project-id="${project.id}">Alle Bescheinigungen</button>
        <button class="small secondary" data-template-batch="europass" data-project-id="${project.id}">Alle Europass</button>
        <button class="small secondary" data-template-batch="learningAgreement" data-project-id="${project.id}">Alle Lernvereinbarungen</button>
        <button class="small secondary" data-project-archive="${project.id}">${archived ? "Wieder öffnen" : "Archivieren"}</button>
      </div>
    </div>
    ${archived ? `<div class="project-file-warning">${badge("Archiviert", "warn")} Dieses Projekt ist gesperrt und bleibt nur lesbar. Zum Bearbeiten bitte wieder öffnen.</div>` : ""}
    <div class="project-file-grid">
      ${detailCard("Rahmen", [
        ["Mobilitätsart", projectMobilityType(project)],
        ["Zeitraum", `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`],
        ["Förderbudget", budget ? fundingBudgetName(budget.id) : "Nicht eindeutig zugeordnet"],
        ["Partnereinrichtungen", stripHtml(projectInstitutionNames(project))],
        ["Weitere Partner", project.partners || "-"],
        ["Durchgeführte Aktivitäten", project.completedActivities || "Noch nicht erfasst"],
        ["Zielland", project.destinationCountry || "-"],
      ])}
      ${detailCard("Budget", [
        ["Projektbudget", money.format(Number(project.budget || 0))],
        ["Ausgegeben", money.format(spent)],
        ["Rest Projekt", money.format(remaining)],
        ["Budgetvorschlag", money.format(Number(project.calculatedGrant || 0))],
        ["Förderquelle", project.grantSource || "-"],
      ])}
      ${detailCard("Förderpauschalen", [
        ["Teilnehmende", String(project.participantCount || 0)],
        ["Aufenthaltstage", String(project.durationDays || 0)],
        ["Reisetage", String(project.travelDays || 0)],
        ["Tageswert", money.format(Number(project.dailySupportRate || 0))],
        ["Reisepauschale", money.format(Number(project.travelGrantRate || 0))],
        ["Distanzband", project.distanceBand || "-"],
        ["Green Travel", project.greenTravel ? "Ja" : "Nein"],
      ])}
      <section class="detail-card">
        <h3>Aufgaben</h3>
        <div class="meta">${progress.done}/${progress.total} erledigt</div>
        ${progressHtml(progress)}
      </section>
    </div>
    <div class="project-file-sections">
      ${projectFileTable("Teilnehmende & Dokumente", ["Name", "Klasse", "Geburtsdatum", "Projektangaben", "Dokumente", "Vorlagen"], students.map((student) => {
        const missing = missingDocs(student, project.id);
        const profile = studentProjectProfile(student, project.id);
        return [
          escapeHtml(student.name),
          escapeHtml(student.className),
          formatDate(student.birthDate),
          `${badge(roleLabel(profile.role), profile.role === "Teilnehmer" ? "ok" : "warn")}${profile.mobilityNote ? `<div class="meta">${escapeHtml(profile.mobilityNote)}</div>` : ""}`,
          missing.length ? badge(`${missing.length} fehlt`, "danger") + `<div class="meta">${escapeHtml(missing.join(", "))}</div>` : badge("Vollständig", "ok"),
          templateActions(project.id, student.id),
        ];
      }))}
      ${projectFileTable("Aufwände", ["Datum", "Kategorie", "Teilnehmende*r", "Betrag", "Beleg"], expenses.map((expense) => [
        formatDate(expense.date),
        escapeHtml(expense.category),
        escapeHtml(studentName(expense.studentId)),
        money.format(Number(expense.amount || 0)),
        badge(expense.receiptStatus, expense.receiptStatus === "Vorhanden" ? "ok" : "danger"),
      ]))}
      ${projectFileTable("Aufgaben", ["Fällig", "Aufgabe", "Priorität", "Status"], tasks.map((task) => [
        formatDate(task.dueDate),
        escapeHtml(task.title),
        badge(task.priority, task.priority === "Hoch" ? "danger" : "warn"),
        badge(task.status, task.status === "Erledigt" ? "ok" : isOverdue(task.dueDate) ? "danger" : "warn"),
      ]))}
      ${projectFileTable("Dokumentenindex", ["Datum", "Dokument", "Teilnehmende*r", "Status", "Ablage"], docs.map((doc) => [
        formatDate(doc.date),
        `<strong>${escapeHtml(doc.title)}</strong><div class="meta">${escapeHtml(doc.type)}</div>`,
        escapeHtml(studentName(doc.studentId)),
        badge(doc.status, doc.status === "Abgelegt" ? "ok" : doc.status === "Fehlt" ? "danger" : "warn"),
        escapeHtml(doc.storageHint || "-"),
      ]))}
      ${projectFileTable("Änderungshistorie", ["Zeitpunkt", "Aktion", "Bereich", "Eintrag", "Benutzer"], history.map((entry) => [
        formatDateTime(entry.createdAt),
        badge(entry.action, entry.action === "Gelöscht" ? "danger" : entry.action === "Angelegt" ? "ok" : "warn"),
        escapeHtml(entry.storeLabel || entry.store),
        escapeHtml(entry.entityLabel || "-"),
        escapeHtml(entry.userName || "System"),
      ]))}
    </div>
    ${missingDocumentRows.length ? `<div class="project-file-warning">${badge("Dokumente fehlen", "danger")} ${escapeHtml(missingDocumentRows.map(({ student, missing }) => `${student.name}: ${missing.join(", ")}`).join(" · "))}</div>` : ""}
  `;
  container.querySelectorAll("[data-template-doc]").forEach((button) => {
    button.addEventListener("click", () => openTemplateDocument(button.dataset.templateDoc, button.dataset.projectId, button.dataset.studentId));
  });
  container.querySelectorAll("[data-template-batch]").forEach((button) => {
    button.addEventListener("click", () => showTemplateBatch(button.dataset.templateBatch, button.dataset.projectId));
  });
  container.querySelectorAll("[data-project-archive]").forEach((button) => {
    button.addEventListener("click", () => toggleProjectArchive(button.dataset.projectArchive));
  });
  panel.hidden = false;
  if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const rows = filterText(state.students).filter((student) => !role || (student.projectIds || [""]).some((projectId) => studentProjectProfile(student, projectId).role === role));
  renderTable("#students-table", ["Name", "Projektrollen", "Dokumente je Projekt", "Gesamt", ""], rows.map((student) => {
    const missing = missingDocsByProject(student);
    return [
    `<strong>${escapeHtml(student.name)}</strong>${student.archived ? ` ${badge("Archiviert", "neutral")}` : ""}<div class="meta">${escapeHtml(student.className)} · ${formatDate(student.birthDate)}</div>`,
    studentProjectRoleSummary(student),
    documentProjectSummary(student),
    badge(missing.total ? `${missing.total} fehlt` : "Vollständig", missing.total ? "danger" : "ok"),
    studentActions(student.id),
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

function renderForms() {
  fillMobilityFormTypeSelect("#mobility-form-type");
  fillProjectSelect("#mobility-form-project", false, "Projekt wählen");
  fillMobilityFormStudentSelect();
  renderMobilityFormOverview();
}

function renderHelp() {
  const results = document.querySelector("#help-results");
  if (!results) return;
  fillHelpCategorySelect();
  const query = normalizeSearch(document.querySelector("#help-search")?.value || "");
  const category = document.querySelector("#help-category")?.value || "";
  const topics = HELP_TOPICS
    .filter((topic) => !topic.adminOnly || isAdmin())
    .filter((topic) => !category || topic.category === category)
    .filter((topic) => {
      if (!query) return true;
      return normalizeSearch([
        topic.category,
        topic.title,
        topic.text,
        topic.keywords,
        ...(topic.steps || []),
      ].join(" ")).includes(query);
    });

  document.querySelector("#help-count").textContent = query || category
    ? `${topics.length} passende Hilfethemen`
    : "Alle Hilfethemen werden angezeigt.";
  results.innerHTML = topics.length ? topics.map(helpTopicCard).join("") : emptyState();
  results.querySelectorAll("[data-help-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.helpView;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function fillHelpCategorySelect() {
  const select = document.querySelector("#help-category");
  if (!select) return;
  const current = select.value;
  const categories = uniqueValues(HELP_TOPICS.filter((topic) => !topic.adminOnly || isAdmin()).map((topic) => topic.category));
  select.innerHTML = `<option value="">Alle Kategorien</option>`;
  categories.forEach((category) => {
    const option = new Option(category, category);
    option.selected = current === category;
    select.add(option);
  });
}

function helpTopicCard(topic) {
  return `
    <article class="help-card">
      <div>
        <span class="help-category">${escapeHtml(topic.category)}</span>
        <h3>${escapeHtml(topic.title)}</h3>
        <p>${escapeHtml(topic.text)}</p>
      </div>
      ${topic.steps?.length ? `<ol>${topic.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}
      ${topic.view ? `<button type="button" class="secondary small" data-help-view="${escapeHtml(topic.view)}">Zum Bereich</button>` : ""}
    </article>
  `;
}

function renderMobilityFormOverview() {
  const projectId = document.querySelector("#mobility-form-project")?.value || "";
  const type = document.querySelector("#mobility-form-type")?.value || "";
  const templates = getPrintableFormTemplates();
  const selectedTemplate = templates.find((template) => template.id === type) || templates[0];
  const project = state.projects.find((entry) => entry.id === projectId);
  const students = project ? projectStudents(project.id) : [];
  const recommended = project ? recommendedFormIdsForProject(project).includes(selectedTemplate?.id) : false;
  const savedCount = selectedTemplate && project
    ? state.templateData.filter((entry) => entry.type === selectedTemplate.id && entry.projectId === project.id).length
    : 0;
  document.querySelector("#mobility-form-overview").innerHTML = `
    <div class="item">
      <h3>${escapeHtml(selectedTemplate?.title || "Formular auswählen")}</h3>
      <div class="meta">${escapeHtml(selectedTemplate?.subtitle || "")}${project ? ` · ${escapeHtml(projectMobilityType(project))}` : ""}</div>
      <p>${escapeHtml(selectedTemplate?.notice || "Projekt und Formular auswählen.")}</p>
      <div class="mini-kpis">
        <span><strong>${students.length}</strong> Teilnehmende</span>
        <span><strong>${savedCount}</strong> gespeicherte Einzelwerte</span>
        <span><strong>${recommended ? "Ja" : "Optional"}</strong> Empfehlung</span>
      </div>
    </div>
  `;
}

function fillMobilityFormTypeSelect(selector) {
  const select = document.querySelector(selector);
  if (!select) return;
  const current = select.value;
  const project = state.projects.find((entry) => entry.id === document.querySelector("#mobility-form-project")?.value);
  const recommended = new Set(recommendedFormIdsForProject(project));
  select.innerHTML = "";
  getPrintableFormTemplates()
    .slice()
    .sort((a, b) => Number(recommended.has(b.id)) - Number(recommended.has(a.id)) || a.title.localeCompare(b.title, "de"))
    .forEach((template) => {
    const option = new Option(`${templateTitleForProject(template.id, project)}${recommended.has(template.id) ? " · empfohlen" : ""}`, template.id);
    option.selected = current === template.id;
    select.add(option);
  });
}

function fillMobilityFormStudentSelect() {
  const select = document.querySelector("#mobility-form-student");
  if (!select) return;
  const current = select.value;
  const projectId = document.querySelector("#mobility-form-project")?.value || "";
  select.innerHTML = `<option value="">Schüler*in wählen</option>`;
  projectStudents(projectId)
    .filter((student) => student.archived !== true || current === student.id)
    .forEach((student) => {
      const option = new Option(`${student.name}${student.archived ? " · archiviert" : ""}`, student.id);
      option.selected = current === student.id;
      select.add(option);
    });
}

function openSelectedMobilityForm() {
  const projectId = document.querySelector("#mobility-form-project").value;
  const studentId = document.querySelector("#mobility-form-student").value;
  const type = document.querySelector("#mobility-form-type").value;
  if (!projectId || !studentId || !type) {
    toast("Bitte Projekt, Formular und Schüler*in auswählen");
    return;
  }
  showTemplateDocument(type, projectId, studentId);
}

function batchSelectedMobilityForm() {
  const projectId = document.querySelector("#mobility-form-project").value;
  const type = document.querySelector("#mobility-form-type").value;
  if (!projectId || !type) {
    toast("Bitte Projekt und Formular auswählen");
    return;
  }
  showTemplateBatch(type, projectId);
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
  fillTemplateDefaultsForm(getTemplateDefaults());
  renderSettingList("expenseCategories", "#expense-categories-list", (value) => state.expenses.some((expense) => expense.category === value));
  renderSettingList("documentTypes", "#document-types-list", (value) => settingValueInUse("documentTypes", value));
  renderSettingList("leadActions", "#lead-actions-list", (value) => state.projects.some((project) => project.action === value));
  renderSettingList("classGroups", "#class-groups-list", (value) => state.students.some((student) => student.className === value));
  renderMobilityTemplateEditor();
  renderGrantSettings();
}

function getTemplateDefaults() {
  const values = state.settings.templateDefaults;
  return values && !Array.isArray(values) && typeof values === "object" ? values : {};
}

function fillTemplateDefaultsForm(values) {
  const form = document.querySelector("#templateDefaults-form");
  if (!form) return;
  ["sendingInstitution", "sendingCity", "contactPerson", "contactEmail", "recognitionText"].forEach((key) => {
    form.elements[key].value = values[key] || "";
  });
}

function renderMobilityTemplateEditor() {
  if (!isAdmin()) return;
  const form = document.querySelector("#mobility-template-form");
  if (!form) return;
  const current = form.elements.type.value;
  form.elements.type.innerHTML = "";
  getMobilityFormTemplates().forEach((template) => {
    const option = new Option(template.title, template.id);
    option.selected = current === template.id;
    form.elements.type.add(option);
  });
  const template = getMobilityFormTemplate(form.elements.type.value) || getMobilityFormTemplates()[0];
  if (!template) return;
  form.elements.type.value = template.id;
  form.elements.title.value = template.title || "";
  form.elements.subtitle.value = template.subtitle || "";
  form.elements.notice.value = template.notice || "";
  form.elements.body.value = template.body || "";
  form.elements.signatures.value = template.signatures || "";
}

async function onMobilityTemplateSubmit(event) {
  event.preventDefault();
  if (!isAdmin()) {
    toast("Nur Admins dürfen Formular-Templates bearbeiten");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = data.get("type");
  const nextTemplates = getMobilityFormTemplates().map((template) => template.id === id ? {
    ...template,
    title: data.get("title").trim(),
    subtitle: data.get("subtitle").trim(),
    notice: data.get("notice").trim(),
    body: data.get("body").trim(),
    signatures: data.get("signatures").trim(),
  } : template);
  await saveSetting("mobilityFormTemplates", nextTemplates);
}

async function resetMobilityTemplate() {
  if (!isAdmin()) return;
  const form = document.querySelector("#mobility-template-form");
  const id = form.elements.type.value;
  const defaultTemplate = DEFAULT_MOBILITY_FORM_TEMPLATES.find((template) => template.id === id);
  if (!defaultTemplate || !confirm("Dieses Formular-Template auf den Standard zurücksetzen?")) return;
  const nextTemplates = getMobilityFormTemplates().map((template) => template.id === id ? { ...defaultTemplate } : template);
  await saveSetting("mobilityFormTemplates", nextTemplates);
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
  await addAuditLog("Aktualisiert", "settings", { id: key, name: settingLabel(key) });
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup(`${settingLabel(key)}-aktualisiert`);
  render();
  toast("Stammdaten gespeichert");
}

function settingLabel(key) {
  const labels = {
    leadActions: "Leitaktionen",
    expenseCategories: "Aufwandskategorien",
    documentTypes: "Dokumenttypen",
    classGroups: "Klassen / Gruppen",
    countryGrantRates: "Förderpauschalen Länder",
    travelGrantBands: "Reisepauschalen",
    templateDefaults: "Feste Formulardaten",
    mobilityFormTemplates: "Formular-Templates",
    grantTemplateSource: "Förderpauschalen-Quelle",
  };
  return labels[key] || key;
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
  await addAuditLog("Aktualisiert", "settings", { id: "grantTemplates", name: "Förderpauschalen-Vorlage" });
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup("foerderpauschalen-aktualisiert");
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
    await addAuditLog("Aktualisiert", "settings", { id: "grantTemplateSource", name: "Förderpauschalen-Quelle" });
    await loadState();
    syncSQLiteSnapshot();
    createAutomaticBackup("foerderpauschalen-importiert");
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
  if (key === "classGroups") return state.students.some((student) => student.className === value);
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

async function toggleProjectArchive(id) {
  const project = state.projects.find((entry) => entry.id === id);
  if (!project) return;
  const archived = project.status === "Archiviert";
  await persist("projects", {
    ...project,
    status: archived ? "Abgeschlossen" : "Archiviert",
    archivedAt: archived ? "" : new Date().toISOString(),
    archivedBy: archived ? "" : state.currentUser?.id || "",
  });
  toast(archived ? "Projekt wieder geöffnet" : "Projekt archiviert");
}

async function toggleStudentArchive(id) {
  const student = state.students.find((entry) => entry.id === id);
  if (!student) return;
  const archived = student.archived === true;
  await persist("students", {
    ...student,
    archived: !archived,
    archivedAt: archived ? "" : new Date().toISOString(),
    archivedBy: archived ? "" : state.currentUser?.id || "",
  });
  toast(archived ? "Schüler*in wieder geöffnet" : "Schüler*in archiviert");
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
  if (!budget) return `<span class="badge danger">Förderbudget fehlt</span>`;
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
  fillClassGroupSelect();
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

function fillClassGroupSelect(selectedValue = null) {
  const select = document.querySelector("#student-form [name=className]");
  const selected = selectedValue ?? select.value;
  const values = uniqueValues([...getSettingValues("classGroups"), ...state.students.map((student) => student.className).filter(Boolean)]);
  select.innerHTML = `<option value="">Klasse / Gruppe wählen</option>`;
  values.forEach((value) => {
    const option = new Option(value, value);
    option.selected = selected === value;
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
  const previousProfiles = collectProjectProfileFields(container);

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
      ${projectProfileFields(form.elements.id.value, projectId, previousProfiles[projectId])}
      <div class="project-doc-checks">
      ${getSettingValues("documentTypes").map((type) => {
        const checked = previous[projectId]?.[type] ?? currentStudentDocumentValue(form.elements.id.value, projectId, type);
        return `<label class="check"><input type="checkbox" name="requiredDocuments:${escapeHtml(projectId)}" value="${escapeHtml(type)}" ${checked ? "checked" : ""} /> ${escapeHtml(type)}</label>`;
      }).join("")}
      </div>
    </div>
  `).join("");

  tabs.querySelectorAll("[data-doc-tab]").forEach((button) => {
    button.addEventListener("click", () => activateDocumentTab(button.dataset.docTab));
  });
}

function projectProfileFields(studentId, projectId, previous = null) {
  const profile = previous || currentStudentProjectProfile(studentId, projectId);
  const role = profile.role || "Teilnehmer";
  const documentStatus = profile.documentStatus || "Unvollständig";
  return `
    <div class="project-profile-fields">
      <label>Rolle in diesem Projekt
        <select name="projectRole:${escapeHtml(projectId)}">
          <option value="Teilnehmer" ${role === "Teilnehmer" ? "selected" : ""}>Teilnehmende*r</option>
          <option value="Nachrücker" ${role === "Nachrücker" ? "selected" : ""}>Nachrücker*in</option>
        </select>
      </label>
      <label>Dokumentenstatus in diesem Projekt
        <select name="projectDocumentStatus:${escapeHtml(projectId)}">
          ${["Vollständig", "Unvollständig", "Prüfen"].map((status) => `<option ${documentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <label class="wide">Projektbezogene Notiz
        <textarea name="projectMobilityNote:${escapeHtml(projectId)}" rows="2" placeholder="z. B. besondere Vereinbarung, Reisegruppe, Betreuung">${escapeHtml(profile.mobilityNote || "")}</textarea>
      </label>
      <label>Notfallkontakt 1
        <input name="projectEmergencyContact1:${escapeHtml(projectId)}" value="${escapeHtml(profile.emergencyContact1 || "")}" placeholder="Name, Beziehung, Telefon" />
      </label>
      <label>Notfallkontakt 2
        <input name="projectEmergencyContact2:${escapeHtml(projectId)}" value="${escapeHtml(profile.emergencyContact2 || "")}" placeholder="optional" />
      </label>
      <label>Versicherung
        <input name="projectInsurance:${escapeHtml(projectId)}" value="${escapeHtml(profile.insurance || "")}" placeholder="Versicherung / Auslandsschutz" />
      </label>
      <label>Medienregelung
        <input name="projectMediaConsent:${escapeHtml(projectId)}" value="${escapeHtml(profile.mediaConsent || "")}" placeholder="Foto/Video ja, nein oder eingeschränkt" />
      </label>
      <label class="wide">Allergien / Unverträglichkeiten
        <textarea name="projectAllergies:${escapeHtml(projectId)}" rows="2" placeholder="Keine oder Details eintragen">${escapeHtml(profile.allergies || "")}</textarea>
      </label>
      <label class="wide">Medizinische Hinweise
        <textarea name="projectMedicalNotes:${escapeHtml(projectId)}" rows="2" placeholder="Medikamente, Vorerkrankungen, Besonderheiten">${escapeHtml(profile.medicalNotes || "")}</textarea>
      </label>
    </div>
  `;
}

function collectProjectProfileFields(container) {
  const profiles = {};
  container.querySelectorAll("[data-doc-panel]").forEach((panel) => {
    const projectId = panel.dataset.docPanel;
    profiles[projectId] = {
      role: panel.querySelector(`[name="projectRole:${cssEscape(projectId)}"]`)?.value || "",
      documentStatus: panel.querySelector(`[name="projectDocumentStatus:${cssEscape(projectId)}"]`)?.value || "",
      mobilityNote: panel.querySelector(`[name="projectMobilityNote:${cssEscape(projectId)}"]`)?.value || "",
      emergencyContact1: panel.querySelector(`[name="projectEmergencyContact1:${cssEscape(projectId)}"]`)?.value || "",
      emergencyContact2: panel.querySelector(`[name="projectEmergencyContact2:${cssEscape(projectId)}"]`)?.value || "",
      allergies: panel.querySelector(`[name="projectAllergies:${cssEscape(projectId)}"]`)?.value || "",
      medicalNotes: panel.querySelector(`[name="projectMedicalNotes:${cssEscape(projectId)}"]`)?.value || "",
      insurance: panel.querySelector(`[name="projectInsurance:${cssEscape(projectId)}"]`)?.value || "",
      mediaConsent: panel.querySelector(`[name="projectMediaConsent:${cssEscape(projectId)}"]`)?.value || "",
    };
  });
  return profiles;
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

function currentStudentProjectProfile(studentId, projectId) {
  const student = state.students.find((entry) => entry.id === studentId);
  if (!student) return {};
  return studentProjectProfile(student, projectId);
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

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true, sensitivity: "base" }));
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
  state.students
    .filter((student) => student.archived !== true || current === student.id)
    .forEach((student) => {
    const option = new Option(`${student.name}${student.archived ? " · archiviert" : ""}`, student.id);
    option.selected = current === student.id;
    select.add(option);
  });
}

function enhanceClearableFields() {
  document.querySelectorAll("input, textarea").forEach((field) => {
    if (!isClearableField(field)) return;
    if (!field.parentElement?.classList.contains("clearable-field")) {
      wrapClearableField(field);
    }
    updateClearButton(field);
  });
}

function isClearableField(field) {
  if (field.readOnly || field.disabled) return false;
  if (field.tagName === "TEXTAREA") return true;
  const type = (field.getAttribute("type") || "text").toLowerCase();
  return ["text", "search", "email", "url", "tel"].includes(type);
}

function wrapClearableField(field) {
  const wrapper = document.createElement("span");
  wrapper.className = "clearable-field";
  field.parentNode.insertBefore(wrapper, field);
  wrapper.appendChild(field);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "clear-field";
  button.textContent = "x";
  button.setAttribute("aria-label", "Feld leeren");
  button.title = "Feld leeren";
  button.addEventListener("click", () => {
    field.value = "";
    field.focus();
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    updateClearButton(field);
  });
  field.addEventListener("input", () => updateClearButton(field));
  wrapper.appendChild(button);
}

function updateClearButton(field) {
  const button = field.parentElement?.querySelector(".clear-field");
  if (button) button.hidden = !field.value;
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
  table.querySelectorAll("[data-project-file]").forEach((button) => button.addEventListener("click", () => showProjectFile(button.dataset.projectFile)));
  table.querySelectorAll("[data-student-file]").forEach((button) => button.addEventListener("click", () => showStudentFile(button.dataset.studentFile)));
  table.querySelectorAll("[data-template-doc]").forEach((button) => {
    button.addEventListener("click", () => openTemplateDocument(button.dataset.templateDoc, button.dataset.projectId, button.dataset.studentId));
  });
  table.querySelectorAll("[data-institution-toggle]").forEach((button) => button.addEventListener("click", () => toggleInstitution(button.dataset.institutionToggle)));
  table.querySelectorAll("[data-user-toggle]").forEach((button) => button.addEventListener("click", () => toggleUserStatus(button.dataset.userToggle)));
  table.querySelectorAll("[data-funding-budget-toggle]").forEach((button) => button.addEventListener("click", () => toggleFundingBudget(button.dataset.fundingBudgetToggle)));
  table.querySelectorAll("[data-project-archive]").forEach((button) => button.addEventListener("click", () => toggleProjectArchive(button.dataset.projectArchive)));
  table.querySelectorAll("[data-student-archive]").forEach((button) => button.addEventListener("click", () => toggleStudentArchive(button.dataset.studentArchive)));
  table.querySelectorAll(".action-menu").forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      table.querySelectorAll(".action-menu[open]").forEach((otherMenu) => {
        if (otherMenu !== menu) otherMenu.open = false;
      });
    });
  });
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

function studentActions(id) {
  const student = state.students.find((entry) => entry.id === id);
  const archived = student?.archived === true;
  return `
    <div class="row-actions compact-actions">
      <button class="small" data-student-file="${id}">Mobilitätsakte</button>
      <details class="action-menu">
        <summary class="small secondary" role="button">Mehr</summary>
        <div class="action-menu-list">
          <button type="button" data-student-archive="${id}">${archived ? "Wieder öffnen" : "Archivieren"}</button>
          <button type="button" data-edit data-store="students" data-id="${id}" ${archived ? "disabled" : ""}>Bearbeiten</button>
          <button type="button" class="danger" data-delete data-store="students" data-id="${id}" ${archived ? "disabled" : ""}>Löschen</button>
        </div>
      </details>
    </div>
  `;
}

function projectActions(id) {
  const project = state.projects.find((entry) => entry.id === id);
  const archived = project?.status === "Archiviert";
  return `
    <div class="row-actions compact-actions">
      <button class="small" data-project-file="${id}">Projektakte</button>
      <button class="small secondary" data-participant-list="${id}">Teilnehmendenliste</button>
      <details class="action-menu">
        <summary class="small secondary" role="button">Mehr</summary>
        <div class="action-menu-list">
          <button type="button" data-project-archive="${id}">${archived ? "Wieder öffnen" : "Archivieren"}</button>
          <button type="button" data-edit data-store="projects" data-id="${id}" ${archived ? "disabled" : ""}>Bearbeiten</button>
          <button type="button" class="danger" data-delete data-store="projects" data-id="${id}" ${archived ? "disabled" : ""}>Löschen</button>
        </div>
      </details>
    </div>
  `;
}

function editItem(store, id) {
  const item = state[store].find((entry) => entry.id === id);
  if (!item) return;
  if (store === "students" && item.archived === true) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  if (itemTouchesArchivedStudent(store, item)) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  if (store !== "students" && itemTouchesArchivedProject(store, item)) {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }

  state.view = VIEW_BY_STORE[store] || "dashboard";
  render();

  const form = document.querySelector(`#${FORM_BY_STORE[store]}`);
  if (!form) return;

  if (store === "projects") {
    fillInstitutionSelect(item.institutionIds || []);
    form.elements.completedActivities.value = item.completedActivities || "";
    form.querySelector("h2").textContent = "Projekt bearbeiten";
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
  const itemForArchiveCheck = state[store]?.find((entry) => entry.id === id);
  if (store === "students" && itemForArchiveCheck?.archived === true) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  if (itemTouchesArchivedStudent(store, itemForArchiveCheck)) {
    toast("Archivierte Schüler*innen sind gesperrt. Bitte erst wieder öffnen.");
    return;
  }
  if (itemTouchesArchivedProject(store, itemForArchiveCheck)) {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }
  if (!confirm("Eintrag wirklich löschen?")) return;
  const deletedItem = state[store]?.find((entry) => entry.id === id);
  if (!deletedItem) return;
  if (store === "projects" && deletedItem.status === "Archiviert") {
    toast("Archivierte Projekte sind gesperrt. Bitte Projekt erst wieder öffnen.");
    return;
  }
  createSafetyBackup(`vor-loeschen-${store}`);
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
    if (state.participantListProjectId === id) closeParticipantList();
    if (state.projectFileProjectId === id) closeProjectFile();
  }
  if (store === "students") {
    await cleanupStudentReferences(id);
    if (state.studentFileStudentId === id) closeStudentFile();
  }
  await remove(store, id);
  if (deletedItem) {
    await addAuditLog("Gelöscht", store, deletedItem);
  }
  await loadState();
  syncSQLiteSnapshot();
  createAutomaticBackup(`${STORE_LABELS[store] || store}-geloescht`);
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
  for (const template of state.templateData.filter((entry) => entry.projectId === projectId)) {
    await remove("templateData", template.id);
  }
  for (const student of state.students.filter((entry) => entry.projectIds.includes(projectId))) {
    const projectDataByProject = { ...(student.projectDataByProject || {}) };
    delete projectDataByProject[projectId];
    await put("students", { ...student, projectIds: student.projectIds.filter((id) => id !== projectId), projectDataByProject });
  }
}

async function cleanupStudentReferences(studentId) {
  for (const expense of state.expenses.filter((entry) => entry.studentId === studentId)) {
    await put("expenses", { ...expense, studentId: "" });
  }
  for (const document of state.documents.filter((entry) => entry.studentId === studentId)) {
    await put("documents", { ...document, studentId: "" });
  }
  for (const template of state.templateData.filter((entry) => entry.studentId === studentId)) {
    await remove("templateData", template.id);
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

function projectIsArchived(projectId) {
  return state.projects.some((project) => project.id === projectId && project.status === "Archiviert");
}

function studentIsArchived(studentId) {
  return Boolean(studentId) && state.students.some((student) => student.id === studentId && student.archived === true);
}

function itemTouchesArchivedProject(store, item = {}) {
  if (!item) return false;
  if (store === "projects") return item.status === "Archiviert";
  if (["expenses", "tasks", "documents", "templateData"].includes(store)) return projectIsArchived(item.projectId);
  if (store === "students") return (item.projectIds || []).some(projectIsArchived);
  return false;
}

function itemTouchesArchivedStudent(store, item = {}) {
  if (!item) return false;
  if (store === "students") return item.archived === true;
  if (["expenses", "documents", "templateData"].includes(store)) return studentIsArchived(item.studentId);
  return false;
}

function studentArchivedProjectDataWouldChange(studentId, nextProjectIds, formData) {
  const existing = state.students.find((student) => student.id === studentId);
  if (!existing) return false;
  const archivedProjectIds = (existing.projectIds || []).filter(projectIsArchived);
  return archivedProjectIds.some((projectId) => {
    if (!nextProjectIds.includes(projectId)) return true;
    const previousDocs = getSettingValues("documentTypes").map((type) => [type, hasProjectDocument(existing, type, projectId)]);
    const nextDocs = getSettingValues("documentTypes").map((type) => [type, formData.getAll(`requiredDocuments:${projectId}`).includes(type)]);
    const previousProfile = studentProjectProfile(existing, projectId);
    const nextProfile = {
      role: formData.get(`projectRole:${projectId}`) || existing.role || "Teilnehmer",
      documentStatus: formData.get(`projectDocumentStatus:${projectId}`) || existing.documentStatus || "",
      mobilityNote: (formData.get(`projectMobilityNote:${projectId}`) || "").trim(),
      emergencyContact1: (formData.get(`projectEmergencyContact1:${projectId}`) || "").trim(),
      emergencyContact2: (formData.get(`projectEmergencyContact2:${projectId}`) || "").trim(),
      allergies: (formData.get(`projectAllergies:${projectId}`) || "").trim(),
      medicalNotes: (formData.get(`projectMedicalNotes:${projectId}`) || "").trim(),
      insurance: (formData.get(`projectInsurance:${projectId}`) || "").trim(),
      mediaConsent: (formData.get(`projectMediaConsent:${projectId}`) || "").trim(),
    };
    return JSON.stringify(previousDocs) !== JSON.stringify(nextDocs) || JSON.stringify(previousProfile) !== JSON.stringify(nextProfile);
  });
}

async function addAuditLog(action, store, entity) {
  await put("auditLogs", {
    id: createId(),
    action,
    store,
    storeLabel: STORE_LABELS[store] || store,
    entityId: entity?.id || "",
    entityLabel: entityLabel(store, entity),
    projectId: auditProjectId(store, entity),
    projectIds: auditProjectIds(store, entity),
    studentId: auditStudentId(store, entity),
    userId: state.currentUser?.id || "",
    userName: state.currentUser?.name || "System",
    createdAt: new Date().toISOString(),
  });
}

function entityLabel(store, entity = {}) {
  if (store === "expenses") return `${entity.category || "Aufwand"} ${money.format(Number(entity.amount || 0))}`;
  if (store === "tasks") return entity.title || "Aufgabe";
  if (store === "documents") return entity.title || entity.type || "Dokument";
  if (store === "settings") return entity.id || "Stammdaten";
  return entity.name || entity.email || entity.id || "-";
}

function auditProjectId(store, entity = {}) {
  if (store === "projects") return entity.id || "";
  return entity.projectId || "";
}

function auditProjectIds(store, entity = {}) {
  if (store === "projects") return [entity.id].filter(Boolean);
  if (store === "students") return entity.projectIds || [];
  return [entity.projectId].filter(Boolean);
}

function auditStudentId(store, entity = {}) {
  if (store === "students") return entity.id || "";
  return entity.studentId || "";
}

function auditTouchesProject(entry, projectId) {
  return entry.projectId === projectId || (entry.projectIds || []).includes(projectId) || (entry.store === "projects" && entry.entityId === projectId);
}

function auditTouchesStudent(entry, studentId) {
  return entry.studentId === studentId || (entry.store === "students" && entry.entityId === studentId);
}

function filterText(items) {
  if (!state.search) return items;
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(state.search));
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function projectName(id) {
  return state.projects.find((project) => project.id === id)?.name || "Nicht zugeordnet";
}

function projectMobilityType(project) {
  return project?.mobilityType || "Gruppenmobilität";
}

function projectIsIndividual(project) {
  return projectMobilityType(project).startsWith("Individuelle");
}

function recommendedFormIdsForProject(project) {
  if (!project) return [];
  if (projectIsIndividual(project)) {
    return ["grantAgreement", "learningAgreement", "consentPrivacy", "emergencyCard", "europass", "certificate"];
  }
  return ["grantAgreement", "learningAgreement", "consentPrivacy", "emergencyCard", "certificate"];
}

function projectStudents(projectId) {
  if (!projectId) return [];
  return state.students.filter((student) => (student.projectIds || []).includes(projectId));
}

function roleLabel(role) {
  if (role === "Teilnehmer") return "Teilnehmende*r";
  if (role === "Nachrücker") return "Nachrücker*in";
  return role || "-";
}

function studentProjectProfile(student, projectId) {
  const profile = student.projectDataByProject?.[projectId] || {};
  return {
    role: profile.role || student.role || "Teilnehmer",
    documentStatus: profile.documentStatus || student.documentStatus || (missingDocs(student, projectId).length ? "Unvollständig" : "Vollständig"),
    mobilityNote: profile.mobilityNote || "",
    emergencyContact1: profile.emergencyContact1 || "",
    emergencyContact2: profile.emergencyContact2 || "",
    allergies: profile.allergies || "",
    medicalNotes: profile.medicalNotes || "",
    insurance: profile.insurance || "",
    mediaConsent: profile.mediaConsent || "",
  };
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

function studentProjectRoleSummary(student) {
  const projectIds = student.projectIds?.length ? student.projectIds : [""];
  return `<div class="project-doc-summary">${projectIds.map((projectId) => {
    const profile = studentProjectProfile(student, projectId);
    return `
      <div class="project-doc-row compact-row">
        <div>
          <strong>${escapeHtml(projectName(projectId))}</strong>
          <span>${escapeHtml(profile.mobilityNote || profile.documentStatus || "")}</span>
        </div>
        ${badge(roleLabel(profile.role), profile.role === "Teilnehmer" ? "ok" : "warn")}
      </div>
    `;
  }).join("")}</div>`;
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
  return status === "Aktiv" ? "ok" : status === "Abrechnung" ? "warn" : status === "Archiviert" ? "neutral" : "";
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

function formatDateTime(date) {
  return date ? new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date)) : "-";
}

function stripHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value ?? "");
  return template.content.textContent || "";
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

function compactLines(rows) {
  const lines = rows.map(([label, value]) => {
    const text = String(value || "").trim();
    return `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(text || "-")}</div>`;
  });
  return `<div class="compact-lines">${lines.join("")}</div>`;
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

function createSafetyBackup(reason) {
  if (!hasLocalData()) return false;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJson({
    ...buildBackupPayload(),
    safetyBackup: true,
    reason,
  }, `erasmus-plus-sicherheitsbackup-${reason}-${timestamp}.json`);
  return true;
}

function createAutomaticBackup(reason) {
  if (!hasLocalData()) return false;
  const createdAt = new Date().toISOString();
  const entry = {
    id: createId(),
    reason,
    createdAt,
    payload: {
      ...buildBackupPayload(),
      automaticBackup: true,
      reason,
    },
  };
  const backups = [entry, ...getAutomaticBackups()].slice(0, AUTO_BACKUP_LIMIT);
  try {
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
    renderAutomaticBackupStatus();
    return true;
  } catch (error) {
    try {
      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify([entry]));
      renderAutomaticBackupStatus();
      return true;
    } catch (secondError) {
      console.warn("Automatische Sicherung konnte nicht gespeichert werden", secondError);
      return false;
    }
  }
}

function getAutomaticBackups() {
  try {
    const backups = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || "[]");
    return Array.isArray(backups) ? backups.filter((entry) => entry?.payload?.data) : [];
  } catch (error) {
    console.warn("Automatische Sicherungen konnten nicht gelesen werden", error);
    return [];
  }
}

function latestAutomaticBackup() {
  return getAutomaticBackups()[0] || null;
}

function renderAutomaticBackupStatus() {
  const status = document.querySelector("#auto-backup-status");
  const button = document.querySelector("#download-auto-backup");
  if (!status || !button) return;
  const backups = getAutomaticBackups();
  const latest = backups[0];
  button.disabled = !latest;
  status.textContent = latest
    ? `Letzte Auto-Sicherung: ${formatDateTime(latest.createdAt)} (${latest.reason}); ${backups.length} Sicherung${backups.length === 1 ? "" : "en"} gespeichert.`
    : "Noch keine automatische Sicherung vorhanden.";
}

function downloadLatestAutomaticBackup() {
  const latest = latestAutomaticBackup();
  if (!latest) {
    toast("Noch keine automatische Sicherung vorhanden");
    return;
  }
  const timestamp = latest.createdAt.replace(/[:.]/g, "-");
  downloadJson(latest.payload, `erasmus-plus-auto-sicherung-${timestamp}.json`);
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
    createSafetyBackup("vor-import");
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
  createSafetyBackup("vor-beispieldaten");
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
