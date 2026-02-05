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

    // -------------------------
    // Standzeit trend demo
    // -------------------------
    const els = {
      speed: document.getElementById("p-speed"),
      depth: document.getElementById("p-depth"),
      work: document.getElementById("p-work"),
      tool: document.getElementById("p-tool"),
      geo: document.getElementById("p-geo"),
      cool: document.getElementById("p-cool"),
      trendValue: document.getElementById("trend-value"),
      trendHint: document.getElementById("trend-hint"),
    };

    function getValue(sel) {
      return sel ? String(sel.value || "") : "";
    }

    function computeTrend() {
      let score = 50;
      const reasons = [];

      const speed = getValue(els.speed);
      if (speed === "low") {
        score += 15;
        reasons.push("v_c tief → weniger Wärme/Verschleiss");
      } else if (speed === "high") {
        score -= 15;
        reasons.push("v_c hoch → mehr Wärme/Verschleiss");
      }

      const depth = getValue(els.depth);
      if (depth === "low") {
        score += 10;
        reasons.push("Spantiefe klein → geringere Belastung");
      } else if (depth === "high") {
        score -= 10;
        reasons.push("Spantiefe gross → höhere Belastung");
      }

      const work = getValue(els.work);
      if (work === "alu") {
        score += 5;
        reasons.push("Alu → oft gut zerspanbar");
      } else if (work === "inox") {
        score -= 5;
        reasons.push("Edelstahl → zäh, höhere Belastung");
      } else if (work === "hard") {
        score -= 10;
        reasons.push("gehärtet → sehr anspruchsvoll");
      }

      const tool = getValue(els.tool);
      if (tool === "hss") {
        score -= 5;
        reasons.push("HSS → begrenzte Warmhärte");
      } else if (tool === "cer") {
        score += 5;
        reasons.push("Spezial-Schneidstoff → kann Standzeit erhöhen (passend eingesetzt)");
      }

      const geo = getValue(els.geo);
      if (geo === "pos") {
        score += 3;
        reasons.push("positiv → schneidend (geringere Kräfte)");
      } else if (geo === "neg") {
        score -= 3;
        reasons.push("negativ → stabil, aber höhere Kräfte");
      }

      const cool = getValue(els.cool);
      if (cool === "dry") {
        score -= 5;
        reasons.push("trocken → mehr Wärme/Schmierung fehlt");
      } else if (cool === "mql") {
        score += 3;
        reasons.push("MQL → etwas Schmierung");
      } else if (cool === "emul") {
        score += 5;
        reasons.push("KSS → kühlt/schmiert");
      }

      score = Math.max(0, Math.min(100, score));

      let trend = "mittel";
      if (score >= 65) trend = "hoch";
      else if (score <= 44) trend = "tief";

      return { score, trend, reasons };
    }

    function renderTrend() {
      if (!els.trendValue || !els.trendHint) return;
      const { score, trend, reasons } = computeTrend();
      els.trendValue.textContent = trend;

      const top = reasons.slice(0, 3);
      els.trendHint.textContent =
        top.length > 0
          ? `Didaktisch (Score ${score}/100): ${top.join(" · ")}`
          : `Didaktisch (Score ${score}/100): —`;
    }

    [els.speed, els.depth, els.work, els.tool, els.geo, els.cool].forEach((sel) => {
      if (!sel) return;
      sel.addEventListener("change", renderTrend);
    });
    renderTrend();

    // -------------------------
    // Machine groups quiz
    // -------------------------
    const FUNCTION_OPTIONS = [
      { value: "steif", label: "Tragen/Steifen (Stabilität)" },
      { value: "fuehr", label: "Führen (präzise Bewegung)" },
      { value: "spin", label: "Drehen (Rotation)" },
      { value: "antr", label: "Antrieb (Drehmoment/Bewegung erzeugen)" },
      { value: "pos", label: "Positionieren (Werkstück/Tool bewegen)" },
      { value: "cnc", label: "Steuern (CNC, Programme/Achsen)" },
      { value: "kss", label: "Kühlen/Schmieren/Späne abführen" },
    ];

    const machineRows = [
      { name: "Gestell / Maschinenbett", expected: "steif" },
      { name: "Führungen", expected: "fuehr" },
      { name: "Spindel", expected: "spin" },
      { name: "Antriebe (Motor/Getriebe)", expected: "antr" },
      { name: "Tisch / Schlitten (Achsen)", expected: "pos" },
      { name: "Steuerung (CNC)", expected: "cnc" },
      { name: "KSS-/Späne-System", expected: "kss" },
    ];

    function buildMachineRow(row) {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = row.name;

      const selTd = document.createElement("td");
      const sel = buildSelect(FUNCTION_OPTIONS, "Aufgabe …");
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
        setFeedback(fbTd, ok, ok ? "" : "Tipp: Überlege, wofür die Baugruppe primär da ist.");
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

    const machineBody = document.getElementById("machine-rows");
    const machineRowEls = [];
    if (machineBody) {
      machineBody.textContent = "";
      for (const r of machineRows) {
        const tr = buildMachineRow(r);
        machineRowEls.push(tr);
        machineBody.appendChild(tr);
      }
    }

    const machineCheckAll = document.getElementById("machine-check-all");
    const machineSummary = document.getElementById("machine-summary");
    if (machineCheckAll) {
      machineCheckAll.addEventListener("click", () => {
        let ok = 0;
        for (const tr of machineRowEls) if (tr._check()) ok++;
        if (machineSummary) machineSummary.textContent = `Ergebnis: ${ok}/${machineRowEls.length} korrekt.`;
      });
    }

    if (window.MAPH && typeof window.MAPH.typesetTeX === "function") {
      window.MAPH.typesetTeX();
    }
  })();
});

