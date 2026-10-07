import { gsap } from 'gsap'

export class Contact {
  constructor(systems) {
    this.systems = systems
    this.section = document.getElementById('contact')
    this.portal = document.getElementById('portal')
    this.contactInfo = this.section.querySelector('.contact-info')
    this.isActive = false
    
    this.init()
  }
  
  init() {
    window.addEventListener('section-change', (e) => {
      if (e.detail.name === 'contact') {
        this.activate()
      } else {
        this.deactivate()
      }
    })
    
    // Portal click
    this.portal.addEventListener('click', () => this.enterPortal())
  }
  
  activate() {
    if (this.isActive) return
    this.isActive = true
    
    // Portal scales in
    gsap.fromTo(this.portal,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' }
    )
    
    // Contact info reveals
    gsap.fromTo(this.contactInfo,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power3.out' }
    )
  }
  
  deactivate() {
    this.isActive = false
    
    gsap.to(this.portal, {
      scale: 0,
      rotation: 180,
      duration: 0.5
    })
    
    gsap.to(this.contactInfo, {
      opacity: 0,
      y: 30,
      duration: 0.5
    })
  }
  
  enterPortal() {
    // Epic portal transition
    gsap.to(this.portal, {
      scale: 10,
      opacity: 0,
      duration: 1,
      ease: 'power4.in'
    })
    
    gsap.to(this.section, {
      opacity: 0,
      duration: 1
    })
    
    // Create mailto after animation
    setTimeout(() => {
      window.location.href = 'mailto:void@form.studio?subject=Entering the void'
    }, 800)
  }
  
  update(delta, time) {
    if (!this.isActive) return
    
    // Portal breathing
    const scale = 1 + Math.sin(time * 2) * 0.05
    this.portal.style.transform = `scale(${scale})`
  }
}
