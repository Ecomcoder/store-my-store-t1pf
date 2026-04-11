'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') || ''
  const redirectTo = searchParams.get('redirect') || '/account'

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const { login, isLoggingIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login({ email, password })
      toast.success('Welcome back!')
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="container-custom py-section">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-heading font-semibold">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
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

          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border-b border-foreground/20 bg-transparent px-0 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
              placeholder="Your password"
            />
          </div>

          <div className="flex justify-between items-center">
            {prefillEmail && (
              <Link
                href={`/auth/forgot-password?email=${encodeURIComponent(prefillEmail)}`}
                className="text-xs font-semibold text-foreground underline underline-offset-4"
              >
                First time? Set your password
              </Link>
            )}
            <Link
              href={`/auth/forgot-password${prefillEmail ? `?email=${encodeURIComponent(prefillEmail)}` : ''}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-foreground text-background py-3.5 text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-custom py-section text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
