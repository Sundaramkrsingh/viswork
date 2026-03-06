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
    /** Set when the access token refresh fails (e.g. user deleted).
     *  Client should call signOut() when this is present. */
    error?: 'RefreshAccessTokenError'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    memberId?: string
    workspaceId?: string
    /** Unix ms — expiry of the current access token window (1 week from last refresh) */
    accessTokenExpires?: number
    /** Set when refreshAccessToken() fails — propagated to Session.error */
    error?: 'RefreshAccessTokenError'
  }
}
