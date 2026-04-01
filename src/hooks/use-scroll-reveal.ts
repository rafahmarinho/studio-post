'use client'

import { useEffect, useRef } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'rotate'

interface ScrollRevealOptions {
  /** Trigger threshold (0 = any pixel visible, 1 = fully visible). Default: 0.15 */
  threshold?: number
  /** Root margin to trigger earlier/later. Default: "0px 0px -60px 0px" */
  rootMargin?: string
  /** Only animate once (true) or every time it enters viewport (false). Default: true */
  once?: boolean
}

/**
 * Lightweight scroll-reveal hook using IntersectionObserver.
 *
 * Usage:
 *   const ref = useScrollReveal<HTMLDivElement>('up')
 *   <div ref={ref} className="scroll-hidden"> ... </div>
 *
 * For staggered children:
 *   const ref = useScrollReveal<HTMLDivElement>('up', { staggerChildren: true })
 *   <div ref={ref}>
 *     <div className="scroll-hidden scroll-delay-1">child 1</div>
 *     <div className="scroll-hidden scroll-delay-2">child 2</div>
 *   </div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  direction: RevealDirection = 'up',
  options?: ScrollRevealOptions & { staggerChildren?: boolean }
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true, staggerChildren = false } = options || {}
    const revealClass = `scroll-reveal-${direction}`

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (staggerChildren) {
              // Reveal each child that has scroll-hidden
              const children = el.querySelectorAll('.scroll-hidden')
              children.forEach((child) => {
                child.classList.remove('scroll-hidden')
                child.classList.add(revealClass)
              })
            } else {
              el.classList.remove('scroll-hidden')
              el.classList.add(revealClass)
            }

            if (once) observer.unobserve(el)
          } else if (!once) {
            if (staggerChildren) {
              const children = el.querySelectorAll(`.${revealClass}`)
              children.forEach((child) => {
                child.classList.remove(revealClass)
                child.classList.add('scroll-hidden')
              })
            } else {
              el.classList.remove(revealClass)
              el.classList.add('scroll-hidden')
            }
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [direction, options])

  return ref
}

/**
 * Batch version: observes multiple elements via a container ref.
 * Each child with `data-scroll` attribute gets animated individually.
 *
 * Usage:
 *   const containerRef = useScrollRevealBatch()
 *   <div ref={containerRef}>
 *     <div data-scroll="up">...</div>
 *     <div data-scroll="left" data-scroll-delay="2">...</div>
 *   </div>
 */
export function useScrollRevealBatch(options?: ScrollRevealOptions) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { threshold = 0.12, rootMargin = '0px 0px -50px 0px', once = true } = options || {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          const dir = el.dataset.scroll || 'up'
          const revealClass = `scroll-reveal-${dir}`

          if (entry.isIntersecting) {
            el.classList.remove('scroll-hidden')
            el.classList.add(revealClass)
            if (once) observer.unobserve(el)
          } else if (!once) {
            el.classList.remove(revealClass)
            el.classList.add('scroll-hidden')
          }
        })
      },
      { threshold, rootMargin }
    )

    const targets = container.querySelectorAll('[data-scroll]')
    targets.forEach((el) => {
      el.classList.add('scroll-hidden')
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [options])

  return containerRef
}
