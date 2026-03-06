import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMagicLink({ to, url }: { to: string; url: string }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Sign in to Viswork',
    text: `Click this link to sign in to Viswork: ${url}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background:#ffffff; padding: 32px 24px; border-radius: 12px;">
        <h2 style="color: #111827; margin: 0 0 8px;">Sign in to Viswork</h2>
        <p style="color: #4b5563; margin: 0 0 24px;">Click the button below to sign in. This link expires in 24 hours.</p>
        <a href="${url}" style="display:inline-block; background:#3b82f6; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin-bottom: 24px;">
          Sign in to Viswork
        </a>
        <p style="color:#6b7280; font-size:12px; word-break:break-all;">Or copy this link:<br>${url}</p>
      </div>
    `,
  })
}

export async function sendInvite({
  to,
  inviteUrl,
  invitedBy,
  workspaceName,
}: {
  to: string
  inviteUrl: string
  invitedBy: string
  workspaceName: string
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${invitedBy} invited you to ${workspaceName} on Viswork`,
    text: `${invitedBy} invited you to join ${workspaceName} on Viswork.\n\nAccept your invite: ${inviteUrl}\n\nThis invite expires in 7 days.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background:#ffffff; padding: 32px 24px; border-radius: 12px;">
        <h2 style="color: #111827; margin: 0 0 8px;">You've been invited</h2>
        <p style="color: #4b5563; margin: 0 0 24px;">
          <strong style="color:#111827;">${invitedBy}</strong> invited you to join
          <strong style="color:#111827;">${workspaceName}</strong> on Viswork.
        </p>
        <a href="${inviteUrl}" style="display:inline-block; background:#3b82f6; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin-bottom: 24px;">
          Accept invite
        </a>
        <p style="color:#6b7280; font-size:12px;">This invite expires in 7 days.</p>
      </div>
    `,
  })
}
