import * as THREE from 'three';
import { getSubstrateHeight } from './pebbles.js';

// ============================================
// STAGE 13: SNAILS
// Snail A: Bottom crawler (amber-brown spiral shell)
// Snail B: Glass crawler (olive/cream shell with stripes)
// ============================================

// ---- Shared: Create spiral shell ----
function createSpiralShell(radius, height, color, opts = {}) {
    const group = new THREE.Group();
    
    const turns = opts.turns || 2.5;
    const segments = opts.segments || 32;
    const tubularSegments = Math.max(1, Math.ceil(segments * turns));
    const points = [];
    
    // Create spiral path
    for (let i = 0; i <= tubularSegments; i++) {
        const t = i / tubularSegments;
        const angle = t * turns * Math.PI * 2;
        const r = radius * (0.2 + 0.8 * t);
        const y = height * t;
        points.push(new THREE.Vector3(
            Math.cos(angle) * r,
            y,
            Math.sin(angle) * r
        ));
    }
    
    // Create tube along spiral
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius * 0.4, 12, false);
    
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.05
    });
    
    const shell = new THREE.Mesh(tubeGeo, mat);
    shell.castShadow = true;
    shell.receiveShadow = true;
    
    // Growth bands
    if (opts.bands) {
        const bandMat = new THREE.MeshStandardMaterial({
            color: opts.bandColor || 0x8a6a4a,
            roughness: 0.9
        });
        
        for (let i = 1; i < turns * 4; i++) {
            const t = i / (turns * 4);
            const point = curve.getPoint(t);
            const band = new THREE.Mesh(
                new THREE.TorusGeometry(radius * 0.45, 0.008, 6, 16),
                bandMat
            );
            band.position.copy(point);
            // Orient along tube
            const tangent = curve.getTangent(t);
            band.lookAt(point.clone().add(tangent));
            band.rotation.x += Math.PI / 2;
            group.add(band);
        }
    }
    
    // Stripes/speckles
    if (opts.stripes) {
        const stripeMat = new THREE.MeshStandardMaterial({
            color: opts.stripeColor || 0x4a3a2a,
            roughness: 0.8
        });
        
        for (let i = 0; i < (opts.stripeCount ?? 8); i++) {
            const t = Math.random();
            const point = curve.getPoint(t);
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.06, 0.04),
                stripeMat
            );
            stripe.position.copy(point);
            stripe.position.y += radius * 0.3;
            stripe.rotation.y = Math.random() * Math.PI;
            group.add(stripe);
        }
    }
    
    // Shell opening (aperture)
    const apertureGeo = new THREE.CircleGeometry(radius * 0.45, 16);
    const apertureMat = new THREE.MeshStandardMaterial({
        color: 0x3a2a20,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const aperture = new THREE.Mesh(apertureGeo, apertureMat);
    const endPoint = curve.getPoint(1);
    const endTangent = curve.getTangent(1);
    aperture.position.copy(endPoint);
    aperture.lookAt(endPoint.clone().add(endTangent));
    aperture.rotation.x += Math.PI / 2;
    group.add(aperture);
    
    group.add(shell);
    
    return group;
}

// ---- Shared: Create snail body ----
function createSnailBody(length, color) {
    const group = new THREE.Group();
    
    // Foot (broad muscular base)
    const footGeo = new THREE.BoxGeometry(length, 0.04, 0.12);
    // Round the foot
    const fpos = footGeo.attributes.position;
    for (let i = 0; i < fpos.count; i++) {
        const x = fpos.getX(i);
        const z = fpos.getZ(i);
        const edgeFactor = 1 - Math.pow(Math.abs(z) / 0.06, 2) * 0.5;
        fpos.setY(i, fpos.getY(i) * edgeFactor);
    }
    footGeo.computeVertexNormals();
    
    const footMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9
    });
    
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.y = 0.02;
    group.add(foot);
    
    // Body (elongated soft body above foot)
    const bodyGeo = new THREE.CylinderGeometry(0.06, 0.08, length * 0.7, 8);
    bodyGeo.rotateZ(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.85
    });
    
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(-length * 0.15, 0.08, 0);
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        bodyMat
    );
    head.position.set(-length * 0.45, 0.1, 0);
    head.scale.set(1, 0.8, 0.8);
    group.add(head);
    
    // Tentacles (two fine)
    const tentacleGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.12, 4);
    const tentacleMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8
    });
    
    const leftTentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
    leftTentacle.position.set(-length * 0.5, 0.15, 0.03);
    leftTentacle.rotation.z = -0.5;
    group.add(leftTentacle);
    
    const rightTentacle = leftTentacle.clone();
    rightTentacle.position.z = -0.03;
    rightTentacle.rotation.z = 0.5;
    group.add(rightTentacle);
    
    // Tentacle tips (slightly darker)
    const tipGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.8 });
    
    const leftTip = new THREE.Mesh(tipGeo, tipMat);
    leftTip.position.set(-length * 0.55, 0.2, 0.03);
    group.add(leftTip);
    
    const rightTip = leftTip.clone();
    rightTip.position.z = -0.03;
    group.add(rightTip);
    
    return { group, foot, body, head, leftTentacle, rightTentacle, leftTip, rightTip };
}

// ============================================
// SNAIL A: Bottom Crawler
// Warm amber-brown spiral shell with growth bands
// ============================================
export function createBottomSnail(scene, TANK) {
    const snailGroup = new THREE.Group();
    snailGroup.name = 'snail-bottom';
    
    // Shell
    const shell = createSpiralShell(0.12, 0.15, 0xc4885a, {
        turns: 2.5,
        bands: true,
        bandColor: 0x8a5a3a
    });
    shell.rotation.z = -Math.PI / 2; // lay on side
    shell.rotation.y = 0.3;
    shell.position.set(0.1, 0.12, 0);
    snailGroup.add(shell);
    
    // Body
    const bodyParts = createSnailBody(0.4, 0xd4a574);
    bodyParts.group.position.set(-0.05, 0, 0);
    snailGroup.add(bodyParts.group);
    
    // ---- AI State ----
    const state = {
        position: new THREE.Vector3(1.5, 0, 1.2), // start front-right
        direction: new THREE.Vector3(1, 0, 0),
        speed: 0.05, // very slow
        targetAngle: 0,
        angle: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        tentaclePhase: Math.random() * Math.PI * 2
    };
    
    // Route points (slow wandering)
    const route = [
        new THREE.Vector3(1.5, 0, 1.2),
        new THREE.Vector3(2.5, 0, 0.5),
        new THREE.Vector3(2.0, 0, -0.5),
        new THREE.Vector3(0.5, 0, -1.0),
        new THREE.Vector3(-1.0, 0, -0.5),
        new THREE.Vector3(-2.0, 0, 0.5),
        new THREE.Vector3(-1.5, 0, 1.5),
        new THREE.Vector3(0, 0, 1.0),
        new THREE.Vector3(1.5, 0, 1.2)
    ];
    let routeIndex = 0;
    
    function update(delta, elapsed) {
        // ---- Movement ----
        const target = route[routeIndex];
        const toTarget = new THREE.Vector3().subVectors(target, state.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        
        if (dist < 0.15) {
            routeIndex = (routeIndex + 1) % route.length;
        } else {
            toTarget.normalize();
            state.targetAngle = Math.atan2(toTarget.z, toTarget.x);
        }
        
        // Smooth turn
        let angleDiff = state.targetAngle - state.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        state.angle += angleDiff * delta * 2;
        
        // Move
        state.direction.set(Math.cos(state.angle), 0, Math.sin(state.angle));
        state.position.add(state.direction.clone().multiplyScalar(state.speed * delta));
        
        // Add slight wobble
        state.wobblePhase += delta;
        state.position.x += Math.sin(state.wobblePhase * 0.5) * 0.001;
        
        // ---- Bounds ----
        const halfW = TANK.width / 2 - TANK.glassThickness - 0.4;
        const halfD = TANK.depth / 2 - TANK.glassThickness - 0.4;
        state.position.x = Math.max(-halfW, Math.min(halfW, state.position.x));
        state.position.z = Math.max(-halfD, Math.min(halfD, state.position.z));
        
        // ---- Substrate height ----
        const groundY = getSubstrateHeight(state.position.x, state.position.z, TANK);
        state.position.y = groundY;
        
        // ---- Apply transform ----
        snailGroup.position.copy(state.position);
        snailGroup.rotation.y = state.angle + Math.PI; // face direction
        
        // Slight tilt on uneven ground
        const tiltZ = Math.sin(elapsed * 0.5) * 0.05;
        snailGroup.rotation.z = tiltZ;
        
        // ---- Foot deformation (subtle) ----
        const footScale = 1 + Math.sin(elapsed * 3) * 0.02;
        bodyParts.foot.scale.x = footScale;
        
        // ---- Tentacle exploration ----
        state.tentaclePhase += delta * 2;
        const tentWiggle = Math.sin(state.tentaclePhase) * 0.3;
        bodyParts.leftTentacle.rotation.z = -0.5 + tentWiggle;
        bodyParts.rightTentacle.rotation.z = 0.5 - tentWiggle;
        bodyParts.leftTentacle.rotation.x = Math.cos(state.tentaclePhase * 0.7) * 0.2;
        bodyParts.rightTentacle.rotation.x = Math.cos(state.tentaclePhase * 0.7 + 1) * 0.2;
        
        // ---- Shell rotation (slow spiral motion) ----
        shell.rotation.x = -Math.PI / 2 + Math.sin(elapsed * 0.3) * 0.05;
    }
    
    scene.add(snailGroup);
    
    return {
        group: snailGroup,
        type: 'bottom',
        update
    };
}

// ============================================
// SNAIL B: Glass Crawler
// Olive/cream shell with dark stripes, on inside of front glass
// ============================================
export function createGlassSnail(scene, TANK) {
    const snailGroup = new THREE.Group();
    snailGroup.name = 'snail-glass';
    
    // Shell - olive/cream with dark stripes
    const shell = createSpiralShell(0.1, 0.12, 0xc4c4a4, {
        turns: 2.2,
        stripes: true,
        stripeColor: 0x4a4a3a,
        stripeCount: 10
    });
    // Orient shell to point into the tank (away from glass)
    shell.rotation.z = -Math.PI / 2;
    shell.rotation.y = Math.PI; // spiral faces inward
    shell.position.set(0, 0.1, 0.05); // offset from glass
    snailGroup.add(shell);
    
    // Body - oriented against glass
    const bodyParts = createSnailBody(0.35, 0xd4d4c4);
    bodyParts.group.rotation.y = Math.PI / 2; // perpendicular to glass
    bodyParts.group.position.set(0, 0, 0);
    snailGroup.add(bodyParts.group);
    
    // ---- AI State ----
    const glassZ = TANK.depth / 2 - TANK.glassThickness / 2; // inside surface of front glass
    const state = {
        x: -0.8, // offset from center
        y: 1.0,  // lower third
        z: glassZ - 0.02, // just inside glass
        angle: Math.PI / 2, // facing up initially
        speed: 0.02, // extremely slow
        direction: new THREE.Vector2(0, 1), // up
        pathProgress: 0,
        tentaclePhase: Math.random() * Math.PI * 2,
        pauseTimer: 0
    };
    
    // Path: short vertical/diagonal path on the glass
    const pathPoints = [
        new THREE.Vector2(-0.8, 1.0),
        new THREE.Vector2(-0.6, 1.5),
        new THREE.Vector2(-0.9, 2.0),
        new THREE.Vector2(-0.7, 2.5),
        new THREE.Vector2(-0.5, 2.8),
        new THREE.Vector2(-0.8, 2.2),
        new THREE.Vector2(-1.0, 1.7),
        new THREE.Vector2(-0.8, 1.0)
    ];
    let pathIndex = 0;
    
    function update(delta, elapsed) {
        // ---- Movement along path ----
        state.pauseTimer -= delta;
        
        if (state.pauseTimer <= 0 && Math.random() < 0.01) {
            state.pauseTimer = 2 + Math.random() * 4;
        }
        
        if (state.pauseTimer <= 0) {
            const target = pathPoints[pathIndex];
            const current = new THREE.Vector2(state.x, state.y);
            const toTarget = new THREE.Vector2().subVectors(target, current);
            const dist = toTarget.length();
            
            if (dist < 0.05) {
                pathIndex = (pathIndex + 1) % pathPoints.length;
            } else {
                toTarget.normalize();
                state.direction.lerp(toTarget, delta * 2);
                state.direction.normalize();
                
                // Move extremely slowly
                state.x += state.direction.x * state.speed * delta;
                state.y += state.direction.y * state.speed * delta;
                
                // Update facing angle
                state.angle = Math.atan2(state.direction.y, state.direction.x);
            }
        }
        
        // ---- Constrain to glass ----
        const halfW = TANK.width / 2 - TANK.glassThickness - 0.3;
        const maxY = TANK.waterLevel - 0.3;
        state.x = Math.max(-halfW + 0.2, Math.min(halfW - 0.2, state.x));
        state.y = Math.max(0.5, Math.min(maxY, state.y));
        
        // ---- Apply transform ----
        snailGroup.position.set(state.x, state.y, state.z);
        
        // Orient: foot against glass (facing -Z, toward glass), shell pointing +Z (into tank)
        snailGroup.rotation.set(0, 0, 0);
        
        // Body oriented so head points in movement direction on the glass plane
        // The snail is on the X-Y plane (glass), moving in X-Y
        bodyParts.group.rotation.set(0, 0, state.angle - Math.PI / 2);
        
        // Shell stays oriented into the tank
        shell.rotation.set(-Math.PI / 2, Math.PI, Math.sin(elapsed * 0.2) * 0.05);
        shell.position.z = 0.05 + Math.sin(elapsed * 0.5) * 0.005; // subtle breathing
        
        // ---- Tentacle movement (always active) ----
        state.tentaclePhase += delta * 1.5;
        const tWiggle = Math.sin(state.tentaclePhase) * 0.4;
        bodyParts.leftTentacle.rotation.z = -0.5 + tWiggle;
        bodyParts.rightTentacle.rotation.z = 0.5 - tWiggle;
        
        // Tentacles explore in the plane of the glass
        bodyParts.leftTentacle.rotation.x = Math.sin(state.tentaclePhase * 0.8) * 0.3;
        bodyParts.rightTentacle.rotation.x = Math.cos(state.tentaclePhase * 0.8) * 0.3;
        
        // ---- Foot suction subtle deformation ----
        const suction = 1 + Math.sin(elapsed * 1.5) * 0.01;
        bodyParts.foot.scale.set(suction, 1, suction);
    }
    
    // Initial position
    snailGroup.position.set(state.x, state.y, state.z);
    
    scene.add(snailGroup);
    
    return {
        group: snailGroup,
        type: 'glass',
        update
    };
}

// ============================================
// MAIN: Create both snails
// ============================================
export function createAllSnails(scene, TANK) {
    const snails = [];
    
    snails.push(createBottomSnail(scene, TANK));
    snails.push(createGlassSnail(scene, TANK));
    
    return snails;
}

// ---- Update all snails ----
export function updateSnails(snails, delta, elapsed) {
    snails.forEach(snail => snail.update(delta, elapsed));
}
