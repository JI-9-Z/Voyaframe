import { useEffect, type RefObject } from 'react'

export function useCanvasRenderer(canvasRef: RefObject<HTMLCanvasElement | null>, draw: (context: CanvasRenderingContext2D, now: number) => void): void {
  useEffect(() => {
    let frame = 0
    const render = (now: number) => {
      const context = canvasRef.current?.getContext('2d')
      if (context) draw(context, now)
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [canvasRef, draw])
}
