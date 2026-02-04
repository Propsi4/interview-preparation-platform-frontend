import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  History,
} from 'lucide-react'
import { listSessions, listSearchQueries } from '../api/client'
import type { ChatSessionOverview, SearchQuery } from '../api/types'
import { formatDateTime } from '../utils/format'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [recentSessions, setRecentSessions] = useState<ChatSessionOverview[]>([])
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsData, queriesData] = await Promise.all([
          listSessions(),
          listSearchQueries(),
        ])
        setRecentSessions(
          sessionsData
            .sort(
              (a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
            )
            .slice(0, 3),
        )
        setSearchQueries(queriesData)
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [])

  const handleStartNewInterview = () => {
    const newSessionId = crypto.randomUUID()
    navigate(`/chat/${newSessionId}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-500">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
        <p className="text-ink/60">
          Ready to ace your next interview?
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 rounded-3xl bg-panel border border-white/5 p-6 shadow-soft transition hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Recent Sessions
            </h2>
            <Link
              to="/sessions"
              className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-surface/50 animate-pulse" />
              ))}
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Link
                  key={session.session_id}
                  to={`/chat/${session.session_id}`}
                  className="group flex items-center justify-between rounded-xl border border-surface bg-surface/40 p-4 transition hover:bg-surface hover:border-accent/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-panel text-ink/70 group-hover:bg-accent group-hover:text-surface transition-colors">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {session.title || 'Untitled Session'}
                      </p>
                      <p className="text-xs text-ink/50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(session.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-ink/40" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-ink/50 mb-4">No sessions yet.</p>
              <button
                onClick={handleStartNewInterview}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-surface hover:brightness-110"
              >
                Start your first interview
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-accent to-yellow-600 p-6 shadow-soft text-surface">
            <h2 className="text-xl font-bold mb-2">Quick Start</h2>
            <p className="text-sm opacity-90 mb-6">
              Launch a new interview session immediately.
            </p>
            <button
              onClick={handleStartNewInterview}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface/20 backdrop-blur-sm border border-surface/10 px-4 py-3 font-semibold hover:bg-surface/30 transition"
            >
              <Plus className="h-5 w-5" />
              New Interview
            </button>
          </div>

          <div className="rounded-3xl bg-panel border border-white/5 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-surface/50">
                <span className="text-ink/60 text-sm">Total Sessions</span>
                <span className="text-xl font-mono font-bold text-ink">
                  {recentSessions.length}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-surface/50">
                <span className="text-ink/60 text-sm">Search Queries</span>
                <span className="text-xl font-mono font-bold text-ink">
                  {searchQueries.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
