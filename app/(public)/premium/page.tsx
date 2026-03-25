"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/Animate";
import {
  CheckCircle2,
  TriangleAlert,
  Loader2,
  Mail,
  Phone,
  Instagram,
  MapPin,
  Crown,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { submitPremiumContactAction } from "@/lib/actions/contact";

const signalPoints = [
  "Accurate Entry Points",
  "Target Levels",
  "Stop Loss Guidance",
];

const marketPoints = [
  "Regular updates on market trends",
  "Key levels and breakout alerts",
];

const realtimePoints = [
  "Instant signal delivery",
  "Quick reaction to market movements",
];

const consistencyPoints = [
  "Trades designed for disciplined execution",
  "Risk-managed strategies",
];

const whoShouldJoin = [
  "Traders looking for expert guidance",
  "Beginners who need direction",
  "Busy individuals who can’t track markets full-time",
];

const steps = [
  "Subscribe to Premium Membership",
  "Get access to our private Telegram group",
  "Receive daily trading signals",
  "Execute trades on your own account",
  "Follow targets and stop loss for best results",
];

const guidelines = [
  "Always follow proper risk management",
  "Do not overtrade",
  "Stick to given stop loss and targets",
  "Trade responsibly",
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type PremiumContactFormData = z.infer<typeof schema>;

const CONTACT_EMAIL = "rksmartmoney@gmail.com";
const CONTACT_PHONE = "+91 95886 77762";
const INSTAGRAM_URL =
  "https://www.instagram.com/rksmartmoney_?igsh=bnkxYnJteXN6NHo0";

export default function PremiumPage() {
  const telegramJoinUrl =
    process.env.NEXT_PUBLIC_PREMIUM_TELEGRAM_URL || "https://t.me/";
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PremiumContactFormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: PremiumContactFormData) {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("email", data.email);
    fd.append("message", data.message);
    fd.append("source", "Premium Page Form");

    // First, save into the Supabase database
    const result = await submitPremiumContactAction(fd);
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    // Next, submit to Web3Forms directly from the browser
    const accessKey =
      process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY_PREMIUM ||
      process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if (accessKey) {
      try {
        const web3Result = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: accessKey,
            name: data.name,
            email: data.email,
            message: data.message,
            subject: "New Premium Form Submission",
            from_name: "RK Smart Money Website",
          }),
        });

        const responseData = await web3Result.json();
        if (!responseData.success) {
          console.error("Web3Forms response error:", responseData);
          toast.warning(
            "Message saved, but email forwarding encountered an issue.",
          );
        } else {
          toast.success("Message sent! We will get back to you soon.");
        }
      } catch (err) {
        console.error("Web3Forms fetch error:", err);
        toast.warning(
          "Message saved, but we had trouble forwarding the email.",
        );
      }
    } else {
      toast.success("Message saved to database!");
    }

    setSent(true);
    reset();
  }

  return (
    <div className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp className="text-center mb-16">
          <p className="mb-3 text-2xl font-semibold uppercase tracking-widest text-gold">
            Premium Membership
          </p>
          <h1 className="text-5xl font-extrabold sm:text-5xl">
            RK Smart Money Premium Membership
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Get Expert Trading Signals. Maximize Your Profits.
          </p>
          <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join our exclusive Telegram community and receive high-quality trade
            signals, market insights, and expert guidance - designed to help you
            make smarter trading decisions.
          </p>
          <p className="mt-3 text-2xl text-gold font-bold">
            Trade smarter, not harder.
          </p>
        </FadeUp>

        <div className="mb-10 grid gap-8 lg:grid-cols-3">
          <Card className="bg-charcoal border-gold/20 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">
                What is Premium Membership?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg text-muted-foreground leading-relaxed">
              RK Smart Money Premium Membership is a subscription-based service
              where members receive carefully analyzed trading signals directly
              on Telegram. These signals are based on market research, technical
              analysis, and experience - helping you identify profitable
              opportunities in real-time.
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-lg">
              <p>
                <span className="text-muted-foreground">
                  Monthly Subscription Fee:
                </span>{" "}
                <span className="font-semibold">₹3000</span>
              </p>
              <p>
                <span className="text-muted-foreground">Validity:</span>{" "}
                <span className="font-semibold">30 Days</span>
              </p>
              <p>
                <span className="text-muted-foreground">Platform:</span>{" "}
                <span className="font-semibold">Private Telegram Group</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <FadeUp className="mb-8">
          <h2 className="text-4xl font-bold">What You Will Get</h2>
        </FadeUp>

        <Stagger className="grid gap-8 md:grid-cols-2">
          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">
                  Daily Trade Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {signalPoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">
                  Market Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {marketPoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">
                  Real-Time Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {realtimePoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">
                  Focus on Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {consistencyPoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">
                Who Should Join?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
              {whoShouldJoin.map((point) => (
                <p
                  key={point}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
              {steps.map((step, index) => (
                <p key={step} className="text-muted-foreground">
                  <span className="text-lg text-gold font-bold">
                    {index + 1}.
                  </span>{" "}
                  {step}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 bg-charcoal border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-gold">
              Important Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 text-lg">
            {guidelines.map((point) => (
              <p
                key={point}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <CheckCircle2 className="h-5 w-5 text-gold" />
                {point}
              </p>
            ))}
          </CardContent>
        </Card>

        <FadeUp className="mt-12 text-center">
          <h3 className="text-3xl font-bold text-gold">
            Join Premium Now - ₹3000/month
          </h3>
          <p className="mt-3 text-lg text-muted-foreground">
            Start receiving expert trading signals today.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href={telegramJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-gold/40 text-lg px-8",
              )}
            >
              Join on Telegram
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                "text-lg px-8",
              )}
            >
              Investor Login
            </Link>
          </div>
        </FadeUp>

        <Card className="mt-12 border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-6">
            <p className="flex items-start gap-2 text-base text-amber-200 leading-relaxed">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                RK Smart Money provides trading signals for educational and
                informational purposes only. We do not guarantee profits.
                Trading in financial markets involves risk. Users are advised to
                trade at their own discretion.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="relative mt-20 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[#0b1226] via-[#121a35] to-[#090f21] p-6 sm:p-10">
          <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-amber-200/10 blur-3xl" />

          <FadeUp className="mb-10 text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              <Crown className="h-4 w-4" /> Premium Concierge Desk
            </p>
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Private Support for Premium Members
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
              This priority channel is designed for premium members who want
              faster onboarding help, subscription support, and direct
              assistance before joining.
            </p>
          </FadeUp>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="relative h-40 overflow-hidden rounded-2xl border border-gold/30">
                  <img
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
                    alt="Premium trading desk setup"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1226]/85 to-transparent" />
                </div>
                <div className="relative h-40 overflow-hidden rounded-2xl border border-gold/30">
                  <img
                    src="https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1000&q=80"
                    alt="Premium financial office"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1226]/85 to-transparent" />
                </div>
              </div>

              <div className="rounded-2xl border border-gold/25 bg-[#0d152e]/80 p-5">
                <Stagger className="space-y-5">
                  <StaggerItem>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-gold" />
                      <div>
                        <p className="font-semibold">Premium-first Support</p>
                        <p className="text-sm text-slate-300">
                          Dedicated handling for premium membership requests.
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 text-gold" />
                      <div>
                        <p className="font-semibold">Faster Response Window</p>
                        <p className="text-sm text-slate-300">
                          We prioritize replies from this premium desk.
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                </Stagger>
              </div>
            </div>

            <div className="lg:col-span-3">
              <Card className="border-gold/40 bg-gradient-to-b from-[#121d3a] to-[#0c1429] shadow-[0_0_45px_rgba(212,175,55,0.15)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-gold">
                    Request Premium Membership Assistance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sent ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                      <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                      <p className="text-xl font-semibold">
                        Premium Request Sent
                      </p>
                      <p className="text-base text-slate-300">
                        Our premium desk will contact you shortly.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2 border-gold/50 bg-gold/10"
                        onClick={() => setSent(false)}
                      >
                        Send Another Request
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="name"
                          className="text-base text-slate-100"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          className="border-gold/25 bg-[#0a1226] text-base text-slate-100 focus:border-gold"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="email"
                          className="text-base text-slate-100"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="border-gold/25 bg-[#0a1226] text-base text-slate-100 focus:border-gold"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="message"
                          className="text-base text-slate-100"
                        >
                          Message
                        </Label>
                        <Textarea
                          id="message"
                          rows={5}
                          placeholder="Tell us what support you need for premium onboarding..."
                          className="resize-none border-gold/25 bg-[#0a1226] text-base text-slate-100 focus:border-gold"
                          {...register("message")}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">
                            {errors.message.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gold text-lg font-semibold text-navy-deep hover:bg-gold-light"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Sending…
                          </>
                        ) : (
                          "Submit Premium Request"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card className="border-gold/30 bg-[#101a34]/90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-gold">
                      Premium Contact Desk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-gold" />
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-slate-300 transition-colors hover:text-gold"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-gold" />
                      <a
                        href="tel:+919588677762"
                        className="text-slate-300 transition-colors hover:text-gold"
                      >
                        {CONTACT_PHONE}
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Instagram className="mt-0.5 h-5 w-5 text-gold" />
                      <Link
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 transition-colors hover:text-gold"
                      >
                        @rksmartmoney_
                      </Link>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-gold" />
                      <p className="text-slate-300">
                        Nagpur, Maharashtra, India
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/30 bg-[#101a34]/90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-gold">
                      What Happens Next
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-300">
                    <p>1. Premium desk reviews your request.</p>
                    <p>2. We share onboarding and payment details.</p>
                    <p>
                      3. You receive private group access after confirmation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
