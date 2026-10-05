import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidBlogDate,
  resolveBlogPublishDate,
  todayUtcDate,
} from "../app/lib/blog-defaults.ts";

const now = new Date("2026-10-05T16:30:00.000Z");

test("date-only input rejects impossible or malformed calendar dates", () => {
  assert.equal(isValidBlogDate("2026-02-29"), false);
  assert.equal(isValidBlogDate("2028-02-29"), true);
  assert.equal(isValidBlogDate("2026-10-05T16:30"), false);
  assert.equal(todayUtcDate(now), "2026-10-05");
});

test("drafts stay private and an untouched prefilled date publishes at the current instant", () => {
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-05",
      edited: false,
      status: "draft",
      now,
    }),
    "",
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-05",
      edited: false,
      status: "published",
      now,
    }),
    now.toISOString(),
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "",
      edited: true,
      status: "published",
      now,
    }),
    now.toISOString(),
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-05",
      edited: true,
      status: "published",
      now,
    }),
    now.toISOString(),
  );
});

test("future dates schedule in UTC, past dates backdate, and unchanged published instants survive edits", () => {
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-07",
      edited: true,
      status: "published",
      now,
    }),
    "2026-10-07T00:00:00.000Z",
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-09-01",
      edited: true,
      status: "published",
      now,
    }),
    "2026-09-01T00:00:00.000Z",
  );
  const previous = "2026-10-04T08:47:12.000Z";
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-04",
      edited: false,
      status: "published",
      previousStatus: "published",
      previous,
      now,
    }),
    previous,
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-05",
      edited: false,
      status: "published",
      previousStatus: "draft",
      previous: "2026-09-01T00:00:00.000Z",
      now,
    }),
    now.toISOString(),
  );
  assert.equal(
    resolveBlogPublishDate({
      date: "2026-10-07",
      edited: false,
      status: "published",
      previousStatus: "draft",
      previous: "2026-10-07T00:00:00.000Z",
      now,
    }),
    "2026-10-07T00:00:00.000Z",
  );
});
