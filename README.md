# Erasmus+ Management

Eine lokale, responsive Single-Page-Webanwendung zur Verwaltung von Erasmus+ Schüleraustausch-Projekten.

## Dateistruktur

```text
erasmus_plus_management/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Start

Die App benötigt keine Installation und keine externe Datenbank.

Öffne `index.html` direkt im Browser oder starte optional einen lokalen Server:

```powershell
python -m http.server 8080
```

Danach ist die App unter `http://localhost:8080` erreichbar.

## Datenhaltung

Die Anwendung nutzt IndexedDB im Browser. Dadurch bleiben Projekte, Schüler, Aufwände und Aufgaben lokal erhalten, bis Browserdaten gelöscht werden.

Wichtige Stellen in `app.js`:

- `openDatabase()`: Erstellt die IndexedDB-Datenbank und die Object Stores.
- `put()`, `getAll()`, `remove()`, `clearStore()`: Persistenzfunktionen fuer lokale Datensaetze.
- `exportData()` und `importData()`: Backup als JSON-Datei.

## Funktionen

- Dashboard mit KPIs, Projektstatus, Restbudget und Risikoübersicht
- Projekte mit Leitaktion, Partnern, Zeitraum, Budget und Status
- Schüler mit Projektzuordnung, Rolle und Dokumentenstatus
- Aufwände mit Kategorie, Betrag, Belegstatus, Projekt- und Schülerbezug
- Aufgaben je Projekt mit Fortschrittsbalken
- Dokumentenindex fuer projekt- und schuelerbezogene Unterlagen
- Dokumentenmonitor fuer Einverstaendnis, Notfallkontakt und Versicherung
- Globale Suche und fachliche Filter
- JSON-Export und Import als Backup
