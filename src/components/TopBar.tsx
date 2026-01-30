import { useEffect, useState } from 'react'
import { getHealth } from '../api/client'

const TopBar = () => {
  const [health, setHealth] = useState<'ok' | 'error' | 'loading'>('loading')

  useEffect(() => {
    void (async () => {
      try {
        const data = await getHealth()
        setHealth(data.status === 'ok' ? 'ok' : 'error')
      } catch {
        setHealth('error')
      }
    })()
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-panel bg-surface px-6 py-4">
      <div>
        <p className="text-lg font-semibold text-ink">Ask anything</p>
        <p className="text-xs text-ink/60">
          Ground your interview prep with real vacancy data.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            health === 'ok'
              ? 'bg-accent text-surface'
              : health === 'error'
                ? 'bg-panel text-ink/70'
                : 'bg-panel text-ink/60'
          }`}
        >
          {health === 'loading' ? 'Checking API' : `API ${health}`}
        </span>
      </div>
    </header>
  )
}

export default TopBar
