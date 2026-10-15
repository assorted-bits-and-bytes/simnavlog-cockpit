/*
 * The #206 probe: what the MSFS 2024 EFB's engine (Coherent GT) can do.
 *
 * Written in ES5 plus Promise on purpose. It probes the engine's syntax
 * ceiling, so it must not itself depend on what it is measuring: every
 * newer construct is tried inside `new Function`, where a SyntaxError is a
 * result rather than a crash.
 *
 * Results go on screen as a table, and as one JSON block to copy or
 * photograph. Nothing needs the Coherent debugger. The same file runs in
 * an ordinary browser (spike/index.html), which is how it is checked.
 *
 *     SimNavLogProbe.run(container, { fontBaseUrl: "Assets/fonts" });
 */
(function (root) {
  "use strict";

  var CORS_URL = "https://simnavlog.com/api/v1/openapi.json";
  var NO_CORS_URL = "https://simnavlog.com/health";
  var STORAGE_KEY = "simnavlog-probe:last-run";
  var FETCH_TIMEOUT_MS = 10000;
  var FONT_WAIT_MS = 4000;

  // ---------------------------------------------------------------- results

  function result(group, name, value, verdict) {
    return { group: group, name: name, value: value, verdict: verdict };
  }

  function yesNo(bool) {
    return bool ? "yes" : "no";
  }

  // ------------------------------------------------------------- the engine

  function environment(container) {
    var rect = container.getBoundingClientRect();
    var de = document.documentElement;

    return [
      result("env", "userAgent", navigator.userAgent, "info"),
      result(
        "env",
        "window.innerWidth x innerHeight",
        window.innerWidth + " x " + window.innerHeight,
        "info"
      ),
      result(
        "env",
        "documentElement.clientWidth x clientHeight",
        de.clientWidth + " x " + de.clientHeight,
        "info"
      ),
      result("env", "screen.width x height", screen.width + " x " + screen.height, "info"),
      result("env", "devicePixelRatio", String(window.devicePixelRatio), "info"),
      result(
        "env",
        "probe container width x height",
        Math.round(rect.width) + " x " + Math.round(rect.height),
        "info"
      ),
      result("env", "location.href", String(location.href), "info"),
    ];
  }

  // ------------------------------------------------------------- JS syntax

  var SYNTAX = [
    ["arrow functions", "return (() => 1)() === 1;"],
    ["let/const + block scope", "let a = 1; { const a = 2; } return a === 1;"],
    ["class", "class A { m() { return 1; } } return new A().m() === 1;"],
    ["template literals", "var x = 1; return `${x}` === '1';"],
    ["destructuring", "var { a, b: [c] } = { a: 1, b: [2] }; return a + c === 3;"],
    ["for...of", "var n = 0; for (var v of [1, 2]) n += v; return n === 3;"],
    ["async/await", "return typeof (async function () { await 1; }) === 'function';"],
    ["object spread", "var o = { ...{ a: 1 } }; return o.a === 1;"],
    ["optional chaining ?.", "var o = null; return o?.x === undefined;"],
    ["nullish ??", "return (null ?? 2) === 2;"],
    ["exponent **", "return 2 ** 3 === 8;"],
    ["BigInt literal", "return typeof 1n === 'bigint';"],
  ];

  function syntaxProbes() {
    return SYNTAX.map(function (entry) {
      var ok;
      try {
        ok = new Function(entry[1])() === true;
      } catch (e) {
        ok = false;
      }
      return result("js", entry[0], yesNo(ok), ok ? "ok" : "missing");
    });
  }

  var APIS = [
    [
      "fetch",
      function () {
        return typeof fetch === "function";
      },
    ],
    [
      "Promise.prototype.finally",
      function () {
        return typeof Promise.prototype.finally === "function";
      },
    ],
    [
      "Array.prototype.includes",
      function () {
        return typeof Array.prototype.includes === "function";
      },
    ],
    [
      "Object.entries",
      function () {
        return typeof Object.entries === "function";
      },
    ],
    [
      "globalThis",
      function () {
        return typeof globalThis !== "undefined";
      },
    ],
    [
      "CSS.supports",
      function () {
        return !!(window.CSS && CSS.supports);
      },
    ],
    [
      "ResizeObserver",
      function () {
        return typeof ResizeObserver === "function";
      },
    ],
    [
      "IntersectionObserver",
      function () {
        return typeof IntersectionObserver === "function";
      },
    ],
    [
      "BroadcastChannel",
      function () {
        return typeof BroadcastChannel === "function";
      },
    ],
    [
      "structuredClone",
      function () {
        return typeof structuredClone === "function";
      },
    ],
    [
      "document.fonts",
      function () {
        return !!document.fonts;
      },
    ],
    [
      "Intl.DateTimeFormat timeZone UTC",
      function () {
        return (
          new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit" }).format(
            new Date(0)
          ) === "00"
        );
      },
    ],
  ];

  function apiProbes() {
    return APIS.map(function (entry) {
      var ok;
      try {
        ok = entry[1]() === true;
      } catch (e) {
        ok = false;
      }
      return result("js", entry[0], yesNo(ok), ok ? "ok" : "missing");
    });
  }

  // -------------------------------------------------------------------- CSS

  // `CSS.supports` reports what the parser accepts; the box is what the
  // engine draws. They can disagree, so each feature is asked both ways
  // and the rendered answer is the one that counts.
  var CSS_FEATURES = [
    {
      name: "display: grid",
      supports: "display: grid",
      html: '<div style="display:grid;grid-template-columns:10px 20px"><i></i><b></b></div>',
      rendered: function (box) {
        return box.querySelector("b").offsetLeft - box.firstChild.offsetLeft === 10;
      },
    },
    {
      name: "flex gap",
      supports: "gap: 7px",
      html: '<div style="display:flex;gap:7px"><i style="width:5px"></i><b style="width:5px"></b></div>',
      rendered: function (box) {
        return box.querySelector("b").offsetLeft - box.firstChild.offsetLeft === 12;
      },
    },
    {
      name: "flexbox",
      supports: "display: flex",
      html: '<div style="display:flex"><i style="width:5px"></i><b style="width:5px"></b></div>',
      rendered: function (box) {
        return box.querySelector("b").offsetLeft - box.firstChild.offsetLeft === 5;
      },
    },
    {
      name: ":has()",
      supports: "selector(:has(b))",
      style: ".probe-has:has(b) { width: 13px; }",
      html: '<div class="probe-has"><b></b></div>',
      rendered: function (box) {
        return box.firstChild.offsetWidth === 13;
      },
    },
    {
      name: ":where()",
      supports: "selector(:where(b))",
      style: ":where(.probe-where) { width: 11px; }",
      html: '<div class="probe-where"></div>',
      rendered: function (box) {
        return box.firstChild.offsetWidth === 11;
      },
    },
    {
      name: "position: sticky",
      supports: "position: sticky",
      html: '<div style="position:sticky;top:0"></div>',
      rendered: function (box) {
        return getComputedStyle(box.firstChild).position === "sticky";
      },
    },
    {
      name: "inset shorthand",
      supports: "inset: 3px",
      html: '<div style="position:relative;height:20px"><b style="position:absolute;inset:3px"></b></div>',
      rendered: function (box) {
        return box.querySelector("b").offsetTop === 3;
      },
    },
    {
      name: "revert keyword",
      supports: "display: revert",
      // Declared after display:block, so an engine that drops `revert`
      // keeps the block, and one that knows it reverts <b> to inline.
      html: '<b style="display:block;display:revert"></b>',
      rendered: function (box) {
        return getComputedStyle(box.firstChild).display === "inline";
      },
    },
    {
      name: "custom properties var()",
      supports: "--probe: 1px",
      html: '<div style="--w:9px;width:var(--w)"></div>',
      rendered: function (box) {
        return box.firstChild.offsetWidth === 9;
      },
    },
    {
      name: "calc()",
      supports: "width: calc(1px + 2px)",
      html: '<div style="width:calc(4px + 4px)"></div>',
      rendered: function (box) {
        return box.firstChild.offsetWidth === 8;
      },
    },
    {
      name: "rgb() space syntax with /alpha",
      supports: "color: rgb(0 0 0 / 18%)",
      html: '<div style="color:rgb(255 0 0 / 50%)"></div>',
      rendered: function (box) {
        return /255,\s*0,\s*0,\s*0\.5/.test(getComputedStyle(box.firstChild).color);
      },
    },
    {
      name: "table-layout: fixed + colgroup",
      supports: "table-layout: fixed",
      html:
        '<table style="table-layout:fixed;width:100px;border-collapse:collapse"><colgroup><col style="width:30px"><col></colgroup>' +
        '<tr><td style="padding:0"></td><td style="padding:0"></td></tr></table>',
      rendered: function (box) {
        return box.querySelector("td").offsetWidth === 30;
      },
    },
    {
      name: "wavy text-decoration",
      supports: "text-decoration: underline wavy red",
      html: '<span style="text-decoration:underline wavy red">x</span>',
      rendered: function (box) {
        return getComputedStyle(box.firstChild).textDecorationStyle === "wavy";
      },
    },
  ];

  function cssProbes(container) {
    var sandbox = document.createElement("div");
    sandbox.style.cssText = "position:absolute;left:-10000px;top:0;width:500px";
    var style = document.createElement("style");
    style.textContent = CSS_FEATURES.map(function (f) {
      return f.style || "";
    }).join("\n");
    container.appendChild(style);
    container.appendChild(sandbox);

    var rows = CSS_FEATURES.map(function (feature) {
      var parsed = "n/a";
      try {
        if (window.CSS && CSS.supports) parsed = yesNo(CSS.supports(feature.supports));
      } catch (e) {
        parsed = "threw";
      }

      var box = document.createElement("div");
      box.innerHTML = feature.html;
      sandbox.appendChild(box);
      var drawn;
      try {
        drawn = feature.rendered(box);
      } catch (e) {
        drawn = false;
      }

      return result(
        "css",
        feature.name,
        "drawn " + yesNo(drawn) + ", supports() " + parsed,
        drawn ? "ok" : "missing"
      );
    });

    container.removeChild(sandbox);
    container.removeChild(style);
    return rows;
  }

  // -------------------------------------------------------------------- SVG

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgProbes(container) {
    var holder = document.createElement("div");
    holder.style.cssText = "position:absolute;left:-10000px;top:0";
    holder.innerHTML =
      '<svg width="0" height="0" style="position:absolute"><symbol id="probe-sym" viewBox="0 0 10 10"><rect width="10" height="10"/></symbol></svg>' +
      '<svg id="probe-href" width="20" height="20"><use href="#probe-sym" width="20" height="20"/></svg>' +
      '<svg id="probe-xlink" width="20" height="20"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#probe-sym" width="20" height="20"/></svg>';
    container.appendChild(holder);

    function drawn(id) {
      try {
        var use = holder.querySelector("#" + id + " use");
        var bbox = use.getBBox();
        return bbox.width > 0;
      } catch (e) {
        return false;
      }
    }

    var inline = !!(
      document.createElementNS && document.createElementNS(SVG_NS, "svg").createSVGRect
    );
    var rows = [
      result("svg", "inline <svg>", yesNo(inline), inline ? "ok" : "missing"),
      result(
        "svg",
        "<use href>",
        yesNo(drawn("probe-href")),
        drawn("probe-href") ? "ok" : "missing"
      ),
      result(
        "svg",
        "<use xlink:href>",
        yesNo(drawn("probe-xlink")),
        drawn("probe-xlink") ? "ok" : "missing"
      ),
    ];
    container.removeChild(holder);
    return rows;
  }

  // ------------------------------------------------------------------ fonts

  // One family per format, so each is loaded or not on its own. Loaded is
  // measured, not asked: the sample's width moves off the fallback's.
  var FONT_FORMATS = [
    ["woff2", "woff2"],
    ["woff", "woff"],
    ["ttf", "truetype"],
  ];
  var FONT_SAMPLE = "Just Another Hand 0123456789 ESSB-ESGJ";

  function fontProbes(container, baseUrl) {
    var style = document.createElement("style");
    style.textContent = FONT_FORMATS.map(function (f) {
      return (
        "@font-face { font-family: 'ProbeHand-" +
        f[0] +
        "'; " +
        "src: url('" +
        baseUrl +
        "/JustAnotherHand-latin." +
        f[0] +
        "') format('" +
        f[1] +
        "'); }"
      );
    }).join("\n");
    container.appendChild(style);

    var line = document.createElement("div");
    line.style.cssText = "position:absolute;left:-10000px;top:0;white-space:nowrap;font-size:40px";
    container.appendChild(line);

    function width(family) {
      var span = document.createElement("span");
      span.style.fontFamily = family;
      span.textContent = FONT_SAMPLE;
      line.appendChild(span);
      return span;
    }

    var fallback = width("monospace");
    var spans = FONT_FORMATS.map(function (f) {
      return width("'ProbeHand-" + f[0] + "', monospace");
    });

    return new Promise(function (resolve) {
      setTimeout(function () {
        var base = fallback.offsetWidth;
        var rows = FONT_FORMATS.map(function (f, i) {
          var w = spans[i].offsetWidth;
          var loaded = w !== base;
          return result(
            "font",
            "@font-face " + f[0],
            (loaded ? "loaded" : "not loaded") + " (" + w + " px vs fallback " + base + " px)",
            loaded ? "ok" : "missing"
          );
        });
        container.removeChild(line);
        container.removeChild(style);
        resolve(rows);
      }, FONT_WAIT_MS);
    });
  }

  // ---------------------------------------------------------------- network

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("timed out after " + FETCH_TIMEOUT_MS + " ms"));
      }, FETCH_TIMEOUT_MS);
      promise.then(
        function (v) {
          clearTimeout(timer);
          resolve(v);
        },
        function (e) {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }

  function describeError(e) {
    return (e && e.name + ": " + e.message) || String(e);
  }

  // The question the whole epic hangs on: a body, from our own origin,
  // through CORS. The control must be refused, or the engine is not
  // enforcing CORS and the first answer means less than it seems.
  function fetchProbes() {
    if (typeof fetch !== "function") {
      return Promise.resolve([result("net", "fetch", "fetch is not defined", "missing")]);
    }

    var started = Date.now();
    var cors = withTimeout(fetch(CORS_URL)).then(
      function (response) {
        return response.text().then(function (body) {
          var version = "?";
          try {
            version = JSON.parse(body).openapi;
          } catch (e) {
            version = "not JSON";
          }
          var ok = response.status === 200 && body.length > 0;
          return result(
            "net",
            "fetch, CORS * (" + CORS_URL + ")",
            "status " +
              response.status +
              ", " +
              body.length +
              " bytes, openapi " +
              version +
              ", " +
              (Date.now() - started) +
              " ms",
            ok ? "ok" : "missing"
          );
        });
      },
      function (e) {
        return result(
          "net",
          "fetch, CORS * (" + CORS_URL + ")",
          "failed: " + describeError(e),
          "missing"
        );
      }
    );

    var control = withTimeout(fetch(NO_CORS_URL)).then(
      function (response) {
        return result(
          "net",
          "control: no CORS header (" + NO_CORS_URL + ")",
          "NOT refused: status " + response.status + " (CORS is not enforced)",
          "info"
        );
      },
      function (e) {
        return result(
          "net",
          "control: no CORS header (" + NO_CORS_URL + ")",
          "refused as expected: " + describeError(e),
          "ok"
        );
      }
    );

    var opaque = withTimeout(fetch(NO_CORS_URL, { mode: "no-cors" })).then(
      function (response) {
        return response.text().then(function (body) {
          return result(
            "net",
            "control with mode: no-cors",
            "type " + response.type + ", status " + response.status + ", " + body.length + " bytes",
            "info"
          );
        });
      },
      function (e) {
        return result("net", "control with mode: no-cors", "failed: " + describeError(e), "info");
      }
    );

    var xhr = new Promise(function (resolve) {
      var req = new XMLHttpRequest();
      req.open("GET", CORS_URL);
      req.timeout = FETCH_TIMEOUT_MS;
      req.onload = function () {
        resolve(
          result(
            "net",
            "XMLHttpRequest, CORS *",
            "status " + req.status + ", " + req.responseText.length + " bytes",
            req.status === 200 ? "ok" : "missing"
          )
        );
      };
      req.onerror = function () {
        resolve(result("net", "XMLHttpRequest, CORS *", "error event", "missing"));
      };
      req.ontimeout = function () {
        resolve(result("net", "XMLHttpRequest, CORS *", "timed out", "missing"));
      };
      req.send();
    });

    return Promise.all([cors, control, opaque, xhr]);
  }

  // ---------------------------------------------------------------- storage

  // Run the probe, restart the sim, run it again: if "previous run" shows
  // the first run's stamp, localStorage survives a restart (research §9.6).
  function storageProbes() {
    var rows = [];
    try {
      var previous = localStorage.getItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      rows.push(result("storage", "localStorage writable", "yes", "ok"));
      rows.push(
        result(
          "storage",
          "localStorage previous run",
          previous || "none (first run, or not kept)",
          "info"
        )
      );
    } catch (e) {
      rows.push(result("storage", "localStorage", "threw: " + describeError(e), "missing"));
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
      rows.push(result("storage", "sessionStorage writable", "yes", "ok"));
    } catch (e) {
      rows.push(result("storage", "sessionStorage", "threw: " + describeError(e), "missing"));
    }
    return rows;
  }

  // ----------------------------------------------------------------- output

  var COLOURS = { ok: "#15803d", missing: "#b91c1c", info: "#1e3a8a" };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(container, build, rows) {
    var table = rows
      .map(function (r) {
        return (
          '<tr><td style="padding:2px 8px;color:#555">' +
          r.group +
          "</td>" +
          '<td style="padding:2px 8px">' +
          escapeHtml(r.name) +
          "</td>" +
          '<td style="padding:2px 8px;color:' +
          COLOURS[r.verdict] +
          '">' +
          escapeHtml(r.value) +
          "</td></tr>"
        );
      })
      .join("");

    var json = JSON.stringify(
      {
        probe: "simnavlog #206",
        build: build,
        at: new Date().toISOString(),
        results: rows.map(function (r) {
          return [r.group, r.name, r.value];
        }),
      },
      null,
      1
    );

    container.innerHTML =
      '<div style="font:16px/1.35 sans-serif;color:#111;background:#fbfaf6;padding:12px;height:100%;overflow:auto;box-sizing:border-box">' +
      '<h2 style="margin:0 0 8px">SimNavLog probe <span style="font-weight:normal">build ' +
      escapeHtml(build) +
      "</span></h2>" +
      '<table style="border-collapse:collapse;margin-bottom:12px">' +
      table +
      "</table>" +
      '<pre style="font:12px/1.2 monospace;white-space:pre-wrap;user-select:text">' +
      escapeHtml(json) +
      "</pre></div>";

    if (root.console) console.log("SIMNAVLOG_PROBE " + json);
  }

  function run(container, options) {
    var opts = options || {};
    var build = opts.build || "unknown";
    container.innerHTML =
      '<div style="font:20px sans-serif;padding:12px">SimNavLog probe ' +
      escapeHtml(build) +
      ": running…</div>";

    var sync = [].concat(
      environment(container),
      syntaxProbes(),
      apiProbes(),
      cssProbes(container),
      svgProbes(container),
      storageProbes()
    );

    return Promise.all([
      fetchProbes(),
      fontProbes(container, opts.fontBaseUrl || "Assets/fonts"),
    ]).then(function (settled) {
      var rows = sync.concat(settled[0], settled[1]);
      render(container, build, rows);
      return rows;
    });
  }

  root.SimNavLogProbe = { run: run };
})(typeof window !== "undefined" ? window : this);
