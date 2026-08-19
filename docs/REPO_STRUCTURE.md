# Repository Structure

## UI
Owns presentation and user interaction only.

The UI should eventually request recommendations from the API rather than knowing anything about foreUP, Club Caddie, GolfNow, or other tee-sheet systems.

## API
Owns:
- course data
- provider integrations
- inventory normalization
- Flyover Scout scoring
- booking orchestration

## Shared
Owns vendor-neutral data contracts that must stay stable between UI and API.

## Docs
Architecture decisions, provider research, POC notes, and integration documentation.
