'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitContactAction } from '@/lib/actions/contact'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

const CONTACT_EMAIL = 'rksmartmoney@gmail.com'
const CONTACT_PHONE = '+91 95886 77762'
const INSTAGRAM_URL = 'https://www.instagram.com/rksmartmoney_?igsh=bnkxYnJteXN6NHo0'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('email', data.email)
    fd.append('message', data.message)
    const result = await submitContactAction(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setSent(true)
      reset()
      toast.success('Message sent! We will get back to you soon.')
    }
  }

  return (
    <div className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp className="mb-16 text-center">
          <p className="mb-3 text-2xl font-semibold uppercase tracking-widest text-gold">Contact</p>
          <h1 className="text-5xl font-extrabold sm:text-5xl">Get In Touch</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question or ready to invest? We&apos;d love to hear from you.
          </p>
        </FadeUp>

        <div className="grid gap-12 md:grid-cols-5">
          {/* Info */}
          <Stagger className="space-y-8 md:col-span-2">
            <StaggerItem>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <Mail className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-semibold">Email</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-lg text-muted-foreground hover:text-gold transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <Phone className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-semibold">WhatsApp / Phone</p>
                <a href="tel:+919588677762" className="text-lg text-muted-foreground hover:text-gold transition-colors">
                  {CONTACT_PHONE}
                </a>
              </div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <Instagram className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-semibold">Instagram</p>
                <Link
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-muted-foreground hover:text-gold transition-colors"
                >
                  @rksmartmoney_
                </Link>
              </div>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <MapPin className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-lg font-semibold">Location</p>
                <p className="text-lg text-muted-foreground">Nagpur, Maharashtra, India</p>
              </div>
            </div>
            </StaggerItem>
          </Stagger>

          {/* Form */}
          <FadeUp delay={0.2} className="md:col-span-3">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl">Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                  <p className="text-xl font-semibold">Message Sent!</p>
                  <p className="text-base text-muted-foreground">We&apos;ll get back to you within 24 hours.</p>
                  <Button variant="outline" className="border-gold/40 mt-2" onClick={() => setSent(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-base">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="bg-navy border-gold/20 focus:border-gold text-base"
                      {...register('name')}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-navy border-gold/20 focus:border-gold text-base"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-base">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your investment goals..."
                      className="bg-navy border-gold/20 focus:border-gold resize-none text-base"
                      {...register('message')}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold text-navy-deep text-lg font-semibold hover:bg-gold-light"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
