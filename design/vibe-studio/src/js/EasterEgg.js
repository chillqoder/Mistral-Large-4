import * as THREE from 'three'

export class EasterEgg {
  constructor(voidSystem) {
    this.voidSystem = voidSystem
    this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    this.input = []
    this.isActivated = false
    this.element = document.getElementById('easter-egg')
    
    this.init()
  }
  
  init() {
    // Show hint after 30 seconds
    setTimeout(() => {
      this.element.classList.add('visible')
    }, 30000)
    
    // Konami code listener
    window.addEventListener('keydown', (e) => {
      this.input.push(e.key)
      this.input = this.input.slice(-10)
      
      if (this.input.join(',') === this.konamiCode.join(',')) {
        this.activate()
      }
    })
  }
  
  activate() {
    if (this.isActivated) return
    this.isActivated = true
    
    // Reality glitch mode
    document.body.style.animation = 'reality-glitch 0.5s ease-in-out'
    
    // Invert colors temporarily
    const style = document.createElement('style')
    style.textContent = `
      @keyframes reality-glitch {
        0%, 100% { filter: none; }
        20% { filter: invert(1) hue-rotate(180deg); }
        40% { filter: none; }
        60% { filter: invert(1) hue-rotate(90deg); }
        80% { filter: none; }
      }
      .easter-activated {
        animation: rainbow-shift 3s linear infinite;
      }
      @keyframes rainbow-shift {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    
    // Add rainbow mode to body
    setTimeout(() => {
      document.body.classList.add('easter-activated')
    }, 500)
    
    // Create extra particles
    window.dispatchEvent(new CustomEvent('easter-egg-activated'))
    
    // Change cursor label
    window.dispatchEvent(new CustomEvent('cursor-label', {
      detail: { label: 'KONAMI MODE' }
    }))
  }
  
  update(delta, time) {
    // Easter egg specific updates
  }
}
