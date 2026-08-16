# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are non-technical product owners, founders, or marketing leads at tech-enabled businesses. They have no dedicated data analyst and need to make product decisions from user behavior data without interpreting raw analytics dashboards themselves. No other primary audience is defined for now.

## Product Purpose

Sensa is an AI-powered user behavior tracking and analytics product. It helps these users understand how people behave on their web or mobile product, and what to do next, without requiring dashboard literacy. Success means the user can leave a session with a clear, trustworthy understanding of behavior and a concrete next step—not a pile of charts to decode.

## Positioning

Sensa’s meaningfully different claim is an AI narrative that explains *why* behavior happened in plain language, with each claim backed by the actual underlying data so the user can verify it. Generic analytics can show metrics; Sensa narrates and grounds them.

## Operating Context

Users connect their site (tracking script + site URL), optionally upload CSV event data, and work primarily in Dashboard, Reports, Heatmap, Session Recordings, Connect, and Settings. Analysis can run on a recurring schedule or on demand. Illustrative sample journeys (e.g. real estate search → listing → contact) are examples, not a market restriction.

## Capabilities and Constraints

Confirmed capabilities include:

- Site connection and live event ingestion via tracking script
- Manual CSV upload as a secondary/optional path
- Dashboard overview metrics, last-analysis summary, and conversion preview
- Reports with funnel, engagement, trends vs prior report, and AI insights
- Heatmaps from click data with page snapshots
- Session recordings and AI session summaries
- Account settings (product name, password, analysis cadence, account deletion)

Primary data path today is connect site + tracking; CSV is optional. Platform is web. Stack already established: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), Recharts.

Undecided / not required yet: a specific accessibility standard.

## Brand Commitments

- Product name: **Sensa**
- Voice: minimal, professional analytics tool—not consumer or playful

## Evidence on Hand

- Working authenticated product surfaces listed above
- Harbor Homes–style demo / synthetic funnel data used for development and demos
- Do not invent testimonials, customer logos, benchmarks, or pricing claims

## Product Principles

1. Explain before you chart — narrative and plain language come first for non-analyst users.
2. Every claim must be checkable — AI insights stay tied to underlying data.
3. Prefer the live tracking path — connected-site data is primary; CSV stays optional.
4. Stay professional and calm — the UI should feel like a trustworthy analytics tool.
5. Scope deliberately — ship confirmed surfaces; don’t invent markets, proof, or standards.
