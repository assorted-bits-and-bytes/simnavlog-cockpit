// Vendor SimNavLog's OpenAPI document into contract/openapi.json.
//
//   npm run contract:pull                       from simnavlog.com
//   npm run contract:pull -- http://localhost:4000/api/v1/openapi.json
//
// The document is the contract: `npm test` validates every fixture against
// its RenderResponse schema. Pull, then commit the diff, so a change on the
// server side shows up here as a reviewed edit, not as a surprise.
import { writeFileSync } from "node:fs";

const url = process.argv[2] || "https://simnavlog.com/api/v1/openapi.json";
const response = await fetch(url);
if (!response.ok) throw new Error(`${url} answered ${response.status}`);

const document = await response.json();
if (!document.components?.schemas?.RenderResponse) {
  throw new Error(`${url} has no RenderResponse schema: is the server older than #201?`);
}

writeFileSync("contract/openapi.json", JSON.stringify(canonical(document), null, 2) + "\n");
// Object keys sorted at every depth. The server builds this document from
// Elixir maps, whose key order is not part of the contract and can differ
// between its builds; without this, a pull would diff where nothing changed.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

console.log(`contract/openapi.json: OpenAPI ${document.openapi} from ${url}`);
