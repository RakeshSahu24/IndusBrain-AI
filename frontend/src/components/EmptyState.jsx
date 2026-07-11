import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400 dark:text-surface-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">{title}</h3>
      <p className="text-sm text-surface-400 dark:text-surface-500 max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  )
}
