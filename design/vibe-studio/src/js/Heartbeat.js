export class Heartbeat {
  constructor() {
    this.intensity = 0
    this.targetIntensity = 0
    this.beatInterval = 600 // ms between beats
    this.lastBeat = 0
    this.isActive = false
    
    // Create audio context for heartbeat sound
    this.audioContext = null
    this.oscillator = null
    this.gainNode = null
  }
  
  start() {
    this.isActive = true
    this.initAudio()
  }
  
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.log('Audio not supported')
    }
  }
  
  beat() {
    const now = performance.now()
    if (now - this.lastBeat < this.beatInterval) return
    this.lastBeat = now
    
    // Visual pulse
    this.targetIntensity = 1
    
    // Dispatch event for void
    window.dispatchEvent(new CustomEvent('heartbeat', {
      detail: { intensity: 1, time: now }
    }))
    
    // Play sound
    this.playBeat()
    
    // Pulse DOM elements
    document.querySelectorAll('.void-point, .portal-core, .pulse-dot.active').forEach(el => {
      el.style.transform += ' scale(1.2)'
      setTimeout(() => {
        el.style.transform = el.style.transform.replace(' scale(1.2)', '')
      }, 100)
    })
  }
  
  playBeat() {
    if (!this.audioContext) return
    
    // Low thump
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(60, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    
    osc.connect(gain)
    gain.connect(this.audioContext.destination)
    
    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.2)
  }
  
  update(delta, time) {
    if (!this.isActive) return
    
    // Auto beat
    this.beat()
    
    // Decay intensity
    this.intensity += (this.targetIntensity - this.intensity) * delta * 5
    this.targetIntensity *= 0.9
  }
}
