import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  // Authenticated but hasn't completed onboarding yet
  if (!session.user.memberId) redirect('/onboard/workspace')

  return <AppShell>{children}</AppShell>
}
