import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const ACCEPTED = '.pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Upload() {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    try {
      const { data } = await api.get('/documents')
      setDocs(data)
    } catch { /* ignore */ }
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  async function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    await uploadFiles(Array.from(e.dataTransfer.files))
  }

  async function onInputChange(e) {
    await uploadFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  async function uploadFiles(fileList) {
    setError('')
    const allowed = fileList.filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return ACCEPTED.includes(ext)
    })
    if (!allowed.length) {
      setError('Only PDF, DOCX, Excel, and image files are allowed.')
      return
    }

    setUploading(true)
    for (const file of allowed) {
      setFiles(prev => [...prev, { name: file.name, status: 'uploading' }])
      const form = new FormData()
      form.append('file', file)
      try {
        await api.post('/documents/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'done' } : f
        ))
      } catch {
        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: 'error' } : f
        ))
      }
    }
    setUploading(false)
    setTimeout(() => setFiles([]), 3000)
    fetchDocs()
  }

  async function downloadDoc(doc) {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  async function deleteDoc(id) {
    try {
      await api.delete(`/documents/${id}`)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          onChange={onInputChange}
          className="hidden"
        />
        <div className="text-4xl mb-3 text-gray-400">
          {dragging ? '📂' : '📄'}
        </div>
        <p className="text-gray-700 font-medium">
          {dragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          PDF &middot; DOCX &middot; Excel &middot; Images
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Uploading</h2>
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{f.name}</span>
              <span className={`ml-2 font-medium ${
                f.status === 'done' ? 'text-emerald-600' :
                f.status === 'error' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {f.status === 'done' ? 'Done' : f.status === 'error' ? 'Failed' : 'Uploading...'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Uploaded</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-900 font-medium truncate max-w-xs">{doc.original_filename}</td>
                    <td className="py-3 text-gray-500">{formatSize(doc.file_size)}</td>
                    <td className="py-3 text-gray-500 text-xs">{doc.mime_type}</td>
                    <td className="py-3 text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right space-x-2">
                      <Link
                        to={`/view/${doc.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => downloadDoc(doc)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => deleteDoc(doc.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
