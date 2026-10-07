import { gsap } from 'gsap'

export class Manifesto {
  constructor(systems) {
    this.systems = systems
    this.section = document.getElementById('manifesto')
    this.lines = this.section.querySelectorAll('.manifesto-line')
    this.isActive = false
    
    this.init()
  }
  
  init() {
    window.addEventListener('section-change', (e) => {
      if (e.detail.name === 'manifesto') {
        this.activate()
      } else {
        this.deactivate()
      }
    })
  }
  
  activate() {
    if (this.isActive) return
    this.isActive = true
    
    // Staggered reveal - not fade-in, but materialize
    this.lines.forEach((line, index) => {
      gsap.fromTo(line,
        { 
          opacity: 0, 
          x: index % 2 === 0 ? -100 : 100,
          filter: 'blur(20px)',
          scale: 0.8
        },
        { 
          opacity: 1, 
          x: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 1.2,
          delay: index * 0.3,
          ease: 'power4.out'
        }
      )
    })
  }
  
  deactivate() {
    this.isActive = false
    
    // Dissolve out
    this.lines.forEach((line, index) => {
      gsap.to(line, {
        opacity: 0,
        x: index % 2 === 0 ? -50 : 50,
        filter: 'blur(10px)',
        duration: 0.5,
        delay: index * 0.1
      })
    })
  }
  
  update(delta, time) {
    if (!this.isActive) return
    
    // Subtle floating
    this.lines.forEach((line, index) => {
      const offset = Math.sin(time * 0.5 + index) * 5
      line.style.transform = `translateY(${offset}px)`
    })
  }
}
