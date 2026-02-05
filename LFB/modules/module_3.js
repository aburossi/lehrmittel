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

    function buildProcessRow(row, principleOptions, appOptions) {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = row.name;

      const principleTd = document.createElement("td");
      const principleSel = buildSelect(principleOptions, "Prinzip …");
      principleTd.appendChild(principleSel);

      const appTd = document.createElement("td");
      const appSel = buildSelect(appOptions, "Anwendung …");
      appTd.appendChild(appSel);

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
        const p = String(principleSel.value || "");
        const a = String(appSel.value || "");
        if (!p || !a) {
          setFeedback(fbTd, false, "Bitte beide Felder auswählen.");
          return false;
        }
        const ok = p === row.expectedPrinciple && a === row.expectedApp;
        setFeedback(fbTd, ok, ok ? "" : row.hint || "Tipp: Prinzip & Anwendung nochmals prüfen.");
        return ok;
      }

      btn.addEventListener("click", check);
      tr._check = check;

      tr.appendChild(nameTd);
      tr.appendChild(principleTd);
      tr.appendChild(appTd);
      tr.appendChild(actionTd);
      tr.appendChild(fbTd);
      return tr;
    }

    const PRINCIPLES = [
      { value: "brennen", label: "Brennen (Oxidation + O₂)" },
      { value: "schmelzen", label: "Schmelzen + Ausblasen" },
      { value: "abrasion", label: "Abrasion (Wasser + Abrasiv)" },
      { value: "erosion", label: "Erosion (Funkenerosion)" },
    ];

    const APPLICATIONS = [
      { value: "stahl_dick", label: "dickes Stahlblech / Baustahl" },
      { value: "metall_schnell", label: "Metalle (leitfähig), schnell/produktiver Schnitt" },
      { value: "blech_praezise", label: "präzise Konturen in Blech (kleine Schnittfuge)" },
      { value: "kalt_sensibel", label: "kalt schneiden (hitzeempfindlich/Verbund)" },
      { value: "kavitaet", label: "Werkzeugbau: Kavitäten/3D-Formen" },
      { value: "draht_kontur", label: "Werkzeugbau: Konturschnitt mit Draht" },
    ];

    const rows = [
      {
        name: "Autogenes Brennschneiden",
        expectedPrinciple: "brennen",
        expectedApp: "stahl_dick",
        hint: "Tipp: Brennschneiden = Oxidation, oft für dicke Stähle.",
      },
      {
        name: "Plasmaschneiden",
        expectedPrinciple: "schmelzen",
        expectedApp: "metall_schnell",
        hint: "Tipp: Plasma schmilzt und bläst aus (leitfähige Metalle).",
      },
      {
        name: "Laserstrahlschmelzschneiden",
        expectedPrinciple: "schmelzen",
        expectedApp: "blech_praezise",
        hint: "Tipp: Laser schmilzt – präzise Konturen in Blech.",
      },
      {
        name: "Laserstrahlbrennschneiden",
        expectedPrinciple: "brennen",
        expectedApp: "stahl_dick",
        hint: "Tipp: Mit O₂-Unterstützung (Brennen) – oft Stahl.",
      },
      {
        name: "Wasserstrahlschneiden",
        expectedPrinciple: "abrasion",
        expectedApp: "kalt_sensibel",
        hint: "Tipp: Kalt schneiden – keine/kaum WEZ.",
      },
      {
        name: "Senkerosion",
        expectedPrinciple: "erosion",
        expectedApp: "kavitaet",
        hint: "Tipp: Erosion für Kavitäten/Formen, leitfähige Werkstoffe.",
      },
      {
        name: "Schneiderosion (Drahterodieren)",
        expectedPrinciple: "erosion",
        expectedApp: "draht_kontur",
        hint: "Tipp: Draht erzeugt sehr genaue Konturen (Werkzeugbau).",
      },
    ];

    const processBody = document.getElementById("process-rows");
    const processRowEls = [];
    if (processBody) {
      processBody.textContent = "";
      for (const r of rows) {
        const tr = buildProcessRow(r, PRINCIPLES, APPLICATIONS);
        processRowEls.push(tr);
        processBody.appendChild(tr);
      }
    }

    const processCheckAll = document.getElementById("process-check-all");
    const processSummary = document.getElementById("process-summary");
    if (processCheckAll) {
      processCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of processRowEls) if (tr._check()) ok++;
        if (processSummary) processSummary.textContent = `Ergebnis: ${ok}/${processRowEls.length} korrekt.`;
      });
    }

    // -------------------------
    // Classification mini-check
    // -------------------------
    const CATEGORIES = [
      { value: "thermisch", label: "Thermisch" },
      { value: "strahl", label: "Strahl (kalt)" },
      { value: "erosion", label: "Erosion" },
    ];

    const classRows = [
      { name: "Autogenes Brennschneiden", expected: "thermisch" },
      { name: "Plasmaschneiden", expected: "thermisch" },
      { name: "Laser (Schmelz-/Brennschneiden)", expected: "thermisch" },
      { name: "Wasserstrahlschneiden", expected: "strahl" },
      { name: "Senk-/Schneiderosion", expected: "erosion" },
    ];

    function buildClassRow(row) {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = row.name;

      const selTd = document.createElement("td");
      const sel = buildSelect(CATEGORIES, "Kategorie …");
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
        setFeedback(fbTd, ok, ok ? "" : "Tipp: Thermisch vs. kalt vs. Erosion.");
        return ok;
      }

      btn.addEventListener("click", check);
      tr._check = check;

      tr.appendChild(nameTd);
      tr.appendChild(selTd);
      tr.appendChild(actionTd);
      tr.appendChild(fbTd);
      return tr;
    }

    const classBody = document.getElementById("class-rows");
    const classRowEls = [];
    if (classBody) {
      classBody.textContent = "";
      for (const r of classRows) {
        const tr = buildClassRow(r);
        classRowEls.push(tr);
        classBody.appendChild(tr);
      }
    }

    const classCheckAll = document.getElementById("class-check-all");
    const classSummary = document.getElementById("class-summary");
    if (classCheckAll) {
      classCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of classRowEls) if (tr._check()) ok++;
        if (classSummary) classSummary.textContent = `Ergebnis: ${ok}/${classRowEls.length} korrekt.`;
      });
    }

    if (window.MAPH && typeof window.MAPH.typesetTeX === "function") {
      window.MAPH.typesetTeX();
    }
  })();
});

