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
            <p className="text-green-500 mt-2">Thanks for joining! We&apos;ll be in touch soon.</p>
          )}
        </form>
      </section>

      <section className="bg-gray-800 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for Developer Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div>
              <h3 className="text-xl font-bold mb-3">⚡ Blazing Fast</h3>
              <p>Server-side rendering and edge caching for instant load times. No more waiting around.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">⌨️ Keyboard First</h3>
              <p>Command palette navigation and keyboard shortcuts. Keep your hands on the keyboard.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">🔄 GitHub Sync</h3>
              <p>Seamless integration with GitHub. Keep your issues in sync automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Future Pricing Plans</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            We're currently in early access. Join our waitlist to be the first to know when we launch our pricing plans.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  1 Project
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 3 Users
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Basic Features
                </li>
              </ul>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded opacity-50 cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gray-800 rounded-lg p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">Popular</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <p className="text-4xl font-bold mb-6">$9<span className="text-lg text-gray-400">/user/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited Projects
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  GitHub Sync
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Dark Mode
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  AI Assist
                </li>
              </ul>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded opacity-50 cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            {/* Team Tier */}
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-4">Team</h3>
              <p className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 10 Users
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  API Access
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Slack Integration
                </li>
              </ul>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded opacity-50 cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Modern Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Next.js</h3>
              <p className="text-sm text-gray-400">App Router</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Supabase</h3>
              <p className="text-sm text-gray-400">PostgreSQL + Auth</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Tailwind CSS</h3>
              <p className="text-sm text-gray-400">Utility-first styling</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Vercel</h3>
              <p className="text-sm text-gray-400">Edge deployment</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 border-t border-gray-700 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ZippyBoards. Built by devs, for devs.
      </footer>
    </main>
  )
}
