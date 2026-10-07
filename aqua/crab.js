import * as THREE from 'three';
import { getSubstrateHeight } from './pebbles.js';

// ============================================
// STAGE 12: WALKING CRAB
// Articulated legs, sideways locomotion, claw gestures
// ============================================

export function createCrab(scene, TANK) {
    const crabGroup = new THREE.Group();
    crabGroup.name = 'crab';
    
    // Materials
    const shellMat = new THREE.MeshStandardMaterial({
        color: 0xb0502a,
        roughness: 0.7,
        metalness: 0.1
    });
    
    const darkShellMat = new THREE.MeshStandardMaterial({
        color: 0x8a3a1a,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const legMat = new THREE.MeshStandardMaterial({
        color: 0x9a4525,
        roughness: 0.75,
        metalness: 0.1
    });
    
    const jointMat = new THREE.MeshStandardMaterial({
        color: 0x7a3520,
        roughness: 0.8
    });
    
    // ---- Carapace (body) ----
    const carapaceGeo = new THREE.SphereGeometry(0.35, 16, 12);
    // Flatten and shape
    const cpos = carapaceGeo.attributes.position;
    for (let i = 0; i < cpos.count; i++) {
        const y = cpos.getY(i);
        cpos.setY(i, y * 0.5); // flatten
        // Slight dome
        if (y > 0) cpos.setY(i, y * 0.7);
    }
    carapaceGeo.computeVertexNormals();
    
    const carapace = new THREE.Mesh(carapaceGeo, shellMat);
    carapace.scale.set(1.3, 1, 1.1); // wider than long
    carapace.position.y = 0.25;
    carapace.castShadow = true;
    carapace.receiveShadow = true;
    crabGroup.add(carapace);
    
    // Carapace segmentation (grooves)
    const grooveMat = new THREE.MeshStandardMaterial({
        color: 0x6a2a15,
        roughness: 0.9
    });
    for (let i = -1; i <= 1; i++) {
        const groove = new THREE.Mesh(
            new THREE.TorusGeometry(0.3 + i * 0.1, 0.01, 6, 16, Math.PI),
            grooveMat
        );
        groove.position.set(i * 0.15, 0.38, 0);
        groove.rotation.x = Math.PI / 2;
        crabGroup.add(groove);
    }
    
    // Shell mottling (procedural spots)
    const spotGeo = new THREE.CircleGeometry(0.03, 6);
    const spotMat = new THREE.MeshStandardMaterial({
        color: 0xd06a3a,
        roughness: 0.8
    });
    for (let i = 0; i < 12; i++) {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.35;
        spot.position.set(
            Math.cos(angle) * r * 1.3,
            0.42,
            Math.sin(angle) * r
        );
        spot.rotation.x = -Math.PI / 2;
        spot.scale.set(0.5 + Math.random(), 1, 0.5 + Math.random());
        crabGroup.add(spot);
    }
    
    // ---- Eyestalks ----
    const eyeMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0x0a0a0a
    });
    
    const stalkGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.15, 6);
    
    const leftStalk = new THREE.Mesh(stalkGeo, legMat);
    leftStalk.position.set(0.35, 0.4, 0.12);
    leftStalk.rotation.z = -0.3;
    crabGroup.add(leftStalk);
    
    const rightStalk = leftStalk.clone();
    rightStalk.position.z = -0.12;
    rightStalk.rotation.z = 0.3;
    crabGroup.add(rightStalk);
    
    // Eyes on top of stalks
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.4, 0.5, 0.12);
    crabGroup.add(leftEye);
    
    const rightEye = leftEye.clone();
    rightEye.position.z = -0.12;
    crabGroup.add(rightEye);
    
    // Eye highlights
    const highlightGeo = new THREE.SphereGeometry(0.015, 4, 4);
    const highlightMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8
    });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(0.42, 0.52, 0.14);
    crabGroup.add(leftHighlight);
    
    const rightHighlight = leftHighlight.clone();
    rightHighlight.position.z = -0.14;
    crabGroup.add(rightHighlight);
    
    // ---- Mouthparts ----
    const mouthGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x5a2515, roughness: 0.9 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0.42, 0.2, 0);
    crabGroup.add(mouth);
    
    // ---- Front Arms with Claws ----
    const armGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8);
    
    // Left arm (will be on +Z side when facing +X)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(0.3, 0.25, 0.2);
    crabGroup.add(leftArmPivot);
    
    const leftArm = new THREE.Mesh(armGeo, legMat);
    leftArm.position.set(0.1, 0, 0.1);
    leftArm.rotation.z = -0.5;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    
    // Left claw
    const clawGroup = new THREE.Group();
    clawGroup.position.set(0.15, 0, 0.15);
    leftArmPivot.add(clawGroup);
    
    const clawBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 6),
        shellMat
    );
    clawBase.scale.set(1.2, 0.8, 1);
    clawGroup.add(clawBase);
    
    // Pincer (two parts)
    const pincerGeo = new THREE.ConeGeometry(0.06, 0.15, 6);
    const pincerMat = new THREE.MeshStandardMaterial({
        color: 0xc05a30,
        roughness: 0.7
    });
    
    const upperPincer = new THREE.Mesh(pincerGeo, pincerMat);
    upperPincer.position.set(0.08, 0.03, 0);
    upperPincer.rotation.z = -2.5;
    clawGroup.add(upperPincer);
    
    const lowerPincer = new THREE.Mesh(pincerGeo, pincerMat);
    lowerPincer.position.set(0.08, -0.03, 0);
    lowerPincer.rotation.z = 2.5;
    clawGroup.add(lowerPincer);
    
    // Right arm (mirror)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.3, 0.25, -0.2);
    crabGroup.add(rightArmPivot);
    
    const rightArm = leftArm.clone();
    rightArm.rotation.z = 0.5;
    rightArmPivot.add(rightArm);
    
    const rightClawGroup = clawGroup.clone();
    rightArmPivot.add(rightClawGroup);
    
    // ---- Walking Legs (8 total, 4 per side) ----
    const legs = [];
    const legSegments = [];
    
    function createLeg(side, index) {
        const legGroup = new THREE.Group();
        // Position along body side
        const zPos = side * (0.15 + index * 0.12);
        legGroup.position.set(-0.1 + index * 0.05, 0.15, zPos);
        crabGroup.add(legGroup);
        
        const segments = [];
        let currentPos = new THREE.Vector3(0, 0, 0);
        let currentRot = new THREE.Euler(0, 0, side * -0.5);
        
        // Upper leg segment
        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.03, 0.15, 6),
            legMat
        );
        upperLeg.position.set(side * 0.05, 0.05, 0);
        upperLeg.rotation.x = Math.PI / 2;
        upperLeg.rotation.z = side * 0.3;
        upperLeg.castShadow = true;
        legGroup.add(upperLeg);
        segments.push({ mesh: upperLeg, pivot: new THREE.Vector3(side * 0.05, 0.05, 0), baseRot: upperLeg.rotation.clone() });
        
        // Middle leg segment
        const midLegPivot = new THREE.Group();
        midLegPivot.position.set(side * 0.12, 0.02, 0);
        legGroup.add(midLegPivot);
        
        const midLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.12, 6),
            legMat
        );
        midLeg.position.set(side * 0.05, -0.02, 0);
        midLeg.rotation.x = Math.PI / 2;
        midLeg.rotation.z = side * 0.8;
        midLeg.castShadow = true;
        midLegPivot.add(midLeg);
        segments.push({ mesh: midLeg, parent: midLegPivot, baseRot: midLeg.rotation.clone() });
        
        // Lower leg segment (foot)
        const footPivot = new THREE.Group();
        footPivot.position.set(side * 0.08, -0.06, 0);
        midLegPivot.add(footPivot);
        
        const foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.02, 0.1, 6),
            legMat
        );
        foot.position.set(side * 0.04, -0.03, 0);
        foot.rotation.x = Math.PI / 2;
        foot.rotation.z = side * 1.2;
        foot.castShadow = true;
        footPivot.add(foot);
        segments.push({ mesh: foot, parent: footPivot, baseRot: foot.rotation.clone() });
        
        // Store pivots for animation
        legGroup.userData = {
            upperPivot: legGroup,
            midPivot: midLegPivot,
            footPivot: footPivot,
            side,
            index,
            phase: index * Math.PI / 2 + (side > 0 ? 0 : Math.PI) // alternating gait
        };
        
        return legGroup;
    }
    
    // Create 4 legs per side
    for (let side of [1, -1]) {
        for (let i = 0; i < 4; i++) {
            legs.push(createLeg(side, i));
        }
    }
    
    // ---- Crab AI State ----
    const crabState = {
        position: new THREE.Vector3(0, 0, 0), // start at center-front
        direction: new THREE.Vector3(1, 0, 0), // facing +X initially
        targetDirection: new THREE.Vector3(1, 0, 0),
        speed: 0,
        targetSpeed: 0.3,
        state: 'walk', // walk, pause, turn
        stateTimer: 3 + Math.random() * 4,
        gaitPhase: 0,
        gaitSpeed: 3,
        clawPhase: 0,
        route: [],
        routeIndex: 0
    };
    
    // Generate a route across the foreground
    const routePoints = generateRoute(TANK);
    crabState.route = routePoints;
    crabState.position.copy(routePoints[0]);
    
    // ---- Update function ----
    function update(delta, elapsed) {
        // ---- AI State Machine ----
        crabState.stateTimer -= delta;
        
        if (crabState.stateTimer <= 0) {
            // Change state
            const r = Math.random();
            if (r < 0.2) {
                crabState.state = 'pause';
                crabState.stateTimer = 1 + Math.random() * 2;
                crabState.targetSpeed = 0;
            } else if (r < 0.35) {
                crabState.state = 'turn';
                crabState.stateTimer = 0.5 + Math.random() * 1;
                // Pick new direction (mostly sideways)
                const angle = (Math.random() - 0.5) * Math.PI;
                crabState.targetDirection.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
            } else {
                crabState.state = 'walk';
                crabState.stateTimer = 3 + Math.random() * 5;
                crabState.targetSpeed = 0.2 + Math.random() * 0.3;
            }
        }
        
        // ---- Follow route ----
        if (crabState.state === 'walk') {
            const currentTarget = crabState.route[crabState.routeIndex];
            const toTarget = new THREE.Vector3().subVectors(currentTarget, crabState.position);
            toTarget.y = 0;
            const dist = toTarget.length();
            
            if (dist < 0.3) {
                crabState.routeIndex = (crabState.routeIndex + 1) % crabState.route.length;
            } else {
                toTarget.normalize();
                crabState.targetDirection.lerp(toTarget, delta * 2);
                crabState.targetDirection.normalize();
            }
        }
        
        // ---- Smooth direction change ----
        crabState.direction.lerp(crabState.targetDirection, delta * 3);
        crabState.direction.normalize();
        
        // ---- Smooth speed ----
        crabState.speed = THREE.MathUtils.lerp(crabState.speed, crabState.targetSpeed, delta * 2);
        
        // ---- Move ----
        if (crabState.speed > 0.01) {
            const move = crabState.direction.clone().multiplyScalar(crabState.speed * delta);
            crabState.position.add(move);
            crabState.gaitPhase += delta * crabState.gaitSpeed * (0.5 + crabState.speed);
        }
        
        // ---- Bounds ----
        const halfW = TANK.width / 2 - TANK.glassThickness - 0.5;
        const halfD = TANK.depth / 2 - TANK.glassThickness - 0.5;
        crabState.position.x = Math.max(-halfW, Math.min(halfW, crabState.position.x));
        crabState.position.z = Math.max(-halfD + 0.5, Math.min(halfD - 0.5, crabState.position.z)); // keep in front area
        
        // ---- Substrate height ----
        const groundY = getSubstrateHeight(crabState.position.x, crabState.position.z, TANK);
        crabState.position.y = groundY;
        
        // ---- Apply to group ----
        crabGroup.position.copy(crabState.position);
        
        // Face movement direction (crabs walk sideways, so body is perpendicular to movement)
        const angle = Math.atan2(crabState.direction.z, crabState.direction.x);
        crabGroup.rotation.y = angle - Math.PI / 2; // sideways
        
        // Slight body bob while walking
        crabGroup.position.y += Math.abs(Math.sin(crabState.gaitPhase * 2)) * 0.02;
        
        // ---- Leg Animation (alternating gait) ----
        legs.forEach((leg, legIdx) => {
            const ud = leg.userData;
            const phase = crabState.gaitPhase + ud.phase;
            const isLeft = ud.side > 0;
            
            // Stance vs swing
            const cycle = (phase % (Math.PI * 2)) / (Math.PI * 2);
            const isSwing = cycle < 0.5;
            
            // Leg lift during swing
            const lift = isSwing ? Math.sin(cycle * Math.PI * 2) * 0.15 : 0;
            
            // Forward/back motion
            const stride = Math.cos(phase) * 0.3 * crabState.speed * 2;
            
            // Apply to upper leg
            ud.upperPivot.rotation.z = ud.side * 0.3 + stride * 0.5;
            ud.upperPivot.position.y = 0.15 + lift;
            
            // Middle segment
            ud.midPivot.rotation.z = (isSwing ? -0.5 : 0.3) + stride * 0.3;
            
            // Foot plants during stance
            ud.footPivot.rotation.z = isSwing ? -1.0 : -0.2;
        });
        
        // ---- Claw animation ----
        crabState.clawPhase += delta * 2;
        const clawWave = Math.sin(crabState.clawPhase) * 0.3;
        leftArmPivot.rotation.z = -0.3 + clawWave * 0.5;
        rightArmPivot.rotation.z = 0.3 - clawWave * 0.5;
        
        // Occasional claw gesture when paused
        if (crabState.state === 'pause' && Math.random() < 0.02) {
            // Open one claw
            const gesture = Math.random() > 0.5 ? clawGroup : rightClawGroup;
            gesture.userData.gestureTimer = 1.0;
        }
        
        // Animate claw gesture
        [clawGroup, rightClawGroup].forEach(cg => {
            if (cg.userData.gestureTimer > 0) {
                cg.userData.gestureTimer -= delta;
                const t = 1 - cg.userData.gestureTimer;
                const open = Math.sin(t * Math.PI) * 0.8;
                cg.children[1].rotation.z = -2.5 - open; // upper pincer
                cg.children[2].rotation.z = 2.5 + open;  // lower pincer
            } else {
                // Return to rest
                cg.children[1].rotation.z = THREE.MathUtils.lerp(cg.children[1].rotation.z, -2.5, delta * 5);
                cg.children[2].rotation.z = THREE.MathUtils.lerp(cg.children[2].rotation.z, 2.5, delta * 5);
            }
        });
        
        // ---- Eye movement ----
        leftEye.position.x = 0.4 + Math.sin(elapsed * 2) * 0.01;
        rightEye.position.x = 0.4 + Math.sin(elapsed * 2) * 0.01;
    }
    
    // ---- Generate route ----
    function generateRoute(TANK) {
        const points = [];
        const halfW = TANK.width / 2 - TANK.glassThickness - 0.8;
        const frontZ = TANK.depth / 2 - TANK.glassThickness - 1.0;
        const backZ = -TANK.depth / 2 + TANK.glassThickness + 2.0;
        
        // Zigzag route across the front
        points.push(new THREE.Vector3(-halfW * 0.7, 0, frontZ));
        points.push(new THREE.Vector3(halfW * 0.5, 0, frontZ - 0.3));
        points.push(new THREE.Vector3(halfW * 0.7, 0, backZ + 1.5));
        points.push(new THREE.Vector3(-halfW * 0.3, 0, backZ + 1.0));
        points.push(new THREE.Vector3(-halfW * 0.8, 0, frontZ - 0.5));
        points.push(new THREE.Vector3(0, 0, backZ + 2.0));
        points.push(new THREE.Vector3(halfW * 0.6, 0, frontZ));
        
        return points;
    }
    
    // Initial position
    crabGroup.position.copy(crabState.position);
    crabGroup.position.y = getSubstrateHeight(crabState.position.x, crabState.position.z, TANK) + 0.1;
    
    scene.add(crabGroup);
    
    return {
        group: crabGroup,
        update,
        state: crabState
    };
}
