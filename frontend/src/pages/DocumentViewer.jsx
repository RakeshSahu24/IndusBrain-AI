import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isImage(mime) {
  return mime && mime.startsWith('image/')
}

function isPdf(mime) {
  return mime === 'application/pdf'
}

function isDocx(mime) {
  return mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

function isXlsx(mime) {
  return mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

function isXls(mime) {
  return mime === 'application/vnd.ms-excel'
}

function isDoc(mime) {
  return mime === 'application/msword'
}

export default function DocumentViewer() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [objectUrl, setObjectUrl] = useState('')
  const docxContainerRef = useRef(null)
  const [xlsxHeaders, setXlsxHeaders] = useState([])
  const [xlsxRows, setXlsxRows] = useState([])

  useEffect(() => {
    api.get(`/documents/${id}`)
      .then(({ data }) => setDoc(data))
      .catch(() => setError('Document not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!doc) return
    const mime = doc.mime_type
    if (isPdf(mime) || isImage(mime)) {
      fetchAndCreateObjectUrl()
    }
    renderPreview()
  }, [doc])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  async function fetchAndCreateObjectUrl() {
    try {
      const res = await api.get(`/documents/${id}/view`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setObjectUrl(url)
    } catch {
      setPreviewError('Failed to load file preview.')
    }
  }

  async function handleDownload() {
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' })
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

  async function renderPreview() {
    const mime = doc.mime_type

    if (isDocx(mime)) {
      setPreviewLoading(true)
      try {
        const { renderAsync } = await import('docx-preview')
        const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' })
        await renderAsync(res.data, docxContainerRef.current, null, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        })
      } catch {
        setPreviewError('Failed to render DOCX preview. Download the file instead.')
      }
      setPreviewLoading(false)
    }

    if (isXlsx(mime) || isXls(mime)) {
      setPreviewLoading(true)
      try {
        const XLSX = await import('xlsx')
        const res = await api.get(`/documents/${id}/download`, { responseType: 'arraybuffer' })
        const wb = XLSX.read(res.data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (rows.length > 0) {
          setXlsxHeaders(rows[0])
          setXlsxRows(rows.slice(1))
        }
      } catch {
        setPreviewError('Failed to render spreadsheet preview. Download the file instead.')
      }
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/upload" className="text-indigo-600 hover:underline">Back to Documents</Link>
      </div>
    )
  }

  const mime = doc.mime_type
  const showInline = isPdf(mime) || isImage(mime)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/upload" className="text-sm text-indigo-600 hover:underline">&larr; Back to Documents</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{doc.original_filename}</h1>
          <p className="text-sm text-gray-500">
            {formatSize(doc.file_size)} &middot; {doc.mime_type}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
        >
          Download
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {showInline && objectUrl && (
          isPdf(mime) ? (
            <iframe
              src={objectUrl}
              className="w-full"
              style={{ height: '80vh' }}
              title={doc.original_filename}
            />
          ) : (
            <div className="flex items-center justify-center p-4 bg-gray-50">
              <img
                src={objectUrl}
                alt={doc.original_filename}
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          )
        )}

        {showInline && !objectUrl && !previewError && (
          <div className="p-12 text-center text-gray-400">Loading preview...</div>
        )}

        {isDocx(mime) && (
          <div className="p-4">
            {previewLoading && <p className="text-gray-400 text-sm">Rendering document...</p>}
                {previewError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                {previewError}
                <button
                  onClick={handleDownload}
                  className="block mt-2 text-indigo-600 font-medium hover:underline"
                >
                  Download {doc.original_filename}
                </button>
              </div>
            )}
            <div ref={docxContainerRef} />
          </div>
        )}

        {(isXlsx(mime) || isXls(mime)) && (
          <div className="p-4 overflow-auto">
            {previewLoading && <p className="text-gray-400 text-sm">Rendering spreadsheet...</p>}
            {previewError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                {previewError}
                <button
                  onClick={handleDownload}
                  className="block mt-2 text-indigo-600 font-medium hover:underline"
                >
                  Download {doc.original_filename}
                </button>
              </div>
            )}
            {xlsxHeaders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {xlsxHeaders.map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {xlsxRows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 border-b border-gray-100 text-gray-700 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isDoc(mime) && (
          <div className="p-12 text-center text-gray-400">
            <p className="mb-4">Legacy Word documents (.doc) cannot be previewed in the browser.</p>
            <button
              onClick={handleDownload}
              className="text-indigo-600 font-medium hover:underline"
            >
              Download {doc.original_filename}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
