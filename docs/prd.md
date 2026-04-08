# SEOrushed Product Requirements Document

## Document Status

- Product: SEOrushed
- Version: v1.0
- Date: April 1, 2026
- Status: Draft
- Owner: Bond Design & Co

## 1. Overview

SEOrushed is an SEO intelligence platform designed to help marketers, founders, consultants, and in-house growth teams analyze a website's search visibility, uncover keyword opportunities, identify technical SEO issues, and monitor how their brand appears across traditional search and AI-assisted search experiences.

The current product exists as a functional prototype with a polished interface and exploratory workflows for:

- Domain overview
- Keyword research
- Site audit
- Backlink analysis
- Position tracking
- Answer Engine Optimization (AEO) visibility
- Generative Engine Optimization (GEO) visibility

This PRD defines the product requirements for taking SEOrushed from prototype into a credible v1 platform.

## 2. Problem Statement

SEO tools are often expensive, fragmented, and overwhelming for smaller businesses and lean teams. Many users need faster answers to practical questions such as:

- How visible is my site in organic search?
- What keywords should I prioritize next?
- What technical issues are blocking performance?
- How strong is my backlink profile?
- How is my brand appearing in AI-assisted search experiences?

Current alternatives either require enterprise budgets, specialist knowledge, or too much manual assembly across multiple tools.

SEOrushed should reduce this complexity by offering one clean workspace for essential SEO intelligence, with clear recommendations and explainable outputs.

## 3. Vision

SEOrushed should become a modern search visibility cockpit that helps users understand:

- where they currently stand
- what is driving or hurting performance
- what actions they should take next
- how their visibility evolves across both classic and AI-mediated search channels

The product should feel simpler and more design-forward than legacy SEO platforms while remaining trustworthy enough for recurring business use.

## 4. Goals

### Business Goals

- Launch a credible v1 SEO product with clear differentiation around usability and AI-era search visibility
- Validate demand with consultants, agencies, and SMB growth teams
- Create a foundation for subscription revenue
- Establish a product architecture that can support future reporting, collaboration, and billing

### User Goals

- Quickly analyze a domain without setup friction
- Discover actionable keyword opportunities
- Understand top technical SEO issues in plain language
- Track project-level domains in one dashboard
- See sources and confidence behind surfaced insights
- Get recommendations that are specific enough to act on

## 5. Non-Goals for v1

The following are explicitly out of scope for initial release unless later approved:

- Full crawler infrastructure comparable to enterprise SEO suites
- Large-scale rank tracking across thousands of keywords
- Advanced competitor benchmarking across multiple markets
- Automatic backlink discovery at internet scale
- White-label agency portals
- Team collaboration with granular permissions
- Billing automation beyond basic subscription enablement
- API access for external customers

## 6. Target Users

### Primary Users

- Freelance SEO consultants
- Boutique agencies
- Startup founders doing their own growth
- Small in-house marketing teams

### Secondary Users

- Content marketers
- Webflow, Shopify, and WordPress site owners
- AI-search curious operators who want early GEO and AEO reporting

## 7. Core Jobs To Be Done

1. When I enter a client or company domain, I want a quick summary of SEO performance so I can assess opportunity fast.
2. When I research a keyword, I want useful volume, difficulty, and adjacent opportunities so I can decide what content to create.
3. When I audit a site, I want prioritized issues and fixes so I know what to do next.
4. When I review backlinks, I want a directional understanding of authority and link quality so I can identify gaps.
5. When I monitor visibility, I want to understand both traditional rankings and AI-surface presence so I can adapt strategy.

## 8. Product Principles

- Clarity over clutter
- Actionability over raw data volume
- Trust through transparency
- Fast first insight
- Modern, polished UX
- Explicit separation between measured data, estimated data, and AI-generated interpretation

## 9. v1 Scope

### In Scope

- User can add and manage tracked projects by domain
- User can run a domain overview analysis
- User can run keyword research
- User can run a site audit
- User can run backlink analysis
- User can run position tracking on a limited set of tracked terms
- User can view AEO visibility indicators
- User can view GEO visibility indicators
- User can access recommendations and cited sources where available
- User can revisit saved projects and prior analyses

### Out of Scope for v1

- Fully automated recurring crawl engine
- Multi-user workspaces
- Deep CRM integration
- Cross-channel paid media analytics
- Automated content generation

## 10. Key Product Requirements

### 10.1 Dashboard

The dashboard should act as the user's home base.

Requirements:

- Display tracked projects
- Show recent analyses by project
- Show status of latest scan per project
- Surface high-priority opportunities or issues
- Allow quick navigation into core workflows
- Support project creation with validated domain input

Success criteria:

- User can create a project in under 30 seconds
- User can open a project and understand its latest status at a glance

### 10.2 Domain Overview

Purpose:
Give a fast, directional overview of a domain's search presence.

Requirements:

- User can submit a domain
- System returns traffic estimate, keyword footprint, backlink summary, authority-style score, top keywords, competitors, and top insights
- Every surfaced metric must be labeled as one of:
  - measured
  - modeled estimate
  - AI summary
- Sources must be shown when used to support claims
- Empty, invalid, or malformed domains must return clear validation feedback

Acceptance criteria:

- Analysis completes within an acceptable user wait threshold
- Output includes visible source references when available
- No fabricated comparative claims such as "top 5% of sites" unless backed by a defined methodology

### 10.3 Keyword Research

Purpose:
Help users evaluate search opportunity and topic direction.

Requirements:

- User can submit a keyword phrase
- Return search volume, difficulty, CPC, intent, related keywords, questions, and trend data
- User can save promising keywords to a project
- Intent labels must follow a defined taxonomy
- Trend visualization must reflect underlying returned values only

Acceptance criteria:

- User can analyze a keyword and save it to a project
- Related terms and questions feel relevant and actionable
- Metrics are clearly labeled as sourced, estimated, or inferred

### 10.4 Site Audit

Purpose:
Identify technical SEO issues in a prioritized, readable format.

Requirements:

- User can submit a domain for audit
- Return a structured audit with overall score and sub-scores
- Show issues grouped by severity
- Each issue must include:
  - title
  - description
  - impact
  - recommended action
- Audit should cover crawlability, performance, SEO basics, mobile readiness, and best practices

Acceptance criteria:

- User can immediately tell what the top three issues are
- Output distinguishes between verified findings and heuristic or AI-inferred issues

### 10.5 Backlink Analytics

Purpose:
Give directional understanding of backlink health.

Requirements:

- User can analyze a domain's backlink profile
- Return total backlinks, referring domains, authority-style score, anchor distribution, top referring domains, and trend view
- If exact backlink counts are not available, the UI must describe the result as an estimate
- Export should only be offered when a real export exists

Acceptance criteria:

- User understands the quality and limitations of the data
- Referring domain list and anchors are useful enough to guide outreach thinking

### 10.6 Position Tracking

Purpose:
Track visibility changes for a manageable set of target terms.

Requirements:

- User can save target keywords per project
- System stores historical position snapshots
- User can view ranking changes over time
- System shows visibility score, average position, estimated traffic contribution, and competitor set
- "Last crawl" or "change" values must come from persisted history, not placeholders

Acceptance criteria:

- User can compare at least two ranking snapshots for a project
- Changes displayed in the UI are reproducible from stored records

### 10.7 AEO Visibility

Purpose:
Help users understand how well their content supports direct-answer search experiences.

Requirements:

- User can analyze a domain for answer-engine readiness
- Output includes snippet opportunities, question coverage, schema quality, and answer-focused recommendations
- Product language must avoid unsupported claims about platforms that are not actually measured
- Any platform-specific references must map to a documented methodology

Acceptance criteria:

- User can understand what AEO means in product terms
- Recommendations are concrete and tied to observed signals

### 10.8 GEO Visibility

Purpose:
Provide early visibility into brand presence across AI-assisted search surfaces.

Requirements:

- User can analyze a domain for GEO visibility
- Return directional indicators for AI citations, topic presence, source authority, and sentiment
- GEO outputs must be clearly framed as experimental
- Product must document the sources and methodology used for GEO scoring

Acceptance criteria:

- Experimental nature is obvious in both UX and documentation
- Users can distinguish exploratory GEO signals from firm SEO metrics

## 11. Data Trust and Methodology Requirements

This is the most critical product requirement for v1.

SEOrushed must not present estimated or AI-generated outputs as authoritative facts.

Every metric shown in the product must belong to one of these types:

- Verified: directly obtained from a trusted first-party or well-defined external source
- Estimated: modeled from external signals or heuristics
- Inferred: generated by AI interpretation or summarization

For every analysis module, the product must define:

- data source
- refresh behavior
- confidence level
- methodology summary
- whether a value is measured, estimated, or inferred

The UI must surface this clearly enough that a user is not misled into believing estimated traffic, backlinks, keyword volume, or authority scores are exact measurements.

## 12. User Stories

### Dashboard

- As a consultant, I want to create a project for a client domain so I can keep analyses organized.
- As a marketer, I want to reopen a tracked project so I can continue work without rerunning everything from scratch.

### Domain Analysis

- As a founder, I want to enter a competitor domain and get a quick overview so I can assess opportunity.

### Keyword Research

- As a content strategist, I want related terms and questions so I can build a content brief.

### Site Audit

- As a website owner, I want prioritized technical issues so I know what to fix first.

### AEO and GEO

- As a growth lead, I want to understand whether my brand shows up in answer-oriented and AI-assisted search experiences so I can adapt content strategy early.

## 13. Functional Requirements

### Project Management

- Create project
- Edit project
- Delete project
- Save project domain
- Associate saved keywords and analyses with a project

### Persistence

- Store projects
- Store saved keywords
- Store analysis history
- Store timestamped results for trend comparisons

### Validation

- Validate domain inputs
- Validate keyword inputs
- Handle empty and malformed submissions gracefully

### Error Handling

- Show user-friendly error messages for failed analysis
- Distinguish between rate limit, provider error, invalid input, and unavailable source data
- Avoid silent failures

### Sources and Explainability

- Attach source references to analyses when available
- Show methodology tooltip or panel for major metrics

## 14. Non-Functional Requirements

### Performance

- First usable screen should load quickly on desktop and mobile
- Typical analysis response should feel responsive, with visible loading states

### Reliability

- Analysis requests should not fail silently
- Persisted project data must survive app restarts

### Security

- API keys must never be exposed to browser clients in production
- Sensitive provider access must run server-side
- The platform must be designed for authenticated access before paid launch

### Scalability

- Architecture should support moving from local SQLite prototype to hosted database
- Analysis execution should be separable into service or job layers as demand grows

## 15. UX Requirements

- Modern, high-trust visual language
- Clear distinction between project data and exploratory analysis
- Visible loading, success, and failure states
- No fake deltas, placeholder exports, or pseudo-verified labels in production
- Empty states should guide the next action
- Charts and metrics should favor readability over decoration

## 16. Success Metrics

### Product Metrics

- Project creation rate
- Analysis completion rate
- Repeat usage within 7 days
- Number of saved projects per active user
- Number of saved keywords per active user

### Outcome Metrics

- Percentage of users who complete at least one analysis in their first session
- Percentage of users who return for a second session
- Qualitative trust score from user interviews
- Conversion from free usage to paid plan

## 17. Risks

### Trust Risk

If AI-estimated outputs are presented as hard SEO facts, users may lose trust quickly.

Mitigation:

- label every metric type
- show sources
- define methodology
- avoid unsupported precision

### Technical Risk

Running provider logic in the client may expose secrets or create unreliable execution patterns.

Mitigation:

- move all analysis execution to server-side endpoints
- add request validation and logging

### Product Risk

The platform may feel broad but shallow if too many modules ship without depth.

Mitigation:

- prioritize a strong v1 around dashboard, domain analysis, keyword research, site audit, and basic saved projects
- treat AEO and GEO as clearly experimental modules

## 18. Release Strategy

### Phase 1: Credible Prototype Hardening

- Add real PRD and product language
- Remove fake deltas and placeholder statuses
- Define trust labels for all metrics
- Move provider access server-side
- Save project-level analysis history

### Phase 2: Beta Release

- Add authentication
- Add hosted persistence
- Improve reporting and exports
- Introduce onboarding and sample projects

### Phase 3: Commercial Readiness

- Add subscriptions
- Add richer keyword tracking
- Add client reporting and sharing
- Add improved GEO/AEO methodology docs

## 19. Open Questions

- Which external data sources, if any, will be used for authoritative SEO metrics in v1?
- Will SEOrushed be marketed as a production SEO tool or an AI-assisted directional insight platform?
- Which modules are required for launch versus shown as experimental?
- What level of historical persistence is required before beta?
- Will the first paid customer be an agency, consultant, or SMB operator?

## 20. Recommended v1 Positioning

SEOrushed should initially position itself as:

"A modern SEO intelligence workspace for fast, explainable search insights, with experimental visibility tools for the AI-search era."

This positioning is strong because it:

- supports the current product direction
- leaves room for AI-assisted analysis
- avoids overstating precision
- creates a cleaner bridge from prototype to trustworthy platform

## 21. Immediate Next Steps

1. Convert this PRD into an implementation roadmap with milestones by module.
2. Mark each current UI metric as verified, estimated, or inferred.
3. Redefine the MVP as a smaller, more credible launch slice.
4. Move Gemini-powered analysis calls behind server endpoints.
5. Add saved analysis history and project-level persistence.
