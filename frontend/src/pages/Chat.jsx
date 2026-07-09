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
  MessageSquareText,
} from 'lucide-react'
import { askQuestion, getChatHistory } from '../api/client'

const suggestions = [
  'Summarize my documents',
  'What topics are covered in my files?',
  'List all the key findings',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await askQuestion(userMsg.content)
      setMessages((prev) => [...prev, { role: 'assistant', ...data }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          answer: 'Sorry, something went wrong. Please try again.',
          sources: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(s) {
    setInput(s)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scroll-smooth">
        {messages.length === 0 ? (
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
              className="text-xl font-bold text-surface-900 mb-1"
            >
              Ask anything about your documents
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-surface-400 mb-8"
            >
              Search across all your uploaded documents using AI.
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-surface-200 text-sm text-surface-500 hover:text-surface-700 hover:border-surface-300 hover:bg-surface-50 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  {s}
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-brand-600" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="prose prose-sm max-w-none text-surface-800 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                                  {children}
                                </a>
                              ),
                              code: ({ children }) => (
                                <code className="bg-surface-100 text-pink-600 text-xs px-1 py-0.5 rounded">{children}</code>
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
                              className="inline-flex items-center gap-1 text-xs bg-surface-50 text-surface-500 rounded-full px-2.5 py-1 border border-surface-200"
                            >
                              <BookOpen className="w-3 h-3 text-surface-400" />
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="pt-4 border-t border-surface-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={loading}
              className="input-field pr-12"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-surface-400 mt-2 text-center">
          AI responses are generated based on your uploaded documents.
        </p>
      </div>
    </div>
  )
}
