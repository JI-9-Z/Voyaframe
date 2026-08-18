import type { Point } from '../lib/coordinateProjection'
import type { Transport } from '../types'

export function drawVehicle(context: CanvasRenderingContext2D, point: Point, angle: number, transport: Transport): void {
  context.save(); context.translate(point.x, point.y); context.rotate(angle); context.shadowBlur = 18; context.shadowColor = '#fff'; context.fillStyle = '#fff'; context.strokeStyle = '#07131f'; context.lineWidth = 1.5; context.beginPath()
  if (transport === 'plane') {
    context.moveTo(18, 0); context.lineTo(-4, -4); context.lineTo(-12, -14); context.lineTo(-17, -13); context.lineTo(-11, -2); context.lineTo(-18, 0); context.lineTo(-11, 2); context.lineTo(-17, 13); context.lineTo(-12, 14); context.lineTo(-4, 4); context.closePath()
  } else if (transport === 'ship') {
    context.moveTo(17, 0); context.lineTo(9, 8); context.lineTo(-14, 8); context.lineTo(-18, 0); context.lineTo(-14, -8); context.lineTo(9, -8); context.closePath()
  } else context.roundRect(-16, -9, 32, 18, 5)
  context.fill(); context.stroke()
  if (transport === 'car' || transport === 'train') { context.fillStyle = '#07131f'; context.fillRect(-7, -5, 9, 10); context.fillRect(5, -5, 6, 10) }
  context.restore()
}
