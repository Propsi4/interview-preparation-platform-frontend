import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { getEvaluationResults, listSessions } from '../api/client'
import type { EvaluationScore, ChatSessionOverview } from '../api/types'
import { formatDateTime } from '../utils/format'

type EvaluationWithMeta = EvaluationScore & {
  sessionTitle: string
}

const EvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState<EvaluationWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await listSessions()
        const evaluatedSessions = sessions.filter((s) => s.evaluated)
        
        const results = await Promise.all(
          evaluatedSessions.map(async (session) => {
            try {
              const scores = await getEvaluationResults(session.session_id)
              return scores.map((score) => ({
                ...score,
                sessionTitle: session.title || 'Untitled Session',
              }))
            } catch {
              return []
            }
          })
        )
        
        setEvaluations(results.flat().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } catch (error) {
        console.error('Failed to load evaluations', error)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-bold text-ink">Interview Evaluations</h1>
        <p className="text-ink/60">
          Review your performance scores and feedback.
        </p>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-panel animate-pulse" />
          ))}
        </div>
      ) : evaluations.length > 0 ? (
        <div className="space-y-4">
          {evaluations.map((evalItem) => {
            const isExpanded = expandedId === evalItem.id
            const scorePercent = Math.round(evalItem.score * 100)
            
            return (
              <div
                key={evalItem.id}
                className={`rounded-3xl bg-panel overflow-hidden transition-all duration-300 shadow-soft ${
                  isExpanded ? 'ring-2 ring-accent/20' : ''
                }`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : evalItem.id)}
                  className="p-6 cursor-pointer hover:bg-surface/5 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg
                      ${scorePercent >= 70 ? 'bg-green-500/20 text-green-400' : 
                        scorePercent >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'}
                    `}>
                      {scorePercent}%
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">{evalItem.sessionTitle}</h3>
                      <div className="flex items-center gap-3 text-xs text-ink/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(evalItem.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface/50 border border-surface">
                          Query #{evalItem.search_query_id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-ink/40">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-surface/50 grid md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        Strong Points
                      </h4>
                      <p className="text-sm text-ink/80 leading-relaxed bg-surface/30 p-4 rounded-2xl">
                        {evalItem.strong_sides || 'No specific feedback provided.'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        Areas for Improvement
                      </h4>
                      <p className="text-sm text-ink/80 leading-relaxed bg-surface/30 p-4 rounded-2xl">
                        {evalItem.weak_sides || 'No specific feedback provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-panel rounded-3xl border-2 border-dashed border-surface">
          <div className="h-16 w-16 rounded-full bg-surface/50 flex items-center justify-center mb-4 text-ink/30">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-ink">No evaluations yet</h3>
          <p className="text-ink/50 max-w-sm mt-2">
            Complete an interview session and request an evaluation to see your results here.
          </p>
        </div>
      )}
    </div>
  )
}

export default EvaluationsPage
