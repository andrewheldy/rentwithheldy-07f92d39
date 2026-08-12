# Design Decisions

## 2026-08-12 - AI Systems Pass 1

- **Accepted:** classify `/ai-systems` as a marketing / landing / portfolio surface and use `taste-skill` as the only opinion skill. Source: Design Director and `taste-skill`. Decider: Andrew Heldy via the implementation specification.
- **Accepted:** preserve Inter and Bricolage Grotesque rather than introduce another type system. Source: brand implementation and Design Engineer. Decider: Andrew Heldy via existing site tokens.
- **Accepted:** use native CSS transitions with the existing IntersectionObserver reveal trigger. Do not use the installed Motion runtime for Pass 1 because no lifecycle, layout-morph, unmount, or gesture gate is passed. Source: `motion-director` / `motion-selection`. Decider: Design Director.
- **Rejected:** add generated hero imagery or generic product screenshots. Source: `taste-skill` imagery recommendation. Reason: conflicts with the project's no-AI-imagery rule and the feature's system-map narrative; sanitized real artifacts are planned for Pass 3. Decider: Design Director.
- **Rejected:** add dark mode specifically for the showcase. Source: `taste-skill` dual-mode default. Reason: the implemented Rent With Heldy public brand is light-only and this feature should extend, not fork, that system. Decider: Design Director.
- **Accepted:** allow the hero and final contact actions to use different labels because they occupy different narrative roles: the hero advances to the conversion section, while the final action opens the existing email channel. Source: feature specification overriding `taste-skill` duplicate-intent preference. Decider: Andrew Heldy via implementation specification.
