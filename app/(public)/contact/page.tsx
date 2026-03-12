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
import { Mail, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitContactAction } from '@/lib/actions/contact'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

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
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Contact</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Get In Touch</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question or ready to invest? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-5">
          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <Mail className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">contact@alphacapital.in</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <Phone className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold">WhatsApp / Phone</p>
                <p className="text-sm text-muted-foreground">+91 98XXX XXXXX</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-charcoal">
                <MapPin className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="md:col-span-3 bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-lg">Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                  <p className="text-xl font-semibold">Message Sent!</p>
                  <p className="text-sm text-muted-foreground">We&apos;ll get back to you within 24 hours.</p>
                  <Button variant="outline" className="border-gold/40 mt-2" onClick={() => setSent(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="bg-navy border-gold/20 focus:border-gold"
                      {...register('name')}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-navy border-gold/20 focus:border-gold"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your investment goals..."
                      className="bg-navy border-gold/20 focus:border-gold resize-none"
                      {...register('message')}
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold text-navy-deep font-semibold hover:bg-gold-light"
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
        </div>
      </div>
    </div>
  )
}
