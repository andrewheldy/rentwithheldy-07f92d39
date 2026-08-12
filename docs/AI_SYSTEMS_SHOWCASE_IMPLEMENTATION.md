# AI Systems Showcase — Implementation Plan

**Repository:** `andrewheldy/rentwithheldy-07f92d39`  
**Feature Route:** `/ai-systems`  
**Status:** Pass 1 implemented and validated  
**Primary Implementation Strategy:** 3 passes  
**Last Updated:** 2026-08-12

---

## 1. Objective

Build a polished, hidden landing page inside the existing Rent With Heldy website that demonstrates how AI has been integrated across a real operating car rental business.

The page should function as:

- an interactive case study
- a portfolio of real AI-enabled business systems
- a private sales page for prospective consulting / implementation clients
- a demonstration of how repeatable business workflows can be improved with AI, automation, structured data, and better system design

The page should not position Rent With Heldy as an AI company.

Instead, Rent With Heldy is the proving ground.

The core story is:

> A real car rental business contains dozens of repeatable workflows, decisions, handoffs, research tasks, and customer interactions. AI becomes valuable when it is woven into those systems instead of bolted on as a standalone chatbot.

The page should ultimately show that the same methodology can be transferred to other industries.

---

## 2. Audience

### Primary Audience

Car rental hosts, fleet operators, mobility businesses, and transportation operators who may want help implementing similar systems.

Typical needs may include:

- guest communication
- fleet operations
- rental workflows
- maintenance coordination
- AI voice agents
- lead qualification
- partnership sales
- vehicle acquisition research
- fleet analytics
- SOP systems
- internal automation

### Secondary Audience

Operators of other businesses with repeatable workflows.

Examples:

- hotels
- property managers
- home service companies
- automotive businesses
- restaurants
- professional services
- law firms
- hospitality businesses
- other operationally repetitive businesses

The page should help these visitors recognize patterns in their own operations.

---

## 3. Positioning

### Primary Positioning

**AI That Actually Runs the Business.**

Supporting idea:

**Built inside Rent With Heldy. Applicable far beyond car rentals.**

### Strategic Positioning

Do not position the offering as generic "AI consulting."

Prefer language around:

- systems
- workflows
- operations
- implementation
- automation
- integration
- context
- decision support
- knowledge systems
- business processes

The page should communicate:

> The goal is not to add AI tools. The goal is to build better systems.

---

## 4. Existing Repository Architecture

This implementation should build on the current site rather than creating a parallel architecture.

Current repository conventions include:

- Vite
- React 18
- TypeScript
- `react-router-dom`
- Tailwind CSS
- shadcn/ui
- Radix primitives
- `react-helmet-async`
- Supabase
- TanStack Query
- `motion`
- Vitest
- Playwright
- Vercel deployment

Relevant existing files and documentation include:

- `CLAUDE.md`
- `docs/REDESIGN_BLUEPRINT.md`
- `docs/ART_DIRECTION.md`
- `docs/CREATIVE_DIRECTION.md`
- `docs/COPY_PRINCIPLES.md`
- `docs/INTERACTION_PRINCIPLES.md`
- `src/App.tsx`
- `src/index.css`
- shared layout / UI components
- shared SEO implementation
- `public/sitemap.xml`
- `public/robots.txt`

### Architecture Rule

The current codebase is authoritative.

If an older planning document conflicts with the current implementation, follow the current code.

Do not perform another full site audit before implementation.

Inspect only the files necessary to integrate this feature safely.

---

## 5. Protected Existing Systems

This feature should be additive and should not interfere with revenue-critical or operational systems.

Do not modify unrelated behavior involving:

### Booking

- `/book`
- Wheelbase / Outdoorsy booking integration
- booking widget configuration

### Lead Capture

- public quote forms
- lead form payloads
- Supabase lead inserts
- email delivery pipeline

### Fleet

- Supabase fleet data
- vehicle image storage
- existing public fleet types / interfaces
- public vehicle assets

### Admin

- admin routes
- authentication
- admin role logic
- protected routes

### SEO

- indexed production routes
- existing schemas
- canonical behavior
- existing sitemap URLs

### Deployment

- SPA routing behavior
- Vercel configuration
- environment configuration

Any change to a protected system must be necessary for `/ai-systems`, minimal, and validated.

---

## 6. Route and Privacy Behavior

Create:

`/ai-systems`

The page should be accessible to anyone with the exact URL.

This is not intended to be authenticated.

### Requirements

- do not add the route to the main navigation
- do not add the route to the footer
- do not link to it from existing public pages
- add `noindex`
- add `nofollow`
- do not add it to `public/sitemap.xml`
- preserve indexing behavior for all other routes
- ensure direct URL navigation works under the existing SPA/Vercel configuration

### Important Clarification

This is obscurity, not security.

Anyone with the URL can access the page.

---

## 7. Visual Direction

The page should be visually connected to Rent With Heldy while feeling slightly more technical and systems-oriented than the public rental pages.

Reference feel:

**Linear × Stripe × Framer × modern operations software**

Avoid:

- generic AI agency templates
- crypto aesthetics
- giant glowing brains
- robot illustrations
- excessive neon
- random particle backgrounds
- gratuitous gradients
- hyperactive motion
- generic "AI revolution" visuals

Prefer:

- strong typography
- intentional whitespace
- subtle technical grid motifs
- clean diagrams
- system maps
- dashboard-inspired UI
- workflow connectors
- restrained accent color usage
- clear visual hierarchy
- polished interactive states

The site should still feel hospitality-aware and human.

---

## 8. Interaction Philosophy

Follow `docs/INTERACTION_PRINCIPLES.md`.

Motion should primarily:

1. explain
2. guide
3. confirm
4. delight only after the first three

### Motion Rules

Prefer:

- opacity transitions
- small Y-axis reveals
- connector emphasis
- active state transitions
- restrained stagger
- subtle sticky storytelling
- section reveals
- progress cues

Avoid:

- bouncing
- spinning
- wobbling
- dramatic rotation
- scroll hijacking
- animations that slow reading
- permanent decorative loops unless extremely lightweight

Use the existing `motion` dependency.

Do not introduce Framer Motion as a second package, GSAP, or another animation framework unless a later implementation constraint clearly requires it.

All motion must respect:

`prefers-reduced-motion`

---

## 9. Page Narrative

The page should progressively make the following argument:

1. Rent With Heldy is a real operating business.
2. Real businesses contain many interconnected workflows.
3. AI can improve multiple parts of those workflows.
4. AI is not one tool or one chatbot.
5. Useful AI connects knowledge, decisions, systems, and actions.
6. The same pattern exists beyond car rental.
7. Another business can be mapped and improved using the same methodology.

---

# 10. Section-by-Section Specification

---

## Section 01 — Hero

### Headline

# AI That Actually Runs the Business.

### Supporting Copy

See how AI is being integrated across customer service, operations, fleet management, sales, research, marketing, product development, and decision-making inside a real car rental company.

### Secondary Statement

**Built inside Rent With Heldy. Applicable far beyond car rentals.**

### CTAs

Primary:

**Explore the Systems ↓**

Secondary:

**Build This for My Business**

The primary CTA should move the visitor into the page narrative.

The secondary CTA should scroll to the final conversion section for V1.

### Hero Visual

Create a central representation of Rent With Heldy.

Surround it with nodes such as:

- Customers
- Fleet
- Operations
- Sales
- Research
- Marketing
- Finance
- Knowledge
- Automation

Narrative progression:

**One business.**

**Dozens of workflows.**

**AI woven throughout.**

### Pass 1

Build a polished static / semi-animated system map.

### Pass 2

Upgrade to richer system connections and scroll-aware behavior.

---

## Section 02 — The Business

### Headline

# This Started With a Car Rental Company.

### Purpose

Ground the page in a real operating company before showing AI systems.

Represent the types of functions Rent With Heldy manages:

- reservations
- guests
- vehicles
- airports
- maintenance
- fleet utilization
- partnerships
- marketing
- sales
- customer service
- research
- documentation
- operations
- growth

### Core Copy Direction

Every one of these functions creates:

- repetitive work
- recurring decisions
- manual handoffs
- repeated questions
- scattered information
- recurring research needs
- opportunities for better systems

Core idea:

> The objective was never to "use AI." The objective was to build a better business.

### Visual

Show business functions expanding from a central Rent With Heldy node or operating core.

---

## Section 03 — Business OS

### Headline

# The Business Is a System.

### Purpose

Show visitors how an ordinary customer interaction touches many internal systems.

### Example Flow

Customer Inquiry

↓

Voice / Website / SMS / Email

↓

Lead Capture

↓

Qualification

↓

Reservation

↓

Guest Experience

Then branch into:

- Operations
- Fleet
- Analytics
- Marketing
- Follow-Up
- Partnerships
- Knowledge

### Interaction

Desktop:

- node-based workflow
- hover/focus reveals details
- active connectors
- visible system relationships

Mobile:

- vertical flow
- tap to expand
- no squeezed network diagram

### Example Detail Card

#### Lead Qualification

AI can help interpret the customer's request, identify missing information, retrieve relevant business context, and prepare the next action without requiring someone to manually reconstruct the situation.

---

## Section 04 — AI Systems Gallery

### Headline

# AI Is Not One Tool. It's a Layer Across the Business.

Create seven primary system categories.

---

### 4.1 Customer Experience

Examples:

- AI voice agents
- reservation questions
- automated FAQs
- contextual guest communication
- airport instructions
- shuttle instructions
- return instructions
- review response assistance
- personalized messaging
- knowledge-grounded support

#### Mini Case Study Concept

**Guest Questions at 11:47 PM**

Problem:

Guests need operational answers outside normal hours.

System:

Reservation context + company SOPs + AI reasoning

Result:

The correct procedure can be retrieved and turned into a relevant answer or next action without manually searching through documentation.

Do not make unsupported labor-saving claims.

---

### 4.2 Operations

Examples:

- SOP generation
- SOP retrieval
- cleaning prioritization
- trip workflows
- license verification workflows
- lockbox release logic
- maintenance workflows
- damage reporting
- internal task routing
- decision trees
- team knowledge systems

Core concept:

Turn tribal knowledge into structured operational intelligence.

---

### 4.3 Fleet Intelligence

Examples:

- fleet dashboards
- utilization
- revenue per vehicle
- trip analytics
- fleet normalization
- maintenance history
- vehicle performance comparison
- damage tracking
- lifecycle analysis
- acquisition decisions

### Data Rule

Do not fabricate company metrics.

If real production data is not intentionally supplied to this page, use clearly labeled demonstration data or generic UI states.

---

### 4.4 Sales & Growth

Examples:

- hotel partnership prospecting
- body shop prospecting
- attorney partnership research
- rideshare partnerships
- CRM workflows
- contact enrichment
- personalized outreach
- follow-up automation
- lead qualification
- landing-page funnels
- local SEO research
- content development

### Example Flow

100 Prospects

↓

Research

↓

Qualification

↓

Contact Enrichment

↓

Personalized Outreach

↓

Follow-Up

↓

CRM

↓

Partnership Opportunity

---

### 4.5 Research

Examples:

- insurance research
- competitor research
- market research
- pricing research
- regulations
- software evaluation
- vendor evaluation
- partnership research
- new business models
- opportunity analysis

### Example Visual

Question

↓

Sources

↓

Evidence

↓

Comparison

↓

Risks

↓

Recommendation

↓

Action Plan

Core idea:

Research becomes valuable when it feeds an actual business decision.

---

### 4.6 Vehicle Acquisition

Show AI-assisted structured vehicle evaluation.

Potential inputs:

- purchase price
- mileage
- model year
- reliability
- operating cost
- rental eligibility
- market demand
- estimated revenue potential
- maintenance risk
- useful life

Possible output states:

**BUY**

**INVESTIGATE**

**PASS**

### Positioning Rule

Present this as decision support.

Do not imply AI can reliably predict investment returns.

---

### 4.7 Product Development

Use the Rent With Heldy structured ownership / rent-to-own program as the flagship example.

Show AI being used for:

- driver economics
- weekly pricing
- ownership equity concepts
- upgrade logic
- retention modeling
- vehicle tiers
- financial scenarios
- dashboards
- application funnels
- partner strategy
- product iteration

### Conceptual Driver Dashboard

- Ownership %
- Equity Earned
- Remaining Balance
- Time to Ownership
- Upgrade Eligibility

Core idea:

AI is being used not only to automate existing work, but also to help design new products and business models.

---

## Section 05 — Before / After

### Headline

# Automation Starts With Understanding the Workflow.

### Before

Incoming inquiry

↓

Someone reads it

↓

Checks availability

↓

Looks through information

↓

Writes response

↓

Updates system

↓

Creates reminder

↓

Remembers to follow up

### AI-Enabled

Incoming inquiry

↓

Context collected

↓

Request classified

↓

Relevant data retrieved

↓

Next action prepared

↓

Systems updated

↓

Follow-up scheduled

↓

Human handles exceptions and relationships

### Key Statement

**The goal isn't removing humans. It's removing the work humans shouldn't have to keep repeating.**

### Pass 1

Side-by-side or progressive comparison.

### Pass 2

Upgrade to draggable or scroll-driven transformation if useful and performant.

---

## Section 06 — Built, Not Theoretical

### Headline

# Built, Not Theoretical.

Create artifact-demo containers designed to later accept real screenshots, video, or interactive previews.

### Artifact Categories

#### Voice AI

Call

↓

Transcript

↓

Knowledge Retrieval

↓

Response / Action

#### Fleet Intelligence

Vehicles

↓

Utilization

↓

Revenue

↓

Maintenance

↓

Performance

#### AI Research

Question

↓

Sources

↓

Synthesis

↓

Recommendation

#### SOP Intelligence

Documents

↓

Structured Knowledge

↓

Operational Answer

#### Partnership Engine

Prospects

↓

Research

↓

Qualification

↓

Outreach

↓

Follow-Up

↓

CRM

#### Vehicle Acquisition

Candidates

↓

Data

↓

Analysis

↓

Decision

### Implementation Rule

Mockups should be tasteful and structurally realistic.

Do not fabricate actual results.

Design them so real screenshots or screen recordings can replace the placeholder media without rewriting the page.

---

## Section 07 — Zoom Out

### Headline

# Car Rental Is Just the Use Case.

### Purpose

Transition from the specific Rent With Heldy case study into the broader consulting thesis.

Start with:

**Rent With Heldy / Car Rental**

Then expand into industries such as:

- Hotel
- Property Management
- Home Services
- Restaurant
- Law Firm
- Automotive
- Professional Services
- Other Repeatable Operations

### Main Reveal

# The Industry Changes. The Pattern Doesn't.

### Supporting Concept

Every business contains some combination of:

- repetitive questions
- recurring decisions
- manual handoffs
- scattered knowledge
- research
- lead follow-up
- reporting
- scheduling
- documentation
- data entry
- operational rules
- repeated information retrieval

Those are potential system-design opportunities.

AI becomes valuable when connected to:

- workflow
- context
- data
- business rules
- existing systems

### Pass 1

Build the structural visual.

### Pass 2

Upgrade to a cinematic zoom / expansion sequence.

---

## Section 08 — AI Opportunity Finder

### Headline

# Where Is AI Hiding Inside Your Business?

### Prompt

**What consumes your team's time?**

### Selectable Options

- Customer Questions
- Research
- Follow-Up
- Data Entry
- Scheduling
- Quoting
- Reporting
- Training
- Lead Generation
- Documentation
- Internal Search
- Repetitive Decisions
- Operations
- Quality Control

### Output

Generate a deterministic client-side:

# AI Opportunity Map

Potential recommendation categories:

### Knowledge System

Centralize company information and make it retrievable.

### Workflow Automation

Move repetitive steps between systems automatically.

### AI Assistant / Agent

Handle structured questions or processes using company context.

### Decision Support

Turn scattered business information into structured recommendations.

### Customer Automation

Reduce response time while preserving escalation to humans.

### V1 Rule

Do not build an API or LLM integration.

Use deterministic mappings stored separately from presentation logic.

The architecture should make it easy to replace deterministic mapping with AI-generated analysis later.

---

## Section 09 — How I Work

### Headline

# AI Systems for Real Businesses.

Use a four-stage framework.

### 01 — Find

Map the workflows where AI or automation can create useful leverage.

### 02 — Build

Create agents, automations, internal tools, knowledge systems, or decision-support systems.

### 03 — Integrate

Connect them to the tools and processes the business already uses.

### 04 — Improve

Observe how the system performs, identify friction, and continue refining it.

Keep this section visually simple.

---

## Section 10 — Final CTA

### Headline

# Your Business Already Has AI Opportunities.

### Supporting Copy

You probably don't need another AI tool.

You need to identify the parts of your business where information, decisions, and repetitive work can be turned into better systems.

### CTA

**Let's Map Your Business**

### Supporting Line

Built from lessons learned implementing AI inside a real operating business.

### V1 CTA Behavior

Prefer reusing an appropriate existing contact mechanism.

Do not introduce a new scheduling platform merely for this page.

If no appropriate conversion flow exists, implement an obvious placeholder target that can be replaced later.

---

# 11. Copy Rules

The page should sound like a business operator who builds systems.

Avoid:

- unlock the power of AI
- AI revolution
- cutting-edge artificial intelligence
- game-changing
- next-generation
- future-proof
- 10x
- magical
- revolutionary transformation

Prefer:

- workflows
- systems
- operations
- processes
- decisions
- context
- automation
- integration
- implementation
- knowledge
- business rules
- decision support

Do not invent:

- revenue lifts
- cost savings
- conversion improvements
- hours saved
- productivity percentages
- testimonials
- customer outcomes

If a result cannot be supported, do not claim it.

---

# 12. Proposed Component Architecture

Suggested page:

`src/pages/AISystems.tsx`

Suggested feature directory:

`src/components/ai-systems/`

Potential components:

- `AISystemsHero`
- `BusinessSystemMap`
- `BusinessNode`
- `WorkflowDiagram`
- `SystemsGallery`
- `SystemCategory`
- `MiniCaseStudy`
- `BeforeAfterWorkflow`
- `ArtifactShowcase`
- `ArtifactCard`
- `IndustryExpansion`
- `OpportunityFinder`
- `ProcessFramework`
- `AISystemsCTA`

Potential supporting data:

`src/data/ai-systems.ts`

or a feature-local equivalent if that better matches repository conventions.

### Architecture Rules

- do not create one enormous component
- separate structured content from complex presentation logic when useful
- avoid abstraction for trivial one-off markup
- reuse existing primitives and design tokens
- keep the page isolated enough that later interaction work does not destabilize other routes

---

# 13. Responsive Behavior

## Desktop

Use desktop space for:

- system maps
- branching flows
- richer artifacts
- sticky storytelling where appropriate
- layered visual hierarchy

## Tablet

Reduce density while retaining the overall system relationships.

## Mobile

Do not shrink desktop diagrams.

Instead:

- turn network diagrams into vertical flows
- turn hover behavior into tap behavior
- reduce simultaneous nodes
- simplify sticky interactions
- reduce motion intensity
- preserve readable type
- maintain accessible touch targets
- prevent horizontal overflow
- preserve the narrative order

Mobile is a first-class experience.

---

# 14. Accessibility

Required:

- semantic HTML
- valid heading structure
- keyboard-accessible controls
- visible focus states
- appropriate button semantics
- touch-friendly controls
- accessible labels
- sufficient contrast
- `prefers-reduced-motion`
- decorative graphics hidden from assistive technology where appropriate
- state changes communicated accessibly where needed

Interactive diagrams should remain understandable without relying solely on visual motion.

---

# 15. Performance

Do not sacrifice performance for presentation.

Requirements:

- use existing dependencies
- avoid unnecessary JavaScript
- use transform / opacity for motion where practical
- avoid constant expensive animation loops
- lazy-load future heavy media
- use explicit dimensions for media
- avoid layout shift
- preserve smooth scrolling
- do not increase complexity on unrelated public routes
- do not install an additional animation library during Pass 1

---

# 16. Placeholder vs. Real Artifact Strategy

Pass 1 will require placeholder visualizations for systems that do not yet have intentionally selected public-facing screenshots.

Placeholder content must:

- look polished
- be structurally realistic
- avoid fake business claims
- be easy to replace
- clearly avoid presenting demonstration data as actual production metrics

Pass 3 will replace selected placeholders with:

- real screenshots
- dashboard captures
- voice-agent examples
- workflow visuals
- research examples
- screen recordings
- selected SOP / knowledge system visuals

Real artifacts should be sanitized before public display.

Do not expose:

- guest PII
- VINs
- license plates
- private financial data
- admin credentials
- internal secrets
- private customer communications
- sensitive operational information

---

# 17. Implementation Passes

---

## Pass 1 — Foundation + Narrative

### Goal

Build the complete page from top to bottom with correct structure and restrained interaction.

### Deliverables

- `/ai-systems` route
- noindex / nofollow
- sitemap exclusion
- complete page narrative
- responsive layout
- feature-specific components
- visual hierarchy
- basic system map
- first-version workflow diagram
- systems gallery
- first-version before / after
- artifact placeholder system
- industry expansion structure
- deterministic Opportunity Finder
- process framework
- final CTA
- restrained Motion-based reveals
- reduced-motion support
- implementation documentation

### Pass 1 Principle

The story must work without advanced animation.

Do not over-engineer scroll choreography yet.

---

## Pass 2 — Signature Interactions

### Goal

Turn the strongest storytelling sections into memorable interactive experiences without compromising readability or performance.

### Candidate Upgrades

#### Hero

- richer business-system connections
- scroll-aware node activation
- progressive connector reveals
- controlled depth / parallax

#### Business OS

- animated connector paths
- active workflow state
- richer node details
- scroll progression

#### Systems Gallery

- enhanced expansion behavior
- stronger transitions between system categories
- more interactive mini case studies

#### Before / After

- draggable transformation
- scroll-driven transformation
- animated workflow simplification

#### Artifact Showcase

- interactive states
- demo transitions
- real media support

#### Zoom Out

- Rent With Heldy → industry abstraction
- cinematic expansion sequence
- controlled sticky section behavior

#### Opportunity Finder

- richer mapping feedback
- better relationship visualization
- transition states between selected problems and system recommendations

### Pass 2 Guardrail

If an effect does not improve comprehension, do not add it.

---

## Pass 3 — Real Artifacts + Polish

### Goal

Replace demonstration content with selected real-world evidence and complete production refinement.

### Deliverables

- real voice-agent example
- real workflow screenshots
- real dashboard screenshots
- selected research output
- selected SOP / knowledge system example
- real partnership workflow artifact
- real vehicle acquisition artifact
- sanitized product development visuals
- screen recordings where helpful
- mobile refinement
- final animation tuning
- accessibility QA
- performance QA
- content QA
- production preview review

---

# 18. Acceptance Criteria

## Route

- `/ai-systems` resolves directly
- browser refresh works on the route
- route does not require authentication

## Privacy / SEO

- noindex present
- nofollow present
- route absent from main navigation
- route absent from footer
- route absent from sitemap
- no other route's SEO behavior is changed

## Narrative

The page clearly communicates:

- this is based on a real business
- AI is integrated across multiple business functions
- AI is more than a chatbot
- workflows matter more than tools
- the methodology applies outside car rental
- the visitor can engage for implementation help

## Responsiveness

- desktop works
- tablet works
- mobile works
- no horizontal overflow
- diagrams adapt rather than shrink

## Accessibility

- keyboard interaction works
- focus states exist
- interactive controls use appropriate semantics
- reduced-motion mode works
- no critical meaning depends only on animation

## Performance

- no avoidable heavy dependencies
- no expensive permanent animation loops
- no major layout shift
- public routes are not negatively affected

## Functionality

- Opportunity Finder works locally
- hover interactions have touch equivalents
- CTAs work
- no console errors introduced

## Existing Site Protection

- `/book` remains functional
- existing routes compile
- existing navigation remains unchanged
- existing forms are unaffected
- existing SEO configuration is unaffected outside this route

---

# 19. Validation Commands

Run applicable existing project commands before considering each implementation pass complete.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run Playwright where appropriate:

```bash
npm run test:e2e
```

If the project uses Bun in the active development workflow, equivalent commands may be used, but do not change package-management conventions unnecessarily.

---

# 20. Known Implementation Risks

### 1. Over-Animation

This page naturally invites excessive interaction.

Mitigation:

Keep Pass 1 restrained and require every advanced effect to serve comprehension.

### 2. Mobile Diagram Complexity

Network diagrams that work on desktop can become unusable on mobile.

Mitigation:

Design alternate mobile layouts rather than scaled-down desktop diagrams.

### 3. Fake-Looking AI Portfolio Content

Generic mockups could make the page feel less credible.

Mitigation:

Use structurally realistic placeholders in Pass 1 and replace key examples with sanitized real artifacts in Pass 3.

### 4. Brand Drift

The page could become visually disconnected from Rent With Heldy.

Mitigation:

Reuse established tokens, typography, spacing, and interaction principles while allowing a more technical presentation.

### 5. Unsupported Claims

Portfolio pages can easily imply savings or performance improvements that have not been measured.

Mitigation:

Do not make quantified claims without evidence.

### 6. Sensitive Internal Information

Real screenshots may expose customer, fleet, or operational data.

Mitigation:

Sanitize every artifact before inclusion.

### 7. Bundle Growth

Heavy media and animations could worsen the existing SPA bundle.

Mitigation:

Keep Pass 1 lightweight and lazy-load real media added later.

---

# 21. Expected Files

Exact paths should adapt to existing project conventions, but the likely implementation is:

## Add

```text
docs/AI_SYSTEMS_SHOWCASE_IMPLEMENTATION.md
src/pages/AISystems.tsx
src/components/ai-systems/
src/data/ai-systems.ts
```

Potential component files:

```text
src/components/ai-systems/AISystemsHero.tsx
src/components/ai-systems/BusinessSystemMap.tsx
src/components/ai-systems/WorkflowDiagram.tsx
src/components/ai-systems/SystemsGallery.tsx
src/components/ai-systems/MiniCaseStudy.tsx
src/components/ai-systems/BeforeAfterWorkflow.tsx
src/components/ai-systems/ArtifactShowcase.tsx
src/components/ai-systems/IndustryExpansion.tsx
src/components/ai-systems/OpportunityFinder.tsx
src/components/ai-systems/ProcessFramework.tsx
src/components/ai-systems/AISystemsCTA.tsx
```

## Modify

Likely:

```text
src/App.tsx
```

Potentially:

```text
src/index.css
```

only if feature-specific styles or reusable tokens are needed.

Potential shared SEO files may be modified only if required to properly produce route-specific noindex / nofollow behavior.

### Do Not Modify Unless Necessary

- Wheelbase booking files
- booking API
- lead-form payloads
- Supabase fleet shape
- admin routes
- public vehicle assets
- unrelated indexed route metadata

---

# 22. Definition of Done for Pass 1

Pass 1 is complete when:

1. `docs/AI_SYSTEMS_SHOWCASE_IMPLEMENTATION.md` exists and reflects the implemented architecture.
2. `/ai-systems` is implemented.
3. The page tells the complete story from hero through CTA.
4. The page is hidden from normal site navigation.
5. The route is noindex / nofollow.
6. The route is not in the sitemap.
7. All ten major narrative sections are present.
8. The Opportunity Finder works client-side.
9. The page works on mobile.
10. The page works with reduced motion.
11. Existing public site behavior remains intact.
12. Typecheck passes.
13. Production build passes.
14. Lint/test status is documented.
15. Pass 2 opportunities are clearly identified but not overbuilt.

---

# 23. Final Strategic Rule

This page should not impress visitors because it contains a large number of AI buzzwords or flashy animations.

It should impress them because they can see how many parts of an ordinary business can be understood as systems.

The desired reaction is:

> "I didn't realize all of those parts of a business could connect like that."

That insight is the product.

---

# 24. Pass 1 Implementation Reality

**Implemented:** 2026-08-12

Pass 1 is complete in the current repository. Implementation preserves the planned ten-chapter narrative while adapting the provisional component list to the existing codebase: related chapters are grouped into focused feature components, and all feature styling lives in `src/styles/ai-systems.css` rather than expanding shared global styles.

The Design Intelligence addendum referenced by the kickoff was not present in this version of the plan when implementation began. The canonical repository available alongside this project was therefore reviewed read-only at commit `aac21b3287b62f9488e879b58650f08569550cb8`, and the required consumer record, brief, decision log, motion spec, and rendered review were created under `docs/`. No Design Intelligence package was installed, vendored, or synchronized.

Material implementation choices:

- `/ai-systems` is a direct-only SPA route with `noindex,nofollow`; it is absent from shared navigation, footer discovery, and `public/sitemap.xml`.
- The route has a dedicated `aiSystems` localization namespace in English, Spanish, French, Portuguese, and Hebrew, including RTL rendering.
- The Opportunity Finder is deterministic and client-only. It does not imply an automated diagnosis or call an external AI service.
- Pass 1 motion uses native CSS transitions and the existing IntersectionObserver reveal primitive. The installed Motion runtime was not selected because no higher-tier engine gate was passed.
- Placeholder artifacts are deliberately structural diagrams with explicit replaceable-media notes, not simulated product screenshots or invented customer data.
- The hero system map, Business OS, gallery, comparisons, artifact set, industry expansion, Opportunity Finder, process, and CTA all recompose for mobile instead of scaling desktop diagrams.

Validation completed:

- typecheck, lint, unit tests, production build, and localization consistency
- dedicated Playwright narrative, deterministic-output, metadata, keyboard/focus, responsive overflow, reduced-motion, reveal lifecycle/cleanup, layout-shift, and Hebrew RTL checks
- rendered Anti-Slop (`DISTINCTIVE`), Accessibility, Motion, and Mobile UX reviews with material findings fixed
- motion performance trace at 4x CPU throttling with compositor-only final-state verification

Pass 2 was intentionally left unbuilt by this pass. Its eventual candidate choreography required fresh selection through Motion Intelligence rather than treating any section 17 candidate as pre-approved.

---

# 25. Pass 2 Implementation Reality

**Implemented:** 2026-08-12

Pass 2 is complete in the current repository. The candidate audit selected exactly two explanatory upgrades and rejected the others where interaction would imply unsupported topology, delay reading, decorate an already-complete control, or amplify Pass 3 placeholders.

Implemented signature interactions:

- **Business OS causal trace:** selecting any stage now exposes prerequisite, active, and downstream states across the existing six-stage sequence. Connector emphasis accumulates through the selected stage, the active explanation remains textual, and semantic state is available through `aria-current`, `aria-pressed`, and localized accessible names.
- **Opportunity Finder reasoning assembly:** every deterministic recommendation now lists the exact selected work patterns whose fixed local mappings caused it to appear. No generated reasoning, scoring, external AI request, ranking, or diagnosis was added.

Motion and interaction reality:

- A fresh Pass 2 audit, Design Director brief, and schema-valid Motion Intelligence spec live under `docs/`.
- Native CSS remains the selected engine. React owns deterministic state and a small shared pointer-intent hook; CSS owns 180ms state feedback.
- Pointer and touch may receive brief feedback. Keyboard, programmatic, and assistive-technology activation resolve instantly, and reduced motion explicitly removes the Pass 2 transitions while preserving complete end states.
- Hero motion was rejected because its lines are illustrative rather than a defined causal graph. Gallery, comparison, artifact, industry, process, and CTA choreography was rejected because it would not add enough comprehension in this pass.
- Pass 3 remains unbuilt: demonstration artifacts still await sanitized real media and final production polish.

Validation completed:

- rendered Anti-Slop (`DISTINCTIVE`), Accessibility, Motion, and Mobile UX reviews at desktop, mobile, and Hebrew RTL layouts
- pointer, keyboard, simulated touch, reduced-motion, repeated-navigation cleanup, cross-locale reasoning, 44px mobile-target, and zero-overflow browser checks
- repository typecheck, lint, unit tests, production build, localization consistency, and full applicable Playwright validation
