# Flyover Scout: Des Moines pilot

## Decision to test

Can Scout help ten local golfers choose a suitable course with less effort than
their usual approach? This pilot tests selection usefulness, not live booking.
Availability, prices, travel times, weather and course ratings in this build are
demo inputs. Do not claim that a shown slot can be booked or that weather was
checked. The app remains private to Joe until pilot viewers are explicitly added.

## Two stages

1. **Usability pilot now:** ten volunteers, one session each, followed by a review
   after any independently booked real round. Let golfers browse normally before
   the comparison. Counterbalance the order: five use Scout first, five use their
   usual method first, on two comparable scenarios. Explain that demo availability
   means timing and preference fit are the outcomes, not booking conversion.
2. **Live booking pilot later:** one consenting course and authorized inventory.
   Repeat with real prices, dates and available player counts. Measure completed
   bookings only with course confirmation or participant confirmation; a website
   handoff does not count as a booking.

## Session script (15 minutes)

- Ask where they normally play and how they choose a round. Do not pitch Scout.
- Give them a realistic budget, maximum drive and preferred format/time.
- Ask them to find a course they would consider playing. Time from beginning the
  search until they make a choice. Record when they abandon the task.
- Ask: "Why did you choose that one? What would stop you from booking it?"
- Ask them to explain the fit score and say whether prices/times are verified.
- Have them log a previously completed round and review value, conditions, pace,
  and whether they would return. Show the changed shortlist. Ask if the change
  matches what they expected.
- Ask "Would you use this the next time you plan a round? Why or why not?"

## Working success gates (hypotheses, not claims)

- At least 8/10 complete choosing a course without help.
- At least 7/10 would consider one of their three choices.
- Median selection time at least 25% lower than their comparison task.
- All ten understand that demo availability is not confirmed inventory.
- At least 7/10 understand how their private course review affects Scout.

Ten people can expose usability problems, not establish statistical superiority.
Review failures individually before expanding beyond Des Moines. Do not count
these gates as passed until results are collected. No participants have yet been
recruited and no sessions have been run.

## What to record

Use `SESSION_NOTES.md` per participant with an anonymous P01–P10 identifier. Record
explicit answers and observed behavior separately from your interpretation.
Do not collect handicap, email, exact location or other identifying details in
research notes unless needed and agreed to. Account-owned scores remain private;
this build does not add hidden session recording or analytics.

## Partner connection gate

Use `COURSE_PARTNER_BRIEF.md`. Before implementing a live adapter, obtain the
course's permission and the provider's documented auth, endpoint, response
contract and refresh limits. Set secrets through hosting configuration. Never
ship provider credentials in browser code. No authorized access exists today.

## Known pilot limitations

- Three-course ranking operates on limited demo inventory; all current sample
  slots are morning, 18 holes. Nine holes or afternoon can correctly return none.
- Price limits apply to example per-player green fees, not a guaranteed all-in
  cart/tax/booking total. Final cost is confirmed by the course.
- Feedback uses the latest review per course; it is personal history, not a live
  report on today's course conditions. Explicit search limits still take priority.
- Return intent changes fit by +6 / 0 / -12 for yes / maybe / no. High ratings add
  one point; low ratings subtract two. Repeated reviews do not stack.
- No verified difficulty/tee ratings, GPS routing or live weather connection.
