'use client'

import { useState } from 'react'
import { getFoodEmoji, getFoodBgColor } from '@/lib/food-images'

interface FoodImageProps {
  src?: string | null
  alt: string
  category?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-14 h-14 text-2xl',
  lg: 'w-20 h-20 text-3xl',
}

export default function FoodImage({ src, alt, category = 'other', size = 'md', className = '' }: FoodImageProps) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = sizes[size]
  const bg = getFoodBgColor(category)
  const emoji = getFoodEmoji(category)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-xl object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClass} ${bg} rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}>
      <span>{emoji}</span>
    </div>
  )
}
