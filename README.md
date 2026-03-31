# Adscore

AI-powered tool to generate and optimize Meta and Google Ads campaigns.

## Description

Adscore helps teams move faster on paid acquisition by combining campaign context, ad account data, and AI-generated recommendations in one workflow.  
It provides chat-driven analysis, optimization guidance, and reporting utilities for ad performance decisions.

## Features

- AI-assisted campaign strategy and copy guidance
- Google Ads and Meta Ads account connection via OAuth
- AI-based ad performance analysis and summarization
- Action proposal workflow for campaign pause / approval / revert
- Multi-chat workspace for iterative optimization discussions

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + tRPC + TypeScript
- **Data/Auth:** Supabase
- **UI:** Tailwind CSS + Radix UI

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env` and fill the required values:

```bash
cp .env.example .env
```

Required minimum for local run:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADSCORE_OAUTH_STATE_SECRET`

### Optional but recommended environment variables

- `ADSCORE_PUBLIC_URL` (defaults to `http://localhost:3000`)
- `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`, `META_OAUTH_REDIRECT_URI`
- Analytics keys (`VITE_ANALYTICS_*`)

### Ads integration credentials (required only for platform integrations)

Google Ads:
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`

Meta Ads:
- `META_APP_ID`
- `META_APP_SECRET`

### 3) Run locally

```bash
pnpm dev
```

The app starts on `http://localhost:3000` by default (auto-falls back to next available port).

## Example Usage

1. Sign up / sign in.
2. Connect ad accounts (Google and/or Meta).
3. Open the panel and ask for analysis in natural language.
4. Review optimization suggestions and apply approved actions.

Example prompt:

```text
Analyze last 30 days performance and suggest 3 budget optimizations for Meta and Google.
```

## Integration Behavior (Actual Implementation)

### Google Ads
- OAuth flow is implemented and stores connected customer IDs.
- Read operations: list campaigns, fetch campaign metrics, run analysis routines.
- Write operations: campaign status can be changed to `PAUSED` or reverted to previous status after explicit in-app approval.
- Required OAuth/API access: Google OAuth scope `https://www.googleapis.com/auth/adwords`, plus valid Google Ads developer credentials.

### Meta Ads
- OAuth flow is implemented and stores connected ad accounts.
- Read operations: list campaigns/ad sets, fetch insights metrics, run analysis routines.
- Write operations: campaign status can be changed to `PAUSED` or reverted to `ACTIVE` (or previous paused state) after explicit in-app approval.
- Required OAuth/API access: Meta scopes `ads_read` and `ads_management`.

### Approval Safety Model
- Proposed actions are stored as pending first.
- No campaign status update is sent until user approval.
- Applied actions can be reverted through the same action log.

## Current Limitations / OSS Notes

- Integrations require your own platform credentials and approved app access.
- Some production hardening (rate limits, retries, deeper audit trails, advanced role controls) is simplified in this open-source demo.
- If integration credentials are missing, core app auth/chat can still run, but ads platform features are unavailable.

## Why this project exists

Adscore exists to make ad performance decisions more accessible and faster for small teams.  
Instead of manually stitching dashboards and metrics, users can get actionable guidance in a single AI-assisted workspace.

## Project Structure

```text
client/   # React frontend
server/   # Node/Express + tRPC backend
shared/   # shared types and utilities
```

## Open Source Notes

- Secrets are intentionally excluded; use `.env.example` as template.
- Production-only operational docs were removed in favor of clean OSS onboarding.
- Legacy environment variable names may still be accepted in code for backward compatibility.

## Disclaimer

This is an open-source demo version. Some production integrations may be simplified.

## License

MIT

