import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { prepareImageForUpload } from "../app/lib/admin/prepare-image-upload.ts";

const source = readFileSync(new URL("../app/lib/admin/prepare-image-upload.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function browserConversion({ blob, delayed = false }) {
  const calls = { created: 0, revoked: 0, dimensions: null, deadline: null, finishBlob: null, quality: null, encodes: 0 };
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
      toBlob(callback, _type, quality) { calls.encodes++; calls.quality = quality; if (delayed) calls.finishBlob = () => callback(blob); else callback(blob); },
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
  for (let attempt = 0; attempt < 20 && !calls.deadline; attempt++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(typeof calls.deadline, "function");
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

test("a still image close to a guessed proxy threshold keeps the first high-quality WebP encode", async () => {
  const converted = new Blob([new Uint8Array(850 * 1024)], { type: "image/webp" });
  const { prepare, calls } = browserConversion({ blob: converted });
  const original = new File([new Uint8Array(1500 * 1024)], "photo.jpg", { type: "image/jpeg" });
  const result = await prepare(original);
  assert.equal(result.size, converted.size);
  assert.equal(result.type, "image/webp");
  assert.equal(calls.quality, 0.94);
  assert.equal(calls.encodes, 1, "a second encode risks returning the larger original on timeout");
  assert.equal(calls.revoked, 1);
});

test("the shared Admin upload policy has no guessed client-only cap below the route limit", () => {
  for (const path of ["../app/components/admin/ProjectForm.tsx", "../app/components/admin/MediaPickerModal.tsx", "../app/components/admin/BlogImageManager.tsx", "../app/admin/(dashboard)/media/page.tsx"]) {
    const caller = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(caller, /4\.5 \* 1024 \* 1024|SAFE_UPLOAD_THRESHOLD_BYTES/, path);
  }
  const route = readFileSync(new URL("../app/api/admin/media/upload/route.ts", import.meta.url), "utf8");
  assert.match(route, /file\.size > 20 \* 1024 \* 1024/);
});

test("generated WebP filenames stay within the server's 255-character limit", async () => {
  const { prepare } = browserConversion({ blob: new Blob(["optimized"], { type: "image/webp" }) });
  const original = new File([new Uint8Array(900 * 1024)], `${"a".repeat(251)}.png`, { type: "image/png" });
  const result = await prepare(original);
  assert.equal(result.type, "image/webp");
  assert.equal(result.name.length, 255);
});

test("small still JPEG and PNG images become high-quality WebP when smaller", async () => {
  for (const [name, type] of [["portrait.jpg", "image/jpeg"], ["photo.png", "image/png"]]) {
    const { prepare, calls } = browserConversion({ blob: new Blob(["smaller image"], { type: "image/webp" }) });
    const original = new File([new Uint8Array(120 * 1024)], name, { type });
    const result = await prepare(original);
    assert.equal(result.type, "image/webp", name);
    assert.ok(result.size < original.size);
    assert.equal(calls.quality, 0.94);
  }
});

test("a larger WebP or already efficient AVIF stays in its original format", async () => {
  const original = new File([new Uint8Array(120 * 1024)], "portrait.jpg", { type: "image/jpeg" });
  const larger = browserConversion({ blob: new Blob([new Uint8Array(150 * 1024)], { type: "image/webp" }) });
  assert.equal(await larger.prepare(original), original);
  const avif = new File([new Uint8Array(900 * 1024)], "photo.avif", { type: "image/avif" });
  const efficient = browserConversion({ blob: new Blob(["still"], { type: "image/webp" }) });
  assert.equal(await efficient.prepare(avif), avif);
  assert.equal(efficient.calls.created, 0);
});

test("animated PNGs are not flattened by canvas conversion", async () => {
  const header = new Uint8Array(65);
  header.set([137, 80, 78, 71, 13, 10, 26, 10]);
  header.set([0, 0, 0, 13, 73, 72, 68, 82], 8); // IHDR
  header.set([0, 0, 0, 8, 97, 99, 84, 76], 33); // acTL before IDAT
  header.set([0, 0, 0, 0, 73, 68, 65, 84], 53); // IDAT
  const file = new File([header, new Uint8Array(900 * 1024)], "animated.png", { type: "image/png" });
  const { prepare, calls } = browserConversion({ blob: new Blob(["smaller"], { type: "image/webp" }) });
  assert.equal(await prepare(file), file);
  assert.equal(calls.created, 0);
});
