import { useCallback, useEffect, useState } from 'react'
import { deleteSession, getSessionPrice, listSessions, renameSession } from '../api/client'
import type { ChatSessionOverview } from '../api/types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatDateTime } from '../utils/format'
import { v4 as uuidv4 } from 'uuid';

const SessionsPage = () => {
  const [sessions, setSessions] = useState<ChatSessionOverview[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useLocalStorage(
    'ipp_session_id',
    uuidv4(),
  )

  const loadSessions = useCallback(async () => {
    try {
      const data = await listSessions()
      setSessions(data)
    } catch {
      setStatusMessage('Failed to load sessions.')
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const handleRename = async (sessionId: string, newTitle: string) => {
    try {
      await renameSession(sessionId, newTitle)
      await loadSessions()
      setStatusMessage('Session renamed.')
    } catch {
      setStatusMessage('Failed to rename session.')
    }
  }

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      await loadSessions()
      if (currentSessionId === sessionId) {
        setCurrentSessionId(crypto.randomUUID())
      }
      setStatusMessage('Session deleted.')
    } catch {
      setStatusMessage('Failed to delete session.')
    }
  }

  const handleLoadPrice = async (sessionId: string) => {
    try {
      const price = await getSessionPrice(sessionId)
      setPrices((prev) => ({ ...prev, [sessionId]: price }))
    } catch {
      setStatusMessage('Failed to load session price.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {statusMessage && (
        <div className="rounded-xl border border-panel bg-panel px-4 py-3 text-sm text-ink/80">
          {statusMessage}
        </div>
      )}
      <div className="rounded-2xl bg-panel p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Sessions</h2>
            <p className="text-sm text-ink/60">
              Track all interview sessions and manage titles.
            </p>
          </div>
          <button
            onClick={loadSessions}
            className="rounded-xl border border-surface px-3 py-2 text-xs font-semibold text-ink/70"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-surface">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface/80 text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.session_id} className="border-t border-surface">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink">
                        {session.title || 'Untitled'}
                      </span>
                      <span className="text-xs text-ink/60">
                        {session.session_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{session.total_messages}</td>
                  <td className="px-4 py-3">
                    {session.interview_finished ? 'Finished' : 'In progress'}
                  </td>
                  <td className="px-4 py-3">
                    {prices[session.session_id] !== undefined ? (
                      <span>${prices[session.session_id].toFixed(4)}</span>
                    ) : (
                      <button
                        onClick={() => handleLoadPrice(session.session_id)}
                        className="rounded-lg border border-surface px-3 py-1 text-xs font-semibold text-ink/70"
                      >
                        Load price
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(session.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCurrentSessionId(session.session_id)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          currentSessionId === session.session_id
                            ? 'bg-accent text-surface'
                            : 'border border-surface text-ink/70'
                        }`}
                      >
                        {currentSessionId === session.session_id
                          ? 'Active'
                          : 'Use'}
                      </button>
                      <button
                        onClick={() => {
                          const promptValue = prompt(
                            'Enter new session title',
                            session.title || '',
                          )
                          const nextTitle =
                            promptValue !== null
                              ? promptValue
                              : session.title || 'Untitled'
                          void handleRename(session.session_id, nextTitle)
                        }}
                        className="rounded-lg border border-surface px-3 py-1 text-xs font-semibold text-ink/70"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(session.session_id)}
                        className="rounded-lg border border-accent px-3 py-1 text-xs font-semibold text-accent"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-ink/60"
                  >
                    No sessions found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SessionsPage
