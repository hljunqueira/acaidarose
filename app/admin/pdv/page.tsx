'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPDVRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acaidarose_admin_view', 'pdv')
      router.replace('/?view=pdv')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#10011e] text-white">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto" />
        <p className="text-xs font-bold text-purple-200">A redirecionar para o PDV Balcão & Mesas...</p>
      </div>
    </div>
  )
}
