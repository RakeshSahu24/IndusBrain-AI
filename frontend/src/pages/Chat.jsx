import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askQuestion } from '../api/client'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-lg font-semibold">Ask anything about your documents</p>
            <p className="text-sm mt-1">Search across all your uploaded documents using AI</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
                  <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 text-pink-600 text-xs px-1 py-0.5 rounded">{children}</code>
                        ),
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5 my-1">{children}</ol>,
                      }}
                    >
                      {msg.answer}
                    </ReactMarkdown>
                  </div>
                  {msg.sources?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 rounded-full px-2.5 py-1 border border-gray-200"
                          >
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {s.source}{s.pages ? ` (p. ${s.pages})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  )
}
