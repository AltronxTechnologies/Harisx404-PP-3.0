import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { prepareImageForUpload } from "../app/lib/admin/prepare-image-upload.ts";

const source = readFileSync(new URL("../app/lib/admin/prepare-image-upload.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function browserConversion({ blob, delayed = false }) {
  const calls = { created: 0, revoked: 0, dimensions: null, deadline: null, finishBlob: null };
  const exports = {};
  class Image {
    naturalWidth = 4000;
    naturalHeight = 1000;
    set src(_url) { this.onload?.(); }
  }
  runInNewContext(compiled, {
    exports, window: { Image }, File,
    URL: {
      createObjectURL() { calls.created++; return "blob:test"; },
      revokeObjectURL(url) { assert.equal(url, "blob:test"); calls.revoked++; },
    },
    document: { createElement() { return {
      width: 0, height: 0,
      getContext() { return { drawImage() { calls.dimensions = [this.canvas.width, this.canvas.height]; }, canvas: this }; },
      toBlob(callback) { if (delayed) calls.finishBlob = () => callback(blob); else callback(blob); },
    }; } },
    setTimeout(callback) { calls.deadline = callback; return 1; },
    clearTimeout() {},
    console: { warn() {} },
  });
  return { calls, prepare: exports.prepareImageForUpload };
}

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

test("browser conversion returns real WebP bytes and releases the object URL", async () => {
  const { prepare, calls } = browserConversion({ blob: new Blob(["optimized"], { type: "image/webp" }) });
  const file = new File([new Uint8Array(900 * 1024)], "image.png", { type: "image/png" });
  const result = await prepare(file);
  assert.equal(result.name, "image.webp");
  assert.equal(result.type, "image/webp");
  assert.equal(calls.created, 1);
  assert.equal(calls.revoked, 1);
});

test("browser PNG fallback is not mislabeled as a WebP upload", async () => {
  const { prepare, calls } = browserConversion({ blob: new Blob(["not webp"], { type: "image/png" }) });
  const original = new File([new Uint8Array(900 * 1024)], "image.png", { type: "image/png" });
  assert.equal(await prepare(original), original);
  assert.equal(calls.revoked, 1);
});

test("timeout cleans up once and late encoder callbacks cannot change the result", async () => {
  const { prepare, calls } = browserConversion({ blob: new Blob(["optimized"], { type: "image/webp" }), delayed: true });
  const original = new File([new Uint8Array(900 * 1024)], "image.png", { type: "image/png" });
  const pending = prepare(original);
  calls.deadline();
  assert.equal(await pending, original);
  assert.equal(calls.revoked, 1, "timeout must release the object URL without waiting for encoding");
  calls.finishBlob();
  assert.equal(calls.revoked, 1);
});

test("large WebP files are left intact so animated images keep their frames", async () => {
  const { prepare, calls } = browserConversion({ blob: new Blob(["frame"], { type: "image/webp" }) });
  const original = new File([new Uint8Array(900 * 1024)], "animated.webp", { type: "image/webp" });
  assert.equal(await prepare(original), original);
  assert.equal(calls.created, 0);
});

test("generated WebP filenames stay within the server's 255-character limit", async () => {
  const { prepare } = browserConversion({ blob: new Blob(["optimized"], { type: "image/webp" }) });
  const original = new File([new Uint8Array(900 * 1024)], `${"a".repeat(251)}.png`, { type: "image/png" });
  const result = await prepare(original);
  assert.equal(result.type, "image/webp");
  assert.equal(result.name.length, 255);
});
