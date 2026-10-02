import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.BLOG_BASE_URL || "http://localhost:3000";

test("reaction section aligns to the reading column and keeps every label visible", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext();
      await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const page = await context.newPage();
      try {
        await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
        await page.locator('[aria-labelledby="article-reactions-heading"] button').first().waitFor({ state: "visible" });
        await page.evaluate(() => document.fonts.ready);
        for (const width of [320, 360, 390, 640, 767, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForFunction(() => {
            const section = document.querySelector('[aria-labelledby="article-reactions-heading"]');
            const rule = section?.querySelector("h2")?.parentElement;
            const toolbar = section?.querySelector(".grid");
            return rule && toolbar
              && Math.abs(rule.getBoundingClientRect().left - toolbar.getBoundingClientRect().left) < 1
              && Math.abs(rule.getBoundingClientRect().right - toolbar.getBoundingClientRect().right) < 1;
          });
          const state = await page.evaluate(() => {
            const article = document.querySelector("#blog-article");
            const section = document.querySelector('[aria-labelledby="article-reactions-heading"]');
            const heading = section.querySelector("h2");
            const rule = heading.parentElement;
            const toolbar = section.querySelector(".grid");
            const buttons = [...toolbar.querySelectorAll("button")];
            const bounds = (element) => element.getBoundingClientRect();
            const textStart = bounds(heading).left + parseFloat(getComputedStyle(heading).paddingLeft);
            return {
              width: innerWidth,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              pageOverflow: document.documentElement.scrollWidth - innerWidth,
              headingSize: getComputedStyle(heading).fontSize,
              articleToDivider: bounds(rule).top - bounds(article).bottom,
              dividerToHeading: bounds(heading).top - bounds(rule).top - parseFloat(getComputedStyle(rule).borderTopWidth),
              headingAligned: Math.abs(textStart - bounds(article).left) < 1,
              toolbarAligned: Math.abs(bounds(rule).left - bounds(toolbar).left) < 1 && Math.abs(bounds(rule).right - bounds(toolbar).right) < 1,
              toolbarGap: bounds(toolbar).top - bounds(heading).bottom,
              allInOneRow: buttons.every((button) => Math.abs(bounds(button).top - bounds(buttons[0]).top) < 1),
              buttons: buttons.map((button) => ({
                name: button.children[1].textContent,
                labelFits: button.children[1].scrollWidth <= button.children[1].clientWidth,
                height: bounds(button).height,
                countVisible: bounds(button.children[2]).width > 0,
                pressed: button.getAttribute("aria-pressed"),
              })),
            };
          });
          assert.equal(state.theme, theme);
          assert.equal(state.width, width);
          assert.ok(state.pageOverflow <= 1, `${theme} ${width}px page overflow`);
          assert.equal(state.headingSize, "20px");
          assert.equal(state.articleToDivider, 32, `${theme} ${width}px article handoff`);
          assert.equal(state.dividerToHeading, 48, `${theme} ${width}px divider-to-heading spacing`);
          assert.equal(state.headingAligned, true, `${theme} ${width}px heading aligns to prose`);
          assert.equal(state.toolbarAligned, true, `${theme} ${width}px toolbar aligns to divider`);
          assert.equal(state.toolbarGap, 16, `${theme} ${width}px heading-to-toolbar gap`);
          assert.equal(state.allInOneRow, true, `${theme} ${width}px single row`);
          assert.deepEqual(state.buttons.map((button) => button.name), ["Like", "Love", "Celebrate", "Insightful"]);
          for (const button of state.buttons) {
            assert.equal(button.labelFits, true, `${theme} ${width}px ${button.name} label fits`);
            assert.ok(button.height >= 44 && button.countVisible, `${theme} ${width}px ${button.name} target and count`);
            assert.equal(button.pressed, "false");
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("reaction labels and touch targets remain readable on a touch viewport", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    await page.locator('[aria-labelledby="article-reactions-heading"] button').first().waitFor({ state: "visible" });
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 700 });
      const state = await page.evaluate(() => ({
        touch: matchMedia("(pointer: coarse)").matches,
        buttons: [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')].map((button) => ({
          height: button.getBoundingClientRect().height,
          fullLabel: button.children[1].scrollWidth <= button.children[1].clientWidth,
        })),
      }));
      assert.equal(state.touch, true);
      assert.equal(state.buttons.length, 4);
      assert.ok(state.buttons.every((button) => button.height >= 44 && button.fullLabel), `${width}px touch labels and targets`);
    }
  } finally {
    await browser.close();
  }
});

test("reduced-motion preference keeps hover feedback without icon movement", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const button = page.getByRole("button", { name: /Add Like \(like\) reaction/ });
    await button.waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-labelledby="article-reactions-heading"] button')?.disabled);
    const icon = button.locator("span").first();
    const before = await icon.evaluate((element) => getComputedStyle(element).backgroundColor);
    await button.hover();
    await page.waitForFunction((color) => {
      const element = document.querySelector('[aria-labelledby="article-reactions-heading"] button span');
      return element && getComputedStyle(element).backgroundColor !== color;
    }, before);
    const after = await icon.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      scale: new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
    }));
    assert.notEqual(after.background, before, "hover still has a visible surface");
    assert.equal(after.scale, 1, "reduced motion does not scale the icon");
  } finally {
    await browser.close();
  }
});

test("failed reaction requests restore the original choice and count without a database write", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/blog/the-only-nextjs-favicon-guide-youll-need`);
    const buttons = page.locator('[aria-labelledby="article-reactions-heading"] button');
    await buttons.first().waitFor({ state: "visible" });
    await page.waitForFunction(() => [...document.querySelectorAll('[aria-labelledby="article-reactions-heading"] button')].every((button) => !button.disabled));
    const before = await buttons.evaluateAll((items) => items.map((button) => ({
      label: button.getAttribute("aria-label"),
      pressed: button.getAttribute("aria-pressed"),
    })));

    let intercepted = false;
    await page.route("**/blog/the-only-nextjs-favicon-guide-youll-need", async (route) => {
      if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
        intercepted = true;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await buttons.first().hover();
    await page.waitForFunction(() => {
      const element = document.querySelector('[aria-labelledby="article-reactions-heading"] button span');
      return element && new DOMMatrixReadOnly(getComputedStyle(element).transform).a > 1.01;
    });
    const box = await buttons.first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => {
      const element = document.querySelector('[aria-labelledby="article-reactions-heading"] button span');
      return element && new DOMMatrixReadOnly(getComputedStyle(element).transform).a < 0.98;
    });
    await page.mouse.up();
    await page.getByRole("alert").getByText("We couldn't save your reaction. Please try again.").waitFor();
    assert.equal(intercepted, true, "server action was blocked before reaching the database");
    assert.deepEqual(await buttons.evaluateAll((items) => items.map((button) => ({
      label: button.getAttribute("aria-label"),
      pressed: button.getAttribute("aria-pressed"),
    }))), before);
    assert.equal(await buttons.first().isEnabled(), true, "visitor can retry after failure");
  } finally {
    await browser.close();
  }
});
