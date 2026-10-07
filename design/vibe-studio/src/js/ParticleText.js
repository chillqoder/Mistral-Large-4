import * as THREE from 'three'
import particlesVertex from '../shaders/particles.vert'
import particlesFragment from '../shaders/particles.frag'

export class ParticleText {
  constructor(renderer) {
    this.renderer = renderer
    this.particleSystems = new Map()
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')
  }
  
  createTextParticles(text, options = {}) {
    const {
      font = '100px "JetBrains Mono"',
      color = 0x00fff0,
      size = 2,
      spread = 5,
      depth = 2
    } = options
    
    // Setup offscreen canvas
    this.offscreenCanvas.width = 1024
    this.offscreenCanvas.height = 256
    this.offscreenCtx.clearRect(0, 0, 1024, 256)
    this.offscreenCtx.font = font
    this.offscreenCtx.fillStyle = 'white'
    this.offscreenCtx.textAlign = 'center'
    this.offscreenCtx.textBaseline = 'middle'
    this.offscreenCtx.fillText(text, 512, 128)
    
    // Sample pixels
    const imageData = this.offscreenCtx.getImageData(0, 0, 1024, 256)
    const pixels = imageData.data
    
    const positions = []
    const targets = []
    const sizes = []
    const randoms = []
    const phases = []
    
    const step = 4 // Sample every 4 pixels
    
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 1024; x += step) {
        const index = (y * 1024 + x) * 4
        const alpha = pixels[index + 3]
        
        if (alpha > 128) {
          // Normalized position (-1 to 1)
          const tx = (x / 1024 - 0.5) * 4
          const ty = -(y / 256 - 0.5) * 2
          const tz = (Math.random() - 0.5) * depth
          
          // Scattered position
          const sx = (Math.random() - 0.5) * spread
          const sy = (Math.random() - 0.5) * spread
          const sz = (Math.random() - 0.5) * spread * 2
          
          targets.push(tx, ty, tz)
          positions.push(sx, sy, sz)
          sizes.push(size * (0.5 + Math.random()))
          randoms.push(Math.random())
          phases.push(Math.random() * Math.PI * 2)
        }
      }
    }
    
    if (positions.length === 0) return null
    
    // Create geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('aPosition', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aTarget', new THREE.Float32BufferAttribute(targets, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1))
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1))
    
    // Create material
    const material = new THREE.ShaderMaterial({
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uProjection: { value: new THREE.Matrix4() },
        uView: { value: new THREE.Matrix4() }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    const points = new THREE.Points(geometry, material)
    points.visible = false
    
    return {
      points,
      material,
      progress: 0,
      targetProgress: 0
    }
  }
  
  update(delta, time) {
    // Update all particle systems
    for (const system of this.particleSystems.values()) {
      system.progress += (system.targetProgress - system.progress) * delta * 2
      system.material.uniforms.uProgress.value = system.progress
      system.material.uniforms.uTime.value = time
    }
  }
  
  setProgress(id, progress) {
    const system = this.particleSystems.get(id)
    if (system) {
      system.targetProgress = progress
    }
  }
  
  register(id, system) {
    this.particleSystems.set(id, system)
  }
}
