# API Configuration

Flyover API configuration is read from environment variables through
`api/src/config/index.js`.

## Local development

Copy the template:

```bash
cd api
cp .env.example .env
```

Then edit `.env` locally as needed.

`.env` is intentionally ignored by Git. Never commit real API keys.

## Running

```bash
npm run dev
```

The npm script uses Node's `--env-file-if-exists=.env`, so the API works
with or without a local `.env`.

## Provider status

`GET /health` now returns only safe provider configuration status:

```json
{
  "ok": true,
  "service": "flyover-golf-api",
  "environment": "development",
  "providers": {
    "foreup": {
      "label": "foreUP",
      "configured": false
    },
    "clubcaddie": {
      "label": "Club Caddie",
      "configured": false
    }
  }
}
```

No API keys or provider base URLs are exposed.

## Future provider integration

When authorized credentials and provider documentation arrive:

1. Put credentials in local/deployment environment variables.
2. Keep secrets out of Git.
3. Implement the provider HTTP request inside that adapter's `search()` method.
4. Continue normalizing responses to Flyover's existing tee-time contract.
5. Set `isLive: true` only for actual provider inventory.
