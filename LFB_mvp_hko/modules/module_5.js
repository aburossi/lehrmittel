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
    // Engineering Tool: cutting data calculator (n)
    // -------------------------
    const calcEls = {
      material: document.getElementById("material-select"),
      vc: document.getElementById("input-vc"),
      d: document.getElementById("input-d"),
      btn: document.getElementById("btn-calc"),
      outN: document.getElementById("val-n"),
      hint: document.getElementById("calc-hint"),
      meta: document.getElementById("calc-meta"),
    };

    function parseLocaleNumber(raw) {
      if (window.MAPH && typeof window.MAPH.parseLocaleNumber === "function") {
        return window.MAPH.parseLocaleNumber(raw);
      }
      const s = String(raw || "").trim().replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }

    function formatCH(value, opts) {
      if (window.MAPH && typeof window.MAPH.formatCH === "function") {
        return window.MAPH.formatCH(value, opts);
      }
      return String(value);
    }

    function setHintText(text, ok) {
      if (!calcEls.hint) return;
      if (!text) {
        calcEls.hint.textContent = "—";
        return;
      }
      calcEls.hint.textContent = text;
      // keep styling via shared .hint color; ok/bad is communicated in text
      void ok;
    }

    function setMetaText(text) {
      if (!calcEls.meta) return;
      calcEls.meta.textContent = text || "—";
    }

    function computeRPM(vc_mMin, d_mm) {
      const d_m = d_mm / 1000;
      return vc_mMin / (Math.PI * d_m);
    }

    function renderRPM() {
      if (!calcEls.outN) return;

      const vc = parseLocaleNumber(calcEls.vc ? calcEls.vc.value : "");
      const d = parseLocaleNumber(calcEls.d ? calcEls.d.value : "");

      if (vc === null || vc <= 0) {
        calcEls.outN.textContent = "—";
        setHintText("Bitte eine gültige Schnittgeschwindigkeit v_c eingeben.", false);
        setMetaText("—");
        return;
      }
      if (d === null || d <= 0) {
        calcEls.outN.textContent = "—";
        setHintText("Bitte einen gültigen Durchmesser d eingeben.", false);
        setMetaText("—");
        return;
      }

      const n = computeRPM(vc, d);
      if (!Number.isFinite(n) || n <= 0) {
        calcEls.outN.textContent = "—";
        setHintText("Resultat ist nicht gültig.", false);
        setMetaText("—");
        return;
      }

      const nRounded =
        window.MAPH && typeof window.MAPH.roundHalfUp === "function"
          ? window.MAPH.roundHalfUp(n, 0)
          : Math.round(n);

      calcEls.outN.textContent = formatCH(nRounded, {
        maxDecimals: 0,
        useThousands: true,
      });
      setHintText("OK", true);
      setMetaText(
        `Eingaben: v_c = ${formatCH(vc, {
          maxDecimals: 3,
          useThousands: false,
        })} m/min · d = ${formatCH(d, { maxDecimals: 3, useThousands: false })} mm`,
      );

      drawStandzeitChart();
    }

    if (calcEls.material && calcEls.vc) {
      calcEls.material.addEventListener("change", () => {
        const raw = String(calcEls.material.value || "").trim();
        if (raw) calcEls.vc.value = raw;
        renderRPM();
      });
    }
    if (calcEls.btn) calcEls.btn.addEventListener("click", renderRPM);
    if (calcEls.vc) {
      calcEls.vc.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          renderRPM();
        }
      });
      calcEls.vc.addEventListener("input", () => drawStandzeitChart());
    }
    if (calcEls.d) {
      calcEls.d.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          renderRPM();
        }
      });
    }

    // -------------------------
    // Engineering Tool: standzeit chart (v_c – T) – no external libs
    // -------------------------
    const chartEls = {
      canvas: document.getElementById("standzeitChart"),
      hint: document.getElementById("chart-hint"),
    };

    function setChartHint(text) {
      if (!chartEls.hint) return;
      chartEls.hint.textContent = text || "—";
    }

    function withHiDpi(canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || canvas.width || 800;
      const cssH = rect.height || canvas.height || 320;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w: cssW, h: cssH };
    }

    function tApproxMinutes(vc) {
      // Didaktisches Modell: T = T0 * (vc0/vc)^p
      const vc0 = 50;
      const T0 = 60;
      const p = 2;
      return T0 * Math.pow(vc0 / vc, p);
    }

    function drawStandzeitChart() {
      const canvas = chartEls.canvas;
      if (!canvas) return;

      const state = withHiDpi(canvas);
      if (!state) return;

      const { ctx, w, h } = state;
      ctx.clearRect(0, 0, w, h);

      const margin = { l: 56, r: 18, t: 18, b: 44 };
      const pw = Math.max(10, w - margin.l - margin.r);
      const ph = Math.max(10, h - margin.t - margin.b);

      const vcMin = 10;
      const vcMax = 200;

      const tMin = tApproxMinutes(vcMax);
      const tMax = tApproxMinutes(vcMin);

      const logMin = Math.log10(tMin);
      const logMax = Math.log10(tMax);

      function xOf(vc) {
        return margin.l + ((vc - vcMin) / (vcMax - vcMin)) * pw;
      }

      function yOf(t) {
        const logT = Math.log10(Math.max(1e-6, t));
        const u = (logMax - logT) / (logMax - logMin);
        return margin.t + u * ph;
      }

      // Axes
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin.l, margin.t);
      ctx.lineTo(margin.l, margin.t + ph);
      ctx.lineTo(margin.l + pw, margin.t + ph);
      ctx.stroke();

      // Grid + ticks (T: 10 / 100 / 1000)
      const yTicks = [10, 100, 1000].filter((v) => v >= tMin * 0.9 && v <= tMax * 1.1);
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      for (const t of yTicks) {
        const y = yOf(t);
        ctx.beginPath();
        ctx.moveTo(margin.l, y);
        ctx.lineTo(margin.l + pw, y);
        ctx.stroke();
        ctx.fillText(`${formatCH(t, { maxDecimals: 0, useThousands: true })} min`, 8, y + 4);
      }

      // x ticks
      const xTicks = [10, 20, 50, 100, 150, 200];
      ctx.strokeStyle = "#e2e8f0";
      for (const vc of xTicks) {
        const x = xOf(vc);
        ctx.beginPath();
        ctx.moveTo(x, margin.t);
        ctx.lineTo(x, margin.t + ph);
        ctx.stroke();
        ctx.fillStyle = "#475569";
        ctx.fillText(`${vc}`, x - 10, margin.t + ph + 22);
      }

      ctx.fillStyle = "#475569";
      ctx.fillText("v_c (m/min)", margin.l + pw - 76, margin.t + ph + 38);
      ctx.save();
      ctx.translate(14, margin.t + 90);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Standzeit T (min, log)", 0, 0);
      ctx.restore();

      // Curve
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const vc = vcMin + (vcMax - vcMin) * (i / steps);
        const t = tApproxMinutes(vc);
        const x = xOf(vc);
        const y = yOf(t);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Marker for current v_c
      const vcCurrent = parseLocaleNumber(calcEls.vc ? calcEls.vc.value : "") || 50;
      const vcClamped = Math.max(vcMin, Math.min(vcMax, vcCurrent));
      const tCurrent = tApproxMinutes(vcClamped);
      const mx = xOf(vcClamped);
      const my = yOf(tCurrent);

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.fillText(
        `v_c=${formatCH(vcClamped, { maxDecimals: 0, useThousands: false })} → T≈${formatCH(tCurrent, {
          maxDecimals: 1,
          useThousands: true,
        })} min`,
        Math.min(margin.l + pw - 220, mx + 10),
        Math.max(margin.t + 16, my - 10),
      );

      setChartHint("Hinweis: Trend-Kurve (didaktisch). In der Praxis hängen Werte von Werkstoff, Werkzeug, Kühlung, Geometrie usw. ab.");
    }

    if (chartEls.canvas) {
      drawStandzeitChart();
      window.addEventListener("resize", () => drawStandzeitChart());
    }

    // Initial render (defaults)
    renderRPM();

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
