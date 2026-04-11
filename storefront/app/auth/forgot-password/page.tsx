'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { medusaClient } from '@/lib/medusa-client'
import { toast } from 'sonner'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(prefillEmail)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await medusaClient.auth.resetPassword('customer', 'emailpass', {
        identifier: email,
      })
    } catch {
      // Don't reveal whether the email exists — always show success
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="container-custom py-section">
        <div className="max-w-sm mx-auto text-center">
          <Mail className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
          <h1 className="text-h2 font-heading font-semibold">Check Your Email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            If an account exists for <span className="text-foreground font-medium">{email}</span>,
            you&apos;ll receive a password reset link shortly.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-section">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-heading font-semibold">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border-b border-foreground/20 bg-transparent px-0 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-3.5 text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="container-custom py-section text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
