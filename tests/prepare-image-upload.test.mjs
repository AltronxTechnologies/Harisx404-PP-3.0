import assert from "node:assert/strict";
import test from "node:test";
import { prepareImageForUpload } from "../app/lib/admin/prepare-image-upload.ts";

test("prepareImageForUpload passes through non-browser environments safely", async () => {
  const dummyFile = new File(["dummy content"], "test.png", { type: "image/png" });
  const result = await prepareImageForUpload(dummyFile);
  assert.equal(result, dummyFile);
});

test("prepareImageForUpload preserves SVGs, GIFs and small images", async () => {
  const svg = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
  const gif = new File(["GIF89a"], "anim.gif", { type: "image/gif" });
  const smallPng = new File(["tiny"], "small.png", { type: "image/png" });

  assert.equal(await prepareImageForUpload(svg), svg);
  assert.equal(await prepareImageForUpload(gif), gif);
  assert.equal(await prepareImageForUpload(smallPng), smallPng);
});
