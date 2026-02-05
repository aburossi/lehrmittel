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

          const MAPH = window.MAPH || null;

          function setFeedback(el, ok, text) {
            if (!el) return;
            if (ok) {
              el.innerHTML = `<span class="ok">OK</span> ${text || ""}`.trim();
              return;
            }
            el.innerHTML = `<span class="bad">Noch nicht</span> ${text || ""}`.trim();
          }

          function canonicalizeText(raw) {
            let s = String(raw || "")
              .replace(/\u00A0/g, " ")
              .replace(/[\u2019\u2018]/g, "'")
              .trim();
            if (!s) return "";

            s = s.replace(/\s+/g, "");

            if (s.includes(".") && !s.includes(",")) s = s.replace(/\./g, ",");

            s = s.replace(/μ/g, "µ").replace(/u(?=[A-Za-z])/g, "µ");
            s = s.replace(/\bOhm\b/gi, "Ω");
            s = s.replace(/&Omega;|&#937;/gi, "Ω");

            s = s
              .replace(/tage/gi, "d")
              .replace(/stunden/gi, "h")
              .replace(/minute(n)?/gi, "min")
              .replace(/sekunde(n)?/gi, "s");

            s = s.replace(/[−–—]/g, "-");
            return s;
          }

          function parseNumber(raw) {
            if (MAPH && typeof MAPH.parseLocaleNumber === "function") {
              return MAPH.parseLocaleNumber(raw);
            }
            const n = Number(String(raw || "").replace(",", "."));
            return Number.isFinite(n) ? n : null;
          }

          function fmt(n, opts) {
            if (!Number.isFinite(n)) return "—";
            if (MAPH && typeof MAPH.formatCH === "function") {
              return MAPH.formatCH(
                n,
                Object.assign({ maxDecimals: 10, useThousands: true }, opts || {}),
              );
            }
            return String(n);
          }

          function computeX(mode, a, b, c) {
            if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
              return null;
            }
            if (mode === "inverse") {
              if (c === 0) return null;
              return (b * a) / c;
            }
            if (a === 0) return null;
            return (b * c) / a;
          }

          function computeBPrime(mode, a, b) {
            if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return null;
            if (mode === "inverse") return b * a;
            return b / a;
          }

          function buildArrowSvg(label) {
            const safe = String(label || "");
            return `
              <svg class="arrow-svg" viewBox="0 0 220 56" role="img" aria-label="${safe}">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" opacity="0.7"></polygon>
                  </marker>
                </defs>
                <path class="arrow-path" d="M 110 6 L 110 44" marker-end="url(#arrowhead)"></path>
                <text class="arrow-text" x="110" y="54" text-anchor="middle" font-size="18">${safe}</text>
              </svg>
            `;
          }

          // -------------------------
          // Fall erkennen (Mini-Quiz)
          // -------------------------
          const caseQuiz = [
            {
              id: "q1",
              text: "Je mehr Kilometer gefahren werden, desto mehr Liter Benzin werden verbraucht.",
              expected: "proportional",
              tip: "Mehr → mehr (gleiche Richtung) = proportional.",
            },
            {
              id: "q2",
              text: "Je mehr Arbeiter arbeiten, desto weniger Tage dauert die Arbeit.",
              expected: "inverse",
              tip: "Mehr → weniger (Gegenrichtung) = umgekehrt proportional.",
            },
            {
              id: "q3",
              text: "Je mehr Tage Werbung läuft, desto mehr kostet sie.",
              expected: "proportional",
              tip: "Mehr → mehr = proportional.",
            },
            {
              id: "q4",
              text: "Je grösser die Steighöhe pro Stufe, desto weniger Stufen braucht eine gleich hohe Treppe.",
              expected: "inverse",
              tip: "Mehr → weniger = umgekehrt proportional.",
            },
            {
              id: "q5",
              text: "Je mehr Pumpen gleichzeitig laufen, desto weniger Stunden dauert das Befüllen.",
              expected: "inverse",
              tip: "Mehr → weniger = umgekehrt proportional.",
            },
            {
              id: "q6",
              text: "Je höher der Tagesumsatz (kg/Tag), desto weniger Tage reicht ein gleich grosser Vorrat.",
              expected: "inverse",
              tip: "Mehr pro Tag → schneller leer = umgekehrt proportional.",
            },
            {
              id: "q7",
              text: "Je mehr Fahrzeuge eine Firma hat, desto mehr Liter Benzin werden monatlich verbraucht (gleiches Profil).",
              expected: "proportional",
              tip: "Mehr → mehr = proportional.",
            },
            {
              id: "q8",
              text: "Je mehr Abfüllautomaten eingesetzt werden, desto mehr Flaschen können pro Tag abgefüllt werden.",
              expected: "proportional",
              tip: "Mehr → mehr = proportional.",
            },
          ];

          const caseQuizBody = document.getElementById("case-quiz-body");
          const caseRows = [];
          if (caseQuizBody) {
            for (const q of caseQuiz) {
              const tr = document.createElement("tr");

              const tdText = document.createElement("td");
              tdText.textContent = q.text;

              const tdSel = document.createElement("td");
              const sel = document.createElement("select");
              sel.className = "select";
              sel.innerHTML = `
                <option value="">— auswählen —</option>
                <option value="proportional">proportional</option>
                <option value="inverse">umgekehrt proportional</option>
              `;
              tdSel.appendChild(sel);

              const tdBtn = document.createElement("td");
              const btn = document.createElement("button");
              btn.className = "btn btn-primary";
              btn.type = "button";
              btn.textContent = "Prüfen";
              tdBtn.appendChild(btn);

              const tdFb = document.createElement("td");
              const fb = document.createElement("span");
              fb.textContent = "—";
              tdFb.appendChild(fb);

              function check() {
                const got = sel.value;
                if (!got) {
                  fb.innerHTML = '<span class="bad">Noch nicht</span>';
                  return false;
                }
                const ok = got === q.expected;
                if (ok) {
                  fb.innerHTML = '<span class="ok">OK</span>';
                  return true;
                }
                fb.innerHTML = `<span class="bad">Noch nicht</span> <span class="hint">${q.tip}</span>`;
                return false;
              }

              btn.addEventListener("click", check);

              tr.appendChild(tdText);
              tr.appendChild(tdSel);
              tr.appendChild(tdBtn);
              tr.appendChild(tdFb);
              caseQuizBody.appendChild(tr);

              caseRows.push({
                check,
                reset: () => {
                  sel.value = "";
                  fb.textContent = "—";
                },
              });
            }
          }

          const caseCheckAll = document.getElementById("case-check-all");
          const caseReset = document.getElementById("case-reset");
          const caseSummary = document.getElementById("case-summary");
          if (caseCheckAll) {
            caseCheckAll.addEventListener("click", () => {
              let ok = 0;
              for (const r of caseRows) if (r.check()) ok++;
              if (caseSummary) caseSummary.textContent = `Mini-Quiz: ${ok}/${caseRows.length} korrekt.`;
            });
          }
          if (caseReset) {
            caseReset.addEventListener("click", () => {
              for (const r of caseRows) r.reset();
              if (caseSummary) caseSummary.textContent = "—";
            });
          }

          // -------------------------
          // Dreisatz-Maschine (Stepper)
          // -------------------------
          const els = {
            modeProp: document.getElementById("mode-prop"),
            modeInv: document.getElementById("mode-inv"),
            demoMode: document.getElementById("demo-mode"),

            inA: document.getElementById("in-a"),
            inB: document.getElementById("in-b"),
            inC: document.getElementById("in-c"),
            inX: document.getElementById("in-x"),
            unitLeft: document.getElementById("unit-left"),
            unitRight: document.getElementById("unit-right"),
            note: document.getElementById("machine-note"),

            step1: document.getElementById("step-1"),
            step2: document.getElementById("step-2"),
            stepAll: document.getElementById("step-all"),
            checkX: document.getElementById("check-x"),
            reset: document.getElementById("reset-machine"),
            feedback: document.getElementById("machine-feedback"),
            meta: document.getElementById("stepper-meta"),

            valA: document.getElementById("val-a"),
            valB: document.getElementById("val-b"),
            valOne: document.getElementById("val-one"),
            valBp: document.getElementById("val-bp"),
            valC: document.getElementById("val-c"),
            valX: document.getElementById("val-x"),

            arrow1Left: document.getElementById("arrow1-left"),
            arrow1Right: document.getElementById("arrow1-right"),
            arrow2Left: document.getElementById("arrow2-left"),
            arrow2Right: document.getElementById("arrow2-right"),

            ex1: document.getElementById("load-example-1"),
            ex2: document.getElementById("load-example-2"),
          };

          const machineState = {
            bPrime: null,
            x: null,
          };

          function currentMode() {
            return els.modeInv && els.modeInv.checked ? "inverse" : "proportional";
          }

          function getInputs() {
            const a = parseNumber(els.inA ? els.inA.value : "");
            const b = parseNumber(els.inB ? els.inB.value : "");
            const c = parseNumber(els.inC ? els.inC.value : "");
            const unitL = (els.unitLeft && els.unitLeft.value ? els.unitLeft.value : "").trim();
            const unitR = (els.unitRight && els.unitRight.value ? els.unitRight.value : "").trim();
            return { a, b, c, unitL, unitR };
          }

          function updateArrowLabels() {
            const mode = currentMode();
            const { a, c } = getInputs();
            const aText = Number.isFinite(a) ? fmt(a) : "a";
            const cText = Number.isFinite(c) ? fmt(c) : "c";

            const step1Left = `÷ ${aText}`;
            const step1Right = mode === "inverse" ? `× ${aText}` : `÷ ${aText}`;
            const step2Left = `× ${cText}`;
            const step2Right = mode === "inverse" ? `÷ ${cText}` : `× ${cText}`;

            if (els.arrow1Left) els.arrow1Left.innerHTML = buildArrowSvg(step1Left);
            if (els.arrow1Right) els.arrow1Right.innerHTML = buildArrowSvg(step1Right);
            if (els.arrow2Left) els.arrow2Left.innerHTML = buildArrowSvg(step2Left);
            if (els.arrow2Right) els.arrow2Right.innerHTML = buildArrowSvg(step2Right);
          }

          function setActiveArrow(step) {
            const all = [els.arrow1Left, els.arrow1Right, els.arrow2Left, els.arrow2Right];
            for (const el of all) if (el) el.classList.remove("is-active");
            if (step === 1) {
              if (els.arrow1Left) els.arrow1Left.classList.add("is-active");
              if (els.arrow1Right) els.arrow1Right.classList.add("is-active");
            }
            if (step === 2) {
              if (els.arrow2Left) els.arrow2Left.classList.add("is-active");
              if (els.arrow2Right) els.arrow2Right.classList.add("is-active");
            }
          }

          function renderStepper() {
            const mode = currentMode();
            const { a, b, c, unitL, unitR } = getInputs();

            if (els.valA) els.valA.textContent = Number.isFinite(a) ? `${fmt(a)} ${unitL}`.trim() : "—";
            if (els.valB) els.valB.textContent = Number.isFinite(b) ? `${fmt(b)} ${unitR}`.trim() : "—";
            if (els.valOne) els.valOne.textContent = unitL ? `1 ${unitL}` : "1";

            if (els.valC) els.valC.textContent = Number.isFinite(c) ? `${fmt(c)} ${unitL}`.trim() : "—";

            if (els.valBp) {
              els.valBp.textContent = Number.isFinite(machineState.bPrime)
                ? `${fmt(machineState.bPrime)} ${unitR}`.trim()
                : "—";
            }

            const demo = !!(els.demoMode && els.demoMode.checked);
            if (els.valX) {
              els.valX.textContent =
                demo && Number.isFinite(machineState.x)
                  ? `${fmt(machineState.x)} ${unitR}`.trim()
                  : "x";
            }

            if (els.meta) {
              els.meta.textContent =
                mode === "inverse"
                  ? "Umgekehrt proportional: rechts wird invertiert gerechnet."
                  : "Proportional: beide Seiten gleich rechnen.";
            }

            updateArrowLabels();
          }

          function resetMachine(keepInputs) {
            machineState.bPrime = null;
            machineState.x = null;
            setActiveArrow(0);
            if (!keepInputs) {
              if (els.inA) els.inA.value = "";
              if (els.inB) els.inB.value = "";
              if (els.inC) els.inC.value = "";
              if (els.inX) els.inX.value = "";
              if (els.unitLeft) els.unitLeft.value = "";
              if (els.unitRight) els.unitRight.value = "";
              if (els.note) els.note.value = "";
            } else if (els.inX) {
              els.inX.value = "";
            }
            if (els.feedback) els.feedback.textContent = "—";
            renderStepper();
          }

          function onStep1() {
            const { a, b } = getInputs();
            const mode = currentMode();
            const bp = computeBPrime(mode, a, b);
            if (!Number.isFinite(bp)) {
              setFeedback(els.feedback, false, "Bitte a und b gültig eingeben (a ≠ 0).");
              return;
            }
            machineState.bPrime = bp;
            setActiveArrow(1);
            setFeedback(els.feedback, true, "Schritt 1 ok (auf 1 normiert).");
            renderStepper();
          }

          function onStep2() {
            const { a, b, c } = getInputs();
            const mode = currentMode();
            const x = computeX(mode, a, b, c);
            if (!Number.isFinite(x)) {
              setFeedback(els.feedback, false, "Bitte a, b, c gültig eingeben (keine 0 im Nenner).");
              return;
            }
            machineState.x = x;
            setActiveArrow(2);
            setFeedback(els.feedback, true, "Schritt 2 ok (Zielwert skaliert).");
            renderStepper();
          }

          function onAll() {
            onStep1();
            onStep2();
          }

          function onCheckX() {
            const { a, b, c } = getInputs();
            const mode = currentMode();
            const expected = computeX(mode, a, b, c);
            if (!Number.isFinite(expected)) {
              setFeedback(els.feedback, false, "Bitte zuerst a, b, c gültig eingeben.");
              return;
            }
            const got = parseNumber(els.inX ? els.inX.value : "");
            if (!Number.isFinite(got)) {
              setFeedback(els.feedback, false, "Bitte dein Resultat bei x eingeben.");
              return;
            }
            const diff = Math.abs(got - expected);
            const ok = diff <= 1e-9 || diff <= Math.max(1e-9, Math.abs(expected) * 1e-9);
            if (ok) {
              setFeedback(els.feedback, true, "");
              return;
            }
            const tip =
              mode === "inverse"
                ? "Tipp: Umgekehrt proportional: links ÷a, rechts ×a, dann links ×c, rechts ÷c."
                : "Tipp: Proportional: beide Seiten gleich rechnen (÷a, dann ×c).";
            setFeedback(els.feedback, false, tip);
          }

          function setMode(mode) {
            if (mode === "inverse") {
              if (els.modeInv) els.modeInv.checked = true;
            } else if (els.modeProp) {
              els.modeProp.checked = true;
            }
            resetMachine(true);
          }

          function loadExample(which) {
            if (which === 1) {
              setMode("proportional");
              if (els.inA) els.inA.value = "100";
              if (els.inB) els.inB.value = "7,4";
              if (els.inC) els.inC.value = "346";
              if (els.unitLeft) els.unitLeft.value = "km";
              if (els.unitRight) els.unitRight.value = "l";
              if (els.note) els.note.value = "Benzinverbrauch";
              resetMachine(true);
              renderStepper();
              return;
            }
            setMode("inverse");
            if (els.inA) els.inA.value = "3";
            if (els.inB) els.inB.value = "7";
            if (els.inC) els.inC.value = "5";
            if (els.unitLeft) els.unitLeft.value = "Maurer";
            if (els.unitRight) els.unitRight.value = "Tage";
            if (els.note) els.note.value = "Hauswand";
            resetMachine(true);
            renderStepper();
          }

          if (els.step1) els.step1.addEventListener("click", onStep1);
          if (els.step2) els.step2.addEventListener("click", onStep2);
          if (els.stepAll) els.stepAll.addEventListener("click", onAll);
          if (els.checkX) els.checkX.addEventListener("click", onCheckX);
          if (els.reset) els.reset.addEventListener("click", () => resetMachine(false));
          if (els.ex1) els.ex1.addEventListener("click", () => loadExample(1));
          if (els.ex2) els.ex2.addEventListener("click", () => loadExample(2));
          if (els.modeProp) els.modeProp.addEventListener("change", () => resetMachine(true));
          if (els.modeInv) els.modeInv.addEventListener("change", () => resetMachine(true));
          if (els.demoMode) els.demoMode.addEventListener("change", renderStepper);

          for (const input of [els.inA, els.inB, els.inC, els.unitLeft, els.unitRight]) {
            if (!input) continue;
            input.addEventListener("input", () => {
              machineState.bPrime = null;
              machineState.x = null;
              if (els.feedback) els.feedback.textContent = "—";
              renderStepper();
            });
          }

          renderStepper();

          // -------------------------
          // Slider-Szenarien
          // -------------------------
          const scenarioSelect = document.getElementById("scenario-select");
          const scenarioSlider = document.getElementById("scenario-slider");
          const scenarioDesc = document.getElementById("scenario-desc");
          const scenarioSliderLabel = document.getElementById("scenario-slider-label");
          const scenarioApply = document.getElementById("scenario-apply");
          const scenarioDemoOut = document.getElementById("scenario-demo-out");
          const scenarioDemoNote = document.getElementById("scenario-demo-note");

          const scenarios = [
            {
              id: "a1",
              title: "Plakatwerbung (Tage ↔ sFr) – Aufgabe 1",
              mode: "proportional",
              left: { unit: "Tage" },
              right: { unit: "sFr" },
              base: { a: 60, b: 546.0 },
              slider: { key: "c", min: 10, max: 120, step: 1, value: 76 },
              desc: "60 Tage kosten 546,00 sFr. Wie viel kosten 76 Tage?",
            },
            {
              id: "a2",
              title: "Fahrzeuge (Anzahl ↔ Liter/Monat) – Aufgabe 2",
              mode: "proportional",
              left: { unit: "Fahrzeuge" },
              right: { unit: "l" },
              base: { a: 13, b: 1560 },
              slider: { key: "c", min: 5, max: 30, step: 1, value: 15 },
              desc: "13 Fahrzeuge verbrauchen 1560 l/Monat. Wie viel bei 15 Fahrzeugen?",
            },
            {
              id: "a6",
              title: "Treppe (Steighöhe ↔ Stufen) – Aufgabe 6",
              mode: "inverse",
              left: { unit: "cm" },
              right: { unit: "Stufen" },
              base: { a: 18, b: 24 },
              slider: { key: "c", min: 10, max: 24, step: 1, value: 16 },
              desc: "24 Stufen à 18 cm. Wie viele Stufen bei 16 cm (gleiche Höhe)?",
            },
            {
              id: "a11",
              title: "Vorrat (kg/Tag ↔ Tage) – Aufgabe 11",
              mode: "inverse",
              left: { unit: "kg/Tag" },
              right: { unit: "Tage" },
              base: { a: 350, b: 36 },
              slider: { key: "c", min: 150, max: 500, step: 10, value: 280 },
              desc: "Vorrat reicht 36 Tage bei 350 kg/Tag. Wie viele Tage bei 280 kg/Tag?",
            },
          ];

          function getScenarioById(id) {
            return scenarios.find((s) => s.id === id) || scenarios[0] || null;
          }

          let currentScenario = null;

          function getScenarioC() {
            if (!currentScenario) return null;
            if (!scenarioSlider) return currentScenario.slider.value;
            const n = Number(scenarioSlider.value);
            return Number.isFinite(n) ? n : currentScenario.slider.value;
          }

          function renderScenarioOutput() {
            const sc = currentScenario;
            if (!sc) return;
            const c = getScenarioC();

            if (scenarioSliderLabel) {
              scenarioSliderLabel.textContent = `c = ${fmt(c)} ${sc.left.unit}`.trim();
            }

            if (!scenarioDemoOut || !scenarioDemoNote) return;
            const demo = !!(els.demoMode && els.demoMode.checked);
            if (!demo) {
              scenarioDemoOut.textContent = "—";
              scenarioDemoNote.textContent =
                "Im Übungsmodus bleibt hier ein Strich – aktiviere Demo-Modus.";
              return;
            }

            const x = computeX(sc.mode, sc.base.a, sc.base.b, c);
            scenarioDemoOut.textContent = Number.isFinite(x)
              ? `${fmt(x)} ${sc.right.unit}`.trim()
              : "—";
            scenarioDemoNote.textContent = "Demo-Modus ist aktiv: Resultat wird angezeigt.";
          }

          function setScenario(sc) {
            currentScenario = sc;
            if (!sc) return;

            if (scenarioDesc) scenarioDesc.textContent = sc.desc || "—";
            if (scenarioSlider) {
              scenarioSlider.min = String(sc.slider.min);
              scenarioSlider.max = String(sc.slider.max);
              scenarioSlider.step = String(sc.slider.step);
              scenarioSlider.value = String(sc.slider.value);
            }
            renderScenarioOutput();
          }

          if (scenarioSelect) {
            scenarioSelect.innerHTML = scenarios
              .map((s) => `<option value="${s.id}">${s.title}</option>`)
              .join("");
            scenarioSelect.value = scenarios[0].id;
            scenarioSelect.addEventListener("change", () => {
              setScenario(getScenarioById(scenarioSelect.value));
            });
            setScenario(getScenarioById(scenarioSelect.value));
          }

          if (scenarioSlider) {
            scenarioSlider.addEventListener("input", renderScenarioOutput, {
              passive: true,
            });
          }

          if (els.demoMode) {
            els.demoMode.addEventListener("change", () => {
              renderScenarioOutput();
            });
          }

          if (scenarioApply) {
            scenarioApply.addEventListener("click", () => {
              if (!scenarioSelect) return;
              const sc = getScenarioById(scenarioSelect.value);
              if (!sc) return;
              setMode(sc.mode);
              if (els.inA) els.inA.value = String(sc.base.a).replace(".", ",");
              if (els.inB) els.inB.value = String(sc.base.b).replace(".", ",");
              if (els.inC) els.inC.value = String(scenarioSlider ? scenarioSlider.value : sc.slider.value);
              if (els.unitLeft) els.unitLeft.value = sc.left.unit;
              if (els.unitRight) els.unitRight.value = sc.right.unit;
              if (els.note) els.note.value = sc.title;
              resetMachine(true);
              renderStepper();
              if (els.inX) els.inX.focus();
            });
          }

          // -------------------------
          // Self-Check Aufgaben 1–24
          // -------------------------
          const exerciseFilter = document.getElementById("exercise-filter");
          const exerciseList = document.getElementById("exercise-list");
          const exerciseSummary = document.getElementById("exercise-summary");

          function stripToNumberish(raw) {
            return String(raw || "").replace(/[^0-9,.\-+'’]/g, "");
          }

          function checkExpected(expected, rawInput) {
            if (expected && expected.type === "text") {
              const got = canonicalizeText(rawInput);
              if (!got) return { ok: false, reason: "Bitte Resultat eingeben." };
              const variants = Array.isArray(expected.variants)
                ? expected.variants
                : [expected.value];
              const ok = variants.some((v) => canonicalizeText(v) === got);
              return ok
                ? { ok: true }
                : { ok: false, reason: expected.tip || "Tipp: Achte auf Einheiten/Format." };
            }

            // numeric default
            const n = parseNumber(stripToNumberish(rawInput));
            if (!Number.isFinite(n)) return { ok: false, reason: "Bitte Zahl eingeben." };
            const exp = expected && expected.type === "number" ? expected.value : expected;
            if (!Number.isFinite(exp)) return { ok: false, reason: "Interner Fehler." };
            const diff = Math.abs(n - exp);
            const ok = diff <= 1e-9 || diff <= Math.max(1e-9, Math.abs(exp) * 1e-9);
            return ok
              ? { ok: true }
              : { ok: false, reason: (expected && expected.tip) || "Tipp: Prüfe proportional/umgekehrt proportional." };
          }

          const exercises = [
            {
              id: "1",
              mode: "proportional",
              star: false,
              prompt:
                "Eine Plakatwerbung kostet für 60 Tage 546,00 sFr. Wieviel muss für 76 Tage gezahlt werden?",
              expected: { type: "number", value: 691.6, tip: "Tipp: proportional (mehr Tage → mehr Kosten)." },
              solutionText: "691,6 sFr",
            },
            {
              id: "2",
              mode: "proportional",
              star: false,
              prompt:
                "Eine Firma hat 13 Geschäftsfahrzeuge. Diese verbrauchen monatlich 1560 Liter Benzin. Es werden zwei weitere Autos gekauft. Wie hoch ist jetzt der monatliche Benzinverbrauch?",
              expected: { type: "number", value: 1800, tip: "Tipp: proportional (mehr Fahrzeuge → mehr Verbrauch)." },
              solutionText: "1800 l",
            },
            {
              id: "3",
              mode: "proportional",
              star: false,
              prompt:
                "Für das Eindecken eines Daches von 408 m² werden 10'200 Platten benötigt. Wie viele Platten benötigt ein 381 m² grosses Dach?",
              expected: { type: "number", value: 9525, tip: "Tipp: proportional (Fläche → Platten)." },
              solutionText: "9525",
            },
            {
              id: "4",
              mode: "proportional",
              star: false,
              prompt:
                "Aus drei je 50 kg schweren Rohlingen werden drei Fertigteile mit einem Gesamtgewicht von 129,9 kg gedreht. Wie hoch ist das Gewicht der Späne nach einer Tagesproduktion von 25 Werkstücken?",
              expected: { type: "number", value: 167.5, tip: "Tipp: erst Späne pro 3 Teile, dann proportional hochrechnen." },
              solutionText: "167,5 kg",
            },
            {
              id: "5",
              mode: "proportional",
              star: false,
              prompt:
                "Die betrieblichen Stromkosten betragen 5'763,15 sFr für 19'210 kWh. Wie hoch ist der Stromkostenanteil des Materiallagers? (alter Zählerstand 6'937 kWh, neuer Stand 9'023 kWh)",
              expected: { type: "number", value: 625.8, tip: "Tipp: erst kWh Lager = 9'023−6'937, dann proportional." },
              solutionText: "625,8 sFr",
            },
            {
              id: "6",
              mode: "inverse",
              star: false,
              prompt:
                "Eine Treppe hat 24 Stufen mit einer Steighöhe von jeweils 18 cm. Wie viele Stufen mit einer Steighöhe von 16 cm hat eine gleich grosse Treppe?",
              expected: { type: "number", value: 27, tip: "Tipp: umgekehrt proportional (Steighöhe ↑ → Stufen ↓)." },
              solutionText: "27 Stufen",
            },
            {
              id: "7",
              mode: "proportional",
              star: false,
              prompt:
                "14 Abfüllautomaten haben eine Tageskapazität von 2'100 Flaschen. Wie viele Automaten müssen nachbestellt werden, damit 3'000 Flaschen abgefüllt werden können?",
              expected: { type: "number", value: 6, tip: "Tipp: proportional (Flaschen ∝ Automaten)." },
              solutionText: "6 Automaten",
            },
            {
              id: "8",
              mode: "inverse",
              star: false,
              prompt:
                "Ein Frachter benötigt für eine Fahrt bei 17 Knoten Geschwindigkeit 10 Tage und 18 Stunden. Wie lange benötigt der Frachter bei 20 Knoten?",
              expected: {
                type: "text",
                variants: [
                  "9 Tage 3 Stunden 18 Minuten",
                  "9d3h18min",
                  "9 d 3 h 18 min",
                ],
                tip: "Tipp: umgekehrt proportional (v ↑ → Zeit ↓).",
              },
              solutionText: "9 Tage 3 Stunden 18 Minuten",
            },
            {
              id: "9",
              mode: "proportional",
              star: false,
              prompt:
                "Eine Wärmepumpe verbraucht in 4½ Stunden 174 kWh Strom. Wie viele kWh Strom verbraucht die Wärmepumpe in 15¼ Stunden?",
              expected: { type: "number", value: 589.67, tip: "Tipp: proportional (Zeit ∝ Energie)." },
              solutionText: "589,67 kWh",
            },
            {
              id: "10",
              mode: "inverse",
              star: false,
              prompt:
                "Eine Batterie liefert 21 Glühlampen für 75 Stunden Strom. Es werden vier weitere Lampen angeschlossen. Für welche Zeit reicht die Batterie bei dieser Belastung?",
              expected: { type: "number", value: 65.625, tip: "Tipp: umgekehrt proportional (mehr Lampen → weniger Zeit)." },
              solutionText: "65,625 h",
            },
            {
              id: "11",
              mode: "inverse",
              star: false,
              prompt:
                "Der Vorrat einer Ware reicht noch 36 Tage bei einem Tagesumsatz von 350 kg. Wie viele Tage reicht der gleiche Vorrat bei 280 kg Tagesumsatz?",
              expected: { type: "number", value: 45, tip: "Tipp: umgekehrt proportional (Umsatz ↓ → Tage ↑)." },
              solutionText: "45 Tage",
            },
            {
              id: "12",
              mode: "inverse",
              star: false,
              prompt:
                "Ein Rohstoffvorrat reicht für 35 Maschinen 24 Arbeitstage. Für wie viele Arbeitstage reicht der Vorrat, wenn 7 Maschinen ausfallen?",
              expected: { type: "number", value: 30, tip: "Tipp: umgekehrt proportional (weniger Maschinen → länger)." },
              solutionText: "30 Tage",
            },
            {
              id: "13",
              mode: "proportional",
              star: false,
              prompt:
                "Das Ausheben einer Grube (8 m lang, 3,5 m breit, 2 m tief) kostet 1'252 sFr. Wieviel kostet eine Grube mit 4,5 m × 2 m × 3 m?",
              expected: { type: "number", value: 603.64, tip: "Tipp: proportional zum Volumen." },
              solutionText: "603,64 sFr",
            },
            {
              id: "14",
              mode: "proportional",
              star: false,
              prompt:
                "Ein 6 m² grosses Kupferblech, 4 mm dick, wiegt 213,6 kg. Wie viel wiegt ein 3 mm dickes Blech mit 4 m²?",
              expected: { type: "number", value: 106.8, tip: "Tipp: proportional zu Fläche und Dicke." },
              solutionText: "106,8 kg",
            },
            {
              id: "15*",
              mode: "inverse",
              star: true,
              prompt:
                "Um 1280 Karosserieteile herzustellen, muss man 4 Stanzen 8 h einsetzen. Um wie viel Stunden muss man die tägliche Arbeitszeit erhöhen, wenn 2400 Teile hergestellt werden sollen und zwei Stanzen zusätzlich eingesetzt werden können?",
              expected: { type: "number", value: 2, tip: "Tipp: Mehr Teile → mehr Aufwand; mehr Stanzen → weniger Zeit." },
              solutionText: "2 Stunden",
            },
            {
              id: "16*",
              mode: "proportional",
              star: true,
              prompt:
                "Auf drei automatischen Werkzeugmaschinen kann man 150 Metallhülsen in 1 h 15 min herstellen. Wie viele Hülsen in 2 h 30 min, wenn man zwei Maschinen zusätzlich einsetzt?",
              expected: { type: "number", value: 500, tip: "Tipp: proportional zu Zeit und Maschinen." },
              solutionText: "500 Hülsen",
            },
            {
              id: "17",
              mode: "inverse",
              star: false,
              prompt:
                "Ein Schwimmbecken wird von 4 Pumpen in 12 Stunden befüllt. Wie lange brauchen 3 Pumpen?",
              expected: { type: "number", value: 16, tip: "Tipp: umgekehrt proportional (Pumpen ↑ → Zeit ↓)." },
              solutionText: "16 Stunden",
            },
            {
              id: "18",
              mode: "inverse",
              star: false,
              prompt:
                "5 Häcksler benötigen 55 Stunden. Wie lange benötigen 11 Häcksler?",
              expected: { type: "number", value: 25, tip: "Tipp: umgekehrt proportional." },
              solutionText: "25 Stunden",
            },
            {
              id: "19",
              mode: "inverse",
              star: false,
              prompt:
                "300 Liter Brennöl reichen für 20 Lampen, die an 25 Tagen je 6 Stunden brennen. Wieviel Öl benötigen 18 Lampen, die an 30 Tagen je 5 Stunden brennen?",
              expected: { type: "number", value: 270, tip: "Tipp: Öl ∝ Lampen × Tage × Stunden." },
              solutionText: "270 Liter",
            },
            {
              id: "20*",
              mode: "inverse",
              star: true,
              prompt:
                "25 Arbeiter stellen in 32 Tagen bei täglich 7 Stunden ein Sportfeld von 8'000 m² fertig. In wie vielen Tagen à 8 Stunden schaffen 20 Arbeiter ein 12'000 m²-Feld?",
              expected: { type: "number", value: 52.5, tip: "Tipp: Fläche ∝ Arbeiter × Tage × Stunden." },
              solutionText: "52,5 Tage",
            },
            {
              id: "21a*",
              mode: "inverse",
              star: true,
              prompt:
                "Einen Bau erledigen 3 Arbeiter in 10 Tagen à 8 h. a) Wie viele Arbeitskräfte zusätzlich, um in 6 Tagen fertig zu werden (8 h/Tag)?",
              expected: { type: "number", value: 2, tip: "Tipp: umgekehrt proportional (mehr Arbeiter → weniger Tage)." },
              solutionText: "2 Arbeiter",
            },
            {
              id: "21b*",
              mode: "proportional",
              star: true,
              prompt:
                "Einen Bau erledigen 3 Arbeiter in 10 Tagen à 8 h. b) Wie viele Überstunden pro Tag, wenn keine weiteren Arbeiter hinzukommen, aber in 6 Tagen fertig?",
              expected: { type: "number", value: 5.3, tip: "Tipp: Gesamtstunden bleiben gleich." },
              solutionText: "5,3 h",
            },
            {
              id: "21c*",
              mode: "proportional",
              star: true,
              prompt:
                "Einen Bau erledigen 3 Arbeiter in 10 Tagen à 8 h. c) Um wie viel Stunden tägliche Arbeitszeit heraufsetzen, wenn 1 Arbeiter hinzukommt und in 6 Tagen fertig?",
              expected: { type: "number", value: 2, tip: "Tipp: Gesamtstunden bleiben gleich." },
              solutionText: "2 h",
            },
            {
              id: "22",
              mode: "proportional",
              star: false,
              prompt:
                "Ein Verkäufer erhält bei einem Umsatz von 45'200 sFr eine Provision von 3'164 sFr. Im nächsten Monat erhöht sich die Provision um 220,50 sFr. Wie hoch war der Umsatz?",
              expected: { type: "number", value: 48350, tip: "Tipp: Provision ∝ Umsatz." },
              solutionText: "48'350 sFr",
            },
            {
              id: "23",
              mode: "inverse",
              star: false,
              prompt:
                "19 Betriebe: jeder zahlt 5'200 sFr. Um wie viele sFr sinken die Kosten pro Betrieb, wenn 5 weitere Betriebe teilnehmen?",
              expected: { type: "number", value: 1083, tip: "Tipp: Gesamtkosten fix, Betriebe ↑ → Kosten/Betrieb ↓." },
              solutionText: "1'083 sFr",
            },
            {
              id: "24",
              mode: "inverse",
              star: false,
              prompt:
                "Ein 168 m³-Tank wird durch zwei Zuleitungen gefüllt, die 180 und 240 Liter pro Minute liefern. Wie lange dauert das Befüllen (beide Leitungen)?",
              expected: { type: "number", value: 400, tip: "Tipp: Liter/Minute addieren, dann Volumen / Durchfluss." },
              solutionText: "400 min",
            },
          ];

          function buildExerciseCard(ex) {
            const card = document.createElement("div");
            card.className = "exercise-card";

            const title = document.createElement("h3");
            title.className = "exercise-title";
            const star = ex.star ? " *" : "";
            const modeLabel = ex.mode === "inverse" ? "umgekehrt proportional" : "proportional";
            title.textContent = `Aufgabe ${ex.id}${star} (${modeLabel})`;

            const p = document.createElement("p");
            p.className = "source-note";
            p.style.margin = "0";
            p.textContent = ex.prompt;

            const actions = document.createElement("div");
            actions.className = "exercise-actions";

            const input = document.createElement("input");
            input.className = "input";
            input.type = "text";
            input.placeholder = "Dein Resultat";
            input.setAttribute("aria-label", `Antwort Aufgabe ${ex.id}`);

            const btn = document.createElement("button");
            btn.className = "btn btn-primary";
            btn.type = "button";
            btn.textContent = "Prüfen";

            const fb = document.createElement("div");
            fb.className = "exercise-feedback";
            fb.textContent = "—";

            function check() {
              const gotRaw = input.value;
              if (!String(gotRaw || "").trim()) {
                setFeedback(fb, false, "Bitte Resultat eingeben.");
                return;
              }

              const res = checkExpected(ex.expected, gotRaw);
              if (res.ok) {
                setFeedback(fb, true, "");
                return;
              }
              setFeedback(fb, false, res.reason || "Versuch es nochmals.");
            }

            btn.addEventListener("click", check);
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
            actions.appendChild(btn);

            card.appendChild(title);
            card.appendChild(p);
            card.appendChild(actions);
            card.appendChild(fb);
            card.appendChild(details);
            return card;
          }

          function renderExercises() {
            if (!exerciseList) return;
            const filter = exerciseFilter ? exerciseFilter.value : "all";
            const shown = exercises.filter((ex) => {
              if (filter === "all") return true;
              if (filter === "proportional") return ex.mode === "proportional";
              if (filter === "inverse") return ex.mode === "inverse";
              if (filter === "star") return !!ex.star;
              return true;
            });

            exerciseList.innerHTML = "";
            for (const ex of shown) exerciseList.appendChild(buildExerciseCard(ex));

            if (exerciseSummary) {
              exerciseSummary.textContent = `Angezeigt: ${shown.length}/${exercises.length}`;
            }
          }

          if (exerciseFilter) {
            exerciseFilter.addEventListener("change", renderExercises);
          }
          renderExercises();

          if (MAPH && typeof MAPH.renderTeX === "function") {
            MAPH.renderTeX();
          }

          // Close IIFE
        })();
      });
