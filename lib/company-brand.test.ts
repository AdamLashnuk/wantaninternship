import assert from "node:assert/strict";
import test from "node:test";
import { resolveCompanyWebsite } from "./company-brand.ts";

test("never uses an aggregator as the company brand", () => {
  assert.equal(
    resolveCompanyWebsite("Waymo", "https://simplify.jobs/c/Waymo", "https://careers.withwaymo.com/jobs/123"),
    "https://careers.withwaymo.com",
  );
  assert.equal(
    resolveCompanyWebsite("Robinhood", "https://simplify.jobs/c/Robinhood", "https://boards.greenhouse.io/robinhood/jobs/123"),
    "https://robinhood.com",
  );
  assert.equal(
    resolveCompanyWebsite("Scale AI", "https://simplify.jobs/c/Scale-AI", "https://job-boards.greenhouse.io/scaleai/jobs/123"),
    "https://scaleai.com",
  );
  assert.equal(
    resolveCompanyWebsite("Figma", "https://www.figma.com", "https://boards.greenhouse.io/figma/jobs/123"),
    "https://www.figma.com",
  );
});
