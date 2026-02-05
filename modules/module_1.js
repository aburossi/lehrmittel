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

        const roundInput = document.getElementById("round-input");
        const roundDecimals = document.getElementById("round-decimals");
        const roundRun = document.getElementById("round-run");
        const roundOut = document.getElementById("round-out");
        const roundMeta = document.getElementById("round-meta");
        const roundExercisesTbody = document.getElementById("round-exercises");

        const calcExpression = document.getElementById("calc-expression");
        const calcResult = document.getElementById("calc-result");
        const calcParens = document.getElementById("calc-parens");
        const calcMemory = document.getElementById("calc-memory");
        const calcKeys = document.getElementById("calc-keys");
        const calcMessage = document.getElementById("calc-message");

        let lastResult = null;
        let memoryValue = null;

        function setCalcMessage(text, kind) {
          if (!calcMessage) return;
          calcMessage.textContent = text || "";
          calcMessage.classList.remove("calc-message--ok", "calc-message--bad");
          if (kind === "ok") calcMessage.classList.add("calc-message--ok");
          if (kind === "bad") calcMessage.classList.add("calc-message--bad");
        }

        function updateParensStatus() {
          if (!calcExpression || !calcParens) return;
          const s = calcExpression.value || "";
          let balance = 0;
          for (const ch of s) {
            if (ch === "(" || ch === "[") balance++;
            if (ch === ")" || ch === "]") balance--;
          }
          if (balance < 0) {
            calcParens.textContent = "Klammern offen: 0 (zu viele ')')";
            return;
          }
          calcParens.textContent = `Klammern offen: ${balance}`;
        }

        function updateMemoryStatus() {
          if (!calcMemory) return;
          if (memoryValue === null) {
            calcMemory.textContent = "M: —";
            return;
          }
          calcMemory.textContent = `M: ${MAPH.formatCH(memoryValue, {
            maxDecimals: 10,
            useThousands: true,
          })}`;
        }

        function insertAtCursor(input, text) {
          const start =
            typeof input.selectionStart === "number"
              ? input.selectionStart
              : input.value.length;
          const end =
            typeof input.selectionEnd === "number"
              ? input.selectionEnd
              : input.value.length;
          const before = input.value.slice(0, start);
          const after = input.value.slice(end);
          input.value = before + text + after;
          const nextPos = start + text.length;
          input.setSelectionRange(nextPos, nextPos);
          input.focus();
        }

        function backspaceAtCursor(input) {
          const start =
            typeof input.selectionStart === "number"
              ? input.selectionStart
              : input.value.length;
          const end =
            typeof input.selectionEnd === "number"
              ? input.selectionEnd
              : input.value.length;
          if (start !== end) {
            const before = input.value.slice(0, start);
            const after = input.value.slice(end);
            input.value = before + after;
            input.setSelectionRange(start, start);
            input.focus();
            return;
          }
          if (start <= 0) return;
          const before = input.value.slice(0, start - 1);
          const after = input.value.slice(end);
          input.value = before + after;
          input.setSelectionRange(start - 1, start - 1);
          input.focus();
        }

        function tokenize(expr) {
          const s = String(expr || "");
          const tokens = [];
          let i = 0;

          function isDigit(ch) {
            return ch >= "0" && ch <= "9";
          }

          function isAlpha(ch) {
            return (
              (ch >= "a" && ch <= "z") ||
              (ch >= "A" && ch <= "Z") ||
              ch === "π"
            );
          }

          while (i < s.length) {
            const ch = s[i];
            if (/\s/.test(ch)) {
              i++;
              continue;
            }
            if (ch === "'" || ch === "’") {
              i++;
              continue; // CH thousands separator
            }

            const mapped =
              ch === "×" || ch === "·"
                ? "*"
                : ch === "÷" || ch === ":"
                  ? "/"
                  : ch === "−"
                    ? "-"
                    : ch;

            if (isDigit(mapped) || mapped === "," || mapped === ".") {
              let num = "";
              let seenDecimal = false;
              let seenDigit = false;
              let seenExp = false;

              while (i < s.length) {
                const raw = s[i];
                if (raw === "'" || raw === "’") {
                  i++;
                  continue;
                }
                let c =
                  raw === "×" || raw === "·"
                    ? "*"
                    : raw === "÷" || raw === ":"
                      ? "/"
                      : raw === "−"
                        ? "-"
                        : raw;

                if (isDigit(c)) {
                  num += c;
                  seenDigit = true;
                  i++;
                  continue;
                }
                if (!seenExp && (c === "," || c === ".")) {
                  if (seenDecimal) break;
                  seenDecimal = true;
                  num += ".";
                  i++;
                  continue;
                }
                if (!seenExp && (c === "E" || c === "e")) {
                  if (!seenDigit) break;
                  seenExp = true;
                  num += "e";
                  i++;
                  if (i < s.length && (s[i] === "+" || s[i] === "-")) {
                    num += s[i];
                    i++;
                  }
                  continue;
                }
                if (seenExp && isDigit(c)) {
                  num += c;
                  i++;
                  continue;
                }
                break;
              }

              // Leading decimal like ",5" or ".5"
              if (num.startsWith(".")) num = "0" + num;
              if (num === "." || num === "0.") {
                throw new Error("Ungültige Zahl.");
              }

              const n = Number(num);
              if (!Number.isFinite(n)) {
                throw new Error("Ungültige Zahl.");
              }
              tokens.push({ type: "number", value: n });
              continue;
            }

            if (isAlpha(mapped)) {
              let ident = "";
              while (i < s.length && isAlpha(s[i])) {
                ident += s[i];
                i++;
              }
              ident = ident.toLowerCase();
              if (ident === "π") ident = "pi";
              if (ident === "pi") {
                tokens.push({ type: "constant", value: Math.PI });
                continue;
              }
              if (ident === "sqrt") {
                tokens.push({ type: "function", value: "sqrt" });
                continue;
              }
              throw new Error(`Unbekannter Bezeichner: ${ident}`);
            }

            if (mapped === "(" || mapped === "[") {
              tokens.push({ type: "lparen" });
              i++;
              continue;
            }
            if (mapped === ")" || mapped === "]") {
              tokens.push({ type: "rparen" });
              i++;
              continue;
            }

            if (["+", "-", "*", "/", "^"].includes(mapped)) {
              tokens.push({ type: "operator", value: mapped });
              i++;
              continue;
            }

            throw new Error(`Ungültiges Zeichen: ${ch}`);
          }

          return tokens;
        }

        function insertImplicitMultiplication(tokens) {
          const out = [];

          function isValueToken(t) {
            return (
              t.type === "number" || t.type === "constant" || t.type === "rparen"
            );
          }

          function startsValue(t) {
            return (
              t.type === "number" ||
              t.type === "constant" ||
              t.type === "function" ||
              t.type === "lparen"
            );
          }

          for (let idx = 0; idx < tokens.length; idx++) {
            const t = tokens[idx];
            const prev = out[out.length - 1];
            if (prev && isValueToken(prev) && startsValue(t)) {
              out.push({ type: "operator", value: "*" });
            }
            out.push(t);
          }
          return out;
        }

        function toRpn(tokens) {
          const output = [];
          const stack = [];
          let prevType = null;

          const ops = {
            "+": { prec: 1, assoc: "L", arity: 2 },
            "-": { prec: 1, assoc: "L", arity: 2 },
            "*": { prec: 2, assoc: "L", arity: 2 },
            "/": { prec: 2, assoc: "L", arity: 2 },
            "^": { prec: 4, assoc: "R", arity: 2 },
            "u-": { prec: 3, assoc: "R", arity: 1 },
          };

          function popOpsWhile(op) {
            while (stack.length) {
              const top = stack[stack.length - 1];
              if (top.type !== "operator") break;
              const a = ops[op];
              const b = ops[top.value];
              if (!a || !b) break;
              const cond =
                (a.assoc === "L" && a.prec <= b.prec) ||
                (a.assoc === "R" && a.prec < b.prec);
              if (!cond) break;
              output.push(stack.pop());
            }
          }

          for (const t of tokens) {
            if (t.type === "number" || t.type === "constant") {
              output.push(t);
              prevType = "value";
              continue;
            }

            if (t.type === "function") {
              stack.push(t);
              prevType = "func";
              continue;
            }

            if (t.type === "lparen") {
              stack.push(t);
              prevType = "lparen";
              continue;
            }

            if (t.type === "rparen") {
              let found = false;
              while (stack.length) {
                const top = stack.pop();
                if (top.type === "lparen") {
                  found = true;
                  break;
                }
                output.push(top);
              }
              if (!found) throw new Error("Klammern passen nicht (zu viele ')').");
              if (stack.length && stack[stack.length - 1].type === "function") {
                output.push(stack.pop());
              }
              prevType = "value";
              continue;
            }

            if (t.type === "operator") {
              let op = t.value;
              const isUnary =
                op === "-" &&
                (prevType === null ||
                  prevType === "op" ||
                  prevType === "lparen" ||
                  prevType === "func");
              if (isUnary) op = "u-";

              popOpsWhile(op);
              stack.push({ type: "operator", value: op });
              prevType = "op";
              continue;
            }

            throw new Error("Ungültiger Ausdruck.");
          }

          while (stack.length) {
            const top = stack.pop();
            if (top.type === "lparen") {
              throw new Error("Klammern passen nicht (')' fehlt).");
            }
            output.push(top);
          }

          return output;
        }

        function evalRpn(rpn) {
          const stack = [];

          for (const t of rpn) {
            if (t.type === "number" || t.type === "constant") {
              stack.push(t.value);
              continue;
            }
            if (t.type === "operator") {
              if (t.value === "u-") {
                if (stack.length < 1) throw new Error("Ungültige Negation.");
                const a = stack.pop();
                stack.push(-a);
                continue;
              }

              if (stack.length < 2) throw new Error("Ungültige Operation.");
              const b = stack.pop();
              const a = stack.pop();
              let res = 0;

              if (t.value === "+") res = a + b;
              else if (t.value === "-") res = a - b;
              else if (t.value === "*") res = a * b;
              else if (t.value === "/") {
                if (b === 0) throw new Error("Division durch 0.");
                res = a / b;
              } else if (t.value === "^") {
                res = Math.pow(a, b);
              } else {
                throw new Error("Unbekannter Operator.");
              }

              if (!Number.isFinite(res)) throw new Error("Resultat ist nicht endlich.");
              stack.push(res);
              continue;
            }

            if (t.type === "function") {
              if (t.value === "sqrt") {
                if (stack.length < 1) throw new Error("sqrt() erwartet ein Argument.");
                const a = stack.pop();
                if (a < 0) throw new Error("sqrt() von negativer Zahl.");
                const res = Math.sqrt(a);
                if (!Number.isFinite(res)) throw new Error("Resultat ist nicht endlich.");
                stack.push(res);
                continue;
              }
              throw new Error("Unbekannte Funktion.");
            }

            throw new Error("Ungültiger Ausdruck.");
          }

          if (stack.length !== 1) {
            throw new Error("Ungültiger Ausdruck (zu viele Werte).");
          }
          return stack[0];
        }

        function evaluateExpression(rawExpr) {
          const expr = String(rawExpr || "").trim();
          if (!expr) throw new Error("Bitte einen Ausdruck eingeben.");
          const tokens = insertImplicitMultiplication(tokenize(expr));
          const rpn = toRpn(tokens);
          return evalRpn(rpn);
        }

        function renderCalcResult(value) {
          if (!calcResult) return;
          calcResult.textContent = value;
        }

        function onCalcEvaluate() {
          if (!calcExpression) return;
          setCalcMessage("", null);

          try {
            const value = evaluateExpression(calcExpression.value);
            lastResult = value;
            renderCalcResult(MAPH.formatCH(value, { maxDecimals: 12, useThousands: true }));
            setCalcMessage("OK", "ok");
          } catch (err) {
            lastResult = null;
            renderCalcResult("—");
            setCalcMessage(err && err.message ? err.message : "Fehler.", "bad");
          } finally {
            updateParensStatus();
            updateMemoryStatus();
          }
        }

        function onCalcClear() {
          if (!calcExpression) return;
          calcExpression.value = "";
          lastResult = null;
          renderCalcResult("—");
          setCalcMessage("", null);
          updateParensStatus();
        }

        function onCalcKey(key) {
          if (!calcExpression) return;

          if (key === "C") {
            onCalcClear();
            return;
          }
          if (key === "BKSP") {
            backspaceAtCursor(calcExpression);
            updateParensStatus();
            return;
          }
          if (key === "=") {
            onCalcEvaluate();
            return;
          }

          if (key === "STO") {
            if (lastResult === null) {
              setCalcMessage("Kein Resultat zum Speichern.", "bad");
              return;
            }
            memoryValue = lastResult;
            updateMemoryStatus();
            setCalcMessage("Gespeichert (STO).", "ok");
            return;
          }

          if (key === "RCL") {
            if (memoryValue === null) {
              setCalcMessage("Speicher ist leer.", "bad");
              return;
            }
            const s = MAPH.formatCH(memoryValue, {
              maxDecimals: 12,
              useThousands: false,
            });
            insertAtCursor(calcExpression, s);
            updateParensStatus();
            return;
          }

          if (key === "RND") {
            if (lastResult === null) {
              setCalcMessage("Kein Resultat zum Runden.", "bad");
              return;
            }
            const asText = MAPH.formatCH(lastResult, {
              maxDecimals: 12,
              useThousands: false,
            });
            const rounded = MAPH.roundHalfUp(asText, 2).rounded;
            const parsed = MAPH.parseLocaleNumber(rounded);
            if (parsed === null) {
              setCalcMessage("Runden fehlgeschlagen.", "bad");
              return;
            }
            lastResult = parsed;
            renderCalcResult(rounded);
            setCalcMessage("Gerundet auf 2 Stellen (RND).", "ok");
            return;
          }

          const map = {
            "×": "×",
            "÷": "÷",
            "+": "+",
            "-": "-",
            "−": "-",
            ",": ",",
            "(": "(",
            ")": ")",
            π: "pi",
            "√": "sqrt(",
            EE: "E",
            "x²": "^2",
            "xʸ": "^",
            "1/x": "^(-1)",
          };

          if (map[key]) {
            insertAtCursor(calcExpression, map[key]);
            updateParensStatus();
            return;
          }

          if (/^\\d$/.test(key)) {
            insertAtCursor(calcExpression, key);
            updateParensStatus();
            return;
          }
        }

        // --- Rundungs-Tool ---
        function ruleLabel(rule) {
          if (rule === "lt5") return "0–4 → bleibt";
          if (rule === "gt5") return "6–9 → +1";
          return "5 → immer +1";
        }

        function runRounding() {
          if (!roundInput || !roundDecimals || !roundOut || !roundMeta) return;
          const decimals = Number(roundDecimals.value);
          if (!String(roundInput.value || "").trim()) {
            roundOut.textContent = "—";
            roundMeta.textContent = "—";
            return;
          }

          try {
            const r = MAPH.roundHalfUp(roundInput.value, decimals);
            roundOut.textContent = r.rounded;
            roundMeta.textContent = `Entscheidende Ziffer: ${r.nextDigit} | Regel: ${ruleLabel(
              r.rule,
            )}`;
          } catch (err) {
            roundOut.textContent = "—";
            roundMeta.textContent =
              err && err.message ? err.message : "Ungültige Eingabe.";
          }
        }

        if (roundRun) roundRun.addEventListener("click", runRounding);
        if (roundInput) roundInput.addEventListener("input", runRounding);
        if (roundDecimals) roundDecimals.addEventListener("change", runRounding);

        // --- Runden-Übungen (1.3.1) ---
        const roundingExercises = [
          { raw: "1,752", expected: "1,75", unit: "" },
          { raw: "0,02345", expected: "0,02", unit: "" },
          { raw: "723,055", expected: "723,06", unit: "" },
          { raw: "0,10082", expected: "0,10", unit: "" },
          { raw: "202,606", expected: "202,61", unit: "" },
          { raw: "0,09999", expected: "0,10", unit: "" },
          { raw: "10,1010", expected: "10,10", unit: "" },
          { raw: "125,898", expected: "125,90", unit: "m" },
          { raw: "0,9999", expected: "1,00", unit: "J" },
          { raw: "13,004", expected: "13,00", unit: "km" },
        ];

        function buildRoundingRow(ex) {
          const tr = document.createElement("tr");

          const given = document.createElement("td");
          given.textContent = ex.unit ? `${ex.raw}${ex.unit}` : ex.raw;

          const answerTd = document.createElement("td");
          const input = document.createElement("input");
          input.className = "input";
          input.type = "text";
          input.inputMode = "decimal";
          input.placeholder = "Dein Resultat";
          answerTd.appendChild(input);

          const actionTd = document.createElement("td");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-secondary";
          btn.textContent = "Prüfen";
          actionTd.appendChild(btn);

          const feedbackTd = document.createElement("td");
          feedbackTd.textContent = "—";

          function check() {
            try {
              const cleaned = String(input.value || "")
                .trim()
                .replace(/[a-zA-Z°µΩ]+$/g, "");
              const got = MAPH.roundHalfUp(cleaned, 2).rounded;
              if (got === ex.expected) {
                feedbackTd.innerHTML = '<span class="ok">OK</span>';
              } else {
                feedbackTd.innerHTML = `<span class="bad">Noch nicht</span> Erwartet: <strong>${ex.expected}</strong>`;
              }
            } catch (err) {
              feedbackTd.innerHTML = `<span class="bad">Fehler</span> ${
                err && err.message ? err.message : "Ungültige Eingabe."
              }`;
            }
          }

          btn.addEventListener("click", check);
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          });

          tr.appendChild(given);
          tr.appendChild(answerTd);
          tr.appendChild(actionTd);
          tr.appendChild(feedbackTd);
          return tr;
        }

        if (roundExercisesTbody) {
          roundingExercises.forEach((ex) => {
            roundExercisesTbody.appendChild(buildRoundingRow(ex));
          });
        }

        // --- Self‑Check Aufgaben (Auswahl aus 1.4.1) ---
        const exercises = [
          {
            id: 1,
            tex: "\\sqrt{19}",
            loadExpr: "sqrt(19)",
            expectedDisplay: "4,36",
            decimals: 2,
            solutionText: "4,36",
          },
          {
            id: 2,
            tex: "\\sqrt{13 + 14}",
            loadExpr: "sqrt(13+14)",
            expectedDisplay: "5,2",
            decimals: 1,
            solutionText: "5,2",
            mistakes: [
              {
                label: "Prioritätsfehler: Klammern unter der Wurzel vergessen.",
                value: Math.sqrt(13) + 14,
              },
            ],
          },
          {
            id: 5,
            tex: "\\frac{1}{7,3^2}",
            loadExpr: "1/(7,3^2)",
            expectedDisplay: "0,0188",
            decimals: 4,
            solutionText: "0,0188",
          },
          {
            id: 6,
            tex: "25 - [7 + (24 - 13,83) - (2,5 + 2,6 + 2,7)]",
            loadExpr: "25-[7+(24-13,83)-(2,5+2,6+2,7)]",
            expectedDisplay: "15,63",
            decimals: 2,
            solutionText: "15,63",
            mistakes: [
              {
                label:
                  "Vorzeichenfehler: Minus-Klammer nicht korrekt berücksichtigt (Klammern vergessen).",
                value: 25 - 7 + (24 - 13.83) - (2.5 + 2.6 + 2.7),
              },
            ],
          },
          {
            id: 9,
            tex: "1 \\cdot 10^{7} + 23 \\cdot 10^{4} + 3,7 \\cdot 10^{3}",
            loadExpr: "1E7+23E4+3,7E3",
            expectedValue: 10233700,
            solutionText:
              "Genau: 10'233'700 (≈ 1,02337·10^7; gerundet: 10,2·10^6)",
            needsEEHint: true,
          },
          {
            id: 10,
            tex: "8,3 \\cdot 10^{-3} + 12 \\cdot 10^{-6} + 236 \\cdot 10^{-4}",
            loadExpr: "8,3E-3+12E-6+236E-4",
            expectedDisplay: "0,0319",
            decimals: 4,
            solutionText: "0,0319",
          },
        ];

        function stripTrailingUnit(raw) {
          return String(raw || "")
            .trim()
            .replace(/[a-zA-Z°µΩ]+$/g, "");
        }

        function buildExerciseCard(ex) {
          const card = document.createElement("div");
          card.className = "result-box";

          const title = document.createElement("div");
          title.className = "result-line";

          const titleLabel = document.createElement("span");
          titleLabel.className = "result-label";
          titleLabel.textContent = `Aufgabe #${ex.id}`;
          title.appendChild(titleLabel);

          const formulaWrap = document.createElement("div");
          formulaWrap.style.marginTop = "8px";

          const formulaSpan = document.createElement("span");
          formulaSpan.setAttribute("data-tex", ex.tex);
          formulaSpan.setAttribute("data-display", "block");
          formulaWrap.appendChild(formulaSpan);

          const actions = document.createElement("div");
          actions.className = "exercise-actions";

          const answerInput = document.createElement("input");
          answerInput.className = "input";
          answerInput.type = "text";
          answerInput.inputMode = "decimal";
          answerInput.placeholder = "Dein Resultat";
          answerInput.setAttribute("aria-label", `Resultat zu Aufgabe #${ex.id}`);

          const checkBtn = document.createElement("button");
          checkBtn.type = "button";
          checkBtn.className = "btn btn-primary";
          checkBtn.textContent = "Prüfen";

          const feedback = document.createElement("div");
          feedback.className = "exercise-feedback";
          feedback.textContent = "—";

          function setFeedbackOk(text) {
            feedback.innerHTML = `<span class="ok">OK</span> ${text || ""}`.trim();
          }

          function setFeedbackBad(text) {
            feedback.innerHTML = `<span class="bad">Noch nicht</span> ${
              text || ""
            }`.trim();
          }

          checkBtn.addEventListener("click", () => {
            const cleaned = stripTrailingUnit(answerInput.value);
            if (!cleaned) {
              setFeedbackBad("Bitte Resultat eingeben.");
              return;
            }

            if (ex.id === 9) {
              const n = MAPH.parseLocaleNumber(cleaned);
              if (n === null) {
                setFeedbackBad("Bitte eine Zahl eingeben.");
                return;
              }
              const diff = Math.abs(n - ex.expectedValue);

              if (diff <= 1e-6) {
                setFeedbackOk(
                  MAPH.formatCH(ex.expectedValue, {
                    maxDecimals: 0,
                    useThousands: true,
                  }),
                );
                return;
              }

              const approx = (Math.round((ex.expectedValue / 1e6) * 10) / 10) * 1e6;
              if (Math.abs(n - approx) <= 1e-6) {
                setFeedbackBad(
                  "Das entspricht einer gerundeten Darstellung (≈ 10,2·10⁶). Genau wäre 10'233'700.",
                );
                return;
              }

              setFeedbackBad(
                `Erwartet: ${MAPH.formatCH(ex.expectedValue, {
                  maxDecimals: 0,
                  useThousands: true,
                })}. Tipp: Nutze EE (wissenschaftliche Notation) für 10^x.`,
              );
              return;
            }

            let actualRounded = "";
            try {
              actualRounded = MAPH.roundHalfUp(cleaned, ex.decimals).rounded;
            } catch (err) {
              setFeedbackBad(err && err.message ? err.message : "Ungültige Eingabe.");
              return;
            }

            if (actualRounded === ex.expectedDisplay) {
              setFeedbackOk(actualRounded);
              return;
            }

            if (Array.isArray(ex.mistakes)) {
              for (const m of ex.mistakes) {
                const mRounded = MAPH.roundHalfUp(
                  MAPH.formatCH(m.value, { maxDecimals: 12, useThousands: false }),
                  ex.decimals,
                ).rounded;
                if (actualRounded === mRounded) {
                  setFeedbackBad(m.label);
                  return;
                }
              }
            }

            setFeedbackBad(`Erwartet: ${ex.expectedDisplay}`);
          });

          answerInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              checkBtn.click();
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

          actions.appendChild(answerInput);
          actions.appendChild(checkBtn);

          card.appendChild(title);
          card.appendChild(formulaWrap);
          card.appendChild(actions);
          card.appendChild(feedback);
          card.appendChild(details);

          return card;
        }

        const exerciseList = document.getElementById("exercise-list");
        if (exerciseList) {
          exercises.forEach((ex) => exerciseList.appendChild(buildExerciseCard(ex)));
        }

        // --- Wiring / Init ---
        if (calcExpression) {
          calcExpression.addEventListener("input", () => {
            updateParensStatus();
            setCalcMessage("", null);
          });

          calcExpression.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCalcEvaluate();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCalcClear();
            }
          });
        }

        if (calcKeys) {
          calcKeys.addEventListener("click", (e) => {
            const btn = e.target && e.target.closest ? e.target.closest("button") : null;
            if (!btn) return;
            const key = btn.getAttribute("data-key");
            if (!key) return;
            onCalcKey(key);
          });
        }

        updateParensStatus();
        updateMemoryStatus();
        MAPH.renderTeX();
        })();
      });
