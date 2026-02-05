window.addEventListener("DOMContentLoaded", () => {
        "use strict";

        const M = window.MAPH || {};

        const VC_TABLE = {
          "meta": { "source": "PLACEHOLDER", "units": { "vc": "m/min" } },
          "materials": [
            {
              "id": "stahl_unlegiert",
              "label": "Stahl (unlegiert)",
              "tools": [
                { "id": "hm", "label": "HM (Hartmetall)", "vc": 180 },
                { "id": "hss", "label": "HSS", "vc": 30 }
              ]
            },
            {
              "id": "stahl_rostfrei",
              "label": "Stahl (rostfrei)",
              "tools": [
                { "id": "hm", "label": "HM (Hartmetall)", "vc": 140 },
                { "id": "hss", "label": "HSS", "vc": 25 }
              ]
            },
            {
              "id": "alu",
              "label": "Aluminium",
              "tools": [
                { "id": "hm", "label": "HM (Hartmetall)", "vc": 300 },
                { "id": "hss", "label": "HSS", "vc": 80 }
              ]
            },
            {
              "id": "messing",
              "label": "Messing",
              "tools": [
                { "id": "hm", "label": "HM (Hartmetall)", "vc": 220 },
                { "id": "hss", "label": "HSS", "vc": 60 }
              ]
            }
          ]
        };

        function parse(raw) {
          if (M && typeof M.parseLocaleNumber === "function") {
            return M.parseLocaleNumber(raw);
          }
          const s = String(raw || "")
            .trim()
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, "")
            .replace(/[\u2019\u2018]/g, "'")
            .replace(/[']/g, "")
            .replace(",", ".");
          const n = Number(s);
          return Number.isFinite(n) ? n : null;
        }

        function format(value, opts) {
          if (M && typeof M.formatCH === "function") return M.formatCH(value, opts);
          if (typeof value !== "number" || !Number.isFinite(value)) return "—";
          return String(value);
        }

        function extractFirstNumber(raw) {
          const s = String(raw || "").replace(/\u00A0/g, " ");
          const m = s.match(/[-+]?\d[\d'’.,]*(?:[eE][-+]?\d+)?/);
          return m ? m[0] : null;
        }

        function clamp(x, a, b) {
          return Math.max(a, Math.min(b, x));
        }

        function toMeters(lengthValue, unit) {
          if (unit === "mm") return lengthValue / 1000;
          if (unit === "cm") return lengthValue / 100;
          return lengthValue;
        }

        function toPerSecond(nValue, unit) {
          if (unit === "perMin") return nValue / 60;
          return nValue;
        }

        function toMetersPerSecond(vValue, unit) {
          if (unit === "mPerS") return vValue;
          if (unit === "mPerMin") return vValue / 60;
          if (unit === "kmPerH") return (vValue * 1000) / 3600;
          if (unit === "mmPerMin") return (vValue / 1000) / 60;
          return vValue;
        }

        function mpsToKmh(v) {
          return v * 3.6;
        }

        function mpsToMpm(v) {
          return v * 60;
        }

        function perSToPerMin(n) {
          return n * 60;
        }

        function roundHalfUp(raw, decimals) {
          if (M && typeof M.roundHalfUp === "function") return M.roundHalfUp(raw, decimals);
          const places = typeof decimals === "number" ? Math.max(0, Math.floor(decimals)) : 2;
          const n = parse(raw);
          if (n === null) throw new Error("Bitte eine Zahl eingeben.");
          const p = Math.pow(10, places);
          const r = Math.round(n * p) / p;
          const rounded = places > 0 ? r.toFixed(places).replace(".", ",") : String(Math.round(r));
          return { rounded, rule: "gt5", nextDigit: "0" };
        }

        // KaTeX note + TeX rendering
        const katexNote = document.getElementById("katex-note");
        if (katexNote && !(window.katex && typeof window.katex.render === "function")) {
          katexNote.hidden = false;
        }
        if (M && typeof M.renderTeX === "function") {
          M.renderTeX();
        }

        // --- Tool 1: n = N / t ---
        const elsN = {
          N: document.getElementById("nN"),
          t: document.getElementById("nt"),
          tUnit: document.getElementById("ntUnit"),
          out: document.getElementById("nOut"),
          btn: document.getElementById("btnCalcN"),
          reset: document.getElementById("btnResetN"),
        };

        function calcN() {
          const nTurns = parse(extractFirstNumber(elsN.N && elsN.N.value));
          const tVal = parse(extractFirstNumber(elsN.t && elsN.t.value));
          const tUnit = elsN.tUnit ? elsN.tUnit.value : "s";

          if (
            nTurns === null ||
            tVal === null ||
            !Number.isFinite(nTurns) ||
            !Number.isFinite(tVal) ||
            tVal <= 0
          ) {
            if (elsN.out) elsN.out.textContent = "—";
            return;
          }

          const tSeconds = tUnit === "min" ? tVal * 60 : tVal;
          const nPerS = nTurns / tSeconds;
          const nPerMin = nPerS * 60;

          if (elsN.out) {
            elsN.out.textContent = `${format(nPerS, { maxDecimals: 6, useThousands: false })} 1/s  •  ${format(
              nPerMin,
              { maxDecimals: 2, useThousands: true },
            )} 1/min`;
          }
        }

        if (elsN.btn) elsN.btn.addEventListener("click", calcN);
        if (elsN.reset) {
          elsN.reset.addEventListener("click", () => {
            if (elsN.N) elsN.N.value = "";
            if (elsN.t) elsN.t.value = "";
            if (elsN.tUnit) elsN.tUnit.value = "s";
            if (elsN.out) elsN.out.textContent = "—";
          });
        }

        // --- Tool 2: v_u / n / d ---
        const elsVu = {
          modeVu: document.getElementById("solveVu"),
          modeN: document.getElementById("solveN"),
          modeD: document.getElementById("solveD"),
          d: document.getElementById("vuD"),
          dUnit: document.getElementById("vuDUnit"),
          n: document.getElementById("vuN"),
          nUnit: document.getElementById("vuNUnit"),
          v: document.getElementById("vuV"),
          vUnit: document.getElementById("vuVUnit"),
          round: document.getElementById("vuRound"),
          out: document.getElementById("vuOut"),
          out2: document.getElementById("vuOut2"),
          btn: document.getElementById("btnCalcVu"),
          reset: document.getElementById("btnResetVu"),
        };

        function currentSolveMode() {
          if (elsVu.modeN && elsVu.modeN.checked) return "n";
          if (elsVu.modeD && elsVu.modeD.checked) return "d";
          return "vu";
        }

        function applySolveModeUI() {
          const mode = currentSolveMode();
          const disable = (el, on) => {
            if (!el) return;
            el.disabled = !!on;
          };

          disable(elsVu.v, mode === "vu");
          disable(elsVu.vUnit, mode === "vu");
          disable(elsVu.n, mode === "n");
          disable(elsVu.nUnit, mode === "n");
          disable(elsVu.d, mode === "d");
          disable(elsVu.dUnit, mode === "d");
        }

        function calcVu() {
          const mode = currentSolveMode();
          const dec = elsVu.round && elsVu.round.value !== "" ? Number(elsVu.round.value) : null;

          const dVal = parse(extractFirstNumber(elsVu.d && elsVu.d.value));
          const nVal = parse(extractFirstNumber(elsVu.n && elsVu.n.value));
          const vVal = parse(extractFirstNumber(elsVu.v && elsVu.v.value));

          const dUnit = elsVu.dUnit ? elsVu.dUnit.value : "mm";
          const nUnit = elsVu.nUnit ? elsVu.nUnit.value : "perMin";
          const vUnit = elsVu.vUnit ? elsVu.vUnit.value : "mPerMin";

          try {
            if (mode === "vu") {
              if (dVal === null || nVal === null) throw new Error("Bitte d und n eingeben.");
              const dM = toMeters(dVal, dUnit);
              const nPerS = toPerSecond(nVal, nUnit);
              const vu = dM * Math.PI * nPerS; // m/s

              const vuRounded = dec === null ? vu : parse(roundHalfUp(String(vu), dec).rounded);
              const vuShow = vuRounded === null ? vu : vuRounded;

              if (elsVu.out) {
                elsVu.out.textContent = `${format(vuShow, { maxDecimals: dec === null ? 6 : dec })} m/s`;
              }
              if (elsVu.out2) {
                elsVu.out2.textContent = `${format(mpsToKmh(vuShow), { maxDecimals: 3 })} km/h  •  ${format(
                  mpsToMpm(vuShow),
                  { maxDecimals: 2, useThousands: true },
                )} m/min`;
              }
              return;
            }

            if (mode === "n") {
              if (vVal === null || dVal === null) throw new Error("Bitte v und d eingeben.");
              const vMps = toMetersPerSecond(vVal, vUnit);
              const dM = toMeters(dVal, dUnit);
              if (dM <= 0) throw new Error("d muss > 0 sein.");
              const nPerS = vMps / (Math.PI * dM);

              const nRounded = dec === null ? nPerS : parse(roundHalfUp(String(nPerS), dec).rounded);
              const nShow = nRounded === null ? nPerS : nRounded;

              if (elsVu.out) {
                elsVu.out.textContent = `${format(nShow, { maxDecimals: dec === null ? 6 : dec })} 1/s`;
              }
              if (elsVu.out2) {
                elsVu.out2.textContent = `${format(perSToPerMin(nShow), {
                  maxDecimals: 2,
                  useThousands: true,
                })} 1/min`;
              }
              return;
            }

            if (vVal === null || nVal === null) throw new Error("Bitte v und n eingeben.");
            const vMps = toMetersPerSecond(vVal, vUnit);
            const nPerS = toPerSecond(nVal, nUnit);
            if (nPerS <= 0) throw new Error("n muss > 0 sein.");
            const dM = vMps / (Math.PI * nPerS);

            const dRounded = dec === null ? dM : parse(roundHalfUp(String(dM), dec).rounded);
            const dShow = dRounded === null ? dM : dRounded;

            if (elsVu.out) {
              elsVu.out.textContent = `${format(dShow, { maxDecimals: dec === null ? 6 : dec })} m`;
            }
            if (elsVu.out2) {
              elsVu.out2.textContent = `${format(dShow * 1000, {
                maxDecimals: 2,
                useThousands: true,
              })} mm  •  ${format(dShow * 100, { maxDecimals: 2 })} cm`;
            }
          } catch (err) {
            if (elsVu.out) elsVu.out.textContent = "—";
            if (elsVu.out2) elsVu.out2.textContent = err && err.message ? err.message : "Ungültige Eingabe.";
          }
        }

        function resetVu() {
          if (elsVu.d) elsVu.d.value = "";
          if (elsVu.n) elsVu.n.value = "";
          if (elsVu.v) elsVu.v.value = "";
          if (elsVu.dUnit) elsVu.dUnit.value = "mm";
          if (elsVu.nUnit) elsVu.nUnit.value = "perMin";
          if (elsVu.vUnit) elsVu.vUnit.value = "mPerMin";
          if (elsVu.round) elsVu.round.value = "2";
          if (elsVu.modeVu) elsVu.modeVu.checked = true;
          applySolveModeUI();
          if (elsVu.out) elsVu.out.textContent = "—";
          if (elsVu.out2) elsVu.out2.textContent = "—";
        }

        if (elsVu.btn) elsVu.btn.addEventListener("click", calcVu);
        if (elsVu.reset) elsVu.reset.addEventListener("click", resetVu);
        for (const r of [elsVu.modeVu, elsVu.modeN, elsVu.modeD]) {
          if (r) r.addEventListener("change", applySolveModeUI);
        }
        applySolveModeUI();
        // --- Tool 3: Belt translation + animation ---
        const elsB = {
          d1: document.getElementById("bD1"),
          n1: document.getElementById("bN1"),
          d2: document.getElementById("bD2"),
          outN2: document.getElementById("bN2Out"),
          outRatio: document.getElementById("bRatioOut"),
          btn: document.getElementById("btnCalcBelt"),
          reset: document.getElementById("btnResetBelt"),
          toggle: document.getElementById("btnToggleAnim"),
          viz: document.getElementById("beltViz"),
          label1: document.getElementById("viz1Label"),
          label2: document.getElementById("viz2Label"),
          rotor1: document.getElementById("rotor1"),
          rotor2: document.getElementById("rotor2"),
        };

        let beltPaused = false;

        function setRotorDuration(el, rpm) {
          if (!el) return;
          const abs = Math.abs(rpm || 0);
          const dur = abs > 0 ? clamp(60 / abs, 0.4, 8) : 8;
          el.style.setProperty("--spinDur", `${dur}s`);
        }

        function calcBelt() {
          const d1 = parse(extractFirstNumber(elsB.d1 && elsB.d1.value));
          const n1 = parse(extractFirstNumber(elsB.n1 && elsB.n1.value));
          const d2 = parse(extractFirstNumber(elsB.d2 && elsB.d2.value));

          if (d1 === null || n1 === null || d2 === null || d1 <= 0 || d2 <= 0) {
            if (elsB.outN2) elsB.outN2.textContent = "—";
            if (elsB.outRatio) elsB.outRatio.textContent = "Bitte d1, n1, d2 eingeben (d > 0).";
            return;
          }

          const n2 = (d1 * n1) / d2;
          const ratio = n2 / n1;

          if (elsB.outN2) elsB.outN2.textContent = `${format(n2, { maxDecimals: 0, useThousands: true })} 1/min`;
          if (elsB.outRatio) {
            elsB.outRatio.textContent = `Übersetzung i = n2/n1 = ${format(ratio, {
              maxDecimals: 4,
              useThousands: false,
            })}  (≈ d1/d2)`;
          }

          if (elsB.label1) {
            elsB.label1.textContent = `d1=${format(d1, { maxDecimals: 2 })}mm, n1=${format(n1, {
              maxDecimals: 0,
              useThousands: true,
            })}`;
          }
          if (elsB.label2) {
            elsB.label2.textContent = `d2=${format(d2, { maxDecimals: 2 })}mm, n2=${format(n2, {
              maxDecimals: 0,
              useThousands: true,
            })}`;
          }

          setRotorDuration(elsB.rotor1, n1);
          setRotorDuration(elsB.rotor2, n2);
        }

        if (elsB.btn) elsB.btn.addEventListener("click", calcBelt);
        if (elsB.reset) {
          elsB.reset.addEventListener("click", () => {
            if (elsB.d1) elsB.d1.value = "";
            if (elsB.n1) elsB.n1.value = "";
            if (elsB.d2) elsB.d2.value = "";
            if (elsB.outN2) elsB.outN2.textContent = "—";
            if (elsB.outRatio) elsB.outRatio.textContent = "—";
            if (elsB.label1) elsB.label1.textContent = "d1=?, n1=?";
            if (elsB.label2) elsB.label2.textContent = "d2=?, n2=?";
            setRotorDuration(elsB.rotor1, 0);
            setRotorDuration(elsB.rotor2, 0);
          });
        }
        if (elsB.toggle) {
          elsB.toggle.addEventListener("click", () => {
            beltPaused = !beltPaused;
            if (elsB.viz) {
              if (beltPaused) elsB.viz.classList.add("paused");
              else elsB.viz.classList.remove("paused");
            }
            elsB.toggle.textContent = beltPaused ? "Play" : "Pause";
          });
        }
        if (elsB.viz) elsB.viz.classList.remove("paused");

        // --- Tool 4: Cutting data ---
        const vcTable = VC_TABLE;

        const elsC = {
          mat: document.getElementById("matSel"),
          tool: document.getElementById("toolSel"),
          vc: document.getElementById("vcIn"),
          d: document.getElementById("dTurn"),
          nMax: document.getElementById("nMax"),
          preset: document.getElementById("stufenPreset"),
          stufen: document.getElementById("stufenSel"),
          outIdeal: document.getElementById("nIdealOut"),
          outPick: document.getElementById("nPickOut"),
          hint1: document.getElementById("cutHint1"),
          hint2: document.getElementById("cutHint2"),
          warn: document.getElementById("cutWarn"),
          banner: document.getElementById("vcBanner"),
          btn: document.getElementById("btnCalcCut"),
          reset: document.getElementById("btnResetCut"),
          preview: document.getElementById("vcJsonPreview"),
        };

        function presetSteps(name) {
          if (name === "skript") return [90, 120, 180, 240, 300];
          if (name === "demo") return [125, 250, 500, 1000, 2000, 4000];
          return null;
        }

        function refillSteps() {
          const preset = elsC.preset ? elsC.preset.value : "none";
          const steps = presetSteps(preset);
          if (!elsC.stufen) return;
          elsC.stufen.innerHTML = "";
          if (!steps) {
            elsC.stufen.disabled = true;
            return;
          }
          elsC.stufen.disabled = false;
          for (const s of steps) {
            const opt = document.createElement("option");
            opt.value = String(s);
            opt.textContent = `${format(s, { maxDecimals: 0, useThousands: true })} 1/min`;
            elsC.stufen.appendChild(opt);
          }
        }

        function pickStep(steps, nIdeal) {
          if (!Array.isArray(steps) || steps.length === 0) return null;
          const sorted = steps.slice().sort((a, b) => a - b);
          let pick = null;
          for (const s of sorted) {
            if (s <= nIdeal) pick = s;
          }
          return pick !== null ? pick : sorted[0];
        }

        function fillCuttingDropdowns() {
          if (!vcTable) return;
          if (elsC.preview) elsC.preview.textContent = JSON.stringify(vcTable, null, 2);
          if (elsC.banner && vcTable.meta && vcTable.meta.source === "PLACEHOLDER") {
            elsC.banner.hidden = false;
          }

          if (elsC.mat) {
            elsC.mat.innerHTML = "";
            for (const m of vcTable.materials || []) {
              const opt = document.createElement("option");
              opt.value = m.id;
              opt.textContent = m.label;
              elsC.mat.appendChild(opt);
            }
          }

          function refillTools() {
            if (!elsC.tool) return;
            const matId = elsC.mat ? elsC.mat.value : "";
            const mat =
              (vcTable.materials || []).find((x) => x.id === matId) ||
              (vcTable.materials || [])[0];

            elsC.tool.innerHTML = "";
            for (const t of (mat && mat.tools) || []) {
              const opt = document.createElement("option");
              opt.value = t.id;
              opt.textContent = t.label;
              elsC.tool.appendChild(opt);
            }

            const toolId = elsC.tool.value;
            const tool =
              ((mat && mat.tools) || []).find((x) => x.id === toolId) ||
              ((mat && mat.tools) || [])[0];
            if (tool && elsC.vc) {
              elsC.vc.value = format(tool.vc, { maxDecimals: 0, useThousands: false });
            }
          }

          if (elsC.mat) elsC.mat.addEventListener("change", refillTools);
          if (elsC.tool) elsC.tool.addEventListener("change", refillTools);
          refillTools();
        }

        function calcCut(syncSelection) {
          const vc = parse(extractFirstNumber(elsC.vc && elsC.vc.value));
          const dMm = parse(extractFirstNumber(elsC.d && elsC.d.value));
          const nMax = parse(extractFirstNumber(elsC.nMax && elsC.nMax.value));

          if (vc === null || dMm === null || dMm <= 0) {
            if (elsC.outIdeal) elsC.outIdeal.textContent = "—";
            if (elsC.hint1) elsC.hint1.textContent = "Bitte v_c und d (mm) eingeben.";
            if (elsC.outPick) elsC.outPick.textContent = "—";
            if (elsC.hint2) elsC.hint2.textContent = "—";
            if (elsC.warn) elsC.warn.textContent = "";
            return;
          }

          const dM = dMm / 1000;
          const nIdeal = vc / (Math.PI * dM); // 1/min

          if (elsC.outIdeal) {
            elsC.outIdeal.textContent = `${format(nIdeal, { maxDecimals: 0, useThousands: true })} 1/min`;
          }
          if (elsC.hint1) {
            elsC.hint1.textContent = `bei v_c=${format(vc, { maxDecimals: 2 })} m/min und d=${format(dMm, {
              maxDecimals: 2,
            })} mm`;
          }

          const steps = presetSteps(elsC.preset ? elsC.preset.value : "none");
          if (steps) {
            const recommended = pickStep(steps, nIdeal);
            if (elsC.outPick) {
              elsC.outPick.textContent =
                recommended === null
                  ? "—"
                  : `${format(recommended, { maxDecimals: 0, useThousands: true })} 1/min`;
            }

            let chosenN = null;
            const allowChoose = elsC.stufen && !elsC.stufen.disabled;
            if (allowChoose) {
              const current = Number(elsC.stufen.value);
              if (Number.isFinite(current) && current > 0) chosenN = current;
            }

            const shouldSync = !!syncSelection || chosenN === null;
            if (shouldSync && allowChoose && recommended !== null) {
              elsC.stufen.value = String(recommended);
              chosenN = recommended;
            }

            if (chosenN !== null) {
              const vcReal = Math.PI * dM * chosenN;
              if (elsC.hint2) {
                elsC.hint2.textContent = `v_c,real bei Stufe: ${format(vcReal, {
                  maxDecimals: 2,
                  useThousands: true,
                })} m/min`;
              }
            }
          } else {
            if (elsC.outPick) elsC.outPick.textContent = "—";
            if (elsC.hint2) elsC.hint2.textContent = "Keine Drehzahlstufen aktiv.";
          }

          const warnLines = [];
          if (Number.isFinite(nMax) && nMax > 0 && nIdeal > nMax) {
            warnLines.push(
              `<span class="warn">über Limit</span> n_ideal > n_max (${format(nMax, {
                maxDecimals: 0,
                useThousands: true,
              })} 1/min)`,
            );
          }
          if (elsC.warn) {
            if (!warnLines.length) elsC.warn.textContent = "";
            else elsC.warn.innerHTML = warnLines.join("<br/>");
          }
        }

        function resetCut() {
          if (elsC.preset) elsC.preset.value = "none";
          refillSteps();
          if (elsC.vc) elsC.vc.value = "";
          if (elsC.d) elsC.d.value = "";
          if (elsC.nMax) elsC.nMax.value = "";
          if (elsC.outIdeal) elsC.outIdeal.textContent = "—";
          if (elsC.outPick) elsC.outPick.textContent = "—";
          if (elsC.hint1) elsC.hint1.textContent = "—";
          if (elsC.hint2) elsC.hint2.textContent = "—";
          if (elsC.warn) elsC.warn.textContent = "";
        }

        if (elsC.preset) {
          elsC.preset.addEventListener("change", () => {
            refillSteps();
            calcCut(true);
          });
        }
        if (elsC.stufen) elsC.stufen.addEventListener("change", () => calcCut(false));
        if (elsC.btn) {
          elsC.btn.addEventListener("click", () => {
            refillSteps();
            calcCut(true);
          });
        }
        if (elsC.reset) elsC.reset.addEventListener("click", resetCut);

        fillCuttingDropdowns();
        refillSteps();
        // --- Tool 5: Rotational dynamics ---
        const elsMP = {
          modeToM: document.getElementById("mpToM"),
          modeToP: document.getElementById("mpToP"),
          n: document.getElementById("mpN"),
          p: document.getElementById("mpP"),
          m: document.getElementById("mpM"),
          omega: document.getElementById("mpOmega"),
          omegaHint: document.getElementById("mpOmegaHint"),
          out: document.getElementById("mpOut"),
          btn: document.getElementById("btnCalcMP"),
          reset: document.getElementById("btnResetMP"),
        };

        function applyMPMode() {
          const toM = elsMP.modeToM && elsMP.modeToM.checked;
          if (elsMP.p) elsMP.p.disabled = !toM;
          if (elsMP.m) elsMP.m.disabled = toM;
        }

        function calcMP() {
          const nRpm = parse(extractFirstNumber(elsMP.n && elsMP.n.value));
          if (nRpm === null || nRpm <= 0) {
            if (elsMP.omega) elsMP.omega.textContent = "—";
            if (elsMP.out) elsMP.out.textContent = "Bitte n eingeben.";
            return;
          }

          const omega = (2 * Math.PI * nRpm) / 60; // rad/s
          if (elsMP.omega) elsMP.omega.textContent = `${format(omega, { maxDecimals: 4 })} rad/s`;
          if (elsMP.omegaHint) {
            elsMP.omegaHint.textContent = `n=${format(nRpm, { maxDecimals: 0, useThousands: true })} 1/min → ω=2πn/60`;
          }

          const toM = elsMP.modeToM && elsMP.modeToM.checked;
          if (toM) {
            const pKw = parse(extractFirstNumber(elsMP.p && elsMP.p.value));
            if (pKw === null || pKw < 0) {
              if (elsMP.out) elsMP.out.textContent = "Bitte P (kW) eingeben.";
              return;
            }
            const pW = pKw * 1000;
            const Mnm = pW / omega;
            if (elsMP.out) elsMP.out.textContent = `M = ${format(Mnm, { maxDecimals: 2, useThousands: true })} Nm`;
          } else {
            const Mnm = parse(extractFirstNumber(elsMP.m && elsMP.m.value));
            if (Mnm === null || Mnm < 0) {
              if (elsMP.out) elsMP.out.textContent = "Bitte M (Nm) eingeben.";
              return;
            }
            const pW = Mnm * omega;
            if (elsMP.out) elsMP.out.textContent = `P = ${format(pW / 1000, { maxDecimals: 3 })} kW`;
          }
        }

        if (elsMP.btn) elsMP.btn.addEventListener("click", calcMP);
        if (elsMP.reset) {
          elsMP.reset.addEventListener("click", () => {
            if (elsMP.n) elsMP.n.value = "";
            if (elsMP.p) elsMP.p.value = "";
            if (elsMP.m) elsMP.m.value = "";
            if (elsMP.modeToM) elsMP.modeToM.checked = true;
            applyMPMode();
            if (elsMP.omega) elsMP.omega.textContent = "—";
            if (elsMP.omegaHint) elsMP.omegaHint.textContent = "—";
            if (elsMP.out) elsMP.out.textContent = "—";
          });
        }
        for (const r of [elsMP.modeToM, elsMP.modeToP]) {
          if (r) r.addEventListener("change", applyMPMode);
        }
        applyMPMode();

        const elsE = {
          m: document.getElementById("eM"),
          r: document.getElementById("eR"),
          rUnit: document.getElementById("eRUnit"),
          n: document.getElementById("eN"),
          jOut: document.getElementById("eJOut"),
          out: document.getElementById("eOut"),
          hint: document.getElementById("eHint"),
          btn: document.getElementById("btnCalcE"),
          reset: document.getElementById("btnResetE"),
        };

        function calcE() {
          const mKg = parse(extractFirstNumber(elsE.m && elsE.m.value));
          const rVal = parse(extractFirstNumber(elsE.r && elsE.r.value));
          const nRpm = parse(extractFirstNumber(elsE.n && elsE.n.value));
          if (mKg === null || rVal === null || nRpm === null || mKg < 0 || rVal <= 0 || nRpm < 0) {
            if (elsE.jOut) elsE.jOut.textContent = "—";
            if (elsE.out) elsE.out.textContent = "—";
            if (elsE.hint) elsE.hint.textContent = "Bitte m, r und n eingeben.";
            return;
          }

          const rM = toMeters(rVal, elsE.rUnit ? elsE.rUnit.value : "mm");
          const omega = (2 * Math.PI * nRpm) / 60;
          const J = 0.5 * mKg * rM * rM;
          const E = 0.5 * J * omega * omega;

          if (elsE.jOut) elsE.jOut.textContent = `${format(J, { maxDecimals: 6 })} kg·m²`;
          if (elsE.out) elsE.out.textContent = `${format(E, { maxDecimals: 2, useThousands: true })} J`;
          if (elsE.hint) elsE.hint.textContent = `ω=${format(omega, { maxDecimals: 3 })} rad/s`;
        }

        if (elsE.btn) elsE.btn.addEventListener("click", calcE);
        if (elsE.reset) {
          elsE.reset.addEventListener("click", () => {
            if (elsE.m) elsE.m.value = "";
            if (elsE.r) elsE.r.value = "";
            if (elsE.n) elsE.n.value = "";
            if (elsE.rUnit) elsE.rUnit.value = "mm";
            if (elsE.jOut) elsE.jOut.textContent = "—";
            if (elsE.out) elsE.out.textContent = "—";
            if (elsE.hint) elsE.hint.textContent = "—";
          });
        }

        // --- Exercises ---
        const exercises = [
          {
            id: "5.3.1/1",
            title: "Fahrrad: v_u aus n und d",
            prompt:
              "Das Rad eines Fahrrades hat n = 2,5 1/s. Der Raddurchmesser beträgt d = 0,71 m. Wie gross ist v_u?",
            expected: { kind: "rounded", valueStr: "5,58", decimals: 2, unit: "m/s" },
            solutionText: "v_u = d · π · n = 0,71 · π · 2,5 = 5,58 m/s",
          },
          {
            id: "5.3.1/2",
            title: "Riemenscheibe: d aus v und n",
            prompt:
              "Bestimmen Sie den Durchmesser d der Riemenscheibe, wenn n = 1260 1/min und der Riemen mit v = 16 m/s läuft.",
            expected: { kind: "int", value: 243, unit: "mm" },
            solutionText: "d = v_u / (π · n) = 16 / (π · 21) = 0,243 m = 243 mm",
          },
          {
            id: "5.3.1/3",
            title: "Auto: n aus v und d",
            prompt:
              "Ein Auto fährt mit v = 81 km/h. Die Räder haben d = 65 cm. Wie gross ist n in 1/min?",
            expected: { kind: "int", value: 661, unit: "1/min" },
            solutionText: "n = v_u / (π · d) = 22,5 / (π · 0,65) = 11,0 1/s = 661 1/min",
          },
          {
            id: "5.3.1/4",
            title: "Wäschetrommel: d aus v_u und n",
            prompt: "Welche Trommel hat d, wenn v_u = 115 m/s und n = 5'230 1/min?",
            expected: { kind: "int", value: 42, unit: "cm" },
            solutionText: "d = v_u / (π · n) = 115 / (π · 87,17) = 0,42 m = 42 cm",
          },
          {
            id: "5.3.1/6",
            title: "Drehmaschine: Stufe wählen (v_c nicht überschreiten)",
            prompt:
              "Welle: d = 70,25 mm. Max v_c = 62 m/min. Stufen: 90, 120, 180, 240, 300 1/min. Welche Stufe wählen?",
            expected: { kind: "choice", value: 240, allowed: [90, 120, 180, 240, 300], unit: "1/min" },
            solutionText:
              "n_ideal = v_c / (π · d) = 62 / (π · 0,07025) ≈ 281 1/min → größte Stufe darunter: 240 1/min",
          },
          {
            id: "5.3.1/7",
            title: "Uhr: Minutenzeiger",
            prompt: "Welche Drehzahl hat der Minutenzeiger einer Uhr (T = 60 min)?",
            expected: { kind: "rounded", valueStr: "0,017", decimals: 3, unit: "1/min" },
            solutionText: "n = 1/T = 1/60 min = 0,0167… 1/min ≈ 0,017 1/min",
          },
          {
            id: "5.3.1/8",
            title: "Zahnarztbohrer",
            prompt: "d = 0,2 mm, v_c = 190 m/min. Welche Drehzahl n in 1/min erreicht der Bohrer?",
            expected: { kind: "int", value: 302394, unit: "1/min" },
            solutionText: "n = v_c / (π · d) = 190 / (π · 0,0002) = 302'394 1/min",
          },
          {
            id: "5.4/14",
            title: "Schleifscheibe (Max v_u)",
            prompt:
              "d = 350 mm, max v_u = 30 m/s. Mit welcher Drehzahl kann sie maximal betrieben werden?",
            expected: { kind: "int", value: 1637, unit: "1/min" },
            solutionText: "n = v_u / (π · d) = 30 / (π · 0,35) = 27,28 1/s = 1637 1/min",
          },
          {
            id: "5.4/15",
            title: "Räumen (Zeit aus v_c)",
            prompt:
              "Räumnadel: Länge 750 mm, Schnittgeschwindigkeit 2,5 m/min. Wie lange dauert die Räumung?",
            expected: { kind: "int", value: 18, unit: "s" },
            solutionText: "t = s / v = 0,75 m / (2,5 m/min) = 0,3 min = 18 s",
          },
          {
            id: "5.4/16",
            title: "Hobeln (Weg aus v_c und t)",
            prompt:
              "Arbeitshub 5 s bei Schnittgeschwindigkeit 23 m/min. Wie gross ist der Tischhub?",
            expected: { kind: "int", value: 1917, unit: "mm" },
            solutionText: "s = v · t = (23 m/min) · (5 s) = 23 · 5/60 m = 1,917 m = 1'917 mm",
          },
        ];

        function setFeedback(el, ok, msg) {
          if (!el) return;
          if (ok) el.innerHTML = `<span class="ok">OK</span> ${msg || ""}`.trim();
          else el.innerHTML = `<span class="bad">Noch nicht</span> ${msg || ""}`.trim();
        }

        function checkExercise(ex, gotRaw) {
          const numStr = extractFirstNumber(gotRaw);
          if (!numStr) return { ok: false, reason: "Bitte eine Zahl eingeben." };

          if (ex.expected.kind === "rounded") {
            let gotRounded = "";
            try {
              gotRounded = roundHalfUp(numStr, ex.expected.decimals).rounded;
            } catch (err) {
              return { ok: false, reason: err && err.message ? err.message : "Ungültige Eingabe." };
            }
            if (gotRounded === ex.expected.valueStr) return { ok: true };
            return { ok: false, reason: `Erwartet: ${ex.expected.valueStr} ${ex.expected.unit || ""}`.trim() };
          }

          const got = parse(numStr);
          if (got === null) return { ok: false, reason: "Bitte eine gültige Zahl eingeben." };

          if (ex.expected.kind === "choice") {
            const rounded = Math.round(got);
            if (ex.expected.allowed.includes(rounded) && rounded === ex.expected.value) return { ok: true };
            if (ex.expected.allowed.includes(rounded)) {
              return { ok: false, reason: "Das ist eine mögliche Stufe, aber nicht die richtige Wahl." };
            }
            return { ok: false, reason: `Bitte eine der Stufen eingeben: ${ex.expected.allowed.join(", ")}.` };
          }

          const expected = ex.expected.value;
          const diff = Math.abs(got - expected);
          if (diff <= 0.5) return { ok: true };
          return {
            ok: false,
            reason: `Erwartet: ${format(expected, { maxDecimals: 0, useThousands: true })} ${
              ex.expected.unit || ""
            }`.trim(),
          };
        }

        function buildExerciseCard(ex) {
          const card = document.createElement("div");
          card.className = "exercise-card";

          const title = document.createElement("h3");
          title.className = "exercise-title";
          title.textContent = `${ex.id} – ${ex.title}`;

          const p = document.createElement("p");
          p.className = "source-note";
          p.style.margin = "0";
          p.textContent = ex.prompt;

          const actions = document.createElement("div");
          actions.className = "exercise-actions";

          const input = document.createElement("input");
          input.className = "input";
          input.type = "text";
          input.placeholder = `Dein Resultat (${ex.expected.unit || "Zahl"})`;
          input.setAttribute("aria-label", `Antwort ${ex.id}`);

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
            const res = checkExercise(ex, gotRaw);
            if (res.ok) setFeedback(fb, true, "");
            else setFeedback(fb, false, res.reason || "Versuch es nochmals.");
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

        const exerciseList = document.getElementById("exercise-list");
        if (exerciseList) {
          for (const ex of exercises) {
            exerciseList.appendChild(buildExerciseCard(ex));
          }
        }
      });
