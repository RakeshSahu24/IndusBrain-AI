import { motion } from 'framer-motion'
import { Brain, Sparkles, Shield, Zap } from 'lucide-react'

const highlights = [
  { icon: Brain, title: 'AI-Powered', description: 'Built on Google Gemini and ChromaDB for intelligent document analysis.' },
  { icon: Zap, title: 'Fast & Scalable', description: 'Lightning-fast vector search across thousands of documents.' },
  { icon: Shield, title: 'Secure by Design', description: 'Role-based access control with encrypted storage.' },
]

export default function About() {
  return (
    <div className="max-w-3xl mx-auto text-center py-12 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/20">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">About IndusBrain AI</h1>
        <p className="text-surface-400 dark:text-surface-500 leading-relaxed max-w-xl mx-auto">
          A full-stack intelligent document platform powered by FastAPI and React.
          Upload, analyze, and ask questions about your documents using cutting-edge AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-1.5">{item.title}</h3>
            <p className="text-xs text-surface-400 dark:text-surface-500 leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card p-8 inline-block mx-auto"
      >
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Built with <span className="text-brand-600 font-medium">React</span>,{' '}
          <span className="text-brand-600 font-medium">FastAPI</span>,{' '}
          <span className="text-brand-600 font-medium">ChromaDB</span>, and{' '}
          <span className="text-brand-600 font-medium">Google Gemini</span>
        </p>
      </motion.div>
    </div>
  )
}
