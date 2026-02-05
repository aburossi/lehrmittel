window.addEventListener("DOMContentLoaded", () => {
  (function () {
    "use strict";

    function canonicalizeAnswer(raw) {
      let s = String(raw || "")
        .replace(/\u00A0/g, " ")
        .replace(/[\u2019\u2018]/g, "'")
        .trim();
      if (!s) return "";

      s = s.replace(/\s+/g, "");

      // Decimal separator: use comma if only dot is present.
      if (s.includes(".") && !s.includes(",")) s = s.replace(/\./g, ",");

      // Normalize TeX remnants.
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

    function stripTrailingNonNumber(raw) {
      return String(raw || "")
        .trim()
        .replace(/[\s]+/g, "")
        .replace(/[^0-9.,+\-eE]+$/g, "");
    }

    function buildSelect(options, placeholder) {
      const sel = document.createElement("select");
      sel.className = "select";

      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = placeholder || "Bitte wählen";
      ph.selected = true;
      sel.appendChild(ph);

      options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
      });

      return sel;
    }

    // -------------------------
    // Quiz: angles
    // -------------------------
    const ANGLE_OPTIONS = [
      { value: "frei", label: "Freiwinkel (α)" },
      { value: "keil", label: "Keilwinkel (β)" },
      { value: "span", label: "Spanwinkel (γ)" },
    ];

    const angleRows = [
      {
        id: "a1",
        prompt:
          "Winkel, der Reiben an der Werkstückoberfläche verhindert (zwischen Freifläche und Oberfläche).",
        expected: "frei",
        hint: "Tipp: α steht bei der Freifläche.",
      },
      {
        id: "a2",
        prompt:
          "Winkel des Werkzeugkeils (zwischen Spanfläche und Freifläche).",
        expected: "keil",
        hint: "Tipp: β beschreibt den Keil.",
      },
      {
        id: "a3",
        prompt:
          "Winkel, der die Spanbildung beeinflusst (Spanfläche relativ zur Bezugsfläche).",
        expected: "span",
        hint: "Tipp: γ steht bei der Spanfläche.",
      },
    ];

    function buildMatchingTable(tbodyId, rows, options) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return { rowEls: [] };

      const rowEls = [];
      tbody.textContent = "";

      for (const r of rows) {
        const tr = document.createElement("tr");

        const promptTd = document.createElement("td");
        promptTd.textContent = r.prompt;

        const selectTd = document.createElement("td");
        const sel = buildSelect(options, "Auswählen …");
        selectTd.appendChild(sel);

        const actionTd = document.createElement("td");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-primary";
        btn.textContent = "Prüfen";
        actionTd.appendChild(btn);

        const fbTd = document.createElement("td");
        fbTd.className = "exercise-feedback";
        fbTd.style.marginTop = "0";
        fbTd.textContent = "—";

        function check() {
          const got = String(sel.value || "");
          if (!got) {
            setFeedback(fbTd, false, "Bitte auswählen.");
            return false;
          }
          const ok = got === r.expected;
          setFeedback(fbTd, ok, ok ? "" : r.hint || "Versuch es nochmals.");
          return ok;
        }

        btn.addEventListener("click", check);
        sel.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            check();
          }
        });

        tr.appendChild(promptTd);
        tr.appendChild(selectTd);
        tr.appendChild(actionTd);
        tr.appendChild(fbTd);
        tr._check = check;

        rowEls.push(tr);
        tbody.appendChild(tr);
      }

      return { rowEls };
    }

    const angleTable = buildMatchingTable("angle-quiz", angleRows, ANGLE_OPTIONS);

    const angleCheckAll = document.getElementById("angle-check-all");
    const angleSummary = document.getElementById("angle-summary");
    if (angleCheckAll) {
      angleCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of angleTable.rowEls) if (tr._check()) ok++;
        if (angleSummary) angleSummary.textContent = `Ergebnis: ${ok}/${angleTable.rowEls.length} korrekt.`;
      });
    }

    // -------------------------
    // Quiz: surfaces
    // -------------------------
    const SURFACE_OPTIONS = [
      { value: "spanflaeche", label: "Spanfläche" },
      { value: "freiflaeche", label: "Freifläche" },
      { value: "schneide", label: "Schneide" },
    ];

    const surfaceRows = [
      {
        id: "s1",
        prompt: "Fläche, auf der der Span abgleitet.",
        expected: "spanflaeche",
        hint: "Tipp: Der Span läuft über die Spanfläche.",
      },
      {
        id: "s2",
        prompt: "Fläche, die der Werkstückoberfläche zugewandt ist (soll nicht reiben).",
        expected: "freiflaeche",
        hint: "Tipp: Diese Fläche braucht Freiwinkel.",
      },
      {
        id: "s3",
        prompt: "Linie/Kante, wo Span- und Freifläche zusammentreffen.",
        expected: "schneide",
        hint: "Tipp: Hier „schneidet“ das Werkzeug.",
      },
    ];

    const surfaceTable = buildMatchingTable(
      "surface-quiz",
      surfaceRows,
      SURFACE_OPTIONS,
    );

    const surfaceCheckAll = document.getElementById("surface-check-all");
    const surfaceSummary = document.getElementById("surface-summary");
    if (surfaceCheckAll) {
      surfaceCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of surfaceTable.rowEls) if (tr._check()) ok++;
        if (surfaceSummary) surfaceSummary.textContent = `Ergebnis: ${ok}/${surfaceTable.rowEls.length} korrekt.`;
      });
    }

    // -------------------------
    // Self-check cards
    // -------------------------
    const exercises = [
      {
        id: "1",
        title: "Keilwinkel berechnen",
        tex: "\\alpha = 8^\\circ,\\; \\gamma = 12^\\circ,\\; \\beta = ?",
        expectedNumber: 70,
        hint: "Tipp: β = 90° − α − γ.",
        solutionText: "β = 90° − 8° − 12° = 70°",
      },
      {
        id: "2",
        title: "Freiwinkel berechnen",
        tex: "\\beta = 75^\\circ,\\; \\gamma = 10^\\circ,\\; \\alpha = ?",
        expectedNumber: 5,
        hint: "Tipp: α = 90° − β − γ.",
        solutionText: "α = 90° − 75° − 10° = 5°",
      },
      {
        id: "3",
        title: "Spanwinkel berechnen",
        tex: "\\alpha = 6^\\circ,\\; \\beta = 80^\\circ,\\; \\gamma = ?",
        expectedNumber: 4,
        hint: "Tipp: γ = 90° − α − β.",
        solutionText: "γ = 90° − 6° − 80° = 4°",
      },
      {
        id: "4",
        title: "Begriff erkennen",
        prompt:
          "Wie heisst die Fläche, auf der der Span abgleitet?",
        expectedText: "Spanfläche",
        accepted: ["spanflaeche", "spanfläche"],
        hint: "Tipp: Der Span läuft über die Spanfläche.",
        solutionText: "Spanfläche",
      },
      {
        id: "5",
        title: "Begriff erkennen",
        prompt:
          "Wie heisst der Winkel, der Reiben an der Werkstückoberfläche verhindert?",
        expectedText: "Freiwinkel",
        accepted: ["freiwinkel", "α", "alpha"],
        hint: "Tipp: Das ist α (Freiwinkel).",
        solutionText: "Freiwinkel (α)",
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
      input.placeholder = ex.expectedNumber !== undefined ? "Dein Resultat (z.B. 70°)" : "Deine Antwort";

      const checkBtn = document.createElement("button");
      checkBtn.className = "btn btn-primary";
      checkBtn.type = "button";
      checkBtn.textContent = "Prüfen";

      const feedback = document.createElement("div");
      feedback.className = "exercise-feedback";
      feedback.textContent = "—";

      function check() {
        const raw = input.value;
        if (!String(raw || "").trim()) {
          setFeedback(feedback, false, "Bitte etwas eingeben.");
          return;
        }

        if (ex.expectedNumber !== undefined) {
          const cleaned = stripTrailingNonNumber(raw);
          const n = window.MAPH && window.MAPH.parseLocaleNumber
            ? window.MAPH.parseLocaleNumber(cleaned)
            : Number(cleaned);
          if (n === null || !Number.isFinite(n)) {
            setFeedback(feedback, false, "Bitte eine Zahl eingeben.");
            return;
          }
          const ok = Math.abs(n - ex.expectedNumber) <= 1e-9;
          setFeedback(feedback, ok, ok ? "" : ex.hint || "Versuch es nochmals.");
          return;
        }

        const got = canonicalizeAnswer(raw).toLowerCase();
        const accepted = (ex.accepted || [ex.expectedText || ""])
          .map((x) => canonicalizeAnswer(x).toLowerCase());
        const ok = accepted.includes(got);
        setFeedback(feedback, ok, ok ? "" : ex.hint || "Versuch es nochmals.");
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
      sol.textContent = ex.solutionText || "";
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

    if (window.MAPH && typeof window.MAPH.typesetTeX === "function") {
      window.MAPH.typesetTeX();
    }
  })();
});

