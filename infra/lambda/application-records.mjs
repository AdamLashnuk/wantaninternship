import { createHash } from "node:crypto";
export const statuses = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];
export function savedRecord(body, userId, now = new Date().toISOString()) {
  const field = (name, max) => { if (typeof body[name] !== "string" || !body[name].trim() || body[name].length > max) throw new Error(`Invalid ${name}.`); return body[name].trim(); };
  const url = new URL(field("applicationUrl", 3000));
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid application URL.");
  url.hash = "";
  const applicationUrl = url.toString();
  return { userId, id: createHash("sha256").update(applicationUrl).digest("hex"), company: field("company", 300), title: field("title", 500), location: typeof body.location === "string" ? body.location.slice(0, 500) : "", applicationUrl, status: "Saved", savedAt: now, updatedAt: now, notes: "" };
}
export function validUpdate(body) {
  if (!statuses.includes(body.status) || typeof body.notes !== "string" || body.notes.length > 5000) throw new Error("Invalid status or notes.");
  return { status: body.status, notes: body.notes };
}
