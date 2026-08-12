# Design Intelligence - Project Connection Record

> This file is the project's contract with the canonical
> [`design-intelligence`](https://github.com/andrewheldy/design-intelligence) repository.
> It is read **first** by any agent doing design work here. It is owned by this
> project repository and is not synchronized with anything.

## 1. Identity

| Field | Value |
|---|---|
| **Project name** | Rent With Heldy |
| **Project repository** | `https://github.com/andrewheldy/rentwithheldy-07f92d39` |
| **Product type** | `mixed` |
| **Primary surfaces** | Public rental marketing site, booking handoff, service landing pages, hidden case studies, admin tools |
| **Target users** | South Florida rental guests and partners. For the `/ai-systems` surface: fleet operators and other businesses with repeatable workflows. |
| **Project owner** | Andrew Heldy |
| **Integration status** | `active` |

## 2. Constraint envelope

| Field | Value |
|---|---|
| **Accessibility requirements** | WCAG 2.2 AA. Semantic structure, keyboard operation, visible focus, non-color state cues, and reduced-motion support are required. |
| **Responsive requirements** | 320-430px must survive without horizontal page overflow; 375x812 mobile baseline; 768x1024 tablet; desktop at 1280px and above; 200% zoom remains usable. |
| **Motion constraints** | Motion must explain, guide, or confirm. No scroll hijacking, parallax, permanent loops, bounce, spin, or wobble. All movement has a reduced-motion path. |

**Non-overridable floor (do not edit):** `prefers-reduced-motion`, visible focus indicators, and WCAG AA contrast take precedence over every skill directive and every brand rule. An accessibility failure is never recorded as a permanent exception; it is recorded as an open defect with a remediation date.

## 3. Project-owned locations

| Field | Path (repo-relative) |
|---|---|
| **Brand-system location** | `docs/ART_DIRECTION.md` (with implementation tokens in `src/index.css`) |
| **Design-decision-log location** | `docs/DESIGN_DECISIONS.md` |
| **Reusable-findings location** | `docs/DESIGN_FINDINGS.md` |

## 4. Canonical Design Intelligence link

| Field | Value |
|---|---|
| **Canonical repository URL** | `https://github.com/andrewheldy/design-intelligence` |
| **Canonical commit / release / version last reviewed** | `aac21b3287b62f9488e879b58650f08569550cb8` |
| **Last review date** | 2026-08-12 |
| **Reviewed by** | Codex for Andrew Heldy |

**Mechanism note (do not edit):** nothing is synchronized. This project does not pull, install, submodule, or vendor the canonical repository. Agents read it over the network at the ref above; a human updates the ref during a re-review.

## 5. Applicable Design Intelligence agents

- [x] `design-director` - **required** for any design task
- [x] `design-engineer` - **required** for any implementation
- [x] `accessibility-reviewer` - **always** runs on changed UI
- [x] `anti-slop-reviewer` - new or restyled visual surfaces
- [x] `motion-reviewer` - only when the change contains animation
- [x] `mobile-ux-reviewer` - only when a mobile/responsive surface changed

## 6. Applicable registry entries

| Registry `id` | Status at last review | Why it applies here |
|---|---|---|
| `taste-skill` | approved | Sole opinion skill for marketing, landing, and portfolio surfaces |
| `emil-design-skills` | approved | Motion character, restraint, easing, duration, and interaction polish |
| `motion-intelligence` | approved | Motion engine selection, specification, browser verification, and audit |
| `motion` | approved | Existing runtime, available only when the selection hierarchy passes its React-lifecycle gate |

**One-opinion-skill rule (do not edit):** never load more than one of `taste-skill`, Anthropic `frontend-design`, or `ui-ux-pro-max` for the same task. Marketing surfaces -> `taste-skill`. Product UI -> Anthropic `frontend-design`. `ui-ux-pro-max` is experimental and isolated-trial only. `emil-design-skills` is a motion authority, not an opinion skill, and may compose with any of them. A second opinion skill requires written justification in the brief naming which skill wins on each axis of conflict.

## 7. Current exceptions

| ID | Rule or recommendation overridden | Source | Reason | Approved by | Expires / review by | Status |
|---|---|---|---|---|---|---|
| EX-1 | Avoid Inter as the default body face | `taste-skill` | The implemented Rent With Heldy brand system explicitly pairs Inter with Bricolage Grotesque. | Andrew Heldy via existing brand implementation | permanent | active |
| EX-2 | Consumer surfaces default to dual light/dark modes | `taste-skill` | The public brand is intentionally light and warm. Dormant dark tokens are not a shipped theme or an instruction to add a toggle. | Andrew Heldy via existing brand implementation | 2027-01-01 | active |
| EX-3 | Marketing pages require generated or stock imagery | `taste-skill` | Rent With Heldy prohibits AI imagery, while `/ai-systems` is explicitly specified around system maps, workflow diagrams, and replaceable artifact structures. Real sanitized artifacts arrive in Pass 3. | Andrew Heldy via feature and creative-direction specs | Pass 3 | active |
| EX-4 | Avoid explicit scroll-cue controls in the hero | `taste-skill` | The feature specification explicitly requires an “Explore the Systems” action, which is a functional anchor to the first narrative chapter rather than a decorative cue. | Andrew Heldy via feature specification | Pass 2 review | active |

## 8. HeldyOS link (optional)

| Field | Value |
|---|---|
| **Obsidian note** | Not recorded |

## Required workflow

1. Read this connection record and its exceptions.
2. Read the project brand system and implementation tokens in full.
3. Read canonical `AGENTS.md`, `docs/INTEGRATION_CONTRACT.md`, the listed registry entries, and the applicable agent specs at the pinned ref.
4. Select no more than one opinion skill.
5. Run the Design Director and create a project-owned design brief.
6. Produce the Design Engineer implementation plan from that brief, extending existing tokens before components.
7. Implement in this repository.
8. Run only relevant reviewer agents on the rendered output.
9. Consolidate overlapping findings.
10. Record accepted and rejected decisions in `docs/DESIGN_DECISIONS.md`.
11. Stage only genuinely reusable findings in `docs/DESIGN_FINDINGS.md`.

## If the canonical repository is unavailable

State which resource and ref failed. Fall back only to this record, the project brand system, decision log, prior briefs, and source-pinned local agent copies. Keep enforcing the accessibility floor and one-opinion-skill rule. Label output **unverified loadout**. Do not install a skill, substitute web-search results, invent registry entries, change the pin, or propose upstream changes.
