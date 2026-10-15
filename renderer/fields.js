// One field object off the wire, and how it reads.
//
// SimNavLog sends every value as {value, computed, suggestion, state, ...}.
// `value` is the pilot's ink; `computed` is the calculator's pencil. A cell
// shows ink when there is ink, and pencil otherwise -- the paper rule.

export function inkOrPencil(field) {
  if (!field) return { text: "", layer: "empty", state: null };
  if (present(field.value)) return { text: field.value, layer: "ink", state: field.state };
  if (present(field.computed)) return { text: field.computed, layer: "pencil", state: field.state };
  return { text: "", layer: "empty", state: field.state };
}

export function value(field) {
  return field ? (present(field.value) ? field.value : field.computed) : null;
}

function present(v) {
  return v !== null && v !== undefined && v !== "";
}

// The descriptor names a unit; the glyph is the renderer's to choose. An
// unknown unit shows its id rather than nothing, so a new one is visible.
//
// Numbers only. A text field (ETE "4:40", ETA "15:20Z") carries its own
// notation, and its `unit` says what it measures, not what to append.
const UNIT_SYMBOLS = {
  degree: "°",
  knot: "kt",
  foot: "ft",
  nautical_mile: "NM",
  gallon: "gal",
  gallon_per_hour: "gph",
  minute: "min",
  celsius: "°C",
};

export function unitSymbol(descriptor) {
  if (!descriptor || descriptor.type !== "number" || !descriptor.unit) return "";
  const unit = descriptor.unit;
  return UNIT_SYMBOLS[unit] || unit;
}
