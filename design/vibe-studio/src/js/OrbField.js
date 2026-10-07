import * as THREE from 'three'
import { gsap } from 'gsap'

export class OrbField {
  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.orbs = []
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.draggedOrb = null
    this.orbData = [
      { name: 'neural garden', meta: 'webGL / AI / 2024', color: 0x00fff0 },
      { name: 'synth os', meta: 'audio / real-time / 2024', color: 0xff00ff },
      { name: 'void commerce', meta: 'e-commerce / 3D / 2023', color: 0x00ff88 },
      { name: 'particle dreams', meta: 'generative / art / 2023', color: 0xff3366 },
      { name: 'flow state', meta: 'productivity / UX / 2024', color: 0x8800ff }
    ]
    
    this.init()
    this.bindEvents()
  }
  
  init() {
    // Create invisible 3D orbs that sync with DOM elements
    const domOrbs = document.querySelectorAll('.orb')
    
    domOrbs.forEach((domOrb, index) => {
      const data = this.orbData[index]
      
      // Create 3D representation
      const geometry = new THREE.SphereGeometry(0.5, 32, 32)
      const material = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.1,
        wireframe: true
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      // Add glow
      const glowGeometry = new THREE.SphereGeometry(0.6, 32, 32)
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(data.color) },
          uTime: { value: 0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            intensity *= 0.5 + 0.5 * sin(uTime * 2.0 + vPosition.y * 5.0);
            gl_FragColor = vec4(uColor, intensity * 0.3);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      mesh.add(glow)
      
      // Position based on DOM element
      const rect = domOrb.getBoundingClientRect()
      const x = (rect.left + rect.width / 2 / window.innerWidth - 0.5) * 8
      const y = -(rect.top + rect.height / 2 / window.innerHeight - 0.5) * 5
      const z = (Math.random() - 0.5) * 4
      
      mesh.position.set(x, y, z)
      
      // Store reference
      mesh.userData = {
        domElement: domOrb,
        data: data,
        basePosition: mesh.position.clone(),
        velocity: new THREE.Vector3(),
        index: index
      }
      
      this.scene.add(mesh)
      this.orbs.push(mesh)
    })
  }
  
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })
    
    // Dragging
    document.querySelectorAll('.orb').forEach((domOrb, index) => {
      domOrb.addEventListener('mousedown', (e) => {
        this.draggedOrb = this.orbs[index]
        this.dragStart = { x: e.clientX, y: e.clientY }
        this.dragOffset = this.draggedOrb.position.clone()
      })
    })
    
    window.addEventListener('mousemove', (e) => {
      if (!this.draggedOrb) return
      
      const dx = (e.clientX - this.dragStart.x) / window.innerWidth * 5
      const dy = -(e.clientY - this.dragStart.y) / window.innerHeight * 3
      
      this.draggedOrb.userData.velocity.set(dx, dy, 0)
    })
    
    window.addEventListener('mouseup', () => {
      if (this.draggedOrb) {
        // Apply momentum
        gsap.to(this.draggedOrb.position, {
          x: this.draggedOrb.userData.basePosition.x,
          y: this.draggedOrb.userData.basePosition.y,
          duration: 1,
          ease: 'elastic.out(1, 0.5)'
        })
        this.draggedOrb = null
      }
    })
    
    // Click to explore
    document.querySelectorAll('.orb').forEach((domOrb, index) => {
      domOrb.addEventListener('click', () => {
        this.exploreProject(index)
      })
    })
  }
  
  exploreProject(index) {
    const orb = this.orbs[index]
    const data = orb.userData.data
    
    // Pulse effect
    gsap.to(orb.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    })
    
    // Show project info in cursor
    window.dispatchEvent(new CustomEvent('orb-explore', {
      detail: { name: data.name, meta: data.meta, index }
    }))
  }
  
  update(delta, time) {
    // Update all orbs
    this.orbs.forEach((orb, index) => {
      const { basePosition, velocity } = orb.userData
      
      // Floating animation
      const floatY = Math.sin(time * 0.5 + index) * 0.2
      const floatX = Math.cos(time * 0.3 + index) * 0.1
      
      if (orb !== this.draggedOrb) {
        orb.position.x += (basePosition.x + floatX - orb.position.x) * delta * 2
        orb.position.y += (basePosition.y + floatY - orb.position.y) * delta * 2
      } else {
        orb.position.x += velocity.x
        orb.position.y += velocity.y
        velocity.multiplyScalar(0.95)
      }
      
      // Rotation
      orb.rotation.x += delta * 0.2
      orb.rotation.y += delta * 0.3
      
      // Update glow shader
      orb.children[0].material.uniforms.uTime.value = time
      
      // Sync with DOM
      const domOrb = orb.userData.domElement
      const screenPos = orb.position.clone().project(this.camera)
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight
      
      domOrb.style.transform = `translate(${x - parseFloat(getComputedStyle(domOrb).left)}px, ${y - parseFloat(getComputedStyle(domOrb).top)}px)`
    })
  }
}
