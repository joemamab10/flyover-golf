# Flyover Golf

Flyover Golf is a tee-time discovery and recommendation product focused on helping golfers find the best round for their preferences — not just browse a list of available tee times.

## Monorepo Structure

```text
flyover-golf/
├── ui/                 # Flyover web prototype / frontend
├── api/                # Backend API and provider integrations
├── shared/             # Shared contracts/types
└── docs/               # Architecture and product notes
```

## Current Phase

**Phase 2 — Inventory Integration / POC**

The current goal is to connect one authorized tee-time provider, normalize its inventory, and surface live availability through Flyover Scout.

## Run the UI

For now, `ui/index.html` is a standalone prototype and can be hosted with GitHub Pages.

## Run the API

```bash
cd api
npm install
npm run dev
```

The starter API exposes:

- `GET /health`
- `GET /api/courses`
- `GET /api/tee-times`
- `POST /api/scout/recommendations`

Provider adapters currently return simulated POC inventory until authorized API access is available.

## Sign-in and synced rounds

The hosted Sites build uses ChatGPT sign-in and D1 storage. Every profile and
round query is scoped to the dispatcher-provided user ID. The Node API remains a
local single-golfer prototype; do not deploy it publicly as an account backend.

- `npm install` at the repo root installs the build/migration tooling.
- `npm run build` creates the hosted Worker and current UI in `dist/`.
- `npm test` runs the account-isolation/sync suite and existing API tests.
- `npm run db:generate` generates migrations after changes to `db/schema.js`.
- `node tests/preview-server.js` serves an isolated browser-test environment on
  localhost:8082 after building. Its test-cookie identities exist only in this
  harness and are not included in the hosted Worker.

The Pages app keeps existing device scores and links to the synced app. In
Rounds, choose **Export device scores**, then sign into the synced app with the
same ChatGPT account on each device and choose **Import device scores**. Import
preserves the device copy, ignores duplicate IDs, and never overwrites a synced
score correction. Imports accept up to 100 rounds per file. Booking handoffs and
saved-course hearts remain device-local; completed scores and API profiles sync.

Production identity comes only from the Sites dispatcher, with no test identity
fallback. JSON responses containing golfer data use `Cache-Control: no-store`.
Mutation routes check same-origin requests. Score updates include a version:
a stale edit returns 409 so another device's correction is not silently lost.
The new Sites deployment starts private to the owner; the Pages prototype remains
public. The hosted inventory remains simulated until authorized providers are
connected. GitHub holds the project source; Sites holds the database and hosted
build. Do not commit credentials or generated runtime data.
