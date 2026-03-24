'use server'

import { createServiceClient } from '@/lib/supabase/server'

type ContactChannel = 'contact' | 'premium'

async function saveContactToDB(formData: FormData, channel: ContactChannel) {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''
  const source = (formData.get('source') as string | null)?.trim()
    || (channel === 'premium' ? 'Premium Page Form' : 'Contact Page Form')

  if (!name || !email || !message) {
    return { error: 'All fields are required' }
  }

  // Keep lengths bounded for DB storage.
  const boundedName = name.slice(0, 200)
  const boundedEmail = email.slice(0, 200)
  const boundedMessage = message.slice(0, 2000)
  const boundedSource = source.slice(0, 120)

  let dbSaved = false
  try {
    const supabase = await createServiceClient()
    const { error: dbError } = await supabase.from('contacts').insert({
      name: boundedName,
      email: boundedEmail,
      message: `[${boundedSource}] ${boundedMessage}`,
    })

    dbSaved = !dbError
    if (dbError) {
      console.error('Failed to save contact submission in DB:', dbError.message)
      return { error: 'Failed to save message. Please try again.' }
    }
  } catch (error) {
    console.error('Failed to initialize DB client for contact submission:', error)
    return { error: 'Failed to save message. Please try again.' }
  }

  return { success: true }
}

export async function submitContactAction(formData: FormData) {
  return saveContactToDB(formData, 'contact')
}

export async function submitPremiumContactAction(formData: FormData) {
  return saveContactToDB(formData, 'premium')
}
