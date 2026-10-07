import * as THREE from 'three';
import { getCurrentAt, addRipple } from './water.js';

// ============================================
// STAGE 3: BUBBLE FILTER + BUBBLE PLUME
// ============================================

const BUBBLE_POOL_SIZE = 80;
const BUBBLE_EMIT_RATE = 14; // bubbles per second

// ---- Filter Model ----
export function createFilter(scene, TANK) {
    const filterGroup = new THREE.Group();
    filterGroup.name = 'bubble-filter';
    
    // Position: back-right bottom
    filterGroup.position.set(TANK.width / 2 - 1.0, 0.3, -TANK.depth / 2 + 0.8);
    
    const blackMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const darkGrayMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.2
    });
    
    // Weighted base
    const baseGeo = new THREE.BoxGeometry(0.7, 0.15, 0.6);
    const base = new THREE.Mesh(baseGeo, blackMat);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    filterGroup.add(base);
    
    // Sponge body (rounded rectangular)
    const spongeGeo = new THREE.BoxGeometry(0.5, 0.8, 0.45);
    // Round the edges slightly
    const sponge = new THREE.Mesh(spongeGeo, darkGrayMat);
    sponge.position.y = 0.15 + 0.4;
    sponge.castShadow = true;
    sponge.receiveShadow = true;
    filterGroup.add(sponge);
    
    // Sponge grooves (horizontal lines)
    const grooveMat = new THREE.MeshStandardMaterial({
        color: 0x151515,
        roughness: 1.0
    });
    for (let i = 0; i < 4; i++) {
        const groove = new THREE.Mesh(
            new THREE.BoxGeometry(0.52, 0.03, 0.47),
            grooveMat
        );
        groove.position.y = 0.15 + 0.15 + i * 0.18;
        filterGroup.add(groove);
    }
    
    // Porous surface detail (small dots)
    const poreGeo = new THREE.SphereGeometry(0.015, 4, 4);
    const poreMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });
    const porePositions = [];
    for (let i = 0; i < 30; i++) {
        porePositions.push([
            (Math.random() - 0.5) * 0.45,
            0.15 + Math.random() * 0.7,
            0.225 + (Math.random() > 0.5 ? 0.01 : -0.01)
        ]);
    }
    porePositions.forEach(pos => {
        const pore = new THREE.Mesh(poreGeo, poreMat);
        pore.position.set(...pos);
        filterGroup.add(pore);
    });
    
    // Airlift tube (vertical, dark)
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 12);
    const tube = new THREE.Mesh(tubeGeo, blackMat);
    tube.position.set(0.15, 0.15 + 0.5, 0);
    tube.castShadow = true;
    filterGroup.add(tube);
    
    // Airlift outlet (angled at top)
    const outletGeo = new THREE.CylinderGeometry(0.05, 0.035, 0.2, 12);
    const outlet = new THREE.Mesh(outletGeo, blackMat);
    outlet.position.set(0.15 + 0.06, 0.15 + 1.02, 0);
    outlet.rotation.z = -Math.PI / 6;
    outlet.castShadow = true;
    filterGroup.add(outlet);
    
    // Outlet opening (where bubbles come out)
    const outletTipGeo = new THREE.TorusGeometry(0.035, 0.008, 8, 12);
    const outletTip = new THREE.Mesh(outletTipGeo, blackMat);
    outletTip.position.set(0.15 + 0.1, 0.15 + 1.08, 0);
    outletTip.rotation.z = -Math.PI / 6;
    outletTip.rotation.x = Math.PI / 2;
    filterGroup.add(outletTip);
    
    // Airline hose (thin tube going up and over the back rim)
    const hosePoints = [
        new THREE.Vector3(-0.2, 0.3, -0.15),
        new THREE.Vector3(-0.2, 0.8, -0.15),
        new THREE.Vector3(-0.2, 1.5, -0.15),
        new THREE.Vector3(-0.15, 2.5, -0.15),
        new THREE.Vector3(-0.15, TANK.height - 0.1, -0.15),
        new THREE.Vector3(-0.15, TANK.height + 0.05, -0.15),
        new THREE.Vector3(-0.15, TANK.height + 0.05, -TANK.depth / 2 - 0.3)
    ];
    const hoseCurve = new THREE.CatmullRomCurve3(hosePoints);
    const hoseGeo = new THREE.TubeGeometry(hoseCurve, 30, 0.015, 6, false);
    const hoseMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.8
    });
    const hose = new THREE.Mesh(hoseGeo, hoseMat);
    hose.castShadow = true;
    filterGroup.add(hose);
    
    // Suction cups at base
    const suctionGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.03, 12);
    const suctionMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    [[-0.25, -0.15], [0.25, -0.15], [-0.25, 0.15], [0.25, 0.15]].forEach(([sx, sz]) => {
        const suction = new THREE.Mesh(suctionGeo, suctionMat);
        suction.position.set(sx, 0.02, sz);
        suction.rotation.x = Math.PI / 2;
        filterGroup.add(suction);
    });
    
    scene.add(filterGroup);
    
    // Bubble outlet world position (approximate, will be updated)
    const outletWorldPos = new THREE.Vector3();
    filterGroup.updateMatrixWorld();
    outlet.getWorldPosition(outletWorldPos);
    // Adjust to the tip
    outletWorldPos.x += 0.08;
    outletWorldPos.y += 0.05;
    
    return {
        group: filterGroup,
        outletPos: outletWorldPos
    };
}

// ---- Bubble System (pooled) ----
export function createBubbleSystem(scene, TANK, filterOutletPos) {
    const bubbleGroup = new THREE.Group();
    bubbleGroup.name = 'bubbles';
    
    // Bubble material - clear with highlights
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.1,
        ior: 1.02,
        transparent: true,
        opacity: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
    });
    
    // Single bubble geometry (slightly irregular sphere)
    const bubbleGeo = new THREE.SphereGeometry(1, 12, 10);
    // Slightly deform for organic shape
    const positions = bubbleGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(positions, i);
        const noise = 0.9 + Math.random() * 0.2;
        v.multiplyScalar(noise);
        positions.setXYZ(i, v.x, v.y, v.z);
    }
    bubbleGeo.computeVertexNormals();
    
    // Create pool
    const bubbles = [];
    for (let i = 0; i < BUBBLE_POOL_SIZE; i++) {
        const mesh = new THREE.Mesh(bubbleGeo, bubbleMaterial.clone());
        mesh.visible = false;
        mesh.scale.setScalar(0.001);
        bubbleGroup.add(mesh);
        bubbles.push({
            mesh,
            active: false,
            life: 0,
            maxLife: 0,
            radius: 0.02,
            riseSpeed: 0.8,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleAmp: 0.02 + Math.random() * 0.02,
            driftX: (Math.random() - 0.5) * 0.3,
            driftZ: (Math.random() - 0.5) * 0.3,
            startPos: new THREE.Vector3()
        });
    }
    
    scene.add(bubbleGroup);
    
    return {
        group: bubbleGroup,
        bubbles,
        emitTimer: 0,
        outletPos: filterOutletPos.clone()
    };
}

// ---- Update bubbles ----
export function updateBubbles(bubbleSystem, delta, elapsed, TANK, waterSystem) {
    const { bubbles, outletPos } = bubbleSystem;
    
    // Emit new bubbles
    bubbleSystem.emitTimer += delta * BUBBLE_EMIT_RATE;
    while (bubbleSystem.emitTimer >= 1) {
        bubbleSystem.emitTimer -= 1;
        
        // Find inactive bubble
        const bubble = bubbles.find(b => !b.active);
        if (bubble) {
            activateBubble(bubble, outletPos, elapsed, TANK);
        }
    }
    
    // Update active bubbles
    bubbles.forEach(bubble => {
        if (!bubble.active) return;
        
        bubble.life += delta;
        
        // Check if reached water surface
        const mesh = bubble.mesh;
        if (mesh.position.y >= TANK.waterLevel - bubble.radius) {
            // Trigger ripple at surface
            addRipple(waterSystem, mesh.position.x, mesh.position.z, 0.5 + Math.random() * 0.5, elapsed);
            deactivateBubble(bubble);
            return;
        }
        
        // Buoyancy + current
        const current = getCurrentAt(mesh.position.x, mesh.position.y, mesh.position.z, elapsed, outletPos);
        
        // Rise with buoyancy
        mesh.position.y += (bubble.riseSpeed + current.y) * delta;
        
        // Wobble
        const wobble = Math.sin(elapsed * 3 + bubble.wobblePhase) * bubble.wobbleAmp;
        mesh.position.x = bubble.startPos.x + wobble + current.x * bubble.life + bubble.driftX * delta * 2;
        mesh.position.z = bubble.startPos.z + Math.cos(elapsed * 2.5 + bubble.wobblePhase) * bubble.wobbleAmp * 0.7 + current.z * bubble.life + bubble.driftZ * delta * 2;
        
        // Plume widening - slight outward drift as they rise
        const heightFactor = mesh.position.y / TANK.waterLevel;
        mesh.position.x += (mesh.position.x - outletPos.x) * 0.001;
        mesh.position.z += (mesh.position.z - outletPos.z) * 0.001;
        
        // Slight scale pulsation
        const pulse = 1.0 + Math.sin(elapsed * 4 + bubble.wobblePhase) * 0.05;
        mesh.scale.setScalar(bubble.radius * pulse);
        
        // Fade in/out
        const fadeIn = Math.min(bubble.life / 0.2, 1.0);
        const fadeOut = Math.max(0, 1.0 - (mesh.position.y - (TANK.waterLevel - 0.5)) / 0.5);
        mesh.material.opacity = 0.4 * fadeIn * Math.min(fadeOut, 1.0);
    });
}

function activateBubble(bubble, outletPos, elapsed, TANK) {
    bubble.active = true;
    bubble.life = 0;
    bubble.radius = 0.015 + Math.random() * 0.025; // mostly small, occasional larger
    if (Math.random() < 0.15) bubble.radius *= 1.5; // 15% chance of larger bubble
    bubble.riseSpeed = 0.6 + Math.random() * 0.5;
    bubble.wobblePhase = Math.random() * Math.PI * 2;
    bubble.wobbleAmp = 0.015 + Math.random() * 0.025;
    bubble.driftX = (Math.random() - 0.5) * 0.2;
    bubble.driftZ = (Math.random() - 0.5) * 0.2;
    
    bubble.startPos.copy(outletPos);
    bubble.startPos.x += (Math.random() - 0.5) * 0.03;
    bubble.startPos.z += (Math.random() - 0.5) * 0.03;
    
    bubble.mesh.position.copy(bubble.startPos);
    bubble.mesh.visible = true;
    bubble.mesh.scale.setScalar(bubble.radius);
    bubble.mesh.material.opacity = 0;
}

function deactivateBubble(bubble) {
    bubble.active = false;
    bubble.mesh.visible = false;
    bubble.mesh.scale.setScalar(0.001);
}
