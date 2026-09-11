# Flyover Golf — first course partner

Flyover helps Des Moines golfers choose a course based on their budget, travel
limits and past experiences. We are seeking one course for a small, permissioned
pilot. Booking stays with the course; Flyover must not imply a reservation is
confirmed just because a golfer visits the booking website.

## Initial request

A 20-minute discussion with the manager or golf professional about whether a
small discovery pilot would help fill appropriate tee times. Start with a capped
pilot audience of ten golfers and agree on the duration, available inventory and
success measures before launch. No minimum business outcome is promised.

## What we need before a live build

- Written permission for the course's inventory and branding to appear.
- Confirmed course and provider IDs (the current app mappings are provisional).
- Introduction to the tee-sheet provider's integration team.
- Official sandbox/production documentation and credentials delivered securely.
- Tee time date/time and timezone, available players, holes, currency, fee/cart/
  tax details, cancellation policy, booking URL and freshness rules.
- An agreed way to verify booking outcomes without exposing golfer payment data.
- Rate limits, retry/caching rules, outage handling and a way to pause the feed.

## Acceptance tests before showing a live badge

Compare provider output with the course tee sheet for sample slots. Verify local
calendar dates/timezones, player counts, cart rules and final totals. Confirm an
unavailable or stale slot is not shown as bookable. Label and handle outages
explicitly; never substitute demo inventory under a live badge. A provider
credential alone is insufficient: current adapter searches still return POC data.

## Provider starting points (checked September 2026)

- [foreUP contact](https://www.foreupgolf.com/contact-us/).
- [Club Caddie partners and integrations](https://clubcaddie.com/partners-integrations/)
  describes its open-API integration ecosystem. That is not authorization for
  Flyover; request the actual partner process and documented contract.

## Draft introduction — not sent

Hi [Name],

I'm building Flyover Golf to help local golfers choose a round that fits their
budget and schedule. We have a working prototype and are preparing a ten-golfer
Des Moines pilot. I'd like to explore whether [Course] would be a good first
partner, with booking staying on your existing system.

Would you be open to a short conversation about your tee-sheet provider, which
inventory you would want included, and how we could measure whether Flyover
brings you useful referrals? We would only connect data with your permission and
the provider's approved integration process.

Joe
