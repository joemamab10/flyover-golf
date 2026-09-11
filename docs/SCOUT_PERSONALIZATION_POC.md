# Score tracking and Scout personalization POC

The API stores one golfer's profile and round history in `api/.local/golfer.json`.
This is a local, single-user, single-process prototype, with no authentication or
multi-user isolation. Keep it local; a shared deployment needs authenticated
user-scoped storage. `GOLFER_DATA_DIR` can override the storage directory.
Writes are serialized and replaced atomically. The data directory is gitignored.

## API

- `GET /api/golfer-profile` → `{ profile }`
- `PUT /api/golfer-profile` merges supplied fields: `displayName`, `handicap`
  (number -10–54 or null), `preferredHoles` (9, 18, or `"either"`),
  `preferredRide` (`"walk"`, `"cart"`, or `"either"`), `favoriteCourseIds`
  (array of known course IDs; empty array clears favorites).
- `GET /api/rounds` → `{ rounds }`
- `POST /api/rounds` accepts `courseId`, `date` (YYYY-MM-DD), `holes` (9 or 18),
  and optional `tees`. Creates a planned round and returns `{ round }` with 201.
- `PUT /api/rounds/:roundId/score` accepts total `strokes` and optional `par`.
  Marks the round completed. Repeating this call corrects its score, without
  adding another round. Future dates (relative to UTC today) cannot be scored.
- `GET /api/stats` → `{ stats }`: completed-round count and separate 9/18-hole
  averages, best scores, and average relative to supplied par. Empty values are
  null. These are raw score statistics, not an official handicap calculation.

Invalid input returns 400; a missing round returns 404. Provider behavior and
configuration remain as before.

## Scout behavior

Scout reads saved data automatically. Each recommendation includes
`baseFlyoverScore`, `personalizedFlyoverScore`, and `golferFit` with reasons and
the actual score adjustment. The existing `flyoverScore` is the personalized
score used for ranking, capped at 100.

Bonuses: favorite course +5, previously completed course +2, saved matching
hole count +3, saved supported walking/cart preference +3. Explicit `holes` or
`ride` search fields disable the corresponding saved-preference bonus.
Repeated rounds do not stack familiarity bonuses. Reasons show the nominal
bonus; the actual adjustment can be smaller at the 100-point cap.

Handicap and scores are stored for history and stats. They do not imply course
difficulty or playing-ability fit: the current course data has no verified tee
ratings or slopes. No golfer data means unchanged base rankings.

## Try it

Start the API using `cd api && npm start`, then:

```sh
curl -X PUT http://localhost:3000/api/golfer-profile \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Joe","favoriteCourseIds":["waveland"]}'
curl -X POST http://localhost:3000/api/rounds \
  -H 'Content-Type: application/json' \
  -d '{"courseId":"waveland","date":"2026-08-01","holes":18,"tees":"Blue"}'
```

Use the returned round ID in place of ROUND_ID:

```sh
curl -X PUT http://localhost:3000/api/rounds/ROUND_ID/score \
  -H 'Content-Type: application/json' -d '{"strokes":84,"par":72}'
curl http://localhost:3000/api/stats
curl -X POST http://localhost:3000/api/scout/recommendations \
  -H 'Content-Type: application/json' -d '{}'
```

Run `npm test` in `api/`. Tests use temporary storage and exercise the HTTP
flow, score corrections, invalid requests, persistence, concurrent writes,
separate score formats, personalization, and existing provider contracts.

## Rounds screen and deployment

The Rounds tab supports logging a completed round, editing strokes/par, viewing
history, and separate 9/18-hole averages and best scores. Booking handoffs remain
separate and are never automatically treated as played or confirmed.

`POST /api/rounds` also accepts an optional `score: { strokes, par }` and a UUID
`requestId`. The score is validated before writing the round; retrying a request
ID returns the existing round so an interrupted save does not create duplicates.

On localhost, the UI uses the API at localhost:3000. GitHub Pages uses explicit
device storage configured in `ui/config.js`: scores persist in this browser's
localStorage, do not sync across devices, and are lost if site data is cleared.
There is no automatic fallback from failed API writes to device storage.
Device-mode Scout adds the same +2 familiarity bonus for a previously played
course, without stacking multiple rounds. The deployed prototype still uses
simulated tee times, prices and weather. API-backed Scout also supports the
profile bonuses described above; the UI does not yet provide profile editing.

The root page redirects to `ui/`, making that folder the single current app.
Publishing the main branch updates the existing GitHub Pages site. Pages cannot
run the Node API. Before enabling a public backend, add authenticated user-scoped
storage. For an appropriately secured backend, set `window.FLYOVER_API_BASE_URL`
before `config.js` and configure its CORS origins.

## Personal course feedback and shortlist

Completed rounds now accept `PUT /api/rounds/:id/feedback` with `playAgain`
(`yes`, `maybe`, `no`) and optional integer `value`, `conditions`, `pace` ratings
from 1–5. Cloud edits require the current round `version`, like score corrections.
Feedback remains account-scoped and is preserved during imports and score edits.

The most recent played-date review of a course replaces the +2 familiarity bonus.
Return intent contributes +6 / 0 / -12; each rating of 4–5 adds 1, and each rating
of 1–2 subtracts 2. Final fit scores stay within 0–100. The UI identifies the review
date rather than suggesting the feedback describes current course conditions.

Scout now excludes options outside price, drive, player count, hole format,
walking/cart and time-of-day limits before ranking. It shows three distinct
courses, an explicit empty state, an option to broaden the search, and a comparison
of example price, estimated drive and fit. Alternative labels reflect rank rather
than invented best-weather or best-value awards. The pilot materials in
`docs/pilot/` describe how to test these hypotheses with ten golfers.
