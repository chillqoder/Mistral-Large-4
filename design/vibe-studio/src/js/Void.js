import * as THREE from 'three'
import voidVertex from '../shaders/void.vert'
import voidFragment from '../shaders/void.frag'

export class Void {
  constructor(canvas) {
    this.canvas = canvas
    this.clock = new THREE.Clock()
    
    this.mouse = new THREE.Vector2(0.5, 0.5)
    this.mouseIntensity = 0
    this.targetMouseIntensity = 0
    this.scroll = 0
    this.heartbeat = 0
    
    this.init()
    this.bindEvents()
  }
  
  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Scene
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    
    // Full-screen quad with void shader
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseIntensity: { value: 0 },
      uScroll: { value: 0 },
      uHeartbeat: { value: 0 }
    }
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: voidVertex,
      fragmentShader: voidFragment,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false
    })
    
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
  }
  
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX / window.innerWidth
      this.mouse.y = 1 - e.clientY / window.innerHeight
      this.targetMouseIntensity = 1
    })
    
    window.addEventListener('touchmove', (e) => {
      this.mouse.x = e.touches[0].clientX / window.innerWidth
      this.mouse.y = 1 - e.touches[0].clientY / window.innerHeight
      this.targetMouseIntensity = 1
    })
    
    window.addEventListener('resize', () => this.resize())
    
    // Scroll tracking
    window.addEventListener('scroll', () => {
      this.scroll = window.scrollY / window.innerHeight
    })
    
    // Heartbeat event
    window.addEventListener('heartbeat', (e) => {
      this.heartbeat = e.detail.intensity
    })
  }
  
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  }
  
  setHeartbeat(intensity) {
    this.heartbeat = intensity
  }
  
  start() {
    // Initial animation
  }
  
  update(delta, time) {
    // Smooth mouse intensity
    this.mouseIntensity += (this.targetMouseIntensity - this.mouseIntensity) * delta * 2
    this.targetMouseIntensity *= 0.95
    
    // Update uniforms
    this.uniforms.uTime.value = time
    this.uniforms.uMouse.value.copy(this.mouse)
    this.uniforms.uMouseIntensity.value = this.mouseIntensity
    this.uniforms.uScroll.value = this.scroll
    this.uniforms.uHeartbeat.value = this.heartbeat
  }
  
  render(delta, time) {
    this.renderer.render(this.scene, this.camera)
  }
}
