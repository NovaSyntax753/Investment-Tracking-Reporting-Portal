import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-navy-deep py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            <span className="font-bold">
              <span className="text-gold">Alpha</span>
              <span className="text-foreground">Capital</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-gold transition-colors">About</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Services</Link>
            <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-gold transition-colors">Login</Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AlphaCapital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
