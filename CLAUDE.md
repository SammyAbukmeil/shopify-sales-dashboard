# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

A Shopify sales analytics dashboard. It syncs orders and products from a Shopify store via the Admin GraphQL API, receives new orders in near real time through webhooks, and presents sales KPIs in a web dashboard: revenue over time, top products, average order value, and orders by country.

Built against a Shopify development store with sample data. Designed so it could point at any real store by changing environment variables.

## Tech Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- SQLite for local data storage
- Shopify Admin GraphQL API + webhooks
- Deployed on Vercel

## Development Commands

```bash
npm run dev     # start dev server
npm run build   # production build
npm run lint    # lint
```

## Architecture Notes

- `app/` - Next.js App Router pages and API routes
  - `api/webhooks/` - Shopify webhook receivers (HMAC-verified)
  - `api/sync/` - manual sync endpoints for backfilling orders/products
- `lib/shopify/` - Admin API client and GraphQL queries
- `lib/db/` - database schema and queries
- `scripts/` - one-off automation scripts (e.g. CSV exports)

(Structure will evolve; keep this section updated as directories are added.)

## Working Conventions

- Small, focused commits: one coherent change per commit with a clear message
- Explain non-obvious design decisions in the README's "Decisions and trade-offs" section
- Never commit secrets. All credentials go in `.env.local`; document required variables in `.env.example`
- This is a public repository: keep code, comments, and commit messages presentable
- No em dashes in written copy (README, comments, commit messages); restructure the sentence instead
