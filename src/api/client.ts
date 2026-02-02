import axios from 'axios'
import type {
  ChatSessionDetails,
  ChatSessionOverview,
  EvaluationScore,
  ProgressResponse,
  SearchQuery,
  StreamEvent,
} from './types'

type StreamCallback = (event: StreamEvent) => void

const API_BASE_URL =
  import.meta.env.VITE_ML_API_BASE_URL ??
  `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/api/v1`

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const createSearchQuery = async (searchQuery: string): Promise<number> => {
  const { data } = await http.post<{ search_query_id: number }>(
    '/scrapers/scrape',
    {
      search_query: searchQuery,
    },
  )
  return data.search_query_id
}

export const listSearchQueries = async (): Promise<SearchQuery[]> => {
  const { data } = await http.get<SearchQuery[]>('/scrapers/queries')
  return data
}

export const getScrapeProgress = async (
  searchQueryId: number,
): Promise<ProgressResponse> => {
  const { data } = await http.get<ProgressResponse>(
    `/scrapers/progress/${searchQueryId}`,
  )
  return data
}

export const listSessions = async (): Promise<ChatSessionOverview[]> => {
  const { data } = await http.get<ChatSessionOverview[]>(
    '/conversation_history/sessions',
  )
  return data
}

export const getSessionDetails = async (
  sessionId: string,
): Promise<ChatSessionDetails> => {
  const { data } = await http.get<ChatSessionDetails>(
    `/conversation_history/session/${sessionId}`,
  )
  return data
}

export const renameSession = async (
  sessionId: string,
  newTitle: string,
): Promise<void> => {
  await http.patch(`/conversation_history/session/${sessionId}/title`, null, {
    params: { new_title: newTitle },
  })
}

export const deleteSession = async (sessionId: string): Promise<void> => {
  await http.delete(`/conversation_history/session/${sessionId}`)
}

export const evaluateInterview = async (
  sessionId: string,
  searchQueryId: number,
): Promise<void> => {
  await http.post('/evaluation/evaluate', {
    chat_session_id: sessionId,
    search_query_id: searchQueryId,
  })
}

export const getEvaluationResults = async (
  sessionId: string,
): Promise<EvaluationScore[]> => {
  const { data } = await http.get<EvaluationScore[]>(
    `/evaluation/session/${sessionId}/results`,
  )
  return data
}

export const getHealth = async (): Promise<{ status: string; message: string }> => {
  const { data } = await http.get<{ status: string; message: string }>('/health')
  return data
}

export const chatOnce = async (
  sessionId: string,
  searchQueryId: number,
  message: string,
): Promise<{ response: string; interview_finished: boolean }> => {
  const { data } = await http.post<{
    response: string
    interview_finished: boolean
  }>(`/chat/interview/${sessionId}`, {
    search_query_id: searchQueryId,
    query: message,
  })
  return data
}

export const getSessionPrice = async (sessionId: string): Promise<number> => {
  const { data } = await http.get<number>(
    `/conversation_history/session/${sessionId}/price`,
  )
  return data
}

export const transcribeSpeech = async (
  audioBlob: Blob,
  languageCode?: string,
): Promise<string> => {
  const formData = new FormData()
  formData.append('audio_file', audioBlob, 'browser_recording.webm')
  if (languageCode) {
    formData.append('language', languageCode)
  }
  const { data } = await http.post<{ text: string }>(
    '/speech/transcribe',
    formData,
  )
  return data.text
}

export const synthesizeSpeech = async (text: string): Promise<Blob> => {
  const response = await http.post('/speech/tts', { text }, { responseType: 'blob' })
  return response.data as Blob
}

export const streamChat = async (
  sessionId: string,
  searchQueryId: number,
  message: string,
  onEvent: StreamCallback,
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/chat/interview/${sessionId}/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_query_id: searchQueryId,
        query: message,
      }),
    },
  )

  if (!response.ok || !response.body) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to stream response')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) {
        continue
      }
      const payload = trimmed.replace(/^data:\s*/, '')
      if (!payload) {
        continue
      }
      try {
        const event = JSON.parse(payload) as StreamEvent
        onEvent(event)
      } catch {
        continue
      }
    }
  }
}

const toSpeechWsUrl = (baseUrl: string): string => {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '')}/speech/stream`
  return url.toString()
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? ''
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export const streamSpeech = async (
  sessionId: string,
  searchQueryId: number,
  audioBlob: Blob,
  ttsEnabled: boolean,
  onEvent: StreamCallback,
  languageCode?: string,
): Promise<void> => {
  const wsUrl = toSpeechWsUrl(API_BASE_URL)
  const socket = new WebSocket(wsUrl)
  const audioBase64 = await blobToBase64(audioBlob)

  await new Promise<void>((resolve, reject) => {
    socket.onopen = () => resolve()
    socket.onerror = () => reject(new Error('Speech WebSocket error'))
  })

  socket.send(
    JSON.stringify({
      type: 'start',
      session_id: sessionId,
      search_query_id: searchQueryId,
      tts_enabled: ttsEnabled,
      audio_file_name: 'browser_recording.webm',
      language_code: languageCode,
    }),
  )
  socket.send(
    JSON.stringify({
      type: 'audio',
      chunk: audioBase64,
    }),
  )
  socket.send(JSON.stringify({ type: 'end' }))

  await new Promise<void>((resolve, reject) => {
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as StreamEvent
        onEvent(event)
        const infoMessage =
          typeof event.data.message === 'string' ? event.data.message : ''
        if (event.type === 'info' && infoMessage === 'Speech session completed.') {
          resolve()
          socket.close()
        }
        if (event.type === 'error') {
          const errorMessage =
            typeof event.data.error === 'string' ? event.data.error : 'Speech error'
          reject(new Error(errorMessage))
          socket.close()
        }
      } catch {
        return
      }
    }
    socket.onclose = () => resolve()
    socket.onerror = () => reject(new Error('Speech WebSocket closed'))
  })
}
