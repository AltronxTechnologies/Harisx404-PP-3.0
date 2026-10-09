import assert from "node:assert/strict";
import test from "node:test";
import { withProjectPreview } from "../app/data/project-preview-fixtures.ts";

test("Alloy presentation fixtures do not replace authored case studies", () => {
  const previous = { alloy: process.env.IS_ALLOY, seed: process.env.PROJECT_DETAIL_PREVIEW_SEED, node: process.env.NODE_ENV };
  try {
    process.env.NODE_ENV = "development";
    process.env.IS_ALLOY = "true";
    process.env.PROJECT_DETAIL_PREVIEW_SEED = "true";
    const authored = { slug: "medicalink-hms", title: "MedicaLink", content: "Actual case study", case_study_sections: { why_built: "An owner's account" }, cover_image_url: "https://example.com/cover.jpg" };
    assert.equal(withProjectPreview(authored), authored);
    const incomplete = { slug: "medicalink-hms", title: "MedicaLink", content: "", cover_image_url: "" };
    assert.equal(withProjectPreview(incomplete).isPreview, true);
  } finally {
    if (previous.alloy === undefined) delete process.env.IS_ALLOY;
    else process.env.IS_ALLOY = previous.alloy;
    if (previous.seed === undefined) delete process.env.PROJECT_DETAIL_PREVIEW_SEED;
    else process.env.PROJECT_DETAIL_PREVIEW_SEED = previous.seed;
    if (previous.node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.node;
  }
});
