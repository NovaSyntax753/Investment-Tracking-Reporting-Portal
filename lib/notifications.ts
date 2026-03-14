import { Resend } from 'resend'
import Twilio from 'twilio'
import { format } from 'date-fns'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

function getTwilioClient() {
  return Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

// ── Daily update: Email ────────────────────────────────────────────────────────
export async function sendDailyUpdateEmail(
  to: string,
  name: string,
  eodAmount: number,
  notes: string | null,
  date: string,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const formattedDate = format(new Date(date + 'T00:00:00'), 'dd MMMM yyyy')
  const safeNotes = notes ? notes.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') : null

  await resend.emails.send({
    from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
    to,
    subject: `Daily Portfolio Update — ${formattedDate}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
        <h2 style="color:#d4af37;margin-top:0">End-of-Day Update</h2>
        <p>Hi ${name},</p>
        <p>Here is your portfolio summary for <strong>${formattedDate}</strong>:</p>
        <div style="background:#0a0f1e;border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:20px;text-align:center;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#7a8aa0;text-transform:uppercase;letter-spacing:0.1em">Portfolio Value</p>
          <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#d4af37;font-family:monospace">${fmt(eodAmount)}</p>
        </div>
        ${safeNotes ? `<p><strong>Trade Notes:</strong></p><div style="background:#0d1526;padding:14px;border-radius:8px;border-left:3px solid #d4af37;font-size:14px">${safeNotes}</div>` : ''}
        <p style="margin-top:24px;font-size:12px;color:#7a8aa0">Log in to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#d4af37">investor dashboard</a> for full details.</p>
      </div>
    `,
  })
}

// ── Daily update: SMS ──────────────────────────────────────────────────────────
export async function sendDailySMS(to: string, name: string, eodAmount: number, date: string) {
  const client = getTwilioClient()
  const formattedDate = format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')
  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body: `RK Trading | ${formattedDate}\nHi ${name}, your portfolio EOD value: ${fmt(eodAmount)}\nView dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

// ── Daily update: WhatsApp ─────────────────────────────────────────────────────
export async function sendDailyWhatsApp(to: string, name: string, eodAmount: number, date: string) {
  const client = getTwilioClient()
  const formattedDate = format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body: `*RK Trading — Daily Update*\n📅 ${formattedDate}\nHi ${name}!\n\n💼 *Portfolio Value:* ${fmt(eodAmount)}\n\nView your full dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

// ── Monthly report: Email ──────────────────────────────────────────────────────
export async function sendReportReadyEmail(to: string, name: string, month: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
    to,
    subject: `Monthly Report Available — ${month}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
        <h2 style="color:#d4af37;margin-top:0">Monthly Report Ready</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${month}</strong> performance report has been uploaded and is ready to download from your investor portal.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports"
           style="display:inline-block;margin-top:16px;padding:12px 28px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
          View Reports →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#7a8aa0">You are receiving this because you have an active investor account with RK Trading.</p>
      </div>
    `,
  })
}
