'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function submitContactAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  if (!name || !email || !message) {
    return { error: 'All fields are required' }
  }

  // Sanitise inputs — prevent injection in email HTML
  const safeName = name.slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeEmail = email.slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeMessage = message.slice(0, 2000).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')

  // 1. Store in DB
  const supabase = await createServiceClient()
  const { error: dbError } = await supabase.from('contacts').insert({ name, email, message })
  if (dbError) return { error: 'Failed to save message. Please try again.' }

  // 2. Send email to admin
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `RK Trading Contact Form <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
        to: adminEmail,
        subject: `New Contact Form Submission — ${safeName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
            <h2 style="color:#d4af37;margin-top:0">New Contact Message</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:#d4af37">${safeEmail}</a></p>
            <p><strong>Message:</strong></p>
            <div style="background:#0d1526;padding:16px;border-radius:8px;border-left:3px solid #d4af37">${safeMessage}</div>
          </div>
        `,
      })
    } catch {
      // Non-fatal — message is already in DB
    }
  }

  return { success: true }
}
