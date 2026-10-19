// The SimNavLog renderer: one payload in, one nav log drawn into a container.
//
//     SimNavLogRenderer.render(document.getElementById("navlog"), payload);
//
// The payload is SimNavLog's render projection, `GET /api/v1/plans/:id/render`,
// described by the RenderResponse schema in contract/openapi.json. Nothing here
// computes: every figure is the server's, every unit comes from the payload's
// `fields` descriptor.
//
// This is the skeleton (#197): identity, a bare legs table, the disclaimer
// and the credits -- enough to prove fixture -> render -> screenshot. The
// card proper is #198/#199, the timeline #200.

import { inkOrPencil, unitSymbol, value } from "./fields.js";

const LEG_COLUMNS = [
  "altitude",
  "tc",
  "wca",
  "th",
  "mh",
  "leg_dist",
  "tas",
  "gs_est",
  "ete",
  "eta",
  "fuel_burn",
];

const COLUMN_LABELS = {
  altitude: "ALT",
  tc: "TC",
  wca: "WCA",
  th: "TH",
  mh: "MH",
  leg_dist: "Dist",
  tas: "TAS",
  gs_est: "GS",
  ete: "ETE",
  eta: "ETA",
  fuel_burn: "Fuel",
};

export function render(container, payload) {
  const plan = payload.plan;
  const fields = payload.fields || {};
  const waypoints = activeWaypoints(plan.waypoints);

  container.innerHTML = "";
  const sheet = element("div", "snl-sheet");
  sheet.appendChild(header(plan, waypoints));
  sheet.appendChild(legTable(waypoints, plan.legs, fields));
  sheet.appendChild(footer(payload));
  container.appendChild(sheet);
}

// A trailing blank row is the editor's affordance, not part of the route.
// What the server sends is settled, but a renderer someone else feeds should
// not draw a sentinel either: a row without a position is not a checkpoint.
function activeWaypoints(waypoints) {
  return waypoints.filter((wp) => value(wp.lat) !== null && value(wp.lon) !== null);
}

function header(plan, waypoints) {
  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];
  const info = plan.flight_info || {};
  const aircraft = plan.aircraft || {};

  const head = element("div", "snl-header");
  head.appendChild(element("div", "snl-title", value(info.route_name) || plan.label || "Nav log"));
  head.appendChild(
    element(
      "div",
      "snl-meta",
      [
        `${checkpointName(first)} → ${checkpointName(last)}`,
        value(info.date),
        value(info.etd) && `ETD ${value(info.etd)}`,
        [value(aircraft.type), value(aircraft.registration)].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(" · ")
    )
  );
  return head;
}

function legTable(waypoints, legs, fields) {
  const table = element("table", "snl-legs");
  const head = element("tr");
  head.appendChild(element("th", "snl-checkpoint", "Checkpoint"));
  LEG_COLUMNS.forEach((key) => {
    const unit = unitSymbol(fields[key]);
    head.appendChild(
      element("th", null, unit ? `${COLUMN_LABELS[key]} ${unit}` : COLUMN_LABELS[key])
    );
  });
  table.appendChild(head);

  waypoints.forEach((wp, i) => {
    const row = element("tr", "snl-waypoint");
    row.appendChild(element("td", "snl-checkpoint", checkpointName(wp)));
    LEG_COLUMNS.forEach((key) =>
      row.appendChild(cell(i > 0 ? legs[i - 1] && legs[i - 1][key] : null))
    );
    table.appendChild(row);
  });
  return table;
}

function cell(field) {
  const shown = inkOrPencil(field);
  const classes = ["snl-cell", `snl-${shown.layer}`];
  if (shown.state) classes.push(`snl-state-${shown.state}`);
  return element("td", classes.join(" "), String(shown.text));
}

// A user-placed point has no ident and often no name; its position is then
// the only honest label.
function checkpointName(wp) {
  if (!wp) return "";
  const name = value(wp.name);
  const ident = value(wp.ident);
  if (ident && name) return `${ident} ${name}`;
  if (ident || name) return ident || name;
  return `${value(wp.lat).toFixed(3)}, ${value(wp.lon).toFixed(3)}`;
}

function footer(payload) {
  const foot = element("div", "snl-footer");
  foot.appendChild(element("div", "snl-disclaimer", payload.disclaimer || ""));
  // One line, as the nav log's own footer prints it. Several of these
  // licences make attribution a condition of use, so it is always drawn.
  const credits = (payload.credits || []).map((c) => `${c.name} (${c.credit})`);
  if (credits.length)
    foot.appendChild(element("div", "snl-credits", `Data sources: ${credits.join(" · ")}`));
  return foot;
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}
