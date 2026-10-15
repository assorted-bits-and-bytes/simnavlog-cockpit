// The harness: pick a fixture and a width, see the renderer draw it. No
// server and no simulator -- the fixtures are bundled in by `npm run build`.
//
// `?fixture=<name>&width=<id>` selects directly; the screenshot tests use it.
import { render } from "../renderer/index.js";
import { FIXTURES } from "../fixtures/index.js";
import { WIDTHS } from "./widths.js";

const params = new URLSearchParams(location.search);
const fixturePicker = document.getElementById("fixture");
const widthPicker = document.getElementById("width");
const stage = document.getElementById("stage");

Object.keys(FIXTURES).forEach((name) => fixturePicker.appendChild(option(name, name)));
WIDTHS.forEach((w) => widthPicker.appendChild(option(w.id, `${w.label}, ${w.px} px`)));

fixturePicker.value = params.get("fixture") || Object.keys(FIXTURES)[0];
widthPicker.value = params.get("width") || WIDTHS[0].id;
fixturePicker.addEventListener("change", draw);
widthPicker.addEventListener("change", draw);
draw();

function draw() {
  const width = WIDTHS.find((w) => w.id === widthPicker.value);
  stage.style.width = `${width.px}px`;
  render(stage, FIXTURES[fixturePicker.value]);
}

function option(value, label) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = label;
  return el;
}
