import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Investment Portal',
  description: 'Secure investment tracking and reporting platform',
  icons: {
    icon: '/logo-image.jpeg',
    shortcut: '/logo-image.jpeg',
    apple: '/logo-image.jpeg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#111b2e',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#e8eaf0',
            },
          }}
        />
      </body>
    </html>
  )
}
