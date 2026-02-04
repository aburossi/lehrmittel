# MAPH – Interaktive Module (MVP) · Entwickler-Dokumentation

Diese Dokumentation beschreibt, wie das MVP der interaktiven HTML‑Module aufgebaut ist (Stand: **Modul 1**) und wie ihr daraus die nächsten Module ableiten könnt.

## Ziel & Grundprinzipien

- **Offline-first / ohne Build-Step:** Alles sind statische Dateien (HTML/CSS/JS). Es gibt keine Server-Abhängigkeit und keine CDN-Imports.
- **Ein Modul = eine HTML-Datei:** Pro Modul gibt es eine eigene `module_X.html`.
- **Wiederverwendbare Basis:** Gemeinsame Styles und Hilfsfunktionen liegen in `modules/shared.css` und `modules/shared.js`.
- **CH-Notation:** Ausgabe mit Dezimalkomma, optional Tausendertrennzeichen `'`.
- **Formeln:** Optional lokal via KaTeX; sonst best-effort Text-Fallback (lesbar, aber nicht typografisch perfekt).

## Ordnerstruktur

```
<root>/
  modules/
    index.html
    module_1.html
    shared.css
    shared.js
    vendor/
      katex/
        README.md
  skript1/
    img-*.jpeg
    Lernziele 1 bis 4 und 15 bis 21.md
```

**Wichtig:** `modules/module_1.html` referenziert Bilder aus `skript1/` über relative Pfade wie `../skript1/img-1.jpeg`.

## Einstieg (Nutzung)

- Startseite öffnen: `modules/index.html`
- Modul 1 öffnen: `modules/module_1.html`

### Teilen/Versenden (ohne GitHub)
Am einfachsten ist ein ZIP **vom ganzen Root-Ordner**, damit `modules/` und `skript1/` zusammenbleiben. Danach kann man lokal `modules/index.html` öffnen.

## `modules/index.html` (Modulübersicht)

**Aufgabe:** Liste aller Module anzeigen; Modul 1 ist klickbar, spätere Module sind “in Arbeit”.

- Datenquelle ist aktuell ein JS-Array direkt im HTML (`const modules = [...]`).
- Für ein neues Modul muss nur ein weiterer Eintrag hinzugefügt werden (`href: "module_2.html"` usw.).

## `modules/shared.css` (Design-System)

`shared.css` liefert:

- CSS-Variablen (Farben, Abstände, Radius, Fokus-Ring)
- Layout/Komponenten:
  - `.container`, `.header`, `.card`, `.card-title`
  - Form Controls: `.input`, `.select`, `.btn`, `.btn-primary`, `.btn-secondary`
  - UI: `.pill` + Varianten, `.grid`, `.module-list`, `.module-item`
- `.tex-fallback`: Styling für Formel-Fallback (wenn KaTeX nicht vorhanden ist)
- Print-freundliche Defaults

**Regel für neue Module:** Nutzt möglichst die bestehenden Klassen. Ergänzt modul-spezifische Styles nur dort, wo es wirklich nötig ist.

## `modules/shared.js` (Hilfsfunktionen)

`shared.js` exportiert genau ein globales Objekt:

```js
window.MAPH = { normalizeNumberInput, parseLocaleNumber, formatCH, roundHalfUp, renderTeX }
```

### `MAPH.normalizeNumberInput(raw)`
Entfernt Whitespace, normalisiert Apostroph-Varianten (`’` → `'`). Nützlich vor Parsing/Runden.

### `MAPH.parseLocaleNumber(raw)`
Parst Zahlen mit:
- Dezimaltrennzeichen `,` oder `.`
- Tausendertrennzeichen `'`/`’` (werden ignoriert)

Rückgabe: `number | null`

### `MAPH.formatCH(value, { maxDecimals, useThousands })`
Formatiert Zahlen CH-konform:
- Dezimal **`,`**
- Optional Tausendertrennzeichen **`'`**
- Kürzt (für Anzeige) trailing zeros im Dezimalteil automatisch weg.

### `MAPH.roundHalfUp(raw, decimals)`
String-basiertes Runden nach Skriptregel (Kap. 1.3):
- Wenn die erste wegfallende Ziffer **5** ist → **immer aufrunden**
- Unterstützt auch Exponenten-Schreibweise (z.B. `1E3`)

Rückgabe:
```js
{ rounded: string, rule: 'lt5'|'gt5'|'eq5', nextDigit: string }
```

### `MAPH.renderTeX(root?)`
Rendert Elemente mit `[data-tex]`:
- Wenn `window.katex.render` existiert → KaTeX-Rendering
- Sonst → `texToPlain()` Fallback (≈, √, Brüche, Exponenten best-effort)

**Hinweis:** Das Fallback ist absichtlich “robust & lesbar”, nicht vollständig TeX-kompatibel.

## KaTeX (optional, lokal)

KaTeX ist **nicht** im Repo enthalten. Anleitung:

- `modules/vendor/katex/README.md`

Wenn KaTeX fehlt:
- Die Seite funktioniert trotzdem.
- Formeln erscheinen als vereinfachter Text.
- In Modul 1 wird ein Hinweis eingeblendet.

## `modules/module_1.html` (Modul 1 – Aufbau)

### Sektionen
1. **Header** (Titel, Lernziel, Link “Übersicht”)
2. **Skript-Bezug** (Bilder aus `skript1/`)
3. **Rundungsregeln** (Regeln + Tool + Mini-Übung)
4. **Taschenrechner (Hinweis)** (didaktischer Abschnitt; kein Simulator im MVP-Flow)
5. **Self-Check** (Aufgaben, Eingabe, Prüfen, Lösung anzeigen)

### Bilder / “zu grosse Symbole”
Das erste Bild (Tasten-Symbole) ist bewusst auf eine kleinere Maximalbreite begrenzt:
- `.figure-keys` in `module_1.html`

Wenn ihr andere Bilder einbettet:
- Nutzt `<figure>` + `<figcaption>` (bessere Semantik)
- Achtet auf relative Pfade (bei ZIP/GitHub Pages)

### Rundungs-Tool & Mini-Übung
In `module_1.html`:
- Das Tool nutzt `MAPH.roundHalfUp()`.
- Die Mini-Übung wird über ein Array `roundingExercises` erzeugt.
- Die Eingabe ist leer; Lösungen sind **nicht** vorbefüllt.

**Pattern für neue Übungen:** Array definieren → `build...Row()` → in `<tbody>` einhängen.

### Self‑Check Aufgaben
Die Aufgaben sind ein Array `exercises` mit Feldern wie:

- `id`: Aufgaben-Nummer
- `tex`: TeX-String für Darstellung (`data-tex`)
- `expectedDisplay`: erwartetes Resultat als String (mit gewünschter Rundung)
- `decimals`: Rundungsstellen für die automatische Prüfung (nutzt `roundHalfUp`)
- `solutionText`: Text für `<details>` (Lösung anzeigen)
- optional `mistakes`: typische Fehlresultate (für gezieltes Feedback)
- Spezialfall `id === 9`: exakte Zielzahl + Hinweis EE

**Warum `expectedDisplay` als String?**
Weil die Darstellung in der Schule oft “fixe Stellen” verlangt (z.B. `0,10`) – das ist zuverlässiger als Float-Formatierung.

### “Rechner entfernen”
Der Rechner-Simulator ist im HTML als Element noch vorhanden, aber:
- Er ist **hidden** und wird im Lernfluss nicht genutzt.
- Die Self‑Checks nutzen eine **manuelle Eingabe** (`Dein Resultat`) und vergleichen gegen `expectedDisplay`.

Wenn ihr später wieder einen Simulator wollt:
- `hidden` entfernen
- UI/Script wieder aktiv verknüpfen (aktuell ist der Parser/Simulator-Code noch im Modul vorhanden, aber nicht Teil des MVP-UX).

## Neues Modul erstellen (Empfehlung)

1. `modules/module_1.html` kopieren → `modules/module_2.html`
2. Titel/Lernziel/Quellen anpassen
3. Neue Sektionen als `.card` ergänzen
4. Übungen als Arrays definieren (gleiches Pattern wie in Modul 1)
5. In `modules/index.html` den neuen Modul-Eintrag ergänzen:
   - `href: "module_2.html"`
   - Status “bereit”

### Assets (Bilder/Skript)
Für weitere Module ist es sinnvoll, pro Modul einen eigenen Skript-Ordner zu verwenden, z.B.:

```
skript2/
  img-*.jpeg
  ...
```

Und in `module_2.html` dann `../skript2/...` referenzieren.

## Mini-Checkliste vor Versand

- `modules/index.html` öffnet und listet Module
- `modules/module_X.html`:
  - Bilder laden
  - Formeln: KaTeX oder Fallback sichtbar/lesbar
  - Inputs sind leer (keine Lösungen “vorausgefüllt”)
  - Prüfen-Buttons liefern OK/Nicht OK

## GitHub Pages (wenn gewünscht)

Wenn der Inhalt **öffentlich** sein darf, kann GitHub Pages sinnvoll sein:

- Repo enthält `modules/` und `skript1/` (und zukünftige `skriptX/`)
- Link ist dann z.B. `.../modules/index.html` (oder ihr erstellt im Repo-Root eine `index.html`, die dorthin weiterleitet)
- Wenn KaTeX genutzt werden soll: KaTeX‑Dist **mitcommiten** (`modules/vendor/katex/`)

