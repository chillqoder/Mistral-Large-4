export class TimeDisplay {
  constructor() {
    this.element = document.getElementById('time-display')
    this.startTime = Date.now()
    this.update()
  }
  
  update() {
    const now = Date.now()
    const elapsed = Math.floor((now - this.startTime) / 1000)
    
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0')
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')
    const seconds = (elapsed % 60).toString().padStart(2, '0')
    
    // Also show real time
    const realTime = new Date().toLocaleTimeString('en-US', { hour12: false })
    
    this.element.textContent = `${realTime} / ${hours}:${minutes}:${seconds}`
    
    requestAnimationFrame(() => this.update())
  }
}
