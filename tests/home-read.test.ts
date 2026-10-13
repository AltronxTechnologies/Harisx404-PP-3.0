import assert from "node:assert/strict";
import test from "node:test";
import { homeRead } from "../app/lib/home-read";

test("homepage reads preserve successful data and distinguish a real empty collection", async () => {
  assert.deepEqual(await homeRead("test", async () => [1], [], 50), { value: [1], available: true });
  assert.deepEqual(await homeRead("test", async () => [], [1], 50), { value: [], available: true });
});

test("homepage reads return a local fallback on failure or a stalled dependency", async () => {
  const originalError = console.error;
  const notices: string[] = [];
  console.error = (notice: string) => notices.push(notice);
  try {
    assert.deepEqual(await homeRead("projects", async () => { throw new Error("private connection detail"); }, [], 50), { value: [], available: false });
    const started = performance.now();
    assert.deepEqual(await homeRead("blog", () => new Promise<number[]>(() => {}), [], 25), { value: [], available: false });
    assert.ok(performance.now() - started < 500, "a stuck read must not hold the whole response");
    assert.deepEqual(notices, [
      "Home projects read failed or exceeded its deadline",
      "Home blog read failed or exceeded its deadline",
    ]);
  } finally {
    console.error = originalError;
  }
});
