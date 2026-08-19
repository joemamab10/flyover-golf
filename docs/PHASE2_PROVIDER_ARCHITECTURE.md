# Flyover Golf — Phase 2 Provider Architecture

## Objective
Flyover Scout should never depend directly on one tee-sheet vendor's response format.

## Normalized tee-time contract
Every provider adapter outputs:

- `provider`
- `providerLabel`
- `courseId`
- `courseName`
- `time`
- `hour`
- `price`
- `holes`
- `availablePlayers`
- `cartIncluded`
- `bookingUrl`
- `isLive`

## POC adapters included
### foreUP
Tournament Club of Iowa is routed through `ForeUpProvider`.

### Club Caddie
The Legacy Golf Club is routed through `ClubCaddieProvider`.

### Course Direct
All other initial Des Moines-area courses use the fallback adapter until their booking provider is confirmed/integrated.

## Why this matters
When authorized API credentials arrive, the Flyover UI and Scout algorithm do not need to change. We replace only a provider adapter's `search()` implementation and normalize its response.

## First live-provider success criteria
1. Retrieve real tee-time availability from one authorized provider.
2. Normalize it into Flyover's tee-time contract.
3. Rank those live slots inside Scout.
4. Carry provider + booking URL through course detail and booking.
5. Clearly distinguish `LIVE` inventory from `POC FEED` / direct-booking fallback.
