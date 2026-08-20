import { useEffect, type RefObject } from 'react'

export function useCanvasRenderer(canvasRef: RefObject<HTMLCanvasElement | null>, draw: (context: CanvasRenderingContext2D, now: number) => void, maxFps = 60): void {
  useEffect(() => {
    let frame = 0
    let lastRender = 0
    const minimumFrameTime = 1000 / Math.max(1, maxFps)
    const render = (now: number) => {
      if (!document.hidden && now - lastRender >= minimumFrameTime - 1) {
        const context = canvasRef.current?.getContext('2d')
        if (context) draw(context, now)
        lastRender = now
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [canvasRef, draw, maxFps])
}
