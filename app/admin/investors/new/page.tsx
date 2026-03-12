'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createInvestorAction } from '@/lib/actions/investors'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  invested_amount: z.coerce.number().positive('Must be positive'),
  fixed_return_value: z.coerce.number().min(0, 'Must be 0 or more'),
  fixed_return_percentage: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),
})

type FormData = z.infer<typeof schema>

export default function NewInvestorPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.append(k, String(v ?? '')))
    const res = await createInvestorAction(fd)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Investor created — login email sent')
      router.push('/admin/investors')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/investors" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground mb-4')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Investors
        </Link>
        <h1 className="text-2xl font-bold">New Investor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Creates a Supabase Auth account and sends a password-set email to the investor.
        </p>
      </div>

      <Card className="bg-charcoal border-gold/20">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>All fields marked are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Rahul Sharma" className="bg-navy border-gold/20 focus:border-gold" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" placeholder="rahul@example.com" className="bg-navy border-gold/20 focus:border-gold" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone / WhatsApp</Label>
              <Input id="phone" placeholder="+91 98XXX XXXXX" className="bg-navy border-gold/20 focus:border-gold" {...register('phone')} />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="invested_amount">Invested Amount (₹) *</Label>
                <Input id="invested_amount" type="number" step="0.01" placeholder="500000" className="bg-navy border-gold/20 focus:border-gold terminal-text" {...register('invested_amount')} />
                {errors.invested_amount && <p className="text-xs text-destructive">{errors.invested_amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fixed_return_value">Fixed Return (₹) *</Label>
                <Input id="fixed_return_value" type="number" step="0.01" placeholder="75000" className="bg-navy border-gold/20 focus:border-gold terminal-text" {...register('fixed_return_value')} />
                {errors.fixed_return_value && <p className="text-xs text-destructive">{errors.fixed_return_value.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fixed_return_percentage">Return % p.a. *</Label>
                <Input id="fixed_return_percentage" type="number" step="0.01" placeholder="15" className="bg-navy border-gold/20 focus:border-gold terminal-text" {...register('fixed_return_percentage')} />
                {errors.fixed_return_percentage && <p className="text-xs text-destructive">{errors.fixed_return_percentage.message}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-gold text-navy-deep font-bold hover:bg-gold-light flex-1">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Investor Account'}
              </Button>
              <Button type="button" variant="outline" className="border-gold/30" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
