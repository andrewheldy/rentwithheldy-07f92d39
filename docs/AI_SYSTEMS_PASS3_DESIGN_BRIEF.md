# AI Systems Showcase — Pass 3 Design Brief

## Design read

`/ai-systems` is an editorial case study for operators who need to see how ordinary business work becomes connected systems, not a product dashboard or an AI-agency pitch. The page should feel like a calm field guide through one operating business: accumulated evidence, visible cause and effect, and a clear transfer from Rent With Heldy to the visitor's own operation. Density may rise inside the system diagrams, but typography and whitespace must keep the reading experience hospitable. Quality means the story remains complete at 320px, in RTL, by keyboard, and with every transition removed.

## Skill loadout and dials

- Surface: **marketing / editorial case study**
- Sole opinion skill: `taste-skill`
- Motion character: `emil-design-skills`
- Motion routing and proof: `motion-intelligence`, entered through `motion-director`
- `DESIGN_VARIANCE: 7` — preserve the controlled asymmetry and avoid a component-showcase rhythm
- `MOTION_INTENSITY: 5` — explanatory connection, accumulation, and transformation only; no perpetual or decorative loops
- `VISUAL_DENSITY: 5` — diagrams may become richer as the story advances, while mobile remains fast and linear

## Direction

- Organize the existing content into six chapters: The Business, The System, The Workflows, The Transformation, The Pattern, and Your Opportunity.
- Use a discreet desktop field-guide rail only where there is genuine side space. Replace it on mobile with a short sticky chapter indicator after the hero.
- Reuse a muted teal line to mean connection, progress, workflow, and transfer across the page.
- Let the business narrative and transformation bridge accumulate one system rather than swapping unrelated scenes.
- Keep controls immediate. Gallery, workflow, artifact, and Opportunity Finder states are complete before any optional pointer/touch transition.
- Keep the Opportunity Finder deterministic and explicit; its diagram is another view of the existing selections and recommendations, never an AI-generated assessment.

## Brand overrides carried forward

- Retain Inter and Bricolage Grotesque, the warm cream / ink / teal palette, the light theme, and the existing radius vocabulary.
- Retain the editorial system-map direction instead of adding generated or stock imagery.
- The hero's functional Explore anchor remains despite taste-skill's default preference against decorative scroll cues.
- Motion remains quieter than taste-skill's dial might ordinarily imply because the project accessibility and hospitality rules require calm, interruption-safe reading.

## Acceptance criteria

1. Six chapters read as one causal journey and the current chapter remains discoverable on large desktop and mobile without obscuring content.
2. Mobile uses a vertical hero architecture, vertical workflows, a compact gallery selector, stacked comparison, and a one-column process at 320–430px with no page overflow.
3. The business scroll story and transformation bridge show one system accumulating; their complete final state remains visible without motion or IntersectionObserver.
4. The Opportunity Finder diagram is derived only from the existing deterministic selections and recommendations, with the existing textual reasons preserved.
5. Keyboard controls, focus visibility, semantic headings, RTL, and every locale remain complete; reduced motion removes travel, line draws, smooth scrolling, and sticky story dependence.
6. No new runtime dependency, continuous animation loop, expensive animated filter, or layout-reading scroll handler is introduced.
7. Rendered output passes Accessibility, Anti-Slop, Motion, and Mobile UX review with no blockers.

## Open questions

None. Pass 3 is an evolution of the existing implementation and copy model; unsupported claims and fake operational evidence remain out of scope.
