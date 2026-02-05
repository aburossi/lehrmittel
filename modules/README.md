# MAPH – Interaktive Module (MVP) · Entwickler-Dokumentation

Diese Dokumentation beschreibt, wie das MVP der interaktiven HTML‑Module aufgebaut ist (Stand: **Modul 1–5**) und wie ihr daraus die nächsten Module ableiten könnt.

## Ziel & Grundprinzipien

- **Offline-first / ohne Build-Step:** Alles sind statische Dateien (HTML/CSS/JS). Es gibt keine Server-Abhängigkeit und keine CDN-Imports.
- **Ein Modul = eine HTML-Datei:** Pro Modul gibt es eine eigene `module_X.html`.
- **Wiederverwendbare Basis:** Gemeinsame Styles und Hilfsfunktionen liegen in `modules/shared.css`, `modules/shared.js` und `modules/app.js`.
- **CH-Notation:** Ausgabe mit Dezimalkomma, optional Tausendertrennzeichen `'`.
- **Formeln:** Optional lokal via KaTeX; sonst best-effort Text-Fallback (lesbar, aber nicht typografisch perfekt).

## Ordnerstruktur

```
<root>/
  modules/
    index.html
    app.js
    shared.css
    shared.js
    module_1.html
    module_1.css
    module_1.js
    module_2.html
    module_2.css
    module_2.js
    module_3.html
    module_3.css
    module_3.js
    module_4.html
    module_4.css
    module_4.js
    module_5.html
    module_5.css
    module_5.js
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
- Modul 2 öffnen: `modules/module_2.html`
- Modul 3 öffnen: `modules/module_3.html`
- Modul 4 öffnen: `modules/module_4.html`
- Modul 5 öffnen: `modules/module_5.html`

### Teilen/Versenden (ohne GitHub)
Am einfachsten ist ein ZIP **vom ganzen Root-Ordner**, damit `modules/` und `skript1/` zusammenbleiben. Danach kann man lokal `modules/index.html` öffnen.

## `modules/index.html` (Modulübersicht)

**Aufgabe:** Liste aller Module anzeigen; fertige Module sind klickbar, spätere Module sind “in Arbeit”.

- Datenquelle ist `modules/app.js` (Array `MODULES` wird als `MAPH.modules` bereitgestellt).
- Für ein neues Modul nur einen weiteren Eintrag in `MODULES` hinzufügen (`href: "module_6.html"` usw.).

## Modul-spezifische Dateien (CSS/JS)

Alle Module (1–5) sind reine Offline-Seiten (HTML/CSS/JS) und nutzen:

- `shared.css` / `shared.js` (Design + MAPH-Utilities)
- `app.js` (Modul-Metadaten, Modulübersicht, gemeinsamer Header/Navi für alle Module)
- `module_X.css` / `module_X.js` (modul-spezifische Styles & Interaktion)

Die `module_X.html` Dateien enthalten hauptsächlich **Content-Markup** in `<main id="main">` und tragen `data-module-id="X"` am `<body>` (keine Inline `<style>`/`<script>` Blöcke).

- **Kein neuer Global:** Es werden keine neuen `window.*` APIs exportiert; es bleibt bei `window.MAPH` aus `shared.js`.
- **Shared bleibt stabil:** Wenn sich wiederkehrende Logik häuft, kann sie später nach `shared.js` gezogen werden – aktuell war das nicht nötig.

### Modul 4: Kinematik-Dashboard (LZ 16, 20)
`modules/module_4.html` ist ein reines Offline-Modul (HTML/CSS/JS) und nutzt `shared.css`/`shared.js` (MAPH-Utilities) plus `module_4.css`/`module_4.js`. Header/Navi kommen aus `app.js`.

Wichtige Bausteine:
- **Kinematik-Rechner** mit Modus-Umschalter: `v = s/t`, `s = v·t`, `t = s/v` inkl. Umrechnung (m/km, s/min/h, m/s ↔ km/h).
- **Resultat-Schätzer (LZ 16 / Grössenordnung):** Das Resultat wird erst angezeigt, wenn die passende Grössenordnung `10^x` gewählt wurde (`floor(log10(|result|))`).
- **Diagramm-Labor (SVG, ohne externe Libraries):**
  - Datenmodell ist stückweise konstante Geschwindigkeit: `segments = [{ dt_s, v_mps }, ...]`.
  - s–t wird aus den Segmenten aufgebaut, v–t zeigt die Segmente als Rechtecke.
  - Interaktion: Drag an v–t-Handles (v) und Segment-Grenzen (dt); alternativ Eingabe über Tabellenfelder.
- **Self-Checks:** A1–A3 (Diagramm-Aufgaben) und B1–B2 (Musterlösungsweg) mit direktem Feedback.

### Modul 5: Schnittdaten/Rotation (LZ 4, 15, 21)
`modules/module_5.html` ist ein Offline-Modul (HTML/CSS/JS) und nutzt `shared.css`/`shared.js` (MAPH-Utilities) plus `module_5.css`/`module_5.js`. Header/Navi kommen aus `app.js`.

Wichtige Bausteine:
- **Skript-Bezug (Kap. 5.3):** Einbindung der Bilder `img-29`, `img-35`, `img-36`, `img-38` aus `skript1/` zur Begriffsabgrenzung v_u/v_c und zur Übungs-Einbettung.
- **Rechner: Drehzahl n:** Mini-Tool für `n = N/t` mit Umschalter der Zeiteinheit (s/min).
- **Rechner: Umfangsgeschwindigkeit v_u (Solve-Modus):** Modusumschalter für Berechnung von v_u, n oder d inkl. Einheitenwahl (mm/cm/m, 1/s/1/min, m/s/m/min/km/h/mm/min) und optionaler Rundung via `MAPH.roundHalfUp`.
- **Riemen-/Riemenscheiben-Übersetzung:** Rechner mit `d1·n1 = d2·n2` plus SVG-Animation (Drehgeschwindigkeit wird für die Darstellung geclamped). Pause/Play ist enthalten.
- **Schnittdaten-Rechner (Drehen):** `n_ideal = v_c/(π·d)` (d in mm wird intern nach m umgerechnet) + optionaler Drehzahlstufen-Preset (u.a. Skript: 90/120/180/240/300). Zusätzlich: Anzeige v_c,real bei Stufe und Warnbadge bei `n_ideal > n_max`.
- **Lookup (offline-sicher):** v_c-Startwerte als Inline-Daten in `modules/module_5.js` (Konstante `VC_TABLE`) – bewusst kein `fetch`, damit `file://` sauber funktioniert. Werte sind als **PLACEHOLDER** markiert (Banner-Hinweis).
- **Übungsbereich:** Datengetriebene Aufgaben-Karten (Input + "Prüfen" + "Lösung anzeigen") aus Skript 5.3.1 und ausgewählten 5.4 Aufgaben. Zahlen-Parsing ist tolerant gegen CH-Notation (`'` als Tausendertrennzeichen).
- **Vertiefung (Zusatz):** Drehmoment/Leistung (ω=2πn, P=Mω) + Rotationsenergie (Zylinder-Approximation) als einklappbarer Abschnitt.

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

`shared.js` hängt alle Utilities an genau ein globales Objekt (Merge in `window.MAPH`):

```js
window.MAPH = window.MAPH || {};
Object.assign(window.MAPH, { normalizeNumberInput, parseLocaleNumber, formatCH, roundHalfUp, renderTeX });
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

### `MAPH.typesetTeX(root?)`
“All-in-one” Formel-Rendering für **alle Seiten**:
- Erkennt/erzeugt Formeln aus TeX-Delimitern in Text (`\( … \)`, `\[ … \]`, `$$ … $$`, best-effort auch `$ … $`) und wandelt sie in `[data-tex]` um.
- Lädt KaTeX **lokal** (`vendor/katex/…`) wenn vorhanden; sonst (nur bei `http/https`) optional via CDN.
- Rendert danach via `MAPH.renderTeX()`.

Rückgabe: `Promise<{ katexLoaded: boolean }>`

Konfiguration (optional): vor dem ersten `typesetTeX()` setzen:
```js
window.MAPH_TEX = {
  allowCDN: false, // true/false
  localCss: "vendor/katex/katex.min.css",
  localJs: "vendor/katex/katex.min.js",
  cdnCss: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
  cdnJs: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js",
};
```

## KaTeX (optional, lokal)

KaTeX ist **nicht** im Repo enthalten. Anleitung:

- `modules/vendor/katex/README.md`

Wenn KaTeX fehlt:
- Die Seite funktioniert trotzdem.
- Formeln erscheinen als vereinfachter Text.
- In den Modulen wird ein Hinweis unter dem Header eingeblendet (via `app.js`).
- Bei Hosting über GitHub Pages kann `typesetTeX()` (optional) KaTeX auch per CDN nachladen (falls aktiviert).

## `modules/module_1.html` (Modul 1 – Aufbau)

### Sektionen
1. **Header** (wird via `app.js` injiziert: Titel, Lernziel, Navigation)
2. **Skript-Bezug** (Bilder aus `skript1/`)
3. **Rundungsregeln** (Regeln + Tool + Mini-Übung)
4. **Taschenrechner (Hinweis)** (didaktischer Abschnitt; kein Simulator im MVP-Flow)
5. **Self-Check** (Aufgaben, Eingabe, Prüfen, Lösung anzeigen)

### Bilder / “zu grosse Symbole”
Das erste Bild (Tasten-Symbole) ist bewusst auf eine kleinere Maximalbreite begrenzt:
- `.figure-keys` in `module_1.css`

Wenn ihr andere Bilder einbettet:
- Nutzt `<figure>` + `<figcaption>` (bessere Semantik)
- Achtet auf relative Pfade (bei ZIP/GitHub Pages)

### Rundungs-Tool & Mini-Übung
In `module_1.js`:
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

1. Ein bestehendes Modul als Template kopieren (z.B. `module_3.html` + `module_3.css` + `module_3.js`)
2. In `module_6.html` `data-module-id="6"` setzen und Verweise auf `module_6.css` / `module_6.js` anpassen
3. Titel/Lernziel/Quellen im Content anpassen (Header/Navi kommt automatisch via `app.js`)
4. Modul-spezifische Styles in `module_6.css` pflegen
5. Modul-spezifische Logik in `module_6.js` pflegen
6. In `modules/app.js` einen Eintrag in `MODULES` hinzufügen (`id: 6`, `href: "module_6.html"`, `title`, `subtitle`, `status`)

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
