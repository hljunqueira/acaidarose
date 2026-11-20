'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  loginWithCredentials: (email: string, pass: string) => Promise<void>
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token: string, user: User) => set({ token, user }),
      loginWithCredentials: async (email: string, pass: string) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        })
        const data = await res.json()
        if (!res.ok || !data.token || !data.user) {
          throw new Error(data.error || 'Credenciais inválidas')
        }
        if (typeof document !== 'undefined' && data.token) {
          const isProd = window.location.hostname.includes('acaidarose.pt')
          const domainStr = isProd ? '; domain=.acaidarose.pt' : ''
          document.cookie = `x-auth-token=${data.token}; path=/${domainStr}; max-age=2592000; SameSite=Lax`
        }
        set({ token: data.token, user: data.user })
      },
      checkAuth: async () => {
        const t = get().token
        if (!t) return
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'x-auth-token': t },
          })
          if (res.ok) {
            const d = await res.json()
            if (d.user) set({ user: d.user })
          } else {
            set({ token: null, user: null })
          }
        } catch {
          // Manter estado offline
        }
      },
      logout: async () => {
        const t = get().token
        try {
          if (t) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'x-auth-token': t },
            })
          }
        } catch {}
        if (typeof document !== 'undefined') {
          const isProd = window.location.hostname.includes('acaidarose.pt')
          const domainStr = isProd ? '; domain=.acaidarose.pt' : ''
          document.cookie = `x-auth-token=; path=/${domainStr}; max-age=0`
        }
        set({ token: null, user: null })
      },
      authFetch: async (url: string, init: RequestInit = {}) => {
        const t = get().token
        const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
        const headers: Record<string, string> = {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...((init.headers as Record<string, string>) || {}),
        }
        if (t) headers['x-auth-token'] = t
        return fetch(url, { ...init, headers })
      },
    }),
    { name: 'acai-rose-auth-v2' }
  )
)
