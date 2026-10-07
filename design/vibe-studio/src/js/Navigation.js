import { gsap } from 'gsap'

export class Navigation {
  constructor() {
    this.sections = ['entry', 'manifesto', 'process', 'work', 'contact']
    this.currentSection = 0
    this.dots = document.querySelectorAll('.pulse-dot')
    
    this.init()
  }
  
  init() {
    // Click navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSection(index))
    })
    
    // Scroll navigation
    let scrollTimeout
    window.addEventListener('wheel', (e) => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (e.deltaY > 0 && this.currentSection < this.sections.length - 1) {
          this.goToSection(this.currentSection + 1)
        } else if (e.deltaY < 0 && this.currentSection > 0) {
          this.goToSection(this.currentSection - 1)
        }
      }, 50)
    })
    
    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (this.currentSection < this.sections.length - 1) {
          this.goToSection(this.currentSection + 1)
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (this.currentSection > 0) {
          this.goToSection(this.currentSection - 1)
        }
      }
    })
    
    // Touch navigation
    let touchStartY = 0
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY
    })
    window.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY
      const diff = touchStartY - touchEndY
      if (Math.abs(diff) > 50) {
        if (diff > 0 && this.currentSection < this.sections.length - 1) {
          this.goToSection(this.currentSection + 1)
        } else if (diff < 0 && this.currentSection > 0) {
          this.goToSection(this.currentSection - 1)
        }
      }
    })
  }
  
  goToSection(index) {
    if (index === this.currentSection) return
    if (index < 0 || index >= this.sections.length) return
    
    const prevSection = this.currentSection
    this.currentSection = index
    
    // Update dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index)
    })
    
    // Scroll to section
    const sectionEl = document.getElementById(this.sections[index])
    sectionEl.scrollIntoView({ behavior: 'smooth' })
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('section-change', {
      detail: { 
        index, 
        name: this.sections[index],
        previous: prevSection 
      }
    }))
  }
  
  getActiveSection() {
    return this.sections[this.currentSection]
  }
  
  update(delta, time) {
    // Optional: auto-progress or other behaviors
  }
}
