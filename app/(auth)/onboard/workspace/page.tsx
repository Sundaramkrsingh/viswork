import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { WorkspaceForm } from './WorkspaceForm'

/**
 * Server component — runs before anything renders.
 *
 * If a workspace already exists this user was invited (not the founder),
 * so skip workspace creation entirely and go straight to profile setup.
 *
 * The founder (first user ever) sees the workspace creation form.
 */
export default async function OnboardWorkspacePage() {
  const count = await prisma.workspace.count()

  if (count > 0) {
    redirect('/onboard/member')
  }

  return <WorkspaceForm />
}
