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

    function buildSelectCard({ id, title, prompt, options, expected, hint, solutionText }) {
      const card = document.createElement("div");
      card.className = "exercise-card";

      const h3 = document.createElement("h3");
      h3.className = "exercise-title";
      h3.textContent = title ? title : `Aufgabe ${id}`;

      const p = document.createElement("p");
      p.textContent = prompt;

      const actions = document.createElement("div");
      actions.className = "choice-row";

      const sel = buildSelect(options, "Auswählen …");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = "Prüfen";

      actions.appendChild(sel);
      actions.appendChild(btn);

      const feedback = document.createElement("div");
      feedback.className = "exercise-feedback";
      feedback.textContent = "—";

      function check() {
        const got = String(sel.value || "");
        if (!got) {
          setFeedback(feedback, false, "Bitte auswählen.");
          return;
        }
        const ok = got === expected;
        setFeedback(feedback, ok, ok ? "" : hint || "Versuch es nochmals.");
      }

      btn.addEventListener("click", check);
      sel.addEventListener("keydown", (e) => {
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
      sol.textContent = solutionText || "";
      details.appendChild(summary);
      details.appendChild(sol);

      card.appendChild(h3);
      card.appendChild(p);
      card.appendChild(actions);
      card.appendChild(feedback);
      card.appendChild(details);
      return card;
    }

    const METHOD_OPTIONS = [
      { value: "scheren", label: "Scheren" },
      { value: "stanzen", label: "Stanzen" },
      { value: "nibbeln", label: "Nibbeln" },
    ];

    const scenarios = [
      {
        id: "S1",
        title: "Szenario 1",
        prompt:
          "Gerader Schnitt in dünnem Blech, einfache Geometrie, geringe Stückzahl. Welches Verfahren passt am besten?",
        expected: "scheren",
        hint: "Tipp: Gerade Schnitte → oft Scheren.",
        solutionText:
          "Scheren: schnell und einfach für gerade Schnitte, geringe Werkzeugkosten.",
      },
      {
        id: "S2",
        title: "Szenario 2",
        prompt:
          "Viele identische Teile (Serie) mit wiederholender Kontur/Lochbild. Welches Verfahren ist typisch?",
        expected: "stanzen",
        hint: "Tipp: Hohe Stückzahl → Werkzeug lohnt sich.",
        solutionText:
          "Stanzen: Stempel/Matrize lohnt sich besonders bei Serien.",
      },
      {
        id: "S3",
        title: "Szenario 3",
        prompt:
          "Komplexe Kontur im Blech, Einzelstück oder kleine Serie, flexibel ohne spezielles Stanzwerkzeug. Was passt?",
        expected: "nibbeln",
        hint: "Tipp: Flexible Konturen ohne Werkzeug → Nibbeln.",
        solutionText:
          "Nibbeln: Konturen flexibel „abnibbeln“, ideal für Einzelstücke/kleine Serien.",
      },
      {
        id: "S4",
        title: "Szenario 4",
        prompt:
          "Viele gleiche Löcher (Lochbild) in Blech – hohe Wiederholgenauigkeit und Tempo. Verfahren?",
        expected: "stanzen",
        hint: "Tipp: Wiederholgenau + Serie → Stanzen.",
        solutionText:
          "Stanzen: Lochbilder sehr effizient bei Serien und hoher Wiederholgenauigkeit.",
      },
      {
        id: "S5",
        title: "Szenario 5",
        prompt:
          "Ausschnitt vor Ort (Montage), eher kleine Stückzahl, Kontur muss nicht ultraschnell sein, aber flexibel. Verfahren?",
        expected: "nibbeln",
        hint: "Tipp: Flexibilität vor Ort → Nibbeln.",
        solutionText:
          "Nibbeln: gut für flexible Ausschnitte ohne aufwändiges Werkzeug.",
      },
      {
        id: "S6",
        title: "Szenario 6",
        prompt:
          "Lange, gerade Schnittkante, möglichst wenig Rüstaufwand. Verfahren?",
        expected: "scheren",
        hint: "Tipp: Gerade, lang → Scheren.",
        solutionText:
          "Scheren: gerade Kanten schnell, wenig Rüstaufwand.",
      },
    ];

    const scenarioList = document.getElementById("scenario-list");
    if (scenarioList) {
      for (const s of scenarios) {
        scenarioList.appendChild(
          buildSelectCard({
            ...s,
            options: METHOD_OPTIONS,
          }),
        );
      }
    }

    const quizQuestions = [
      {
        id: "Q1",
        title: "Frage 1",
        prompt: "Welcher Faktor spricht besonders für Stanzen statt Nibbeln?",
        options: [
          { value: "a", label: "Hohe Stückzahl (Serie)" },
          { value: "b", label: "Einzelstück, flexible Kontur" },
          { value: "c", label: "Kein Werkzeug darf eingesetzt werden" },
          { value: "d", label: "Sehr enge Radien ohne Werkzeug" },
        ],
        expected: "a",
        hint: "Tipp: Stanzen lohnt sich bei Serien.",
        solutionText: "Bei hoher Stückzahl lohnt sich ein Stanzwerkzeug (Rüstaufwand amortisiert sich).",
      },
      {
        id: "Q2",
        title: "Frage 2",
        prompt: "Welche Aussage passt typischerweise zu Nibbeln?",
        options: [
          { value: "a", label: "Sehr effizient bei Serien mit Stanzwerkzeug" },
          { value: "b", label: "Kontur entsteht durch viele kleine Hübe" },
          { value: "c", label: "Nur für sehr dicke Stahlplatten geeignet" },
          { value: "d", label: "Erzeugt immer eine Wärmeeinflusszone" },
        ],
        expected: "b",
        hint: "Tipp: „abnibbeln“ = viele kleine Schritte.",
        solutionText: "Beim Nibbeln wird die Kontur schrittweise durch viele Hübe erzeugt.",
      },
      {
        id: "Q3",
        title: "Frage 3",
        prompt: "Scheren eignet sich besonders für …",
        options: [
          { value: "a", label: "Freiform-Innenkonturen mit engen Radien" },
          { value: "b", label: "Gerade Schnitte mit wenig Werkzeugaufwand" },
          { value: "c", label: "Leitfähige Werkstoffe bei Funkenerosion" },
          { value: "d", label: "Schnitt ohne mechanische Kräfte" },
        ],
        expected: "b",
        hint: "Tipp: Gerade Schnitte.",
        solutionText: "Scheren ist klassisch für gerade Schnitte (Blech/Profil) mit geringem Werkzeugaufwand.",
      },
      {
        id: "Q4",
        title: "Frage 4",
        prompt: "Welche Nacharbeit ist bei mechanischem Trennen häufig nötig?",
        options: [
          { value: "a", label: "Entgraten (Grat entfernen)" },
          { value: "b", label: "Wärmebehandlung der WEZ" },
          { value: "c", label: "Schmelzbad erstarren lassen" },
          { value: "d", label: "Draht wechseln" },
        ],
        expected: "a",
        hint: "Tipp: Grat kann entstehen.",
        solutionText: "Bei Scheren/Stanzen/Nibbeln kann Grat entstehen → Entgraten ist oft sinnvoll.",
      },
    ];

    const quizList = document.getElementById("quiz-list");
    if (quizList) {
      for (const q of quizQuestions) {
        quizList.appendChild(buildSelectCard(q));
      }
    }

    if (window.MAPH && typeof window.MAPH.typesetTeX === "function") {
      window.MAPH.typesetTeX();
    }
  })();
});

