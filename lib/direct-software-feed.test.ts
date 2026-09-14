import assert from "node:assert/strict";
import test from "node:test";
import { isRelevantDirectSoftwareTitle } from "./direct-software-feed.ts";

test("direct fallback requires a clearly technical title", () => {
  const accepted = [
    "Software Engineering Intern",
    "AI/ML Engineer Intern",
    "Data Analyst Internship",
    "Cloud Infrastructure Intern",
    "Cybersecurity Intern",
    "Application Security Engineer Intern",
  ];
  const rejected = [
    "Brokerage Risk Analyst Intern",
    "Crypto Operations Intern",
    "Software Sales Intern",
    "Finance Operations Internship",
    "Sr. Software Engineer, Security (Starship)",
    "Senior Android Engineer, Wallet",
  ];

  accepted.forEach((title) => assert.equal(isRelevantDirectSoftwareTitle(title), true, title));
  rejected.forEach((title) => assert.equal(isRelevantDirectSoftwareTitle(title), false, title));
});
