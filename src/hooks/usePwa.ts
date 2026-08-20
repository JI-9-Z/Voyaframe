import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePwa() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null) }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let cancelled = false
    const register = async () => {
      try {
        const nextRegistration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        if (cancelled) return
        setRegistration(nextRegistration)
        if (nextRegistration.waiting) setUpdateAvailable(true)
        nextRegistration.addEventListener('updatefound', () => {
          const worker = nextRegistration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateAvailable(true)
          })
        })
      } catch (error) {
        console.warn('PWA service worker registration failed:', error)
      }
    }
    void register()
    return () => { cancelled = true }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    return choice.outcome === 'accepted'
  }, [installPrompt])

  const applyUpdate = useCallback(() => {
    const waiting = registration?.waiting
    if (!waiting) { window.location.reload(); return }
    let reloading = false
    const reload = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
    waiting.postMessage({ type: 'SKIP_WAITING' })
    window.setTimeout(reload, 2000)
  }, [registration])

  return { canInstall: Boolean(installPrompt), installed, online, updateAvailable, install, applyUpdate }
}
