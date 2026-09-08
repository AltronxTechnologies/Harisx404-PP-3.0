import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseUrl = process.env.CONTACT_BASE_URL || "http://localhost:3000";

test("Contact renders the approved single-message experience", async () => {
  const response = await fetch(`${baseUrl}/contact`);
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /A project, a role, or/);
  assert.match(html, /Tell me what you have in mind/);
  assert.match(html, /Project inquiry/);
  assert.match(html, /Send message/);
  assert.match(html, /From concept to creation/);
  assert.doesNotMatch(html, /Book a Call/);
  assert.doesNotMatch(html, /role="tablist"/);
});

test("Contact inquiry migration covers every server-approved intent", async () => {
  const [actionSource, migration] = await Promise.all([
    readFile(new URL("../app/contact/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../migrations/2026_contact_inquiry_types.sql", import.meta.url), "utf8"),
  ]);
  const values = [
    "general-question",
    "project-inquiry",
    "freelance",
    "full-time",
    "security-report",
    "website-issue",
    "consulting",
    "collaboration",
    "other",
  ];

  values.forEach((value) => {
    assert.match(actionSource, new RegExp(`\\"${value}\\"`));
    assert.match(migration, new RegExp(`'${value}'`));
  });
  assert.match(migration, /request_id UUID/);
  assert.match(migration, /check_contact_message_rate_limit/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
});
