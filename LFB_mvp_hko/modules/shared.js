(function () {
  "use strict";

  function normalizeNumberInput(raw) {
    if (raw === null || raw === undefined) return "";
    return String(raw)
      .trim()
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, "")
      .replace(/[\u2019\u2018]/g, "'"); // ’ ‘
  }

  function parseLocaleNumber(raw) {
    const cleaned = normalizeNumberInput(raw);
    if (!cleaned) return null;

    // Remove CH thousands separator and similar.
    let s = cleaned.replace(/[’']/g, "");

    // If both separators exist, treat the last one as the decimal separator.
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma !== -1 && lastDot !== -1) {
      const decimalIsComma = lastComma > lastDot;
      if (decimalIsComma) {
        s = s.replace(/\./g, "");
        s = s.replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else {
      s = s.replace(",", ".");
    }

    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n;
  }

  function formatCH(value, opts) {
    const options = Object.assign(
      { maxDecimals: 10, useThousands: false },
      opts || {},
    );

    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);

    const maxDecimals =
      typeof options.maxDecimals === "number" && options.maxDecimals >= 0
        ? Math.min(20, Math.floor(options.maxDecimals))
        : 10;

    let fixed = abs.toFixed(maxDecimals);
    let [intPart, fracPart] = fixed.split(".");

    // Trim trailing zeros (display convenience). For fixed-decimal output, use roundHalfUp().
    if (fracPart) {
      fracPart = fracPart.replace(/0+$/g, "");
    }

    if (options.useThousands) {
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    }

    if (!fracPart) return sign + intPart;
    return sign + intPart + "," + fracPart;
  }

  function toPlainDecimalString(raw) {
    // Returns { sign: '-'|'' , intPart: '0..', fracPart: 'digits' }
    const cleaned = normalizeNumberInput(raw);
    if (!cleaned) {
      throw new Error("Bitte eine Zahl eingeben.");
    }

    let s = cleaned.replace(/[’']/g, "");
    if (/[a-df-zA-DF-Z]/.test(s)) {
      throw new Error("Bitte eine Dezimalzahl eingeben (ohne Einheiten/Variablen).");
    }

    let sign = "";
    if (s.startsWith("+")) s = s.slice(1);
    if (s.startsWith("-")) {
      sign = "-";
      s = s.slice(1);
    }
    if (!s) throw new Error("Bitte eine Zahl eingeben.");

    // Support optional exponent.
    let coefficient = s;
    let exp = 0;
    const eIndex = Math.max(s.indexOf("e"), s.indexOf("E"));
    if (eIndex !== -1) {
      coefficient = s.slice(0, eIndex);
      const expRaw = s.slice(eIndex + 1);
      if (!expRaw) throw new Error("Ungültige Exponentialschreibweise (E fehlt).");
      exp = Number(expRaw);
      if (!Number.isInteger(exp)) {
        throw new Error("Ungültiger Exponent (z.B. 1E3 oder 1E-3).");
      }
    }

    // Determine decimal separator (last one wins).
    const lastComma = coefficient.lastIndexOf(",");
    const lastDot = coefficient.lastIndexOf(".");
    let decSep = null;
    if (lastComma !== -1 || lastDot !== -1) {
      decSep = lastComma > lastDot ? "," : ".";
    }

    if (decSep === ",") {
      coefficient = coefficient.replace(/\./g, "");
    } else if (decSep === ".") {
      coefficient = coefficient.replace(/,/g, "");
    }

    let intPart = coefficient;
    let fracPart = "";
    if (decSep) {
      const parts = coefficient.split(decSep);
      intPart = parts[0] || "0";
      fracPart = parts[1] || "";
    }

    if (!/^\d+$/.test(intPart) || (fracPart && !/^\d+$/.test(fracPart))) {
      throw new Error("Ungültige Zahl. Erlaubt sind Ziffern, ',' oder '.', optional 'E'.");
    }

    // Remove leading zeros in intPart, but keep at least one digit.
    intPart = intPart.replace(/^0+(?=\d)/, "");

    // Convert coefficient + exp into plain decimal without exponent by shifting the decimal point.
    const digits = (intPart + fracPart).replace(/^0+(?=\d)/, "");
    const scale = fracPart.length; // digits after decimal in coefficient
    const power = exp - scale;

    let plainInt = "";
    let plainFrac = "";

    if (!digits || /^0+$/.test(digits)) {
      plainInt = "0";
      plainFrac = "";
      sign = "";
      return { sign, intPart: plainInt, fracPart: plainFrac };
    }

    if (power >= 0) {
      plainInt = digits + "0".repeat(power);
      plainFrac = "";
    } else {
      const cut = digits.length + power; // power is negative
      if (cut > 0) {
        plainInt = digits.slice(0, cut);
        plainFrac = digits.slice(cut);
      } else {
        plainInt = "0";
        plainFrac = "0".repeat(-cut) + digits;
      }
    }

    plainInt = plainInt.replace(/^0+(?=\d)/, "");
    plainFrac = plainFrac.replace(/0+$/g, "");

    if (plainInt === "0" && !plainFrac) sign = "";
    return { sign, intPart: plainInt || "0", fracPart: plainFrac };
  }

  function incrementDigitString(digits) {
    // digits: array of numeric chars
    let carry = 1;
    for (let i = digits.length - 1; i >= 0; i--) {
      if (!carry) break;
      const d = digits[i].charCodeAt(0) - 48;
      if (d < 9) {
        digits[i] = String.fromCharCode(48 + d + 1);
        carry = 0;
      } else {
        digits[i] = "0";
        carry = 1;
      }
    }
    return carry;
  }

  function roundHalfUp(raw, decimals) {
    const places =
      typeof decimals === "number" && decimals >= 0
        ? Math.min(20, Math.floor(decimals))
        : 2;

    const plain = toPlainDecimalString(raw);
    let { sign, intPart, fracPart } = plain;

    while (fracPart.length < places + 1) fracPart += "0";

    const nextDigit = fracPart[places] || "0";
    const rule =
      nextDigit === "5" ? "eq5" : nextDigit > "5" ? "gt5" : "lt5";

    let keptFrac = fracPart.slice(0, places);
    let keptInt = intPart;

    if (rule !== "lt5") {
      if (places === 0) {
        const digits = keptInt.split("");
        const carry = incrementDigitString(digits);
        keptInt = (carry ? ["1"] : []).concat(digits).join("");
      } else {
        const fracDigits = keptFrac.split("");
        let carry = incrementDigitString(fracDigits);
        keptFrac = fracDigits.join("");
        if (carry) {
          const intDigits = keptInt.split("");
          carry = incrementDigitString(intDigits);
          keptInt = (carry ? ["1"] : []).concat(intDigits).join("");
        }
      }
    }

    if (places > 0 && keptFrac.length < places) {
      keptFrac = keptFrac.padEnd(places, "0");
    }

    keptInt = keptInt.replace(/^0+(?=\d)/, "");

    let rounded = places > 0 ? keptInt + "," + keptFrac : keptInt;
    if (/^0(?:,0+)?$/.test(rounded)) sign = "";
    if (sign) rounded = sign + rounded;

    return { rounded, rule, nextDigit };
  }

  function readBraced(input, startIndex) {
    if (input[startIndex] !== "{") return null;
    let depth = 0;
    let content = "";
    for (let i = startIndex; i < input.length; i++) {
      const ch = input[i];
      if (ch === "{") {
        depth++;
        if (depth > 1) content += ch;
        continue;
      }
      if (ch === "}") {
        depth--;
        if (depth === 0) return { content, endIndex: i + 1 };
        content += ch;
        continue;
      }
      if (depth >= 1) content += ch;
    }
    return null;
  }

  function replaceMacro1(input, macro, render) {
    let out = "";
    let i = 0;
    while (i < input.length) {
      const at = input.indexOf(macro, i);
      if (at === -1) {
        out += input.slice(i);
        break;
      }
      out += input.slice(i, at);
      let j = at + macro.length;
      while (j < input.length && /\s/.test(input[j])) j++;
      const arg = readBraced(input, j);
      if (!arg) {
        out += macro;
        i = j;
        continue;
      }
      out += render(arg.content);
      i = arg.endIndex;
    }
    return out;
  }

  function replaceMacro2(input, macro, render) {
    let out = "";
    let i = 0;
    while (i < input.length) {
      const at = input.indexOf(macro, i);
      if (at === -1) {
        out += input.slice(i);
        break;
      }
      out += input.slice(i, at);
      let j = at + macro.length;
      while (j < input.length && /\s/.test(input[j])) j++;
      const a = readBraced(input, j);
      if (!a) {
        out += macro;
        i = j;
        continue;
      }
      j = a.endIndex;
      while (j < input.length && /\s/.test(input[j])) j++;
      const b = readBraced(input, j);
      if (!b) {
        out += macro + "{" + a.content + "}";
        i = j;
        continue;
      }
      out += render(a.content, b.content);
      i = b.endIndex;
    }
    return out;
  }

  function texToPlain(tex) {
    let s = String(tex || "");
    s = s.replace(/\\left/g, "").replace(/\\right/g, "");
    s = s.replace(/\\,/g, " ").replace(/\\;/g, " ").replace(/\\!/g, "");

    // Basic structure macros
    for (let pass = 0; pass < 4; pass++) {
      const before = s;
      s = replaceMacro2(s, "\\frac", (a, b) => `(${a})/(${b})`);
      s = replaceMacro1(s, "\\sqrt", (a) => `√(${a})`);
      if (s === before) break;
    }

    s = s.replace(/\\mathrm\{([^}]*)\}/g, "$1");

    // Common symbols
    s = s.replace(/\\approx/g, "≈");
    s = s.replace(/\\cdot/g, "·");
    s = s.replace(/\\times/g, "×");
    s = s.replace(/\\pi/g, "π");

    // Exponents/subscripts
    s = s.replace(/\^\{([^}]*)\}/g, "^$1");
    s = s.replace(/_\{([^}]*)\}/g, "_$1");

    // Remove remaining TeX commands (best-effort)
    s = s.replace(/\\[a-zA-Z]+/g, "");
    s = s.replace(/[{}]/g, "");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  function shouldSkipTeXTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return true;
    if (!node.nodeValue) return true;
    if (!/[\\$]/.test(node.nodeValue)) return true;

    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest("[data-tex],[data-tex-skip],.katex")) return true;

    const tag = parent.tagName;
    if (!tag) return true;
    const upper = tag.toUpperCase();
    if (
      upper === "SCRIPT" ||
      upper === "STYLE" ||
      upper === "TEXTAREA" ||
      upper === "PRE" ||
      upper === "CODE" ||
      upper === "KBD"
    ) {
      return true;
    }

    return false;
  }

  function parseDelimitedTeX(text) {
    const out = [];
    let i = 0;

    function isEscaped(index) {
      let backslashes = 0;
      for (let j = index - 1; j >= 0 && text[j] === "\\"; j--) backslashes++;
      return backslashes % 2 === 1;
    }

    function pushText(s) {
      if (s) out.push({ t: "text", v: s });
    }

    while (i < text.length) {
      let next = null;

      const idxParen = text.indexOf("\\(", i);
      if (idxParen !== -1) next = { kind: "inline", open: "\\(", close: "\\)", at: idxParen };

      const idxBracket = text.indexOf("\\[", i);
      if (idxBracket !== -1 && (!next || idxBracket < next.at)) {
        next = { kind: "block", open: "\\[", close: "\\]", at: idxBracket };
      }

      const idxDollars = text.indexOf("$$", i);
      if (idxDollars !== -1 && (!next || idxDollars < next.at)) {
        next = { kind: "block", open: "$$", close: "$$", at: idxDollars };
      }

      // Inline $...$ (best-effort; ignores escaped \$ and $$)
      const idxDollar = text.indexOf("$", i);
      if (idxDollar !== -1 && (!next || idxDollar < next.at)) {
        if (!isEscaped(idxDollar) && text[idxDollar + 1] !== "$") {
          next = { kind: "inline", open: "$", close: "$", at: idxDollar };
        }
      }

      if (!next) break;

      pushText(text.slice(i, next.at));

      const start = next.at + next.open.length;
      let end = -1;

      if (next.open === "$") {
        // Find a closing $ that is not escaped.
        for (let j = start; j < text.length; j++) {
          if (text[j] !== "$") continue;
          if (text[j + 1] === "$") continue;
          if (isEscaped(j)) continue;
          end = j;
          break;
        }
      } else {
        end = text.indexOf(next.close, start);
      }

      if (end === -1) {
        // Unclosed delimiter: keep as text.
        pushText(next.open);
        i = start;
        continue;
      }

      const raw = text.slice(start, end);
      const tex = raw.trim();
      if (!tex) {
        pushText(next.open + raw + next.close);
        i = end + next.close.length;
        continue;
      }

      out.push({ t: "tex", v: tex, display: next.kind === "block" });
      i = end + next.close.length;
    }

    pushText(text.slice(i));
    return out.length ? out : null;
  }

  function upgradeTeXDelimiters(root) {
    const scope = root || document;
    const walker = document.createTreeWalker(
      scope,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return shouldSkipTeXTextNode(node)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      },
      false,
    );

    const toProcess = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) toProcess.push(n);

    toProcess.forEach((textNode) => {
      const parts = parseDelimitedTeX(textNode.nodeValue || "");
      if (!parts) return;
      if (!parts.some((p) => p.t === "tex")) return;

      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (p.t === "text") {
          frag.appendChild(document.createTextNode(p.v));
          return;
        }
        const span = document.createElement("span");
        span.setAttribute("data-tex", p.v);
        if (p.display) span.setAttribute("data-display", "block");
        frag.appendChild(span);
      });

      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function renderTeX(root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll("[data-tex]");
    nodes.forEach((el) => {
      const tex = el.getAttribute("data-tex") || "";
      const displayMode = el.getAttribute("data-display") === "block";

      if (window.katex && typeof window.katex.render === "function") {
        try {
          window.katex.render(tex, el, {
            throwOnError: false,
            displayMode,
          });
          return;
        } catch (_) {
          // Fall through to text fallback.
        }
      }

      el.textContent = texToPlain(tex);
      el.classList.add("tex-fallback");
      if (displayMode) el.classList.add("tex-fallback--block");
    });
  }

  let katexLoadPromise = null;

  function loadStylesheetOnce(href) {
    if (!href) return;
    const existing = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error("missing src"));
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.getAttribute("data-loaded") === "1") return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("load failed")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.addEventListener(
        "load",
        () => {
          script.setAttribute("data-loaded", "1");
          resolve();
        },
        { once: true },
      );
      script.addEventListener("error", () => reject(new Error("load failed")), {
        once: true,
      });
      document.head.appendChild(script);
    });
  }

  function getTeXConfig() {
    const defaults = {
      localCss: "vendor/katex/katex.min.css",
      localJs: "vendor/katex/katex.min.js",
      allowCDN: true,
      cdnCss: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
      cdnJs: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js",
    };
    const user = window.MAPH_TEX && typeof window.MAPH_TEX === "object" ? window.MAPH_TEX : {};
    return Object.assign({}, defaults, user);
  }

  async function ensureKaTeX() {
    if (window.katex && typeof window.katex.render === "function") return true;
    if (katexLoadPromise) return katexLoadPromise;

    katexLoadPromise = (async () => {
      const cfg = getTeXConfig();

      // Local (offline) first
      try {
        loadStylesheetOnce(cfg.localCss);
        await loadScriptOnce(cfg.localJs);
        if (window.katex && typeof window.katex.render === "function") return true;
      } catch (_) {
        // Continue to CDN attempt below.
      }

      const canUseCDN =
        cfg.allowCDN && (location.protocol === "https:" || location.protocol === "http:");
      if (!canUseCDN) return false;

      try {
        loadStylesheetOnce(cfg.cdnCss);
        await loadScriptOnce(cfg.cdnJs);
        return Boolean(window.katex && typeof window.katex.render === "function");
      } catch (_) {
        return false;
      }
    })();

    return katexLoadPromise;
  }

  function probablyHasTeX(root) {
    const scope = root || document;
    if (scope.querySelector && scope.querySelector("[data-tex]")) return true;
    const text =
      (document.body && document.body.textContent) || (scope.textContent || "");
    return /\\\(|\\\[|\$\$/.test(text) || /(^|[^\\])\$(?!\$)/.test(text);
  }

  async function typesetTeX(root) {
    const scope = root || document;

    // Upgrade delimiter-style TeX into [data-tex] markup before rendering.
    upgradeTeXDelimiters(scope);

    const hasTeX = probablyHasTeX(scope);
    if (!hasTeX) return { katexLoaded: Boolean(window.katex) };

    const katexLoaded = await ensureKaTeX();
    renderTeX(scope);
    return { katexLoaded };
  }

  const MAPH = (window.MAPH = window.MAPH || {});
  Object.assign(MAPH, {
    normalizeNumberInput,
    parseLocaleNumber,
    formatCH,
    roundHalfUp,
    upgradeTeXDelimiters,
    renderTeX,
    ensureKaTeX,
    typesetTeX,
  });
})();
