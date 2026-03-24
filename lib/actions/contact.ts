'use server'

import { createServiceClient } from '@/lib/supabase/server'

type ContactChannel = 'contact' | 'premium'

async function submitViaWeb3Forms(formData: FormData, channel: ContactChannel) {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''
  const source = (formData.get('source') as string | null)?.trim()
    || (channel === 'premium' ? 'Premium Page Form' : 'Contact Page Form')

  if (!name || !email || !message) {
    return { error: 'All fields are required' }
  }

  // Keep lengths bounded for both DB storage and external form API payload.
  const boundedName = name.slice(0, 200)
  const boundedEmail = email.slice(0, 200)
  const boundedMessage = message.slice(0, 2000)
  const boundedSource = source.slice(0, 120)

  // 1) Store in DB (non-fatal if this fails; Web3Forms delivery is primary).
  const supabase = await createServiceClient()
  const { error: dbError } = await supabase.from('contacts').insert({
    name: boundedName,
    email: boundedEmail,
    message: `[${boundedSource}] ${boundedMessage}`,
  })

  if (dbError) {
    console.error('Failed to save contact submission in DB:', dbError.message)
  }

  // 2) Submit to Web3Forms.
  const accessKey = channel === 'premium'
    ? (process.env.WEB3FORMS_ACCESS_KEY_PREMIUM || process.env.WEB3FORMS_ACCESS_KEY)
    : (process.env.WEB3FORMS_ACCESS_KEY_CONTACT || process.env.WEB3FORMS_ACCESS_KEY)
  if (!accessKey) {
    return { error: 'Server is not configured for contact submissions yet.' }
  }

  let web3Result: { success?: boolean; message?: string } | null = null
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: accessKey,
        name: boundedName,
        email: boundedEmail,
        message: boundedMessage,
        subject: `New ${channel === 'premium' ? 'Premium' : 'Contact'} Form Submission (${boundedSource})`,
        from_name: 'RK Smart Money Website',
      }),
    })

    web3Result = (await response.json()) as { success?: boolean; message?: string }
  } catch {
    return { error: 'Failed to send message. Please try again.' }
  }

  if (!web3Result?.success) {
    return { error: web3Result?.message || 'Failed to send message. Please try again.' }
  }

  return { success: true }
}

export async function submitContactAction(formData: FormData) {
  return submitViaWeb3Forms(formData, 'contact')
}

export async function submitPremiumContactAction(formData: FormData) {
  return submitViaWeb3Forms(formData, 'premium')
}
