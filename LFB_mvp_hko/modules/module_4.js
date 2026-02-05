window.addEventListener("DOMContentLoaded", () => {
  (function () {
    "use strict";

    function setFeedback(el, ok, text) {
      if (!el) return;
      if (ok) {
        el.innerHTML = `<span class="ok">OK</span> ${text || ""}`.trim();
        return;
      }
      el.innerHTML = `<span class="bad">Noch nicht</span> ${text || ""}`.trim();
    }

    function buildSelect(options, placeholder) {
      const sel = document.createElement("select");
      sel.className = "select";

      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = placeholder || "Bitte wählen";
      ph.selected = true;
      sel.appendChild(ph);

      for (const o of options) {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
      }
      return sel;
    }

    const EFFECTS = [
      { value: "cool", label: "Temperatur senken (Brand/Anlauffarben vermeiden)" },
      { value: "lube", label: "Reibung senken (Oberfläche/Standzeit verbessern)" },
      { value: "clean", label: "Späne/Staub abführen (reinigen, Scheibe frei halten)" },
      { value: "protect", label: "Korrosion verhindern (schützen)" },
    ];

    const kssRows = [
      {
        func: "Kühlen",
        expected: "cool",
        hint: "Tipp: Wärme ist beim Schleifen kritisch.",
      },
      {
        func: "Schmieren",
        expected: "lube",
        hint: "Tipp: Schmierung reduziert Reibung.",
      },
      {
        func: "Reinigen / Abführen",
        expected: "clean",
        hint: "Tipp: Späne/Staub wegspülen.",
      },
      {
        func: "Schützen",
        expected: "protect",
        hint: "Tipp: Korrosionsschutz.",
      },
    ];

    function buildKssRow(row) {
      const tr = document.createElement("tr");

      const funcTd = document.createElement("td");
      funcTd.textContent = row.func;

      const selTd = document.createElement("td");
      const sel = buildSelect(EFFECTS, "Wirkung …");
      selTd.appendChild(sel);

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
        const ok = got === row.expected;
        setFeedback(fbTd, ok, ok ? "" : row.hint || "Versuch es nochmals.");
        return ok;
      }

      btn.addEventListener("click", check);
      tr._check = check;

      tr.appendChild(funcTd);
      tr.appendChild(selTd);
      tr.appendChild(actionTd);
      tr.appendChild(fbTd);
      return tr;
    }

    const kssBody = document.getElementById("kss-rows");
    const kssRowEls = [];
    if (kssBody) {
      kssBody.textContent = "";
      for (const r of kssRows) {
        const tr = buildKssRow(r);
        kssRowEls.push(tr);
        kssBody.appendChild(tr);
      }
    }

    const kssCheckAll = document.getElementById("kss-check-all");
    const kssSummary = document.getElementById("kss-summary");
    if (kssCheckAll) {
      kssCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of kssRowEls) if (tr._check()) ok++;
        if (kssSummary) kssSummary.textContent = `Ergebnis: ${ok}/${kssRowEls.length} korrekt.`;
      });
    }

    // -------------------------
    // Scenario cards
    // -------------------------
    const FUNC_OPTIONS = [
      { value: "cool", label: "Kühlen" },
      { value: "lube", label: "Schmieren" },
      { value: "clean", label: "Reinigen/Abführen" },
      { value: "protect", label: "Schützen (Korrosionsschutz)" },
    ];

    const scenarios = [
      {
        id: "S1",
        title: "Szenario 1",
        prompt:
          "Beim Schleifen entstehen Anlauffarben/Brandstellen. Welche Funktion ist am wichtigsten?",
        expected: "cool",
        hint: "Tipp: Temperatur senken.",
        solutionText: "Kühlen: Wärme reduzieren, Brandstellen vermeiden.",
      },
      {
        id: "S2",
        title: "Szenario 2",
        prompt:
          "Die Oberfläche wird rau, es wirkt „trocken“ und reibend. Was hilft als Hauptfunktion?",
        expected: "lube",
        hint: "Tipp: Reibung senken.",
        solutionText: "Schmieren: Reibung senken, Oberfläche verbessern.",
      },
      {
        id: "S3",
        title: "Szenario 3",
        prompt:
          "Die Schleifscheibe setzt zu (Späne/Staub bleiben hängen). Welche Funktion ist zentral?",
        expected: "clean",
        hint: "Tipp: Späne/Staub wegspülen.",
        solutionText: "Reinigen/Abführen: Späne/Schleifstaub wegspülen, Scheibe frei halten.",
      },
      {
        id: "S4",
        title: "Szenario 4",
        prompt:
          "Werkstücke werden nach der Bearbeitung gelagert und rosten leicht. Welche Funktion ist wichtig?",
        expected: "protect",
        hint: "Tipp: Schutzfilm / Korrosion.",
        solutionText: "Schützen: Korrosionsschutz für Werkstück/Maschine.",
      },
    ];

    function buildScenarioCard(s) {
      const card = document.createElement("div");
      card.className = "exercise-card";

      const h3 = document.createElement("h3");
      h3.className = "exercise-title";
      h3.textContent = s.title;

      const p = document.createElement("p");
      p.textContent = s.prompt;

      const actions = document.createElement("div");
      actions.className = "exercise-actions";

      const sel = buildSelect(FUNC_OPTIONS, "Auswählen …");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = "Prüfen";

      const feedback = document.createElement("div");
      feedback.className = "exercise-feedback";
      feedback.textContent = "—";

      function check() {
        const got = String(sel.value || "");
        if (!got) {
          setFeedback(feedback, false, "Bitte auswählen.");
          return;
        }
        const ok = got === s.expected;
        setFeedback(feedback, ok, ok ? "" : s.hint || "Versuch es nochmals.");
      }

      btn.addEventListener("click", check);

      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Lösung anzeigen";
      const sol = document.createElement("div");
      sol.style.marginTop = "8px";
      sol.textContent = s.solutionText || "";
      details.appendChild(summary);
      details.appendChild(sol);

      actions.appendChild(sel);
      actions.appendChild(btn);

      card.appendChild(h3);
      card.appendChild(p);
      card.appendChild(actions);
      card.appendChild(feedback);
      card.appendChild(details);
      return card;
    }

    const scenarioList = document.getElementById("scenario-list");
    if (scenarioList) {
      for (const s of scenarios) {
        scenarioList.appendChild(buildScenarioCard(s));
      }
    }

    if (window.MAPH && typeof window.MAPH.typesetTeX === "function") {
      window.MAPH.typesetTeX();
    }
  })();
});

