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

/**
 * Sintetizador de alerta sonoro para novos pedidos e chamadas na TV
 * Utiliza a Web Audio API nativa do navegador (sino de dois tons harmônicos)
 */
export function playOrderNotificationSound() {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    // Primeiro tom (suave D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime)
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
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  } catch {
    // Ignorar se o navegador bloquear autoplay
  }
}

// Referência global persistente para evitar coleta de lixo (GC bug) do Chromium
let activeUtterance: SpeechSynthesisUtterance | null = null
let activeAudioElement: HTMLAudioElement | null = null

/**
 * Seleciona a melhor voz disponível no motor nativo do navegador
 */
function getBestBrowserVoice(gender: TVVoiceGender): { voice: SpeechSynthesisVoice | null; lang: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, lang: 'pt-PT' }
  }

  const voices = window.speechSynthesis.getVoices()
  if (!voices || voices.length === 0) {
    return { voice: null, lang: 'pt-PT' }
  }

  // 1. Filtrar vozes portuguesas (Prioridade absoluta para Portugal pt-PT)
  const ptPTVoices = voices.filter((v) => v.lang === 'pt-PT' || v.lang === 'pt_PT')
  const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'))
  const candidateVoices = ptPTVoices.length > 0 ? ptPTVoices : ptVoices

  const femaleKeywords = [
    'female', 'mulher', 'feminina', 'raquel', 'helia', 'hélia', 'joana', 
    'catarina', 'francisca', 'inês', 'ines', 'victoria', 'maria', 'luciana', 'camila'
  ]
  const maleKeywords = [
    'male', 'homem', 'masculino', 'duarte', 'cristiano', 'manuel', 
    'jorge', 'ricardo', 'felipe', 'antónio', 'antonio', 'daniel'
  ]

  const keywords = gender === 'female' ? femaleKeywords : maleKeywords

  // Tenta encontrar pelo nome nas vozes portuguesas
  let chosen = candidateVoices.find((v) => {
    const name = v.name.toLowerCase()
    return keywords.some((k) => name.includes(k))
  })

  // Se não achou por nome específico, usa a primeira voz portuguesa disponível
  if (!chosen && candidateVoices.length > 0) {
    chosen = candidateVoices[0]
  }

  // Se não tem nenhuma voz portuguesa instalada no SO, busca qualquer voz que bata o gênero
  if (!chosen) {
    chosen = voices.find((v) => {
      const name = v.name.toLowerCase()
      return keywords.some((k) => name.includes(k))
    }) || voices[0]
  }

  return {
    voice: chosen || null,
    // CRÍTICO: lang deve ser idêntico ao da voz escolhida para o Chromium não rejeitar
    lang: chosen?.lang || 'pt-PT',
  }
}

/**
 * Fallback via Web Speech API nativa (quando áudio em streaming estiver indisponível)
 */
function speakWithBrowserTTS(textToSpeak: string, gender: TVVoiceGender) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

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

    utterance.rate = 0.92
    utterance.volume = 1.0
    utterance.pitch = gender === 'female' ? 1.08 : 0.88

    // Mantém referência viva para evitar Garbage Collection prematuro
    activeUtterance = utterance
    utterance.onend = () => {
      activeUtterance = null
    }
    utterance.onerror = (e) => {
      console.warn('[TV TTS] Erro no SpeechSynthesis nativo:', e)
      activeUtterance = null
    }

    // Pequeno tick para destravamento do motor de fala
    setTimeout(() => {
      window.speechSynthesis.resume()
      window.speechSynthesis.speak(utterance)
    }, 50)
  } catch (err) {
    console.error('[TV TTS] Falha no fallback do SpeechSynthesis:', err)
  }
}

/**
 * Anuncia a senha e o nome do cliente na TV com sino harmônico e voz em Português de Portugal (pt-PT).
 * Utiliza streaming de áudio nativo em alta definição (independente do Windows) com fallback inteligente.
 */
export function announceTVCall(ticket: string, customerName?: string, voiceGender?: TVVoiceGender) {
  if (typeof window === 'undefined') return

  // 1. Toca o sino de chamada da Web Audio API
  playOrderNotificationSound()

  // 2. Formata a frase de chamada:
  // Se houver nome legítimo do cliente: "Senha 001, Nathaly"
  // Se for apenas senha: "Senha 001"
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

  // Aguarda 400ms para o sino soar limpo antes de iniciar a fala
  setTimeout(() => {
    try {
      // Para qualquer áudio anterior em execução
      if (activeAudioElement) {
        activeAudioElement.pause()
        activeAudioElement = null
      }

      // Endpoint de streaming de áudio PT-PT do servidor Next.js
      const audioUrl = `/api/tv/voice?text=${encodeURIComponent(textToSpeak)}&lang=pt-PT&gender=${gender}`
      const audio = new Audio(audioUrl)

      // Ajuste fino de tom/pitch para masculino/feminino
      if (gender === 'male') {
        audio.playbackRate = 0.90 // cadência masculina mais encorpada
      } else {
        audio.playbackRate = 1.0 // cadência feminina padrão de Portugal
      }

      activeAudioElement = audio

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((playError) => {
          console.warn('[TV Voice] Falha na reprodução do áudio online, usando motor nativo:', playError)
          // Se o navegador bloquear o elemento de áudio ou estiver offline, usa o SpeechSynthesis
          speakWithBrowserTTS(textToSpeak, gender)
        })
      }

      audio.onended = () => {
        activeAudioElement = null
      }
      audio.onerror = () => {
        console.warn('[TV Voice] Erro ao carregar streaming de voz, ativando fallback local')
        activeAudioElement = null
        speakWithBrowserTTS(textToSpeak, gender)
      }
    } catch {
      // Fallback garantido para o motor do navegador
      speakWithBrowserTTS(textToSpeak, gender)
    }
  }, 400)
}
