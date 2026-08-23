'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CheckCircle2, Send, Store, TrendingUp, Users, Award, ShieldCheck } from 'lucide-react'

const DISTRITOS_PT = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu',
  'Açores',
  'Madeira',
  'Outro País / Espanha',
]

const INVEST_OPTIONS = [
  '5.000€',
  '10.000€',
  '20.000€',
  '30.000€',
  '50.000€+',
]

export default function LandingFranchise() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    distrito: 'Aveiro',
    motivo: '',
    investimento: '5.000€',
    preferenciaContato: {
      whatsapp: true,
      telefone: false,
      email: false,
    },
    termosAceitos: false,
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.email || !form.telefone) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    if (!form.termosAceitos) {
      toast.error('É necessário aceitar os Termos e Condições')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success('Candidatura enviada com sucesso!')
    }, 1000)
  }

  return (
    <section id="franquia" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-16 space-y-12">
      
      {/* Cabeçalho da Seção */}
      <div className="text-left space-y-2 border-b border-white/10 pb-4">
        <span className="text-sm font-black uppercase tracking-wider text-pink-400">
          Expansão da Marca
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Seja um Franchisado
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Coluna de Apresentação & Pilares */}
        <div className="lg:col-span-5 space-y-6 text-left">
          {/* Card Fotográfico Oficial dos Fundadores / Franchisados com Enquadramento Perfeito */}
          <div className="rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-[#1a0129] group">
            <div className="relative w-full aspect-[4/3.9] sm:aspect-[4/3.6] overflow-hidden bg-[#230238]">
              <img
                src="/images/official/franchisado-vava-e-rose-1.webp"
                alt="Franchisados de Sucesso - Vavá e Rose"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#160124]/70 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="p-4 sm:p-5 bg-gradient-to-b from-[#160124] to-[#11011c] border-t border-white/10 space-y-1 text-left">
              <span className="text-[11px] font-black uppercase text-pink-400 tracking-wider block">
                História de Sucesso & Propósito
              </span>
              <div className="text-base sm:text-lg font-black text-white">
                Vavá & Rose · Expansão da Rede
              </div>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Um modelo comprovado e rentável para transformar paixão em um negócio de sucesso em Portugal.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Torne-se nosso franchisado
            </h3>
            
            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">
              Leve o sabor autêntico do Brasil à sua cidade com uma marca que está a conquistar Portugal!
            </p>
            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">
              Com um modelo de negócio testado, produtos de excelência e apoio total ao longo da jornada, o Açaí da Rose é a escolha certa para quem quer investir com confiança e crescer com propósito.
            </p>

            <div className="p-5 rounded-2xl bg-purple-900/30 border border-purple-500/40 text-pink-200 font-bold text-sm sm:text-base leading-relaxed">
              Junte-se à nossa rede de franchisados e faça parte desta história de sucesso.
            </div>
          </div>

          {/* Destaques da Franquia */}
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Polpa Padrão Ouro</div>
                <div className="text-xs text-purple-200/70">Fornecimento centralizado e exclusivo</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Alta Rentabilidade</div>
                <div className="text-xs text-purple-200/70">Margem atrativa e rápido retorno</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Treinamento & Suporte</div>
                <div className="text-xs text-purple-200/70">Acompanhamento contínuo da nossa equipa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna do Formulário Oficial com Fontes Confortáveis */}
        <div className="lg:col-span-7 bg-[#170126] border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="mb-6">
            <h4 className="text-xl sm:text-2xl font-black text-white">
              Preencha o formulário para receber mais informações:
            </h4>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Entraremos em contacto para apresentar o plano de negócio detalhado.
            </p>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-2xl font-black text-white">Candidatura Enviada!</h4>
              <p className="text-sm text-purple-200/80 max-w-md mx-auto">
                Obrigado pelo seu interesse. A nossa equipa de franchising entrará em contacto através do canal de sua preferência.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-purple-200">Nome Completo *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                  className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-200">E-mail *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                    className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-200">Telefone / WhatsApp *</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="+351 9XX XXX XXX"
                    required
                    className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-200">Cidade Pretendida</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    placeholder="Exemplo: Porto, Lisboa"
                    className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-purple-200">Se Portugal – Selecione o Distrito:</Label>
                  <select
                    value={form.distrito}
                    onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                    className="w-full bg-[#200336] border border-white/15 text-white rounded-xl h-12 text-sm px-3.5 focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    {DISTRITOS_PT.map((d) => (
                      <option key={d} value={d} className="bg-[#200336] text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-purple-200">Por que deseja abrir uma loja do Açaí da Rose?</Label>
                <textarea
                  rows={3}
                  value={form.motivo}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm({ ...form, motivo: e.target.value })
                  }
                  placeholder="Conte-nos sobre o seu interesse e experiência..."
                  className="w-full p-3.5 bg-white/10 border border-white/15 text-white placeholder:text-purple-300/40 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-purple-200">Investimento inicial estimado</Label>
                <select
                  value={form.investimento}
                  onChange={(e) => setForm({ ...form, investimento: e.target.value })}
                  className="w-full bg-[#200336] border border-white/15 text-white rounded-xl h-12 text-sm px-3.5 focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {INVEST_OPTIONS.map((inv) => (
                    <option key={inv} value={inv} className="bg-[#200336] text-white">
                      {inv}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferência de Contato */}
              <div className="space-y-2 pt-1">
                <Label className="text-sm font-bold text-purple-200">Prefere Contato por:</Label>
                <div className="flex flex-wrap items-center gap-6 text-sm text-purple-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.preferenciaContato.whatsapp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          preferenciaContato: {
                            ...form.preferenciaContato,
                            whatsapp: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded accent-pink-500 cursor-pointer"
                    />
                    <span>Whatsapp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.preferenciaContato.telefone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          preferenciaContato: {
                            ...form.preferenciaContato,
                            telefone: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded accent-pink-500 cursor-pointer"
                    />
                    <span>Telefone</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.preferenciaContato.email}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          preferenciaContato: {
                            ...form.preferenciaContato,
                            email: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded accent-pink-500 cursor-pointer"
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>

              {/* Termos e Condições */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex items-start gap-3 text-xs text-purple-200/90 cursor-pointer leading-relaxed">
                  <input
                    type="checkbox"
                    checked={form.termosAceitos}
                    onChange={(e) => setForm({ ...form, termosAceitos: e.target.checked })}
                    className="h-4 w-4 mt-0.5 rounded accent-pink-500 flex-shrink-0 cursor-pointer"
                    required
                  />
                  <span>
                    Ao enviar este formulário, declaro que li e aceito os Termos e Condições relacionados ao processo de franchising. Estou ciente de que todas as informações fornecidas serão utilizadas para análise da minha solicitação.
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-xl shadow-pink-600/35 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>{loading ? 'A enviar candidatura...' : 'Enviar Candidatura'}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
