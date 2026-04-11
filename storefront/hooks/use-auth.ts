'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medusaClient } from '@/lib/medusa-client'
import { useRouter } from 'next/navigation'

const AUTH_TOKEN_KEY = 'medusa_auth_token'

/**
 * Clear auth token from localStorage. Called on logout and on 401 recovery.
 */
function clearAuthToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Clear cart from localStorage. Called on logout to prevent cart leaking
 * between users.
 */
function clearCartId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('medusa_cart_id')
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Get current customer (null if not logged in)
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer'],
    queryFn: async () => {
      try {
        const { customer } = await medusaClient.store.customer.retrieve()
        return customer
      } catch (error: any) {
        // If 401/unauthorized, clear stale token so we don't keep retrying
        if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
          clearAuthToken()
        }
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  // Login
  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const token = await medusaClient.auth.login('customer', 'emailpass', {
        email,
        password,
      })

      if (typeof token !== 'string') {
        throw new Error('Unexpected auth response')
      }

      // SDK stores token in localStorage automatically (configured in medusa-client.ts)
      const { customer } = await medusaClient.store.customer.retrieve()
      return customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData(['customer'], customer)
      // Invalidate queries that depend on auth so they refetch with new token
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  // Register
  const register = useMutation({
    mutationFn: async ({
      email,
      password,
      first_name,
      last_name,
    }: {
      email: string
      password: string
      first_name: string
      last_name: string
    }) => {
      // Step 1: Create auth identity
      try {
        await medusaClient.auth.register('customer', 'emailpass', {
          email,
          password,
        })
      } catch (error: any) {
        // If identity exists, that's fine — we'll login next
        if (!error?.message?.includes('exists') && error?.status !== 422) {
          throw error
        }
      }

      // Step 2: Login to get JWT token (register doesn't return a token)
      const token = await medusaClient.auth.login('customer', 'emailpass', {
        email,
        password,
      })

      if (typeof token !== 'string') {
        throw new Error('Unexpected auth response after registration')
      }

      // Step 3: Create customer record (token is now in localStorage via SDK)
      try {
        const { customer } = await medusaClient.store.customer.create({
          first_name,
          last_name,
          email,
        })
        return customer
      } catch (error: any) {
        // Customer record may already exist (e.g., guest checkout created it)
        if (error?.status === 422 || error?.message?.includes('exists')) {
          const { customer } = await medusaClient.store.customer.retrieve()
          return customer
        }
        throw error
      }
    },
    onSuccess: (customer) => {
      queryClient.setQueryData(['customer'], customer)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  // Logout
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await medusaClient.auth.logout()
      } catch {
        // Even if API call fails, clear local state
      }
      // Always clear tokens and cart regardless of API success
      clearAuthToken()
      clearCartId()
    },
    onSuccess: () => {
      queryClient.setQueryData(['customer'], null)
      queryClient.invalidateQueries({ queryKey: ['customer'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      router.push('/')
    },
    onError: () => {
      // Fallback: clear everything even if mutation "failed"
      queryClient.setQueryData(['customer'], null)
      queryClient.invalidateQueries()
      router.push('/')
    },
  })

  return {
    customer,
    isLoggedIn: !!customer,
    isLoading,
    login: login.mutateAsync,
    isLoggingIn: login.isPending,
    loginError: login.error,
    register: register.mutateAsync,
    isRegistering: register.isPending,
    registerError: register.error,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  }
}
