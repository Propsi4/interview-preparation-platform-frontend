import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send,
  Mic,
  Square,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  Settings as SettingsIcon,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  Play,
  Pause,
  Globe,
} from 'lucide-react'
import {
  getSessionDetails,
  listSearchQueries,
  streamChat,
  streamSpeech,
  evaluateInterview,
} from '../api/client'
import type { ChatMessage, SearchQuery } from '../api/types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { v4 } from 'uuid'
import { Dropdown } from '../components/Dropdown'

const VoiceMessage = ({ src, autoPlay }: { src: string; autoPlay?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Auto-play failed', e))
    }
  }, [autoPlay])

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  return (
    <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 rounded-xl p-2 pr-4 min-w-[140px] border border-white/5">
      <button 
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-surface hover:brightness-110 transition shrink-0"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current pl-0.5" />}
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium opacity-80">Voice Message</span>
        <span className="text-[10px] opacity-50">Click to play</span>
      </div>
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => setIsPlaying(false)} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        className="hidden" 
      />
    </div>
  )
}

const ChatPage = () => {
  const { sessionId: routeSessionId } = useParams()
  const navigate = useNavigate()
  
  // State
  const [sessionId, setSessionId] = useLocalStorage('ipp_active_session', '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([])
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null)
  const [interviewFinished, setInterviewFinished] = useState(false)
  
  // UI State
  const [input, setInput] = useState('')
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isStreaming, setStreaming] = useState(false)
  const [isRecording, setRecording] = useState(false)
  const [loading, setLoading] = useState(true)
  const [languageCode, setLanguageCode] = useState('en')
  
  // Streaming Data
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingReasoning, setStreamingReasoning] = useState('')
  const [autoPlayResponse, setAutoPlayResponse] = useState(true)
  
  // Audio Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<string[]>([])

  useEffect(() => {
    if (routeSessionId) {
      setSessionId(routeSessionId)
    } else {
      if (sessionId) {
        navigate(`/chat/${sessionId}`, { replace: true })
      } else {
        const newId = v4()
        setSessionId(newId)
        navigate(`/chat/${newId}`, { replace: true })
      }
    }
  }, [routeSessionId, sessionId, navigate, setSessionId])

  useEffect(() => {
    const initData = async () => {
      if (!sessionId) return
      
      setMessages([])
      setSelectedQueryId(null)
      setInput('')
      setStreaming(false)
      setRecording(false)
      setStreamingContent('')
      setStreamingReasoning('')
      setLoading(true)

      try {
        const [queriesData, sessionData] = await Promise.all([
          listSearchQueries(),
          getSessionDetails(sessionId).catch(() => null),
        ])
        
        setSearchQueries(queriesData || [])
        
        if (sessionData) {
          setMessages(sessionData.messages || [])
          setInterviewFinished(sessionData.interview_finished || false)
          if (sessionData.search_query_id) {
            setSelectedQueryId(sessionData.search_query_id)
          }
        }
      } catch (error) {
        console.error('Failed to init chat', error)
      } finally {
        setLoading(false)
      }
    }
    void initData()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, streamingReasoning])

  // Actions
  const handleSend = async () => {
    if (!input.trim() || !selectedQueryId || isStreaming) return
    
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)
    setStreamingContent('')
    setStreamingReasoning('')

    try {
      await streamChat(
        sessionId,
        selectedQueryId,
        userMsg,
        (event) => {
          if (event.type === 'reasoning') {
            setStreamingReasoning(prev => prev + (event.data.token as string))
          } else if (event.type === 'answer') {
            setStreamingContent(prev => prev + (event.data.token as string))
          } else if (event.type === 'complete') {
            setMessages(prev => [...prev, { role: 'assistant', content: event.data.response as string }])
            setInterviewFinished(event.data.interview_finished as boolean || false)
            setStreamingContent('')
            setStreamingReasoning('')
            setStreaming(false)
          }
        }
      )
    } catch (error) {
      console.error('Chat error', error)
      setStreaming(false)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(blob)
        stream.getTracks().forEach(t => t.stop())
        if (selectedQueryId) {
          await handleVoiceUpload(blob, audioUrl, languageCode)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Mic error', error)
      alert('Could not access microphone. If you are not on localhost, you need HTTPS to use the microphone.')
    }
  }

  const handleVoiceUpload = async (blob: Blob, userAudioUrl: string, langCode: string) => {
    setStreaming(true)
    let transcript = ''
    let answer = ''
    audioChunksRef.current = []

    try {
      await streamSpeech(
        sessionId,
        selectedQueryId!,
        blob,
        true,
        (event) => {
          if (event.type === 'transcript') {
            const data = event.data as Record<string, unknown>
            if (data.text) {
              transcript = data.text as string
              setMessages(prev => [...prev, { 
                role: 'user', 
                content: transcript,
                audioUrl: userAudioUrl 
              }])
            }
          } else if (event.type === 'answer') {
            const data = event.data as Record<string, unknown>
            setStreamingContent(prev => prev + (data.token as string))
            answer += (data.token as string)
          } else if (event.type === 'audio_chunk') {
            const data = event.data as Record<string, unknown>
            if (data.chunk) {
              audioChunksRef.current.push(data.chunk as string)
            }
          } else if (event.type === 'complete') {
            // Commit text immediately so user sees response
            const data = event.data as Record<string, unknown>
            setInterviewFinished(data.interview_finished as boolean)
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: answer 
            }])

            setStreamingContent('')
          }
        },
        langCode
      )
      
      // Post-stream: Handle Audio Finalization
      if (audioChunksRef.current.length > 0) {
        // Convert base64 chunks to blob
        const byteCharacters = audioChunksRef.current.map(chunk => atob(chunk)).join('')
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' }) 
        const assistantAudioUrl = URL.createObjectURL(audioBlob)
        
        // Update the last message (assistant's) with the audio URL
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              audioUrl: assistantAudioUrl
            }
          }
          return newMessages
        })
      }

    } catch (error) {
      console.error('Speech error', error)
      alert('Error during speech processing')
    } finally {
      setStreaming(false)
      audioChunksRef.current = []
    }
  }

  const handleEvaluate = async () => {
    if (!selectedQueryId) return
    try {
      await evaluateInterview(sessionId, selectedQueryId)
      navigate('/evaluations')
    } catch (error) {
      console.error('Eval error', error)
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col rounded-3xl bg-panel border border-white/5 shadow-soft overflow-hidden relative">
        {/* Chat Area Header / Status */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-panel/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${interviewFinished ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Interview {interviewFinished ? 'Finished' : 'In Progress'}
            </span>
          </div>
          {interviewFinished && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase tracking-tight">
              <CheckCircle2 className="h-3 w-3" />
              Ready for Evaluation
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (messages?.length || 0) === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 rounded-full bg-surface/50 flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-ink/20" />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2">Start Interview</h2>
              <p className="text-ink/50 max-w-md">
                Select a search query from the sidebar to give the AI context, then type or speak to begin.
              </p>
            </div>
          ) : (
            <>
              {messages?.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-accent text-surface border-accent/20 font-medium rounded-tr-none'
                        : 'bg-surface text-ink border-white/5 rounded-tl-none'
                    }`}
                  >
                    {msg.audioUrl && (
                      <div className="mb-3">
                         <VoiceMessage 
                           src={msg.audioUrl} 
                           autoPlay={msg.role === 'assistant' && autoPlayResponse && i === messages.length - 1} 
                         />
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {(streamingContent || streamingReasoning) && (
                <div className="flex flex-col gap-2 max-w-[80%]">
                  {streamingReasoning && (
                    <div className="text-xs text-ink/40 font-mono bg-surface/30 p-3 rounded-xl border-l-2 border-accent/50 animate-pulse">
                      {streamingReasoning}
                    </div>
                  )}
                  {streamingContent && (
                    <div className="bg-surface text-ink rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed">
                      {streamingContent}
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-accent animate-pulse" />
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

          {/* Input Area */}
        <div className="p-4 bg-panel border-t border-white/5">
          <div className="relative flex items-center gap-2 rounded-2xl bg-surface border border-white/5 p-2">
            
            {/* Language Selector */}
            <Dropdown
              leftIcon={<Globe className="h-4 w-4 text-ink/40 shrink-0" />}
              options={[
                { value: 'zh', label: 'Chinese' },
                { value: 'nl', label: 'Dutch' },
                { value: 'en', label: 'English' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'hi', label: 'Hindi' },
                { value: 'id', label: 'Indonesian' },
                { value: 'it', label: 'Italian' },
                { value: 'ja', label: 'Japanese' },
                { value: 'ko', label: 'Korean' },
                { value: 'pl', label: 'Polish' },
                { value: 'pt', label: 'Portuguese' },
                { value: 'ru', label: 'Russian' },
                { value: 'es', label: 'Spanish' },
                { value: 'uk', label: 'Ukrainian' },
                { value: 'vi', label: 'Vietnamese' },
              ]}
              value={languageCode}
              onChange={(val) => setLanguageCode(val)}
              className="w-40"
              id="language-select"
            />

            <button
              onClick={toggleRecording}
              disabled={!selectedQueryId || isStreaming}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-panel text-ink/60 hover:text-accent'
              }`}
            >
              {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            </button>
            
            <textarea
              id="chat-input"
              name="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={selectedQueryId ? "Type your answer..." : "Select a context first →"}
              className="flex-1 max-h-32 min-h-[2.5rem] bg-transparent py-2.5 px-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none resize-none scrollbar-hide"
              disabled={!selectedQueryId || isStreaming}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || !selectedQueryId || isStreaming}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-surface hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Sidebar */}
      <div 
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="h-full flex flex-col gap-4">
          {/* Query Selection */}
          <div className="rounded-3xl bg-panel border border-white/5 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Context
            </h3>
            <div className="space-y-2">
              <Dropdown
                label="Active Search Query"
                id="context-select"
                disabled={(messages?.length || 0) >= 2}
                value={selectedQueryId || ''}
                onChange={(val) => setSelectedQueryId(Number(val))}
                options={
                  searchQueries?.map((q) => ({
                    value: q.id,
                    label: q.query,
                  })) || []
                }
                placeholder="Select context..."
              />
            </div>
          </div>

          {/* Session Controls */}
          <div className="rounded-3xl bg-panel border border-white/5 p-5 shadow-soft flex-1">
            <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-accent" />
              Controls
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/chat/${v4()}`)}
                className="w-full flex items-center justify-between rounded-xl bg-surface/50 p-3 text-sm text-ink/80 hover:bg-surface transition"
              >
                <span>New Session</span>
                <RotateCcw className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleEvaluate}
                disabled={!interviewFinished}
                className="w-full flex items-center justify-between rounded-xl bg-accent/10 border border-accent/20 p-3 text-sm text-accent hover:bg-accent hover:text-surface transition disabled:opacity-50"
              >
                <span>Finish & Evaluate</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 pt-4 border-t border-surface/50">
              <h4 className="text-xs font-semibold text-ink/60 mb-3">Audio Feedback</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/80">Auto-play Responses</span>
                <button 
                  onClick={() => setAutoPlayResponse(!autoPlayResponse)}
                  className={`flex items-center w-10 h-6 rounded-full p-1 transition-colors border ${autoPlayResponse ? 'bg-accent border-accent' : 'bg-surface border-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoPlayResponse ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="absolute right-6 top-24 p-2 rounded-full bg-surface text-ink/50 hover:text-accent transition z-10 shadow-lg border border-panel"
        style={{ right: isSidebarOpen ? '21rem' : '1.5rem' }}
      >
        {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default ChatPage
