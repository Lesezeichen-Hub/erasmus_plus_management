# Erasmus+ Management

Eine lokale, responsive Single-Page-Webanwendung zur Verwaltung von Erasmus+ Schueleraustausch-Projekten.

## Dateistruktur

```text
erasmus_plus_management/
|-- index.html
|-- styles.css
|-- app.js
|-- version.json
`-- README.md
```

## Start

Die App benoetigt keine Installation und keine externe Datenbank.

Oeffne `index.html` direkt im Browser oder starte optional einen lokalen Server:

```powershell
python -m http.server 8080
```

Danach ist die App unter `http://localhost:8080` erreichbar.

## Anmeldung und Rollen

Beim ersten Start legt die App einen lokalen Admin-Benutzer an. Danach ist die Anwendung passwortgeschuetzt.

- Admin: Zugriff auf alle Bereiche und das Admin-Panel zur Benutzerverwaltung
- Benutzer: Zugriff auf die Managementbereiche ohne Benutzerverwaltung

Passwoerter werden lokal im Browser per Web Crypto PBKDF2 mit Salt gehasht und in IndexedDB gespeichert. Da die App rein statisch im Browser laeuft, ist das ein lokaler Zugriffsschutz und kein Ersatz fuer serverseitige Authentifizierung.

Im Admin-Panel koennen ausserdem Stammdaten gepflegt werden:

- Kategorien fuer Aufwaende
- benoetigte beziehungsweise verwendete Dokumenttypen
- Leitaktionen

## Datenhaltung

Die Anwendung nutzt IndexedDB im Browser. Dadurch bleiben Projekte, Schueler, Aufwaende, Aufgaben, Dokumente, Stammdaten und Managementbenutzer lokal erhalten, bis Browserdaten geloescht werden.

Wichtige Stellen in `app.js`:

- `openDatabase()`: Erstellt die IndexedDB-Datenbank und die Object Stores.
- `put()`, `getAll()`, `remove()`, `clearStore()`: Persistenzfunktionen fuer lokale Datensaetze.
- `createPasswordFields()` und `verifyPassword()`: Lokales Passwort-Hashing.
- `exportData()` und `importData()`: Backup als JSON-Datei.

## Funktionen

- Dashboard mit KPIs, Projektstatus, Restbudget und Risikoueberblick
- Projekte mit Leitaktion, Partnern, Zeitraum, Budget und Status
- Schueler mit Projektzuordnung, Rolle und Dokumentenstatus
- Aufwaende mit Kategorie, Betrag, Belegstatus, Projekt- und Schuelerbezug
- Aufgaben je Projekt mit Fortschrittsbalken
- Dokumentenindex fuer projekt- und schuelerbezogene Unterlagen
- Dokumentenmonitor fuer Einverstaendnis, Notfallkontakt und Versicherung
- Admin-Panel fuer Managementbenutzer mit Rollen Admin und Benutzer
- Admin-Konfiguration fuer Aufwandskategorien, Dokumenttypen und Leitaktionen
- Euro-Anzeige direkt an Budget- und Betragsfeldern
- Globale Suche und fachliche Filter
- JSON-Export und Import als Backup inklusive Benutzerstruktur
