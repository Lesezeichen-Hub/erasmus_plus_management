const { pbkdf2Sync, randomBytes } = require("crypto");
const { writeFileSync } = require("fs");
const { join } = require("path");

const documentTypes = ["Einverständniserklärung", "Notfallkontakt", "Versicherung", "Beleg", "Vertrag", "Bericht", "Gesundheitsbogen"];
const expenseCategories = ["Reisekosten", "Unterkunft", "Verpflegung", "Taschengeld", "Eintrittsgelder", "Material", "Sonstiges"];
const leadActions = ["KA1", "KA2", "KA3", "Akkreditierung"];

let counter = 1;
const id = (prefix) => `${prefix}-${String(counter++).padStart(4, "0")}`;

function passwordFields(password) {
  const salt = randomBytes(16).toString("base64");
  const hash = pbkdf2Sync(password, Buffer.from(salt, "base64"), 120000, 32, "sha256").toString("base64");
  return {
    passwordSalt: salt,
    passwordHash: hash,
    passwordUpdatedAt: new Date().toISOString(),
  };
}

function datePlus(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

function person(name, className, birthDate, projectIds, role, missing = []) {
  return {
    id: id("student"),
    name,
    className,
    birthDate,
    projectIds,
    role,
    documentStatus: missing.length ? "Unvollständig" : "Vollständig",
    documents: Object.fromEntries(documentTypes.map((type) => [type, !missing.includes(type)])),
  };
}

const fundingBudgets = [
  { id: id("funding"), name: "Erasmus+ Förderbudget 2026/27", startDate: "2026-09-01", endDate: "2027-11-30", durationMonths: 15, amount: 72000, status: "Aktiv", note: "Testdaten: laufender Mobilitätszeitraum" },
  { id: id("funding"), name: "Erasmus+ Förderbudget 2027/29", startDate: "2027-01-01", endDate: "2028-12-31", durationMonths: 24, amount: 128000, status: "Aktiv", note: "Testdaten: mehrjährige Projektlinie" },
  { id: id("funding"), name: "Abrechnungstopf 2025/26", startDate: "2025-09-01", endDate: "2026-11-30", durationMonths: 15, amount: 54000, status: "Inaktiv", note: "Archivierter Testtopf" },
];

const institutions = [
  { id: id("inst"), name: "IES Valencia", country: "Spanien", city: "Valencia", type: "Schule", note: "Koordination: Marta López", visible: true },
  { id: id("inst"), name: "Helsinki Upper School", country: "Finnland", city: "Helsinki", type: "Schule", note: "MINT-Schwerpunkt", visible: true },
  { id: id("inst"), name: "Liceo Scientifico Verona", country: "Italien", city: "Verona", type: "Schule", note: "Nachhaltigkeitsprofil", visible: true },
  { id: id("inst"), name: "Collège Jean Monnet", country: "Frankreich", city: "Lyon", type: "Schule", note: "Sprachprojekt", visible: true },
  { id: id("inst"), name: "Escola Secundária do Porto", country: "Portugal", city: "Porto", type: "Schule", note: "Kunst und Kultur", visible: true },
  { id: id("inst"), name: "Old Partner School", country: "Polen", city: "Krakau", type: "Schule", note: "Ausgeblendeter Altpartner für Zuordnungstest", visible: false },
];

const projects = [
  { id: id("project"), name: "Brücken nach Valencia", action: "KA1", institutionIds: [institutions[0].id], partners: "Klasse 10b und spanische Gastgeberfamilien", startDate: "2026-10-05", endDate: "2026-10-16", destinationCountry: "Spanien", participantCount: 14, durationDays: 10, travelDays: 2, distanceBand: "500-1999", greenTravel: false, dailySupportRate: 74, travelGrantRate: 309, calculatedGrant: 16758, budget: 18500, status: "Aktiv", grantSource: "Testdaten / Erasmus+ Vorlage" },
  { id: id("project"), name: "Green Schools Network", action: "KA2", institutionIds: [institutions[1].id, institutions[2].id], partners: "Arbeitsgruppen Nachhaltigkeit, Schulgarten, Energieaudit", startDate: "2027-02-08", endDate: "2027-09-30", destinationCountry: "Finnland", participantCount: 18, durationDays: 12, travelDays: 2, distanceBand: "500-1999", greenTravel: false, dailySupportRate: 85, travelGrantRate: 309, calculatedGrant: 26982, budget: 31000, status: "Geplant", grantSource: "Testdaten / Erasmus+ Vorlage" },
  { id: id("project"), name: "Atelier Europe Porto", action: "KA1", institutionIds: [institutions[4].id], partners: "Kunstkurs 9a, digitales Portfolio", startDate: "2027-05-03", endDate: "2027-05-12", destinationCountry: "Portugal", participantCount: 16, durationDays: 8, travelDays: 2, distanceBand: "500-1999", greenTravel: true, dailySupportRate: 74, travelGrantRate: 417, calculatedGrant: 18512, budget: 22000, status: "Geplant", grantSource: "Testdaten / Erasmus+ Vorlage" },
  { id: id("project"), name: "Parler Ensemble Lyon", action: "KA1", institutionIds: [institutions[3].id], partners: "Französischprofil 8c", startDate: "2026-12-01", endDate: "2026-12-08", destinationCountry: "Frankreich", participantCount: 12, durationDays: 6, travelDays: 2, distanceBand: "500-1999", greenTravel: true, dailySupportRate: 85, travelGrantRate: 417, calculatedGrant: 13164, budget: 15000, status: "Abrechnung", grantSource: "Testdaten / Erasmus+ Vorlage" },
  { id: id("project"), name: "Digital Storytelling Krakau", action: "KA2", institutionIds: [institutions[5].id], partners: "Archiviertes Partnerschaftsprojekt mit ausgeblendeter Schule", startDate: "2026-03-02", endDate: "2026-03-13", destinationCountry: "Polen", participantCount: 10, durationDays: 10, travelDays: 2, distanceBand: "500-1999", greenTravel: false, dailySupportRate: 64, travelGrantRate: 309, calculatedGrant: 10770, budget: 12500, status: "Abgeschlossen", grantSource: "Testdaten / Erasmus+ Vorlage" },
];

const p = Object.fromEntries(projects.map((project) => [project.name, project.id]));

const students = [
  person("Mila Schneider", "10b", "2010-04-12", [p["Brücken nach Valencia"]], "Teilnehmer"),
  person("Jonas Weber", "10b", "2010-08-25", [p["Brücken nach Valencia"], p["Green Schools Network"]], "Teilnehmer", ["Versicherung"]),
  person("Aylin Demir", "10b", "2010-01-30", [p["Brücken nach Valencia"]], "Teilnehmer", ["Notfallkontakt"]),
  person("Paul Krüger", "10b", "2009-11-09", [p["Brücken nach Valencia"]], "Teilnehmer"),
  person("Emma Hoffmann", "10b", "2010-06-18", [p["Brücken nach Valencia"]], "Teilnehmer", ["Einverständniserklärung", "Gesundheitsbogen"]),
  person("Noah Becker", "10b", "2010-02-21", [p["Brücken nach Valencia"]], "Nachrücker", ["Versicherung"]),
  person("Lina Fischer", "10c", "2010-03-14", [p["Brücken nach Valencia"]], "Teilnehmer"),
  person("Ben Wagner", "10c", "2009-12-03", [p["Brücken nach Valencia"]], "Teilnehmer"),
  person("Sofia Neumann", "10c", "2010-07-07", [p["Brücken nach Valencia"]], "Teilnehmer", ["Bericht"]),
  person("Tim Scholz", "10c", "2010-05-01", [p["Brücken nach Valencia"]], "Teilnehmer"),

  person("Lea Klein", "9a", "2011-02-05", [p["Atelier Europe Porto"]], "Teilnehmer"),
  person("Felix Richter", "9a", "2011-09-19", [p["Atelier Europe Porto"]], "Teilnehmer", ["Notfallkontakt", "Versicherung"]),
  person("Hannah Wolf", "9a", "2011-01-22", [p["Atelier Europe Porto"]], "Teilnehmer"),
  person("Max Braun", "9a", "2010-12-15", [p["Atelier Europe Porto"]], "Teilnehmer", ["Gesundheitsbogen"]),
  person("Nora Hartmann", "9b", "2011-04-27", [p["Atelier Europe Porto"]], "Teilnehmer"),
  person("Elias Koch", "9b", "2011-06-04", [p["Atelier Europe Porto"]], "Nachrücker", ["Einverständniserklärung"]),
  person("Greta Zimmer", "9b", "2011-03-31", [p["Atelier Europe Porto"]], "Teilnehmer"),
  person("Oskar Lange", "9b", "2010-10-10", [p["Atelier Europe Porto"]], "Teilnehmer", ["Beleg"]),

  person("Marie Schäfer", "8c", "2012-01-08", [p["Parler Ensemble Lyon"]], "Teilnehmer"),
  person("Anton Vogel", "8c", "2012-05-26", [p["Parler Ensemble Lyon"]], "Teilnehmer", ["Bericht"]),
  person("Clara Busch", "8c", "2011-11-17", [p["Parler Ensemble Lyon"]], "Teilnehmer"),
  person("David Roth", "8c", "2012-07-02", [p["Parler Ensemble Lyon"]], "Teilnehmer", ["Versicherung"]),
  person("Jule Peters", "8d", "2012-03-11", [p["Parler Ensemble Lyon"]], "Teilnehmer"),
  person("Leon Meyer", "8d", "2011-12-29", [p["Parler Ensemble Lyon"]], "Nachrücker", ["Notfallkontakt", "Gesundheitsbogen"]),

  person("Lara König", "11a", "2009-02-13", [p["Green Schools Network"]], "Teilnehmer"),
  person("Moritz Frank", "11a", "2008-09-06", [p["Green Schools Network"]], "Teilnehmer"),
  person("Amelie Schmitt", "11a", "2009-05-24", [p["Green Schools Network"]], "Teilnehmer", ["Einverständniserklärung"]),
  person("Samuel Werner", "11a", "2008-12-01", [p["Green Schools Network"]], "Teilnehmer"),
  person("Nele Kaiser", "11b", "2009-06-30", [p["Green Schools Network"]], "Teilnehmer", ["Versicherung", "Gesundheitsbogen"]),
  person("Jan Seidel", "11b", "2008-10-21", [p["Green Schools Network"]], "Teilnehmer"),
  person("Klara Brandt", "11b", "2009-03-03", [p["Green Schools Network"]], "Teilnehmer"),
  person("Luis Sommer", "11b", "2008-11-14", [p["Green Schools Network"]], "Nachrücker", ["Notfallkontakt"]),

  person("Tessa Bauer", "10a", "2010-02-18", [p["Digital Storytelling Krakau"]], "Teilnehmer"),
  person("Robin Graf", "10a", "2009-09-25", [p["Digital Storytelling Krakau"]], "Teilnehmer"),
  person("Nina Lorenz", "10a", "2010-06-12", [p["Digital Storytelling Krakau"]], "Teilnehmer", ["Bericht"]),
  person("Matteo Dietrich", "10a", "2009-12-20", [p["Digital Storytelling Krakau"]], "Teilnehmer"),
];

const studentByName = Object.fromEntries(students.map((student) => [student.name, student.id]));

const taskTemplates = [
  ["Infoabend durchführen", -45, "Erledigt", "Normal"],
  ["Teilnehmerliste finalisieren", -28, "Erledigt", "Hoch"],
  ["Reisedokumente prüfen", -21, "In Arbeit", "Hoch"],
  ["Unterkunft bestätigen", -18, "Offen", "Normal"],
  ["Mobilitätsbericht einreichen", 14, "Offen", "Hoch"],
];
const tasks = projects.flatMap((project) => taskTemplates.map(([title, offset, status, priority]) => ({
  id: id("task"),
  projectId: project.id,
  title,
  dueDate: datePlus(project.startDate, offset),
  status: project.status === "Abgeschlossen" && title !== "Mobilitätsbericht einreichen" ? "Erledigt" : status,
  priority,
})));

const expenses = [
  ["Brücken nach Valencia", "Mila Schneider", "Reisekosten", 312.8, "Vorhanden", "Flugbuchung Gruppe A", 2],
  ["Brücken nach Valencia", "Jonas Weber", "Taschengeld", 140, "Fehlend", "Barbeleg fehlt noch", 3],
  ["Brücken nach Valencia", "", "Unterkunft", 4200, "Vorhanden", "Hostel Valencia Sammelrechnung", 1],
  ["Green Schools Network", "Lara König", "Material", 285.5, "Vorhanden", "Sensorik-Set Energieaudit", 6],
  ["Green Schools Network", "", "Reisekosten", 6280, "Fehlend", "Gruppenreise Finnland/Italien, Beleg angefragt", 12],
  ["Atelier Europe Porto", "Lea Klein", "Eintrittsgelder", 96, "Vorhanden", "Museumspässe", 5],
  ["Atelier Europe Porto", "", "Unterkunft", 3850, "Vorhanden", "Porto Jugendherberge", 4],
  ["Parler Ensemble Lyon", "Marie Schäfer", "Reisekosten", 188, "Vorhanden", "Bahnfahrt", 1],
  ["Parler Ensemble Lyon", "", "Verpflegung", 1320, "Fehlend", "Restaurant-Sammelbeleg offen", 2],
  ["Digital Storytelling Krakau", "Tessa Bauer", "Reisekosten", 240, "Vorhanden", "Bahn Gruppenanteil", 3],
].map(([projectName, studentNameValue, category, amount, receiptStatus, note, dayOffset]) => {
  const project = projects.find((entry) => entry.name === projectName);
  return {
    id: id("expense"),
    projectId: project.id,
    studentId: studentNameValue ? studentByName[studentNameValue] : "",
    category,
    amount,
    date: datePlus(project.startDate, dayOffset),
    receiptStatus,
    note,
  };
});

const documents = students
  .filter((student, index) => index % 2 === 0)
  .map((student) => ({
    id: id("doc"),
    title: `Einverständnis ${student.name}`,
    type: "Einverständniserklärung",
    projectId: student.projectIds[0],
    studentId: student.id,
    date: datePlus(projects.find((project) => project.id === student.projectIds[0]).startDate, -20),
    status: student.documents["Einverständniserklärung"] ? "Abgelegt" : "Fehlt",
    storageHint: student.documents["Einverständniserklärung"] ? `Testordner/${student.name.replaceAll(" ", "-")}.pdf` : "",
  }))
  .concat([
    { id: id("doc"), title: "Versicherung Jonas Weber", type: "Versicherung", projectId: p["Brücken nach Valencia"], studentId: studentByName["Jonas Weber"], date: "2026-09-20", status: "Fehlt", storageHint: "" },
    { id: id("doc"), title: "Restaurantbeleg Lyon", type: "Beleg", projectId: p["Parler Ensemble Lyon"], studentId: "", date: "2026-12-05", status: "Fehlt", storageHint: "" },
  ]);

const users = [
  { id: id("user"), name: "Test Admin", email: "admin@test.local", role: "Admin", status: "Aktiv", createdAt: new Date().toISOString(), ...passwordFields("Test1234!") },
  { id: id("user"), name: "Lehrkraft Test", email: "lehrkraft@test.local", role: "Benutzer", status: "Aktiv", createdAt: new Date().toISOString(), ...passwordFields("Lehrkraft123!") },
  { id: id("user"), name: "Gesperrter Testnutzer", email: "gesperrt@test.local", role: "Benutzer", status: "Gesperrt", createdAt: new Date().toISOString(), ...passwordFields("Gesperrt123!") },
];

const payload = {
  exportedAt: new Date().toISOString(),
  version: 6,
  note: "Importfertige Testdaten fuer Erasmus+ Management. Login: admin@test.local / Test1234!",
  data: {
    projects,
    students,
    expenses,
    tasks,
    documents,
    users,
    settings: [
      { id: "leadActions", values: leadActions },
      { id: "expenseCategories", values: expenseCategories },
      { id: "documentTypes", values: documentTypes },
    ],
    institutions,
    fundingBudgets,
  },
};

writeFileSync(join(__dirname, "erasmus_plus_testdb_import.json"), JSON.stringify(payload, null, 2), "utf8");
console.log(`Testdaten geschrieben: erasmus_plus_testdb_import.json`);
console.log(`Projekte: ${projects.length}, Schueler: ${students.length}, Aufgaben: ${tasks.length}, Aufwaende: ${expenses.length}, Dokumente: ${documents.length}`);
