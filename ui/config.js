// GitHub Pages is static hosting. Keep each golfer's data in their own browser.
// A hosted API can opt in by defining FLYOVER_API_BASE_URL before this file.
window.FLYOVER_STORAGE_MODE = window.FLYOVER_API_BASE_URL !== undefined || ["localhost", "127.0.0.1"].includes(location.hostname) ? "api" : "device";
