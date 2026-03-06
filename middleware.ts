export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/stack/:path*',
    '/team/:path*',
    '/queries/:path*',
    '/missions/:path*',
    '/graveyard/:path*',
    // /onboard is intentionally excluded — new users are redirected here by NextAuth
    // after magic link click, before a session cookie is fully propagated.
    // The onboard pages handle their own session checks via the app/(auth) layout.
  ],
}
