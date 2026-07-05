import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Home() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    api.get('/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('Unreachable'))
  }, [])

  return (
    <div className="text-center py-20">
      <h2 className="text-4xl font-bold mb-4">Welcome to IndusBrain AI</h2>
      <p className="text-lg text-gray-600 mb-8">
        Your intelligent platform is ready.
      </p>
      <div className="inline-block bg-white shadow rounded-lg px-6 py-4">
        <span className="font-semibold">API Status: </span>
        <span className={status === 'ok' ? 'text-green-600' : 'text-red-600'}>
          {status}
        </span>
      </div>
    </div>
  )
}
