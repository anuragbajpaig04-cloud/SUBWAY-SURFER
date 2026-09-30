import * as THREE from 'three';
import { GameStatus, Lane, PowerUpType } from '../types';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, coins: number, distance: number) => void;
  onPowerUpUpdate: (type: PowerUpType, active: boolean, timeLeft: number, duration: number) => void;
  onHoverboardUpdate: (active: boolean, count: number) => void;
  onWordLetterCollected: (letter: string) => void;
  onGameOver: (finalScore: number, finalCoins: number, distance: number) => void;
  onStumble: () => void;
  onMissionProgress: (type: string, amount: number) => void;
}

interface ActivePowerUp {
  active: boolean;
  timeLeft: number;
  duration: number;
}

interface ObstacleData {
  mesh: THREE.Group | THREE.Mesh;
  lane: Lane;
  z: number;
  type: 'low_hurdle' | 'high_hurdle' | 'train' | 'moving_train' | 'ramp';
  height: number;
  width: number;
  length: number;
  speed?: number; // for moving trains
  boundingYMin: number;
  boundingYMax: number;
  hasRamp?: boolean;
}

interface CollectibleData {
  mesh: THREE.Object3D;
  lane: Lane;
  z: number;
  y: number;
  type: 'coin' | 'jetpack' | 'magnet' | 'sneakers' | 'multiplier' | 'letter';
  letter?: string;
  collected: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class SubwaySurfersEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  // Game Play State
  public status: GameStatus = 'idle';
  private score: number = 0;
  private coins: number = 0;
  private distance: number = 0;
  private scoreMultiplier: number = 1;
  private baseMultiplier: number = 1;

  // Movement & Physics
  private currentLane: Lane = 0;
  private targetLane: Lane = 0;
  private readonly laneWidth: number = 2.8;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private vy: number = 0;
  private isGrounded: boolean = true;
  private isJumping: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private readonly slideDuration: number = 0.75;
  private runSpeed: number = 22; // m/s
  private baseSpeed: number = 22;
  private maxSpeed: number = 42;
  private gravity: number = 38;
  private jumpVelocity: number = 14;
  private groundY: number = 0; // can be 2.8 if on top of train!
  private isStumbling: boolean = false;
  private stumbleTimer: number = 0;

  // Powerups State
  private powerUps: Record<PowerUpType, ActivePowerUp> = {
    jetpack: { active: false, timeLeft: 0, duration: 10 },
    magnet: { active: false, timeLeft: 0, duration: 12 },
    sneakers: { active: false, timeLeft: 0, duration: 12 },
    multiplier: { active: false, timeLeft: 0, duration: 15 },
  };

  // Hoverboard
  public hoverboardCount: number = 3;
  private isHoverboardActive: boolean = false;
  private hoverboardMesh: THREE.Group | null = null;
  private hoverboardShieldMesh: THREE.Mesh | null = null;
  private invulnerableTimer: number = 0;

  // 3D Entities
  private playerGroup: THREE.Group;
  private chaserGroup: THREE.Group; // Inspector + Dog
  private dogMesh: THREE.Group;
  private inspectorMesh: THREE.Group;
  private obstacles: ObstacleData[] = [];
  private collectibles: CollectibleData[] = [];
  private particles: Particle[] = [];
  private trackChunks: THREE.Group[] = [];
  private nextChunkZ: number = -40;
  private readonly chunkLength: number = 80;

  // Meshes parts for animation
  private leftLeg: THREE.Group | null = null;
  private rightLeg: THREE.Group | null = null;
  private leftArm: THREE.Group | null = null;
  private rightArm: THREE.Group | null = null;
  private torso: THREE.Mesh | null = null;
  private sprayCan: THREE.Group | null = null;
  private runCycleTime: number = 0;

  // Colors & Customization
  public currentCharacter = {
    shirtColor: 0x0284c7, // Sky Blue Hoodie
    pantsColor: 0x1e293b, // Dark denim
    capColor: 0xdc2626,   // Red cap
    skinColor: 0xffdbac,
  };
  public currentBoard = {
    primaryColor: 0xf59e0b, // Amber
    accentColor: 0xef4444,  // Red
    glowColor: 0x06b6d4,    // Cyan
  };

  // Reusable materials
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Init Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.009);

    // Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 350);
    this.camera.position.set(0, 4.2, 6.8);
    this.camera.lookAt(0, 1.6, -10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lights
    this.setupLighting();

    // Shared Geometries & Materials
    this.coinGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 16);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.25,
    });

    // Build Player & Chasers
    this.playerGroup = this.createPlayerModel();
    this.scene.add(this.playerGroup);

    const { chasers, inspector, dog } = this.createChasers();
    this.chaserGroup = chasers;
    this.inspectorMesh = inspector;
    this.dogMesh = dog;
    this.scene.add(this.chaserGroup);

    // Pre-populate Initial World Chunks
    for (let i = 0; i < 5; i++) {
      this.spawnTrackChunk(i === 0);
    }

    // Event Listeners
    window.addEventListener('resize', this.onResize);
    this.setupInputListeners();

    // Start Loop
    this.clock.start();
    this.animate();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    dirLight.position.set(20, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    this.scene.add(dirLight);

    // Colorful city sky dome gradient
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x334155, 0.6);
    this.scene.add(hemiLight);
  }

  // --- 3D ASSET BUILDERS ---

  private createPlayerModel(): THREE.Group {
    const group = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: this.currentCharacter.skinColor, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: this.currentCharacter.shirtColor, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: this.currentCharacter.pantsColor, roughness: 0.7 });
    const capMat = new THREE.MeshStandardMaterial({ color: this.currentCharacter.capColor, roughness: 0.4 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Torso (Hoodie)
    const torsoGeo = new THREE.BoxGeometry(0.75, 0.9, 0.45);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 1.25;
    this.torso.castShadow = true;
    group.add(this.torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.95;
    head.castShadow = true;
    group.add(head);

    // Cap (Backwards visor Subway Surfers signature)
    const capGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.16, 16);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 2.08, 0);
    const visorGeo = new THREE.BoxGeometry(0.3, 0.04, 0.28);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 2.02, 0.32); // Backwards visor facing rear!
    group.add(cap);
    group.add(visor);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8);

    this.leftArm = new THREE.Group();
    const lArmMesh = new THREE.Mesh(armGeo, shirtMat);
    lArmMesh.position.y = -0.3;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);
    this.leftArm.position.set(-0.48, 1.6, 0);
    group.add(this.leftArm);

    this.rightArm = new THREE.Group();
    const rArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rArmMesh.position.y = -0.3;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);
    this.rightArm.position.set(0.48, 1.6, 0);

    // Spray paint can in right hand!
    this.sprayCan = new THREE.Group();
    const canBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 })
    );
    const canCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    canCap.position.y = 0.13;
    this.sprayCan.add(canBody);
    this.sprayCan.add(canCap);
    this.sprayCan.position.set(0, -0.6, 0.1);
    this.rightArm.add(this.sprayCan);

    group.add(this.rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.7, 8);
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.14, 0.38);

    // Left Leg
    this.leftLeg = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legGeo, pantsMat);
    lLegMesh.position.y = -0.35;
    lLegMesh.castShadow = true;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.72, -0.06);
    lShoe.castShadow = true;
    this.leftLeg.add(lLegMesh);
    this.leftLeg.add(lShoe);
    this.leftLeg.position.set(-0.22, 0.8, 0);
    group.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rLegMesh.position.y = -0.35;
    rLegMesh.castShadow = true;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.72, -0.06);
    rShoe.castShadow = true;
    this.rightLeg.add(rLegMesh);
    this.rightLeg.add(rShoe);
    this.rightLeg.position.set(0.22, 0.8, 0);
    group.add(this.rightLeg);

    // Hoverboard Mesh (hidden by default)
    this.hoverboardMesh = this.createHoverboardMesh();
    this.hoverboardMesh.visible = false;
    group.add(this.hoverboardMesh);

    // Hoverboard Shield
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    this.hoverboardShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.hoverboardShieldMesh.position.y = 1.1;
    this.hoverboardShieldMesh.visible = false;
    group.add(this.hoverboardShieldMesh);

    return group;
  }

  private createHoverboardMesh(): THREE.Group {
    const board = new THREE.Group();

    // Board Deck
    const deckGeo = new THREE.BoxGeometry(0.85, 0.08, 1.8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: this.currentBoard.primaryColor,
      metalness: 0.5,
      roughness: 0.3,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.06;
    deck.castShadow = true;
    board.add(deck);

    // Neon Trim
    const trimGeo = new THREE.BoxGeometry(0.9, 0.04, 1.84);
    const trimMat = new THREE.MeshBasicMaterial({ color: this.currentBoard.glowColor });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.05;
    board.add(trim);

    // Jet Emitters under board
    [-0.5, 0.5].forEach(zPos => {
      const emitterGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.1, 8);
      const emitterMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
      const em = new THREE.Mesh(emitterGeo, emitterMat);
      em.position.set(0, 0.0, zPos);
      board.add(em);
    });

    board.position.set(0, 0.05, 0);
    return board;
  }

  private createChasers(): { chasers: THREE.Group; inspector: THREE.Group; dog: THREE.Group } {
    const chasers = new THREE.Group();

    // --- Inspector ---
    const inspector = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a }); // Dark police blue
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8 });

    // Belly / Torso (heftier Inspector body)
    const bodyGeo = new THREE.BoxGeometry(1.0, 1.1, 0.6);
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.y = 1.35;
    inspector.add(body);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.65), beltMat);
    belt.position.y = 1.0;
    inspector.add(belt);

    // Head & Police Cap
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), skinMat);
    head.position.y = 2.15;
    inspector.add(head);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.2, 12), suitMat);
    cap.position.y = 2.4;
    inspector.add(cap);

    // Baton / Flashlight
    const baton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    baton.position.set(0.65, 1.4, -0.2);
    baton.rotateX(Math.PI / 4);
    inspector.add(baton);

    // Legs
    [-0.26, 0.26].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.8, 8), suitMat);
      leg.position.set(x, 0.4, 0);
      inspector.add(leg);
    });

    inspector.position.set(-0.8, 0, 4.0);
    chasers.add(inspector);

    // --- Dog (Pitbull) ---
    const dog = new THREE.Group();
    const dogMat = new THREE.MeshStandardMaterial({ color: 0x78350f }); // Brown
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 }); // Red collar with spikes

    const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.9), dogMat);
    dogBody.position.y = 0.55;
    dog.add(dogBody);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.2), collarMat);
    collar.position.set(0, 0.65, -0.4);
    dog.add(collar);

    const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), dogMat);
    dogHead.position.set(0, 0.75, -0.6);
    dog.add(dogHead);

    // 4 Paws
    [
      [-0.2, 0.25, -0.3],
      [0.2, 0.25, -0.3],
      [-0.2, 0.25, 0.3],
      [0.2, 0.25, 0.3],
    ].forEach(([x, y, z]) => {
      const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), dogMat);
      paw.position.set(x, y, z);
      dog.add(paw);
    });

    dog.position.set(0.8, 0, 3.8);
    chasers.add(dog);

    return { chasers, inspector, dog };
  }

  // --- TRACK & CHUNK GENERATION ---

  private spawnTrackChunk(isFirst: boolean) {
    const chunk = new THREE.Group();
    const chunkZ = this.nextChunkZ;
    chunk.position.z = chunkZ;

    // Ground Ballast (Gravel track bed)
    const ballastGeo = new THREE.BoxGeometry(16, 0.4, this.chunkLength);
    const ballastMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate gravel ballast
      roughness: 0.95,
      metalness: 0.1,
    });
    const ballast = new THREE.Mesh(ballastGeo, ballastMat);
    ballast.position.y = -0.2;
    ballast.receiveShadow = true;
    chunk.add(ballast);

    // 3 Subway Track Lines (Left: -2.8, Center: 0, Right: +2.8)
    const lanes: Lane[] = [-1, 0, 1];
    lanes.forEach(lane => {
      const laneX = lane * this.laneWidth;

      // Wooden Railroad Ties (Sleepers)
      const sleeperCount = Math.floor(this.chunkLength / 2.2);
      const sleeperGeo = new THREE.BoxGeometry(2.1, 0.1, 0.4);
      const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });

      for (let s = 0; s < sleeperCount; s++) {
        const sleeperZ = -this.chunkLength / 2 + s * 2.2;
        const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
        sleeper.position.set(laneX, 0.04, sleeperZ);
        sleeper.receiveShadow = true;
        chunk.add(sleeper);
      }

      // Twin Steel Shiny Rails
      const railGeo = new THREE.BoxGeometry(0.08, 0.12, this.chunkLength);
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.25,
      });

      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(laneX - 0.75, 0.14, 0);
      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(laneX + 0.75, 0.14, 0);
      chunk.add(leftRail);
      chunk.add(rightRail);
    });

    // Side Walls with Subway Graffiti & Architecture
    [-8.5, 8.5].forEach((wallX, sideIdx) => {
      const wallGeo = new THREE.BoxGeometry(1.2, 7.5, this.chunkLength);
      const wallMat = new THREE.MeshStandardMaterial({
        color: sideIdx === 0 ? 0x64748b : 0x475569,
        roughness: 0.8,
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallX, 3.5, 0);
      wall.receiveShadow = true;
      chunk.add(wall);

      // Graffiti Decal Plates along the wall
      for (let g = -30; g <= 30; g += 25) {
        const tagGeo = new THREE.PlaneGeometry(5.5, 2.5);
        const tagColors = [0xec4899, 0xeab308, 0x06b6d4, 0x10b981, 0x8b5cf6, 0xf97316];
        const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];
        const tagMat = new THREE.MeshBasicMaterial({
          color: randomColor,
          side: THREE.DoubleSide,
        });
        const tag = new THREE.Mesh(tagGeo, tagMat);
        tag.position.set(sideIdx === 0 ? wallX + 0.62 : wallX - 0.62, 2.8, g);
        tag.rotateY(sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2);
        chunk.add(tag);
      }
    });

    // Overhead Signal Gantries with Lights
    const gantry = this.createOverheadGantry();
    gantry.position.set(0, 0, -this.chunkLength / 4);
    chunk.add(gantry);

    // City Backdrop Silhouette (Buildings & Sky Billboards)
    this.createCityBuildings(chunk);

    this.scene.add(chunk);
    this.trackChunks.push(chunk);

    // Generate Obstacles and Pickups for this chunk (skip first chunk to allow clean start)
    if (!isFirst) {
      this.populateChunkContent(chunkZ);
    }

    this.nextChunkZ -= this.chunkLength;
  }

  private createOverheadGantry(): THREE.Group {
    const gantry = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });

    // Left and Right Posts
    [-7.5, 7.5].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7.0, 8), metalMat);
      post.position.set(x, 3.5, 0);
      gantry.add(post);
    });

    // Overhead Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.4, 0.4), metalMat);
    beam.position.set(0, 6.8, 0);
    gantry.add(beam);

    // Signal Traffic Lights over each lane
    [-1, 0, 1].forEach(lane => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.3), metalMat);
      box.position.set(lane * this.laneWidth, 6.0, 0);
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0x22c55e : 0xef4444 })
      );
      light.position.set(lane * this.laneWidth, 6.0, 0.16);
      gantry.add(box);
      gantry.add(light);
    });

    return gantry;
  }

  private createCityBuildings(chunk: THREE.Group) {
    [-24, 24].forEach(xSide => {
      for (let b = -30; b <= 30; b += 22) {
        const height = 18 + Math.random() * 25;
        const width = 12 + Math.random() * 6;
        const buildingGeo = new THREE.BoxGeometry(width, height, 16);
        const buildingMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.8,
        });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.set(xSide, height / 2 - 2, b);
        chunk.add(building);

        // Lit Windows on buildings
        for (let wy = 4; wy < height - 3; wy += 4) {
          const winGeo = new THREE.PlaneGeometry(width * 0.7, 1.2);
          const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.5 });
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(xSide > 0 ? xSide - width / 2 - 0.05 : xSide + width / 2 + 0.05, wy, b);
          win.rotateY(xSide > 0 ? -Math.PI / 2 : Math.PI / 2);
          chunk.add(win);
        }
      }
    });
  }

  // --- OBSTACLE & PICKUP GENERATOR ---

  private populateChunkContent(chunkZ: number) {
    const lanes: Lane[] = [-1, 0, 1];
    const segmentCount = 3; // 3 obstacle waves per chunk
    const step = this.chunkLength / (segmentCount + 1);

    for (let s = 1; s <= segmentCount; s++) {
      const zPos = chunkZ + this.chunkLength / 2 - s * step;

      // Randomly select 1 or 2 lanes to place obstacles (always leaving at least 1 lane free or navigable)
      const shuffledLanes = [...lanes].sort(() => Math.random() - 0.5);
      const obstacleLanesCount = Math.random() < 0.65 ? 2 : 1;
      const chosenLanes = shuffledLanes.slice(0, obstacleLanesCount);

      chosenLanes.forEach(lane => {
        const roll = Math.random();
        if (roll < 0.38) {
          // Stationary or Moving Subway Train!
          const isMoving = Math.random() < 0.35 && this.score > 600;
          this.spawnTrain(lane, zPos, isMoving);
        } else if (roll < 0.68) {
          // Low Barrier (Must Jump or switch lane)
          this.spawnLowHurdle(lane, zPos);
        } else {
          // High Barrier (Must Slide or switch lane)
          this.spawnHighHurdle(lane, zPos);
        }
      });

      // Free lane gets coins or powerups!
      const freeLane = shuffledLanes.find(l => !chosenLanes.includes(l)) || 0;
      this.spawnCollectiblesLane(freeLane, zPos);
    }
  }

  // 1. Subway Train Car
  private spawnTrain(lane: Lane, zPos: number, isMoving: boolean) {
    const train = new THREE.Group();
    const length = 18;
    const height = 3.2;
    const width = 2.4;

    const trainColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xf59e0b]; // Red Line, Blue Line, Green Line, Orange
    const bodyColor = trainColors[Math.floor(Math.random() * trainColors.length)];

    // Train Body (Main Shell)
    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.65,
      roughness: 0.35,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);

    // Train Roof (walkable top!)
    const roofGeo = new THREE.BoxGeometry(width + 0.1, 0.15, length);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.08;
    roof.receiveShadow = true;
    train.add(roof);

    // Front Windshield
    const windowGeo = new THREE.PlaneGeometry(width * 0.85, 1.2);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const frontWindow = new THREE.Mesh(windowGeo, windowMat);
    frontWindow.position.set(0, height * 0.65, length / 2 + 0.02);
    train.add(frontWindow);

    // Headlights (glowing yellow/white)
    [-0.7, 0.7].forEach(x => {
      const lightGeo = new THREE.CircleGeometry(0.2, 12);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, 0.8, length / 2 + 0.03);
      train.add(light);
    });

    // Side Windows
    for (let w = -length / 2 + 2; w <= length / 2 - 2; w += 3.2) {
      [-width / 2 - 0.02, width / 2 + 0.02].forEach(sideX => {
        const sideWin = new THREE.Mesh(
          new THREE.PlaneGeometry(2.0, 1.0),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 })
        );
        sideWin.position.set(sideX, height * 0.62, w);
        sideWin.rotateY(sideX < 0 ? -Math.PI / 2 : Math.PI / 2);
        train.add(sideWin);
      });
    }

    // Ramp in front of train so player can run straight onto roof! (50% chance)
    let hasRamp = false;
    if (!isMoving && Math.random() < 0.5) {
      hasRamp = true;
      const rampGeo = new THREE.BufferGeometry();
      // Triangle ramp wedge
      const rampLength = 5.0;
      const rampWidth = width;
      const rampHeight = height;

      const rampMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rampWidth, 0.3, rampLength),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
      );
      rampMesh.position.set(0, rampHeight / 2, length / 2 + rampLength / 2);
      rampMesh.rotation.x = Math.atan2(rampHeight, rampLength);
      train.add(rampMesh);
    }

    train.position.set(lane * this.laneWidth, 0, zPos);
    this.scene.add(train);

    // Coins on top of train!
    const coinsOnRoofCount = 5;
    for (let c = 0; c < coinsOnRoofCount; c++) {
      const coinZ = zPos - length / 2 + 2 + c * 3;
      this.spawnSingleCoin(lane, coinZ, height + 0.6);
    }

    this.obstacles.push({
      mesh: train,
      lane,
      z: zPos,
      type: isMoving ? 'moving_train' : 'train',
      height,
      width,
      length,
      speed: isMoving ? 14 : 0,
      boundingYMin: 0,
      boundingYMax: height,
      hasRamp,
    });
  }

  // 2. Low Hurdle (Jump or switch lane)
  private spawnLowHurdle(lane: Lane, zPos: number) {
    const hurdle = new THREE.Group();
    const barMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });

    // Side Posts
    [-1.1, 1.1].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), postMat);
      post.position.set(x, 0.55, 0);
      post.castShadow = true;
      hurdle.add(post);
    });

    // Striped Crossbar (Yellow & Black stripes)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 0.15), barMat);
    bar.position.set(0, 0.85, 0);
    bar.castShadow = true;
    hurdle.add(bar);

    hurdle.position.set(lane * this.laneWidth, 0, zPos);
    this.scene.add(hurdle);

    this.obstacles.push({
      mesh: hurdle,
      lane,
      z: zPos,
      type: 'low_hurdle',
      height: 1.05,
      width: 2.4,
      length: 0.5,
      boundingYMin: 0,
      boundingYMax: 1.05,
    });

    // Add arc of 3 coins jumping over the low barrier!
    [-2, 0, 2].forEach(offset => {
      const coinY = offset === 0 ? 1.9 : 1.3;
      this.spawnSingleCoin(lane, zPos + offset, coinY);
    });
  }

  // 3. High Hurdle (Slide under or switch lane)
  private spawnHighHurdle(lane: Lane, zPos: number) {
    const hurdle = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

    // Tall Side Posts
    [-1.15, 1.15].forEach(x => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8), postMat);
      post.position.set(x, 1.25, 0);
      post.castShadow = true;
      hurdle.add(post);
    });

    // High overhead barrier with warning sign (Leaves space at bottom to slide under!)
    const overheadBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.2), signMat);
    overheadBar.position.set(0, 1.85, 0); // 1.2m gap underneath!
    overheadBar.castShadow = true;
    hurdle.add(overheadBar);

    hurdle.position.set(lane * this.laneWidth, 0, zPos);
    this.scene.add(hurdle);

    this.obstacles.push({
      mesh: hurdle,
      lane,
      z: zPos,
      type: 'high_hurdle',
      height: 2.5,
      width: 2.4,
      length: 0.5,
      boundingYMin: 1.15, // clearance below this!
      boundingYMax: 2.5,
    });

    // Add coin line on the ground directly under the hurdle rewarding sliding!
    [-2, 0, 2].forEach(offset => {
      this.spawnSingleCoin(lane, zPos + offset, 0.4);
    });
  }

  // Collectibles Generator
  private spawnCollectiblesLane(lane: Lane, zPos: number) {
    // 20% chance of PowerUp or Word Hunt letter, otherwise coin trail!
    const roll = Math.random();
    if (roll < 0.08) {
      this.spawnPowerUp(lane, zPos, 'jetpack');
    } else if (roll < 0.16) {
      this.spawnPowerUp(lane, zPos, 'magnet');
    } else if (roll < 0.24) {
      this.spawnPowerUp(lane, zPos, 'sneakers');
    } else if (roll < 0.30) {
      this.spawnPowerUp(lane, zPos, 'multiplier');
    } else if (roll < 0.38) {
      const wordLetters = ['S', 'U', 'R', 'F'];
      const letter = wordLetters[Math.floor(Math.random() * wordLetters.length)];
      this.spawnWordLetter(lane, zPos, letter);
    } else {
      // Row of 4 coins
      for (let i = -6; i <= 6; i += 3) {
        this.spawnSingleCoin(lane, zPos + i, 0.7);
      }
    }
  }

  private spawnSingleCoin(lane: Lane, z: number, y: number) {
    const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    coin.position.set(lane * this.laneWidth, y, z);
    coin.castShadow = true;
    this.scene.add(coin);

    this.collectibles.push({
      mesh: coin,
      lane,
      z,
      y,
      type: 'coin',
      collected: false,
    });
  }

  private spawnPowerUp(lane: Lane, z: number, type: PowerUpType) {
    const group = new THREE.Group();

    if (type === 'jetpack') {
      // Dual Rocket Jetpack
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
      [-0.2, 0.2].forEach(x => {
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), rocketMat);
        cylinder.position.set(x, 0, 0);
        group.add(cylinder);
      });
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      group.add(strap);
    } else if (type === 'magnet') {
      // U-Shaped Magnet
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
      const uShape = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 8, 16, Math.PI), redMat);
      uShape.rotation.z = Math.PI;
      group.add(uShape);

      [-0.28, 0.28].forEach(x => {
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), tipMat);
        tip.position.set(x, 0.12, 0);
        group.add(tip);
      });
    } else if (type === 'sneakers') {
      // High-Top Sneakers with Spring
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.35, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
      );
      const spring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
      );
      spring.position.y = -0.25;
      group.add(shoe);
      group.add(spring);
    } else {
      // 2x Multiplier Star
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.4),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.6 })
      );
      group.add(star);
    }

    // Floating Aura Halo
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    halo.rotateX(Math.PI / 2);
    group.add(halo);

    group.position.set(lane * this.laneWidth, 1.2, z);
    this.scene.add(group);

    this.collectibles.push({
      mesh: group,
      lane,
      z,
      y: 1.2,
      type,
      collected: false,
    });
  }

  private spawnWordLetter(lane: Lane, z: number, letter: string) {
    const group = new THREE.Group();

    // Glowing Neon Cube with Letter
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), cubeMat);
    group.add(cube);

    group.position.set(lane * this.laneWidth, 1.3, z);
    this.scene.add(group);

    this.collectibles.push({
      mesh: group,
      lane,
      z,
      y: 1.3,
      type: 'letter',
      letter,
      collected: false,
    });
  }

  // --- CONTROLS & INPUTS ---

  private setupInputListeners() {
    // Keyboard Controls
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.status !== 'running') {
        if (e.code === 'Space' || e.key === 'Enter') {
          if (this.status === 'idle') this.startRun();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLane(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveLane(1);
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.roll();
          break;
        case 'Space':
          this.activateHoverboard();
          break;
      }
    });

    // Touch & Swipe Controls
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    const dom = this.container;

    dom.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();

          // Double tap detection for Hoverboard
          const now = Date.now();
          if (now - lastTapTime < 300) {
            this.activateHoverboard();
          }
          lastTapTime = now;
        }
      },
      { passive: false }
    );

    dom.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (this.status !== 'running') return;
        if (e.changedTouches.length === 0) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const dt = Date.now() - touchStartTime;

        // Minimum swipe distance
        if (dt < 400 && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal Swipe
            if (dx > 0) {
              this.moveLane(1);
            } else {
              this.moveLane(-1);
            }
          } else {
            // Vertical Swipe
            if (dy < 0) {
              this.jump();
            } else {
              this.roll();
            }
          }
        }
      },
      { passive: false }
    );
  }

  // --- ACTIONS ---

  public moveLane(direction: number) {
    if (this.status !== 'running') return;
    const newLane = (this.currentLane + direction) as Lane;
    if (newLane >= -1 && newLane <= 1) {
      this.targetLane = newLane;
      this.currentLane = newLane;
      soundManager.playLaneSwitch();
    }
  }

  public jump() {
    if (this.status !== 'running') return;
    if (this.powerUps.jetpack.active) return; // jetpack overrides jump

    // Super sneakers allow double-high jumps!
    const jumpPower = this.powerUps.sneakers.active ? this.jumpVelocity * 1.45 : this.jumpVelocity;

    if (this.isGrounded) {
      this.vy = jumpPower;
      this.isGrounded = false;
      this.isJumping = true;
      this.isSliding = false; // cancel slide
      soundManager.playJump();
      this.callbacks.onMissionProgress('jump', 1);
    }
  }

  public roll() {
    if (this.status !== 'running') return;
    if (this.powerUps.jetpack.active) return;

    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    soundManager.playSlide();
    this.callbacks.onMissionProgress('roll', 1);

    // Quick Drop if player was in mid-air
    if (!this.isGrounded) {
      this.vy = -this.gravity * 0.9; // Slam down immediately
    }
  }

  public activateHoverboard() {
    if (this.status !== 'running') return;
    if (this.isHoverboardActive || this.hoverboardCount <= 0) return;

    this.hoverboardCount--;
    this.isHoverboardActive = true;
    soundManager.playHoverboard();

    if (this.hoverboardMesh) this.hoverboardMesh.visible = true;
    if (this.hoverboardShieldMesh) this.hoverboardShieldMesh.visible = true;

    this.callbacks.onHoverboardUpdate(true, this.hoverboardCount);
    this.callbacks.onMissionProgress('hoverboard', 1);
  }

  // --- GAME LIFECYCLE ---

  public startRun() {
    this.status = 'running';
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.scoreMultiplier = 1;
    this.runSpeed = this.baseSpeed;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.currentLane = 0;
    this.targetLane = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.isStumbling = false;
    this.invulnerableTimer = 0;

    // Reset powerups
    (Object.keys(this.powerUps) as PowerUpType[]).forEach(type => {
      this.powerUps[type].active = false;
      this.powerUps[type].timeLeft = 0;
      this.callbacks.onPowerUpUpdate(type, false, 0, this.powerUps[type].duration);
    });

    if (this.hoverboardMesh) this.hoverboardMesh.visible = false;
    if (this.hoverboardShieldMesh) this.hoverboardShieldMesh.visible = false;
    this.isHoverboardActive = false;

    // Sound FX: Start Whistle & Run Music
    soundManager.playWhistle();
    soundManager.startMusic();
  }

  public pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      soundManager.stopMusic();
    }
  }

  public resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      soundManager.startMusic();
    }
  }

  public restart() {
    // Clear dynamic obstacles and collectibles
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.obstacles = [];

    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.collectibles = [];

    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    // Reset tracks
    this.trackChunks.forEach(c => this.scene.remove(c));
    this.trackChunks = [];
    this.nextChunkZ = -40;

    for (let i = 0; i < 5; i++) {
      this.spawnTrackChunk(i === 0);
    }

    this.startRun();
  }

  public revive() {
    // Give player a second chance!
    this.status = 'running';
    this.invulnerableTimer = 2.5; // 2.5 seconds invulnerability
    this.playerY = 0;
    this.groundY = 0;
    this.vy = 0;
    this.isGrounded = true;

    // Push any obstacle directly in front away
    this.obstacles = this.obstacles.filter(o => {
      if (Math.abs(o.z - this.playerZ) < 15) {
        this.scene.remove(o.mesh);
        return false;
      }
      return true;
    });

    soundManager.startMusic();
  }

  // --- MAIN LOOP ---

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.status === 'running') {
      this.updatePhysics(dt);
      this.updateWorld(dt);
      this.updatePowerUps(dt);
      this.updateCollisions();
      this.updateChasers(dt);
      this.updateParticles(dt);
      this.updateScoreAndStats(dt);
    }

    this.updateCamera(dt);
    this.animatePlayerMesh(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(dt: number) {
    // 1. Forward run
    this.playerZ -= this.runSpeed * dt;
    this.distance = Math.floor(Math.abs(this.playerZ));

    // Increase speed gradually up to maxSpeed
    if (this.runSpeed < this.maxSpeed) {
      this.runSpeed += 0.15 * dt;
    }

    // 2. Horizontal Lane Interpolation
    const targetX = this.targetLane * this.laneWidth;
    this.playerX += (targetX - this.playerX) * 16 * dt;

    // 3. Vertical Physics & Jetpack
    if (this.powerUps.jetpack.active) {
      // Fly up high into the air (Y = 8.5)
      const targetFlightY = 8.5;
      this.playerY += (targetFlightY - this.playerY) * 6 * dt;
      this.isGrounded = false;

      // Spawn Jetpack Thruster Flame Particles
      if (Math.random() < 0.6) {
        this.spawnJetpackParticle();
      }
    } else {
      // Normal Gravity & Jumping
      this.vy -= this.gravity * dt;
      this.playerY += this.vy * dt;

      // Check ground level (could be train top at y = 2.8 or ground at y = 0)
      if (this.playerY <= this.groundY) {
        this.playerY = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.isGrounded = false;
      }
    }

    // 4. Slide duration timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 5. Update Player Position in 3D Scene
    this.playerGroup.position.set(this.playerX, this.playerY, this.playerZ);

    // Roll rotation / tuck
    if (this.isSliding) {
      this.playerGroup.rotation.x = -Math.PI / 4;
      this.playerGroup.position.y = this.playerY + 0.35;
    } else {
      this.playerGroup.rotation.x = 0;
    }

    // Slight bank tilt when switching lanes
    const dx = targetX - this.playerX;
    this.playerGroup.rotation.z = -dx * 0.12;

    // Invulnerability flashing
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.playerGroup.visible = Math.floor(Date.now() / 80) % 2 === 0;
    } else {
      this.playerGroup.visible = true;
    }
  }

  private updateWorld(dt: number) {
    // 1. Recycle Old Chunks and Spawn New Chunks ahead
    const recycleThreshold = this.playerZ + 60;
    for (let i = this.trackChunks.length - 1; i >= 0; i--) {
      const chunk = this.trackChunks[i];
      if (chunk.position.z > recycleThreshold) {
        this.scene.remove(chunk);
        this.trackChunks.splice(i, 1);
        this.spawnTrackChunk(false);
      }
    }

    // 2. Update Moving Trains
    this.obstacles.forEach(o => {
      if (o.type === 'moving_train' && o.speed) {
        o.mesh.position.z += o.speed * dt; // Moving towards player!
        o.z = o.mesh.position.z;

        // Honk horn when train gets close
        if (o.z > this.playerZ - 35 && o.z < this.playerZ - 30) {
          soundManager.playTrainHorn();
        }
      }
    });

    // Clean up passed obstacles
    this.obstacles = this.obstacles.filter(o => {
      if (o.z > this.playerZ + 25) {
        this.scene.remove(o.mesh);
        return false;
      }
      return true;
    });

    // 3. Rotate & Animate Collectibles (Coins & Powerups)
    const time = this.clock.getElapsedTime();
    this.collectibles.forEach(c => {
      if (!c.collected) {
        c.mesh.rotation.y = time * 3.5;
        if (c.type === 'coin') {
          c.mesh.position.y = c.y + Math.sin(time * 6 + c.z) * 0.08;
        }

        // Magnet Attraction Physics!
        if (this.powerUps.magnet.active && c.type === 'coin') {
          const distToPlayer = c.mesh.position.distanceTo(this.playerGroup.position);
          if (distToPlayer < 14) {
            // Pull coin towards player!
            c.mesh.position.lerp(
              new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ),
              14 * dt
            );
          }
        }
      }
    });

    // Clean up passed collectibles
    this.collectibles = this.collectibles.filter(c => {
      if (c.collected || c.z > this.playerZ + 15) {
        this.scene.remove(c.mesh);
        return false;
      }
      return true;
    });
  }

  private updatePowerUps(dt: number) {
    (Object.keys(this.powerUps) as PowerUpType[]).forEach(type => {
      const p = this.powerUps[type];
      if (p.active) {
        p.timeLeft -= dt;
        if (p.timeLeft <= 0) {
          p.active = false;
          p.timeLeft = 0;
          this.callbacks.onPowerUpUpdate(type, false, 0, p.duration);
        } else {
          this.callbacks.onPowerUpUpdate(type, true, p.timeLeft, p.duration);
        }
      }
    });

    // Score multiplier logic
    this.scoreMultiplier = this.baseMultiplier * (this.powerUps.multiplier.active ? 2 : 1);
  }

  // --- COLLISION DETECTION ---

  private updateCollisions() {
    // If invulnerable (just crashed hoverboard or revived), ignore obstacle collision
    if (this.invulnerableTimer > 0) return;

    // Check train roof landing first to set groundY
    let onTrainRoof = false;
    let newGroundY = 0;

    const playerBoxX = this.playerX;
    const playerBoxZ = this.playerZ;

    for (const obs of this.obstacles) {
      if (obs.type === 'train' || obs.type === 'moving_train') {
        const trainZMin = obs.z - obs.length / 2;
        const trainZMax = obs.z + obs.length / 2;
        const trainX = obs.lane * this.laneWidth;

        // Is player within train footprint?
        if (
          Math.abs(playerBoxX - trainX) < 1.2 &&
          playerBoxZ >= trainZMin &&
          playerBoxZ <= trainZMax
        ) {
          if (this.playerY >= obs.height - 0.4) {
            // Player is standing or landed on train roof!
            onTrainRoof = true;
            newGroundY = obs.height;
          }
        }
      }
    }

    this.groundY = onTrainRoof ? newGroundY : 0;

    // Check Obstacle Crashes
    for (const obs of this.obstacles) {
      const obsX = obs.lane * this.laneWidth;
      const xDist = Math.abs(playerBoxX - obsX);
      const zDist = Math.abs(playerBoxZ - obs.z);

      // Are we in the collision zone for this obstacle?
      if (xDist < 1.2 && zDist < obs.length / 2 + 0.4) {
        // Height checks:
        let hit = false;

        if (obs.type === 'low_hurdle') {
          // If player didn't jump over it (jump height must be > 1.0m)
          if (this.playerY < 0.95) {
            hit = true;
          }
        } else if (obs.type === 'high_hurdle') {
          // Player must be sliding under (sliding height ~0.7m, hurdle clearance is 1.15m)
          if (!this.isSliding || this.playerY > 0.5) {
            hit = true;
          }
        } else if (obs.type === 'train' || obs.type === 'moving_train') {
          // Check if player hit front of train or side of train
          if (this.playerY < obs.height - 0.4) {
            if (obs.hasRamp && playerBoxZ > obs.z + obs.length / 2 - 1.5) {
              // Hit ramp - smoothly ramp up onto train!
              this.playerY = THREE.MathUtils.lerp(this.playerY, obs.height, 0.4);
            } else {
              hit = true;
            }
          }
        }

        if (hit) {
          this.handleCrash();
          return;
        }
      }
    }

    // Check Collectible Pickups (Coins & Powerups)
    for (const col of this.collectibles) {
      if (!col.collected) {
        const dist = col.mesh.position.distanceTo(
          new THREE.Vector3(this.playerX, this.playerY + 0.9, this.playerZ)
        );

        if (dist < 1.4) {
          col.collected = true;
          this.scene.remove(col.mesh);

          if (col.type === 'coin') {
            const coinGain = this.powerUps.multiplier.active ? 2 : 1;
            this.coins += coinGain;
            this.score += 20 * coinGain;
            soundManager.playCoin();
            this.callbacks.onMissionProgress('coins', coinGain);
            this.spawnCoinSparkleParticle(this.playerX, this.playerY + 0.9, this.playerZ);
          } else if (col.type === 'letter') {
            soundManager.playPowerup();
            if (col.letter) {
              this.callbacks.onWordLetterCollected(col.letter);
              this.callbacks.onMissionProgress('letters', 1);
            }
          } else {
            // PowerUp
            soundManager.playPowerup();
            const pType = col.type as PowerUpType;
            this.powerUps[pType].active = true;
            this.powerUps[pType].timeLeft = this.powerUps[pType].duration;
            this.callbacks.onPowerUpUpdate(
              pType,
              true,
              this.powerUps[pType].duration,
              this.powerUps[pType].duration
            );
          }
        }
      }
    }
  }

  private handleCrash() {
    if (this.isHoverboardActive) {
      // Hoverboard shields player from 1 fatal crash!
      this.isHoverboardActive = false;
      this.invulnerableTimer = 1.8;
      if (this.hoverboardMesh) this.hoverboardMesh.visible = false;
      if (this.hoverboardShieldMesh) this.hoverboardShieldMesh.visible = false;
      soundManager.playShieldBreak();
      this.callbacks.onHoverboardUpdate(false, this.hoverboardCount);
      return;
    }

    // Fatal Crash
    this.status = 'crashed';
    soundManager.stopMusic();
    soundManager.playCrash();

    // Inspector rushes in to catch player!
    this.chaserGroup.position.set(this.playerX, this.playerY, this.playerZ + 0.8);

    setTimeout(() => {
      this.status = 'gameover';
      this.callbacks.onGameOver(this.score, this.coins, this.distance);
    }, 700);
  }

  // --- CHASERS & PARTICLES ---

  private updateChasers(dt: number) {
    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
      }
    }

    // Chasers follow player closely
    const targetChaserZ = this.isStumbling ? this.playerZ + 1.8 : this.playerZ + 4.8;
    this.chaserGroup.position.z += (targetChaserZ - this.chaserGroup.position.z) * 6 * dt;
    this.chaserGroup.position.x += (this.playerX - this.chaserGroup.position.x) * 8 * dt;
    this.chaserGroup.position.y = this.playerY;

    // Inspector run animation & dog run
    const time = this.clock.getElapsedTime();
    this.inspectorMesh.rotation.y = Math.sin(time * 12) * 0.1;
    this.dogMesh.position.y = Math.abs(Math.sin(time * 18)) * 0.25;
  }

  private animatePlayerMesh(dt: number) {
    if (this.status === 'running') {
      this.runCycleTime += dt * (this.runSpeed * 0.65);

      if (this.isGrounded && !this.isSliding) {
        // Authentic running stride cycle!
        const legAngle = Math.sin(this.runCycleTime) * 0.85;
        if (this.leftLeg) this.leftLeg.rotation.x = legAngle;
        if (this.rightLeg) this.rightLeg.rotation.x = -legAngle;

        const armAngle = Math.sin(this.runCycleTime) * 0.7;
        if (this.leftArm) this.leftArm.rotation.x = -armAngle;
        if (this.rightArm) this.rightArm.rotation.x = armAngle;

        // Subtle torso bounce
        if (this.torso) this.torso.position.y = 1.25 + Math.abs(Math.sin(this.runCycleTime * 2)) * 0.08;
      } else if (this.isJumping) {
        // Jump pose: legs tucked slightly
        if (this.leftLeg) this.leftLeg.rotation.x = 0.4;
        if (this.rightLeg) this.rightLeg.rotation.x = -0.3;
        if (this.leftArm) this.leftArm.rotation.x = -1.2;
        if (this.rightArm) this.rightArm.rotation.x = -1.2;
      }
    }
  }

  private updateCamera(dt: number) {
    // Dynamic camera following player smoothly with arcade immersion
    const targetCamZ = this.playerZ + 6.8;
    const targetCamY = Math.max(3.8, this.playerY + 3.8);
    const targetCamX = this.playerX * 0.4;

    this.camera.position.z += (targetCamZ - this.camera.position.z) * 12 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 8 * dt;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 12 * dt;

    this.camera.lookAt(this.playerX * 0.7, this.playerY + 1.6, this.playerZ - 12);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.mesh.scale.multiplyScalar(0.96);
      }
    }
  }

  private spawnCoinSparkleParticle(x: number, y: number, z: number) {
    for (let i = 0; i < 4; i++) {
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe066 })
      );
      pMesh.position.set(x, y, z);
      this.scene.add(pMesh);

      this.particles.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 4 + 1,
          (Math.random() - 0.5) * 4
        ),
        life: 0.35,
        maxLife: 0.35,
      });
    }
  }

  private spawnJetpackParticle() {
    [-0.3, 0.3].forEach(offsetX => {
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xf97316 : 0xfacc15,
        })
      );
      pMesh.position.set(this.playerX + offsetX, this.playerY + 0.8, this.playerZ + 0.4);
      this.scene.add(pMesh);

      this.particles.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          -4 - Math.random() * 2,
          5 + Math.random() * 2
        ),
        life: 0.4,
        maxLife: 0.4,
      });
    });
  }

  private updateScoreAndStats(dt: number) {
    // Score gains proportional to speed and multiplier
    this.score += Math.round(this.runSpeed * this.scoreMultiplier * dt * 3);
    this.callbacks.onScoreUpdate(this.score, this.coins, this.distance);
    this.callbacks.onMissionProgress('score', this.score);
  }

  // --- RESIZE & CLEANUP ---

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    soundManager.stopMusic();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
