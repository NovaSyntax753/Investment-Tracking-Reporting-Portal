'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gold bg-navy-deep/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-gold" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-gold">Alpha</span>
            <span className="text-foreground">Capital</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-gold ${
                pathname === href ? 'text-gold' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'bg-gold text-navy-deep font-semibold hover:bg-gold-light')}>
            Investor Login
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gold/20 bg-navy-deep px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium transition-colors hover:text-gold ${
                  pathname === href ? 'text-gold' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ size: 'sm' }), 'bg-gold text-navy-deep font-semibold w-full justify-center')}>
              Investor Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
