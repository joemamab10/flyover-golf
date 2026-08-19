export async function createBookingIntent(teeTime) {
  // Phase 2 behavior:
  // return enough metadata for the UI to deep-link to the provider.
  // Native booking will be implemented provider-by-provider later.
  return {
    mode: "redirect",
    provider: teeTime.provider,
    bookingUrl: teeTime.bookingUrl
  };
}
