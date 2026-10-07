import { gsap } from 'gsap'

export class Process {
  constructor(systems) {
    this.systems = systems
    this.section = document.getElementById('process')
    this.nodes = this.section.querySelectorAll('.flow-node')
    this.isActive = false
    
    this.init()
  }
  
  init() {
    window.addEventListener('section-change', (e) => {
      if (e.detail.name === 'process') {
        this.activate()
      } else {
        this.deactivate()
      }
    })
  }
  
  activate() {
    if (this.isActive) return
    this.isActive = true
    
    // Nodes emerge with scale and rotation
    this.nodes.forEach((node, index) => {
      gsap.fromTo(node,
        { 
          opacity: 0, 
          scale: 0,
          rotation: -180
        },
        { 
          opacity: 1, 
          scale: 1,
          rotation: 0,
          duration: 1,
          delay: index * 0.2,
          ease: 'back.out(1.7)'
        }
      )
    })
  }
  
  deactivate() {
    this.isActive = false
    
    this.nodes.forEach((node, index) => {
      gsap.to(node, {
        opacity: 0,
        scale: 0,
        rotation: 180,
        duration: 0.5,
        delay: index * 0.1
      })
    })
  }
  
  update(delta, time) {
    if (!this.isActive) return
    
    // Continuous flow animation
    this.nodes.forEach((node, index) => {
      const baseY = parseFloat(node.style.getPropertyValue('--y'))
      const offset = Math.sin(time + index * 0.5) * 10
      node.style.top = `calc(${baseY}% + ${offset}px)`
    })
  }
}
