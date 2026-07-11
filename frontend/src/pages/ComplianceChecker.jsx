import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  History,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ArrowUpDown,
  Search,
} from 'lucide-react'
import api from '../api/client'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const riskColors = {
  Critical: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' },
  High: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
}

const complianceColor = (pct) =>
  pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'

export default function ComplianceChecker() {
  const [sopFile, setSopFile] = useState(null)
  const [reportFile, setReportFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState('')
  const [expandedViolations, setExpandedViolations] = useState(true)
  const [expandedMissing, setExpandedMissing] = useState(true)
  const resultRef = useRef(null)
  const sopRef = useRef(null)
  const reportRef = useRef(null)

  useEffect(() => {
    api.get('/compliance/history').then(({ data }) => setHistory(data)).catch(() => {})
  }, [])

  function handleSopDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || sopRef.current?.files?.[0]
    if (file) setSopFile(file)
  }

  function handleReportDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || reportRef.current?.files?.[0]
    if (file) setReportFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sopFile || !reportFile || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    const form = new FormData()
    form.append('sop', sopFile)
    form.append('report', reportFile)

    try {
      const { data } = await api.post('/compliance/check', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data.result)
      setHistory(prev => [{
        id: data.id,
        sop_filename: data.sop_filename,
        report_filename: data.report_filename,
        risk_level: data.result.risk_level,
        compliance_percentage: data.result.compliance_percentage,
        created_at: data.created_at,
      }, ...prev])
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Compliance check failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadHistoryItem(item) {
    try {
      const { data } = await api.get(`/compliance/${item.id}`)
      setResult(data.result)
      setSopFile({ name: data.sop_filename })
      setReportFile({ name: data.report_filename })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    } catch { /* ignore */ }
  }

  const hasResult = result && !loading
  const risk = result ? riskColors[result.risk_level] || riskColors.Medium : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Compliance Checker</h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
            Upload an SOP and Inspection Report to check compliance.
          </p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="btn-ghost text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </button>
        )}
      </motion.div>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Past Checks</h3>
              {history.map((item) => (
                <button key={item.id} onClick={() => loadHistoryItem(item)}
                  className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-surface-700 dark:text-surface-200 truncate">{item.sop_filename}</p>
                      <p className="text-xs text-surface-400 truncate">{item.report_filename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium ${item.risk_level ? riskColors[item.risk_level]?.text : ''}`}>
                      {item.risk_level}
                    </span>
                    <span className="text-xs text-surface-400">{Math.round(item.compliance_percentage || 0)}%</span>
                    <span className="text-xs text-surface-400">{formatDate(item.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload form */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <form onSubmit={handleSubmit} className="card p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SOP upload */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                SOP Document <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setSopFile(f) }}
                onClick={() => sopRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  sopFile
                    ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-900/20'
                    : 'border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-500'
                }`}
              >
                <input ref={sopRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.txt" onChange={(e) => setSopFile(e.target.files[0])} className="hidden" />
                {sopFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    <FileText className="w-6 h-6 text-brand-500" />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{sopFile.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 text-surface-400 mx-auto" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Drop SOP here or <span className="text-brand-600">browse</span></p>
                    <p className="text-xs text-surface-400">PDF, DOCX, XLSX</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Report upload */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                Inspection Report <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setReportFile(f) }}
                onClick={() => reportRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  reportFile
                    ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-900/20'
                    : 'border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-500'
                }`}
              >
                <input ref={reportRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.txt" onChange={(e) => setReportFile(e.target.files[0])} className="hidden" />
                {reportFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    <Search className="w-6 h-6 text-brand-500" />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{reportFile.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 text-surface-400 mx-auto" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Drop report here or <span className="text-brand-600">browse</span></p>
                    <p className="text-xs text-surface-400">PDF, DOCX, XLSX</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={!sopFile || !reportFile || loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Analyzing Compliance...' : 'Check Compliance'}
          </button>
        </form>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400 font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results dashboard */}
      <AnimatePresence>
        {hasResult && (
          <motion.div ref={resultRef} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Compliance Percentage */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-400 dark:text-surface-500">Compliance</span>
                  <TrendingUp className="w-4 h-4 text-surface-400" />
                </div>
                <div className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                  {Math.round(result.compliance_percentage)}<span className="text-lg text-surface-400">%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${result.compliance_percentage}%` }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    className={`h-full rounded-full ${complianceColor(result.compliance_percentage)}`}
                  />
                </div>
              </motion.div>

              {/* Risk Level */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-400 dark:text-surface-500">Risk Level</span>
                  <AlertTriangle className="w-4 h-4 text-surface-400" />
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${risk?.bg} ${risk?.text}`}>
                  <ShieldCheck className="w-4 h-4" />
                  {result.risk_level}
                </div>
              </motion.div>

              {/* Violations count */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-400 dark:text-surface-500">Violations</span>
                  <XCircle className="w-4 h-4 text-surface-400" />
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{result.violations.length}</p>
                <p className="text-xs text-surface-400 mt-1">non-compliant items found</p>
              </motion.div>

              {/* Missing Steps count */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-400 dark:text-surface-500">Missing Steps</span>
                  <ArrowUpDown className="w-4 h-4 text-surface-400" />
                </div>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{result.missing_steps.length}</p>
                <p className="text-xs text-surface-400 mt-1">SOP steps not followed</p>
              </motion.div>
            </div>

            {/* Violations list */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card overflow-hidden"
            >
              <button onClick={() => setExpandedViolations(!expandedViolations)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">Violations</h2>
                  <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full px-2 py-0.5 font-medium">
                    {result.violations.length}
                  </span>
                </div>
                {expandedViolations ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
              </button>
              <AnimatePresence>
                {expandedViolations && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-2">
                      {result.violations.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">No violations found</p>
                        </div>
                      ) : (
                        result.violations.map((v, i) => (
                          <div key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/30"
                          >
                            <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">{v}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Missing Steps list */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="card overflow-hidden"
            >
              <button onClick={() => setExpandedMissing(!expandedMissing)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <ArrowUpDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">Missing Steps</h2>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium">
                    {result.missing_steps.length}
                  </span>
                </div>
                {expandedMissing ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
              </button>
              <AnimatePresence>
                {expandedMissing && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-2">
                      {result.missing_steps.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">All SOP steps were followed</p>
                        </div>
                      ) : (
                        result.missing_steps.map((step, i) => (
                          <div key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">{step}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
