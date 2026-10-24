import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export function useMonitoringMotion(contentKey: string) {
  const pageRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const elements = pageRef.current?.querySelectorAll(':scope > .page-heading, :scope > .scope-strip, .records-summary > .kpi-card, :scope > .records-filters, :scope > .detail-summary, :scope > .index-grid > .dimension-index, :scope > .detail-tabs')
      if (!elements?.length) return
      gsap.from(elements, {
        autoAlpha: 0, y: 8, duration: .36, stagger: .025, ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      })
    }, pageRef)
    return () => media.revert()
  }, { scope: pageRef })

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ normal: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
      const content = pageRef.current?.querySelectorAll(':scope > .records-content, :scope > .async-state')
      if (!content?.length) return
      gsap.from(content, {
        autoAlpha: 0, duration: context.conditions?.reduce ? .1 : .22,
        ease: 'power2.out', clearProps: 'opacity,visibility',
      })
    }, pageRef)
    return () => media.revert()
  }, { scope: pageRef, dependencies: [contentKey], revertOnUpdate: true })

  return pageRef
}
