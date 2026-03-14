'use client'

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
import { loginAction, resendVerificationLinkAction, submitRegistrationRequestAction } from '@/lib/actions/auth'
import { HeroItem } from '@/components/Animate'
import BrandLogo from '@/components/BrandLogo'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  invested_amount: z.coerce.number().min(0, 'Must be 0 or more'),
  fixed_return_value: z.coerce.number().min(0, 'Must be 0 or more'),
  fixed_return_percentage: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPw, setShowPw] = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)
  const [showRegConfirmPw, setShowRegConfirmPw] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      invested_amount: 0,
      fixed_return_value: 0,
      fixed_return_percentage: 0,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = loginForm

  async function onSubmit(data: LoginFormData) {
    const fd = new FormData()
    fd.append('email', data.email)
    fd.append('password', data.password)
    const result = await loginAction(fd)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  async function onRegisterSubmit(data: z.infer<typeof registerSchema>) {
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('email', data.email)
    fd.append('phone', data.phone ?? '')
    fd.append('password', data.password)
    fd.append('invested_amount', String(data.invested_amount))
    fd.append('fixed_return_value', String(data.fixed_return_value))
    fd.append('fixed_return_percentage', String(data.fixed_return_percentage))

    const result = await submitRegistrationRequestAction(fd)
    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success('Registration submitted. Admin approval is required before login.')
    registerForm.reset()
    setMode('login')
  }

  async function onResendVerification() {
    const email = loginForm.getValues('email')?.trim()
    if (!email) {
      toast.error('Enter your email first to resend verification.')
      return
    }

    setResendLoading(true)
    const fd = new FormData()
    fd.append('email', email)
    const result = await resendVerificationLinkAction(fd)
    setResendLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success(result?.message ?? 'Verification email sent.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <HeroItem delay={0} className="mb-8 flex justify-center">
          <BrandLogo imageClassName="h-14 w-auto" />
        </HeroItem>

        <HeroItem delay={0.15}>
        <Card className="bg-charcoal border-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Investor Login' : 'Register Before Login'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Submit details. Admin approves first, then you verify email and login.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-gold/20 p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === 'login' ? 'bg-gold text-navy-deep' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === 'register' ? 'bg-gold text-navy-deep' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="bg-navy border-gold/20 focus:border-gold"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  className="w-full bg-gold text-navy-deep font-bold text-base hover:bg-gold-light"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onResendVerification}
                  disabled={resendLoading || isSubmitting}
                  className="w-full border-gold/30 text-gold hover:bg-gold/10"
                >
                  {resendLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    'Resend Verification Link'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Use this only after admin approval if your verification link expired.
                </p>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg_name">Full Name</Label>
                  <Input
                    id="reg_name"
                    placeholder="Rahul Sharma"
                    className="bg-navy border-gold/20 focus:border-gold"
                    {...registerForm.register('name')}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_email">Email Address</Label>
                  <Input
                    id="reg_email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-navy border-gold/20 focus:border-gold"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_phone">Phone</Label>
                  <Input
                    id="reg_phone"
                    placeholder="+91 98XXX XXXXX"
                    className="bg-navy border-gold/20 focus:border-gold"
                    {...registerForm.register('phone')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_password">Password</Label>
                  <div className="relative">
                    <Input
                      id="reg_password"
                      type={showRegPw ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      className="bg-navy border-gold/20 focus:border-gold pr-10"
                      {...registerForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw(!showRegPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="reg_confirm_password"
                      type={showRegConfirmPw ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      className="bg-navy border-gold/20 focus:border-gold pr-10"
                      {...registerForm.register('confirm_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPw(!showRegConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showRegConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirm_password && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg_invested">Invested (INR)</Label>
                    <Input
                      id="reg_invested"
                      type="number"
                      step="0.01"
                      className="bg-navy border-gold/20 focus:border-gold terminal-text"
                      {...registerForm.register('invested_amount')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg_fixed_value">Fixed Return (INR)</Label>
                    <Input
                      id="reg_fixed_value"
                      type="number"
                      step="0.01"
                      className="bg-navy border-gold/20 focus:border-gold terminal-text"
                      {...registerForm.register('fixed_return_value')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg_fixed_pct">Return %</Label>
                    <Input
                      id="reg_fixed_pct"
                      type="number"
                      step="0.01"
                      className="bg-navy border-gold/20 focus:border-gold terminal-text"
                      {...registerForm.register('fixed_return_percentage')}
                    />
                  </div>
                </div>

                {(registerForm.formState.errors.invested_amount ||
                  registerForm.formState.errors.fixed_return_value ||
                  registerForm.formState.errors.fixed_return_percentage) && (
                  <p className="text-xs text-destructive">
                    Please enter valid numeric values for amount and returns.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="w-full bg-gold text-navy-deep font-bold text-base hover:bg-gold-light"
                >
                  {registerForm.formState.isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Registration Request'
                  )}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  No account?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-gold hover:underline">
                    Register before login
                  </button>
                </>
              ) : (
                <>
                  Already approved?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-gold hover:underline">
                    Back to login
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
        </HeroItem>
      </div>
    </div>
  )
}
