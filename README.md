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

Die Benutzerverwaltung bietet Anlegen, Bearbeiten, Rollenwechsel, Passwort-Neuvergabe, Sperren, Entsperren, Loeschen, Filter und Kennzahlen. Der letzte aktive Admin und der eigene aktive Zugang sind gegen versehentliches Sperren oder Loeschen geschuetzt.

Im Admin-Panel koennen ausserdem Stammdaten gepflegt werden:

- Kategorien fuer Aufwaende
- benoetigte beziehungsweise verwendete Dokumenttypen
- Leitaktionen
- Partnereinrichtungen, also teilnehmende Schulen oder Organisationen
- Foerderbudgets mit Gesamtbudget, Zeitraum und Laufzeit 15 oder 24 Monate

## Datenhaltung

Die Anwendung nutzt IndexedDB im Browser. Dadurch bleiben Projekte, Foerderbudgets, Partnereinrichtungen, Schueler, Aufwaende, Aufgaben, Dokumente, Stammdaten und Managementbenutzer lokal erhalten, bis Browserdaten geloescht werden.

Partnereinrichtungen werden nicht geloescht. Im Admin-Panel koennen sie ausgeblendet werden; ihre ID und bestehende Projektzuordnungen bleiben erhalten.

Foerderbudgets werden ebenfalls dauerhaft per ID referenziert. Projekte koennen einem Foerderbudget zugeordnet werden; die App berechnet daraus zugewiesenes Budget und verbleibende Foerdermittel. Bei 15 oder 24 Monaten wird das Enddatum automatisch aus dem Startdatum berechnet. Mit "Keine feste Laufzeit" wird ein manuelles Enddatum verwendet.

Wichtige Stellen in `app.js`:

- `openDatabase()`: Erstellt die IndexedDB-Datenbank und die Object Stores.
- `put()`, `getAll()`, `remove()`, `clearStore()`: Persistenzfunktionen fuer lokale Datensaetze.
- `createPasswordFields()` und `verifyPassword()`: Lokales Passwort-Hashing.
- `exportData()` und `importData()`: Backup als JSON-Datei.

## Funktionen

- Dashboard mit KPIs, Projektstatus, Restbudget und Risikoueberblick
- Projekte mit Leitaktion, Foerderbudget, Partnereinrichtungen, Zeitraum, Budget und Status
- Schueler mit Projektzuordnung, Rolle und Dokumentenstatus
- Aufwaende mit Kategorie, Betrag, Belegstatus, Projekt- und Schuelerbezug
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
