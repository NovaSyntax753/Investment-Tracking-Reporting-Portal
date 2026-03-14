'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type BrandLogoProps = {
  href?: string
  className?: string
  imageClassName?: string
  textClassName?: string
}

export default function BrandLogo({
  href = '/',
  className = 'flex items-center gap-2',
  imageClassName = 'h-10 w-auto',
  textClassName = 'text-xl font-bold tracking-tight',
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <Link href={href} className={className}>
      {!imageFailed ? (
        <Image
          src="/logo-image.jpeg"
          alt="RK Smart Money"
          width={160}
          height={56}
          className={imageClassName}
          priority
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={textClassName}>
          <span className="text-gold">RK </span>
          <span className="text-foreground">Trading</span>
        </span>
      )}
    </Link>
  )
}