import { Resend } from "resend";
import Twilio from "twilio";
import { format } from "date-fns";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getResendClient() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

function getTwilioClient() {
  return Twilio(
    requireEnv("TWILIO_ACCOUNT_SID"),
    requireEnv("TWILIO_AUTH_TOKEN"),
  );
}

function ensureWhatsAppPrefix(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

// ── Daily update: Email ────────────────────────────────────────────────────────
export async function sendDailyUpdateEmail(
  to: string,
  name: string,
  eodAmount: number,
  notes: string | null,
  date: string,
) {
  const resend = getResendClient();
  const formattedDate = format(new Date(date + "T00:00:00"), "dd MMMM yyyy");
  const safeNotes = notes
    ? notes.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")
    : null;

  await resend.emails.send({
    from: `RK Trading <noreply@${process.env.RESEND_DOMAIN || "rktrading.in"}>`,
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
        ${safeNotes ? `<p><strong>Trade Notes:</strong></p><div style="background:#0d1526;padding:14px;border-radius:8px;border-left:3px solid #d4af37;font-size:14px">${safeNotes}</div>` : ""}
        <p style="margin-top:24px;font-size:12px;color:#7a8aa0">Log in to your <a href="${getAppUrl()}/dashboard" style="color:#d4af37">investor dashboard</a> for full details.</p>
      </div>
    `,
  });
}

// ── Daily update: SMS ──────────────────────────────────────────────────────────
export async function sendDailySMS(
  to: string,
  name: string,
  eodAmount: number,
  date: string,
) {
  const client = getTwilioClient();
  const from = requireEnv("TWILIO_PHONE_NUMBER");
  const formattedDate = format(new Date(date + "T00:00:00"), "dd MMM yyyy");
  await client.messages.create({
    from,
    to,
    body: `RK Trading | ${formattedDate}\nHi ${name}, your portfolio EOD value: ${fmt(eodAmount)}\nView dashboard: ${getAppUrl()}/dashboard`,
  });
}

// ── Daily update: WhatsApp ─────────────────────────────────────────────────────
export async function sendDailyWhatsApp(
  to: string,
  name: string,
  eodAmount: number,
  date: string,
) {
  const client = getTwilioClient();
  const formattedDate = format(new Date(date + "T00:00:00"), "dd MMM yyyy");
  const from = ensureWhatsAppPrefix(requireEnv("TWILIO_WHATSAPP_FROM"));
  const toWhatsApp = ensureWhatsAppPrefix(to);
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;

  if (contentSid) {
    await client.messages.create({
      from,
      to: toWhatsApp,
      contentSid,
      contentVariables: JSON.stringify({
        1: formattedDate,
        2: fmt(eodAmount),
        3: `${getAppUrl()}/dashboard`,
      }),
    });
    return;
  }

  await client.messages.create({
    from,
    to: toWhatsApp,
    body: `*RK Trading — Daily Update*\n📅 ${formattedDate}\nHi ${name}!\n\n💼 *Portfolio Value:* ${fmt(eodAmount)}\n\nView your full dashboard: ${getAppUrl()}/dashboard`,
  });
}

// ── Monthly report: Email ──────────────────────────────────────────────────────
export async function sendReportReadyEmail(
  to: string,
  name: string,
  month: string,
) {
  const resend = getResendClient();
  await resend.emails.send({
    from: `RK Trading <noreply@${process.env.RESEND_DOMAIN || "rktrading.in"}>`,
    to,
    subject: `Monthly Report Available — ${month}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
        <h2 style="color:#d4af37;margin-top:0">Monthly Report Ready</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${month}</strong> performance report has been uploaded and is ready to download from your investor portal.</p>
        <a href="${getAppUrl()}/dashboard/reports"
           style="display:inline-block;margin-top:16px;padding:12px 28px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
          View Reports →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#7a8aa0">You are receiving this because you have an active investor account with RK Trading.</p>
      </div>
    `,
  });
}

type MonthlySummaryEmailPayload = {
  openingAmount: number;
  closingAmount: number;
  highestAmount: number;
  lowestAmount: number;
  averageAmount: number;
  pnlAmount: number;
  pnlPercentage: number;
  tradingDays: number;
};

export async function sendMonthlySummaryEmail(
  to: string,
  name: string,
  month: string,
  summary: MonthlySummaryEmailPayload,
) {
  const resend = getResendClient();
  const up = summary.pnlAmount >= 0;
  const pnlColor = up ? "#34d399" : "#f87171";

  await resend.emails.send({
    from: `RK Trading <noreply@${process.env.RESEND_DOMAIN || "rktrading.in"}>`,
    to,
    subject: `Monthly Performance Report - ${month}`,
    html: `
      <div style="font-family:sans-serif;max-width:620px;margin:auto;background:#111b2e;color:#e8eaf0;padding:28px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
        <h2 style="color:#d4af37;margin-top:0">Monthly Report</h2>
        <p>Hi ${name},</p>
        <p>Your report for <strong>${month}</strong> is generated from your daily updates.</p>

        <table style="width:100%;border-collapse:collapse;margin:18px 0;background:#0d1526;border-radius:10px;overflow:hidden">
          <tbody>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Opening</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${fmt(summary.openingAmount)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Closing</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${fmt(summary.closingAmount)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Highest</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${fmt(summary.highestAmount)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Lowest</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${fmt(summary.lowestAmount)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Average</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${fmt(summary.averageAmount)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15)">Trading Days</td><td style="padding:10px 14px;border-bottom:1px solid rgba(212,175,55,0.15);text-align:right">${summary.tradingDays}</td></tr>
            <tr><td style="padding:10px 14px">Month P/L</td><td style="padding:10px 14px;text-align:right;color:${pnlColor};font-weight:700">${up ? "+" : ""}${fmt(summary.pnlAmount)} (${summary.pnlPercentage.toFixed(2)}%)</td></tr>
          </tbody>
        </table>

        <a href="${getAppUrl()}/dashboard/reports"
           style="display:inline-block;margin-top:10px;padding:12px 24px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
          View in Investor Dashboard
        </a>
      </div>
    `,
  });
}
