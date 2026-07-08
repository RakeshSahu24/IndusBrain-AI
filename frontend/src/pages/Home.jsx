import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  FileSearch,
  MessageSquareText,
  Activity,
} from 'lucide-react'
import api from '../api/client'

const features = [
  {
    icon: FileSearch,
    title: 'Smart Document Search',
    description: 'AI-powered semantic search across all your documents. Find what you need instantly.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquareText,
    title: 'Intelligent Q&A',
    description: 'Ask questions about your documents and get accurate answers with source citations.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your documents are encrypted and private. Role-based access control keeps data safe.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Powered by ChromaDB vector search and Gemini AI for blazing fast responses.',
    color: 'from-amber-500 to-orange-500',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export default function Home() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.get('/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <div className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-900 via-brand-950 to-surface-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-white/80 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span>AI-Powered Document Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Unlock Insights from
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">
                Your Documents
              </span>
            </h1>

            <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Upload your PDFs, DOCX, spreadsheets, and images. Our AI analyzes, indexes, and lets you
              ask questions — getting answers with citations in seconds.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-surface-900 font-semibold text-sm hover:bg-white/90 transition-all duration-200 shadow-xl shadow-black/10"
              >
                Get Started Free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Status indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
            >
              <div className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-white/50">
                API Status: {status === 'ok' ? 'Operational' : status || 'Checking...'}
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="relative h-16 bg-surface-50" style={{ clipPath: 'ellipse(150% 100% at 50% 100%)' }} />
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-surface-900 mb-4">
            Everything you need to manage documents
          </h2>
          <p className="text-surface-400 max-w-2xl mx-auto">
            From upload to insight — a seamless pipeline powered by cutting-edge AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative p-6 rounded-2xl bg-white border border-surface-200/60 hover:shadow-lg hover:border-surface-300/60 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-surface-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Brain className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Upload your first document and start asking questions in minutes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-white/90 transition-all duration-200 shadow-xl"
            >
              Create Free Account
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
