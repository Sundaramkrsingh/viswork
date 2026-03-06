import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/stack/:path*',
    '/team/:path*',
    '/queries/:path*',
    '/missions/:path*',
    '/graveyard/:path*',
    // /onboard intentionally excluded — see app/(app)/layout.tsx for post-auth guard
  ],
}
