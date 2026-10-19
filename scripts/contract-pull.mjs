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

writeFileSync("contract/openapi.json", JSON.stringify(document, null, 2) + "\n");
console.log(`contract/openapi.json: OpenAPI ${document.openapi} from ${url}`);
