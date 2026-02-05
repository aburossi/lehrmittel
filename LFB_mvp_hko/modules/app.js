(function () {
  "use strict";

  const MAPH = (window.MAPH = window.MAPH || {});

  const MODULES = [
    {
      id: 0,
      href: "module_0.html",
      title: "Warm-up: Mathe-Gatekeeper (Einheiten & Rechner)",
      subtitle:
        "Einheiten umrechnen (mm↔m) und Taschenrechner-Syntax üben (Klammern, ^, EE) – bevor es an die Maschinen geht.",
      status: "ready",
    },
    {
      id: 1,
      href: "module_1.html",
      title: "Das Werkzeug vorbereiten (Geometrie)",
      subtitle:
        "Lernziele 5, 10: Frei-, Keil- und Spanwinkel; Winkel und Flächen an der Werkzeugschneide.",
      status: "ready",
    },
    {
      id: 2,
      href: "module_2.html",
      title: "Blech trennen (mechanisch)",
      subtitle:
        "Lernziele 6, 7: Wahl des Trennverfahrens; Scheren, Stanzen und Nibbeln.",
      status: "ready",
    },
    {
      id: 3,
      href: "module_3.html",
      title: "Trennen mit Energie (thermisch/Strahl) & Sonderfälle",
      subtitle:
        "Lernziele 8, 11: Autogen, Plasma, Laser, Wasserstrahl; Senk- und Schneiderosion.",
      status: "ready",
    },
    {
      id: 4,
      href: "module_4.html",
      title: "Oberfläche finalisieren (Schleifen & KSS)",
      subtitle: "Lernziele 9, 13: Schleifen (Feinstbearbeitung); Schmier- und Kühlverfahren.",
      status: "ready",
    },
    {
      id: 5,
      href: "module_5.html",
      title: "Schnittdaten bestimmen (Standzeit & Maschine)",
      subtitle:
        "Lernziele 12, 14: Einflussgrössen auf die Standzeit; Hauptbaugruppen von Werkzeugmaschinen.",
      status: "ready",
    },
  ];

  MAPH.modules = MODULES;

  function createPill(status) {
    const pill = document.createElement("span");
    if (status === "ready") {
      pill.className = "pill pill--ready";
      pill.textContent = "bereit";
      return pill;
    }
    pill.className = "pill pill--todo";
    pill.textContent = "in Arbeit";
    return pill;
  }

  function initIndex() {
    const list = document.getElementById("module-list");
    if (!list) return;

    list.textContent = "";

    for (const m of MODULES) {
      const li = document.createElement("li");
      li.className = "module-item";

      const title = `Auftrag ${m.id}: ${m.title}`;
      const subtitle = m.subtitle || "";

      const labelWrap = document.createElement("span");
      const titleEl = document.createElement("span");
      titleEl.className = "module-title";
      titleEl.textContent = title;
      const subtitleEl = document.createElement("span");
      subtitleEl.className = "module-subtitle";
      subtitleEl.textContent = subtitle;
      labelWrap.appendChild(titleEl);
      labelWrap.appendChild(subtitleEl);

      if (m.href) {
        const a = document.createElement("a");
        a.href = m.href;
        a.setAttribute("aria-label", `${title}: ${subtitle}`);
        a.appendChild(labelWrap);
        li.appendChild(a);
      } else {
        li.classList.add("module-item--disabled");
        li.setAttribute("aria-disabled", "true");

        const span = document.createElement("span");
        span.appendChild(labelWrap);
        li.appendChild(span);
      }

      li.appendChild(createPill(m.status));
      list.appendChild(li);
    }

    if (MAPH && typeof MAPH.typesetTeX === "function") {
      // In case the index ever contains formulas (or $...$/\(..\) markup).
      MAPH.typesetTeX();
    }
  }

  function createNavLink(href, text, ariaLabel) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (ariaLabel) a.setAttribute("aria-label", ariaLabel);
    return a;
  }

  function initModuleShell() {
    const moduleId = Number(document.body && document.body.dataset.moduleId);
    if (!Number.isInteger(moduleId) || moduleId < 0) return;

    const container = document.querySelector(".container");
    if (!container) return;
    if (container.querySelector('[data-maph-shell="1"]')) return;

    const meta = MODULES.find((m) => m.id === moduleId);
    if (!meta) return;

    const header = document.createElement("header");
    header.className = "header";
    header.setAttribute("data-maph-shell", "1");

    const left = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.textContent = `Auftrag ${meta.id}: ${meta.title}`;
    const p = document.createElement("p");
    p.textContent = meta.subtitle;
    left.appendChild(h1);
    left.appendChild(p);

    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.setAttribute("aria-label", "Navigation");

    nav.appendChild(createNavLink("index.html", "← Übersicht", "Zur Übersicht"));

    const currentIndex = MODULES.findIndex((m) => m.id === moduleId);
    const prev = currentIndex > 0 ? MODULES[currentIndex - 1] : null;
    const next =
      currentIndex >= 0 && currentIndex < MODULES.length - 1
        ? MODULES[currentIndex + 1]
        : null;

    if (prev && prev.href && prev.status === "ready") {
      nav.appendChild(
        createNavLink(
          prev.href,
          `← Auftrag ${prev.id}`,
          `Zum vorherigen Auftrag (${prev.id})`,
        ),
      );
    }
    if (next && next.href && next.status === "ready") {
      nav.appendChild(
        createNavLink(
          next.href,
          `Auftrag ${next.id} →`,
          `Zum nächsten Auftrag (${next.id})`,
        ),
      );
    }

    header.appendChild(left);
    header.appendChild(nav);

    container.insertBefore(header, container.firstChild);

    document.title = `Auftrag ${meta.id} – ${meta.title}`;

    const note = document.createElement("p");
    note.className = "hint";
    note.id = "katex-note";
    note.hidden = true;
    note.textContent =
      "Hinweis: KaTeX ist nicht installiert – Formeln werden vereinfacht angezeigt. (Optional: siehe vendor/katex/README.md)";
    container.insertBefore(note, header.nextSibling);

    if (MAPH && typeof MAPH.typesetTeX === "function") {
      MAPH.typesetTeX().then((res) => {
        const hasTeX = Boolean(document.querySelector("[data-tex]"));
        note.hidden = !(hasTeX && !(res && res.katexLoaded));
      });
      return;
    }

    if (MAPH && typeof MAPH.renderTeX === "function") {
      MAPH.renderTeX();
      const hasTeX = Boolean(document.querySelector("[data-tex]"));
      const hasKaTeX = Boolean(
        window.katex && typeof window.katex.render === "function",
      );
      note.hidden = !(hasTeX && !hasKaTeX);
      return;
    }

    note.remove();
  }

  const page = (MAPH.page = MAPH.page || {});
  page.initIndex = initIndex;
  page.initModuleShell = initModuleShell;

  function bootstrap() {
    initIndex();
    initModuleShell();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
