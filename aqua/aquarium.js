import * as THREE from 'three';

// ============================================
// STAGE 1: GLASS AQUARIUM CONSTRUCTION
// ============================================

export function createAquarium(scene, TANK) {
    const aquariumGroup = new THREE.Group();
    aquariumGroup.name = 'aquarium';

    const { width, depth, height, glassThickness } = TANK;
    const w = width / 2;   // half-width (X)
    const d = depth / 2;   // half-depth (Z)
    const h = height;      // full height (Y)
    const t = glassThickness;

    // ---- Glass Material (physical, with transmission) ----
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xcfe8f0,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.5,
        ior: 1.5,
        transparent: true,
        opacity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // ---- Edge/seam material (subtle tint) ----
    const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x88aabb,
        metalness: 0.3,
        roughness: 0.3,
        transparent: true,
        opacity: 0.4
    });

    // ---- Helper: create a glass panel ----
    function createGlassPanel(panelWidth, panelHeight, posX, posY, posZ, rotY = 0) {
        const geo = new THREE.BoxGeometry(panelWidth, panelHeight, t);
        const mesh = new THREE.Mesh(geo, glassMaterial);
        mesh.position.set(posX, posY, posZ);
        mesh.rotation.y = rotY;
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        return mesh;
    }

    // ---- 5 Glass Panels (open top) ----
    // Front panel (Z = +d)
    const frontPanel = createGlassPanel(width, h, 0, h / 2, d);
    frontPanel.name = 'glass-front';
    aquariumGroup.add(frontPanel);

    // Back panel (Z = -d)
    const backPanel = createGlassPanel(width, h, 0, h / 2, -d);
    backPanel.name = 'glass-back';
    aquariumGroup.add(backPanel);

    // Left panel (X = -w)
    const leftPanel = createGlassPanel(depth, h, -w, h / 2, 0, Math.PI / 2);
    leftPanel.name = 'glass-left';
    aquariumGroup.add(leftPanel);

    // Right panel (X = +w)
    const rightPanel = createGlassPanel(depth, h, w, h / 2, 0, Math.PI / 2);
    rightPanel.name = 'glass-right';
    aquariumGroup.add(rightPanel);

    // Bottom panel (Y = 0, slightly inset)
    const bottomPanel = createGlassPanel(width - 2 * t, depth - 2 * t, 0, t / 2, 0);
    bottomPanel.name = 'glass-bottom';
    aquariumGroup.add(bottomPanel);

    // ---- Edge seams (thin strips at corners) ----
    const seamHeight = h;
    const seamGeo = new THREE.BoxGeometry(t * 0.6, seamHeight, t * 0.6);
    const corners = [
        [-w, 0, -d], [w, 0, -d], [-w, 0, d], [w, 0, d]
    ];
    corners.forEach(([cx, , cz], i) => {
        const seam = new THREE.Mesh(seamGeo, edgeMaterial);
        seam.position.set(cx, seamHeight / 2, cz);
        seam.name = `seam-${i}`;
        aquariumGroup.add(seam);
    });

    // ---- Bottom Frame (matte black) ----
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.4,
        roughness: 0.6
    });

    // Bottom frame ring
    const frameThickness = 0.25;
    const frameHeight = 0.15;

    // Front/back frame strips
    const fbStripGeo = new THREE.BoxGeometry(width + 2 * frameThickness, frameHeight, frameThickness);
    const frontFrame = new THREE.Mesh(fbStripGeo, frameMaterial);
    frontFrame.position.set(0, frameHeight / 2, d + frameThickness / 2);
    frontFrame.castShadow = true;
    frontFrame.receiveShadow = true;
    aquariumGroup.add(frontFrame);

    const backFrame = new THREE.Mesh(fbStripGeo, frameMaterial);
    backFrame.position.set(0, frameHeight / 2, -d - frameThickness / 2);
    backFrame.castShadow = true;
    backFrame.receiveShadow = true;
    aquariumGroup.add(backFrame);

    // Left/right frame strips
    const lrStripGeo = new THREE.BoxGeometry(frameThickness, frameHeight, depth);
    const leftFrame = new THREE.Mesh(lrStripGeo, frameMaterial);
    leftFrame.position.set(-w - frameThickness / 2, frameHeight / 2, 0);
    leftFrame.castShadow = true;
    leftFrame.receiveShadow = true;
    aquariumGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(lrStripGeo, frameMaterial);
    rightFrame.position.set(w + frameThickness / 2, frameHeight / 2, 0);
    rightFrame.castShadow = true;
    rightFrame.receiveShadow = true;
    aquariumGroup.add(rightFrame);

    // ---- Upper Rim (narrow, around the top opening) ----
    const rimHeight = 0.12;
    const rimThickness = 0.08;

    const rimFrontGeo = new THREE.BoxGeometry(width + 2 * rimThickness, rimHeight, rimThickness);
    const rimFront = new THREE.Mesh(rimFrontGeo, frameMaterial);
    rimFront.position.set(0, h - rimHeight / 2, d + rimThickness / 2);
    aquariumGroup.add(rimFront);

    const rimBack = new THREE.Mesh(rimFrontGeo, frameMaterial);
    rimBack.position.set(0, h - rimHeight / 2, -d - rimThickness / 2);
    aquariumGroup.add(rimBack);

    const rimSideGeo = new THREE.BoxGeometry(rimThickness, rimHeight, depth);
    const rimLeft = new THREE.Mesh(rimSideGeo, frameMaterial);
    rimLeft.position.set(-w - rimThickness / 2, h - rimHeight / 2, 0);
    aquariumGroup.add(rimLeft);

    const rimRight = new THREE.Mesh(rimSideGeo, frameMaterial);
    rimRight.position.set(w + rimThickness / 2, h - rimHeight / 2, 0);
    aquariumGroup.add(rimRight);

    // ---- Pedestal (dark, simple) ----
    const pedestalMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.2,
        roughness: 0.8
    });

    const pedestalGroup = new THREE.Group();
    pedestalGroup.name = 'pedestal';

    // Pedestal top slab
    const pedWidth = width + 1.0;
    const pedDepth = depth + 1.0;
    const pedHeight = 1.2;

    const pedestalTop = new THREE.Mesh(
        new THREE.BoxGeometry(pedWidth, 0.15, pedDepth),
        pedestalMaterial
    );
    pedestalTop.position.y = -0.075;
    pedestalTop.castShadow = true;
    pedestalTop.receiveShadow = true;
    pedestalGroup.add(pedestalTop);

    // Pedestal legs (4 corners)
    const legGeo = new THREE.BoxGeometry(0.3, pedHeight, 0.3);
    const legPositions = [
        [-pedWidth / 2 + 0.3, -pedHeight / 2 - 0.15, -pedDepth / 2 + 0.3],
        [pedWidth / 2 - 0.3, -pedHeight / 2 - 0.15, -pedDepth / 2 + 0.3],
        [-pedWidth / 2 + 0.3, -pedHeight / 2 - 0.15, pedDepth / 2 - 0.3],
        [pedWidth / 2 - 0.3, -pedHeight / 2 - 0.15, pedDepth / 2 - 0.3]
    ];
    legPositions.forEach((pos, i) => {
        const leg = new THREE.Mesh(legGeo, pedestalMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        leg.name = `pedestal-leg-${i}`;
        pedestalGroup.add(leg);
    });

    // Pedestal bottom slab
    const pedestalBottom = new THREE.Mesh(
        new THREE.BoxGeometry(pedWidth - 0.2, 0.1, pedDepth - 0.2),
        pedestalMaterial
    );
    pedestalBottom.position.y = -pedHeight - 0.2;
    pedestalBottom.castShadow = true;
    pedestalBottom.receiveShadow = true;
    pedestalGroup.add(pedestalBottom);

    // Soft contact shadow under pedestal
    const shadowGeo = new THREE.PlaneGeometry(pedWidth + 1, pedDepth + 1);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -pedHeight - 0.26;
    contactShadow.receiveShadow = true;
    pedestalGroup.add(contactShadow);

    aquariumGroup.add(pedestalGroup);

    // ---- Environment map for glass reflections ----
    const pmremGenerator = new THREE.PMREMGenerator(rendererRef);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0d3b4f);
    // Add some gradient-like lighting to env
    const envLight1 = new THREE.PointLight(0xffffff, 2, 50);
    envLight1.position.set(0, 10, 0);
    envScene.add(envLight1);
    const envLight2 = new THREE.PointLight(0x4488cc, 1, 50);
    envLight2.position.set(-10, 5, -10);
    envScene.add(envLight2);
    const envLight3 = new THREE.PointLight(0xffaa66, 0.5, 50);
    envLight3.position.set(10, 3, 10);
    envScene.add(envLight3);

    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
    scene.environment = envMap;
    glassMaterial.envMap = envMap;
    glassMaterial.envMapIntensity = 0.8;

    pmremGenerator.dispose();

    scene.add(aquariumGroup);
    return aquariumGroup;
}

// We need renderer reference for PMREM - set this before calling createAquarium
let rendererRef = null;
export function setRenderer(r) {
    rendererRef = r;
}
