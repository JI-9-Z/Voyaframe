export interface RecordingSession { mimeType: string; extension: 'mp4' | 'webm'; stop: (download?: boolean) => Promise<void> }

function preferredMimeType(): { mimeType: string; extension: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates: Array<{ mimeType: string; extension: 'mp4' | 'webm' }> = [
    { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ]
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType)) ?? null
}

const safeFilename = (name: string) => name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'voyaframe'

export function getRecordingSupport(): { supported: boolean; format: string } {
  const choice = preferredMimeType()
  return { supported: Boolean(choice && HTMLCanvasElement.prototype.captureStream), format: choice?.extension.toUpperCase() ?? '不支持' }
}

export function startCanvasRecording(canvas: HTMLCanvasElement, tripName: string, fps?: number, audioStream?: MediaStream | null): RecordingSession | null {
  const choice = preferredMimeType()
  if (!choice || !canvas.captureStream) return null
  const mobile = window.matchMedia('(max-width: 1023px)').matches
  const targetFps = fps ?? (mobile ? 30 : 60)
  const stream = canvas.captureStream(targetFps)
  audioStream?.getAudioTracks().forEach((track) => stream.addTrack(track.clone()))
  const recorder = new MediaRecorder(stream, { mimeType: choice.mimeType, videoBitsPerSecond: mobile ? 5_000_000 : 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
  recorder.start(250)
  return {
    ...choice,
    stop: (download = true) => new Promise((resolve) => {
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        if (download && chunks.length) {
          const blob = new Blob(chunks, { type: choice.mimeType }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a')
          anchor.href = url; anchor.download = `${safeFilename(tripName)}_${new Date().toISOString().slice(0, 10)}.${choice.extension}`; anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
        resolve()
      }
      if (recorder.state !== 'inactive') recorder.stop(); else resolve()
    }),
  }
}
