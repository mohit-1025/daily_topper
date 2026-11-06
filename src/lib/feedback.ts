export function playChime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.16, now + index * 0.18 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.55)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now + index * 0.18)
      oscillator.stop(now + index * 0.18 + 0.6)
    })
      ;[0, 1].forEach((index) => {
        const bell = ctx.createOscillator()
        const bellGain = ctx.createGain()
        bell.type = 'triangle'
        bell.frequency.value = index === 0 ? 1046.5 : 1318.5
        bellGain.gain.setValueAtTime(0.0001, now + 0.55 + index * 0.12)
        bellGain.gain.exponentialRampToValueAtTime(0.1, now + 0.58 + index * 0.12)
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + index * 0.12)
        bell.connect(bellGain)
        bellGain.connect(ctx.destination)
        bell.start(now + 0.55 + index * 0.12)
        bell.stop(now + 1.4 + index * 0.12)
      })
    setTimeout(() => void ctx.close(), 2600)
  } catch {
    /* audio is a nice-to-have */
  }
}

export async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch {
    return false
  }
}

export function showNotification(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.svg' })
  } catch {
    /* notification may fail in some browsers */
  }
}
