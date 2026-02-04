export type SearchQuery = {
  id: number
  query: string
  total_results: number | null
  created_at: string
  updated_at: string
}

export type ProgressResponse = {
  search_query_id: number
  progress: number
  total_results: number | null
  processed_results: number
}

export type ChatMessage = {
  id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
  audioUrl?: string
}

export type ChatSessionOverview = {
  session_id: string
  title: string | null
  total_messages: number
  interview_finished: boolean
  updated_at: string
  created_at: string
  search_query_id: number | null
  price: number
  evaluated: boolean
}

export type ChatSessionDetails = {
  session_id: string
  title: string | null
  created_at: string
  updated_at: string
  total_messages: number
  interview_finished: boolean
  evaluated: boolean
  search_query_id: number | null
  price: number
  messages: ChatMessage[]
}

export type EvaluationScore = {
  id: number
  search_query_id: number
  search_query_text: string
  chat_session_id: string
  score: number
  strong_sides: string | null
  weak_sides: string | null
  vacancy_id: number
  vacancy_title: string | null
  vacancy_company: string | null
  vacancy_url: string | null
  vacancy_location: string | null
  created_at: string
  updated_at: string
}

export type StreamEvent = {
  type:
    | 'transcript'
    | 'reasoning'
    | 'answer'
    | 'complete'
    | 'audio_chunk'
    | 'error'
    | 'info'
  data: Record<string, unknown>
}
