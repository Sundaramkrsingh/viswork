import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      memberId?: string       // TeamMember.id — undefined until /onboard/member completed
      workspaceId?: string    // Workspace.id
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    memberId?: string
    workspaceId?: string
  }
}
