import { motion } from 'framer-motion'

const gradientMap = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  cyan: 'from-cyan-500 to-cyan-600',
}

const shadowMap = {
  blue: 'shadow-blue-500/10',
  emerald: 'shadow-emerald-500/10',
  violet: 'shadow-violet-500/10',
  amber: 'shadow-amber-500/10',
  rose: 'shadow-rose-500/10',
  cyan: 'shadow-cyan-500/10',
}

export default function StatCard({ label, value, icon: Icon, color = 'blue', index = 0, suffix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl bg-white border border-surface-200/60 p-5 hover:shadow-lg transition-all duration-300"
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientMap[color]}`} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-surface-400">{label}</p>
          <p className="text-2xl font-bold text-surface-900 tracking-tight">
            {value}
            {suffix && <span className="text-sm font-medium text-surface-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientMap[color]} flex items-center justify-center shadow-lg ${shadowMap[color]}`}>
          {Icon && <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />}
        </div>
      </div>
    </motion.div>
  )
}
