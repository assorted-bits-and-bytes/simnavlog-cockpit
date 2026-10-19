// Every fixture is a payload SimNavLog would actually send: it validates
// against the RenderResponse schema in the vendored OpenAPI document. When
// the server's shape moves, `npm run contract:pull` brings the change in,
// and this fails until the fixtures (and the renderer) follow.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const contract = JSON.parse(readFileSync("contract/openapi.json", "utf8"));

// OpenAPI keeps its schemas under components/schemas; the document itself is
// registered as a schema so the `$ref`s inside it resolve.
const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema({ $id: "openapi", components: contract.components });
const validate = ajv.compile({ $ref: "openapi#/components/schemas/RenderResponse" });

const fixtures = readdirSync("fixtures").filter((f) => f.endsWith(".json"));

test("there are fixtures to check", () => {
  assert.ok(fixtures.length >= 2);
});

for (const file of fixtures) {
  test(`fixtures/${file} is a RenderResponse`, () => {
    const payload = JSON.parse(readFileSync(`fixtures/${file}`, "utf8"));
    const valid = validate(payload);

    assert.ok(valid, JSON.stringify(validate.errors?.slice(0, 5), null, 2));
  });
}
