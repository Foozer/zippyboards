'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Home() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSuccess(false)
    setIsSubmitting(true)

    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement)
      const honeypot = formData.get('website') as string
      
      // Check honeypot field
      if (honeypot) {
        // Log the failed submission
        await supabase
          .from('failed_waitlist_submissions')
          .insert([{
            email,
            reason: 'Honeypot field filled',
            ip_address: '', // This would need to be passed from the server
            user_agent: navigator.userAgent
          }])
        throw new Error('Invalid submission')
      }

      // Check for rapid submissions (less than 5 seconds apart)
      const now = Date.now()
      if (lastSubmissionTime && now - lastSubmissionTime < 5000) {
        // Log the failed submission
        await supabase
          .from('failed_waitlist_submissions')
          .insert([{
            email,
            reason: 'Rapid submission attempt',
            ip_address: '', // This would need to be passed from the server
            user_agent: navigator.userAgent
          }])
        throw new Error('Please wait a few seconds before submitting again')
      }
      setLastSubmissionTime(now)

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        // Log the failed submission
        await supabase
          .from('failed_waitlist_submissions')
          .insert([{
            email,
            reason: 'Invalid email format',
            ip_address: '', // This would need to be passed from the server
            user_agent: navigator.userAgent
          }])
        throw new Error('Please enter a valid email address')
      }

      const { error: supabaseError } = await supabase
        .from('waitlist')
        .insert([{ 
          email,
          created_at: new Date().toISOString()
        }])

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        if (supabaseError.code === '23505') {
          // Log the failed submission
          await supabase
            .from('failed_waitlist_submissions')
            .insert([{
              email,
              reason: 'Email already exists',
              ip_address: '', // This would need to be passed from the server
              user_agent: navigator.userAgent
            }])
          throw new Error('This email is already on our waitlist!')
        }
        // Log other database errors
        await supabase
          .from('failed_waitlist_submissions')
          .insert([{
            email,
            reason: `Database error: ${supabaseError.message}`,
            ip_address: '', // This would need to be passed from the server
            user_agent: navigator.userAgent
          }])
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
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-blue-500">Zippy</span>Boards
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            The speed-run issue tracker for indie devs and lean teams
          </p>
          
          {/* Waitlist Form */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Join our Waitlist</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Honeypot field - hidden from humans but visible to bots */}
              <div className="hidden">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              {isSuccess && (
                <div className="text-green-500 text-sm">Thanks for joining our waitlist! We&apos;ll be in touch soon.</div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ZippyBoards?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-700 p-6 rounded-lg">
              <div className="text-blue-500 text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-300">Optimized for speed with keyboard-first navigation and minimal UI.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg">
              <div className="text-blue-500 text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">GitHub Integration</h3>
              <p className="text-gray-300">Seamless bi-directional sync with GitHub issues and pull requests.</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg">
              <div className="text-blue-500 text-3xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-300">Smart features to help manage tasks and prioritize your backlog.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
