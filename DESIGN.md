---
name: WantAnInternship
description: A technical, current, and precise opportunity index for students and recent graduates.
colors:
  canvas: "#ffffff"
  surface: "#f6f8fa"
  surface-hover: "#f3f4f6"
  border: "#d0d7de"
  border-muted: "#d8dee4"
  ink: "#1f2328"
  muted-ink: "#656d76"
  link-blue: "#0969da"
  link-blue-hover: "#0550ae"
  verified-green: "#1a7f37"
  verified-tint: "#dafbe1"
  recommended-purple: "#8250df"
  recommended-tint: "#fbefff"
  technical-blue: "#1769d2"
  technical-blue-strong: "#0f4fa8"
  technical-blue-tint: "#d9ebff"
  technical-blue-canvas: "#edf6ff"
  engineering-orange: "#b45309"
  engineering-orange-strong: "#8a3f05"
  engineering-orange-tint: "#ffdfb5"
  engineering-orange-canvas: "#fff7ed"
  ledger-brown: "#89552f"
  ledger-brown-strong: "#663c20"
  ledger-brown-tint: "#ead5c2"
  ledger-brown-canvas: "#f5eee7"
  clinical-green: "#23864b"
  clinical-green-strong: "#176536"
  clinical-green-tint: "#caead5"
  clinical-green-canvas: "#ebf7ef"
  dark-canvas: "#0d1117"
  dark-surface: "#161b22"
  dark-border: "#30363d"
  dark-ink: "#e6edf3"
  dark-muted-ink: "#8b949e"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "clamp(30px, 5vw, 48px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  control: "6px"
  container: "8px"
  panel: "14px"
  card: "16px"
  feature: "22px"
  showcase: "28px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  section: "44px"
components:
  button-primary:
    backgroundColor: "{colors.technical-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "38px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.control}"
    padding: "5px 10px"
  input-search:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  card-resource:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.container}"
    padding: "20px"
  card-feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.showcase}"
    padding: "22px 20px"
---

# Design System: WantAnInternship

## Overview

**Creative North Star: "The Opportunity Index"**

WantAnInternship is a technical, current, and precise directory: it should feel like a dependable live index rather than a promotional career platform. Its visual authority comes from orderly information, visible freshness signals, careful hierarchy, and interfaces that stay out of the user's way.

The system is compact without feeling cramped. Quietly layered surfaces, restrained shadows, explicit borders, and career-specific color worlds divide dense information into approachable units. Components are structured and approachable: clear enough for first-time visitors, efficient enough for repeated scanning.

**Key Characteristics:**

- System-native typography with dense, legible hierarchy.
- Career-specific accents that recolor the environment without changing its structure.
- Borders and tonal surfaces first; shadows reserved for meaningful layers and hover feedback.
- Rounded controls and containers balanced by disciplined grids and table-like resource rows.
- Small uppercase labels communicate status, category, and freshness.

## Colors

The palette begins with cool GitHub-like neutrals, then lets each career track own a precise accent, tint, canvas, and stronger interactive state. Light and dark modes keep the same semantic relationships.

### Primary

- **Technical Blue:** The Software track's links, active controls, focus states, and live-opportunity signals.
- **Engineering Orange:** The Engineering track's practical, warm accent for discipline filters, co-op controls, and live-opportunity signals.
- **Ledger Brown:** The Finance track's warmer, grounded accent and interactive hierarchy.
- **Clinical Green:** The Medicine track's clear, reassuring accent and interactive hierarchy.

### Secondary

- **Verified Green:** Recent-verification and positive-status badges only.
- **Recommended Purple:** Recommended resources, tool promotion, and freemium metadata.

### Neutral

- **Canvas:** Primary page and input background.
- **Surface:** Quiet grouping panels, chips, filters, and secondary regions.
- **Ink:** Primary text and high-priority labels.
- **Muted Ink:** Descriptions, metadata, inactive navigation, and secondary actions.
- **Border / Muted Border:** Structure the index and separate rows without heavy depth.

### Named Rules

**The Career Context Rule.** Use the active track accent for navigation, focus, calls to action, and live signals; do not mix career accents on the same surface.

**The Semantic Accent Rule.** Green means verified or positive status, while purple means recommendation or career tooling. These colors do not replace the active career accent.

## Typography

**Display Font:** System UI sans-serif with Segoe UI, Helvetica, and Arial fallbacks  
**Body Font:** System UI sans-serif with Segoe UI, Helvetica, and Arial fallbacks

**Character:** The single-family system is fast, familiar, and interface-native. Weight, scale, tracking, and case create hierarchy without introducing a decorative display voice.

### Hierarchy

- **Display** (700, fluid 30–48px, 1.08): Major standalone page introductions such as the career-tool and Latest Drops pages.
- **Headline** (700, 21px, 1.3): Directory sections, callouts, and card headings.
- **Title** (600, 15px, 1.4): Resource names and compact result titles.
- **Body** (400, 14px, 1.5): Default interface copy; longer descriptions loosen to 1.6–1.7 and stay below roughly 760px.
- **Label** (700–750, 9–12px, 0.06–0.09em, uppercase): Eyebrows, categories, freshness, and compact metadata.

### Named Rules

**The Interface-Native Rule.** Use the system stack everywhere; hierarchy comes from disciplined weight and spacing, not a decorative font pairing.

**The Small Label Rule.** Uppercase text is reserved for brief categorical or status labels and always uses increased tracking.

## Layout

The primary homepage uses a fluid container capped at 1280px with 20px edge gutters. Its Software view pairs a flexible directory column with a 292px sticky Latest Drops rail and a 34px gap; other tracks collapse to a single column. General pages use a narrower 1040px container.

Spacing follows a compact 6–10–16–20–28px rhythm, with 36–64px separating major regions. Directory content behaves like a readable index: section headers lead into bordered row groups, and metadata occupies a fixed trailing column on wide screens. Tool cards use a two-column grid.

At 1080px the opportunity rail narrows; around 900px filter grids reduce columns; at 760px primary navigation hides and multi-column content stacks; at 640–520px filters and tool grids become single-column and edge spacing tightens. Interactive targets remain approximately 38–46px tall even as layout density increases.

## Elevation & Depth

The system is quietly layered. One-pixel borders and tonal surface shifts establish most hierarchy. A nearly flat one-pixel shadow reinforces ordinary containers; larger soft shadows are limited to the sticky Latest Drops showcase and hover elevation on tool and opportunity cards.

### Shadow Vocabulary

- **Structural Hairline** (`0 1px 0 rgba(31, 35, 40, 0.04)`): Default light-mode panels, grouped lists, and cards.
- **Dark Structural Hairline** (`0 1px 0 rgba(1, 4, 9, 0.4)`): Dark-mode equivalent.
- **Showcase Lift** (`0 18px 50px rgba(31, 35, 40, 0.1)`): Latest Drops rail only.
- **Interactive Lift** (`0 10px 30px rgba(31, 35, 40, 0.08)`): Hover response for richer cards.
- **Focus Halo** (`0 0 0 3px var(--focus-ring)`): Keyboard and field focus, colored by the current track.

### Named Rules

**The Quiet Layer Rule.** Start with a border and tonal change; add a shadow only when a surface is sticky, featured, focused, or actively lifting on hover.

## Shapes

Small controls and filter buttons use compact 6px corners. Grouped containers use 8–16px radii, richer cards use 16–22px, and the Latest Drops showcase reaches 28px. Pills are reserved for statuses, categories, segmented controls, and concise calls to action. Logos sit in small rounded squares rather than circles.

**The Radius-by-Importance Rule.** Larger radii signal richer or more independent surfaces; dense directory rows remain structurally tighter than feature cards.

## Components

Components are structured and approachable: explicit boundaries, compact copy, and immediate state feedback.

### Buttons

- **Shape:** Utility actions use 6px corners; primary track actions and segmented choices use full pills.
- **Primary:** White text on the active career accent, typically 38–42px tall with 12–16px horizontal padding.
- **Hover / Focus:** Hover deepens to the track's strong accent. Focus uses a three-pixel semantic halo and never relies on color alone.
- **Secondary:** Canvas-backed with a one-pixel border and muted text; hover shifts to the surface-hover tone.

### Chips

- **Style:** Compact pills with 2–7px internal padding, 10–12px text, a muted border, and a tonal surface.
- **State:** Active filter chips use white text on the current track accent. Verified and recommended badges use their dedicated semantic palettes.

### Cards / Containers

- **Corner Style:** 8px for grouped resource lists, 14–17px for filters and opportunity cards, 22px for tool cards, and 28px for the Latest Drops showcase.
- **Background:** Canvas for row-level cards; surface tones for grouping panels and feature surrounds.
- **Shadow Strategy:** Flat structural shadow at rest; selected feature cards may lift one or two pixels on hover.
- **Border:** One-pixel semantic neutral border is always retained, including when shadowed.
- **Internal Padding:** 14–23px for cards and rows; feature callouts use about 25–27px.

### Inputs / Fields

- **Style:** Canvas-backed, one-pixel bordered fields with 6–12px corners and 40–44px height.
- **Focus:** Border changes to the current track accent with a three-pixel translucent focus halo.
- **Placeholder:** Always uses the dedicated placeholder neutral, never the primary text color.

### Navigation

The header is sticky, border-bottom anchored, and backed by a translucent 12px blur. Brand text is compact and semibold; navigation is muted until hover. The career selector is a structured 46px control with a tinted icon tile, uppercase micro-label, and strong accent selection. Primary navigation hides below 760px.

### Resource Rows

Resource rows use a wide content column and a narrow right-aligned metadata column. Titles, descriptions, tags, verification, and source actions retain consistent vertical order. Hover changes the row tone without introducing a card lift.

### Latest Drops

The signature opportunity rail combines a track-tinted radial wash, live pulse, stacked opportunity cards, and a prominent track-colored browse action. It is sticky on wide screens and returns to document flow when the layout stacks.

## Do's and Don'ts

### Do:

- **Do** preserve the active career track's accent, tint, canvas, border, and strong-state relationship.
- **Do** use borders and surface tones as the default hierarchy tools.
- **Do** keep dense resource information in a predictable title–description–tags–metadata order.
- **Do** retain visible focus halos, 38px-or-taller controls, and reduced-motion behavior.
- **Do** reserve uppercase tracked labels for short status and category information.

### Don't:

- **Don't** mix Technical Blue, Engineering Orange, Ledger Brown, and Clinical Green as competing accents within one track surface.
- **Don't** add decorative display fonts, ornamental illustration, or promotional visual noise to the index experience.
- **Don't** use large shadows on ordinary filters, rows, or utility controls.
- **Don't** turn every action into a pill; keep compact utility controls structurally square.
- **Don't** hide source, verification, location, or freshness metadata for aesthetic simplicity.
