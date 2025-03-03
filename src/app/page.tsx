'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [message, setMessage] = useState('Loading...')
  const [error, setError] = useState('')

  useEffect(() => {
    async function testBackend() {
      try {
        console.log('Testing API connection...')
        const response = await fetch('http://localhost:8000/')
        console.log('Response status:', response.status)
        
        const data = await response.json()
        console.log('Response data:', data)
        
        setMessage(JSON.stringify(data))
      } catch (err) {
        console.error('Connection error:', err)
        setError('Failed to connect to backend: ' + String(err))
      }
    }
    
    testBackend()
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{message}</pre>
        </div>
      )}
    </main>
  )
} 