'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="border-t border-gold/20 bg-navy-deep py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            <span className="font-bold">
              <span className="text-gold">RK </span>
              <span className="text-foreground">Trading</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:text-base md:justify-start">
            <Link href="/about" className="hover:text-gold transition-colors">About</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Services</Link>
            <Link href="/premium" className="hover:text-gold transition-colors">Premium</Link>
            <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
            <Link
              href="https://www.instagram.com/rksmartmoney_?igsh=bnkxYnJteXN6NHo0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold transition-colors"
            >
              Instagram
            </Link>
            <Link href="/login" className="hover:text-gold transition-colors">Login</Link>
          </nav>

          <p className="text-center text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} RK Trading. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
