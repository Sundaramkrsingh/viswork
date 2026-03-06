import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLink } from '@/lib/email'

const ACCESS_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000 // 1 week in ms

/**
 * Called when the access token window has expired (every 1 week).
 * Re-validates the user against the DB and issues a fresh access token window.
 * If the user no longer exists, sets error so the session callback can surface it.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.userId as string },
      select: { id: true },
    })

    if (!dbUser) {
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    // Re-fetch member data — may have changed since last sign-in
    const member = await prisma.teamMember.findUnique({
      where: { userId: token.userId as string },
      select: { id: true, workspaceId: true },
    })

    return {
      ...token,
      memberId: member?.id,
      workspaceId: member?.workspaceId,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: 'smtp://unused',
      from: process.env.EMAIL_FROM ?? 'Viswork <noreply@viswork.app>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLink({ to: email, url })
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    newUser: '/onboard/workspace',
  },
  debug: process.env.NODE_ENV === 'development',
  // Session cookie lives 90 days (the "refresh token" window).
  // The JWT carries its own accessTokenExpires (1 week). When it lapses,
  // refreshAccessToken() re-validates the user and issues a new window.
  session: { strategy: 'jwt', maxAge: 90 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      // ── Initial sign-in ──────────────────────────────────────────────────
      if (user) {
        return {
          ...token,
          userId: user.id,
          accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL,
        }
      }

      // ── Access token still valid — pass through ──────────────────────────
      if (Date.now() < (token.accessTokenExpires ?? 0)) {
        // Opportunistically pick up memberId when it's been set post-onboarding
        if (token.userId && !token.memberId) {
          const member = await prisma.teamMember.findUnique({
            where: { userId: token.userId as string },
            select: { id: true, workspaceId: true },
          })
          if (member) {
            token.memberId = member.id
            token.workspaceId = member.workspaceId
          }
        }
        return token
      }

      // ── Access token expired → refresh (DB re-validation point) ─────────
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      // Refresh failed (user deleted or DB error) — return a shell session so
      // the server layout and client watchdog both detect the invalid state.
      if (token.error === 'RefreshAccessTokenError' || !token.userId) {
        return {
          ...session,
          user: { ...session.user, id: '', memberId: undefined, workspaceId: undefined },
          error: 'RefreshAccessTokenError' as const,
        }
      }

      session.user.id = token.userId as string
      if (token.memberId) {
        session.user.memberId = token.memberId as string
        session.user.workspaceId = token.workspaceId as string
      }
      return session
    },
  },
}
