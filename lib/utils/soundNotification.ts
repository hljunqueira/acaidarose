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
 * Sintetizador de alerta sonoro para novos pedidos QR Code
 * Utiliza a Web Audio API nativa do navegador (sem arquivos .mp3 externos)
 */
export function playOrderNotificationSound() {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()

    // Primeiro tom (suave)
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

    // Segundo tom harmônico (alegre)
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

/**
 * Anuncia a senha na TV com sino e sintetizador de voz (Feminina ou Masculina)
 */
export function announceTVCall(ticket: string, customerName?: string, voiceGender?: TVVoiceGender) {
  if (typeof window === 'undefined') return

  // 1. Toca o sino
  playOrderNotificationSound()

  // 2. Síntese de voz em português
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // cancela falas pendentes

      const cleanTicket = ticket.replace('#', '')
      const textToSpeak = customerName
        ? `Senha ${cleanTicket}, ${customerName}`
        : `Senha ${cleanTicket}`

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'pt-PT'
      utterance.rate = 0.95

      const gender = voiceGender || getTVSoundConfig().gender || 'female'
      const voices = window.speechSynthesis.getVoices()
      const ptVoices = voices.filter((v) => v.lang.startsWith('pt'))

      if (gender === 'female') {
        utterance.pitch = 1.15
        const femaleVoice = ptVoices.find((v) => {
          const name = v.name.toLowerCase()
          return (
            name.includes('female') ||
            name.includes('luciana') ||
            name.includes('helena') ||
            name.includes('joana') ||
            name.includes('catarina') ||
            name.includes('maria') ||
            name.includes('francisca') ||
            name.includes('victoria') ||
            name.includes('raquel') ||
            name.includes('inês')
          )
        })
        if (femaleVoice) {
          utterance.voice = femaleVoice
        } else if (ptVoices.length > 0) {
          utterance.voice = ptVoices[0]
        }
      } else {
        // Voz Masculina
        utterance.pitch = 0.85
        const maleVoice = ptVoices.find((v) => {
          const name = v.name.toLowerCase()
          return (
            name.includes('male') ||
            name.includes('cristiano') ||
            name.includes('duarte') ||
            name.includes('manuel') ||
            name.includes('jorge') ||
            name.includes('ricardo') ||
            name.includes('felipe') ||
            name.includes('antónio')
          )
        })
        if (maleVoice) {
          utterance.voice = maleVoice
        } else if (ptVoices.length > 0) {
          utterance.voice = ptVoices[0]
        }
      }

      // Pequeno delay de 300ms para o sino soar antes da voz
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 300)
    }
  } catch {
    // fallback se não suportado
  }
}


