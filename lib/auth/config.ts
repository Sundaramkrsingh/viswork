import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLink } from '@/lib/email'

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
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      // Capture userId on first sign-in
      if (user) {
        token.userId = user.id
      }
      // Fetch memberId whenever it's missing — covers post-onboarding requests
      // Once memberId is set it stays in the token, no further DB queries
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
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      if (token.memberId) {
        session.user.memberId = token.memberId as string
        session.user.workspaceId = token.workspaceId as string
      }
      return session
    },
  },
}
