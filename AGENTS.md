<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Overview
Sensa is an AI-powered user behavior tracking and analytics tool. It helps product owners (non-technical, no in-house data analyst) understand how users behave on their web or mobile app, without needing to read complex dashboards.

## Target User
A product owner, founder, or marketing lead at a tech-enabled business — has no dedicated data analyst, needs to make product decisions from user behavior data without interpreting raw analytics dashboards themselves.

## MVP Scope (build this now)
- Upload user behavior event data (CSV) — not live tracking yet
- Funnel visualization of a key user journey (e.g. search → view listing → contact)
- Engagement metrics: time on page, bounce rate, pages per session
- Simple heatmap built from click/scroll coordinates in the same event data
- AI narrative summary, one anomaly flag, one recommendation per report
- Explainability view — user can see the raw data behind any AI claim
- Saved accounts with report history for period-over-period comparison

## Out of scope for now (do not build these yet)
- Live session recording/replay (Hotjar-style)
- External data ingestion (social media, industry sources)
- Developer activity tracking
- Automatic live tracking via an embedded script/SDK on the client's site or app — this is the core long-term vision for how Sensa will collect data, but for this MVP phase, data enters only via manual CSV upload. When designing the data model and architecture, keep this in mind so the event data structure can support a future tracking-script data source without requiring a rebuild — but do not build the tracking script, SDK, or live ingestion endpoint yet.

## Illustrative example
Sample data is modeled on a real estate marketplace (property search, listing views, contact-agent flow) — used as a realistic example, not a market restriction.

## Tech stack
Next.js (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), Recharts for visualizations.

## Working rules
- Build one screen at a time, only what is explicitly requested
- Do not add extra features, pages, or scope on your own initiative
- Ask before making significant design or architecture decisions
- Keep the UI minimal and professional — this is an analytics tool, not a consumer app
