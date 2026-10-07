import * as THREE from 'three';

// ============================================
// STAGE 5: MINIATURE CASTLE
// Weathered stone castle with towers, arched doorway, windows
// ============================================

export function createCastle(scene, TANK) {
    const castleGroup = new THREE.Group();
    castleGroup.name = 'castle';
    
    // Position: back-center, slightly offset
    castleGroup.position.set(-0.3, 0, -1.2);
    
    // Stone material - muted gray-beige ceramic/stone
    const stoneMat = new THREE.MeshStandardMaterial({
        color: 0xb8a898,
        roughness: 0.85,
        metalness: 0.05
    });
    
    // Darker stone for depth/shadows
    const darkStoneMat = new THREE.MeshStandardMaterial({
        color: 0x8a7a6a,
        roughness: 0.9,
        metalness: 0.05
    });
    
    // Greenish staining material (near base)
    const algaeMat = new THREE.MeshStandardMaterial({
        color: 0x6a7a5a,
        roughness: 0.95,
        transparent: true,
        opacity: 0.4
    });
    
    // Castle dimensions
    const baseW = 2.2;
    const baseD = 1.6;
    const wallH = 1.2;
    const wallT = 0.25;
    
    // ---- Foundation (partly buried) ----
    const foundation = new THREE.Mesh(
        new THREE.BoxGeometry(baseW + 0.3, 0.4, baseD + 0.3),
        darkStoneMat
    );
    foundation.position.y = 0.1;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    castleGroup.add(foundation);
    
    // ---- Main Keep (central structure) ----
    const keep = new THREE.Mesh(
        new THREE.BoxGeometry(baseW, wallH, baseD),
        stoneMat
    );
    keep.position.y = 0.3 + wallH / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    castleGroup.add(keep);
    
    // ---- Tower 1 (left, taller) ----
    const tower1H = 2.2;
    const tower1R = 0.35;
    const tower1 = new THREE.Mesh(
        new THREE.CylinderGeometry(tower1R, tower1R * 1.1, tower1H, 12),
        stoneMat
    );
    tower1.position.set(-baseW / 2 + tower1R, 0.3 + tower1H / 2, 0);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    castleGroup.add(tower1);
    
    // Tower 1 crenellations (battlements)
    const crenGeo = new THREE.BoxGeometry(tower1R * 0.6, 0.15, tower1R * 0.6);
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const cren = new THREE.Mesh(crenGeo, stoneMat);
        cren.position.set(
            -baseW / 2 + tower1R + Math.cos(angle) * tower1R * 0.85,
            0.3 + tower1H + 0.075,
            Math.sin(angle) * tower1R * 0.85
        );
        cren.castShadow = true;
        castleGroup.add(cren);
    }
    
    // Tower 1 roof (cone)
    const roof1 = new THREE.Mesh(
        new THREE.ConeGeometry(tower1R * 1.2, 0.5, 12),
        darkStoneMat
    );
    roof1.position.set(-baseW / 2 + tower1R, 0.3 + tower1H + 0.25, 0);
    roof1.castShadow = true;
    castleGroup.add(roof1);
    
    // ---- Tower 2 (right, shorter) ----
    const tower2H = 1.7;
    const tower2R = 0.3;
    const tower2 = new THREE.Mesh(
        new THREE.CylinderGeometry(tower2R, tower2R * 1.1, tower2H, 12),
        stoneMat
    );
    tower2.position.set(baseW / 2 - tower2R, 0.3 + tower2H / 2, 0.1);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    castleGroup.add(tower2);
    
    // Tower 2 crenellations
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.3;
        const cren = new THREE.Mesh(crenGeo, stoneMat);
        cren.position.set(
            baseW / 2 - tower2R + Math.cos(angle) * tower2R * 0.85,
            0.3 + tower2H + 0.075,
            0.1 + Math.sin(angle) * tower2R * 0.85
        );
        cren.castShadow = true;
        castleGroup.add(cren);
    }
    
    // Tower 2 roof
    const roof2 = new THREE.Mesh(
        new THREE.ConeGeometry(tower2R * 1.2, 0.4, 12),
        darkStoneMat
    );
    roof2.position.set(baseW / 2 - tower2R, 0.3 + tower2H + 0.2, 0.1);
    roof2.castShadow = true;
    castleGroup.add(roof2);
    
    // ---- Connecting Walls ----
    // Wall between towers (with gap for courtyard feel)
    const connWall = new THREE.Mesh(
        new THREE.BoxGeometry(baseW - tower1R * 2 - tower2R * 2, wallH * 0.8, wallT),
        stoneMat
    );
    connWall.position.set(0, 0.3 + wallH * 0.4, -baseD / 2 + wallT / 2);
    connWall.castShadow = true;
    connWall.receiveShadow = true;
    castleGroup.add(connWall);
    
    // Front wall sections (left and right of doorway)
    const doorW = 0.5;
    const frontWallH = wallH * 0.9;
    
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry((baseW - doorW) / 2 - 0.1, frontWallH, wallT),
        stoneMat
    );
    leftWall.position.set(-doorW / 2 - (baseW - doorW) / 4 + 0.05, 0.3 + frontWallH / 2, baseD / 2 - wallT / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    castleGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry((baseW - doorW) / 2 - 0.1, frontWallH, wallT),
        stoneMat
    );
    rightWall.position.set(doorW / 2 + (baseW - doorW) / 4 - 0.05, 0.3 + frontWallH / 2, baseD / 2 - wallT / 2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    castleGroup.add(rightWall);
    
    // ---- Arched Doorway ----
    // Lintel (top of arch)
    const archH = 0.35;
    const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.1, archH, wallT),
        stoneMat
    );
    lintel.position.set(0, 0.3 + frontWallH - archH / 2 + 0.05, baseD / 2 - wallT / 2);
    lintel.castShadow = true;
    castleGroup.add(lintel);
    
    // Arch curve (semicircle using torus segment)
    const archCurve = new THREE.TorusGeometry(doorW / 2 + 0.05, 0.06, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archCurve, stoneMat);
    arch.position.set(0, 0.3 + frontWallH - archH + 0.05, baseD / 2 - wallT / 2);
    arch.rotation.z = Math.PI;
    arch.castShadow = true;
    castleGroup.add(arch);
    
    // Doorway interior (dark passage - actual opening)
    const doorwayDepth = 0.3;
    const doorwayBack = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.05, frontWallH - archH - 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 1.0 })
    );
    doorwayBack.position.set(0, 0.3 + (frontWallH - archH) / 2, baseD / 2 - wallT - doorwayDepth + 0.025);
    castleGroup.add(doorwayBack);
    
    // Doorway floor (slightly raised)
    const doorFloor = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, 0.03, doorwayDepth),
        darkStoneMat
    );
    doorFloor.position.set(0, 0.32, baseD / 2 - wallT - doorwayDepth / 2);
    castleGroup.add(doorFloor);
    
    // ---- Windows (recessed) ----
    const windowGeo = new THREE.BoxGeometry(0.15, 0.25, 0.05);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1.0 });
    
    // Tower windows
    const windowPositions = [
        [-baseW / 2 + tower1R, 0.3 + tower1H * 0.6, tower1R + 0.02, 0],
        [baseW / 2 - tower2R, 0.3 + tower2H * 0.5, tower2R + 0.02, 0],
        [0, 0.3 + wallH * 0.7, -baseD / 2 + 0.02, Math.PI], // back wall
    ];
    
    windowPositions.forEach(([wx, wy, wz, rot]) => {
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.set(wx, wy, wz);
        win.rotation.y = rot;
        castleGroup.add(win);
        
        // Window frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.19, 0.29, 0.03),
            darkStoneMat
        );
        frame.position.set(wx, wy, wz - 0.01 * (rot === 0 ? 1 : -1));
        frame.rotation.y = rot;
        castleGroup.add(frame);
    });
    
    // ---- Stone Courses (horizontal lines) ----
    const courseMat = new THREE.MeshStandardMaterial({
        color: 0x9a8a7a,
        roughness: 0.95
    });
    for (let h = 0.2; h < wallH; h += 0.25) {
        // Front
        const courseF = new THREE.Mesh(
            new THREE.BoxGeometry(baseW + 0.02, 0.015, 0.02),
            courseMat
        );
        courseF.position.set(0, 0.3 + h, baseD / 2 + 0.01);
        castleGroup.add(courseF);
        
        // Back
        const courseB = new THREE.Mesh(
            new THREE.BoxGeometry(baseW + 0.02, 0.015, 0.02),
            courseMat
        );
        courseB.position.set(0, 0.3 + h, -baseD / 2 - 0.01);
        castleGroup.add(courseB);
    }
    
    // ---- Worn edges / chips ----
    const chipGeo = new THREE.DodecahedronGeometry(0.04, 0);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xa89888, roughness: 0.9 });
    for (let i = 0; i < 12; i++) {
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.position.set(
            (Math.random() - 0.5) * baseW,
            0.3 + Math.random() * wallH,
            Math.random() > 0.5 ? baseD / 2 : -baseD / 2
        );
        chip.position.z += (Math.random() > 0.5 ? 0.1 : -0.1);
        chip.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        chip.scale.setScalar(0.5 + Math.random() * 0.8);
        castleGroup.add(chip);
    }
    
    // ---- Greenish staining near base ----
    const stainGeo = new THREE.CylinderGeometry(baseW * 0.6, baseW * 0.7, 0.15, 16, 1, true);
    const stain = new THREE.Mesh(stainGeo, algaeMat);
    stain.position.y = 0.35;
    castleGroup.add(stain);
    
    // Additional algae patches
    for (let i = 0; i < 6; i++) {
        const patch = new THREE.Mesh(
            new THREE.CircleGeometry(0.08 + Math.random() * 0.1, 8),
            algaeMat
        );
        const angle = Math.random() * Math.PI * 2;
        const radius = baseW * 0.4;
        patch.position.set(
            Math.cos(angle) * radius * 0.6,
            0.32 + Math.random() * 0.1,
            Math.sin(angle) * radius * 0.4
        );
        patch.rotation.x = -Math.PI / 2;
        castleGroup.add(patch);
    }
    
    // ---- Collision volumes (simplified) ----
    const collisionGroup = new THREE.Group();
    collisionGroup.name = 'castle-collision';
    collisionGroup.visible = false;
    
    // Main keep collision
    const keepCollision = new THREE.Mesh(
        new THREE.BoxGeometry(baseW, wallH + 0.6, baseD),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    keepCollision.position.set(0, 0.3 + (wallH + 0.6) / 2, 0);
    collisionGroup.add(keepCollision);
    
    // Tower collisions
    const tower1Collision = new THREE.Mesh(
        new THREE.CylinderGeometry(tower1R + 0.05, tower1R + 0.05, tower1H + 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tower1Collision.position.set(-baseW / 2 + tower1R, 0.3 + (tower1H + 0.8) / 2, 0);
    collisionGroup.add(tower1Collision);
    
    const tower2Collision = new THREE.Mesh(
        new THREE.CylinderGeometry(tower2R + 0.05, tower2R + 0.05, tower2H + 0.6, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tower2Collision.position.set(baseW / 2 - tower2R, 0.3 + (tower2H + 0.6) / 2, 0.1);
    collisionGroup.add(tower2Collision);
    
    castleGroup.add(collisionGroup);
    
    scene.add(castleGroup);
    
    // Store collision info
    castleGroup.userData = {
        bounds: {
            center: new THREE.Vector3(-0.3, 0, -1.2),
            halfSize: new THREE.Vector3(baseW / 2 + 0.3, 2.0, baseD / 2 + 0.3)
        },
        doorway: {
            position: new THREE.Vector3(-0.3, 0, -1.2 + baseD / 2),
            width: doorW,
            height: frontWallH - archH
        }
    };
    
    return castleGroup;
}
