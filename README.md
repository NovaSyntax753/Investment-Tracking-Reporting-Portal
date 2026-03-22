# Investment Tracking and Reporting Portal

Admin-managed investor portal built with Next.js + Supabase.

## Implemented Business Flow

1. Admin creates investor accounts in backend with:
	- Investor ID (`investor_code`)
	- Password
	- Investment profile fields
2. Admin posts daily updates.
3. Investors receive notifications for daily updates (email + SMS + WhatsApp when configured).
4. At the start of a new month, the system auto-generates each investor's previous-month report from daily updates.
5. Investors receive the monthly report directly by email and can view monthly summaries in their dashboard.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`

Optional notification providers:

- `RESEND_API_KEY`
- `RESEND_DOMAIN`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WHATSAPP_CONTENT_SID` (optional, for approved WhatsApp template messages)

Optional Premium onboarding links:

- `NEXT_PUBLIC_PREMIUM_WHATSAPP_URL`
- `NEXT_PUBLIC_PREMIUM_TELEGRAM_URL`

Optional login page registration contact:

- `NEXT_PUBLIC_REGISTRATION_PHONE`

Monthly cron security:

- `CRON_SECRET` (recommended)

## Database Migration

Apply all SQL files in `supabase/migrations` in order.

Current sequence:

- `001_initial_schema.sql`
- `002_admin_credentials_and_auto_monthly_reports.sql`

## Monthly Auto-Generation Endpoint

The system exposes:

- `POST /api/cron/monthly-reports`

If `CRON_SECRET` is set, pass either:

- `Authorization: Bearer <CRON_SECRET>`
- or `x-cron-secret: <CRON_SECRET>`

Schedule this endpoint to run on day 1 of every month (for example at `00:05`).
