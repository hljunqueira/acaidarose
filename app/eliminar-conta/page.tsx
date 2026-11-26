import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eliminar Conta — Açaí da Rose Cashback',
  description:
    'Instruções para eliminação definitiva de conta e dados pessoais na app Açaí da Rose Cashback (RGPD).',
}

export default function EliminarContaPage() {
  return (
    <main className="min-h-screen bg-[#FAF7FC] text-[#22092C] py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-purple-100 p-8 sm:p-10 space-y-6 shadow-xs">
        <header className="space-y-2 border-b border-purple-100 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-700">
            Açaí da Rose · RGPD
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950">
            Eliminação de Conta e Dados Pessoais
          </h1>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">
            Opção 1 — Eliminação Imediata na App (Recomendado)
          </h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Abra a aplicação <strong>Açaí da Rose Cashback</strong> com a sua sessão iniciada.</li>
            <li>Aceda ao separador <strong>Perfil</strong> no menu inferior.</li>
            <li>Deslize até ao final do ecrã e selecione <strong>Eliminar Conta</strong>.</li>
            <li>Confirme a operação para anonimizar imediatamente todos os seus dados pessoais.</li>
          </ol>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">
            Opção 2 — Pedido por Email
          </h2>
          <p>
            Caso já não tenha acesso à aplicação, envie um email para{' '}
            <strong>contato@acaidarose.pt</strong> com o assunto <em>Eliminar Conta Cashback</em>{' '}
            indicando o número de telemóvel registado. O pedido é concluído no prazo máximo de 5
            dias úteis.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">Dados Eliminados</h2>
          <p>
            Nome, @username, telemóvel, email, NIF, data de nascimento, foto de perfil, tokens de
            notificação e saldo de pontos são eliminados/anonimizados de forma definitiva e
            irreversível.
          </p>
        </section>

        <div className="pt-2">
          <Link
            href="/privacidade"
            className="text-xs font-bold text-purple-700 underline"
          >
            Consultar Política de Privacidade
          </Link>
        </div>
      </div>
    </main>
  )
}
