import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])

  useEffect(() => {
    api.get('/documents').then(({ data }) => setDocs(data)).catch(() => {})
  }, [])

  const totalSize = docs.reduce((sum, d) => sum + d.file_size, 0)
  const totalMB = (totalSize / (1024 * 1024)).toFixed(1)
  const storageLimitMB = 50
  const storagePct = Math.min((totalSize / (storageLimitMB * 1024 * 1024)) * 100, 100)

  const stats = [
    { label: 'Total Documents', value: docs.length.toString(), color: 'bg-blue-500' },
    { label: 'Storage Used', value: `${totalMB} MB`, color: 'bg-emerald-500' },
    { label: 'Compliance Score', value: '94%', color: 'bg-violet-500' },
    { label: 'AI Queries', value: '18,492', color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.full_name}</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your platform today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg ${stat.color} flex items-center justify-center text-white text-lg font-bold`}>
                {stat.label[0]}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h2>
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((file) => (
                    <tr key={file.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 text-gray-900 font-medium">{file.original_filename}</td>
                      <td className="py-3 text-gray-500">{new Date(file.uploaded_at).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-500">{formatSize(file.file_size)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          {file.mime_type.split('/').pop().toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Storage Used</span>
              <span className="text-sm font-medium text-gray-900">{totalMB} / {storageLimitMB} GB</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Documents</span>
              <span className="text-sm font-medium text-gray-900">{docs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Team Members</span>
              <span className="text-sm font-medium text-gray-900">12</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">Account</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
