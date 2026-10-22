---
version: 1
slug: "components-matchingsettings-tsx"
primary_target: "components/MatchingSettings.tsx"
related_targets: ["components/MatchingSettings.module.css"]
---

# Settings notifications

## Scope and mode

- Primary target: `components/MatchingSettings.tsx`
- Related target: `components/MatchingSettings.module.css`
- Mode: Operate

## Task

Students configure three connected notification systems: resume matching, company alerts, and email delivery. The existing three-tab model remains. All current persistence, upload, preview, test-email, filter, results, delivery recovery, and deletion behavior remains functional.

## Constraints

- Preserve the established Opportunity Index visual system, its track-aware palette, dark mode, keyboard tab behavior, and responsive support.
- Improve information architecture and interaction clarity without adding backend requirements or changing API contracts.
- Ask before making any material feature or workflow change beyond presentation and low-risk usability improvements.

## Direction contract

THESIS: Turn a long stack of generic cards into a compact notification control desk. Each tab should communicate what is active, what information is still needed, and what the user can do next; it refuses the category-default wall of identical form fields.

OWN-WORLD: Inherit the Opportunity Index: technical blue canvas, crisp neutral borders, compact system typography, structured white work surfaces, track tint for selected state, and semantic status color used only for actual readiness. Controls stay familiar and visibly interactive.

STORY: The user lands on one clear settings workspace, understands the three alert channels, completes the active tab without losing the shared filters, saves once, and can immediately check the result. Supporting delivery and match information remains available without competing with configuration.

FIRST VIEWPORT: A concise page heading leads into a three-part tab rail with numbered labels and per-tab status. The active tab opens as a two-column workspace: a focused configuration area and a compact contextual summary. Shared filters sit directly beneath as a quieter structured section. The persistent action row anchors Save preferences and Check matches at the end of configuration.

FORM: Local extension of an established Operate surface; no concept roll applies. The signature move is a live readiness trail across the three tabs that makes configuration state scannable without inventing a wizard. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- None. The user confirmed the three-tab structure and asked to retain most functionality, with consultation before material functional changes.
