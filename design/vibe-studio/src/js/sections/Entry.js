import { gsap } from 'gsap'

export class Entry {
  constructor(systems) {
    this.systems = systems
    this.section = document.getElementById('entry')
    this.voidPoint = document.getElementById('void-point')
    this.title = this.section.querySelector('.glitch-title')
    this.subtitle = this.section.querySelector('.entry-sub')
    this.isActive = false
    this.hasEntered = false
    
    this.init()
  }
  
  init() {
    // Click to enter
    this.voidPoint.addEventListener('click', () => this.enter())
    
    // Listen for section change
    window.addEventListener('section-change', (e) => {
      if (e.detail.name === 'entry') {
        this.activate()
      } else {
        this.deactivate()
      }
    })
  }
  
  activate() {
    if (this.isActive) return
    this.isActive = true
    
    // Animate in
    gsap.fromTo(this.title,
      { opacity: 0, scale: 0.8, filter: 'blur(20px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power4.out' }
    )
    
    gsap.fromTo(this.subtitle,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power3.out' }
    )
  }
  
  deactivate() {
    this.isActive = false
  }
  
  enter() {
    if (this.hasEntered) return
    this.hasEntered = true
    
    // Epic transition
    gsap.to(this.voidPoint, {
      scale: 50,
      opacity: 0,
      duration: 1,
      ease: 'power4.in'
    })
    
    gsap.to(this.title, {
      scale: 2,
      opacity: 0,
      duration: 1,
      ease: 'power4.in'
    })
    
    // Navigate to next section
    setTimeout(() => {
      this.systems.navigation.goToSection(1)
    }, 800)
  }
  
  update(delta, time) {
    if (!this.isActive) return
    
    // Subtle title glitch
    if (Math.random() > 0.95) {
      this.title.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`
      setTimeout(() => {
        this.title.style.transform = ''
      }, 50)
    }
  }
}
