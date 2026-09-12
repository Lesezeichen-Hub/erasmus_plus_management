# Erasmus+ Management

Eine lokale, responsive Single-Page-Webanwendung zur Verwaltung von Erasmus+ Schueler*innenaustausch-Projekten.

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

Die Benutzerverwaltung bietet Anlegen, Bearbeiten, Rollenwechsel, Passwort-Neuvergabe, Sperren, Entsperren, Loeschen, Filter und Kennzahlen. Der letzte aktive Admin und der eigene aktive Zugang sind gegen versehentliches Sperren oder Loeschen geschuetzt.

Im Admin-Panel koennen ausserdem Stammdaten gepflegt werden:

- Kategorien fuer Aufwaende
- benoetigte beziehungsweise verwendete Dokumenttypen
- Leitaktionen
- Partnereinrichtungen, also teilnehmende Schulen oder Organisationen
- Foerderbudgets mit Gesamtbudget, Zeitraum und Laufzeit 15 oder 24 Monate

## Datenhaltung

Die Anwendung nutzt IndexedDB im Browser. Dadurch bleiben Projekte, Foerderbudgets, Partnereinrichtungen, Teilnehmende, Aufwaende, Aufgaben, Dokumente, Stammdaten und Managementbenutzer lokal erhalten, bis Browserdaten geloescht werden.

## Lokaler Webserver fuer Windows

Mit `ErasmusPlusManagementServer.exe` kann die App lokal ueber `http://127.0.0.1:8765/` ausgeliefert werden. Der Server nutzt nur den lokalen Rechner, oeffnet automatisch den Browser und waehlt bei belegtem Port automatisch den naechsten freien Port.

Wenn Schreibrechte im App-Ordner vorhanden sind, legt der Server beim Start zusaetzlich `data\erasmus_plus_management.sqlite` an. Die Browser-App speichert weiter schnell in IndexedDB und sendet bei Aenderungen parallel einen kompletten Backup-Snapshot an den lokalen Server. Der Server legt diese Snapshots in SQLite ab. Wenn die Browser-interne Datenbank leer ist und ein SQLite-Snapshot existiert, importiert die App diesen beim Start automatisch zurueck in IndexedDB.

Start per Doppelklick:

```text
start-local-server.cmd
```

Manueller Start:

```powershell
.\ErasmusPlusManagementServer.exe
```

Partnereinrichtungen werden nicht geloescht. Im Admin-Panel koennen sie ausgeblendet werden; ihre ID und bestehende Projektzuordnungen bleiben erhalten.

Foerderbudgets werden dauerhaft per ID gespeichert. Alle Projekte, deren Laufzeit mit dem Zeitraum eines aktiven Foerderbudgets ueberlappt, reduzieren dessen verfuegbare Mittel automatisch. Bei 15 oder 24 Monaten wird das Enddatum automatisch aus dem Startdatum berechnet. Mit "Keine feste Laufzeit" wird ein manuelles Enddatum verwendet.

Foerderpauschalen fuer Zielland, individuelle Unterstuetzung pro Tag, Distanzband, Green Travel und Reisekosten werden beim Anlegen eines Projekts automatisch vorgeschlagen. Die Tabellen sind lokal aus dem Erasmus+ Programme Guide 2026 und dem PAD-Dokumentencenter hinterlegt, damit die App auch ohne Server funktioniert. Im Admin-Bereich koennen die Geldwerte gespeichert, exportiert, aus einer JSON-Vorlage importiert oder ueber "Vorlage aktualisieren" wieder auf die eingebaute Vorlage gesetzt werden. Alle vorgeschlagenen Betraege bleiben im Projektformular bearbeitbar.

Das Zusatztool liegt als eigenes Hub-Modul im Ordner `C:\Users\winzi\Documents\Erasmus_plus_Satzimport_export`. Dort kann ausserhalb der Schulumgebung mit `node fetch_grant_templates.js` eine frische Importdatei aus der offiziellen Erasmus+ Online-Vorlage erzeugt werden. Die erzeugte Datei `erasmus-plus-foerderpauschalen-YYYY-MM-DD.json` laesst sich danach im Admin-Bereich importieren.

Wichtige Stellen in `app.js`:

- `openDatabase()`: Erstellt die IndexedDB-Datenbank und die Object Stores.
- `put()`, `getAll()`, `remove()`, `clearStore()`: Persistenzfunktionen fuer lokale Datensaetze.
- `createPasswordFields()` und `verifyPassword()`: Lokales Passwort-Hashing.
- `exportData()` und `importData()`: Backup als JSON-Datei.

## Funktionen

- Dashboard mit KPIs, Projektstatus, Restbudget und Risikoueberblick
- Projektakte mit Projektdetails, Budget, Teilnehmenden, Aufgaben, Aufwaenden, Dokumenten und Historie
- Aenderungshistorie fuer lokale Verwaltungsaktionen
- Projekte mit Leitaktion, Foerderbudget, Partnereinrichtungen, Zeitraum, Budget und Status
- Teilnehmendenlisten pro Projekt mit Geburtsdatum, kompaktem Dokumentstatus, fehlenden Dokumenten und Druck-/PDF-Ausgabe
- Automatische, bearbeitbare Foerderpauschalen pro Zielland und Distanzband beim Projektanlegen
- Admin-Tabelle zum Aktualisieren, Speichern, Exportieren und Importieren der Foerderpauschalen-Vorlage
- Teilnehmende mit Projektzuordnung, Rolle und projektbezogenen Dokument-Tabs
- Aufwaende mit Kategorie, Betrag, Belegstatus, Projekt- und Personenbezug
- Aufgaben je Projekt mit Fortschrittsbalken
- Dokumentenindex fuer projekt- und schuelerbezogene Unterlagen
- Dokumentenmonitor fuer Einverstaendnis, Notfallkontakt und Versicherung
- Admin-Panel fuer Managementbenutzer mit Rollen Admin und Benutzer
- Vollstaendige Benutzerverwaltung mit Statuswechsel, Passwort-Neuvergabe und Filtern
- Admin-Konfiguration fuer Aufwandskategorien, Dokumenttypen, Leitaktionen und Partnereinrichtungen
- Admin-Verwaltung fuer Foerderbudgets mit 15- oder 24-monatiger Laufzeit
- Euro-Anzeige direkt an Budget- und Betragsfeldern
- Globale Suche und fachliche Filter
- JSON-Export und Import als Backup inklusive Benutzerstruktur
