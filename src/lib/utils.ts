import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Grows a textarea to fit its content (up to its CSS max-height, where it
// scrolls instead). Call on mount (pass directly as a ref) and again on
// every change so it tracks typing in real time.
export function autoGrowTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
