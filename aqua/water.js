import * as THREE from 'three';

// ============================================
// STAGE 2: WATER SYSTEM
// Surface waves, refraction, reflections, current field
// ============================================

// Wave parameters for the surface
const WAVE_PARAMS = [
    { direction: new THREE.Vector2(1, 0.3).normalize(), wavelength: 3.5, amplitude: 0.025, speed: 1.2, phase: 0 },
    { direction: new THREE.Vector2(-0.5, 1).normalize(), wavelength: 2.2, amplitude: 0.018, speed: 0.8, phase: 2.1 },
    { direction: new THREE.Vector2(0.8, -0.6).normalize(), wavelength: 1.5, amplitude: 0.012, speed: 1.5, phase: 4.2 },
    { direction: new THREE.Vector2(-0.3, -0.9).normalize(), wavelength: 4.5, amplitude: 0.008, speed: 0.5, phase: 1.3 }
];

// Ripple data (localized expanding rings from bubbles)
const ripples = [];
const MAX_RIPPLES = 20;

// ---- Water Surface Geometry ----
function createWaterSurface(TANK) {
    const { width, depth, waterLevel, glassThickness } = TANK;
    const innerW = width - 2 * glassThickness - 0.02;
    const innerD = depth - 2 * glassThickness - 0.02;
    
    const segments = 80;
    const geo = new THREE.PlaneGeometry(innerW, innerD, segments, segments);
    geo.rotateX(-Math.PI / 2);
    
    return geo;
}

// ---- Water Shader Material ----
function createWaterMaterial() {
    // Initialize ripples as array of Vector4 for shader array uniform
    const rippleVectors = [];
    for (let i = 0; i < MAX_RIPPLES; i++) {
        rippleVectors.push(new THREE.Vector4(0, 0, -999, 0)); // startTime=-999 means inactive
    }
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uWaterLevel: { value: 4.55 },
            uColorDeep: { value: new THREE.Color(0x0a4a6a) },
            uColorShallow: { value: new THREE.Color(0x2a8a9a) },
            uColorSurface: { value: new THREE.Color(0x4ab8c8) },
            uIOR: { value: 1.333 },
            uOpacity: { value: 0.85 },
            uRipples: { value: rippleVectors },
            uRippleCount: { value: 0 }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uWaterLevel;
            uniform vec4 uRipples[20];
            uniform int uRippleCount;
            
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying float vElevation;
            
            // Wave function
            float waveHeight(vec2 pos, vec2 dir, float wavelength, float amplitude, float speed, float phase) {
                float k = 6.28318 / wavelength;
                float f = k * dot(dir, pos) - speed * uTime + phase;
                return amplitude * sin(f);
            }
            
            vec3 waveNormal(vec2 pos, vec2 dir, float wavelength, float amplitude, float speed, float phase) {
                float k = 6.28318 / wavelength;
                float f = k * dot(dir, pos) - speed * uTime + phase;
                float dx = amplitude * k * dir.x * cos(f);
                float dz = amplitude * k * dir.y * cos(f);
                return normalize(vec3(-dx, 1.0, -dz));
            }
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Base waves
                float totalHeight = 0.0;
                vec3 totalNormal = vec3(0.0, 1.0, 0.0);
                
                // Wave 1
                totalHeight += waveHeight(pos.xz, vec2(0.958, 0.287), 3.5, 0.025, 1.2, 0.0);
                totalNormal += waveNormal(pos.xz, vec2(0.958, 0.287), 3.5, 0.025, 1.2, 0.0);
                
                // Wave 2
                totalHeight += waveHeight(pos.xz, vec2(-0.447, 0.894), 2.2, 0.018, 0.8, 2.1);
                totalNormal += waveNormal(pos.xz, vec2(-0.447, 0.894), 2.2, 0.018, 0.8, 2.1);
                
                // Wave 3
                totalHeight += waveHeight(pos.xz, vec2(0.8, -0.6), 1.5, 0.012, 1.5, 4.2);
                totalNormal += waveNormal(pos.xz, vec2(0.8, -0.6), 1.5, 0.012, 1.5, 4.2);
                
                // Wave 4
                totalHeight += waveHeight(pos.xz, vec2(-0.316, -0.949), 4.5, 0.008, 0.5, 1.3);
                totalNormal += waveNormal(pos.xz, vec2(-0.316, -0.949), 4.5, 0.008, 0.5, 1.3);
                
                // Ripple rings
                for (int i = 0; i < 20; i++) {
                    if (i >= uRippleCount) break;
                    vec4 ripple = uRipples[i];
                    vec2 rPos = ripple.xy;
                    float rTime = uTime - ripple.z;
                    float rStrength = ripple.w;
                    
                    if (rTime > 0.0 && rTime < 3.0) {
                        float dist = distance(pos.xz, rPos);
                        float radius = rTime * 1.5;
                        float ringWidth = 0.4;
                        float ring = exp(-pow((dist - radius) / ringWidth, 2.0));
                        float decay = 1.0 - rTime / 3.0;
                        totalHeight += ring * 0.03 * decay * rStrength;
                        
                        // Approximate normal perturbation
                        vec2 dir = normalize(pos.xz - rPos + vec2(0.001));
                        float slope = ring * 0.03 * decay * rStrength * 2.0;
                        totalNormal += vec3(-dir.x * slope, 0.0, -dir.y * slope);
                    }
                }
                
                pos.y += totalHeight;
                vElevation = totalHeight;
                
                // Meniscus edge effect - slight rise near walls
                float edgeDist = min(min(abs(pos.x) - 3.8, abs(pos.z) - 1.8), 0.0);
                // (handled in fragment for simplicity)
                
                vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                vWorldPos = worldPos.xyz;
                vNormal = normalize(normalMatrix * normalize(totalNormal));
                
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            uniform vec3 uColorDeep;
            uniform vec3 uColorShallow;
            uniform vec3 uColorSurface;
            uniform float uIOR;
            uniform float uOpacity;
            uniform float uTime;
            
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying float vElevation;
            
            void main() {
                vec3 viewDir = normalize(cameraPosition - vWorldPos);
                
                // Fresnel for water surface
                float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
                fresnel = mix(0.04, 1.0, fresnel); // Water F0 ~ 0.02
                
                // Depth-based color (approximate)
                float depthFactor = clamp((4.55 - vWorldPos.y) / 4.55, 0.0, 1.0);
                vec3 waterColor = mix(uColorSurface, uColorDeep, depthFactor * 0.6);
                
                // Add elevation-based highlight
                waterColor += vec3(0.1, 0.15, 0.2) * (vElevation + 0.03) * 5.0;
                
                // Specular highlight
                vec3 lightDir = normalize(vec3(0.3, 1.0, 0.2));
                vec3 halfDir = normalize(lightDir + viewDir);
                float spec = pow(max(dot(vNormal, halfDir), 0.0), 150.0);
                waterColor += vec3(1.0) * spec * 0.8 * (1.0 - fresnel * 0.5);
                
                // Edge meniscus
                float edgeProx = 1.0 - smoothstep(3.5, 3.85, abs(vWorldPos.x));
                edgeProx += 1.0 - smoothstep(1.6, 1.85, abs(vWorldPos.z));
                edgeProx = clamp(edgeProx, 0.0, 0.3);
                waterColor += vec3(0.3, 0.5, 0.6) * edgeProx;
                
                // Subtle caustic-like pattern on surface
                float caustic = sin(vWorldPos.x * 3.0 + uTime) * sin(vWorldPos.z * 3.0 + uTime * 0.7);
                waterColor += vec3(0.05, 0.08, 0.1) * caustic * 0.3;
                
                gl_FragColor = vec4(waterColor, uOpacity * (0.7 + fresnel * 0.3));
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    return material;
}

// ---- Water Body (volume) ----
function createWaterBody(TANK) {
    const { width, depth, waterLevel, glassThickness } = TANK;
    const innerW = width - 2 * glassThickness - 0.02;
    const innerD = depth - 2 * glassThickness - 0.02;
    
    const geo = new THREE.BoxGeometry(innerW, waterLevel - 0.05, innerD);
    
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x1a6a8a,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.9,
        thickness: waterLevel,
        ior: 1.333,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.BackSide
    });
    
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = (waterLevel - 0.05) / 2;
    mesh.name = 'water-body';
    
    return mesh;
}

// ---- Waterline Ring (meniscus) ----
function createWaterline(TANK) {
    const { width, depth, waterLevel, glassThickness } = TANK;
    const innerW = width - 2 * glassThickness;
    const innerD = depth - 2 * glassThickness;
    
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = (innerW / 2) * Math.cos(angle);
        const z = (innerD / 2) * Math.sin(angle);
        points.push(new THREE.Vector3(x, waterLevel, z));
    }
    
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x88ddff,
        transparent: true,
        opacity: 0.3
    });
    
    const line = new THREE.Line(geo, material);
    line.name = 'waterline';
    
    return line;
}

// ---- Current Field ----
// Returns a velocity vector at a given world position
export function getCurrentAt(x, y, z, time, bubbleSourcePos = null) {
    // Gentle base current
    const base = new THREE.Vector3(
        Math.sin(y * 0.5 + time * 0.3) * 0.05,
        0,
        Math.cos(x * 0.4 + time * 0.2) * 0.05
    );
    
    // Localized upward flow around bubble plume
    if (bubbleSourcePos) {
        const dx = x - bubbleSourcePos.x;
        const dy = y - bubbleSourcePos.y;
        const dz = z - bubbleSourcePos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const plumeRadius = 0.8;
        if (dist < plumeRadius && dy > 0 && dy < 4) {
            const influence = 1.0 - dist / plumeRadius;
            const upStrength = 0.15 * influence * (1.0 - dy / 4.5);
            base.y += upStrength;
            // Slight outward push at top
            if (dy > 2.5) {
                base.x += (dx / (dist + 0.1)) * 0.03 * influence;
                base.z += (dz / (dist + 0.1)) * 0.03 * influence;
            }
        }
    }
    
    return base;
}

// ---- Main creation function ----
export function createWater(scene, TANK) {
    const waterGroup = new THREE.Group();
    waterGroup.name = 'water-system';
    
    // Water surface
    const surfaceGeo = createWaterSurface(TANK);
    const surfaceMat = createWaterMaterial();
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.position.y = TANK.waterLevel;
    surface.name = 'water-surface';
    waterGroup.add(surface);
    
    // Water body (volume for refraction)
    const body = createWaterBody(TANK);
    waterGroup.add(body);
    
    // Waterline
    const waterline = createWaterline(TANK);
    waterGroup.add(waterline);
    
    scene.add(waterGroup);
    
    // Store references for animation
    waterGroup.userData = {
        surface,
        surfaceMaterial: surfaceMat,
        body,
        waterline,
        ripples: []
    };
    
    return waterGroup;
}

// ---- Add a ripple (called when bubbles hit surface) ----
export function addRipple(waterGroup, x, z, strength = 1.0, time) {
    const ripples = waterGroup.userData.ripples;
    if (ripples.length >= MAX_RIPPLES) {
        ripples.shift(); // Remove oldest
    }
    ripples.push({ x, z, startTime: time, strength });
}

// ---- Update water (called each frame) ----
export function updateWater(waterGroup, delta, elapsed) {
    const { surfaceMaterial } = waterGroup.userData;
    
    // Update time uniform
    surfaceMaterial.uniforms.uTime.value = elapsed;
    
    // Filter active ripples
    const activeRipples = waterGroup.userData.ripples.filter(r => elapsed - r.startTime < 3.0);
    waterGroup.userData.ripples = activeRipples;
    
    // Update ripple uniforms in place (Vector4 array for shader)
    const rippleVectors = surfaceMaterial.uniforms.uRipples.value;
    for (let i = 0; i < MAX_RIPPLES; i++) {
        if (i < activeRipples.length) {
            const r = activeRipples[i];
            rippleVectors[i].set(r.x, r.z, r.startTime, r.strength);
        } else {
            // Inactive ripple (startTime far in past)
            rippleVectors[i].set(0, 0, -999, 0);
        }
    }
    surfaceMaterial.uniforms.uRippleCount.value = activeRipples.length;
}
