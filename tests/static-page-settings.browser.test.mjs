import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

test("static Buildlog and Community Wall copy matches currently published settings", { skip: process.env.RUN_STATIC_PAGE_SETTINGS_REVIEW !== "1" }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Public settings comparison is unavailable");
  const db = createClient(url, anon, { auth: { persistSession: false } });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    let errors = 0;
    page.on("pageerror", () => { errors++; });
    const differences = [];
    for (const [route, table, labelId] of [
      ["buildlog", "public_buildlog_settings", "buildlog-collection-heading"],
      ["community-wall", "public_community_wall_settings", "community-wall-heading"],
    ]) {
      const { data: settings, error } = await db.from(table).select("*").single();
      if (error || !settings) throw new Error("Published settings comparison unavailable");
      const response = await page.goto(`http://localhost:3000/${route}`, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200);
      await page.locator(`#${labelId}`).waitFor();
      const visible = await page.evaluate((id) => {
        const heading = document.querySelector("main header h1");
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
          ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
          twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content"),
          kicker: document.querySelector("main header p")?.textContent?.trim(),
          heading: heading?.textContent?.replace(/\s+/g, " ").trim(),
          label: document.getElementById(id)?.textContent?.trim(),
        };
      }, labelId);
      for (const [field, matches] of [
        ["kicker", visible.kicker === settings.kicker],
        ["heading", visible.heading === `${settings.heading} ${settings.heading_accent}`],
        ["collection", visible.label === (settings.archive_label || settings.collection_label)],
        ["title", visible.title?.includes(settings.seo_title)],
        ["description", visible.description === settings.seo_description],
        ["og", visible.ogTitle === settings.seo_title],
        ["twitter", visible.twitterTitle === settings.seo_title],
      ]) if (!matches) differences.push(`${route}:${field}`);
    }
    assert.equal(errors, 0);
    assert.deepEqual(differences, []);
    console.log(JSON.stringify({ pages: 2, comparedFields: 14, pageErrors: errors, differences }));
  } finally {
    await browser.close();
  }
});
