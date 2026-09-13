# Umgesetzt: Mobilitätsart pro Projekt

Status: umgesetzt in Version 1.40.0.

## Ziel

Beim Einrichten und Bearbeiten eines Projekts soll eine **Mobilitätsart** auswählbar sein, weil Gruppenmobilität und individuelle Schüler*innenmobilität fachlich unterschiedliche Abläufe, Formulare und Prüfungen brauchen.

## Vorgeschlagene Werte

- Gruppenmobilität
- Individuelle Kurzzeitmobilität
- Individuelle Langzeitmobilität
- Sonstige / gemischt

## Umgesetzte Punkte

1. **Datenmodell erweitert**
   - Projektobjekt um `mobilityType` ergänzt.
   - Bestehende Projekte ohne Feld erhalten beim Anzeigen den Fallback `Gruppenmobilität`.
   - Backup/Import bleibt kompatibel, weil Projekte generisch exportiert werden.

2. **Projektformular erweitert**
   - Feld `Mobilitätsart` beim Projekt anlegen/bearbeiten ergänzen.
   - Dropdown mit den oben genannten Werten.
   - Wert wird beim Speichern übernommen.
   - Beim Bearbeiten bestehender Projekte wird der Wert vorausgefüllt.

3. **Projektkatalog und Projektakte erweitert**
   - Mobilitätsart ist in der Projektzeile sichtbar.
   - Mobilitätsart steht in der Projektakte bei den Projektdetails.

4. **Formularzentrale angepasst**
   - Vorlagen werden abhängig von der Mobilitätsart empfohlen/sortiert.
   - Bei Gruppenmobilität wird die Lernvereinbarung als Lernprogramm ausgegeben.
   - Bei individueller Mobilität wird die individuelle Lernvereinbarung hervorgehoben.

5. **Template-Logik erweitert**
   - Platzhalter `{mobilitaetsart}` ergänzt.
   - Mobilitätsart wird in Formularabschnitten ausgegeben.

6. **Prüfhinweise differenziert**
   - Dashboard meldet bei individuellen Mobilitäten fehlende Lernvereinbarung und fehlenden Notfallkontakt 1.

7. **Dashboard-Hinweise verbessert**
   - Statusmeldungen werden für individuelle Mobilitäten gezielter ergänzt.

8. **Druckausgaben vorbereitet**
   - Gruppenmobilität nutzt Lernprogramm-Titel.
   - Individuelle Mobilitäten behalten personenbezogene Lernvereinbarungen.

## Wichtig

- Die Mobilitätsart ist projektbezogen, nicht schüler*innenbezogen.
- Eine Schüler*in kann trotzdem an mehreren Projekten mit unterschiedlichen Mobilitätsarten teilnehmen.
- Projektbezogene Schüler*innenangaben bleiben weiter in `projectDataByProject`.
- Archivierte Projekte dürfen dadurch nicht nachträglich verändert werden.
- UI nicht überladen: Mobilitätsart im Projektformular als einzelnes Dropdown, nicht als eigener großer Block.
