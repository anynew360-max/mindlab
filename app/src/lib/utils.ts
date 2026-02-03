import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url?: string) {
  if (!url) return '/images/placeholder.svg'
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/')) return url
  const needsProxy = /fbcdn\.net|facebook\.com|shopee\.co\.th|wikia\.nocookie\.net/i.test(url)
  if (!needsProxy) return url
  const sanitized = url.replace(/^https?:\/\//, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(sanitized)}`
}
