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
        set({ token: null, user: null })
      },
      authFetch: async (url: string, init: RequestInit = {}) => {
        const t = get().token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...((init.headers as Record<string, string>) || {}),
        }
        if (t) headers['x-auth-token'] = t
        return fetch(url, { ...init, headers })
      },
    }),
    { name: 'acai-rose-auth-v2' }
  )
)
