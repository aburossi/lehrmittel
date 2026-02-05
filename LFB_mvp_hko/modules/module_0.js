window.addEventListener("DOMContentLoaded", () => {
  (function () {
    "use strict";

    const MAPH = window.MAPH;

    function setHint(el, text, kind) {
      if (!el) return;
      el.textContent = text || "—";
      el.classList.remove("hint--ok", "hint--bad");
      if (kind === "ok") el.classList.add("hint--ok");
      if (kind === "bad") el.classList.add("hint--bad");
    }

    // -------------------------
    // Unit converter (mm/cm/m)
    // -------------------------
    const UNIT_FACTORS = {
      mm: 1e-3,
      cm: 1e-2,
      m: 1,
    };

    const conv = {
      value: document.getElementById("conv-value"),
      from: document.getElementById("conv-from"),
      to: document.getElementById("conv-to"),
      run: document.getElementById("conv-run"),
      swap: document.getElementById("conv-swap"),
      out: document.getElementById("conv-out"),
      hint: document.getElementById("conv-hint"),
    };

    function convertUnits() {
      if (!conv.out || !conv.hint) return;

      const raw = conv.value ? conv.value.value : "";
      const n =
        MAPH && typeof MAPH.parseLocaleNumber === "function"
          ? MAPH.parseLocaleNumber(raw)
          : Number(String(raw || "").replace(",", "."));

      if (n === null || !Number.isFinite(n)) {
        conv.out.textContent = "—";
        setHint(conv.hint, "Bitte eine Zahl eingeben.", "bad");
        return;
      }

      const fromU = conv.from ? String(conv.from.value || "") : "mm";
      const toU = conv.to ? String(conv.to.value || "") : "m";
      const fromF = UNIT_FACTORS[fromU];
      const toF = UNIT_FACTORS[toU];
      if (!fromF || !toF) {
        conv.out.textContent = "—";
        setHint(conv.hint, "Ungültige Einheit.", "bad");
        return;
      }

      const valueM = n * fromF;
      const valueTo = valueM / toF;
      const display =
        MAPH && typeof MAPH.formatCH === "function"
          ? MAPH.formatCH(valueTo, { maxDecimals: 12, useThousands: true })
          : String(valueTo);

      conv.out.textContent = `${display} ${toU}`;
      setHint(conv.hint, `${MAPH ? "CH-Format ok." : ""} Tipp: Dezimalpunkt verschieben.`, "ok");
    }

    function swapUnits() {
      if (!conv.from || !conv.to) return;
      const a = conv.from.value;
      conv.from.value = conv.to.value;
      conv.to.value = a;
      convertUnits();
    }

    if (conv.run) conv.run.addEventListener("click", convertUnits);
    if (conv.swap) conv.swap.addEventListener("click", swapUnits);
    if (conv.value) {
      conv.value.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          convertUnits();
        }
      });
    }

    // -------------------------
    // Expression evaluator (safe subset)
    // Copied core from modules/module_1.js (MAPH MVP)
    // -------------------------
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
        return t.type === "number" || t.type === "constant" || t.type === "rparen";
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

    const expr = {
      input: document.getElementById("expr-input"),
      run: document.getElementById("expr-run"),
      clear: document.getElementById("expr-clear"),
      out: document.getElementById("expr-out"),
      msg: document.getElementById("expr-msg"),
    };

    function runExpression() {
      if (!expr.out || !expr.msg) return;
      try {
        const value = evaluateExpression(expr.input ? expr.input.value : "");
        const display =
          MAPH && typeof MAPH.formatCH === "function"
            ? MAPH.formatCH(value, { maxDecimals: 12, useThousands: true })
            : String(value);
        expr.out.textContent = display;
        setHint(expr.msg, "OK", "ok");
      } catch (err) {
        expr.out.textContent = "—";
        setHint(expr.msg, err && err.message ? err.message : "Fehler.", "bad");
      }
    }

    function clearExpression() {
      if (expr.input) expr.input.value = "";
      if (expr.out) expr.out.textContent = "—";
      if (expr.msg) setHint(expr.msg, "—", null);
    }

    if (expr.run) expr.run.addEventListener("click", runExpression);
    if (expr.clear) expr.clear.addEventListener("click", clearExpression);
    if (expr.input) {
      expr.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runExpression();
        }
      });
    }

    // -------------------------
    // Mini self-check cards
    // -------------------------
    function setFeedback(el, ok, text) {
      if (!el) return;
      if (ok) {
        el.innerHTML = `<span class="ok">OK</span> ${text || ""}`.trim();
        return;
      }
      el.innerHTML = `<span class="bad">Noch nicht</span> ${text || ""}`.trim();
    }

    function canonicalizeAnswer(raw) {
      let s = String(raw || "")
        .replace(/\u00A0/g, " ")
        .replace(/[\u2019\u2018]/g, "'")
        .trim();
      if (!s) return "";
      s = s.replace(/\s+/g, "");
      s = s.replace(/'/g, "");
      if (s.includes(".") && !s.includes(",")) s = s.replace(/\./g, ",");
      s = s.replace(/[−–—]/g, "-");
      return s;
    }

    const exercises = [
      {
        id: "1",
        title: "mm → m",
        tex: "2500\\,\\mathrm{mm} = ?\\,\\mathrm{m}",
        expected: "2,5m",
        hint: "Tipp: 1000 mm = 1 m.",
        solutionText: "2500 mm = 2,5 m",
      },
      {
        id: "2",
        title: "m → mm",
        tex: "0,75\\,\\mathrm{m} = ?\\,\\mathrm{mm}",
        expected: "750mm",
        hint: "Tipp: 1 m = 1000 mm.",
        solutionText: "0,75 m = 750 mm",
      },
      {
        id: "3",
        title: "Klammern korrekt",
        tex: "25-[7+(24-13,83)-(2,5+2,6+2,7)] = ?",
        expected: "15,63",
        hint: "Tipp: Achte auf die Minus-Klammer.",
        solutionText: "Resultat: 15,63",
      },
      {
        id: "4",
        title: "EE / Exponent",
        tex: "1\\cdot 10^{7} + 23\\cdot 10^{4} = ?",
        expected: "10230000",
        hint: "Tipp: 23·10^4 = 230'000.",
        solutionText: "10'230'000",
      },
    ];

    function buildExerciseCard(ex) {
      const card = document.createElement("div");
      card.className = "exercise-card";

      const title = document.createElement("h3");
      title.className = "exercise-title";
      title.textContent = `Aufgabe ${ex.id} – ${ex.title}`;

      const tex = document.createElement("div");
      tex.setAttribute("data-tex", ex.tex);
      tex.setAttribute("data-display", "block");

      const actions = document.createElement("div");
      actions.className = "exercise-actions";

      const input = document.createElement("input");
      input.className = "input";
      input.type = "text";
      input.placeholder = "Dein Resultat (mit Einheit, z.B. 2,5 m)";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = "Prüfen";

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
        const ok = got === exp;
        setFeedback(feedback, ok, ok ? "" : ex.hint || "Versuch es nochmals.");
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
      sol.textContent = ex.solutionText || "";
      details.appendChild(summary);
      details.appendChild(sol);

      actions.appendChild(input);
      actions.appendChild(btn);

      card.appendChild(title);
      card.appendChild(tex);
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

    if (MAPH && typeof MAPH.typesetTeX === "function") {
      MAPH.typesetTeX();
    }
  })();
});
