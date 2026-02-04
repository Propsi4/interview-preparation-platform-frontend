import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { getEvaluationResults, listSessions } from '../api/client'
import type { EvaluationScore } from '../api/types'
import { formatDateTime } from '../utils/format'



const EvaluationsPage = () => {
  const [evaluationGroups, setEvaluationGroups] = useState<
    {
      chat_session_id: string
      search_query_id: number
      search_query_text: string
      sessionTitle: string
      created_at: string
      items: EvaluationScore[]
    }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await listSessions()
        const evaluatedSessions = sessions.filter((s) => s.evaluated)

        const groups = await Promise.all(
          evaluatedSessions.map(async (session) => {
            try {
              const scores = await getEvaluationResults(session.session_id)
              if (scores.length === 0) return null
              
              const firstScore = scores[0]
              
              return {
                chat_session_id: session.session_id,
                search_query_id: firstScore.search_query_id,
                search_query_text: firstScore.search_query_text,
                sessionTitle: session.title || 'Untitled Session',
                created_at: session.created_at, // Use session creation time or latest score time
                items: scores
              }
            } catch {
              return null
            }
          })
        )

        const validGroups = groups.filter((g): g is NonNullable<typeof g> => g !== null)

        setEvaluationGroups(
          validGroups.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        )
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
      ) : evaluationGroups.length > 0 ? (
        <div className="space-y-8">
          {evaluationGroups.map((group) => {
            const isExpanded = expandedGroupId === group.chat_session_id

            return (
              <div
                key={group.chat_session_id}
                className={`rounded-3xl bg-panel overflow-hidden transition-all duration-300 shadow-soft ${
                  isExpanded ? 'ring-2 ring-accent/20' : ''
                }`}
              >
                <div
                  onClick={() =>
                    setExpandedGroupId(isExpanded ? null : group.chat_session_id)
                  }
                  className="p-6 cursor-pointer hover:bg-surface/5 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">
                        {group.sessionTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-ink/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(group.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface/50 border border-surface">
                          {group.search_query_text
                            ? `Query: ${group.search_query_text}`
                            : `Query #${group.search_query_id}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface/50 border border-surface">
                            {group.items.length} vacancies evaluated
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-ink/40">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-surface/50 space-y-6 animate-in slide-in-from-top-2 duration-200">
                   {group.items.map((scoreItem) => {
                       const scorePercent = Math.round(scoreItem.score * 100)
                       return (
                           <div key={scoreItem.id} className="bg-surface/10 rounded-2xl p-6 relative group border border-transparent hover:border-surface/20 transition-colors">
                               <div className="flex flex-col md:flex-row gap-6 mb-4">
                                   <div className="flex-shrink-0">
                                     <div className={`
                                       h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-xl
                                       ${scorePercent >= 70 ? 'bg-green-500/20 text-green-400' : 
                                         scorePercent >= 40 ? 'bg-yellow-500/20 text-yellow-500' : 
                                         'bg-red-500/20 text-red-400'}
                                     `}>
                                       {scorePercent}%
                                     </div>
                                   </div>
                                   <div className="flex-grow space-y-1">
                                       <h4 className="font-semibold text-ink text-lg">{scoreItem.vacancy_title}</h4>
                                       <div className="text-sm text-ink/60 flex items-center gap-2">
                                           {scoreItem.vacancy_company && (
                                               <span className="font-medium text-ink/80">{scoreItem.vacancy_company}</span>
                                           )}
                                           {scoreItem.vacancy_company && scoreItem.vacancy_location && <span>•</span>}
                                           {scoreItem.vacancy_location && (
                                                <span>{scoreItem.vacancy_location}</span>
                                           )}
                                       </div>
                                   </div>
                               </div>

                               <div className="grid md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                   <h5 className="text-xs font-semibold text-ink/50 uppercase tracking-wider flex items-center gap-2">
                                     <TrendingUp className="h-3 w-3 text-green-400" />
                                     Strong Sides
                                   </h5>
                                   <p className="text-sm text-ink/80 bg-surface/30 p-3 rounded-xl leading-relaxed">
                                     {scoreItem.strong_sides || 'No specific feedback.'}
                                   </p>
                                 </div>
                                 <div className="space-y-2">
                                   <h5 className="text-xs font-semibold text-ink/50 uppercase tracking-wider flex items-center gap-2">
                                     <AlertTriangle className="h-3 w-3 text-orange-400" />
                                     Weak Sides
                                   </h5>
                                    <p className="text-sm text-ink/80 bg-surface/30 p-3 rounded-xl leading-relaxed">
                                      {scoreItem.weak_sides || 'No specific feedback.'}
                                    </p>
                                 </div>
                               </div>

                               {scoreItem.vacancy_url && (
                                   <a 
                                     href={scoreItem.vacancy_url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent hover:ring-accent/10 focus:outline-none focus:ring-accent"
                                     aria-label={`View vacancy: ${scoreItem.vacancy_title}`}
                                   />
                               )}
                           </div>
                       )
                   })}
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
