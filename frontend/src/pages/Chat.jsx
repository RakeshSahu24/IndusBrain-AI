import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Loader2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  History,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquareText,
  Trash2,
} from 'lucide-react'
import { askQuestion, getChatHistory } from '../api/client'
import api from '../api/client'

const chatSuggestions = [
  'Summarize my documents',
  'What topics are covered in my files?',
  'List all the key findings',
]

const rcaSuggestions = [
  'Pump P-102 experienced seal leakage during normal operation at 18 bar pressure',
  'Abnormal vibration detected in Compressor C-201 with temperature rising above 120°C',
  'Valve V-301 failed to close during emergency shutdown procedure',
]

function RCAResultCard({ result }) {
  const [expanded, setExpanded] = useState({
    causes: true, similar: true, recommendations: true, preventive: true,
  })

  function toggle(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const confidenceColor =
    result.confidence_score >= 0.8 ? 'bg-emerald-500 dark:bg-emerald-400' :
    result.confidence_score >= 0.5 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'

  return (
    <div className="space-y-3">
      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Confidence
          </span>
          <span className="text-xs font-bold">{Math.round(result.confidence_score * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700/50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${confidenceColor}`} style={{ width: `${result.confidence_score * 100}%` }} />
        </div>
      </div>

      {/* Possible Causes */}
      <Section title="Possible Causes" icon={AlertTriangle} color="rose" expanded={expanded.causes} onToggle={() => toggle('causes')}>
        {result.possible_causes.map((c, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100/50 dark:border-rose-800/40">
            <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-surface-700 dark:text-surface-200 leading-relaxed">{c}</p>
          </div>
        ))}
      </Section>

      {/* Similar Historical Incidents */}
      <Section title="Similar Historical Incidents" icon={History} color="blue" expanded={expanded.similar} onToggle={() => toggle('similar')}>
        {result.similar_historical_incidents.length === 0 ? (
          <p className="text-xs text-surface-400 dark:text-surface-500 italic px-1">No similar incidents found.</p>
        ) : (
          result.similar_historical_incidents.map((inc, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-800/40 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-surface-900 dark:text-surface-100">{inc.description}</p>
                {inc.source && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 flex-shrink-0">{inc.source}</span>}
              </div>
              {inc.relevance && <p className="text-[10px] text-surface-500 dark:text-surface-400"><span className="font-medium text-surface-600 dark:text-surface-300">Relevance:</span> {inc.relevance}</p>}
            </div>
          ))
        )}
      </Section>

      {/* Recommendations */}
      <Section title="Recommendations" icon={Lightbulb} color="amber" expanded={expanded.recommendations} onToggle={() => toggle('recommendations')}>
        {result.recommendations.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-800/40">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-surface-700 dark:text-surface-200 leading-relaxed">{r}</p>
          </div>
        ))}
      </Section>

      {/* Preventive Actions */}
      <Section title="Preventive Actions" icon={ShieldCheck} color="emerald" expanded={expanded.preventive} onToggle={() => toggle('preventive')}>
        {result.preventive_actions.map((a, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-800/40">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-xs text-surface-700 dark:text-surface-200 leading-relaxed">{a}</p>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Section({ title, icon: Icon, color, expanded, onToggle, children }) {
  const colorMap = {
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-800/40' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/40' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/40' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/40' },
  }
  const c = colorMap[color]

  return (
    <div className={`border ${c.border} rounded-xl overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${c.text}`} />
          </div>
          <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">{title}</span>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" /> : <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-2.5 pb-2.5 space-y-1.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rcaMode, setRcaMode] = useState(false)
  const bottomRef = useRef(null)

  const suggestions = rcaMode ? rcaSuggestions : chatSuggestions
  const filteredMessages = messages.filter(m => rcaMode ? m.isRCA : !m.isRCA)

  useEffect(() => {
    getChatHistory().then((history) => {
      const msgs = history.map((m) =>
        m.role === 'assistant'
          ? { role: 'assistant', answer: m.content, sources: [] }
          : { role: 'user', content: m.content }
      )
      setMessages(msgs)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filteredMessages])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input.trim(), isRCA: rcaMode }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    if (rcaMode) {
      try {
        const { data } = await api.post('/rca', { incident_description: userMsg.content })
        setMessages((prev) => [...prev, { role: 'assistant', isRCA: true, result: data.result }])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', isRCA: true, result: null, error: 'Analysis failed. Please try again.' },
        ])
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const data = await askQuestion(userMsg.content)
        setMessages((prev) => [...prev, { role: 'assistant', ...data }])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', answer: 'Sorry, something went wrong. Please try again.', sources: [] },
        ])
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleClearChat() {
    if (!confirm('Clear all chat messages? This cannot be undone.')) return
    try {
      await api.delete('/chat/history')
      setMessages([])
    } catch { /* ignore */ }
  }

  function handleSuggestion(s) {
    setInput(s)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 p-1 bg-surface-100 dark:bg-surface-700/50 rounded-xl">
          <button
            onClick={() => setRcaMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !rcaMode ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 inline mr-1.5" />
            Chat
          </button>
          <button
            onClick={() => setRcaMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              rcaMode ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 inline mr-1.5" />
            RCA
          </button>
        </div>
        <div className="flex items-center gap-2">
          {rcaMode && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3" />
              Root Cause Analysis mode
            </div>
          )}
          {filteredMessages.length > 0 && !rcaMode && (
            <button
              onClick={handleClearChat}
              className="btn-ghost p-2 text-surface-400 dark:text-surface-500 hover:text-red-500 dark:hover:text-red-400"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scroll-smooth">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20"
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-1"
            >
              {rcaMode ? 'Analyze an incident' : 'Ask anything about your documents'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-surface-400 dark:text-surface-500 mb-8"
            >
              {rcaMode
                ? 'Describe an equipment failure or incident for AI-powered root cause analysis.'
                : 'Search across all your uploaded documents using AI.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 max-w-md"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  {s.length > 40 ? s.slice(0, 40) + '...' : s}
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {filteredMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-start gap-3 justify-end">
                    <div className={`${msg.isRCA ? 'bg-rose-600 dark:bg-rose-700' : 'bg-brand-600 dark:bg-brand-700'} text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] shadow-sm`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                  </div>
                ) : msg.isRCA ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {msg.error ? (
                        <div className="bg-white dark:bg-surface-800 border border-red-200 dark:border-red-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <p className="text-sm text-red-600 dark:text-red-400">{msg.error}</p>
                        </div>
                      ) : msg.result ? (
                        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-bl-sm px-3 py-3 shadow-sm">
                          <RCAResultCard result={msg.result} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="prose prose-sm max-w-none text-surface-800 dark:text-surface-200 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline">{children}</a>
                              ),
                              code: ({ children }) => (
                                <code className="bg-surface-100 dark:bg-surface-700/50 text-pink-600 dark:text-pink-400 text-xs px-1 py-0.5 rounded">{children}</code>
                              ),
                              ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-1">{children}</ol>,
                            }}
                          >
                            {msg.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {msg.sources?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.sources.map((s, j) => (
                            <span
                              key={j}
                              className="inline-flex items-center gap-1 text-xs bg-surface-50 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 rounded-full px-2.5 py-1 border border-surface-200 dark:border-surface-700"
                            >
                              <BookOpen className="w-3 h-3 text-surface-400 dark:text-surface-500" />
                              {s.source}{s.pages ? ` (p. ${s.pages})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rcaMode ? 'from-rose-500 to-rose-600' : 'from-brand-500 to-violet-500'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {rcaMode ? <Search className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-surface-300 dark:bg-surface-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-surface-300 dark:bg-surface-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-surface-300 dark:bg-surface-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-surface-100 dark:border-surface-700/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={rcaMode ? 'Describe the incident for root cause analysis...' : 'Ask a question about your documents...'}
              disabled={loading}
              className="input-field pr-12"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`btn-primary px-5 ${rcaMode ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800' : ''}`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 text-center">
          {rcaMode
            ? 'RCA uses your uploaded documents as context for analysis.'
            : 'AI responses are generated based on your uploaded documents.'}
        </p>
      </div>
    </div>
  )
}
