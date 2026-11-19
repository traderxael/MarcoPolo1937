import * as THREE from 'three';
import { CHAPTER_ATMOSPHERE, DECK_TOP, WANPING_TOP } from './config.js';
import { S } from './state.js';
import { createPBRTextures } from './textures.js';
import { createPostFX } from './postfx.js';
import { initPools, spawnFireParticle, spawnPooledImpact } from './pools.js';

export const mat = (color, rough = 0.95, metal = 0.02) => {
  const k = `${color}_${rough}_${metal}`;
  let m = S.MAT_CACHE.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    S.MAT_CACHE.set(k, m);
  }
  return m;
};

export function box(w, h, d, colorOrMat, x, y, z, parent = S.scene, opts = {}) {
  const mtrl = (typeof colorOrMat === 'object' && colorOrMat.isMaterial)
    ? colorOrMat
    : mat(colorOrMat, opts.rough, opts.metal);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mtrl);
  m.position.set(x, y, z);
  if (opts.cast) m.castShadow = true;
  if (opts.receive) m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function fitModel(src, targetLongest, opt = {}) {
  const m = src.clone(true);
  const bb0 = new THREE.Box3().setFromObject(m);
  const size = bb0.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  m.scale.setScalar(targetLongest / longest);
  m.rotation.set(opt.rotX || 0, opt.rotY || 0, opt.rotZ || 0);
  m.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(m);
  const c = bb.getCenter(new THREE.Vector3());
  m.position.set(-c.x + (opt.dx || 0), (opt.bottom ? -bb.min.y : -c.y) + (opt.dy || 0), -c.z + (opt.dz || 0));
  m.traverse(o => {
    if (o.isMesh) {
      o.castShadow = !opt.noCastShadow;
      o.receiveShadow = true;
      if (opt.tint && o.material) {
        o.material = o.material.clone();
        o.material.color.set(opt.tint);
        o.material.roughness = 0.9;
      }
    }
  });
  m.userData.baseY = m.position.y;
  return m;
}

function prepareLivingGeometry(geo) {
  if (geo.userData.livingBounds) return geo.userData.livingBounds;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const size = bb.getSize(new THREE.Vector3());
  const botY = bb.min.y;
  const hipY = botY + Math.max(0.05, size.y * 0.45);
  const shoulderY = hipY + Math.max(0.05, size.y * 0.27);
  const bounds = {
    botY,
    hipY,
    shoulderY,
    cx: (bb.min.x + bb.max.x) * 0.5,
    spanX: Math.max(size.x, 0.01)
  };
  geo.userData.livingBounds = bounds;
  return bounds;
}

// Smooth C1-continuous GPU character deformation
export function makeLiving(model) {
  const uniforms = [];
  const materials = [];
  model.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.position) return;
    const { botY, hipY, shoulderY, cx, spanX } = prepareLivingGeometry(o.geometry);
    o.material = o.material.clone();
    materials.push(o.material);
    const u = {
      uTime: { value: 0 }, uWalk: { value: 0 }, uAim: { value: 0 }, uHit: { value: 0 }, uDeath: { value: 0 },
      uBot: { value: botY }, uHip: { value: hipY }, uShoulder: { value: shoulderY }, uCx: { value: cx }, uSpanX: { value: spanX }
    };
    o.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          uniform float uTime, uWalk, uAim, uHit, uDeath, uBot, uHip, uShoulder, uCx, uSpanX;
          vec2 rot2(vec2 v, float a){ float s=sin(a), c=cos(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
        `)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float legW = 1.0 - smoothstep(uBot, uHip, position.y);
          float sideW = clamp((position.x - uCx) / (0.16 * uSpanX), -1.0, 1.0);
          float legAng = sin(uTime * 8.5) * uWalk * 0.42 * sideW * legW;
          vec2 legD = rot2(vec2(position.y - uHip, position.z), legAng);
          transformed.y = mix(transformed.y, uHip + legD.x, legW);
          transformed.z = mix(transformed.z, legD.y, legW);

          float upperW = smoothstep(uHip, uShoulder, position.y);
          float breath = sin(uTime * 2.4) * 0.012 * upperW;
          transformed.y += breath;
          transformed.z += (uAim * 0.06 - uDeath * 0.04) * upperW;
          transformed.x += sin(uTime * 55.0) * uHit * 0.045 * upperW;
        `);
    };
    o.material.customProgramCacheKey = () => 'living-v2';
    uniforms.push(u);
  });
  return {
    time: (t) => { for (const u of uniforms) u.uTime.value = t; },
    set: (walk, aim, hit, death) => {
      for (const u of uniforms) {
        u.uWalk.value = walk; u.uAim.value = aim; u.uHit.value = hit; u.uDeath.value = death;
      }
    },
    dispose: () => { for (const m of materials) m.dispose(); }
  };
}

let LION_PARTS = null;
function makeStoneLion() {
  if (!LION_PARTS) {
    LION_PARTS = {
      base: new THREE.BoxGeometry(0.9, 0.28, 0.9),
      body: new THREE.SphereGeometry(0.34, 10, 8),
      chest: new THREE.SphereGeometry(0.26, 10, 8),
      head: new THREE.SphereGeometry(0.25, 10, 8),
      mane: new THREE.TorusGeometry(0.24, 0.085, 6, 10),
      ear: new THREE.ConeGeometry(0.075, 0.17, 5),
      eye: new THREE.SphereGeometry(0.035, 6, 6),
      nose: new THREE.SphereGeometry(0.06, 6, 6),
      tail: new THREE.CylinderGeometry(0.05, 0.07, 0.42, 6),
      leg: new THREE.CylinderGeometry(0.075, 0.09, 0.36, 6)
    };
  }
  const g = new THREE.Group();
  const stone = mat(0x9b9587, 1), dark = mat(0x6d685e, 1);
  const M = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o;
  };
  M(LION_PARTS.base, dark, 0, 0.14, 0);
  const body = M(LION_PARTS.body, stone, 0, 0.62, 0); body.scale.set(1.35, 0.95, 0.95);
  M(LION_PARTS.chest, stone, 0, 0.8, 0.22);
  M(LION_PARTS.head, stone, 0, 1.03, 0.3);
  M(LION_PARTS.mane, dark, 0, 1.03, 0.27);
  for (const s of [-1, 1]) {
    M(LION_PARTS.ear, stone, s * 0.15, 1.27, 0.3);
    M(LION_PARTS.eye, dark, s * 0.1, 1.06, 0.52);
  }
  M(LION_PARTS.nose, dark, 0, 0.98, 0.55);
  M(LION_PARTS.tail, stone, 0, 0.72, -0.45, 0.9);
  for (const [x, z] of [[-0.22, 0.24], [0.22, 0.24], [-0.22, -0.2], [0.22, -0.2]]) {
    M(LION_PARTS.leg, stone, x, 0.38, z);
  }
  return g;
}

function addSandbagCluster(x, z, rotY = 0) {
  const cluster = { x, z, hp: 120, maxHp: 120, stage: 0, broken: false, meshes: [], colBox: null };
  const sMat = S.pbr.sandMat;
  const g = new THREE.Group();
  g.position.set(x, DECK_TOP, z);
  g.rotation.y = rotY;

  const offsets = [
    [0, 0.20, -0.28, 1.35, 0.52, 0.82],
    [0, 0.20,  0.28, 1.35, 0.52, 0.82],
    [0, 0.68,  0.00, 1.28, 0.54, 0.85]
  ];
  for (let i = 0; i < offsets.length; i++) {
    const [ox, oy, oz, sx, sy, sz] = offsets[i];
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.68, 8, 6), sMat);
    m.scale.set(sx, sy, sz);
    m.position.set(ox, oy, oz);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.sandbagCluster = cluster;
    g.add(m);
    cluster.meshes.push(m);
    S.worldColliders.push(m);
  }
  S.scene.add(g);

  const colBox = { minX: x - 0.82, maxX: x + 0.82, minZ: z - 0.78, maxZ: z + 0.78, topY: DECK_TOP + 0.92, cluster };
  cluster.colBox = colBox;
  S.playerBoxes.push(colBox);
  S.sandbagClusters.push(cluster);
}

export function damageSandbagCluster(cluster, dmg, hitPos) {
  if (!cluster || cluster.broken) return;
  cluster.hp -= dmg;
  spawnPooledImpact(hitPos || new THREE.Vector3(cluster.x, DECK_TOP + 0.5, cluster.z), 0xc4b28a, 4);
  if (cluster.hp <= 60 && cluster.stage === 0) {
    cluster.stage = 1;
    cluster.meshes[2].visible = false;
    cluster.colBox.topY = DECK_TOP + 0.48;
  }
  if (cluster.hp <= 0) {
    cluster.broken = true;
    for (const m of cluster.meshes) m.visible = false;
    cluster.colBox.topY = DECK_TOP;
    cluster.colBox.broken = true;
    spawnPooledImpact(new THREE.Vector3(cluster.x, DECK_TOP + 0.4, cluster.z), 0xa89268, 8);
  }
}

function addExplosiveBarrel(x, z) {
  const b = { x, z, exploded: false, hp: 38, mesh: null, colBox: null };
  const grp = new THREE.Group();
  grp.position.set(x, DECK_TOP, z);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.15, 10),
    new THREE.MeshStandardMaterial({ color: 0x9c2c20, roughness: 0.55, metalness: 0.45 })
  );
  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.435, 0.435, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8c87a, emissive: 0x3a2608, roughness: 0.4, metalness: 0.3 })
  );
  band.position.y = 0.78;
  body.userData.explosiveBarrel = b;
  band.userData.explosiveBarrel = b;
  grp.add(body, band);
  S.scene.add(grp);

  S.worldColliders.push(body);
  const colBox = { minX: x - 0.5, maxX: x + 0.5, minZ: z - 0.5, maxZ: z + 0.5, topY: DECK_TOP + 1.18, barrel: b };
  b.mesh = grp;
  b.colBox = colBox;
  S.playerBoxes.push(colBox);
  S.explosiveBarrels.push(b);
}

export function resetWorldProps() {
  for (const c of S.sandbagClusters) {
    c.hp = c.maxHp;
    c.stage = 0;
    c.broken = false;
    c.colBox.broken = false;
    c.colBox.topY = DECK_TOP + 0.92;
    for (const m of c.meshes) m.visible = true;
  }
  for (const b of S.explosiveBarrels) {
    b.exploded = false;
    b.hp = 38;
    b.mesh.visible = true;
    b.colBox.broken = false;
  }
}

function buildSkyDome() {
  const skyGeo = new THREE.SphereGeometry(320, 18, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(CHAPTER_ATMOSPHERE[0].skyTop) },
      uHorizon: { value: new THREE.Color(CHAPTER_ATMOSPHERE[0].skyHor) },
      uGlow: { value: new THREE.Color(CHAPTER_ATMOSPHERE[0].glow) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uGlow;
      varying vec3 vWorldPos;
      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y * 1.4, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.65));
        float east = max(0.0, dir.x) * (1.0 - smoothstep(0.0, 0.45, abs(dir.y)));
        col += uGlow * east * 0.55;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  S.skyDome = new THREE.Mesh(skyGeo, skyMat);
  S.scene.add(S.skyDome);
}

export function setChapterAtmosphere(ch) {
  const pal = CHAPTER_ATMOSPHERE[Math.min(3, Math.max(0, ch))] || CHAPTER_ATMOSPHERE[0];
  S.scene.background.setHex(pal.fog);
  S.scene.fog.color.setHex(pal.fog);
  S.scene.fog.density = pal.fogDens;
  S.moonLight.color.setHex(pal.moon);
  if (S.skyDome && S.skyDome.material && S.skyDome.material.uniforms) {
    S.skyDome.material.uniforms.uTop.value.setHex(pal.skyTop);
    S.skyDome.material.uniforms.uHorizon.value.setHex(pal.skyHor);
    S.skyDome.material.uniforms.uGlow.value.setHex(pal.glow);
  }
  if (S.pbr) S.pbr.setRainWetness(ch === 2);
}

function buildBridge() {
  const cobble = S.pbr.cobbleMat;
  const wallMat = S.pbr.wallMat;

  // Main Lugouqiao stone deck
  box(124, 1.2, 10, cobble, 0, 6, 0, S.scene, { cast: true, receive: true });
  S.floorZones.push({ minX: -62, maxX: 62, minZ: -5.0, maxZ: 5.0, y: DECK_TOP });

  // Stone parapets: split north parapet at x = 44..54 to allow walking onto the Railway Bridge causeway
  S.worldColliders.push(
    box(106, 1.1, 0.75, wallMat, -9, 7.15, -4.72, S.scene, { cast: true, receive: true }),
    box(8,   1.1, 0.75, wallMat, 58, 7.15, -4.72, S.scene, { cast: true, receive: true }),
    box(124, 1.1, 0.75, wallMat,  0, 7.15,  4.72, S.scene, { cast: true, receive: true })
  );

  // Piers + cutwaters
  for (let x = -55; x <= 55; x += 11) {
    box(2.7, 8, 9.4, 0x605a51, x, 2, 0, S.scene, { cast: true, receive: true });
    for (const z of [-5.3, 5.3]) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 4), mat(0x605a51, 1));
      c.rotation.x = z < 0 ? Math.PI / 2 : -Math.PI / 2;
      c.position.set(x, 1.2, z);
      S.scene.add(c);
    }
  }
  // Arches under spans
  for (let x = -49.5; x <= 49.5; x += 11) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(4.95, 0.6, 6, 20, Math.PI), mat(0x6b655a, 1));
    a.rotation.z = Math.PI; a.position.set(x, 5.5, 0); a.scale.z = 0.92;
    S.scene.add(a);
  }

  // Famous stone lions
  for (let x = -56; x <= 56; x += 8) {
    for (const z of [-4.72, 4.72]) {
      if (z < 0 && x > 43 && x < 55) continue;
      const l = makeStoneLion();
      l.position.set(x, 7.7, z); l.rotation.y = z < 0 ? 0 : Math.PI; l.scale.setScalar(1.02);
      S.scene.add(l);
      S.lionGroups.push(l);
    }
  }

  // Parallel Railway Bridge (Pilar B) north of Lugouqiao (z = -15.5..-10.6)
  box(118, 0.85, 5.0, 0x3b3835, 1, DECK_TOP - 0.425, -13.1, S.scene, { cast: true, receive: true });
  for (let x = -54; x <= 58; x += 2.4) {
    box(0.45, 0.14, 4.2, 0x4b3828, x, DECK_TOP + 0.06, -13.1, S.scene); // sleepers
  }
  box(118, 0.14, 0.14, 0x5c6268, 1, DECK_TOP + 0.16, -14.0, S.scene, { metal: 0.7, rough: 0.45 });
  box(118, 0.14, 0.14, 0x5c6268, 1, DECK_TOP + 0.16, -12.2, S.scene, { metal: 0.7, rough: 0.45 });
  for (let x = -50; x <= 50; x += 12) {
    const tColL = box(0.42, 4.6, 0.42, 0x2c3035, x, DECK_TOP + 2.3, -15.3, S.scene, { metal: 0.6, rough: 0.5 });
    const tColR = box(0.42, 4.6, 0.42, 0x2c3035, x, DECK_TOP + 2.3, -10.9, S.scene, { metal: 0.6, rough: 0.5 });
    box(0.36, 0.36, 4.8, 0x2c3035, x, DECK_TOP + 4.5, -13.1, S.scene, { metal: 0.6, rough: 0.5 });
    S.worldColliders.push(tColL, tColR);
    box(1.8, 6.8, 4.4, 0x575148, x, 3.0, -13.1, S.scene, { cast: true, receive: true });
  }
  S.floorZones.push({ minX: -58, maxX: 60, minZ: -15.6, maxZ: -10.6, y: DECK_TOP });

  // Eastern causeway linking Lugouqiao (z = -4.2) and Railway Bridge (z = -11.5) at x = 44.5..54.5
  box(10.5, 1.2, 7.6, wallMat, 49.5, 6.0, -7.8, S.scene, { cast: true, receive: true });
  S.floorZones.push({ minX: 44.2, maxX: 54.8, minZ: -11.6, maxZ: -4.2, y: DECK_TOP });

  // Destructible hanging lanterns (high HDR emissive for selective bloom)
  let lightCount = 0;
  for (let x = -48; x <= 48; x += 12) {
    for (const z of [-4.72, 4.72]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 10, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.9, 0.4) })
      );
      lamp.position.set(x, 8.4, z);
      S.scene.add(lamp);
      let pl = null;
      if (lightCount < 6 && (x === -48 || x === 0 || x === 48)) {
        pl = new THREE.PointLight(0xffa95c, 18, 24, 2);
        pl.position.set(x, 8.2, z);
        S.scene.add(pl);
        lightCount++;
      }
      const item = { mesh: lamp, light: pl, baseInt: pl ? 18 : 0, intact: true };
      lamp.userData.lantern = item;
      S.lanterns.push(item);
      S.shootableLanterns.push(lamp);
    }
  }

  // Warm light from Chinese defensive line
  const fill = new THREE.PointLight(0xffc98a, 42, 60, 2);
  fill.position.set(32, 13, 0);
  S.scene.add(fill);

  // Destructible sandbag clusters (replace static row with interactive cover + fixed flanking bags)
  addSandbagCluster(19.5, -2.7, 0.08);
  addSandbagCluster(27.0,  2.1, -0.06);
  addSandbagCluster(34.5, -2.5, 0.04);
  addSandbagCluster(12.5,  1.8, -0.10);
  addSandbagCluster(28.0, -13.1, 0.05);
  addSandbagCluster(18.0, -13.1, -0.05);

  // Explosive ammunition barrels
  addExplosiveBarrel(-24,  2.1);
  addExplosiveBarrel( -8, -2.1);
  addExplosiveBarrel(  6,  1.9);
  addExplosiveBarrel(-16, -12.8);

  // Supply crate
  S.supplyCrate = box(1.3, 0.85, 0.85, 0x4b4130, 32, DECK_TOP + 0.42, 3.2, S.scene, { cast: true, receive: true });
  S.worldColliders.push(S.supplyCrate);
  S.playerBoxes.push({ minX: 31.1, maxX: 32.9, minZ: 2.5, maxZ: 3.9, topY: DECK_TOP + 0.88 });

  // Fixed Type 24 Maxim trench machine gun emplacement at (24.5, DECK_TOP, -2.0)
  const mgEmplacement = new THREE.Group();
  mgEmplacement.position.set(24.5, DECK_TOP, -2.0);
  const legMat = mat(0x2d3033, 0.7, 0.45);
  for (const [lx, lz, rz] of [[-0.4, 0, -0.32], [0.35, -0.35, 0.35], [0.35, 0.35, 0.35]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.05, 6), legMat);
    leg.position.set(lx, 0.5, lz); leg.rotation.z = rz; mgEmplacement.add(leg);
  }
  const mgHead = new THREE.Group();
  mgHead.position.set(0, 1.05, 0);
  mgHead.rotation.y = Math.PI / 2;
  box(0.16, 0.18, 0.56, 0x26292c, 0, 0, 0.08, mgHead, { rough: 0.5, metal: 0.7 });
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.72, 8), mat(0x3a3e40, 0.45, 0.75));
  jacket.rotation.x = Math.PI / 2; jacket.position.set(0, 0.02, -0.52); mgHead.add(jacket);
  const shield = box(0.66, 0.48, 0.04, 0x3b4034, 0, 0.06, -0.22, mgHead, { rough: 0.8, metal: 0.4 });
  shield.userData.isMgShield = true;
  S.worldColliders.push(shield);
  const mgFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.36, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), transparent: true, opacity: 0.9, depthWrite: false })
  );
  mgFlash.rotation.x = -Math.PI / 2; mgFlash.position.set(0, 0.02, -0.98); mgFlash.visible = false;
  mgHead.add(mgFlash);
  mgEmplacement.add(mgHead);
  S.scene.add(mgEmplacement);
  S.mgEmplacement = mgEmplacement;
  S.mgHead = mgHead;
  S.mgFlash = mgFlash;
  S.playerBoxes.push({ minX: 23.7, maxX: 25.1, minZ: -2.6, maxZ: -1.4, topY: DECK_TOP + 1.25 });
}

function buildWanping() {
  const W = 74;
  const wallMat = S.pbr.wallMat;

  // Stone plaza approach between bridge/railway and Wanping Gate
  box(19, 1.2, 32, wallMat, 66.5, 6.0, 0, S.scene, { cast: true, receive: true });
  S.floorZones.push({ minX: 57, maxX: 76, minZ: -16.0, maxZ: 16.0, y: DECK_TOP });

  // Main fortress walls & gatehouse colliders
  S.worldColliders.push(
    box(5.5, 11, 26, wallMat, W, 5.5, -18, S.scene, { cast: true, receive: true }),
    box(5.5, 11, 26, wallMat, W, 5.5,  18, S.scene, { cast: true, receive: true }),
    box(5.5, 7,  3,  wallMat, W, 3.5, -6.4, S.scene, { cast: true }),
    box(5.5, 7,  3,  wallMat, W, 3.5,  6.4, S.scene, { cast: true }),
    box(5.5, 4,  12, wallMat, W, 9.0,  0,   S.scene, { cast: true })
  );

  // Battlement upper walkway (y = WANPING_TOP = 11.4) + crenellation cover
  box(7.2, 0.6, 32, wallMat, 72.5, WANPING_TOP - 0.3, 0, S.scene, { cast: true, receive: true });
  S.floorZones.push({ minX: 68.8, maxX: 76.2, minZ: -15.5, maxZ: 15.5, y: WANPING_TOP });
  for (let z = -15; z <= 15; z += 2.6) {
    if (z > 1.8 && z < 4.7) continue; // Keep ramp entrance clear
    const merlon = box(0.9, 1.25, 1.35, wallMat, 69.2, WANPING_TOP + 0.62, z, S.scene, { cast: true, receive: true });
    S.worldColliders.push(merlon);
  }

  // Walkable sloped stone stairs/ramp leading up from courtyard (x=57, y=6.6, z=3.2) to battlements (x=69, y=11.4, z=3.2)
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const sx = 57 + i * 1.0;
    const sy = DECK_TOP + ((i + 1) / steps) * (WANPING_TOP - DECK_TOP);
    box(1.1, sy, 2.6, wallMat, sx + 0.5, sy * 0.5, 3.3, S.scene, { cast: true, receive: true });
    S.floorZones.push({ minX: sx - 0.05, maxX: sx + 1.05, minZ: 2.0, maxZ: 4.6, y: sy });
  }

  // Gate towers & silhouette buildings
  for (const z of [-30, 30]) {
    box(6.5, 9, 6.5, wallMat, W, 4.5, z, S.scene, { cast: true });
    const r = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.2, 4), mat(0x2d3940, 0.9));
    r.rotation.y = Math.PI / 4; r.position.set(W, 10, z); S.scene.add(r);
  }
  for (let i = 0; i < 12; i++) {
    const w = 5 + Math.random() * 5, h = 4 + Math.random() * 5;
    box(w, h, w, 0x474135, 88 + Math.random() * 34, h / 2, -28 + Math.random() * 56, S.scene);
  }
  // Red lanterns + fire beacons on Wanping walls
  for (const z of [-4.5, 4.5]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.28, 0.16) }));
    l.position.set(W - 3.2, 8.2, z);
    S.scene.add(l);
  }
  for (const [fx, fy, fz] of [[73, 12.2, -11], [73, 12.2, 11]]) {
    const fl = new THREE.PointLight(0xff6b28, 12, 26, 2);
    fl.position.set(fx, fy, fz);
    S.scene.add(fl);
    S.wanpingFireLights.push({ light: fl, x: fx, y: fy, z: fz });
  }
}

function buildTerrain() {
  const geo = new THREE.PlaneGeometry(122, 250, 26, 40);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x17262e, roughness: 0.28, metalness: 0.62 });
  waterMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = S.waterTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.z += sin(uTime*1.1 + position.x*0.12 + position.y*0.05) * 0.28;
    `);
  };
  waterMat.customProgramCacheKey = () => 'water-v1';
  const water = new THREE.Mesh(geo, waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = 0; water.receiveShadow = true;
  S.scene.add(water);

  // GPU nocturnal rain (1 single draw call)
  const rc = 900, rpos = new Float32Array(rc * 3);
  for (let i = 0; i < rc; i++) {
    rpos[i * 3]     = (Math.random() - 0.5) * 140;
    rpos[i * 3 + 1] = Math.random() * 26;
    rpos[i * 3 + 2] = (Math.random() - 0.5) * 42;
  }
  const rgeo = new THREE.BufferGeometry();
  rgeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const rmat = new THREE.PointsMaterial({ color: 0x9eb8dc, size: 0.14, transparent: true, opacity: 0.55, depthWrite: false });
  rmat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = S.rainTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.y = 6.0 + mod(position.y - uTime * 22.0, 26.0);
    `);
  };
  rmat.customProgramCacheKey = () => 'rain-v1';
  S.rainPoints = new THREE.Points(rgeo, rmat);
  S.rainPoints.frustumCulled = false;
  S.rainPoints.visible = false;
  S.scene.add(S.rainPoints);

  // Single reusable illumination flare + HDR light
  S.flareObj = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 8, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.45, 1.05) })
  );
  S.flareObj.visible = false;
  S.scene.add(S.flareObj);
  S.flareLight = new THREE.PointLight(0xffe7b3, 0, 62, 1.8);
  S.scene.add(S.flareLight);

  // Banks & trees
  box(150, 4, 250, 0x3b4230, -126, 0, 0, S.scene, { receive: true });
  box(150, 4, 250, 0x3b4230, 150, 0, 0, S.scene, { receive: true });
  const trunk = mat(0x3b2f22, 1), leaf = mat(0x273a26, 1);
  for (let i = 0; i < 26; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (72 + Math.random() * 60), z = (Math.random() - 0.5) * 220;
    const h = 5 + Math.random() * 5;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, h, 6), trunk); t.position.set(x, h / 2, z); S.scene.add(t);
    const c = new THREE.Mesh(new THREE.ConeGeometry(2.4, h * 0.8, 7), leaf); c.position.set(x, h * 0.95, z); S.scene.add(c);
  }
  for (let i = 0; i < 8; i++) {
    const w = 6 + Math.random() * 6, h = 5 + Math.random() * 6;
    box(w, h, w, 0x383b35, -85 - Math.random() * 40, h / 2, (Math.random() - 0.5) * 110, S.scene);
  }
}

export function initWorld() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1424);
  scene.fog = new THREE.FogExp2(0x0d1424, 0.0046);

  const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 700);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  S.renderer = renderer;
  S.scene = scene;
  S.camera = camera;
  S.pbr = createPBRTextures();
  S.postFX = createPostFX(renderer, scene, camera);

  S.ambientLight = new THREE.AmbientLight(0x5a6488, 2.0);
  S.hemiLight = new THREE.HemisphereLight(0x8fa6d8, 0x2b2a22, 1.1);
  scene.add(S.ambientLight, S.hemiLight);

  const moonLight = new THREE.DirectionalLight(0xc8d6ff, 2.1);
  moonLight.position.set(-80, 110, -60);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(512, 512);
  moonLight.shadow.camera.left = -90; moonLight.shadow.camera.right = 90;
  moonLight.shadow.camera.top = 36; moonLight.shadow.camera.bottom = -36;
  moonLight.shadow.camera.near = 10; moonLight.shadow.camera.far = 260;
  moonLight.shadow.bias = -0.0005;
  scene.add(moonLight);
  S.moonLight = moonLight;
  S.baseMoonInt = moonLight.intensity;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(11, 24, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.32, 1.45) })
  );
  moon.position.set(-150, 130, -260);
  scene.add(moon);

  // Stars
  const n = 700, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 700;
    pos[i * 3 + 1] = 60 + Math.random() * 260;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 700;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaebbd8, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.75 })));

  buildSkyDome();
  buildTerrain();
  buildBridge();
  buildWanping();
  initPools();

  S.player.pos.set(34, DECK_TOP + 1.7, 0);
  camera.position.copy(S.player.pos);
}

export function getFloorY(px, pz) {
  const r = 0.34;
  let floorY = DECK_TOP;
  for (const z of S.floorZones) {
    if (px >= z.minX && px <= z.maxX && pz >= z.minZ && pz <= z.maxZ) {
      if (S.player.feetY >= z.y - 0.65 && z.y > floorY) floorY = z.y;
    }
  }
  for (const b of S.playerBoxes) {
    if (b.broken) continue;
    const top = b.topY !== undefined ? b.topY : Infinity;
    if (top < Infinity && S.player.feetY >= top - 0.25 && px + r > b.minX && px - r < b.maxX && pz + r > b.minZ && pz - r < b.maxZ) {
      if (top > floorY) floorY = top;
    }
  }
  return floorY;
}

function insideWalkableDeck(px, pz) {
  if (px >= -58 && px <= 74.6 && pz >= -4.15 && pz <= 4.15) return true; // Main bridge + plaza
  if (px >= 44.8 && px <= 54.2 && pz >= -11.6 && pz <= -4.0) return true; // Connector
  if (px >= -56 && px <= 59 && pz >= -15.0 && pz <= -11.1) return true; // Railway bridge
  if (px >= 57.5 && px <= 75.4 && pz >= -15.0 && pz <= 15.0) return true; // Wanping courtyard + battlements
  return false;
}

export function resolvePlayerCollision(nx, nz) {
  const r = 0.38;
  const blocked = (px, pz) => {
    if (!insideWalkableDeck(px, pz)) return true;
    // Wanping gate central wall solid masonry around z = [-8..-5] & [5..8] at ground level (passable above on battlements)
    if (S.player.feetY < 10.6 && px > 70.8 && px < 77 && Math.abs(pz) > 4.6) return true;
    for (const b of S.playerBoxes) {
      if (b.broken) continue;
      const top = b.topY !== undefined ? b.topY : Infinity;
      if (S.player.feetY >= top - 0.22) continue;
      if (px + r > b.minX && px - r < b.maxX && pz + r > b.minZ && pz - r < b.maxZ) return true;
    }
    return false;
  };
  if (!blocked(nx, S.player.pos.z)) S.player.pos.x = nx;
  if (!blocked(S.player.pos.x, nz)) S.player.pos.z = nz;
}

export function updateWorld(dt, t) {
  S.waterTime.value = t;
  S.rainTime.value = t;
  for (const wf of S.wanpingFireLights) {
    wf.light.intensity = 10 + Math.sin(t * 9 + wf.x) * 3.5;
    if (S.gfxLevel !== 'low' && Math.random() < dt * 8) {
      spawnFireParticle(new THREE.Vector3(wf.x + (Math.random() - 0.5) * 1.4, wf.y, wf.z + (Math.random() - 0.5) * 1.4), 0xff7722, 2.0, 0.85);
    }
  }
}

export function applyWorldModels() {
  const ASSETS = S.ASSETS;
  S.lionGroups.forEach(l => {
    l.clear();
    const low = makeStoneLion();
    if (ASSETS.lion) {
      const lod = new THREE.LOD();
      lod.addLevel(fitModel(ASSETS.lion, 1.55, { bottom: true, rotY: Math.PI, noCastShadow: true }), 0);
      lod.addLevel(low, 15);
      l.add(lod);
    } else {
      l.add(low);
    }
  });
  if (ASSETS.gate) {
    const t = fitModel(ASSETS.gate, 23, { bottom: true, rotY: -Math.PI / 2, noCastShadow: true });
    t.position.set(77, DECK_TOP, 0);
    S.scene.add(t);
  }
}
