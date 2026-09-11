# Operating the private beta

Support: jbejarno@gmail.com. For an app failure, ask for the visible error reference, approximate time and action. Never request passwords. Hosting logs emit request references, method, route category and error type without email or score contents. A per-user request counter is retained separately; it resets its count in the next minute used. The limit is 120 authenticated API requests per minute, excluding session/course/health checks. Bodies are capped at 200 KB. This is an app safeguard, not a replacement for edge abuse protection.

## Health and incident response

GET /health checks database access and returns 200 with ok:true, or 503 with an error reference. The private site's access gate may require authentication, so an anonymous uptime request alone cannot establish app health. Use Sites deployment status and runtime logs for hosted incidents. External alerts are not configured yet.

On errors: establish scope, inspect references without copying user contents, check the current deployment and database status, reproduce with isolated test identities, then fix forward or redeploy a known good version. Do not weaken sign-in to diagnose production.

## Export and recovery

Rounds > Export my data downloads account rounds/reviews/profile and browser favorites/plans. Import accepts 1–100 rounds under 200 KB, validates the entire batch before writing, and does not overwrite existing corrected rounds. Split larger exports into valid batches. Import restores rounds/reviews; exported profile and browser state are for manual recovery. Keep export files private. Export/import recovery is exercised in tests; hosted database backup restoration is not yet verified.

Before broader pilot access, confirm provider backup retention and recovery controls, restore a staging copy and record the result. Do not claim a recovery-time guarantee before that exercise.

## Rollback

Previous known deployed version: appgprj_6aa375421e5481918748f2ef88556eeb~appgver_9bb222d70e8c8191a8a492ccf1fc2de8.

This update adds request_limits without removing or changing golfer tables. Redeploy a saved known-good version through Sites to roll back code; do not reverse database migrations or restore stale score data as a routine code rollback. The previous version contains demo discovery, so keep access owner-only if it is restored. Verify deployment status, health and an isolated score flow. No production rollback was performed during this update.

## Repeatable verification

Run npm test, then npm run build. Start TEST_PORT=8086 node tests/preview-server.js and run tests/launch-browser.cjs with PLAYWRIGHT_MODULE and CHROME_PATH pointing to your installed Playwright/Chrome (or use their defaults). The harness accepts disposable alice/bob cookies only on localhost; its identity mechanism is never bundled into the hosted Worker. Browser checks intercept external course links and never create reservations. Stop the harness after testing.
