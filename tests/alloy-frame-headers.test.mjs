import assert from "node:assert/strict";
import test from "node:test";
import config from "../next.config.mjs";

test("Alloy preview can be embedded while normal deployments remain frame-protected", async () => {
  const previous = process.env.IS_ALLOY;
  try {
    process.env.IS_ALLOY = "true";
    let headers = (await config.headers())[0].headers;
    assert.equal(headers.some(({ key }) => key.toLowerCase() === "x-frame-options"), false);
    assert.equal(headers.some(({ key }) => key.toLowerCase() === "x-content-type-options"), true);

    process.env.IS_ALLOY = "false";
    headers = (await config.headers())[0].headers;
    assert.equal(headers.find(({ key }) => key.toLowerCase() === "x-frame-options")?.value, "SAMEORIGIN");
  } finally {
    if (previous === undefined) delete process.env.IS_ALLOY;
    else process.env.IS_ALLOY = previous;
  }
});
