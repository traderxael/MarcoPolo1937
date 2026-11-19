import * as THREE from 'three';
import { DECK_TOP, MEDALS, REC_KEY } from './config.js';

export const $ = (id) => document.getElementById(id);

export const S = {
  // Core 3D & PostFX
  renderer: null,
  scene: null,
  camera: null,
  moonLight: null,
  ambientLight: null,
  hemiLight: null,
  skyDome: null,
  baseMoonInt: 2.1,
  postFX: null,
  raycaster: new THREE.Raycaster(),

  // PBR textures
  pbr: null,

  // Assets & world geometry collections
  ASSETS: {},
  lionGroups: [],
  defenders: [],
  worldColliders: [],
  playerBoxes: [],
  floorZones: [],
  lanterns: [],
  shootableLanterns: [],
  sandbagClusters: [],
  explosiveBarrels: [],
  supplyCrate: null,
  mgEmplacement: null,
  mgHead: null,
  mgFlash: null,
  rainPoints: null,
  flareObj: null,
  flareLight: null,
  flareLife: 0,
  wanpingFireLights: [],
  waterTime: { value: 0 },
  rainTime: { value: 0 },

  // Shared materials / hitboxes
  MAT_CACHE: new Map(),
  HITBOX_MAT: new THREE.MeshBasicMaterial({ visible: false }),
  SHADOW_PROXY_MAT: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  SHADOW_PROXY_GEO: new THREE.CylinderGeometry(0.30, 0.34, 2.2, 6),
  ENEMY_TORSO_GEO: new THREE.BoxGeometry(0.92, 1.88, 0.72),
  ENEMY_HEAD_GEO: new THREE.BoxGeometry(0.54, 0.60, 0.54),
  ENEMY_FLASH_GEO: new THREE.ConeGeometry(0.09, 0.34, 5),
  ENEMY_FLASH_MAT: new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.9, depthWrite: false }),

  // Game modes & settings
  gameMode: 'campaign',
  startChapter: 0,
  diffKey: 'normal',
  gfxLevel: 'med',
  showFps: false,
  touchMode: 'auto',
  musicVol: 0.45,
  sfxVol: 1.0,
  muted: false,
  drsScale: 1.0,

  // Records & medals
  records: { bestCampaign: 0, bestSurvival: 0, bestWave: 0, totalKills: 0, medals: [] },

  // Player state
  player: {
    pos: new THREE.Vector3(34, DECK_TOP + 1.7, 0),
    hp: 100,
    armor: 50,
    yaw: Math.PI / 2,
    pitch: -0.02,
    feetY: DECK_TOP,
    velY: 0,
    onGround: true,
    vel: new THREE.Vector3()
  },
  yaw: Math.PI / 2,
  pitch: -0.02,
  targetYaw: Math.PI / 2,
  targetPitch: -0.02,
  recoilPitch: 0,
  running: false,
  alive: false,
  paused: false,
  aiming: false,
  crouching: false,
  eyeHeight: 1.7,
  mouseSens: 1.0,
  supplyCooldown: 0,
  thirdPerson: false,
  tpBlend: 0,
  crosshairBloom: 0,
  bloomHoldTimer: 0,
  dryFireCd: 0,
  avatarHitT: 0,
  streakCount: 0,
  streakTimer: 0,
  hadPointerLock: false,
  plLockTime: 0,
  jumpBuffer: 0,
  cameraShake: 0,
  artilleryTimer: 8,
  cinematic: null,
  tacticalBrief: null,
  shopOpen: false,
  inventoryOpen: false,
  invClosedAt: 0,
  inventoryFilter: 'all',
  inventorySelected: 'rifle',
  squadOrder: 'cover',
  squadWheelOpen: false,
  parryTimer: 0,
  bandageTimer: 0,
  boostTimer: 0,

  // Tactical inventory & weapons
  current: 'rifle',
  fireTimer: 0,
  reloadTimer: 0,
  flashTimer: 0,
  recoil: 0,
  meleeSwing: 0,
  grenades: 3,
  molotovs: 1,
  bandages: 2,
  mortarStrikes: 1,
  inventory: { ration: 1, plate: 1, ammo_pouch: 1, flare_kit: 0, adrenaline: 1, intel_doc: 0 },
  mp18Owned: false,
  mp18Tier: 1,
  mgMounted: false,
  mgHeat: 0,
  mgOverheated: false,
  mgTimer: 0,
  mouseDownLeft: false,
  gpFiring: false,
  touchFiring: false,

  // Input flags
  keys: {},
  touchMove: { x: 0, y: 0 },

  // Weather & stats
  rainActive: false,
  flareTimer: 10,
  lightningTimer: 11,
  wave: 0,
  toSpawn: 0,
  spawnTimer: 0,
  midWaveRadioSent: false,
  waveInitialCount: 5,
  matchRecorded: false,
  fpsFrames: 0,
  fpsClock: 0,
  frameCount: 0,
  stats: { shots: 0, hits: 0, headshots: 0, kills: 0, score: 0, startTime: 0 },

  // Dynamic entities & viewmodel
  vmRes: null,
  playerAvatar: null,
  playerAvatarBody: null,
  avatarFlash: null,
  avatarSword: null,
  playerLiving: null,
  enemies: [],
  enemyHitboxes: [],
  tankette: null,
  grenadesList: [],
  molotovsList: [],
  molotovZones: [],
  alliedMortars: [],
  enemyGrenades: [],
  enemyMortars: [],
  flyingHelmets: [],
  lootDrops: [],
  effects: [],

  // Cross-module callbacks registered at boot
  hooks: {}
};

export function loadRecords() {
  try {
    const raw = localStorage.getItem(REC_KEY);
    if (raw) S.records = Object.assign(S.records, JSON.parse(raw));
    if (!Array.isArray(S.records.medals)) S.records.medals = [];
  } catch {}
  if (S.hooks.updateRecordBanner) S.hooks.updateRecordBanner();
  if (S.hooks.renderAllMedals) S.hooks.renderAllMedals();
}

export function saveRecords() {
  try { localStorage.setItem(REC_KEY, JSON.stringify(S.records)); } catch {}
  if (S.hooks.updateRecordBanner) S.hooks.updateRecordBanner();
  if (S.hooks.renderAllMedals) S.hooks.renderAllMedals();
}

export function unlockMedal(id) {
  if (!S.records.medals) S.records.medals = [];
  if (S.records.medals.includes(id)) return false;
  S.records.medals.push(id);
  saveRecords();
  const medal = MEDALS.find(m => m.id === id);
  if (medal && S.hooks.showMedalToast) S.hooks.showMedalToast(medal);
  return true;
}

export function addScore(pts) {
  S.stats.score += pts;
  const el = $('scoreVal');
  if (el) el.textContent = S.stats.score;
}
