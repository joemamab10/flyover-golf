# Flyover launch checklist

Updated September 11, 2026. The synced app remains an owner-only private beta. Checked items describe implemented behavior, not permission to open a public booking service.

- [x] Replace sample tee times, prices, weather and travel scores with course discovery and official links.
- [x] Carry a golfer-selected planning date through course details, copied plans and saved availability checks. Clearly state these are not reservations.
- [x] Verify eight course names, cities and official websites; hide unverified listings from discovery. See COURSE_DIRECTORY.md.
- [x] Keep scores and reviews private to the signed-in account, with stale-edit protection and separate 9/18-hole averages.
- [x] Export rounds, reviews, profile and browser favorites/plans. Delete individual rounds or account golf data with explicit confirmation.
- [x] Add help, practical privacy information and support at jbejarno@gmail.com.
- [x] Add bounded request bodies, per-account request limits, safe error references and database health checks.
- [x] Exercise isolated account boundaries, export/import recovery, deletion safeguards and phone/laptop browser layouts.
- [ ] Test real ChatGPT sign-in/sign-out on a physical iPhone, Android and laptop, including returning after a session expires. Local test identities do not verify production login.
- [ ] Confirm managed database backup retention and perform a staging restore; configure external uptime/error notifications. App export recovery is not a managed database backup.
- [ ] Choose a pilot course and get a named authorized contact. Use the prepared pilot materials in ../pilot/.
- [ ] Obtain authorized inventory access and verify fees, cart inclusion, taxes, cancellation rules and reservation handoff before offering live tee times.
- [ ] Select and admit pilot golfers, gather real usage feedback and resolve launch issues before widening access.

The remaining course relationships, service access and physical-device acceptance need outside participation. Production alerts and managed backup recovery remain operational setup, not completed automation.
