'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSuccess(false)
    setIsSubmitting(true)

    try {
      const { error: supabaseError } = await supabase
        .from('waitlist')
        .insert([{ 
          email,
          created_at: new Date().toISOString()
        }])

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        if (supabaseError.code === '23505') {
          throw new Error('This email is already on our waitlist!')
        }
        throw new Error(supabaseError.message)
      }
      setIsSuccess(true)
      setEmail('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(errorMessage)
      console.error('Error details:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <header className="p-6 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-2xl font-bold">ZippyBoards</h1>
        <a href="#waitlist" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Join Waitlist
        </a>
      </header>

      <section className="text-center py-24 px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Blazing Fast Task Management for Devs
        </h2>
        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          ZippyBoards is a keyboard-first, developer-focused issue tracker that stays out of your way.
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {isSuccess && (
            <p className="text-green-500 mt-2">Thanks for joining! We'll be in touch soon.</p>
          )}
        </form>
      </section>

      <section className="bg-gray-800 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-xl font-bold mb-3">⚡ Blazing Fast</h3>
            <p>Built for speed with keyboard shortcuts and instant load times.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">⌨️ Keyboard First</h3>
            <p>Complete tasks without touching your mouse. Built for power users.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">🤖 AI Assisted</h3>
            <p>Smart task suggestions and automated workflows powered by AI.</p>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 border-t border-gray-700 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ZippyBoards. Built by devs, for devs.
      </footer>
    </main>
  )
}
