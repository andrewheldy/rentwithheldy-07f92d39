# AI Systems Showcase — Pass 2 Interaction Audit

Date: 2026-08-12

## Decision

Pass 2 will add two signature interactions and no new motion dependency:

1. **Business OS causal trace** — selecting a workflow stage will distinguish the active step, every prerequisite step, and every downstream step. Connected arrows will make the accumulated path legible. The existing stage explanation remains the source of truth.
2. **Opportunity Finder reasoning assembly** — each deterministic recommendation will show the selected work patterns that caused it to appear. Newly introduced result rows may enter with a short pointer/touch-only CSS transition; keyboard and assistive-technology changes remain instant.

This is the smallest set that materially improves systems comprehension. Both interactions expose their meaning in text and DOM state without depending on animation.

## Candidate audit

| Surface | Explanatory value | Decision |
| --- | --- | --- |
| Hero system map | The existing map establishes breadth and an operating core, but its connecting lines are illustrative rather than a defined causal graph. Path activation would invent unsupported topology. | **Reject for Pass 2.** Keep the hero static and credible. |
| Business OS workflow | The six stages already define an actual sequence. Showing prerequisites and downstream steps explains cause and effect without adding new claims. | **Build.** This is the primary signature interaction. |
| Systems gallery | Category selection already provides direct manipulation and clear state. Animated switching would add polish more than understanding on a frequently used control. | **Reject.** Preserve the fast, stable tab-like behavior. |
| Manual vs. AI-enabled comparison | The side-by-side structure communicates the contrast at a glance. Sequencing the lists would delay access and make the page feel performed. | **Reject.** |
| Artifact showcase | The current artifacts are explicitly replaceable demonstration structures. Interaction would overstate placeholder fidelity before Pass 3 supplies sanitized evidence. | **Reject.** |
| Industry expansion | The argument depends on reading the common operating pattern, not on discovering hidden content. | **Reject.** |
| Opportunity Finder | Recommendations are deterministic but currently do not reveal which selected inputs caused each output. Showing that relationship directly increases trust and teaches the mapping model. | **Build.** This is the secondary signature interaction. |
| Process and CTA | The four-step method and contact action are already unambiguous. Motion would be decorative. | **Reject.** |

## Design and motion constraints

- Surface classification: **marketing / landing / portfolio**.
- Sole design-opinion skill: `taste-skill`; no concurrent frontend-design or ui-ux-pro-max opinion layer.
- Motion character: `emil-design-skills`, routed through Motion Intelligence's `motion-director`.
- Engine: native CSS transitions only; existing React state owns semantics and CSS owns presentation.
- Pointer and touch may receive brief relationship feedback. Keyboard activation, programmatic activation, and focus changes are instant.
- Reduced motion renders the same complete end states without transform or transition.
- No autoplay, scroll choreography, layout animation, stagger, height animation, canvas, WebGL, or fake AI behavior.
- Mobile preserves the vertical workflow and exposes every reasoning label without hover. RTL uses logical properties and reverses only directional connector icons.

## Acceptance signal

The pass succeeds when a first-time visitor can answer both questions without inferring from color alone:

- “What has already happened before this workflow stage, and what comes next?”
- “Which selected business problems caused this system recommendation?”

