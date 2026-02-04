# KaTeX (optional, lokal)

Diese Module können Formeln per **KaTeX** rendern – komplett offline (ohne CDN).  
Wenn KaTeX nicht vorhanden ist, bleiben Formeln als lesbarer TeX‑Text sichtbar.

## Erwartete Dateien

Lege die KaTeX‑Dist hier ab:

- `modules/vendor/katex/katex.min.css`
- `modules/vendor/katex/katex.min.js`
- `modules/vendor/katex/fonts/*`

## Option A (empfohlen): via npm installieren und kopieren

1. In einem beliebigen Ordner:
   - `npm i katex`
2. Kopiere danach den Inhalt von:
   - `node_modules/katex/dist/`
3. Nach:
   - `modules/vendor/katex/`

Wichtig: Den Ordner `fonts/` unbedingt mitkopieren.

## Option B: KaTeX Release ZIP

1. Lade das KaTeX Release als ZIP herunter.
2. Kopiere den Inhalt des `dist/` Ordners in:
   - `modules/vendor/katex/`

