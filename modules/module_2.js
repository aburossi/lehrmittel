window.addEventListener("DOMContentLoaded", () => {
        (function () {
          "use strict";

          const katexNote = document.getElementById("katex-note");
          if (
            katexNote &&
            !(window.katex && typeof window.katex.render === "function")
          ) {
            katexNote.hidden = false;
          }

          function canonicalizeAnswer(raw) {
            let s = String(raw || "")
              .replace(/\u00A0/g, " ")
              .replace(/[\u2019\u2018]/g, "'")
              .trim();
            if (!s) return "";

            s = s.replace(/\s+/g, "");

            // Micro: accept u/μ/µ -> µ
            s = s.replace(/μ/g, "µ").replace(/u(?=[A-Za-z])/g, "µ");

            // Ohm: accept Ohm/ohm -> Ω
            s = s.replace(/\bOhm\b/gi, "Ω");
            s = s.replace(/&Omega;|&#937;/gi, "Ω");

            // Decimal separator: use comma if only dot is present.
            if (s.includes(".") && !s.includes(",")) s = s.replace(/\./g, ",");

            // Normalize multiplication and TeX remnants.
            s = s
              .replace(/\\cdot/g, "·")
              .replace(/\\times/g, "·")
              .replace(/[×*]/g, "·")
              .replace(/10\^\{([^}]*)\}/g, "10^$1")
              .replace(/\^\{([^}]*)\}/g, "^$1")
              .replace(/\\mathrm\{([^}]*)\}/g, "$1")
              .replace(/[{}]/g, "");

            // Normalize minus signs.
            s = s.replace(/[−–—]/g, "-");

            return s;
          }

          function setFeedback(el, ok, text) {
            if (!el) return;
            if (ok) {
              el.innerHTML = `<span class="ok">OK</span> ${text || ""}`.trim();
              return;
            }
            el.innerHTML = `<span class="bad">Noch nicht</span> ${text || ""}`.trim();
          }

          // -------------------------
          // Prefixes
          // -------------------------
          const PREFIXES = [
            { sym: "E", name: "Exa", exp: 18 },
            { sym: "P", name: "Peta", exp: 15 },
            { sym: "T", name: "Tera", exp: 12 },
            { sym: "G", name: "Giga", exp: 9 },
            { sym: "M", name: "Mega", exp: 6 },
            { sym: "k", name: "Kilo", exp: 3 },
            { sym: "h", name: "Hekto", exp: 2 },
            { sym: "da", name: "Deka", exp: 1 },
            { sym: "", name: "(kein)", exp: 0 },
            { sym: "d", name: "Dezi", exp: -1 },
            { sym: "c", name: "Centi", exp: -2 },
            { sym: "m", name: "Milli", exp: -3 },
            { sym: "µ", name: "Mikro", exp: -6 },
            { sym: "n", name: "Nano", exp: -9 },
            { sym: "p", name: "Pico", exp: -12 },
            { sym: "f", name: "Femto", exp: -15 },
            { sym: "a", name: "Atto", exp: -18 },
          ];

          function prefixLabel(p) {
            const sym = p.sym ? p.sym : "—";
            return `${sym} (${p.name}, 10^${p.exp})`;
          }

          const prefixRefTbody = document.getElementById("prefix-ref");
          if (prefixRefTbody) {
            prefixRefTbody.innerHTML = PREFIXES.map((p) => {
              const sym = p.sym ? p.sym : "—";
              const example =
                p.exp === 0
                  ? "1 m = 1 m"
                  : `1 ${sym}m = 10^${p.exp} m`;
              return `
                <tr>
                  <td><code>10^${p.exp}</code></td>
                  <td><code>${sym}</code></td>
                  <td>${p.name}</td>
                  <td><span class="hint">${example}</span></td>
                </tr>
              `;
            }).join("");
          }

          // -------------------------
          // Prefix mini-check
          // -------------------------
          const prefixQuizRows = [
            { exp: 6, sym: "M", name: "Mega" },
            { exp: 3, sym: "k", name: "Kilo" },
            { exp: -3, sym: "m", name: "Milli" },
            { exp: -6, sym: "µ", name: "Mikro" },
            { exp: 9, sym: "G", name: "Giga" },
            { exp: -9, sym: "n", name: "Nano" },
            { exp: 12, sym: "T", name: "Tera" },
            { exp: -12, sym: "p", name: "Pico" },
          ];

          const prefixQuizTbody = document.getElementById("prefix-quiz");
          const prefixQuizRowEls = [];

          function buildPrefixQuizRow(row) {
            const tr = document.createElement("tr");

            const pow = document.createElement("td");
            pow.innerHTML = `<code>10^${row.exp}</code>`;

            const symTd = document.createElement("td");
            const symInput = document.createElement("input");
            symInput.className = "input";
            symInput.type = "text";
            symInput.placeholder = "z.B. k";
            symTd.appendChild(symInput);

            const nameTd = document.createElement("td");
            const nameInput = document.createElement("input");
            nameInput.className = "input";
            nameInput.type = "text";
            nameInput.placeholder = "z.B. Kilo";
            nameTd.appendChild(nameInput);

            const checkTd = document.createElement("td");
            const btn = document.createElement("button");
            btn.className = "btn btn-primary";
            btn.type = "button";
            btn.textContent = "Prüfen";
            checkTd.appendChild(btn);

            const fbTd = document.createElement("td");
            const fb = document.createElement("span");
            fb.textContent = "—";
            fbTd.appendChild(fb);

            function check() {
              const gotSym = canonicalizeAnswer(symInput.value);
              const gotName = canonicalizeAnswer(nameInput.value);
              if (!gotSym || !gotName) {
                fb.innerHTML = '<span class="bad">Noch nicht</span>';
                return false;
              }
              const expSym = canonicalizeAnswer(row.sym);
              const expName = canonicalizeAnswer(row.name).toLowerCase();
              const ok =
                gotSym === expSym && gotName.toLowerCase() === expName;
              fb.innerHTML = ok
                ? '<span class="ok">OK</span>'
                : '<span class="bad">Noch nicht</span>';
              return ok;
            }

            btn.addEventListener("click", check);

            tr.appendChild(pow);
            tr.appendChild(symTd);
            tr.appendChild(nameTd);
            tr.appendChild(checkTd);
            tr.appendChild(fbTd);

            tr._check = check;
            tr._reset = () => {
              symInput.value = "";
              nameInput.value = "";
              fb.textContent = "—";
            };
            return tr;
          }

          if (prefixQuizTbody) {
            for (const r of prefixQuizRows) {
              const tr = buildPrefixQuizRow(r);
              prefixQuizRowEls.push(tr);
              prefixQuizTbody.appendChild(tr);
            }
          }

          const prefixSummary = document.getElementById("prefix-summary");
          const prefixCheckAll = document.getElementById("prefix-check-all");
          const prefixReset = document.getElementById("prefix-reset");
          if (prefixCheckAll) {
            prefixCheckAll.addEventListener("click", () => {
              let ok = 0;
              for (const tr of prefixQuizRowEls) if (tr._check()) ok++;
              if (prefixSummary) {
                prefixSummary.textContent = `Mini-Check: ${ok}/${prefixQuizRowEls.length} korrekt.`;
              }
            });
          }
          if (prefixReset) {
            prefixReset.addEventListener("click", () => {
              for (const tr of prefixQuizRowEls) tr._reset();
              if (prefixSummary) prefixSummary.textContent = "—";
            });
          }

          // -------------------------
          // Matching quiz (SI)
          // -------------------------
          const SYMBOL_OPTIONS = [
            "l",
            "m",
            "t",
            "I",
            "T",
            "n",
            "l_v",
            "F",
            "p",
            "P",
            "v",
          ];
          const UNIT_OPTIONS = [
            "m",
            "kg",
            "s",
            "A",
            "K",
            "mol",
            "cd",
            "N",
            "Pa",
            "Nm",
            "W",
            "m/s",
          ];

          const matchRows = [
            { id: "len", quantity: "Länge", expectedSymbol: "l", expectedUnit: "m" },
            { id: "mass", quantity: "Masse", expectedSymbol: "m", expectedUnit: "kg" },
            { id: "time", quantity: "Zeit", expectedSymbol: "t", expectedUnit: "s" },
            {
              id: "current",
              quantity: "Elektrische Stromstärke",
              expectedSymbol: "I",
              expectedUnit: "A",
            },
            { id: "temp", quantity: "Temperatur", expectedSymbol: "T", expectedUnit: "K" },
            { id: "amount", quantity: "Stoffmenge", expectedSymbol: "n", expectedUnit: "mol" },
            { id: "cand", quantity: "Lichtstärke", expectedSymbol: "l_v", expectedUnit: "cd" },
            { id: "force", quantity: "Kraft", expectedSymbol: "F", expectedUnit: "N" },
            { id: "press", quantity: "Druck", expectedSymbol: "p", expectedUnit: "Pa" },
            { id: "power", quantity: "Leistung", expectedSymbol: "P", expectedUnit: "W" },
            { id: "speed", quantity: "Geschwindigkeit", expectedSymbol: "v", expectedUnit: "m/s" },
          ];

          function buildOptionList(values, placeholder) {
            const opts = [
              `<option value="">${placeholder || "— auswählen —"}</option>`,
            ];
            for (const v of values) opts.push(`<option value="${v}">${v}</option>`);
            return opts.join("");
          }

          const matchList = document.getElementById("match-list");
          const matchRowEls = [];

          if (matchList) {
            for (const row of matchRows) {
              const wrap = document.createElement("div");
              wrap.className = "match-row";

              const title = document.createElement("div");
              title.innerHTML = `<div class="match-title">${row.quantity}</div><div class="hint">Wähle Formelzeichen und Einheit</div>`;

              const sym = document.createElement("select");
              sym.className = "select";
              sym.innerHTML = buildOptionList(SYMBOL_OPTIONS, "Formelzeichen");

              const unit = document.createElement("select");
              unit.className = "select";
              unit.innerHTML = buildOptionList(UNIT_OPTIONS, "Einheit");

              const btn = document.createElement("button");
              btn.className = "btn btn-primary";
              btn.type = "button";
              btn.textContent = "Prüfen";

              const fb = document.createElement("div");
              fb.className = "hint";
              fb.textContent = "—";

              function check() {
                const gotSym = canonicalizeAnswer(sym.value);
                const gotUnit = canonicalizeAnswer(unit.value);
                if (!gotSym || !gotUnit) {
                  fb.innerHTML = '<span class="bad">Noch nicht</span> Bitte beide Felder wählen.';
                  return false;
                }
                const expSym = canonicalizeAnswer(row.expectedSymbol);
                const expUnit = canonicalizeAnswer(row.expectedUnit);
                const ok = gotSym === expSym && gotUnit === expUnit;
                if (ok) {
                  fb.innerHTML = '<span class="ok">OK</span>';
                  return true;
                }
                if (row.id === "mass" && gotUnit === "m") {
                  fb.innerHTML =
                    '<span class="bad">Noch nicht</span> Tipp: Masse hat die Einheit kg (nicht m).';
                  return false;
                }
                if (row.id === "len" && gotSym === "m") {
                  fb.innerHTML =
                    '<span class="bad">Noch nicht</span> Tipp: Länge hat Formelzeichen l (m ist die Einheit).';
                  return false;
                }
                fb.innerHTML =
                  '<span class="bad">Noch nicht</span> Tipp: Formelzeichen ≠ Einheit.';
                return false;
              }

              btn.addEventListener("click", check);

              wrap.appendChild(title);
              wrap.appendChild(sym);
              wrap.appendChild(unit);
              wrap.appendChild(btn);
              wrap.appendChild(fb);

              wrap._check = check;
              wrap._reset = () => {
                sym.value = "";
                unit.value = "";
                fb.textContent = "—";
              };

              matchRowEls.push(wrap);
              matchList.appendChild(wrap);
            }
          }

          const matchSummary = document.getElementById("match-summary");
          const matchCheckAll = document.getElementById("match-check-all");
          const matchReset = document.getElementById("match-reset");
          if (matchCheckAll) {
            matchCheckAll.addEventListener("click", () => {
              let ok = 0;
              for (const el of matchRowEls) if (el._check()) ok++;
              if (matchSummary) {
                matchSummary.textContent = `Zuordnen: ${ok}/${matchRowEls.length} korrekt.`;
              }
            });
          }
          if (matchReset) {
            matchReset.addEventListener("click", () => {
              for (const el of matchRowEls) el._reset();
              if (matchSummary) matchSummary.textContent = "—";
            });
          }

          // -------------------------
          // Prefix converter (string-based shifting)
          // -------------------------
          function parseDecimalParts(raw) {
            let s = String(raw || "")
              .replace(/\u00A0/g, " ")
              .replace(/[\u2019\u2018]/g, "'")
              .trim();
            if (!s) throw new Error("Bitte einen Wert eingeben.");

            s = s.replace(/\s+/g, "");
            s = s.replace(/'/g, ""); // thousands

            // If both comma and dot: last one is decimal separator
            const lastComma = s.lastIndexOf(",");
            const lastDot = s.lastIndexOf(".");
            let decSep = null;
            if (lastComma !== -1 || lastDot !== -1) {
              decSep = lastComma > lastDot ? "," : ".";
            }

            let sign = "";
            if (s.startsWith("+")) s = s.slice(1);
            if (s.startsWith("-")) {
              sign = "-";
              s = s.slice(1);
            }
            if (!s) throw new Error("Bitte einen Wert eingeben.");

            let intPart = s;
            let fracPart = "";
            if (decSep) {
              const parts = s.split(decSep);
              intPart = parts[0] || "0";
              fracPart = parts[1] || "";
            }

            if (!/^\d+$/.test(intPart) || (fracPart && !/^\d+$/.test(fracPart))) {
              throw new Error("Ungültige Zahl. Erlaubt sind Ziffern und , oder .");
            }

            intPart = intPart.replace(/^0+(?=\d)/, "");
            return { sign, intPart, fracPart };
          }

          function shiftDecimal(parts, shift) {
            const sign = parts.sign;
            let digits = (parts.intPart + parts.fracPart).replace(/^0+(?=\d)/, "");
            if (!digits || /^0+$/.test(digits)) return "0";

            const scale = parts.fracPart.length;
            const power = shift - scale;

            let outInt = "";
            let outFrac = "";
            if (power >= 0) {
              outInt = digits + "0".repeat(power);
              outFrac = "";
            } else {
              const cut = digits.length + power;
              if (cut > 0) {
                outInt = digits.slice(0, cut);
                outFrac = digits.slice(cut);
              } else {
                outInt = "0";
                outFrac = "0".repeat(-cut) + digits;
              }
            }

            outInt = outInt.replace(/^0+(?=\d)/, "");
            outFrac = outFrac.replace(/0+$/g, "");

            let out = outFrac ? `${outInt},${outFrac}` : outInt;
            if (sign && out !== "0") out = sign + out;
            return out;
          }

          function getPrefixBySym(sym) {
            const want = sym === null || sym === undefined ? "" : String(sym);
            return PREFIXES.find((p) => p.sym === want) || null;
          }

          const convValue = document.getElementById("conv-value");
          const convFrom = document.getElementById("conv-from");
          const convTo = document.getElementById("conv-to");
          const convUnit = document.getElementById("conv-unit");
          const convRun = document.getElementById("conv-run");
          const convOut = document.getElementById("conv-out");
          const convMeta = document.getElementById("conv-meta");
          const convTex = document.getElementById("conv-tex");

          function fillPrefixSelect(sel, defaultSym) {
            if (!sel) return;
            sel.innerHTML = PREFIXES.map((p) => {
              const value = p.sym;
              const selected = value === defaultSym ? " selected" : "";
              const safeValue = value.replace(/"/g, "&quot;");
              return `<option value="${safeValue}"${selected}>${prefixLabel(p)}</option>`;
            }).join("");
          }

          fillPrefixSelect(convFrom, "m");
          fillPrefixSelect(convTo, "");

          function unitFromSelectValue(v) {
            if (v === "&Omega;" || v === "Ω") return "Ω";
            return String(v || "");
          }

          function onConvert() {
            if (!convValue || !convFrom || !convTo || !convOut || !convMeta) return;
            try {
              const from = getPrefixBySym(convFrom.value);
              const to = getPrefixBySym(convTo.value);
              if (!from || !to) throw new Error("Bitte Präfixe wählen.");
              const unit = unitFromSelectValue(convUnit ? convUnit.value : "");
              const parts = parseDecimalParts(convValue.value);
              const shift = from.exp - to.exp;
              const out = shiftDecimal(parts, shift);

              const toSym = to.sym ? to.sym : "";
              convOut.textContent = `${out} ${toSym}${unit}`.trim();
              convMeta.textContent = `Δ = ${from.exp} − ${to.exp} = ${from.exp - to.exp} (Dezimalpunkt verschieben)`;

              if (convTex) {
                const tex = `y = x\\cdot 10^{${from.exp - to.exp}}`;
                convTex.setAttribute("data-tex", tex);
                convTex.textContent = tex;
              }
            } catch (err) {
              const msg = err && err.message ? err.message : "Ungültige Eingabe.";
              convOut.textContent = "—";
              convMeta.textContent = msg;
              if (convTex) {
                convTex.setAttribute("data-tex", "");
                convTex.textContent = "—";
              }
            }

            if (window.MAPH && typeof window.MAPH.renderTeX === "function") {
              window.MAPH.renderTeX();
            }
          }

          if (convRun) convRun.addEventListener("click", onConvert);
          if (convValue) {
            convValue.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConvert();
              }
            });
          }

          // -------------------------
          // Self-check (filled below)
          // -------------------------
          const exercises = [
            // Ohne Präfix (4.1.3 / 2)
            {
              id: "2a",
              title: "Ohne Einheitsvorsatz",
              tex: "32\\,\\mathrm{mm} = \\;?\\,\\mathrm{m}",
              expected: "0,032m",
              hint: "Tipp: Milli = 10^{-3}.",
              solutionText: "32 mm = 0,032 m",
            },
            {
              id: "2b",
              title: "Ohne Einheitsvorsatz",
              tex: "697\\,\\mathrm{hl} = \\;?\\,\\mathrm{l}",
              expected: "69'700l",
              hint: "Tipp: 1 hl = 100 l.",
              solutionText: "697 hl = 69'700 l",
            },
            {
              id: "2c",
              title: "Ohne Einheitsvorsatz",
              tex: "12\\,\\mathrm{M\\Omega} = \\;?\\,\\Omega",
              expected: "12'000'000Ω",
              hint: "Tipp: Mega = 10^{6}.",
              solutionText: "12 MΩ = 12'000'000 Ω",
            },
            {
              id: "2d",
              title: "Ohne Einheitsvorsatz",
              tex: "0,7\\,\\mathrm{ms} = \\;?\\,\\mathrm{s}",
              expected: "0,0007s",
              hint: "Tipp: Milli = 10^{-3}.",
              solutionText: "0,7 ms = 0,0007 s",
            },
            {
              id: "2e",
              title: "Ohne Einheitsvorsatz",
              tex: "65\\,\\mathrm{nF} = \\;?\\,\\mathrm{F}",
              expected: "0,000'000'065F",
              hint: "Tipp: Nano = 10^{-9}.",
              solutionText: "65 nF = 0,000'000'065 F",
            },
            {
              id: "2f",
              title: "Ohne Einheitsvorsatz",
              tex: "0,33\\,\\mathrm{dl} = \\;?\\,\\mathrm{l}",
              expected: "0,033l",
              hint: "Tipp: Dezi = 10^{-1}.",
              solutionText: "0,33 dl = 0,033 l",
            },

            // In gewünschte Einheit (4.1.3 / 3)
            {
              id: "3a",
              title: "In die gewünschte Einheit",
              tex: "0,0035\\,\\mathrm{s} = \\;?\\,\\mathrm{ms}",
              expected: "3,5ms",
              hint: "Tipp: s → ms: mal 1000.",
              solutionText: "0,0035 s = 3,5 ms",
            },
            {
              id: "3b",
              title: "In die gewünschte Einheit",
              tex: "415\\,\\mu\\mathrm{A} = \\;?\\,\\mathrm{mA}",
              expected: "0,415mA",
              hint: "Tipp: µA → mA: durch 1000.",
              solutionText: "415 µA = 0,415 mA",
            },
            {
              id: "3c",
              title: "In die gewünschte Einheit",
              tex: "6,025\\,\\mathrm{km} = \\;?\\,\\mathrm{m}",
              expected: "6'025m",
              hint: "Tipp: km → m: mal 1000.",
              solutionText: "6,025 km = 6'025 m",
            },
            {
              id: "3d",
              title: "In die gewünschte Einheit",
              tex: "325\\,\\mathrm{ms} = \\;?\\,\\mathrm{s}",
              expected: "0,325s",
              hint: "Tipp: ms → s: durch 1000.",
              solutionText: "325 ms = 0,325 s",
            },
            {
              id: "3e",
              title: "In die gewünschte Einheit",
              tex: "12\\,\\mathrm{nm} = \\;?\\,\\mu\\mathrm{m}",
              expected: "0,012µm",
              hint: "Tipp: nm → µm: durch 1000.",
              solutionText: "12 nm = 0,012 µm",
            },
            {
              id: "3f",
              title: "In die gewünschte Einheit",
              tex: "0,0005\\,\\mathrm{Mm} = \\;?\\,\\mathrm{m}",
              expected: "500m",
              hint: "Tipp: Mega = 10^{6}.",
              solutionText: "0,0005 Mm = 500 m",
            },

            // Zweckmässiger Vorsatz (4.1.3 / 4)
            {
              id: "4a",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "500\\,000\\,\\mathrm{V} = \\;?\\,\\mathrm{kV}",
              expected: "500kV",
              hint: "Tipp: 1 kV = 1000 V.",
              solutionText: "500'000 V = 500 kV",
            },
            {
              id: "4b",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "6\\,367\\,000\\,\\mathrm{W} = \\;?\\,\\mathrm{MW}",
              expected: "6,367MW",
              hint: "Tipp: Mega = 10^{6}.",
              solutionText: "6'367'000 W = 6,367 MW",
            },
            {
              id: "4c",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "8\\,750\\,\\mathrm{nF} = \\;?\\,\\mu\\mathrm{F}",
              expected: "8,75µF",
              hint: "Tipp: nF → µF: durch 1000.",
              solutionText: "8'750 nF = 8,75 µF",
            },
            {
              id: "4d",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "0,045\\,\\mathrm{s} = \\;?\\,\\mathrm{ms}",
              expected: "45ms",
              hint: "Tipp: s → ms: mal 1000.",
              solutionText: "0,045 s = 45 ms",
            },
            {
              id: "4e",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "18\\,600\\,\\mathrm{M\\Omega} = \\;?\\,\\mathrm{G\\Omega}",
              expected: "18,6GΩ",
              hint: "Tipp: M → G: durch 1000.",
              solutionText: "18'600 MΩ = 18,6 GΩ",
            },
            {
              id: "4f",
              title: "Zweckmässiger Einheitsvorsatz",
              tex: "13\\,300\\,\\mathrm{l} = \\;?\\,\\mathrm{hl}",
              expected: "133hl",
              hint: "Tipp: 1 hl = 100 l.",
              solutionText: "13'300 l = 133 hl",
            },

            // Vorsatz → Zehnerpotenz (4.1.3 / 5)
            {
              id: "5a",
              title: "Vorsatz als Zehnerpotenz",
              tex: "35\\,\\mathrm{mm} = \\;?\\,\\mathrm{m}",
              expected: "35·10^-3m",
              hint: "Tipp: mm = 10^{-3} m.",
              solutionText: "35 mm = 35 · 10^-3 m",
            },
            {
              id: "5b",
              title: "Vorsatz als Zehnerpotenz",
              tex: "14,2\\,\\mu\\mathrm{A} = \\;?\\,\\mathrm{A}",
              expected: "14,2·10^-6A",
              hint: "Tipp: µ = 10^{-6}.",
              solutionText: "14,2 µA = 14,2 · 10^-6 A",
            },
            {
              id: "5c",
              title: "Vorsatz als Zehnerpotenz",
              tex: "2,5\\,\\mathrm{ps} = \\;?\\,\\mathrm{s}",
              expected: "2,5·10^-12s",
              hint: "Tipp: p = 10^{-12}.",
              solutionText: "2,5 ps = 2,5 · 10^-12 s",
            },

            // Zehnerpotenz → Vorsatz (4.1.3 / 6)
            {
              id: "6a",
              title: "Zehnerpotenz als Vorsatz",
              tex: "36\\cdot 10^{3}\\,\\mathrm{m} = \\;?\\,\\mathrm{km}",
              expected: "36km",
              hint: "Tipp: 10^3 = k.",
              solutionText: "36 · 10^3 m = 36 km",
            },
            {
              id: "6b",
              title: "Zehnerpotenz als Vorsatz",
              tex: "6,8\\cdot 10^{-9}\\,\\mathrm{F} = \\;?\\,\\mathrm{nF}",
              expected: "6,8nF",
              hint: "Tipp: 10^{-9} = n.",
              solutionText: "6,8 · 10^-9 F = 6,8 nF",
            },
            {
              id: "6c",
              title: "Zehnerpotenz als Vorsatz",
              tex: "12\\cdot 10^{12}\\,\\mathrm{W} = \\;?\\,\\mathrm{TW}",
              expected: "12TW",
              hint: "Tipp: 10^{12} = T.",
              solutionText: "12 · 10^12 W = 12 TW",
            },
          ];

          function buildExerciseCard(ex) {
            const card = document.createElement("div");
            card.className = "exercise-card";

            const title = document.createElement("h3");
            title.className = "exercise-title";
            title.textContent = `Aufgabe ${ex.id} – ${ex.title}`;

            const promptWrap = document.createElement("div");
            if (ex.tex) {
              const tex = document.createElement("div");
              tex.setAttribute("data-tex", ex.tex);
              tex.setAttribute("data-display", "block");
              promptWrap.appendChild(tex);
            } else {
              const p = document.createElement("p");
              p.textContent = ex.prompt || "";
              promptWrap.appendChild(p);
            }

            const actions = document.createElement("div");
            actions.className = "exercise-actions";

            const input = document.createElement("input");
            input.className = "input";
            input.type = "text";
            input.placeholder = "Dein Resultat (z.B. 0,032 m)";

            const checkBtn = document.createElement("button");
            checkBtn.className = "btn btn-primary";
            checkBtn.type = "button";
            checkBtn.textContent = "Prüfen";

            const feedback = document.createElement("div");
            feedback.className = "exercise-feedback";
            feedback.textContent = "—";

            function check() {
              const got = canonicalizeAnswer(input.value);
              if (!got) {
                setFeedback(feedback, false, "Bitte Resultat eingeben.");
                return;
              }
              const exp = canonicalizeAnswer(ex.expected);
              if (got === exp) {
                setFeedback(feedback, true, "");
                return;
              }
              setFeedback(feedback, false, ex.hint ? ex.hint : "Versuch es nochmals.");
            }

            checkBtn.addEventListener("click", check);
            input.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                check();
              }
            });

            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = "Lösung anzeigen";
            const sol = document.createElement("div");
            sol.style.marginTop = "8px";
            sol.textContent = ex.solutionText;
            details.appendChild(summary);
            details.appendChild(sol);

            actions.appendChild(input);
            actions.appendChild(checkBtn);

            card.appendChild(title);
            card.appendChild(promptWrap);
            card.appendChild(actions);
            card.appendChild(feedback);
            card.appendChild(details);
            return card;
          }

          const exerciseList = document.getElementById("exercise-list");
          if (exerciseList) {
            for (const ex of exercises) {
              exerciseList.appendChild(buildExerciseCard(ex));
            }
          }

          if (window.MAPH && typeof window.MAPH.renderTeX === "function") {
            window.MAPH.renderTeX();
          }
        })();
      });
