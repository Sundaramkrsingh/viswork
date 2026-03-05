import type { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLink } from '@/lib/email'

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
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
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      const member = await prisma.teamMember.findUnique({
        where: { userId: user.id },
        select: { id: true, workspaceId: true },
      })
      session.user.id = user.id
      if (member) {
        session.user.memberId = member.id
        session.user.workspaceId = member.workspaceId
      }
      return session
    },
  },
}
