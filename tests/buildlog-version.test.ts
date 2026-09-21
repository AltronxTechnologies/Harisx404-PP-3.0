import assert from "node:assert/strict";
import test from "node:test";
import type { BuildlogItem } from "../app/buildlog/types";
import {
  getLatestShippedVersion,
  parseSemanticVersion,
  sortShippedNewest,
} from "../app/buildlog/version";

const item = (badge: string, displayOrder: number): BuildlogItem => ({
  id: `${displayOrder}-${badge}`,
  title: badge,
  description: null,
  badge,
  done: true,
  display_order: displayOrder,
});

test("semantic versions sort newest-first with prerelease precedence", () => {
  const sorted = sortShippedNewest([
    item("v2.1.0-beta.2", 0),
    item("v2.0.0", 1),
    item("v2.1.0", 2),
    item("v2.1.0-beta.11", 3),
    item("v2.1.0-beta", 4),
  ]);
  assert.deepEqual(
    sorted.map((entry) => entry.badge),
    ["v2.1.0", "v2.1.0-beta.11", "v2.1.0-beta.2", "v2.1.0-beta", "v2.0.0"],
  );
});

test("comparison uses ASCII and arbitrary-length numeric identifiers", () => {
  const sorted = sortShippedNewest([
    item("v1.0.0-B", 0),
    item("v1.0.0-a", 1),
    item("v1.0.0-beta.9007199254740992", 2),
    item("v1.0.0-beta.9007199254740993", 3),
  ]);
  assert.deepEqual(
    sorted.map((entry) => entry.badge),
    [
      "v1.0.0-beta.9007199254740993",
      "v1.0.0-beta.9007199254740992",
      "v1.0.0-a",
      "v1.0.0-B",
    ],
  );
});

test("dates and status badges fall back to the admin current version", () => {
  const entries = [item("2026-09-21", 0), item("shipped", 1)];
  assert.equal(parseSemanticVersion(entries[0].badge), null);
  assert.equal(getLatestShippedVersion(entries, "v3.4"), "v3.4");
});

test("build metadata is accepted and ignored for precedence", () => {
  assert.ok(parseSemanticVersion("v1.2.3+build.7"));
  assert.equal(
    getLatestShippedVersion([item("v1.2.3+build.7", 0)], "v1.0"),
    "v1.2.3+build.7",
  );
});
