import { gsap } from 'gsap'

export class Work {
  constructor(systems) {
    this.systems = systems
    this.section = document.getElementById('work')
    this.orbs = this.section.querySelectorAll('.orb')
    this.isActive = false
    
    this.init()
  }
  
  init() {
    window.addEventListener('section-change', (e) => {
      if (e.detail.name === 'work') {
        this.activate()
      } else {
        this.deactivate()
      }
    })
    
    // Listen for orb exploration
    window.addEventListener('orb-explore', (e) => {
      this.showProjectInfo(e.detail)
    })
  }
  
  activate() {
    if (this.isActive) return
    this.isActive = true
    
    // Orbs materialize with spring effect
    this.orbs.forEach((orb, index) => {
      gsap.fromTo(orb,
        { 
          opacity: 0,
          scale: 0
        },
        { 
          opacity: 1,
          scale: 1,
          duration: 1,
          delay: index * 0.15,
          ease: 'elastic.out(1, 0.5)'
        }
      )
    })
  }
  
  deactivate() {
    this.isActive = false
    
    this.orbs.forEach((orb, index) => {
      gsap.to(orb, {
        opacity: 0,
        scale: 0,
        duration: 0.5,
        delay: index * 0.1
      })
    })
  }
  
  showProjectInfo(detail) {
    // Create floating info panel
    const info = document.createElement('div')
    info.className = 'project-info'
    info.innerHTML = `
      <div class="info-name">${detail.name}</div>
      <div class="info-meta">${detail.meta}</div>
      <div class="info-hint">click to close</div>
    `
    info.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(5, 5, 5, 0.95);
      border: 1px solid #00fff0;
      padding: 2rem 3rem;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 0 50px rgba(0, 255, 240, 0.3);
    `
    
    const nameEl = info.querySelector('.info-name')
    nameEl.style.cssText = `
      font-size: 2rem;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: #00fff0;
      margin-bottom: 1rem;
    `
    
    const metaEl = info.querySelector('.info-meta')
    metaEl.style.cssText = `
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #606060;
      margin-bottom: 1rem;
    `
    
    const hintEl = info.querySelector('.info-hint')
    hintEl.style.cssText = `
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #00b8a9;
      animation: blink 1s ease-in-out infinite;
    `
    
    document.body.appendChild(info)
    
    // Animate in
    gsap.fromTo(info,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
    )
    
    // Close on click
    info.addEventListener('click', () => {
      gsap.to(info, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => info.remove()
      })
    })
  }
  
  update(delta, time) {
    // Orb field handles its own updates
  }
}
