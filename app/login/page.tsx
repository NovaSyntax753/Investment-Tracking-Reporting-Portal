'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { loginAction } from '@/lib/actions/auth'
import { HeroItem } from '@/components/Animate'
import BrandLogo from '@/components/BrandLogo'

const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your Investor ID or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const registrationPhone = process.env.NEXT_PUBLIC_REGISTRATION_PHONE ?? '+91 95886 77762'
  const registrationPhoneHref = `tel:${registrationPhone.replace(/[^+\d]/g, '')}`
  const [showPw, setShowPw] = useState(false)

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = loginForm

  async function onSubmit(data: LoginFormData) {
    const fd = new FormData()
    fd.append('identifier', data.identifier)
    fd.append('password', data.password)
    const result = await loginAction(fd)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-deep">
      <img
        src="https://images.unsplash.com/photo-1642790551116-18e150f248e3?auto=format&fit=crop&w=1920&q=80"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/60 via-navy-deep/70 to-navy-deep/85" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <HeroItem delay={0} className="mb-6 flex justify-center">
            <BrandLogo imageClassName="h-14 w-auto" />
          </HeroItem>

          <HeroItem delay={0.15}>
            <Card className="bg-charcoal/95 border-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.08)] card-glow">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Investor Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="identifier">Investor ID or Email</Label>
                    <Input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="INV-1001 or you@example.com"
                      className="bg-navy border-gold/20 focus:border-gold"
                      {...register('identifier')}
                    />
                    {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="bg-navy border-gold/20 focus:border-gold pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-navy/90 p-1.5 text-gold/85 hover:text-gold"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full shimmer-btn text-navy-deep font-bold text-base hover:opacity-90"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    This portal is only for existing approved investors.
                  </p>
                </form>

                <div className="mt-6 rounded-lg border border-gold/20 bg-navy p-4 text-center">
                  <p className="text-sm text-muted-foreground">For new registration, contact this number:</p>
                  <a
                    href={registrationPhoneHref}
                    className="mt-1 inline-block text-lg font-semibold text-gold hover:underline"
                    aria-label={`Call ${registrationPhone}`}
                  >
                    {registrationPhone}
                  </a>
                  <div className="mt-3">
                    <Link href="/contact" className="text-sm text-gold hover:underline">
                      Go to Contact Page
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HeroItem>

          <HeroItem delay={0.2} className="mt-6 rounded-xl border border-gold/20 bg-charcoal/80 p-5 text-center backdrop-blur-sm">
            <div className="mb-3 font-mono text-xs tracking-widest uppercase text-gold">
              Investor Portal
            </div>
            <blockquote className="mb-4 text-2xl font-bold leading-snug text-white">
              Smart investments.<br />
              <span className="text-gold">Consistent returns.</span>
            </blockquote>
            <p className="text-sm leading-relaxed text-white/70">
              Secure. Transparent. Professional market management for select investors.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Daily Updates', 'Fixed Returns', 'Secure Portal'].map((t) => (
                <span key={t} className="rounded-full border border-gold/25 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
                  {t}
                </span>
              ))}
            </div>
          </HeroItem>
        </div>
      </div>
    </div>
  )
}
