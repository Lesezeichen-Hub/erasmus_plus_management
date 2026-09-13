/* Reports are generated from the current state; no student records or report copies are stored. */
function bindManagementReports() {
  const form = document.querySelector("#management-report-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isAdmin()) return;
    const filters = Object.fromEntries(new FormData(form));
    if (filters.from && filters.to && filters.from > filters.to) {
      document.querySelector("#management-report-status").textContent = "Das Enddatum darf nicht vor dem Startdatum liegen.";
      return;
    }
    const rows = managementReportRows(filters);
    invalidateManagementReport();
    if (!rows.length) {
      document.querySelector("#management-report-status").textContent = "Keine Projekte für diese Auswahl gefunden.";
      return;
    }
    const frame = document.querySelector("#management-report-preview");
    frame.srcdoc = buildManagementReport(filters, rows);
    frame.hidden = false;
    document.querySelector("#management-report-status").textContent = `${rows.length} ${rows.length === 1 ? "Projekt" : "Projekte"} im Bericht. Stand: ${new Date().toLocaleString("de-DE")}`;
  });
  form.addEventListener("input", () => invalidateManagementReport("Auswahl geändert. Bericht neu erstellen."));
  form.addEventListener("change", () => invalidateManagementReport("Auswahl geändert. Bericht neu erstellen."));
  document.querySelector("#management-report-preview").addEventListener("load", () => {
    const ready = isAdmin() && !document.querySelector("#management-report-preview").hidden;
    document.querySelector("#management-report-print").disabled = !ready;
    document.querySelector("#management-report-download").disabled = !ready;
  });
  document.querySelector("#management-report-print").addEventListener("click", () => {
    const frame = document.querySelector("#management-report-preview");
    if (!isAdmin() || frame.hidden) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  });
  document.querySelector("#management-report-download").addEventListener("click", () => {
    const frame = document.querySelector("#management-report-preview");
    if (!isAdmin() || frame.hidden) return;
    const url = URL.createObjectURL(new Blob([frame.srcdoc], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `erasmus-bericht-${form.elements.reportType.value}-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function invalidateManagementReport(message = "") {
  const frame = document.querySelector("#management-report-preview");
  frame.hidden = true;
  frame.removeAttribute("srcdoc");
  document.querySelector("#management-report-print").disabled = true;
  document.querySelector("#management-report-download").disabled = true;
  document.querySelector("#management-report-status").textContent = message;
}

function refreshManagementReports() {
  const form = document.querySelector("#management-report-form");
  invalidateManagementReport();
  if (!isAdmin()) {
    form.reset();
    form.elements.projectId.replaceChildren(new Option("Alle Projekte", ""));
    return;
  }
  const current = form.elements.projectId.value;
  form.elements.projectId.replaceChildren(new Option("Alle Projekte", ""));
  [...state.projects].sort((a, b) => a.name.localeCompare(b.name, "de")).forEach((project) => {
    form.elements.projectId.add(new Option(project.name, project.id));
  });
  if (state.projects.some((project) => project.id === current)) form.elements.projectId.value = current;
}

function managementReportRows(filters) {
  return state.projects.filter((project) =>
    (!filters.projectId || project.id === filters.projectId) &&
    (!filters.status || project.status === filters.status) &&
    (filters.includeArchived || filters.status === "Archiviert" || project.status !== "Archiviert") &&
    (!filters.from || (project.endDate && project.endDate >= filters.from)) &&
    (!filters.to || (project.startDate && project.startDate <= filters.to))
  ).sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "") || a.name.localeCompare(b.name, "de"))
    .map((project) => {
      const expenses = state.expenses.filter((expense) => expense.projectId === project.id);
      const students = projectStudents(project.id);
      const tasks = state.tasks.filter((task) => task.projectId === project.id);
      const budget = Math.round(Number(project.budget || 0) * 100);
      const spent = expenses.reduce((total, expense) => total + Math.round(Number(expense.amount || 0) * 100), 0);
      const fundingId = effectiveProjectFundingBudgetId(project);
      const funding = state.fundingBudgets.find((entry) => entry.id === fundingId);
      return {
        project, expenses, students, budget, spent, remaining: budget - spent,
        fundingId, fundingValid: !!funding && projectOverlapsFundingBudget(project, funding),
        openTasks: tasks.filter((task) => task.status !== "Erledigt").length,
        overdue: tasks.filter((task) => task.status !== "Erledigt" && isOverdue(task.dueDate)).length,
        taskCount: tasks.length, done: tasks.filter((task) => task.status === "Erledigt").length,
        missingDocuments: students.reduce((total, student) => total + missingDocs(student, project.id).length, 0),
        missingReceipts: expenses.filter((expense) => expense.receiptStatus !== "Vorhanden").length,
      };
    });
}

function buildManagementReport(filters, rows) {
  const titles = { summary: "Kurzbericht Schulleitung", finance: "Finanzübersicht Verwaltung", status: "Projektstatus & Handlungsbedarf" };
  const title = titles[filters.reportType] || titles.summary;
  const e = escapeHtml;
  const cash = (cents) => money.format(cents / 100);
  const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
  const uniqueStudents = new Set(rows.flatMap((row) => row.students.map((student) => student.id))).size;
  const assignments = rows.reduce((total, row) => total + row.students.length, 0);
  const period = `${filters.from ? formatDate(filters.from) : "offen"} bis ${filters.to ? formatDate(filters.to) : "offen"}`;
  const statusCounts = ["Geplant", "Aktiv", "Abgeschlossen", "Abrechnung", "Archiviert"]
    .map((status) => [status, rows.filter((row) => row.project.status === status).length]).filter(([, count]) => count);
  const table = (headers, body) => `<div class="report-table"><table><thead><tr>${headers.map((h) => `<th>${e(h)}</th>`).join("")}</tr></thead><tbody>${body.join("")}</tbody></table></div>`;
  const cells = (values) => `<tr>${values.map((v) => `<td>${e(String(v))}</td>`).join("")}</tr>`;
  const notices = [
    sum("overdue") ? `${sum("overdue")} überfällige Aufgaben` : "",
    sum("missingReceipts") ? `${sum("missingReceipts")} Aufwände ohne vorhandenen Beleg` : "",
    sum("missingDocuments") ? `${sum("missingDocuments")} fehlende Pflichtdokumente (je Projekt und Person gezählt)` : "",
    rows.some((row) => row.remaining < 0) ? `${rows.filter((row) => row.remaining < 0).length} Projekte mit Budgetüberschreitung` : "",
    rows.some((row) => !row.fundingValid) ? `${rows.filter((row) => !row.fundingValid).length} Projekte ohne gültige Förderbudget-Zuordnung` : "",
  ].filter(Boolean);
  let sections = `<section><h2>Projektübersicht</h2>${table(
    ["Projekt / Ziel", "Zeitraum", "Status", "Zuordnungen", "Aufgaben erledigt"],
    rows.map((row) => cells([
      `${row.project.name}${row.project.destinationCountry ? ` · ${row.project.destinationCountry}` : ""}`,
      `${formatDate(row.project.startDate)} – ${formatDate(row.project.endDate)}`,
      row.project.status, row.students.length, row.taskCount ? `${row.done}/${row.taskCount}` : "Keine Aufgaben",
    ]))
  )}</section>`;
  if (filters.reportType === "finance") {
    sections = `<section><h2>Finanzen der ausgewählten Projekte</h2>${table(
      ["Projekt", "Budget", "Ausgaben", "Rest", "Belege fehlen"],
      rows.map((row) => cells([row.project.name, cash(row.budget), cash(row.spent), cash(row.remaining), row.missingReceipts]))
        .concat(cells(["Gesamt", cash(sum("budget")), cash(sum("spent")), cash(sum("remaining")), sum("missingReceipts")]))
    )}</section>`;
    const categories = new Map();
    rows.flatMap((row) => row.expenses).forEach((expense) => {
      const category = expense.category || "Ohne Kategorie";
      categories.set(category, (categories.get(category) || 0) + Math.round(Number(expense.amount || 0) * 100));
    });
    if (categories.size) sections += `<section><h2>Ausgaben nach Kategorie</h2>${table(["Kategorie", "Ausgaben"], [...categories].sort(([a], [b]) => a.localeCompare(b, "de")).map(([category, amount]) => cells([category, cash(amount)])))}</section>`;
    const funds = state.fundingBudgets.filter((fund) => rows.some((row) => row.fundingId === fund.id));
    if (funds.length) sections += `<section><h2>Zugehörige Förderbudgets</h2><p class="note">Gesamte Förderbudgets einschließlich aller zugeordneten Projekte außerhalb der Berichtsauswahl. Nicht zeitanteilig berechnet.</p>${table(
      ["Förderbudget", "Gesamt", "Verplant", "Nicht verplant"], funds.map((fund) => {
        const planned = state.projects.filter((project) => effectiveProjectFundingBudgetId(project) === fund.id)
          .reduce((total, project) => total + Math.round(Number(project.budget || 0) * 100), 0);
        const total = Math.round(Number(fund.amount || 0) * 100);
        return cells([`${fund.name} (${fund.status})`, cash(total), cash(planned), cash(total - planned)]);
      })
    )}</section>`;
  } else if (filters.reportType === "status") {
    sections += `<section><h2>Offene Punkte je Projekt</h2>${table(
      ["Projekt", "Aufgaben offen", "Überfällig", "Dokumente fehlen", "Belege fehlen"],
      rows.map((row) => cells([row.project.name, row.openTasks, row.overdue, row.missingDocuments, row.missingReceipts]))
    )}</section>`;
  } else {
    const activities = rows.filter((row) => row.project.completedActivities);
    if (activities.length) sections += `<section><h2>Durchgeführte Aktivitäten · Auszüge</h2>${activities.map((row) => `<article><h3>${e(row.project.name)}</h3><p class="pre">${e(row.project.completedActivities.length > 500 ? `${row.project.completedActivities.slice(0, 500)}…` : row.project.completedActivities)}</p></article>`).join("")}</section>`;
  }
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} · Erasmus+</title><style>${managementReportStyles()}</style></head><body>
    <header><p class="eyebrow">ERASMUS+ · SCHULBILDUNG</p><h1>${e(title)}</h1><p>${e(getTemplateDefaults().sendingInstitution || "Erasmus+ Management")}</p><p class="note">Stand: ${e(new Date().toLocaleString("de-DE"))}</p></header>
    <p class="scope">Projektzeitraum: ${filters.from || filters.to ? e(period) : "Alle Zeiträume"} · ${e(filters.status || "Alle Status")} · ${filters.includeArchived || filters.status === "Archiviert" ? "Archiv eingeschlossen" : "Ohne Archiv"}</p>
    <p class="note">Auswahl nach Überschneidung der Projektlaufzeit. Finanzzahlen umfassen die vollständigen ausgewählten Projekte, nicht nur Buchungen im Filterzeitraum.</p>
    <div class="metrics"><div><strong>${rows.length}</strong><span>Projekte</span></div><div><strong>${uniqueStudents}</strong><span>Zugeordnete Schüler*innen</span></div><div><strong>${e(cash(sum("budget")))}</strong><span>Projektbudgets</span></div><div><strong>${e(cash(sum("spent")))}</strong><span>Erfasste Ausgaben</span></div></div>
    <p class="note">${assignments} Projektzuordnungen einschließlich Nachrücker*innen · Schüler*innen über mehrere Projekte nur einmal gezählt.</p>
    <div class="status-strip">${statusCounts.map(([status, count]) => `<span><b>${count}</b> ${e(status)}</span>`).join("")}</div>
    <section class="attention"><h2>Handlungsbedarf</h2>${notices.length ? `<ul>${notices.map((notice) => `<li>${e(notice)}</li>`).join("")}</ul>` : "<p>Keine Auffälligkeiten bei Aufgabenfristen, Belegen, Pflichtdokumenten und Projektbudgets ermittelt.</p>"}</section>
    ${filters.comment?.trim() ? `<section><h2>Einordnung</h2><p class="pre">${e(filters.comment.trim())}</p></section>` : ""}
    ${sections}<footer>Erasmus+ Management · Interner Kurzbericht · Datenstand zum Erstellungszeitpunkt</footer>
  </body></html>`;
}

function managementReportStyles() {
  return `
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0 auto; padding: 24px; max-width: 210mm; color: #202a31; background: white; font: 12px/1.45 Arial, sans-serif; overflow-wrap: anywhere; }
    header { border-bottom: 3px solid #176b87; padding-bottom: 12px; }
    h1 { font-size: 24px; line-height: 1.2; margin: 6px 0; }
    h2 { font-size: 15px; margin: 0 0 8px; break-after: avoid; }
    h3 { font-size: 12px; margin: 0 0 4px; }
    p { margin: 5px 0; } .eyebrow { color: #176b87; font-weight: bold; font-size: 10px; }
    .note, footer { font-size: 10px; color: #52616a; }
    .scope { margin-top: 14px; font-weight: bold; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; border-bottom: 1px solid #cdd9df; padding: 16px 0; }
    .metrics strong { font-size: 18px; display: block; }.metrics span { font-size: 10px; }
    .status-strip { display: flex; flex-wrap: wrap; gap: 18px; margin: 12px 0; }
    .status-strip b { color: #176b87; }
    section { margin-top: 20px; } .attention { border-left: 3px solid #be7911; padding: 0 0 0 12px; }
    ul { padding-left: 16px; margin: 4px 0; } li { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
    th { text-align: left; color: #176b87; background: #eff4f6; }
    th, td { padding: 7px 5px; border-bottom: 1px solid #dce3e7; vertical-align: top; }
    th:first-child { width: 30%; } thead { display: table-header-group; }
    tr { break-inside: avoid; } article { margin-top: 10px; }
    .pre { white-space: pre-wrap; } footer { margin-top: 22px; border-top: 1px solid #cdd9df; padding-top: 8px; }
    @media screen and (max-width: 550px) { body { padding: 14px; }.metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } h1 { font-size: 20px; } .report-table { overflow-x: auto; } table { min-width: 540px; } }
    @media print { body { max-width: none; padding: 0; } .metrics, header, .status-strip { break-inside: avoid; } }
  `;
}
