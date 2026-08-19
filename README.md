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
