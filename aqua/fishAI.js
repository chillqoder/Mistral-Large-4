import * as THREE from 'three';
import { getSubstrateHeight } from './pebbles.js';

// ============================================
// STAGE 11: FISH SWIMMING AI
// Individual behaviors, wandering steering, collision avoidance
// ============================================

// ---- Personality profiles ----
const PERSONALITIES = {
    guppy: {
        preferredDepth: [2.5, 4.0], // upper-to-middle water
        speedProfile: { min: 0.3, max: 1.2, cruise: 0.5 },
        turnRate: 2.5,
        accel: 1.5,
        hoverChance: 0.15,
        hoverDuration: [1, 3],
        boundsMargin: 0.6
    },
    clownfish: {
        preferredDepth: [1.5, 3.5], // mid-water
        speedProfile: { min: 0.2, max: 0.8, cruise: 0.4 },
        turnRate: 1.8,
        accel: 1.0,
        hoverChance: 0.1,
        hoverDuration: [0.5, 2],
        boundsMargin: 0.7
    },
    angelfish: {
        preferredDepth: [1.0, 3.5], // mid with vertical changes
        speedProfile: { min: 0.15, max: 0.6, cruise: 0.3 },
        turnRate: 1.2,
        accel: 0.8,
        hoverChance: 0.2,
        hoverDuration: [2, 5],
        boundsMargin: 0.9 // tall fins need more space
    },
    betta: {
        preferredDepth: [2.0, 4.2], // upper-middle
        speedProfile: { min: 0.1, max: 0.5, cruise: 0.25 },
        turnRate: 1.0,
        accel: 0.6,
        hoverChance: 0.25,
        hoverDuration: [2, 4],
        boundsMargin: 0.8 // large fins need space
    }
};

// ---- Obstacle definitions ----
function createObstacles(TANK, castle, filterData, plants) {
    const obstacles = [];
    
    // Tank walls (as bounds, not obstacles)
    const bounds = {
        minX: -TANK.width / 2 + TANK.glassThickness + 0.3,
        maxX: TANK.width / 2 - TANK.glassThickness - 0.3,
        minZ: -TANK.depth / 2 + TANK.glassThickness + 0.3,
        maxZ: TANK.depth / 2 - TANK.glassThickness - 0.3,
        minY: 0.3,
        maxY: TANK.waterLevel - 0.2
    };
    
    // Castle obstacle
    if (castle && castle.userData.bounds) {
        const b = castle.userData.bounds;
        obstacles.push({
            type: 'box',
            center: b.center.clone(),
            halfSize: b.halfSize.clone(),
            margin: 0.3
        });
    }
    
    // Filter obstacle
    if (filterData) {
        obstacles.push({
            type: 'box',
            center: filterData.group.position.clone(),
            halfSize: new THREE.Vector3(0.5, 0.8, 0.5),
            margin: 0.3
        });
    }
    
    // Plant obstacles (approximate)
    plants.forEach(plant => {
        const pos = new THREE.Vector3();
        plant.group.getWorldPosition(pos);
        obstacles.push({
            type: 'sphere',
            center: pos,
            radius: plant.type === 'cabomba' ? 0.4 : 0.3,
            margin: 0.2
        });
    });
    
    return { bounds, obstacles };
}

// ---- Check collision with obstacle ----
function checkObstacleCollision(pos, obstacles, margin) {
    for (const obs of obstacles) {
        if (obs.type === 'box') {
            const min = obs.center.clone().sub(obs.halfSize).subScalar(obs.margin + margin);
            const max = obs.center.clone().add(obs.halfSize).addScalar(obs.margin + margin);
            if (pos.x >= min.x && pos.x <= max.x &&
                pos.y >= min.y && pos.y <= max.y &&
                pos.z >= min.z && pos.z <= max.z) {
                return true;
            }
        } else if (obs.type === 'sphere') {
            const dist = pos.distanceTo(obs.center);
            if (dist < obs.radius + obs.margin + margin) {
                return true;
            }
        }
    }
    return false;
}

// ---- Get avoidance vector from obstacle ----
function getObstacleAvoidance(pos, obstacles, margin) {
    const avoid = new THREE.Vector3();
    
    for (const obs of obstacles) {
        if (obs.type === 'box') {
            const min = obs.center.clone().sub(obs.halfSize);
            const max = obs.center.clone().add(obs.halfSize);
            
            // Find closest point on box
            const closest = new THREE.Vector3(
                Math.max(min.x, Math.min(pos.x, max.x)),
                Math.max(min.y, Math.min(pos.y, max.y)),
                Math.max(min.z, Math.min(pos.z, max.z))
            );
            
            const diff = pos.clone().sub(closest);
            const dist = diff.length();
            const safeDist = obs.margin + margin + 0.5;
            
            if (dist < safeDist) {
                const strength = (safeDist - dist) / safeDist;
                diff.normalize().multiplyScalar(strength * 3);
                avoid.add(diff);
            }
        } else if (obs.type === 'sphere') {
            const diff = pos.clone().sub(obs.center);
            const dist = diff.length();
            const safeDist = obs.radius + obs.margin + margin + 0.5;
            
            if (dist < safeDist) {
                const strength = (safeDist - dist) / safeDist;
                diff.normalize().multiplyScalar(strength * 3);
                avoid.add(diff);
            }
        }
    }
    
    return avoid;
}

// ---- Initialize fish AI state ----
function initFishAI(fish, TANK, obstacles, allFish) {
    const personality = PERSONALITIES[fish.species];
    const bounds = obstacles.bounds;
    
    // Random starting position within preferred depth
    const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * (bounds.maxX - bounds.minX) * 0.6,
        personality.preferredDepth[0] + Math.random() * (personality.preferredDepth[1] - personality.preferredDepth[0]),
        (Math.random() - 0.5) * (bounds.maxZ - bounds.minZ) * 0.6
    );
    
    fish.group.position.copy(startPos);
    
    // Random initial direction
    const initialDir = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.3,
        Math.random() - 0.5
    ).normalize();
    
    return {
        fish,
        personality,
        velocity: initialDir.clone().multiplyScalar(personality.speedProfile.cruise),
        target: startPos.clone().add(initialDir.clone().multiplyScalar(2)),
        state: 'cruise', // cruise, hover, turn
        stateTimer: 0,
        hoverTimer: 0,
        seed: Math.random() * 1000,
        wanderAngle: Math.random() * Math.PI * 2,
        currentSpeed: 0,
        smoothDir: initialDir.clone(),
        bankAngle: 0
    };
}

// ---- Update fish AI ----
function updateFishAI(ai, delta, elapsed, obstacles, allFishAIs, TANK) {
    const { fish, personality, bounds } = { fish: ai.fish, personality: ai.personality, bounds: obstacles.bounds };
    const pos = fish.group.position;
    const vel = ai.velocity;
    
    // ---- State machine ----
    ai.stateTimer -= delta;
    
    if (ai.state === 'hover') {
        ai.hoverTimer -= delta;
        if (ai.hoverTimer <= 0) {
            ai.state = 'cruise';
            ai.stateTimer = 2 + Math.random() * 4;
            // Pick new target
            pickNewTarget(ai, bounds, obstacles);
        }
    } else if (ai.stateTimer <= 0) {
        // Decide next state
        if (Math.random() < personality.hoverChance) {
            ai.state = 'hover';
            ai.hoverTimer = personality.hoverDuration[0] + Math.random() * (personality.hoverDuration[1] - personality.hoverDuration[0]);
            vel.multiplyScalar(0.1); // slow down
        } else {
            ai.state = 'cruise';
            ai.stateTimer = 2 + Math.random() * 5;
            pickNewTarget(ai, bounds, obstacles);
        }
    }
    
    // ---- Steering ----
    const steer = new THREE.Vector3();
    
    if (ai.state === 'cruise') {
        // Seek target
        const toTarget = ai.target.clone().sub(pos);
        const distToTarget = toTarget.length();
        
        if (distToTarget < 1.0) {
            // Reached target, pick new one
            pickNewTarget(ai, bounds, obstacles);
        } else {
            toTarget.normalize();
            const desiredVel = toTarget.clone().multiplyScalar(personality.speedProfile.cruise);
            steer.add(desiredVel.sub(vel).multiplyScalar(0.5));
        }
        
        // Wander
        ai.wanderAngle += (Math.random() - 0.5) * delta * 2;
        const wander = new THREE.Vector3(
            Math.cos(ai.wanderAngle) * 0.3,
            Math.sin(ai.wanderAngle * 0.7) * 0.2,
            Math.sin(ai.wanderAngle) * 0.3
        );
        steer.add(wander);
        
        // Preferred depth pull
        const depthRange = personality.preferredDepth;
        if (pos.y < depthRange[0]) {
            steer.y += (depthRange[0] - pos.y) * 0.5;
        } else if (pos.y > depthRange[1]) {
            steer.y -= (pos.y - depthRange[1]) * 0.5;
        }
    } else if (ai.state === 'hover') {
        // Gentle station keeping
        steer.y += Math.sin(elapsed * 2 + ai.seed) * 0.1;
        steer.x += Math.cos(elapsed * 1.5 + ai.seed) * 0.05;
        steer.z += Math.sin(elapsed * 1.8 + ai.seed) * 0.05;
    }
    
    // ---- Obstacle avoidance ----
    const margin = personality.boundsMargin;
    const avoid = getObstacleAvoidance(pos, obstacles.obstacles, margin);
    steer.add(avoid.multiplyScalar(2));
    
    // ---- Separation from other fish ----
    allFishAIs.forEach(otherAI => {
        if (otherAI === ai) return;
        const otherPos = otherAI.fish.group.position;
        const diff = pos.clone().sub(otherPos);
        const dist = diff.length();
        const minDist = (ai.fish.length + otherAI.fish.length) * 0.6;
        if (dist < minDist && dist > 0.001) {
            const strength = (minDist - dist) / minDist;
            diff.normalize().multiplyScalar(strength * 1.5);
            steer.add(diff);
        }
    });
    
    // ---- Wall avoidance (soft) ----
    const wallAvoid = new THREE.Vector3();
    const wallMargin = personality.boundsMargin + 0.3;
    
    if (pos.x < bounds.minX + wallMargin) wallAvoid.x += (bounds.minX + wallMargin - pos.x);
    if (pos.x > bounds.maxX - wallMargin) wallAvoid.x -= (pos.x - (bounds.maxX - wallMargin));
    if (pos.z < bounds.minZ + wallMargin) wallAvoid.z += (bounds.minZ + wallMargin - pos.z);
    if (pos.z > bounds.maxZ - wallMargin) wallAvoid.z -= (pos.z - (bounds.maxZ - wallMargin));
    if (pos.y < bounds.minY + 0.3) wallAvoid.y += (bounds.minY + 0.3 - pos.y) * 2;
    if (pos.y > bounds.maxY - 0.2) wallAvoid.y -= (pos.y - (bounds.maxY - 0.2)) * 2;
    
    steer.add(wallAvoid.multiplyScalar(2));
    
    // ---- Apply acceleration with limits ----
    vel.add(steer.multiplyScalar(delta * personality.accel));
    
    // Clamp speed
    const speed = vel.length();
    const maxSpeed = ai.state === 'hover' ? 0.1 : personality.speedProfile.max;
    const minSpeed = ai.state === 'hover' ? 0 : personality.speedProfile.min * 0.3;
    
    if (speed > maxSpeed) {
        vel.normalize().multiplyScalar(maxSpeed);
    } else if (speed < minSpeed && ai.state !== 'hover') {
        vel.normalize().multiplyScalar(minSpeed);
    }
    
    ai.currentSpeed = vel.length() / personality.speedProfile.max;
    
    // ---- Update position ----
    pos.add(vel.clone().multiplyScalar(delta));
    
    // ---- Hard bounds safeguard ----
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
    pos.y = Math.max(bounds.minY, Math.min(bounds.maxY, pos.y));
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
    
    // ---- Orientation (smooth quaternion interpolation) ----
    if (vel.length() > 0.01) {
        // Target direction
        const targetDir = vel.clone().normalize();
        
        // Smooth interpolation of direction
        ai.smoothDir.lerp(targetDir, Math.min(1, delta * personality.turnRate));
        ai.smoothDir.normalize();
        
        // Create rotation from direction
        const quat = new THREE.Quaternion();
        const m = new THREE.Matrix4();
        m.lookAt(new THREE.Vector3(0, 0, 0), ai.smoothDir, new THREE.Vector3(0, 1, 0));
        quat.setFromRotationMatrix(m);
        
        // Add pitch based on vertical velocity
        const pitch = -ai.smoothDir.y * 0.3;
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
        quat.multiply(pitchQuat);
        
        // Add banking during turns
        const turnAmount = (targetDir.x * ai.smoothDir.z - targetDir.z * ai.smoothDir.x);
        ai.bankAngle = THREE.MathUtils.lerp(ai.bankAngle, turnAmount * 0.5, delta * 3);
        const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -ai.bankAngle);
        quat.multiply(bankQuat);
        
        // Smooth apply
        fish.group.quaternion.slerp(quat, Math.min(1, delta * personality.turnRate * 2));
    }
    
    // ---- Animate fish model ----
    fish.update(elapsed, delta, ai.currentSpeed);
}

// ---- Pick new target ----
function pickNewTarget(ai, bounds, obstacles) {
    const personality = ai.personality;
    
    for (let attempt = 0; attempt < 10; attempt++) {
        const target = new THREE.Vector3(
            bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
            personality.preferredDepth[0] + Math.random() * (personality.preferredDepth[1] - personality.preferredDepth[0]),
            bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ)
        );
        
        // Check if target is in obstacle
        if (!checkObstacleCollision(target, obstacles.obstacles, personality.boundsMargin)) {
            ai.target = target;
            return;
        }
    }
    
    // Fallback: stay near current position
    ai.target = ai.fish.group.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 2
    ));
}

// ---- Main: Initialize all fish AI ----
export function initFishAIForAll(fishes, TANK, castle, filterData, plants) {
    const obstacles = createObstacles(TANK, castle, filterData, plants);
    
    const aiStates = fishes.map(fish => initFishAI(fish, TANK, obstacles, fishes));
    
    return {
        obstacles,
        aiStates,
        update: (delta, elapsed) => {
            aiStates.forEach(ai => {
                updateFishAI(ai, delta, elapsed, obstacles, aiStates, TANK);
            });
        }
    };
}