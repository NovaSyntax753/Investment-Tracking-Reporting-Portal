'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import BrandLogo from '@/components/BrandLogo'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/premium', label: 'Premium' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-gold bg-navy-deep/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <BrandLogo imageClassName="h-10 w-auto" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative text-xl font-semibold transition-colors hover:text-gold ${
                pathname === href
                  ? 'text-gold after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-gold'
                  : 'text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'shimmer-btn px-8 text-lg font-bold text-navy-deep hover:opacity-90')}>
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
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden border-t border-gold/20 bg-navy-deep md:hidden"
        >
          <nav className="flex flex-col gap-5 px-6 py-5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`relative text-xl font-semibold transition-colors hover:text-gold ${
                  pathname === href
                    ? 'text-gold after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-gold'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ size: 'lg' }), 'shimmer-btn w-full justify-center text-lg font-bold text-navy-deep hover:opacity-90')}>
              Investor Login
            </Link>
          </nav>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.header>
  )
}
