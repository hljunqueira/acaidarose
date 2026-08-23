import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6fc] dark:bg-[#0e0117] text-purple-950 dark:text-white p-4 text-center">
      <h1 className="text-4xl font-black mb-2">404</h1>
      <p className="text-sm text-purple-700/80 dark:text-purple-200/70 mb-4">Página não encontrada.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white rounded-xl text-xs font-bold shadow-md"
      >
        Voltar ao Início
      </Link>
    </div>
  )
}
