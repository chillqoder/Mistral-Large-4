import * as THREE from 'three';

// ============================================
// STAGE 4: PEBBLE BED
// Dense instanced pebbles with variation, substrate base, height query
// ============================================

const PEBBLE_COUNT = 550;
const LARGE_STONE_COUNT = 8;

// Color palette
const PEBBLE_COLORS = [
    new THREE.Color(0xc4a574), // warm beige
    new THREE.Color(0x8a8a8a), // slate gray
    new THREE.Color(0x3a3a3a), // charcoal
    new THREE.Color(0x6b4a3a), // muted brown
    new THREE.Color(0xd4c4a4), // pale stone
    new THREE.Color(0x9a8a7a), // tan
    new THREE.Color(0x5a5a5a), // dark gray
    new THREE.Color(0xb4a084), // light brown
];

// ---- Create pebble geometries (several shapes) ----
function createPebbleGeometries() {
    const geometries = [];
    
    // Shape 1: Rounded irregular
    const g1 = new THREE.SphereGeometry(1, 8, 6);
    const pos1 = g1.attributes.position;
    for (let i = 0; i < pos1.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos1, i);
        const n = 0.75 + Math.random() * 0.5;
        v.multiplyScalar(n);
        // Flatten bottom slightly
        if (v.y < 0) v.y *= 0.6;
        pos1.setXYZ(i, v.x, v.y, v.z);
    }
    g1.computeVertexNormals();
    geometries.push(g1);
    
    // Shape 2: Elongated
    const g2 = new THREE.SphereGeometry(1, 8, 6);
    const pos2 = g2.attributes.position;
    for (let i = 0; i < pos2.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos2, i);
        v.x *= 1.3 + Math.random() * 0.4;
        v.y *= 0.7;
        v.z *= 0.9 + Math.random() * 0.3;
        if (v.y < 0) v.y *= 0.5;
        pos2.setXYZ(i, v.x, v.y, v.z);
    }
    g2.computeVertexNormals();
    geometries.push(g2);
    
    // Shape 3: Flat disc-like
    const g3 = new THREE.SphereGeometry(1, 8, 6);
    const pos3 = g3.attributes.position;
    for (let i = 0; i < pos3.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos3, i);
        v.x *= 1.2 + Math.random() * 0.5;
        v.y *= 0.4;
        v.z *= 1.1 + Math.random() * 0.4;
        pos3.setXYZ(i, v.x, v.y, v.z);
    }
    g3.computeVertexNormals();
    geometries.push(g3);
    
    // Shape 4: Angular rock
    const g4 = new THREE.DodecahedronGeometry(1, 0);
    const pos4 = g4.attributes.position;
    for (let i = 0; i < pos4.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos4, i);
        const n = 0.7 + Math.random() * 0.6;
        v.multiplyScalar(n);
        if (v.y < 0) v.y *= 0.6;
        pos4.setXYZ(i, v.x, v.y, v.z);
    }
    g4.computeVertexNormals();
    geometries.push(g4);
    
    return geometries;
}

// ---- Substrate height query ----
// Returns approximate ground height at (x, z)
// This is a simplified collision surface
const substrateData = {
    baseHeight: 0.08,
    slopeFactor: 0.03, // rises toward back (negative Z)
    mounds: [] // local height variations
};

export function getSubstrateHeight(x, z, TANK) {
    const { width, depth } = TANK;
    const halfW = width / 2 - 0.3;
    const halfD = depth / 2 - 0.3;
    
    // Base slope: higher at back
    let height = substrateData.baseHeight;
    const zNorm = (z + halfD) / (2 * halfD); // 0 at front, 1 at back
    height += zNorm * substrateData.slopeFactor * 2;
    
    // Add mounds
    for (const mound of substrateData.mounds) {
        const dx = x - mound.x;
        const dz = z - mound.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < mound.radius) {
            const t = 1 - dist / mound.radius;
            height += mound.height * t * t;
        }
    }
    
    return height;
}

// ---- Main creation ----
export function createPebbleBed(scene, TANK) {
    const pebbleGroup = new THREE.Group();
    pebbleGroup.name = 'pebble-bed';
    
    const { width, depth, glassThickness } = TANK;
    const innerW = width - 2 * glassThickness - 0.1;
    const innerD = depth - 2 * glassThickness - 0.1;
    
    // ---- Substrate base layer ----
    const baseGeo = new THREE.BoxGeometry(innerW, 0.15, innerD);
    // Displace vertices for slight slope
    const basePos = baseGeo.attributes.position;
    for (let i = 0; i < basePos.count; i++) {
        const z = basePos.getZ(i);
        const zNorm = (z + innerD / 2) / innerD;
        basePos.setY(i, basePos.getY(i) + zNorm * 0.06);
    }
    baseGeo.computeVertexNormals();
    
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x4a4038,
        roughness: 1.0
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.075;
    base.receiveShadow = true;
    pebbleGroup.add(base);
    
    // ---- Instanced pebbles ----
    const geometries = createPebbleGeometries();
    const material = new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0.05
    });
    
    // Create instanced meshes for each geometry type
    const instancedMeshes = geometries.map(geo => {
        const im = new THREE.InstancedMesh(geo, material, Math.ceil(PEBBLE_COUNT / geometries.length));
        im.castShadow = true;
        im.receiveShadow = true;
        im.name = 'pebble-instance';
        return im;
    });
    
    // Place pebbles
    const dummy = new THREE.Object3D();
    let pebbleIndex = 0;
    
    const placePebble = (x, z, isLarge = false) => {
        const geoIdx = Math.floor(Math.random() * geometries.length);
        const im = instancedMeshes[geoIdx];
        const localIdx = Math.floor(pebbleIndex / geometries.length);
        pebbleIndex++;
        
        if (localIdx >= Math.ceil(PEBBLE_COUNT / geometries.length)) return;
        
        const baseScale = isLarge ? 0.12 + Math.random() * 0.08 : 0.03 + Math.random() * 0.05;
        const flatten = isLarge ? 0.5 + Math.random() * 0.3 : 0.5 + Math.random() * 0.4;
        
        const groundHeight = getSubstrateHeight(x, z, TANK);
        
        dummy.position.set(x, groundHeight + baseScale * flatten * 0.5, z);
        dummy.rotation.set(
            Math.random() * 0.3 - 0.15,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3 - 0.15
        );
        dummy.scale.set(baseScale, baseScale * flatten, baseScale);
        dummy.updateMatrix();
        
        im.setMatrixAt(localIdx, dummy.matrix);
        
        // Random color from palette
        const color = PEBBLE_COLORS[Math.floor(Math.random() * PEBBLE_COLORS.length)];
        const variation = 0.85 + Math.random() * 0.3;
        im.setColorAt(localIdx, color.clone().multiplyScalar(variation));
    };
    
    // Distribute pebbles across the floor
    const halfW = innerW / 2 - 0.15;
    const halfD = innerD / 2 - 0.15;
    
    for (let i = 0; i < PEBBLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 2 * halfW;
        const z = (Math.random() - 0.5) * 2 * halfD;
        placePebble(x, z, false);
    }
    
    // Add larger accent stones
    for (let i = 0; i < LARGE_STONE_COUNT; i++) {
        let x, z, attempts = 0;
        do {
            x = (Math.random() - 0.5) * 2 * (halfW - 0.3);
            z = (Math.random() - 0.5) * 2 * (halfD - 0.3);
            attempts++;
        } while (attempts < 10);
        placePebble(x, z, true);
    }
    
    // Finalize instanced meshes
    instancedMeshes.forEach(im => {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        pebbleGroup.add(im);
    });
    
    // ---- Register mounds for height query ----
    // Castle area mound (back-center)
    substrateData.mounds.push({ x: 0, z: -1.2, radius: 1.2, height: 0.15 });
    // Filter area
    substrateData.mounds.push({ x: TANK.width / 2 - 1.0, z: -TANK.depth / 2 + 0.8, radius: 0.6, height: 0.1 });
    // Plant areas
    substrateData.mounds.push({ x: -TANK.width / 2 + 0.8, z: -TANK.depth / 2 + 0.6, radius: 0.5, height: 0.08 });
    substrateData.mounds.push({ x: -TANK.width / 2 + 0.5, z: TANK.depth / 2 - 0.8, radius: 0.5, height: 0.08 });
    substrateData.mounds.push({ x: TANK.width / 2 - 2.5, z: 0.5, radius: 0.4, height: 0.06 });
    
    scene.add(pebbleGroup);
    
    return pebbleGroup;
}
