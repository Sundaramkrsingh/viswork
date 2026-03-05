export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/stack/:path*',
    '/team/:path*',
    '/queries/:path*',
    '/missions/:path*',
    '/graveyard/:path*',
    '/onboard/:path*',
  ],
}
