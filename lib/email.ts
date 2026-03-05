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
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #f1f5f9;">Sign in to Viswork</h2>
        <p style="color: #94a3b8;">Click the button below to sign in. This link expires in 24 hours.</p>
        <a href="${url}" style="display:inline-block; background:#3b82f6; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">
          Sign in
        </a>
        <p style="color:#64748b; font-size:12px;">Or copy this link: ${url}</p>
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
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #f1f5f9;">You've been invited</h2>
        <p style="color: #94a3b8;">
          <strong style="color:#f1f5f9;">${invitedBy}</strong> invited you to join
          <strong style="color:#f1f5f9;">${workspaceName}</strong> on Viswork.
        </p>
        <a href="${inviteUrl}" style="display:inline-block; background:#3b82f6; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">
          Accept invite
        </a>
        <p style="color:#64748b; font-size:12px;">This invite expires in 7 days.</p>
      </div>
    `,
  })
}
