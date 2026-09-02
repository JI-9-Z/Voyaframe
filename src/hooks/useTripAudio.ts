import { useCallback, useEffect, useRef, useState } from 'react'
import { loadMediaAsset } from '../services/mediaStorageService'

interface AudioGraph { context: AudioContext; destination: MediaStreamAudioDestinationNode; gain: GainNode }

export function useTripAudio(assetId: string | undefined, volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const graphRef = useRef<AudioGraph | null>(null)
  const urlRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    const previousUrl = urlRef.current
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    urlRef.current = null
    audioRef.current?.pause()
    audioRef.current = null
    graphRef.current?.context.close().catch(() => undefined)
    graphRef.current = null
    if (!assetId) return
    void loadMediaAsset(assetId).then((asset) => {
      if (!asset || cancelled) return
      const url = URL.createObjectURL(asset.blob)
      const audio = new Audio(url)
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = Math.max(0, Math.min(1, volume))
      urlRef.current = url
      audioRef.current = audio
      setReady(true)
    }).catch(() => setReady(false))
    return () => { cancelled = true }
  }, [assetId])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume))
    if (graphRef.current) graphRef.current.gain.gain.value = Math.max(0, Math.min(1, volume))
  }, [volume])

  const ensureGraph = useCallback(async (): Promise<AudioGraph | null> => {
    const audio = audioRef.current
    if (!audio) return null
    if (!graphRef.current) {
      const AudioContextClass = window.AudioContext
      const context = new AudioContextClass()
      const destination = context.createMediaStreamDestination()
      const gain = context.createGain()
      gain.gain.value = Math.max(0, Math.min(1, volume))
      const source = context.createMediaElementSource(audio)
      source.connect(gain)
      gain.connect(context.destination)
      gain.connect(destination)
      audio.volume = 1
      graphRef.current = { context, destination, gain }
    }
    if (graphRef.current.context.state === 'suspended') await graphRef.current.context.resume()
    return graphRef.current
  }, [volume])

  const playAt = useCallback(async (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    await ensureGraph()
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Math.max(0, time) % audio.duration
    else audio.currentTime = 0
    await audio.play().catch(() => undefined)
  }, [ensureGraph])

  const pause = useCallback(() => audioRef.current?.pause(), [])
  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    audio.currentTime = Math.max(0, time) % audio.duration
  }, [])
  const recordingStream = useCallback(async () => (await ensureGraph())?.destination.stream ?? null, [ensureGraph])

  useEffect(() => () => {
    audioRef.current?.pause()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    void graphRef.current?.context.close()
  }, [])

  return { ready, playAt, pause, seek, recordingStream }
}
