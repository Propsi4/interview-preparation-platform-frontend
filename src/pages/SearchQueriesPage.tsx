import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Loader2,
  Database,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  createSearchQuery,
  getScrapeProgress,
  listSearchQueries,
  deleteSearchQuery,
} from '../api/client'
import type { ProgressResponse, SearchQuery } from '../api/types'
import { formatDateTime } from '../utils/format'

const SearchQueriesPage = () => {
  const [queries, setQueries] = useState<SearchQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newQuery, setNewQuery] = useState('')
  const [progressData, setProgressData] = useState<Record<number, ProgressResponse>>({})

  const loadQueries = async () => {
    try {
      const data = await listSearchQueries()
      setQueries(
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      )
    } catch (error) {
      console.error('Failed to load queries', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadQueries()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuery.trim()) return

    setIsCreating(true)
    try {
      await createSearchQuery(newQuery.trim())
      setNewQuery('')
      await loadQueries()
    } catch (error) {
      console.error('Failed to create query', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRefreshProgress = async (id: number) => {
    try {
      const data = await getScrapeProgress(id)
      setProgressData((prev) => ({ ...prev, [id]: data }))
    } catch (error) {
      console.error(`Failed to refresh progress for ${id}`, error)
    }
  }

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this search query and all associated data?',
      )
    ) {
      return
    }

    try {
      await deleteSearchQuery(id)
      await loadQueries()
    } catch (error) {
      console.error('Failed to delete query', error)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Search Queries</h1>
          <p className="text-ink/60">
            Manage vacancy scraping sources for your interviews.
          </p>
        </div>
        
        <form onSubmit={handleCreate} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="New search query..."
              className="h-10 w-64 rounded-xl border border-white/5 bg-panel pl-9 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !newQuery.trim()}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-surface hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Query
          </button>
        </form>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-panel animate-pulse" />
          ))
        ) : queries.length > 0 ? (
          queries.map((query) => {
            const progress = progressData[query.id]
            const ratio = progress ? Math.round(progress.progress * 100) : null

            return (
              <div
                key={query.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-panel border border-white/5 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/50 text-accent">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-surface/50 px-2 py-1 text-[10px] font-mono font-medium text-ink/50">
                        ID: {query.id}
                      </span>
                      <button
                        onClick={() => handleDelete(query.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/50 text-ink/40 hover:bg-red-500/10 hover:text-red-500 transition"
                        title="Delete query"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink line-clamp-2">
                      {query.query}
                    </h3>
                    <p className="text-xs text-ink/50 mt-1">
                      Created {formatDateTime(query.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink/60">
                      {query.total_results
                        ? `${query.total_results} vacancies`
                        : 'No data yet'}
                    </span>
                    {ratio !== null && (
                      <span className="font-medium text-accent">{ratio}% done</span>
                    )}
                  </div>
                  
                  {ratio !== null ? (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRefreshProgress(query.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-surface py-2 text-xs font-medium text-ink/60 hover:bg-surface hover:text-ink transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Check Progress
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center rounded-3xl bg-panel border-2 border-dashed border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink/40 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-ink">No queries yet</h3>
            <p className="text-ink/50 max-w-md mt-1">
              Create a search query to start scraping vacancies for your interview context.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchQueriesPage
