import * as THREE from 'three';

// ============================================
// STAGES 7-10: FISH MODELS
// Guppy, Clownfish, Angelfish, Betta
// ============================================

// ---- Shared: Create glossy eye ----
function createEye(radius = 0.04) {
    const eyeGroup = new THREE.Group();
    
    // Eye white
    const eyeWhite = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 10),
        new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.1,
            metalness: 0.3
        })
    );
    eyeGroup.add(eyeWhite);
    
    // Iris
    const iris = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.7, 12, 10),
        new THREE.MeshStandardMaterial({
            color: 0x1a1a2a,
            roughness: 0.05,
            metalness: 0.8,
            emissive: 0x0a0a1a
        })
    );
    iris.position.z = radius * 0.3;
    eyeGroup.add(iris);
    
    // Pupil
    const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.35, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 })
    );
    pupil.position.z = radius * 0.5;
    eyeGroup.add(pupil);
    
    // Highlight
    const highlight = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.15, 6, 6),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.0,
            metalness: 1.0,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        })
    );
    highlight.position.set(-radius * 0.2, radius * 0.2, radius * 0.4);
    eyeGroup.add(highlight);
    
    return eyeGroup;
}

// ---- Shared: Create a fin (subdivided plane for deformation) ----
function createFin(width, height, segmentsW, segmentsH, color, opts = {}) {
    const geo = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH);
    geo.translate(0, height / 2, 0); // Pivot at base
    
    // Add slight curve
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = y / height;
        pos.setZ(i, pos.getZ(i) + Math.sin(t * Math.PI * 0.5) * (opts.curve || 0.1) * height);
    }
    geo.computeVertexNormals();
    
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: opts.roughness || 0.4,
        metalness: opts.metalness || 0.1,
        side: THREE.DoubleSide,
        transparent: opts.transparent || false,
        opacity: opts.opacity || 1.0
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = {
        originalPos: pos.array.slice(),
        width,
        height
    };
    
    return mesh;
}

// ---- Shared: Animate fin (wave motion traveling from base to tip) ----
function animateFin(mesh, time, speed, phaseOffset = 0, amplitude = 0.1) {
    const { originalPos, height } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
        const y = originalPos[i * 3 + 1];
        const t = y / height;
        
        // Wave travels from base to tip
        const wave = Math.sin(time * speed + phaseOffset - t * 4) * amplitude * t * t;
        
        pos.setX(i, originalPos[i * 3] + wave);
        pos.setZ(i, originalPos[i * 3 + 2] + Math.cos(time * speed * 0.8 + phaseOffset) * amplitude * 0.5 * t);
    }
    
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

// ---- Shared: Create body with undulation support ----
function createFishBody(length, height, width, color, segments = 16) {
    // Ellipsoid-based body, tapered at tail
    const geo = new THREE.SphereGeometry(1, segments * 2, segments);
    geo.scale(length / 2, height / 2, width / 2);
    
    // Taper toward tail (negative X)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const t = (x + length / 2) / length; // 0 at tail, 1 at head
        const taper = Math.pow(t, 0.7);
        pos.setY(i, pos.getY(i) * (0.3 + 0.7 * taper));
        pos.setZ(i, pos.getZ(i) * (0.3 + 0.7 * taper));
    }
    geo.computeVertexNormals();
    
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = {
        originalPos: pos.array.slice(),
        length
    };
    
    return mesh;
}

// ---- Shared: Animate body undulation ----
function animateBodyUndulation(mesh, time, speed, amplitude, phaseOffset = 0) {
    const { originalPos, length } = mesh.userData;
    const pos = mesh.geometry.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
        const x = originalPos[i * 3];
        const t = (x + length / 2) / length; // 0 at tail, 1 at head
        
        // Undulation increases toward tail
        const undulation = Math.sin(time * speed + phaseOffset - t * 6) * amplitude * (1 - t) * (1 - t);
        
        pos.setZ(i, originalPos[i * 3 + 2] + undulation);
    }
    
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

// ============================================
// STAGE 7: FANCY GUPPY
// Small, slender, silver-blue with turquoise patches
// Large triangular fan tail (orange-red with speckles)
// ============================================
export function createGuppy(scene) {
    const group = new THREE.Group();
    group.name = 'guppy';
    
    const bodyLength = 0.5;
    const bodyHeight = 0.22;
    const bodyWidth = 0.18;
    
    // Body - silver-blue base
    const body = createFishBody(bodyLength, bodyHeight, bodyWidth, 0xc0d0e0);
    body.position.x = 0.1;
    group.add(body);
    
    // Turquoise/green iridescent patches (procedural)
    const patchGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const patchMat = new THREE.MeshStandardMaterial({
        color: 0x40e0d0,
        roughness: 0.2,
        metalness: 0.6,
        emissive: 0x20a0a0,
        emissiveIntensity: 0.2
    });
    for (let i = 0; i < 8; i++) {
        const patch = new THREE.Mesh(patchGeo, patchMat);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.15;
        patch.position.set(
            0.1 + Math.cos(angle) * r,
            Math.sin(angle) * r * 0.5,
            (Math.random() - 0.5) * bodyWidth * 0.8
        );
        patch.scale.set(1, 0.5, 0.3);
        group.add(patch);
    }
    
    // Tail base (narrow connection)
    const tailBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0xc0d0e0, roughness: 0.3 })
    );
    tailBase.rotation.z = Math.PI / 2;
    tailBase.position.set(-0.25, 0, 0);
    group.add(tailBase);
    
    // Large triangular fan tail
    const tailGeo = new THREE.ConeGeometry(0.28, 0.4, 3, 1, false, Math.PI * 0.25, Math.PI * 1.5);
    // Better: create a fan shape
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(0.35, -0.25);
    tailShape.quadraticCurveTo(0.4, 0, 0.35, 0.25);
    tailShape.lineTo(0, 0);
    
    const tailExtrude = new THREE.ExtrudeGeometry(tailShape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2
    });
    tailExtrude.translate(-0.02, 0, -0.01);
    
    // Tail material - orange-red with gradient
    const tailMat = new THREE.MeshStandardMaterial({
        color: 0xff6030,
        roughness: 0.4,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const tail = new THREE.Mesh(tailExtrude, tailMat);
    tail.rotation.y = Math.PI / 2;
    tail.position.set(-0.32, 0, 0);
    tail.scale.y = 0.8;
    group.add(tail);
    
    // Tail speckles (dark spots)
    const speckleGeo = new THREE.CircleGeometry(0.015, 6);
    const speckleMat = new THREE.MeshStandardMaterial({
        color: 0x4a2010,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    for (let i = 0; i < 15; i++) {
        const speckle = new THREE.Mesh(speckleGeo, speckleMat);
        const t = Math.random();
        const spread = t * 0.35;
        speckle.position.set(
            -0.32 + (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * spread * 2,
            (Math.random() - 0.5) * spread * 2
        );
        speckle.rotation.y = Math.PI / 2;
        group.add(speckle);
    }
    
    // Tail rays (thin lines)
    const rayMat = new THREE.MeshStandardMaterial({
        color: 0xffa060,
        roughness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    for (let i = 0; i < 5; i++) {
        const ray = new THREE.Mesh(
            new THREE.PlaneGeometry(0.01, 0.3),
            rayMat
        );
        const angle = -0.3 + i * 0.15;
        ray.position.set(-0.34, Math.sin(angle) * 0.12, Math.cos(angle) * 0.12);
        ray.rotation.y = Math.PI / 2;
        ray.rotation.z = angle;
        group.add(ray);
    }
    
    // Dorsal fin
    const dorsalFin = createFin(0.2, 0.18, 4, 6, 0x40c0d0, { curve: 0.15 });
    dorsalFin.position.set(0.05, 0.1, 0);
    dorsalFin.rotation.x = -Math.PI / 2;
    group.add(dorsalFin);
    
    // Pectoral fins (paired)
    const pectoralMat = new THREE.MeshStandardMaterial({
        color: 0x80c0d0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const leftPectoral = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 8),
        pectoralMat
    );
    leftPectoral.position.set(0.2, -0.05, 0.08);
    leftPectoral.rotation.x = Math.PI / 2;
    leftPectoral.rotation.z = 0.5;
    group.add(leftPectoral);
    
    const rightPectoral = leftPectoral.clone();
    rightPectoral.position.z = -0.08;
    rightPectoral.rotation.z = -0.5;
    group.add(rightPectoral);
    
    // Anal fin (underside)
    const analFin = createFin(0.12, 0.1, 3, 4, 0x40c0d0, { curve: 0.1 });
    analFin.position.set(-0.1, -0.08, 0);
    analFin.rotation.x = Math.PI / 2;
    group.add(analFin);
    
    // Eyes
    const leftEye = createEye(0.035);
    leftEye.position.set(0.35, 0.05, 0.06);
    group.add(leftEye);
    
    const rightEye = createEye(0.035);
    rightEye.position.set(0.35, 0.05, -0.06);
    group.add(rightEye);
    
    // Mouth
    const mouth = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a6a5a, roughness: 0.8 })
    );
    mouth.rotation.z = -Math.PI / 2;
    mouth.position.set(0.38, -0.02, 0);
    group.add(mouth);
    
    // Gill line
    const gillGeo = new THREE.TorusGeometry(0.08, 0.005, 6, 12, Math.PI);
    const gill = new THREE.Mesh(gillGeo, new THREE.MeshStandardMaterial({ color: 0x80a0b0, roughness: 0.6 }));
    gill.position.set(0.2, 0, 0);
    gill.rotation.y = Math.PI / 2;
    group.add(gill);
    
    scene.add(group);
    
    return {
        group,
        species: 'guppy',
        body,
        tail,
        dorsalFin,
        analFin,
        leftPectoral,
        rightPectoral,
        length: 0.85, // total length including tail
        update: (time, delta, swimSpeed) => {
            // Body undulation - increases with speed
            animateBodyUndulation(body, time, 8 + swimSpeed * 4, 0.04 * (0.3 + swimSpeed * 0.7));
            
            // Tail movement - large fan sway
            tail.rotation.z = Math.sin(time * 6) * 0.15 * (0.3 + swimSpeed);
            tail.rotation.y = Math.PI / 2 + Math.sin(time * 4) * 0.1 * swimSpeed;
            
            // Dorsal fin flutter
            animateFin(dorsalFin, time, 10, 0, 0.08);
            
            // Anal fin
            animateFin(analFin, time, 8, 1, 0.06);
            
            // Pectoral flutter (independent, always active)
            const flutter = Math.sin(time * 15) * 0.3;
            leftPectoral.rotation.z = 0.5 + flutter;
            rightPectoral.rotation.z = -0.5 - flutter;
        }
    };
}

// ============================================
// STAGE 8: CLOWNFISH
// Fuller orange body, 3 white vertical bands with dark borders
// ============================================
export function createClownfish(scene) {
    const group = new THREE.Group();
    group.name = 'clownfish';
    
    const bodyLength = 0.7;
    const bodyHeight = 0.45;
    const bodyWidth = 0.4;
    
    // Body - orange base
    const body = createFishBody(bodyLength, bodyHeight, bodyWidth, 0xff7020);
    group.add(body);
    
    // White bands with dark borders (procedural via geometry rings)
    // We'll create bands as slightly larger rings around the body
    const bandPositions = [0.15, -0.05, -0.25]; // x positions along body
    const bandMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0,
        roughness: 0.4,
        metalness: 0.1
    });
    const bandBorderMat = new THREE.MeshStandardMaterial({
        color: 0x2a1a0a,
        roughness: 0.6
    });
    
    bandPositions.forEach((bx, bandIdx) => {
        // Band width varies (head band narrower)
        const bandWidth = bandIdx === 0 ? 0.12 : 0.15;
        
        // Create band as a slightly deformed ring
        const bandGeo = new THREE.TorusGeometry(bodyHeight * 0.55, bandWidth / 2, 8, 16);
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.y = Math.PI / 2;
        band.position.set(bx, 0, 0);
        band.scale.z = bodyWidth / (bodyHeight * 1.1);
        group.add(band);
        
        // Dark borders (thin rings at band edges)
        [-bandWidth / 2, bandWidth / 2].forEach(offset => {
            const border = new THREE.Mesh(
                new THREE.TorusGeometry(bodyHeight * 0.56, 0.015, 6, 12),
                bandBorderMat
            );
            border.rotation.y = Math.PI / 2;
            border.position.set(bx + offset * 0.9, 0, 0);
            border.scale.z = bodyWidth / (bodyHeight * 1.1);
            group.add(border);
        });
    });
    
    // Tail fin (rounded fan)
    const tailFin = createFin(0.2, 0.25, 4, 6, 0xff8030, { 
        curve: 0.1,
        transparent: true,
        opacity: 0.95
    });
    tailFin.position.set(-0.35, 0, 0);
    tailFin.rotation.y = Math.PI / 2;
    // Dark edge
    const tailEdge = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.01, 6, 12, Math.PI * 1.5),
        bandBorderMat
    );
    tailEdge.position.set(-0.35, 0, 0);
    tailEdge.rotation.y = Math.PI / 2;
    group.add(tailEdge);
    group.add(tailFin);
    
    // Dorsal fin (large, with dark edge)
    const dorsalFin = createFin(0.35, 0.2, 6, 8, 0xff8030, { curve: 0.12 });
    dorsalFin.position.set(0, 0.22, 0);
    dorsalFin.rotation.x = -Math.PI / 2;
    group.add(dorsalFin);
    
    // Anal fin
    const analFin = createFin(0.2, 0.15, 4, 5, 0xff8030, { curve: 0.1 });
    analFin.position.set(-0.1, -0.18, 0);
    analFin.rotation.x = Math.PI / 2;
    group.add(analFin);
    
    // Pectoral fins (rounded, orange with dark edge)
    const pectoralMat = new THREE.MeshStandardMaterial({
        color: 0xff8030,
        roughness: 0.4,
        side: THREE.DoubleSide
    });
    
    const leftPectoral = new THREE.Mesh(
        new THREE.CircleGeometry(0.08, 10),
        pectoralMat
    );
    leftPectoral.position.set(0.2, -0.1, 0.15);
    leftPectoral.rotation.x = Math.PI / 2;
    leftPectoral.rotation.z = 0.6;
    group.add(leftPectoral);
    
    const rightPectoral = leftPectoral.clone();
    rightPectoral.position.z = -0.15;
    rightPectoral.rotation.z = -0.6;
    group.add(rightPectoral);
    
    // Eyes (larger, expressive)
    const leftEye = createEye(0.05);
    leftEye.position.set(0.32, 0.08, 0.12);
    group.add(leftEye);
    
    const rightEye = createEye(0.05);
    rightEye.position.set(0.32, 0.08, -0.12);
    group.add(rightEye);
    
    // Mouth (small, at front)
    const mouth = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2010, roughness: 0.8 })
    );
    mouth.rotation.z = -Math.PI / 2;
    mouth.position.set(0.38, -0.05, 0);
    group.add(mouth);
    
    // Gill lines
    for (let i = 0; i < 3; i++) {
        const gillLine = new THREE.Mesh(
            new THREE.TorusGeometry(0.12 - i * 0.02, 0.003, 4, 10, Math.PI * 0.8),
            new THREE.MeshStandardMaterial({ color: 0xc05010, roughness: 0.7 })
        );
        gillLine.position.set(0.15 - i * 0.02, 0, 0);
        gillLine.rotation.y = Math.PI / 2;
        group.add(gillLine);
    }
    
    scene.add(group);
    
    return {
        group,
        species: 'clownfish',
        body,
        tailFin,
        dorsalFin,
        analFin,
        leftPectoral,
        rightPectoral,
        length: 1.0,
        update: (time, delta, swimSpeed) => {
            // Body undulation
            animateBodyUndulation(body, time, 6 + swimSpeed * 3, 0.05 * (0.4 + swimSpeed * 0.6));
            
            // Tail fin sway
            tailFin.rotation.z = Math.sin(time * 5) * 0.12 * (0.3 + swimSpeed);
            
            // Dorsal fin wave
            animateFin(dorsalFin, time, 7, 0, 0.06);
            
            // Anal fin
            animateFin(analFin, time, 6, 2, 0.05);
            
            // Pectoral sculling
            const scull = Math.sin(time * 8) * 0.4;
            leftPectoral.rotation.z = 0.6 + scull;
            rightPectoral.rotation.z = -0.6 + scull;
            
            // Subtle gill breathing (scale pulsation on gill area)
            // (visual approximation via slight body scale)
            body.scale.z = 1.0 + Math.sin(time * 3) * 0.02;
        }
    };
}

// ============================================
// STAGE 9: FRESHWATER ANGELFISH
// Tall, laterally compressed, silver with dark vertical bands
// Large triangular dorsal/anal fins, long pelvic filaments
// ============================================
export function createAngelfish(scene) {
    const group = new THREE.Group();
    group.name = 'angelfish';
    
    const bodyLength = 0.5;  // head to tail
    const bodyHeight = 0.6;  // tall body
    const bodyWidth = 0.12;  // laterally compressed (thin)
    
    // Body - tall diamond shape, silver
    const bodyGeo = new THREE.SphereGeometry(1, 20, 16);
    bodyGeo.scale(bodyLength / 2, bodyHeight / 2, bodyWidth / 2);
    
    // Make it more diamond-like (tapered top and bottom)
    const bpos = bodyGeo.attributes.position;
    for (let i = 0; i < bpos.count; i++) {
        const x = bpos.getX(i);
        const y = bpos.getY(i);
        const tx = (x + bodyLength / 2) / bodyLength;
        
        // Diamond profile: narrow at top/bottom center, wide at middle
        const profileTaper = 1 - Math.pow(Math.abs(y) / (bodyHeight / 2), 1.5) * 0.7;
        bpos.setZ(i, bpos.getZ(i) * profileTaper);
        
        // Taper toward tail
        const tailTaper = Math.pow(tx, 0.5);
        bpos.setY(i, bpos.getY(i) * (0.4 + 0.6 * tailTaper));
    }
    bodyGeo.computeVertexNormals();
    
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xc8c8d0,
        roughness: 0.3,
        metalness: 0.4
    });
    
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.userData = {
        originalPos: bpos.array.slice(),
        length: bodyLength
    };
    group.add(body);
    
    // Pearlescent sheen (subtle overlay)
    const sheenMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const sheen = new THREE.Mesh(bodyGeo.clone(), sheenMat);
    sheen.scale.setScalar(1.02);
    group.add(sheen);
    
    // Dark vertical bands (procedural)
    const bandMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.6
    });
    
    const bandPositions = [0.1, -0.05, -0.18];
    bandPositions.forEach(bx => {
        const band = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, bodyHeight * 0.8, bodyWidth * 1.1),
            bandMat
        );
        band.position.set(bx, 0, 0);
        // Curve band to follow body
        band.rotation.z = 0.1;
        group.add(band);
    });
    
    // Large triangular dorsal fin (tall)
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0);
    dorsalShape.lineTo(0.3, 0.7);
    dorsalShape.lineTo(0.5, 0.75);
    dorsalShape.lineTo(-0.2, 0);
    dorsalShape.lineTo(0, 0);
    
    const dorsalGeo = new THREE.ExtrudeGeometry(dorsalShape, {
        depth: 0.02,
        bevelEnabled: false
    });
    
    const dorsalMat = new THREE.MeshStandardMaterial({
        color: 0xb8b8c8,
        roughness: 0.4,
        metalness: 0.3,
        side: THREE.DoubleSide
    });
    
    const dorsalFin = new THREE.Mesh(dorsalGeo, dorsalMat);
    dorsalFin.position.set(0.05, 0.25, 0);
    dorsalFin.rotation.y = Math.PI / 2;
    dorsalFin.rotation.z = -Math.PI / 2;
    dorsalFin.scale.z = 0.8;
    dorsalFin.castShadow = true;
    
    // Store for animation
    const dpos = dorsalGeo.attributes.position;
    dorsalFin.userData = {
        originalPos: dpos.array.slice(),
        height: 0.75
    };
    
    group.add(dorsalFin);
    
    // Large triangular anal fin (tall, below)
    const analFin = dorsalFin.clone();
    analFin.position.set(-0.05, -0.25, 0);
    analFin.rotation.z = Math.PI / 2;
    analFin.scale.y = -1;
    group.add(analFin);
    
    // Fin rays (thin lines on dorsal/anal fins)
    const rayMat = new THREE.MeshStandardMaterial({
        color: 0x8888a0,
        roughness: 0.6,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const rayLen = 0.6 * (1 - Math.abs(t - 0.5) * 0.5);
        
        const ray = new THREE.Mesh(
            new THREE.PlaneGeometry(0.008, rayLen, 1, 4),
            rayMat
        );
        ray.position.set(0.05 + (t - 0.5) * 0.3, 0.25 + rayLen / 2, 0.015);
        ray.rotation.z = -0.3 + t * 0.6;
        ray.userData = { originalPos: ray.geometry.attributes.position.array.slice(), height: rayLen };
        group.add(ray);
        dorsalFin.userData.rays = dorsalFin.userData.rays || [];
        dorsalFin.userData.rays.push(ray);
    }
    
    // Long pelvic fin filaments (two, trailing)
    const filamentGeo = new THREE.PlaneGeometry(0.02, 0.6, 1, 10);
    filamentGeo.translate(0, -0.3, 0);
    
    const filamentMat = new THREE.MeshStandardMaterial({
        color: 0xd0d0e0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    const leftFilament = new THREE.Mesh(filamentGeo, filamentMat);
    leftFilament.position.set(0.15, -0.2, 0.05);
    leftFilament.rotation.x = Math.PI / 2;
    leftFilament.userData = {
        originalPos: filamentGeo.attributes.position.array.slice(),
        length: 0.6
    };
    group.add(leftFilament);
    
    const rightFilament = leftFilament.clone();
    rightFilament.position.z = -0.05;
    group.add(rightFilament);
    
    // Small tail fin
    const tailFin = createFin(0.15, 0.2, 3, 5, 0xc0c0d0, { curve: 0.1, transparent: true, opacity: 0.9 });
    tailFin.position.set(-0.25, 0, 0);
    tailFin.rotation.y = Math.PI / 2;
    group.add(tailFin);
    
    // Thin pectoral fins
    const pectoralMat = new THREE.MeshStandardMaterial({
        color: 0xc0c0d0,
        roughness: 0.4,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const leftPectoral = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 8),
        pectoralMat
    );
    leftPectoral.position.set(0.15, -0.05, 0.06);
    leftPectoral.rotation.x = Math.PI / 2;
    group.add(leftPectoral);
    
    const rightPectoral = leftPectoral.clone();
    rightPectoral.position.z = -0.06;
    group.add(rightPectoral);
    
    // Eyes
    const leftEye = createEye(0.035);
    leftEye.position.set(0.22, 0.1, 0.05);
    group.add(leftEye);
    
    const rightEye = createEye(0.035);
    rightEye.position.set(0.22, 0.1, -0.05);
    group.add(rightEye);
    
    // Small mouth
    const mouth = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.05, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a6a7a, roughness: 0.8 })
    );
    mouth.rotation.z = -Math.PI / 2;
    mouth.position.set(0.28, 0.05, 0);
    group.add(mouth);
    
    scene.add(group);
    
    return {
        group,
        species: 'angelfish',
        body,
        dorsalFin,
        analFin,
        leftFilament,
        rightFilament,
        tailFin,
        leftPectoral,
        rightPectoral,
        length: 0.9,
        height: 1.5, // total height including fins
        update: (time, delta, swimSpeed) => {
            // Gentle body undulation (calm gliding)
            animateBodyUndulation(body, time, 4 + swimSpeed * 2, 0.03 * (0.3 + swimSpeed * 0.5));
            
            // Dorsal fin - gentle wave with rays
            if (dorsalFin.userData.rays) {
                dorsalFin.userData.rays.forEach((ray, i) => {
                    animateFin(ray, time, 3 + swimSpeed, i * 0.3, 0.04);
                });
            }
            dorsalFin.rotation.z = -Math.PI / 2 + Math.sin(time * 2) * 0.05;
            
            // Anal fin
            analFin.rotation.z = Math.PI / 2 + Math.sin(time * 2 + 1) * 0.05;
            
            // Pelvic filaments - flowing curves
            [leftFilament, rightFilament].forEach((fil, idx) => {
                const pos = fil.geometry.attributes.position;
                const orig = fil.userData.originalPos;
                const len = fil.userData.length;
                
                for (let i = 0; i < pos.count; i++) {
                    const y = orig[i * 3 + 1];
                    const t = Math.abs(y) / len; // 0 at base, 1 at tip
                    
                    // Flowing wave, stronger at tip
                    const flow = Math.sin(time * 3 + t * 4 + idx) * 0.15 * t * t;
                    pos.setX(i, orig[i * 3] + flow);
                    pos.setZ(i, orig[i * 3 + 2] + Math.cos(time * 2.5 + t * 3) * 0.1 * t);
                }
                pos.needsUpdate = true;
                fil.geometry.computeVertexNormals();
            });
            
            // Tail fin gentle sway
            tailFin.rotation.z = Math.sin(time * 3) * 0.08 * (0.3 + swimSpeed);
            
            // Pectoral fins - subtle movement
            const pect = Math.sin(time * 4) * 0.2;
            leftPectoral.rotation.z = pect;
            rightPectoral.rotation.z = -pect;
        }
    };
}

// ============================================
// STAGE 10: BETTA FISH
// Elongated deep-blue/violet body, large flowing fins
// Blue-to-magenta/burgundy gradients, scalloped edges
// ============================================
export function createBetta(scene) {
    const group = new THREE.Group();
    group.name = 'betta';
    
    const bodyLength = 0.55;
    const bodyHeight = 0.28;
    const bodyWidth = 0.22;
    
    // Body - deep blue/violet
    const body = createFishBody(bodyLength, bodyHeight, bodyWidth, 0x4030a0);
    body.position.x = 0.05;
    group.add(body);
    
    // Brighter turquoise head
    const headMat = new THREE.MeshStandardMaterial({
        color: 0x30c0d0,
        roughness: 0.25,
        metalness: 0.5,
        emissive: 0x1080a0,
        emissiveIntensity: 0.15
    });
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        headMat
    );
    head.position.set(0.3, 0.02, 0);
    head.scale.set(1.2, 0.9, 1.0);
    group.add(head);
    
    // Subtle scale detail (procedural via small bumps)
    const scaleGeo = new THREE.SphereGeometry(0.015, 4, 4);
    const scaleMat = new THREE.MeshStandardMaterial({
        color: 0x5040b0,
        roughness: 0.4,
        metalness: 0.3
    });
    for (let i = 0; i < 25; i++) {
        const scale = new THREE.Mesh(scaleGeo, scaleMat);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.2;
        scale.position.set(
            Math.cos(angle) * r,
            Math.sin(angle) * r * 0.6,
            (Math.random() - 0.5) * bodyWidth * 0.9
        );
        scale.scale.set(1, 0.4, 0.3);
        group.add(scale);
    }
    
    // Helper: Create flowing fin with gradient and scalloped edge
    function createFloweringFin(width, height, colorStart, colorEnd, opts = {}) {
        // Create shape with scalloped edge
        const shape = new THREE.Shape();
        const scallops = opts.scallops || 5;
        
        shape.moveTo(0, 0);
        
        // Left edge with scallops
        for (let i = 0; i <= scallops; i++) {
            const t = i / scallops;
            const x = -width / 2 + Math.sin(t * Math.PI) * width * 0.3;
            const y = t * height;
            if (i === 0) shape.lineTo(x, y);
            else shape.quadraticCurveTo(
                x - width * 0.1,
                y - height / scallops / 2,
                x,
                y
            );
        }
        
        // Right edge with scallops (back down)
        for (let i = scallops; i >= 0; i--) {
            const t = i / scallops;
            const x = width / 2 - Math.sin(t * Math.PI) * width * 0.3;
            const y = t * height;
            shape.quadraticCurveTo(
                x + width * 0.1,
                y + height / scallops / 2,
                x,
                y
            );
        }
        
        shape.lineTo(0, 0);
        
        const geo = new THREE.ShapeGeometry(shape, 12);
        geo.translate(0, 0, 0);
        
        // Add subdivisions for deformation
        // (ShapeGeometry doesn't subdivide well, so we'll use vertex colors for gradient)
        
        // Gradient material via vertex colors
        const colors = [];
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            const t = Math.max(0, Math.min(1, y / height));
            
            const c = new THREE.Color(colorStart).lerp(new THREE.Color(colorEnd), t);
            colors.push(c.r, c.g, c.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.3,
            metalness: 0.3,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        
        // Store original positions
        mesh.userData = {
            originalPos: pos.array.slice(),
            height,
            width
        };
        
        // Add radial rays
        const rayMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 7; i++) {
            const angle = -Math.PI / 3 + (i / 6) * (Math.PI * 2 / 3);
            const rayLen = height * 0.9;
            const ray = new THREE.Mesh(
                new THREE.PlaneGeometry(0.008, rayLen, 1, 6),
                rayMat
            );
            ray.position.set(
                Math.cos(angle) * rayLen * 0.1,
                rayLen / 2,
                0.005
            );
            ray.rotation.z = angle;
            mesh.add(ray);
        }
        
        return mesh;
    }
    
    // Helper: Animate flowing fin
    function animateFloweringFin(mesh, time, speed, phaseOffset = 0) {
        const { originalPos, height } = mesh.userData;
        const pos = mesh.geometry.attributes.position;
        
        for (let i = 0; i < pos.count; i++) {
            const y = originalPos[i * 3 + 1];
            const t = Math.max(0, y / height);
            
            // Large flowing motion, phase delay toward edges
            const wave1 = Math.sin(time * speed + phaseOffset - t * 3) * 0.12 * t * t;
            const wave2 = Math.cos(time * speed * 0.7 + phaseOffset + t * 2) * 0.08 * t;
            
            pos.setX(i, originalPos[i * 3] + wave1 + wave2);
            pos.setZ(i, originalPos[i * 3 + 2] + Math.sin(time * speed * 0.5 + t * 4) * 0.06 * t * t);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }
    
    // Large flowing caudal (tail) fin
    const tailFin = createFloweringFin(0.5, 0.55, 0x4060ff, 0xc030a0, { scallops: 6 });
    tailFin.position.set(-0.28, 0, 0);
    tailFin.rotation.y = Math.PI / 2;
    group.add(tailFin);
    
    // Large dorsal fin (top)
    const dorsalFin = createFloweringFin(0.4, 0.45, 0x3050e0, 0xa03080, { scallops: 5 });
    dorsalFin.position.set(0.05, 0.12, 0);
    dorsalFin.rotation.x = -Math.PI / 2;
    dorsalFin.rotation.z = -0.3;
    group.add(dorsalFin);
    
    // Large anal fin (bottom)
    const analFin = createFloweringFin(0.35, 0.4, 0x3050e0, 0x802060, { scallops: 5 });
    analFin.position.set(-0.05, -0.12, 0);
    analFin.rotation.x = Math.PI / 2;
    analFin.rotation.z = 0.3;
    group.add(analFin);
    
    // Ventral fins (two small flowing fins below head)
    const ventralMat = new THREE.MeshStandardMaterial({
        color: 0x5060c0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const leftVentral = new THREE.Mesh(
        new THREE.PlaneGeometry(0.03, 0.15, 1, 5),
        ventralMat
    );
    leftVentral.position.set(0.2, -0.1, 0.06);
    leftVentral.rotation.x = Math.PI / 2;
    leftVentral.rotation.z = 0.5;
    leftVentral.userData = { originalPos: leftVentral.geometry.attributes.position.array.slice(), height: 0.15 };
    group.add(leftVentral);
    
    const rightVentral = leftVentral.clone();
    rightVentral.position.z = -0.06;
    rightVentral.rotation.z = -0.5;
    rightVentral.userData = { originalPos: rightVentral.geometry.attributes.position.array.slice(), height: 0.15 };
    group.add(rightVentral);
    
    // Small pectoral fins
    const pectoralMat = new THREE.MeshStandardMaterial({
        color: 0x4050b0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
    });
    
    const leftPectoral = new THREE.Mesh(
        new THREE.CircleGeometry(0.04, 8),
        pectoralMat
    );
    leftPectoral.position.set(0.25, 0, 0.1);
    leftPectoral.rotation.x = Math.PI / 2;
    group.add(leftPectoral);
    
    const rightPectoral = leftPectoral.clone();
    rightPectoral.position.z = -0.1;
    group.add(rightPectoral);
    
    // Eyes (expressive)
    const leftEye = createEye(0.04);
    leftEye.position.set(0.38, 0.05, 0.07);
    group.add(leftEye);
    
    const rightEye = createEye(0.04);
    rightEye.position.set(0.38, 0.05, -0.07);
    group.add(rightEye);
    
    // Mouth (small, upturned)
    const mouth = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.05, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2a6a, roughness: 0.8 })
    );
    mouth.rotation.z = -Math.PI / 2;
    mouth.position.set(0.42, -0.02, 0);
    group.add(mouth);
    
    // Gill details
    const gill = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.004, 6, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x2a2080, roughness: 0.6 })
    );
    gill.position.set(0.25, 0, 0.11);
    gill.rotation.y = Math.PI / 2;
    group.add(gill);
    
    const gill2 = gill.clone();
    gill2.position.z = -0.11;
    group.add(gill2);
    
    scene.add(group);
    
    return {
        group,
        species: 'betta',
        body,
        tailFin,
        dorsalFin,
        analFin,
        leftVentral,
        rightVentral,
        leftPectoral,
        rightPectoral,
        length: 1.2, // total length including flowing fins
        update: (time, delta, swimSpeed) => {
            // Body undulation - slow, graceful
            animateBodyUndulation(body, time, 5 + swimSpeed * 2, 0.04 * (0.3 + swimSpeed * 0.5));
            
            // Large flowing fins - motion travels through with phase delay
            animateFloweringFin(tailFin, time, 4 + swimSpeed * 2, 0);
            animateFloweringFin(dorsalFin, time, 3.5 + swimSpeed * 2, 1);
            animateFloweringFin(analFin, time, 3.5 + swimSpeed * 2, 2);
            
            // Ventral fins - gentle trailing
            [leftVentral, rightVentral].forEach((fin, idx) => {
                animateFin(fin, time, 6, idx, 0.08);
            });
            
            // Pectoral fins - small movements
            const pect = Math.sin(time * 6) * 0.15;
            leftPectoral.rotation.z = pect;
            rightPectoral.rotation.z = -pect;
            
            // Fins get more active with speed
            const finActivity = 0.5 + swimSpeed;
            tailFin.scale.set(1, 1 + swimSpeed * 0.1, 1);
            dorsalFin.scale.set(1, 1 + swimSpeed * 0.08, 1);
        }
    };
}

// ============================================
// MAIN: Create all 4 fish
// ============================================
export function createAllFish(scene) {
    const fishes = [];
    
    fishes.push(createGuppy(scene));
    fishes.push(createClownfish(scene));
    fishes.push(createAngelfish(scene));
    fishes.push(createBetta(scene));
    
    return fishes;
}
