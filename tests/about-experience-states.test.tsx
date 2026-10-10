import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("About does not show static roles when Admin has no published experience or the read fails", async () => {
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const { Resume } = await import("../app/components/Resume");
  const empty = renderToStaticMarkup(<Resume experiences={[]} />);
  const unavailable = renderToStaticMarkup(<Resume experiences={null} />);
  const disconnectedPreview = renderToStaticMarkup(<Resume />);

  assert.match(empty, /No experience details to show right now/);
  assert.doesNotMatch(empty, /Freelance/);
  assert.match(unavailable, /Experience is temporarily unavailable/);
  assert.doesNotMatch(unavailable, /Freelance/);
  assert.match(disconnectedPreview, /Freelance/);
});

test("an Experience read failure is not cached as an empty published collection", async () => {
  const [reader, about] = await Promise.all([
    readFile(new URL("../app/lib/utils.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8"),
  ]);
  const fetcher = reader.slice(reader.indexOf("export async function fetchExperiences()"));
  assert.match(fetcher, /if \(!supabase\) throw new Error\("Experience data is unavailable\."\)/);
  assert.match(fetcher, /if \(error \|\| !data\) throw new Error\("Experience data is unavailable\."\)/);
  assert.match(about, /fetchCachedExperiences\(\)\.catch\(\(\) => null\)/);
  assert.match(about, /process\.env\.NODE_ENV === "development" && !getSupabaseEnv\(\)/);
});
