import * as THREE from 'three';
import { getCurrentAt } from './water.js';

// ============================================
// STAGE 14: LIGHTING, CAUSTICS, PARTICLES
// Animated caustics, suspended particles, aquarium light
// ============================================

const PARTICLE_COUNT = 150;
const CAUSTIC_TEXTURE_SIZE = 512;

// ---- Create animated caustics texture ----
function createCausticsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = CAUSTIC_TEXTURE_SIZE;
    canvas.height = CAUSTIC_TEXTURE_SIZE;
    const ctx = canvas.getContext('2d');
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    
    return { texture, canvas, ctx };
}

// ---- Update caustics texture (procedural pattern) ----
function updateCausticsTexture(caustics, time) {
    const { canvas, ctx, texture } = caustics;
    const size = CAUSTIC_TEXTURE_SIZE;
    
    // Clear with transparent
    ctx.clearRect(0, 0, size, size);
    
    // Draw caustic pattern using overlapping sine waves
    const layers = 3;
    for (let layer = 0; layer < layers; layer++) {
        const freq = 8 + layer * 4;
        const speed = 0.3 + layer * 0.2;
        const phase = time * speed + layer * 2;
        
        ctx.globalCompositeOperation = 'lighter';
        
        // Create grid of bright spots
        const cellSize = size / freq;
        for (let x = 0; x < freq + 1; x++) {
            for (let y = 0; y < freq + 1; y++) {
                const px = x * cellSize + Math.sin(time * 0.5 + y * 0.5) * 20;
                const py = y * cellSize + Math.cos(time * 0.4 + x * 0.3) * 20;
                
                // Caustic intensity (network pattern)
                const dist1 = Math.sin(px * 0.05 + phase) * Math.sin(py * 0.05 + phase * 1.3);
                const dist2 = Math.sin((px + py) * 0.03 + phase * 0.7);
                const intensity = Math.max(0, dist1 * dist2) * 0.5 + 0.1;
                
                if (intensity > 0.05) {
                    const gradient = ctx.createRadialGradient(px, py, 0, px, py, cellSize * 0.8);
                    gradient.addColorStop(0, `rgba(255, 255, 220, ${intensity * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 220, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(px - cellSize, py - cellSize, cellSize * 2, cellSize * 2);
                }
            }
        }
    }
    
    // Add some flowing lines
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const yOffset = i * size / 5 + Math.sin(time + i) * 30;
        for (let x = 0; x < size; x += 10) {
            const y = yOffset + Math.sin(x * 0.02 + time * 0.5 + i) * 20;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    texture.needsUpdate = true;
}

// ---- Create caustics projector (light with texture) ----
function createCausticsLight(scene, TANK) {
    const caustics = createCausticsTexture();
    
    // Spotlight from above, projecting caustics downward
    const spotLight = new THREE.SpotLight(0xffffee, 0.6);
    spotLight.position.set(0, TANK.height + 2, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    spotLight.distance = 20;
    spotLight.map = caustics.texture;
    spotLight.castShadow = false;
    
    // Target the center of the tank
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    
    let frameCount = 0;
    
    return {
        light: spotLight,
        caustics,
        update: (time) => {
            // Throttle caustics texture update to every 2 frames for performance
            frameCount++;
            if (frameCount % 2 === 0) {
                updateCausticsTexture(caustics, time);
            }
            // Subtle light movement (cheap, update every frame)
            spotLight.position.x = Math.sin(time * 0.2) * 0.5;
            spotLight.position.z = Math.cos(time * 0.15) * 0.5;
        }
    };
}

// ---- Create aquarium light fixture (LED hood) ----
function createAquariumHood(scene, TANK) {
    const hoodGroup = new THREE.Group();
    hoodGroup.name = 'aquarium-hood';
    
    const hoodMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.4,
        metalness: 0.6
    });
    
    // Hood body
    const hood = new THREE.Mesh(
        new THREE.BoxGeometry(TANK.width + 0.4, 0.15, TANK.depth + 0.4),
        hoodMat
    );
    hood.position.y = TANK.height + 0.3;
    hood.castShadow = true;
    hoodGroup.add(hood);
    
    // LED strip (emissive)
    const ledMat = new THREE.MeshStandardMaterial({
        color: 0xfffff0,
        emissive: 0xffffee,
        emissiveIntensity: 2.0,
        roughness: 0.2
    });
    
    const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(TANK.width - 0.2, 0.05, TANK.depth - 0.2),
        ledMat
    );
    ledStrip.position.y = TANK.height + 0.2;
    hoodGroup.add(ledStrip);
    
    // Small LED dots
    const ledDotGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8);
    const ledDotMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfffff0,
        emissiveIntensity: 3.0
    });
    
    for (let x = -2; x <= 2; x++) {
        for (let z = -1; z <= 1; z++) {
            const dot = new THREE.Mesh(ledDotGeo, ledDotMat);
            dot.position.set(x * 0.8, TANK.height + 0.18, z * 0.8);
            hoodGroup.add(dot);
        }
    }
    
    // Hood legs/supports
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const legPositions = [
        [-TANK.width / 2 - 0.1, TANK.height + 0.15, -TANK.depth / 2 - 0.1],
        [TANK.width / 2 + 0.1, TANK.height + 0.15, -TANK.depth / 2 - 0.1],
        [-TANK.width / 2 - 0.1, TANK.height + 0.15, TANK.depth / 2 + 0.1],
        [TANK.width / 2 + 0.1, TANK.height + 0.15, TANK.depth / 2 + 0.1]
    ];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, hoodMat);
        leg.position.set(...pos);
        hoodGroup.add(leg);
    });
    
    scene.add(hoodGroup);
    return hoodGroup;
}

// ---- Create suspended particle system ----
function createParticles(scene, TANK) {
    const particleGroup = new THREE.Group();
    particleGroup.name = 'particles';
    
    // Particle geometry (single point, will be instanced)
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    
    const halfW = TANK.width / 2 - TANK.glassThickness - 0.2;
    const halfD = TANK.depth / 2 - TANK.glassThickness - 0.2;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2 * halfW;
        positions[i * 3 + 1] = 0.2 + Math.random() * (TANK.waterLevel - 0.5);
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2 * halfD;
        
        velocities[i * 3] = (Math.random() - 0.5) * 0.1;
        velocities[i * 3 + 1] = 0.02 + Math.random() * 0.05; // slow rise
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        
        sizes[i] = 0.01 + Math.random() * 0.02;
        phases[i] = Math.random() * Math.PI * 2;
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    
    // Shader material for soft round particles
    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float size;
            attribute float phase;
            uniform float uTime;
            uniform float uPixelRatio;
            varying float vAlpha;
            
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                
                // Gentle wobble
                float wobble = sin(uTime * 0.5 + phase) * 0.1;
                
                gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                
                // Fade with depth
                vAlpha = 0.3 + wobble * 0.2;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            
            void main() {
                // Soft round particle
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                if (dist > 0.5) discard;
                
                float alpha = (1.0 - dist * 2.0) * vAlpha;
                gl_FragColor = vec4(0.9, 0.95, 1.0, alpha * 0.4);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(particleGeo, particleMat);
    particleGroup.add(points);
    
    scene.add(particleGroup);
    
    return {
        group: particleGroup,
        points,
        velocities,
        update: (delta, elapsed, bubbleSourcePos) => {
            particleMat.uniforms.uTime.value = elapsed;
            
            const pos = particleGeo.attributes.position.array;
            const vel = velocities;
            
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                // Get water current
                const current = getCurrentAt(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], elapsed, bubbleSourcePos);
                
                // Apply velocity + current
                pos[i * 3] += (vel[i * 3] + current.x) * delta;
                pos[i * 3 + 1] += (vel[i * 3 + 1] + current.y * 0.5) * delta;
                pos[i * 3 + 2] += (vel[i * 3 + 2] + current.z) * delta;
                
                // Wrap around bounds
                if (pos[i * 3 + 1] > TANK.waterLevel - 0.1) {
                    pos[i * 3 + 1] = 0.2;
                }
                if (pos[i * 3] > halfW) pos[i * 3] = -halfW;
                if (pos[i * 3] < -halfW) pos[i * 3] = halfW;
                if (pos[i * 3 + 2] > halfD) pos[i * 3 + 2] = -halfD;
                if (pos[i * 3 + 2] < -halfD) pos[i * 3 + 2] = halfD;
            }
            
            particleGeo.attributes.position.needsUpdate = true;
        }
    };
}

// ---- Create volumetric light shafts (subtle) ----
function createLightShafts(scene, TANK) {
    const shaftGroup = new THREE.Group();
    shaftGroup.name = 'light-shafts';
    
    // Create a few translucent cones from the light down into the water
    const shaftGeo = new THREE.ConeGeometry(1.5, TANK.waterLevel + 1, 16, 1, true);
    
    const shaftMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xfff8e0) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vY;
            void main() {
                vUv = uv;
                vY = position.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            varying float vY;
            
            void main() {
                // Fade toward edges and bottom
                float edgeFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
                float depthFade = 1.0 - vUv.y * 0.5;
                float flicker = 0.9 + sin(uTime * 2.0) * 0.05;
                
                float alpha = edgeFade * depthFade * flicker * 0.04;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    // Create 2-3 shafts at different positions
    const shaftPositions = [
        { x: -1.5, z: -0.5, scale: 1.0 },
        { x: 1.0, z: 0.5, scale: 0.7 },
        { x: 0, z: 0, scale: 1.2 }
    ];
    
    shaftPositions.forEach((pos, i) => {
        const shaft = new THREE.Mesh(shaftGeo, shaftMat.clone());
        shaft.position.set(pos.x, (TANK.waterLevel + 1) / 2, pos.z);
        shaft.scale.set(pos.scale, 1, pos.scale * 0.6);
        shaft.rotation.x = Math.PI; // point down
        shaft.userData.phase = i * 2;
        shaftGroup.add(shaft);
    });
    
    scene.add(shaftGroup);
    
    return {
        group: shaftGroup,
        update: (time) => {
            shaftGroup.children.forEach(shaft => {
                shaft.material.uniforms.uTime.value = time + shaft.userData.phase;
                // Subtle sway
                shaft.rotation.z = Math.sin(time * 0.3 + shaft.userData.phase) * 0.02;
            });
        }
    };
}

// ---- Main: Create all lighting effects ----
export function createLightingEffects(scene, TANK) {
    const effects = {};
    
    // Aquarium hood (light fixture)
    effects.hood = createAquariumHood(scene, TANK);
    
    // Caustics projector
    effects.caustics = createCausticsLight(scene, TANK);
    
    // Light shafts
    effects.shafts = createLightShafts(scene, TANK);
    
    // Particles
    effects.particles = createParticles(scene, TANK);
    
    return {
        ...effects,
        update: (delta, elapsed, bubbleSourcePos) => {
            effects.caustics.update(elapsed);
            effects.shafts.update(elapsed);
            effects.particles.update(delta, elapsed, bubbleSourcePos);
        }
    };
}
