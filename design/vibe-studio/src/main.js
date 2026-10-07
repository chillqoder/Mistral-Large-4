import './style.css'
import { Void } from './js/Void.js'
import { Cursor } from './js/Cursor.js'
import { ParticleText } from './js/ParticleText.js'
import { OrbField } from './js/OrbField.js'
import { Navigation } from './js/Navigation.js'
import { Entry } from './js/sections/Entry.js'
import { Manifesto } from './js/sections/Manifesto.js'
import { Process } from './js/sections/Process.js'
import { Work } from './js/sections/Work.js'
import { Contact } from './js/sections/Contact.js'
import { Heartbeat } from './js/Heartbeat.js'
import { TimeDisplay } from './js/TimeDisplay.js'
import { EasterEgg } from './js/EasterEgg.js'

class VibeStudio {
  constructor() {
    this.canvas = document.getElementById('void-canvas')
    this.veil = document.getElementById('veil')
    this.veilBar = document.getElementById('veil-bar')
    
    this.systems = {}
    this.sections = {}
    this.isLoaded = false
    
    this.init()
  }
  
  async init() {
    this.updateProgress(10)
    
    // Initialize core systems
    this.systems.void = new Void(this.canvas)
    this.updateProgress(25)
    
    this.systems.cursor = new Cursor()
    this.updateProgress(35)
    
    this.systems.heartbeat = new Heartbeat()
    this.updateProgress(45)
    
    this.systems.particleText = new ParticleText(this.systems.void.renderer)
    this.updateProgress(55)
    
    this.systems.orbField = new OrbField(this.systems.void.scene, this.systems.void.camera)
    this.updateProgress(65)
    
    this.systems.navigation = new Navigation()
    this.updateProgress(75)
    
    // Initialize sections
    this.sections.entry = new Entry(this.systems)
    this.updateProgress(80)
    
    this.sections.manifesto = new Manifesto(this.systems)
    this.updateProgress(85)
    
    this.sections.process = new Process(this.systems)
    this.updateProgress(90)
    
    this.sections.work = new Work(this.systems)
    this.updateProgress(93)
    
    this.sections.contact = new Contact(this.systems)
    this.updateProgress(96)
    
    // Utility systems
    this.systems.time = new TimeDisplay()
    this.systems.easterEgg = new EasterEgg(this.systems.void)
    this.updateProgress(100)
    
    // Start
    await this.wait(500)
    this.hideVeil()
    this.start()
  }
  
  updateProgress(percent) {
    this.veilBar.style.width = `${percent}%`
  }
  
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  hideVeil() {
    this.veil.classList.add('hidden')
    document.body.classList.add('loaded')
  }
  
  start() {
    this.isLoaded = true
    this.systems.void.start()
    this.systems.heartbeat.start()
    this.sections.entry.activate()
    
    // Start render loop
    this.animate()
  }
  
  animate() {
    if (!this.isLoaded) return
    
    const delta = this.systems.void.clock.getDelta()
    const time = this.systems.void.clock.getElapsedTime()
    
    // Update all systems
    this.systems.cursor.update(delta, time)
    this.systems.heartbeat.update(delta, time)
    this.systems.particleText.update(delta, time)
    this.systems.orbField.update(delta, time)
    this.systems.navigation.update(delta, time)
    this.systems.easterEgg.update(delta, time)
    
    // Update active section
    const activeSection = this.systems.navigation.getActiveSection()
    if (this.sections[activeSection]) {
      this.sections[activeSection].update(delta, time)
    }
    
    // Render void
    this.systems.void.render(delta, time)
    
    requestAnimationFrame(() => this.animate())
  }
}

// Start the experience
window.addEventListener('DOMContentLoaded', () => {
  new VibeStudio()
})
