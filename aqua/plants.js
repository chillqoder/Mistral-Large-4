import * as THREE from 'three';
import { getCurrentAt } from './water.js';

// ============================================
// STAGE 6: AQUATIC PLANTS
// 4 distinct species: Vallisneria, Anubias, Java Fern, Cabomba
// ============================================

// ---- Shared: Create a curved ribbon leaf ----
function createRibbonLeaf(width, length, segments, color, opts = {}) {
    const geo = new THREE.PlaneGeometry(width, length, 1, segments);
    geo.translate(0, length / 2, 0); // Pivot at base
    
    // Add slight curve
    const pos = geo.attributes.position;
    const curve = opts.curve || 0.3;
    const twist = opts.twist || 0;
    
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = y / length; // 0 at base, 1 at tip
        
        // Bend
        pos.setZ(i, pos.getZ(i) + Math.sin(t * Math.PI * 0.5) * curve * length);
        // Twist
        pos.setX(i, pos.getX(i) + Math.sin(t * Math.PI) * twist);
    }
    geo.computeVertexNormals();
    
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: opts.transparent || false,
        opacity: opts.opacity || 1.0
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    
    // Store original positions for animation
    const originalPos = pos.array.slice();
    mesh.userData = { originalPos, width, length, segments };
    
    return mesh;
}

// ---- Animate a ribbon leaf ----
function animateRibbonLeaf(mesh, time, current, stiffness = 0.5, phaseOffset = 0) {
    const { originalPos, length } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    
    // Get current at leaf position
    const curr = current || new THREE.Vector3();
    
    for (let i = 0; i < pos.count; i++) {
        const y = originalPos[i * 3 + 1];
        const t = y / length; // 0 at base, 1 at tip
        
        // Sway based on current + time, stronger at tip
        const sway = Math.sin(time * 1.5 + phaseOffset + t * 2) * 0.08 * (1 - stiffness);
        const currentSway = curr.x * t * t * stiffness * 2;
        
        pos.setX(i, originalPos[i * 3] + sway + currentSway);
        pos.setZ(i, originalPos[i * 3 + 2] + Math.cos(time * 1.2 + phaseOffset) * 0.05 * t * (1 - stiffness) + curr.z * t * t * stiffness);
        pos.setY(i, originalPos[i * 3 + 1]);
    }
    
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

// ============================================
// PLANT 1: VALLISNERIA
// Long narrow ribbon leaves, rear-corner clump
// ============================================
function createVallisneria(scene, TANK, position) {
    const group = new THREE.Group();
    group.name = 'vallisneria';
    group.position.copy(position);
    
    const leafCount = 10;
    const leaves = [];
    
    for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 0.8 - Math.PI * 0.4;
        const height = 2.5 + Math.random() * 1.5;
        const width = 0.06 + Math.random() * 0.03;
        
        // Color gradient: bright at base, deep at tip
        const color = new THREE.Color();
        color.setHSL(0.35, 0.7, 0.35 + Math.random() * 0.15);
        
        const leaf = createRibbonLeaf(width, height, 12, color, {
            curve: 0.2 + Math.random() * 0.3,
            twist: (Math.random() - 0.5) * 0.3
        });
        
        leaf.rotation.y = angle;
        leaf.rotation.z = (Math.random() - 0.5) * 0.2;
        
        // Central crease (slight V shape)
        const pos = leaf.geometry.attributes.position;
        for (let j = 0; j < pos.count; j++) {
            const x = pos.getX(j);
            const y = pos.getY(j);
            const t = y / height;
            pos.setZ(j, pos.getZ(j) - Math.abs(x) * 0.3 * t);
        }
        leaf.geometry.computeVertexNormals();
        
        group.add(leaf);
        leaves.push({ mesh: leaf, phase: Math.random() * Math.PI * 2, stiffness: 0.3 + Math.random() * 0.2 });
    }
    
    scene.add(group);
    
    return {
        group,
        type: 'vallisneria',
        leaves,
        update: (time, current) => {
            leaves.forEach(l => {
                animateRibbonLeaf(l.mesh, time, current, l.stiffness, l.phase);
            });
        }
    };
}

// ============================================
// PLANT 2: ANUBIAS
// Thick oval leaves with petioles, rhizome above gravel
// ============================================
function createAnubias(scene, TANK, position) {
    const group = new THREE.Group();
    group.name = 'anubias';
    group.position.copy(position);
    
    // Rhizome (horizontal stem above gravel)
    const rhizomeMat = new THREE.MeshStandardMaterial({
        color: 0x4a5a3a,
        roughness: 0.9
    });
    const rhizome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.6, 8),
        rhizomeMat
    );
    rhizome.rotation.z = Math.PI / 2;
    rhizome.position.y = 0.12;
    rhizome.castShadow = true;
    group.add(rhizome);
    
    const leafCount = 7;
    const leaves = [];
    
    for (let i = 0; i < leafCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const t = (i - leafCount / 2) / leafCount;
        
        // Petiole (stalk)
        const petioleLen = 0.3 + Math.random() * 0.4;
        const petiole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.02, petioleLen, 6),
            rhizomeMat
        );
        petiole.position.set(t * 0.5, 0.12 + petioleLen / 2, 0);
        petiole.rotation.z = -side * (0.3 + Math.random() * 0.3);
        group.add(petiole);
        
        // Leaf blade (thick oval)
        const leafW = 0.25 + Math.random() * 0.15;
        const leafH = 0.35 + Math.random() * 0.2;
        
        const leafGeo = new THREE.CircleGeometry(1, 16);
        // Scale to oval
        const lpos = leafGeo.attributes.position;
        for (let j = 0; j < lpos.count; j++) {
            lpos.setX(j, lpos.getX(j) * leafW);
            lpos.setY(j, lpos.getY(j) * leafH);
        }
        leafGeo.computeVertexNormals();
        
        // Central vein
        const veinGeo = new THREE.PlaneGeometry(0.02, leafH * 1.8, 1, 4);
        const veinMat = new THREE.MeshStandardMaterial({
            color: 0x2a4a2a,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const vein = new THREE.Mesh(veinGeo, veinMat);
        vein.position.z = 0.01;
        
        const leafMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.32, 0.6, 0.22 + Math.random() * 0.08),
            roughness: 0.75,
            side: THREE.DoubleSide
        });
        
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        leafMesh.add(vein);
        
        // Position at top of petiole
        const petioleTop = new THREE.Vector3(
            t * 0.5 + side * Math.sin(0.3 + Math.random() * 0.3) * petioleLen * 0.5,
            0.12 + petioleLen,
            (Math.random() - 0.5) * 0.2
        );
        leafMesh.position.copy(petioleTop);
        leafMesh.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        leafMesh.rotation.z = side * (0.2 + Math.random() * 0.3);
        leafMesh.rotation.y = (Math.random() - 0.5) * 0.5;
        
        // Slight curl at edges
        const origPos = leafGeo.attributes.position.array.slice();
        for (let j = 0; j < lpos.count; j++) {
            const x = origPos[j * 3];
            const y = origPos[j * 3 + 1];
            const edgeFactor = Math.abs(x) / leafW;
            lpos.setZ(j, edgeFactor * edgeFactor * 0.05 * Math.sign(y));
        }
        leafGeo.computeVertexNormals();
        
        leafMesh.castShadow = true;
        leafMesh.userData = { 
            originalPos: origPos, 
            leafW, leafH,
            phase: Math.random() * Math.PI * 2,
            stiffness: 0.7 + Math.random() * 0.2,
            pivot: petioleTop.clone()
        };
        
        group.add(leafMesh);
        leaves.push(leafMesh);
    }
    
    scene.add(group);
    
    return {
        group,
        type: 'anubias',
        leaves,
        update: (time, current) => {
            // Anubias: small stiff movements
            leaves.forEach((leaf, i) => {
                const ud = leaf.userData;
                const sway = Math.sin(time * 0.8 + ud.phase) * 0.03;
                const curr = current || new THREE.Vector3();
                
                leaf.rotation.z = (i % 2 === 0 ? -1 : 1) * (0.2 + Math.random() * 0.1) + sway + curr.x * 0.1 * ud.stiffness;
                leaf.rotation.x = -Math.PI / 2 + sway * 0.5;
                leaf.position.y = ud.pivot.y + Math.sin(time * 0.6 + ud.phase) * 0.02;
            });
        }
    };
}

// ============================================
// PLANT 3: JAVA FERN
// Lance-shaped fronds from single base
// ============================================
function createJavaFern(scene, TANK, position) {
    const group = new THREE.Group();
    group.name = 'java-fern';
    group.position.copy(position);
    
    const frondCount = 9;
    const fronds = [];
    
    for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 1.2 - Math.PI * 0.6;
        const height = 0.8 + Math.random() * 0.7;
        const width = 0.12 + Math.random() * 0.06;
        
        // Lance shape: wider in middle, tapered at both ends
        const geo = new THREE.PlaneGeometry(width, height, 2, 14);
        geo.translate(0, height / 2, 0);
        
        const pos = geo.attributes.position;
        const origPos = pos.array.slice();
        
        for (let j = 0; j < pos.count; j++) {
            const y = pos.getY(j);
            const t = y / height; // 0 at base, 1 at tip
            
            // Lance taper: narrow at base, wide in middle, narrow at tip
            const taper = Math.sin(t * Math.PI) * 0.8 + 0.2;
            pos.setX(j, pos.getX(j) * taper);
            
            // Uneven edges
            const wobble = Math.sin(t * Math.PI * 3 + i) * 0.15;
            pos.setX(j, pos.getX(j) + wobble * width * 0.3);
            
            // Slight curve
            pos.setZ(j, Math.sin(t * Math.PI * 0.7) * 0.15 * height);
            
            // Wrinkles
            pos.setZ(j, pos.getZ(j) + Math.sin(t * Math.PI * 5) * 0.02 * width);
        }
        geo.computeVertexNormals();
        
        const color = new THREE.Color().setHSL(0.3 + Math.random() * 0.08, 0.55, 0.28 + Math.random() * 0.12);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const frond = new THREE.Mesh(geo, mat);
        frond.rotation.y = angle;
        frond.rotation.z = (Math.random() - 0.5) * 0.3;
        frond.castShadow = true;
        
        frond.userData = {
            originalPos: origPos,
            height,
            phase: Math.random() * Math.PI * 2,
            stiffness: 0.4 + Math.random() * 0.2,
            delay: i * 0.15 // delayed bending along fronds
        };
        
        group.add(frond);
        fronds.push(frond);
    }
    
    scene.add(group);
    
    return {
        group,
        type: 'java-fern',
        leaves: fronds,
        update: (time, current) => {
            fronds.forEach(f => {
                const ud = f.userData;
                const pos = f.geometry.attributes.position;
                const curr = current || new THREE.Vector3();
                
                for (let j = 0; j < pos.count; j++) {
                    const y = ud.originalPos[j * 3 + 1];
                    const t = y / ud.height;
                    
                    // Delayed bending - stronger at tips
                    const bendTime = time * 1.2 + ud.phase - ud.delay;
                    const bend = Math.sin(bendTime) * 0.1 * t * t;
                    const currBend = curr.x * t * t * t * 1.5;
                    
                    pos.setX(j, ud.originalPos[j * 3] + bend + currBend);
                    pos.setZ(j, ud.originalPos[j * 3 + 2] + Math.cos(bendTime * 0.8) * 0.06 * t * t + curr.z * t * t * t);
                }
                pos.needsUpdate = true;
                f.geometry.computeVertexNormals();
            });
        }
    };
}

// ============================================
// PLANT 4: CABOMBA
// Bushy cluster, fine stems with feathery whorls
// ============================================
function createCabomba(scene, TANK, position) {
    const group = new THREE.Group();
    group.name = 'cabomba';
    group.position.copy(position);
    
    const stemCount = 6;
    const stems = [];
    
    const stemMat = new THREE.MeshStandardMaterial({
        color: 0x5a7a4a,
        roughness: 0.8
    });
    
    const leafletMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.32, 0.6, 0.45),
        roughness: 0.7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    
    for (let s = 0; s < stemCount; s++) {
        const stemHeight = 1.2 + Math.random() * 0.8;
        const stemAngle = (s / stemCount) * Math.PI * 2;
        const lean = 0.2 + Math.random() * 0.3;
        
        // Main stem (curved)
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(Math.cos(stemAngle) * lean * 0.5, stemHeight * 0.4, Math.sin(stemAngle) * lean * 0.5),
            new THREE.Vector3(Math.cos(stemAngle) * lean, stemHeight * 0.8, Math.sin(stemAngle) * lean),
            new THREE.Vector3(Math.cos(stemAngle) * lean * 1.2, stemHeight, Math.sin(stemAngle) * lean * 1.2)
        ]);
        
        const stemGeo = new THREE.TubeGeometry(curve, 20, 0.015, 5, false);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        group.add(stemMesh);
        
        // Feathery whorls along the stem
        const whorlCount = 8;
        const leaflets = [];
        
        for (let w = 0; w < whorlCount; w++) {
            const t = (w + 1) / (whorlCount + 1);
            const point = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            
            // Fan of fine leaflets
            const fanCount = 7;
            for (let f = 0; f < fanCount; f++) {
                const fanAngle = (f / (fanCount - 1) - 0.5) * Math.PI * 0.8;
                const leafletLen = 0.08 + Math.random() * 0.06;
                
                const leafletGeo = new THREE.PlaneGeometry(0.02, leafletLen, 1, 3);
                const leaflet = new THREE.Mesh(leafletGeo, leafletMat.clone());
                
                // Position at whorl point
                const perpAngle = stemAngle + Math.PI / 2 + fanAngle;
                leaflet.position.copy(point);
                leaflet.position.x += Math.cos(perpAngle) * 0.02;
                leaflet.position.z += Math.sin(perpAngle) * 0.02;
                
                // Orient outward
                leaflet.rotation.y = perpAngle;
                leaflet.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
                leaflet.rotation.z = (Math.random() - 0.5) * 0.3;
                
                // Color variation
                leaflet.material.color.setHSL(0.3 + Math.random() * 0.06, 0.55, 0.4 + Math.random() * 0.15);
                
                // Store for animation
                const origPos = leafletGeo.attributes.position.array.slice();
                leaflet.userData = {
                    originalPos: origPos,
                    length: leafletLen,
                    phase: Math.random() * Math.PI * 2,
                    stiffness: 0.2 + Math.random() * 0.3, // very responsive
                    basePos: point.clone(),
                    baseRot: leaflet.rotation.clone()
                };
                
                group.add(leaflet);
                leaflets.push(leaflet);
            }
        }
        
        stems.push({ mesh: stemMesh, leaflets, curve, phase: Math.random() * Math.PI * 2 });
    }
    
    scene.add(group);
    
    return {
        group,
        type: 'cabomba',
        leaves: stems.flatMap(s => s.leaflets),
        update: (time, current) => {
            const curr = current || new THREE.Vector3();
            stems.forEach(stem => {
                stem.leaflets.forEach(leaflet => {
                    const ud = leaflet.userData;
                    const t = ud.basePos.y / 2.0; // approximate height factor
                    
                    // Very responsive to current
                    const sway = Math.sin(time * 2 + ud.phase) * 0.15 * t;
                    const currEffect = curr.x * t * 3 * ud.stiffness;
                    
                    leaflet.rotation.z = ud.baseRot.z + sway + currEffect;
                    leaflet.rotation.x = ud.baseRot.x + Math.cos(time * 1.5 + ud.phase) * 0.1 * t + curr.z * t * 2;
                    
                    // Slight position bob
                    leaflet.position.y = ud.basePos.y + Math.sin(time * 2.5 + ud.phase) * 0.01;
                });
            });
        }
    };
}

// ============================================
// MAIN: Create all 4 plants
// ============================================
export function createAllPlants(scene, TANK) {
    const plants = [];
    const { width, depth, glassThickness } = TANK;
    const halfW = width / 2 - glassThickness - 0.3;
    const halfD = depth / 2 - glassThickness - 0.3;
    
    // Plant 1: Vallisneria - rear-left corner
    const vallisPos = new THREE.Vector3(-halfW + 0.4, 0.1, -halfD + 0.5);
    plants.push(createVallisneria(scene, TANK, vallisPos));
    
    // Plant 2: Anubias - foreground-left (low)
    const anubiasPos = new THREE.Vector3(-halfW + 0.8, 0.1, halfD - 0.8);
    plants.push(createAnubias(scene, TANK, anubiasPos));
    
    // Plant 3: Java Fern - mid-right
    const javaFernPos = new THREE.Vector3(halfW - 1.5, 0.1, 0.3);
    plants.push(createJavaFern(scene, TANK, javaFernPos));
    
    // Plant 4: Cabomba - back-right (near filter but not blocking)
    const cabombaPos = new THREE.Vector3(halfW - 2.2, 0.1, -halfD + 1.2);
    plants.push(createCabomba(scene, TANK, cabombaPos));
    
    return plants;
}

// ---- Update all plants ----
export function updatePlants(plants, delta, elapsed, bubbleSourcePos = null) {
    plants.forEach(plant => {
        // Get current at plant position
        const worldPos = new THREE.Vector3();
        plant.group.getWorldPosition(worldPos);
        const current = getCurrentAt(worldPos.x, worldPos.y + 0.5, worldPos.z, elapsed, bubbleSourcePos);
        
        plant.update(elapsed, current);
    });
}
