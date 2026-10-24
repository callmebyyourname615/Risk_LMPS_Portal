import { useEffect, useRef, useState, type RefObject } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export function useNetworkPageMotion() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
      const reduce = Boolean(context.conditions?.reduce)
      setReducedMotion(reduce)
      if (reduce) return
      gsap.from('.page-heading, .network-identity-banner, .network-filter-panel, .network-summary > .kpi-card, .network-tabs-row', {
        autoAlpha: 0, y: 10, duration: .42, stagger: .025, ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      })
    }, pageRef)
    return () => media.revert()
  }, { scope: pageRef })

  return { pageRef, reducedMotion }
}

export function useNetworkInspectorMotion(ref: RefObject<HTMLElement | null>, contentKey: string, reducedMotion: boolean) {
  useGSAP(() => {
    if (reducedMotion || !ref.current) return
    gsap.from('.network-inspector-content', {
      autoAlpha: 0, x: 6, duration: .24, ease: 'power2.out',
      clearProps: 'opacity,visibility,transform',
    })
  }, { scope: ref, dependencies: [contentKey, reducedMotion], revertOnUpdate: true })
}

export function useNetworkCanvasMotion({ graphKey, selectionKey, zoom, pan, dragging, reducedMotion }: {
  graphKey: string; selectionKey: string; zoom: number
  pan: { x: number; y: number }; dragging: boolean; reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<SVGGElement>(null)
  const movement = useRef<{ x: ReturnType<typeof gsap.quickTo>; y: ReturnType<typeof gsap.quickTo>; scale: ReturnType<typeof gsap.quickTo> } | null>(null)

  const { contextSafe } = useGSAP(() => {
    if (!viewportRef.current) return
    gsap.set(viewportRef.current, { svgOrigin: '500 310', x: 0, y: 0, scale: 1 })
    movement.current = {
      x: gsap.quickTo(viewportRef.current, 'x', { duration: .3, ease: 'power3.out' }),
      y: gsap.quickTo(viewportRef.current, 'y', { duration: .3, ease: 'power3.out' }),
      scale: gsap.quickTo(viewportRef.current, 'scale', { duration: .42, ease: 'power3.out' }),
    }
    return () => { movement.current = null }
  }, { scope: canvasRef })

  useEffect(contextSafe(() => {
    const move = movement.current
    if (!move || !viewportRef.current) return
    if (reducedMotion) {
      move.x.tween.pause(); move.y.tween.pause(); move.scale.tween.pause()
      gsap.set(viewportRef.current, { x: pan.x, y: pan.y, scale: zoom })
      return
    }
    move.x.tween.duration(dragging ? .08 : .3)
    move.y.tween.duration(dragging ? .08 : .3)
    move.x(pan.x); move.y(pan.y); move.scale(zoom)
  }), [pan.x, pan.y, zoom, dragging, reducedMotion])

  useGSAP(() => {
    if (reducedMotion) return
    gsap.from('.network-node-art', {
      autoAlpha: 0, scale: .9, transformOrigin: '50% 50%', duration: .38,
      stagger: .035, ease: 'power2.out', clearProps: 'opacity,visibility,transform',
    })
    gsap.from('.network-node-name, .network-node-ref, .network-root-label', {
      autoAlpha: 0, duration: .3, stagger: .012, ease: 'power2.out', clearProps: 'opacity,visibility',
    })
    const lines = canvasRef.current?.querySelectorAll<SVGPathElement>('.network-edge:not(.alternate-currency) .network-edge-line')
    if (lines?.length) gsap.fromTo(lines, {
      autoAlpha: 0,
      strokeDasharray: (_: number, target: SVGPathElement) => target.getTotalLength(),
      strokeDashoffset: (_: number, target: SVGPathElement) => target.getTotalLength(),
    }, {
      autoAlpha: 1, strokeDashoffset: 0, duration: .5, stagger: .025, ease: 'power2.out',
      clearProps: 'opacity,visibility,strokeDasharray,strokeDashoffset',
    })
    const dashed = canvasRef.current?.querySelectorAll('.network-edge.alternate-currency .network-edge-line')
    if (dashed?.length) gsap.from(dashed, {
      autoAlpha: 0, duration: .35, ease: 'power2.out', clearProps: 'opacity,visibility',
    })
  }, { scope: canvasRef, dependencies: [graphKey, reducedMotion], revertOnUpdate: true })

  useGSAP(() => {
    if (reducedMotion) return
    const halo = canvasRef.current?.querySelector('.network-node.selected .network-node-halo')
    if (!halo) return
    gsap.fromTo(halo, { scale: .96 }, {
      scale: 1.08, transformOrigin: '50% 50%', duration: .2, repeat: 1, yoyo: true,
      ease: 'power2.out', clearProps: 'transform',
    })
  }, { scope: canvasRef, dependencies: [selectionKey, graphKey, reducedMotion], revertOnUpdate: true })

  return { canvasRef, viewportRef }
}
