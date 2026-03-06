// Single source of truth for the app base URL.
// All code should import APP_URL from here — never read NEXTAUTH_URL directly.
// To change port: update PORT in .env.local, then update NEXTAUTH_URL to match.
export const APP_URL = process.env.NEXTAUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
