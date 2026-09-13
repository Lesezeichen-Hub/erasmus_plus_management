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
- Klassen und Gruppen fuer die Teilnehmendenmaske
- Partnereinrichtungen, also teilnehmende Schulen oder Organisationen
- Foerderbudgets mit Gesamtbudget, Zeitraum und Laufzeit 15 oder 24 Monate
- feste Formulardaten wie entsendende Schule, Schulort, Ansprechpartner*in, Kontaktadresse und Standardtext fuer Anerkennung

Der Administrationsbereich ist in aufklappbare Gruppen gegliedert: Benutzer und Rollen, Foerderbudgets, Partnereinrichtungen sowie Grunddaten und Vorlagen. Die festen Formulardaten werden automatisch in Lernvereinbarungen, Bescheinigungen und Europass-Vorlagen vorgeschlagen, bleiben dort aber pro Schueler*in bearbeitbar und speicherbar.

Beim Bearbeiten einzelner Formularvorlagen werden Aenderungen nach kurzer Eingabepause automatisch gespeichert. Neben den Template-Aktionen zeigt ein dezenter Status an, ob Werte noch offen sind, gerade gespeichert werden oder zuletzt gesichert wurden.

## Datenhaltung

Die Anwendung nutzt IndexedDB im Browser. Dadurch bleiben Projekte, Foerderbudgets, Partnereinrichtungen, Teilnehmende, Aufwaende, Aufgaben, Dokumente, Stammdaten und Managementbenutzer lokal erhalten, bis Browserdaten geloescht werden.

Nach erfolgreichen Aenderungen legt die App zusaetzlich automatisch rotierende Sicherungen im Browser-`localStorage` ab. Im Backup-Bereich kann die letzte Auto-Sicherung als JSON-Datei heruntergeladen und wie ein normales Backup wieder importiert werden. Beim optionalen lokalen Windows-Server wird weiterhin parallel ein SQLite-Snapshot geschrieben.

## Lokaler Webserver fuer Windows

Mit `ErasmusPlusManagementServer.exe` kann die App lokal ueber `http://127.0.0.1:8765/` ausgeliefert werden. Der Server nutzt nur den lokalen Rechner, oeffnet automatisch den Browser und waehlt bei belegtem Port automatisch den naechsten freien Port.

Beim Start prueft die EXE automatisch die feste GitHub-Quelle `purfect/erasmus_plus_management` auf eine hoehere Version und installiert dann die aktuellen Web-App-Dateien. Die Pruefung hat ein kurzes Zeitlimit; ohne Internet startet der Server wie gewohnt weiter. Der Updatevorgang beruehrt weder `data\\erasmus_plus_management.sqlite`, Browserdaten noch JSON-Backups. Mit `-updates=false` laesst sich die Pruefung fuer einen Start abschalten.

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
- Mobilitaetsakte pro Schueler*in mit allen Projektteilnahmen, projektbezogenen Rollen, Dokumenten, Aufwaenden, Vorlagen und Historie
- Archivmodus fuer abgeschlossene Projekte: archivierte Projekte bleiben sichtbar und durchsuchbar, sind aber gegen Bearbeiten, Loeschen und projektbezogene Folgedaten gesperrt
- Archivmodus fuer Schueler*innen: archivierte Personen bleiben in Akten sichtbar, werden in neuen Personen-Auswahllisten ausgeblendet und sind bis zum Wieder-Oeffnen gesperrt
- Kompakte Aktionsmenues im Projektkatalog und Teilnehmendenindex
- Aenderungshistorie fuer lokale Verwaltungsaktionen
- Sicherheitsbackup vor Import, Beispieldaten-Reset und Loeschvorgaengen plus manueller Sicherungsbutton
- Speicherbare Druckvorlagen fuer Europass Lernvereinbarung und Europass Mobilitaet pro Teilnehmende*r
- Eigener Menuepunkt fuer Mobilitaetsformulare mit Einzel- und Batchausgabe pro Projekt
- Admin-Editor fuer Teilnehmervereinbarung, Lernvereinbarung, Einverstaendnis/Datenschutz und Notfallkarte mit Platzhaltern wie `{name}`, `{projekt}` und `{entsendende_schule}`
- Durchsuchbarer Hilfebereich mit Kategorien und Sprung in die passenden Module
- Batch-Ausgabe pro Projekt fuer Teilnahmebescheinigungen, Europass Mobilitaet und Lernvereinbarungen; beim Drucken/PDF beginnt jedes Dokument auf einer neuen A4-Seite
- Platzsparendere Dokumentvorlagen mit kompakteren Tabellen, Eingabefeldern und Signaturbereichen
- Projekte mit Leitaktion, Foerderbudget, Partnereinrichtungen, Zeitraum, Budget und Status
- Projekte mit Mobilitaetsart: Gruppenmobilitaet, individuelle Kurzzeit-/Langzeitmobilitaet oder gemischt
- Formularzentrale empfiehlt Vorlagen passend zur Mobilitaetsart und gibt Gruppenmobilitaeten als Lernprogramm aus
- Teilnehmende mit globalen Stammdaten und projektbezogenen Angaben wie Rolle, Dokumentenstatus und Notiz
- Projektbezogene mobilitaetsrelevante Angaben je Schueler*in: Notfallkontakte, Allergien, medizinische Hinweise, Versicherung und Medienregelung
- Medizinische Notfallkarte mit eigenen Abschnitten fuer Notfallkontakte, Gesundheit und Versicherung
- Formulartexte wachsen in der Vorschau automatisch mit und werden beim Drucken/PDF vollstaendig ausgegeben
- Klassen/Gruppen werden im Admin-Panel gepflegt und bei Teilnehmenden per Dropdown ausgewaehlt
- Teilnehmendenlisten pro Projekt mit Geburtsdatum, kompaktem Dokumentstatus, fehlenden Dokumenten und Druck-/PDF-Ausgabe
- Automatische, bearbeitbare Foerderpauschalen pro Zielland und Distanzband beim Projektanlegen
- Admin-Tabelle zum Aktualisieren, Speichern, Exportieren und Importieren der Foerderpauschalen-Vorlage
- Teilnehmende mit Projektzuordnung, projektbezogenen Rollen und Dokument-Tabs
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
# Version 1.42.0

Die Projektmaske gliedert Grunddaten, Partnereinrichtungen, Finanzierung und
durchgefuehrte Aktivitaeten in aufklappbare Abschnitte. Pflichtfeldfehler oeffnen
den zugehoerigen Abschnitt automatisch.

Durchgefuehrte Aktivitaeten werden pro Projekt gespeichert, in der Projektakte
angezeigt und in neue Formularausgaben (auch Batch) uebernommen. Europass und
Lernvereinbarung verwenden sie als Aktivitaetentext; die Teilnahmebescheinigung
enthaelt sie in den Details. Im Templateeditor ist zusaetzlich
`{durchgefuehrte_aktivitaeten}` verfuegbar. Individuell gespeicherte Formulartexte
haben weiterhin Vorrang; mit Zuruecksetzen der Vorlagenwerte werden die aktuellen
Projektdaten neu eingesetzt. Das Projektfeld ist Teil der bestehenden
IndexedDB-Speicherung und der JSON-Backups sowie SQLite-Snapshots.
# Version 1.43.0

Unter Projekt bearbeiten > Aktivitaeten & Formulartexte stehen gemeinsame
Vorgaben fuer Lernziele, geplante Aktivitaeten, Zustaendigkeiten, Begleitung,
Europass-Kompetenzen, Mobilitaetsbeschreibung und Anerkennung bereit. Auch die
drei Textbloecke der Teilnahmebescheinigung und die Formularinhalte der vier
Mobilitaetsvorlagen koennen projektweise vorgegeben werden.

Leere Felder verwenden die Standardvorlage. Platzhalter wie `{name}`, `{projekt}`,
`{kompetenzen}`, `{mobilitaetsbeschreibung}`, `{zustaendigkeiten}` und `{begleitung}`
werden pro Person ersetzt. Individuell gespeicherte Formulartexte haben Vorrang;
zum Uebernehmen neuer Projektvorgaben die jeweilige Vorlage zuruecksetzen.
Einzel- und Batch-Ausgaben verwenden dieselben Projektvorgaben. Die Werte werden
als `formTexts` mit dem Projekt gespeichert und sind in den Backups enthalten.
Gesundheits- und Notfallangaben bleiben personenbezogen in der Schueler*innenakte.
# Version 1.44.0

Projekte > Berichte & Export bietet fuer alle angemeldeten Benutzer*innen Kurzbericht,
Finanzuebersicht und Statusbericht. Projekte lassen sich nach Projekt,
ueberlappendem Projektzeitraum, Status und Archiv filtern. Finanzwerte gelten
fuer die gesamte Laufzeit der ausgewaehlten Projekte. Die Foerderbudget-Tabelle
zeigt dagegen die vollstaendigen zugehoerigen Foerderbudgets mit allen ihren
Projektzuordnungen. Geldsummen werden in Cent addiert.

Die Vorschau ist zugleich die isolierte Druckausgabe in A4 hochkant. Ueber
Drucken / PDF kann im Browser als PDF gespeichert werden. HTML exportieren
erstellt einen eigenstaendigen Bericht mit eingebettetem Layout. Berichte
enthalten aggregierte Zahlen, keine Namen, Geburtsdaten oder Gesundheitsdaten
von Schueler*innen. Freie Anmerkungen und Projektausschnitte werden unveraendert
als Text uebernommen. Filter und Anmerkungen sind temporaer; es werden keine
zusaetzlichen Datensaetze gespeichert. Rechentests: `node management-reports.test.cjs`.
# Version 1.44.3

Die globale Suche im Teilnehmendenindex findet Teilnehmende jetzt auch ueber
zugeordnete Projekte: Projektname, Leitaktion, Mobilitaetsart, Zielland,
Partnerdetails und Partnereinrichtungen. Eine Schueler*in mit mehreren
Projekten wird bei einem Treffer in einem beliebigen dieser Projekte angezeigt.
