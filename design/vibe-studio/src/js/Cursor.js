export class Cursor {
  constructor() {
    this.cursor = document.getElementById('cursor')
    this.dot = this.cursor.querySelector('.cursor-dot')
    this.ring = this.cursor.querySelector('.cursor-ring')
    this.label = document.getElementById('cursor-label')
    
    this.mouse = { x: 0, y: 0 }
    this.ringPos = { x: 0, y: 0 }
    this.isHovering = false
    this.isDragging = false
    this.currentLabel = ''
    
    this.init()
  }
  
  init() {
    // Track mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
    })
    
    // Hover states
    document.querySelectorAll('[data-hover], a, button, .orb, .void-point, .portal, .pulse-dot').forEach(el => {
      el.addEventListener('mouseenter', () => this.setHover(true, el.dataset.cursorLabel))
      el.addEventListener('mouseleave', () => this.setHover(false))
    })
    
    // Drag states for orbs
    document.querySelectorAll('.orb').forEach(el => {
      el.addEventListener('mousedown', () => this.setDrag(true))
      el.addEventListener('mouseup', () => this.setDrag(false))
    })
    
    // Hide on leave
    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0'
    })
    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1'
    })
    
    // Touch support
    if ('ontouchstart' in window) {
      document.body.style.cursor = 'auto'
    }
  }
  
  setHover(state, label = '') {
    this.isHovering = state
    if (state) {
      this.cursor.classList.add('hover')
      if (label) {
        this.label.textContent = label
        this.currentLabel = label
      }
    } else {
      this.cursor.classList.remove('hover')
      this.label.textContent = ''
      this.currentLabel = ''
    }
  }
  
  setDrag(state) {
    this.isDragging = state
    if (state) {
      this.cursor.classList.add('drag')
      this.label.textContent = 'dragging'
    } else {
      this.cursor.classList.remove('drag')
      this.label.textContent = this.currentLabel
    }
  }
  
  setLabel(text) {
    this.label.textContent = text
    this.currentLabel = text
  }
  
  update(delta, time) {
    // Smooth ring follow
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * delta * 10
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * delta * 10
    
    // Apply positions
    this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px) translate(-50%, -50%)`
    this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px) translate(-50%, -50%)`
    this.label.style.transform = `translate(${this.mouse.x + 20}px, ${this.mouse.y + 20}px)`
  }
}
