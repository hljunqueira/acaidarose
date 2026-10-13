export type TVVoiceGender = 'female' | 'male'

export interface TVSoundConfig {
  enabled: boolean
  gender: TVVoiceGender
}

const SOUND_CONFIG_KEY = 'acai_tv_sound_config'

export function getTVSoundConfig(): TVSoundConfig {
  if (typeof window === 'undefined') return { enabled: true, gender: 'female' }
  try {
    const raw = localStorage.getItem(SOUND_CONFIG_KEY)
    if (!raw) return { enabled: true, gender: 'female' }
    return JSON.parse(raw)
  } catch {
    return { enabled: true, gender: 'female' }
  }
}

export function saveTVSoundConfig(config: TVSoundConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(config))
  } catch {}
}

// Contexto compartilhado para não estourar o limite de 6 hardware contexts do navegador
let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return null
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Sintetizador de alerta sonoro para novos pedidos e chamadas na TV
 * Utiliza a Web Audio API nativa do navegador (sino harmônico de dois tons)
 */
export function playOrderNotificationSound() {
  if (typeof window === 'undefined') return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Primeiro tom (suave D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    gain1.gain.setValueAtTime(0.25, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)

    // Segundo tom harmônico (alegre A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15) // A5
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.45)
  } catch {
    // Silencia se o navegador bloquear autoplay
  }
}

// Referências globais persistentes para evitar coleta de lixo (GC bug) do Chromium
let activeUtterance: SpeechSynthesisUtterance | null = null
let activeAudioElement: HTMLAudioElement | null = null

// Pré-inicialização do cache de vozes no navegador
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          window.speechSynthesis.getVoices()
        } catch {}
      }
    }
  } catch {}
}

/**
 * Seleciona a melhor voz disponível no motor nativo do navegador
 */
function getBestBrowserVoice(gender: TVVoiceGender): { voice: SpeechSynthesisVoice | null; lang: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, lang: 'pt-BR' }
  }

  const voices = window.speechSynthesis.getVoices() || []

  // 1. Prioriza vozes em Português de Portugal (pt-PT)
  const ptPTVoices = voices.filter((v) => v.lang === 'pt-PT' || v.lang === 'pt_PT')
  // 2. Se não houver pt-PT instalada no SO, usa qualquer voz em português (ex: pt-BR)
  const allPtVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'))
  
  const candidateVoices = ptPTVoices.length > 0 ? ptPTVoices : allPtVoices

  const femaleKeywords = [
    'female', 'mulher', 'feminina', 'raquel', 'helia', 'hélia', 'joana', 
    'catarina', 'francisca', 'inês', 'ines', 'victoria', 'maria', 'luciana', 'camila'
  ]
  const maleKeywords = [
    'male', 'homem', 'masculino', 'duarte', 'cristiano', 'manuel', 
    'jorge', 'ricardo', 'felipe', 'antónio', 'antonio', 'daniel'
  ]

  const keywords = gender === 'female' ? femaleKeywords : maleKeywords

  let chosen = candidateVoices.find((v) => {
    const name = v.name.toLowerCase()
    return keywords.some((k) => name.includes(k))
  })

  if (!chosen && candidateVoices.length > 0) {
    chosen = candidateVoices[0]
  }

  if (!chosen && voices.length > 0) {
    chosen = voices.find((v) => {
      const name = v.name.toLowerCase()
      return keywords.some((k) => name.includes(k))
    }) || voices[0]
  }

  return {
    voice: chosen || null,
    // Se encontrou voz, usa o lang dela. Se não encontrou nenhuma voz, usa pt-BR (padrão universal presente no Windows)
    lang: chosen?.lang || (ptPTVoices.length > 0 ? 'pt-PT' : 'pt-BR'),
  }
}

/**
 * Executa a síntese de fala local no navegador via Web Speech API
 */
export function speakWithBrowserTTS(textToSpeak: string, gender: TVVoiceGender, onEnded?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnded?.()
    return
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
    window.speechSynthesis.cancel()

    const { voice, lang } = getBestBrowserVoice(gender)
    const utterance = new SpeechSynthesisUtterance(textToSpeak)

    utterance.lang = lang
    if (voice) {
      utterance.voice = voice
    }

    utterance.rate = 0.95
    utterance.volume = 1.0
    utterance.pitch = gender === 'female' ? 1.05 : 0.88

    activeUtterance = utterance
    utterance.onend = () => {
      activeUtterance = null
      onEnded?.()
    }
    utterance.onerror = (e) => {
      console.warn('[TV TTS] Erro no SpeechSynthesis nativo:', e)
      activeUtterance = null
      onEnded?.()
    }

    // Pequeno atraso para dar tempo ao Chromium de limpar cancelamentos anteriores
    setTimeout(() => {
      try {
        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('[TV TTS] Erro ao disparar speak:', err)
        onEnded?.()
      }
    }, 60)
  } catch (err) {
    console.error('[TV TTS] Falha no SpeechSynthesis:', err)
    onEnded?.()
  }
}

/**
 * Anuncia a senha e o nome do cliente na TV com sino e fala.
 * Prioriza streaming de áudio PT-PT de alta fidelidade e ativa fallback imediato caso bloqueado.
 * Notifica onEnded quando a reprodução do áudio terminar.
 */
export function announceTVCall(
  ticket: string,
  customerName?: string | null,
  voiceGender?: TVVoiceGender,
  onEnded?: () => void
) {
  if (typeof window === 'undefined') {
    onEnded?.()
    return
  }

  let endedCalled = false
  const handleEnded = () => {
    if (endedCalled) return
    endedCalled = true
    if (safetyTimer) clearTimeout(safetyTimer)
    onEnded?.()
  }

  // Timer de segurança de 7 segundos para garantir que onEnded é sempre chamado mesmo se o áudio travar
  const safetyTimer = setTimeout(() => {
    handleEnded()
  }, 7000)

  // 1. Toca o sino de chamada da Web Audio API
  playOrderNotificationSound()

  // 2. Formata a frase de chamada limpa:
  // Se houver nome legítimo do cliente: "Senha 001, Nathaly"
  // Se for genérico/vazio: "Senha 001"
  const cleanTicket = ticket.replace('#', '').trim()
  const trimmedName = customerName?.trim()

  const isGenericName = !trimmedName || 
    trimmedName.toLowerCase() === 'balcão' || 
    trimmedName.toLowerCase() === 'balcao' ||
    trimmedName.toLowerCase() === 'local'

  const textToSpeak = !isGenericName
    ? `Senha ${cleanTicket}, ${trimmedName}`
    : `Senha ${cleanTicket}`

  const gender = voiceGender || getTVSoundConfig().gender || 'female'

  try {
    // Interrompe qualquer áudio anterior
    if (activeAudioElement) {
      activeAudioElement.pause()
      activeAudioElement = null
    }

    // Resolve URL garantindo acesso ao endpoint correto da Vercel quando acessado via domínio legado
    const origin = window.location.origin || ''
    const baseUrl = !origin.includes('localhost') && !origin.includes('vercel.app')
      ? 'https://acaidarose.vercel.app'
      : ''
    const audioUrl = `${baseUrl}/api/tv/voice?text=${encodeURIComponent(textToSpeak)}&lang=pt-PT&gender=${gender}`

    const audio = new Audio()
    audio.src = audioUrl
    audio.preload = 'auto'
    activeAudioElement = audio

    if (gender === 'male') {
      try {
        (audio as any).preservesPitch = false
      } catch {}
      audio.playbackRate = 0.88
    } else {
      audio.playbackRate = 1.0
    }

    let speechTriggered = false

    const triggerNativeTTS = () => {
      if (speechTriggered) return
      speechTriggered = true
      speakWithBrowserTTS(textToSpeak, gender, handleEnded)
    }

    // Inicia a reprodução com ligeiro atraso para sincronizar com o sino harmônico
    setTimeout(() => {
      if (speechTriggered) return
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            speechTriggered = true
          })
          .catch((playErr) => {
            console.warn('[TV Voice] Áudio online bloqueado por autoplay ou rede, ativando fala nativa:', playErr)
            triggerNativeTTS()
          })
      }
    }, 450)

    audio.onended = () => {
      activeAudioElement = null
      handleEnded()
    }

    audio.onerror = () => {
      console.warn('[TV Voice] Falha ao carregar streaming de voz, ativando fala nativa')
      activeAudioElement = null
      triggerNativeTTS()
    }

    // Timeout de segurança: se após 1400ms o áudio online não iniciou, garante a fala via motor nativo
    setTimeout(() => {
      if (!speechTriggered && (!activeAudioElement || activeAudioElement.paused)) {
        console.warn('[TV Voice] Timeout no áudio online, garantindo fala nativa de segurança')
        triggerNativeTTS()
      }
    }, 1400)

  } catch (err) {
    console.warn('[TV Voice] Falha ao inicializar áudio, usando motor nativo:', err)
    speakWithBrowserTTS(textToSpeak, gender, handleEnded)
  }
}
