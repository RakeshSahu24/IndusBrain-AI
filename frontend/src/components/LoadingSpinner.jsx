import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 20, text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-6 h-6 text-brand-500" />
      </motion.div>
      <p className="text-sm text-surface-400">{text}</p>
    </div>
  )
}

export function LoadingSkeleton({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-surface-200 rounded-lg"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-surface-200 rounded-xl w-64" />
      <div className="h-4 bg-surface-200 rounded-xl w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-surface-200 rounded-2xl" />
    </div>
  )
}
