import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('VoyaFrame render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-dvh place-items-center bg-[#061018] p-6 text-white">
          <section className="max-w-md rounded-3xl border border-white/10 bg-white/[.05] p-8 text-center">
            <h1 className="text-xl font-bold">页面暂时无法显示</h1>
            <p className="mt-3 text-sm text-slate-400">请刷新页面重试。你的行程仍保存在当前浏览器中。</p>
            <button type="button" onClick={() => window.location.reload()} className="primary-button mt-6">刷新页面</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
