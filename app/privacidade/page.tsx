import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Açaí da Rose',
  description:
    'Política de Privacidade e Proteção de Dados (RGPD) da aplicação móvel e plataforma Açaí da Rose Cashback.',
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#FAF7FC] text-[#22092C] py-12 px-6">
      <article className="max-w-3xl mx-auto bg-white rounded-3xl border border-purple-100 p-8 sm:p-10 space-y-6 shadow-xs">
        <header className="space-y-2 border-b border-purple-100 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-700">
            Açaí da Rose · Portugal (RGPD)
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950">
            Política de Privacidade
          </h1>
          <p className="text-xs text-purple-900/60">
            Última atualização: 2026
          </p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">1. Dados Recolhidos</h2>
          <p>
            Para operar o programa de fidelidade Açaí da Rose Cashback, recolhemos apenas os dados
            estritamente necessários: nome, @username, número de telemóvel, email (opcional), NIF
            (opcional), data de nascimento (opcional), foto de perfil (opcional), loja preferida e
            histórico de pontos e vouchers.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">2. Finalidade do Tratamento</h2>
          <p>
            Os dados são utilizados exclusivamente para identificar o cliente no balcão (QR Code ou
            telemóvel), creditar pontos de compras, emitir e validar vouchers de prémios, enviar
            notificações sobre pontos/vouchers e recuperar o acesso à conta. Não vendemos nem
            partilhamos dados pessoais com terceiros para fins publicitários.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">3. Permissões da Aplicação</h2>
          <p>
            A aplicação pode solicitar acesso opcional à <strong>localização</strong> (para sugerir
            a loja mais próxima), <strong>câmara/galeria</strong> (para atualizar foto de perfil),
            <strong>biometria</strong> (para desbloqueio rápido) e <strong>notificações push</strong>{' '}
            (para alertas de pontos e vouchers). Todas as permissões podem ser revogadas nas
            definições do dispositivo.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">4. Direitos do Titular e Eliminação de Conta</h2>
          <p>
            Nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD), o titular pode aceder,
            retificar ou eliminar definitivamente a sua conta a qualquer momento diretamente na app
            (em <em>Perfil → Eliminar Conta</em>) ou através da página{' '}
            <Link href="/eliminar-conta" className="text-purple-700 font-bold underline">
              Eliminar Conta
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-purple-950/85">
          <h2 className="text-base font-black text-purple-950">5. Contacto</h2>
          <p>
            Para questões relacionadas com privacidade ou proteção de dados, contacte-nos através do
            email <strong>contato@acaidarose.pt</strong>.
          </p>
        </section>
      </article>
    </main>
  )
}
