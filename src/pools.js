import * as THREE from 'three';
import { DECK_TOP } from './config.js';
import { S } from './state.js';

const MAX_CASINGS = 48;
const MAX_IMPACTS = 72;
const MAX_FIRE    = 96;
const MAX_TRACERS = 32;
const MAX_CRATERS = 18;

const _dummy = new THREE.Object3D();
const _col   = new THREE.Color();

let casingIM = null, impactIM = null, fireIM = null;
const casings = [];
const impacts = [];
const fireParticles = [];
const tracers = [];
const craters = [];
let craterPtr = 0;

export function initPools() {
  const s = S.scene;

  // 1. Instanced brass shell casings
  casingIM = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.045, 5),
    new THREE.MeshStandardMaterial({ color: 0xd4a64a, roughness: 0.35, metalness: 0.85 }),
    MAX_CASINGS
  );
  casingIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  casingIM.frustumCulled = false;
  casingIM.count = 0;
  s.add(casingIM);

  // 2. Instanced impact sparks / blood / stone debris
  impactIM = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.11, 5, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false }),
    MAX_IMPACTS
  );
  impactIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  impactIM.frustumCulled = false;
  impactIM.setColorAt(0, _col.setHex(0xffffff));
  impactIM.count = 0;
  s.add(impactIM);

  // 3. Instanced flames & embers (Molotov + Wanping fires + blasts)
  fireIM = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.24, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
    MAX_FIRE
  );
  fireIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fireIM.frustumCulled = false;
  fireIM.setColorAt(0, _col.setHex(0xff8833));
  fireIM.count = 0;
  s.add(fireIM);

  // 4. Pooled bullet tracers (reusable BufferGeometries)
  for (let i = 0; i < MAX_TRACERS; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    line.frustumCulled = false;
    s.add(line);
    tracers.push({ line, life: 0, max: 0.13 });
  }

  // 5. Ring buffer of persistent blast craters
  const crGeo = new THREE.PlaneGeometry(3.2, 3.2);
  crGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < MAX_CRATERS; i++) {
    const m = new THREE.Mesh(crGeo, S.pbr.craterMat);
    m.visible = false;
    s.add(m);
    craters.push(m);
  }
}

export function spawnPooledCasing() {
  if (!casingIM) return;
  if (casings.length >= MAX_CASINGS) casings.shift();
  const right = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
  const pos = (S.thirdPerson ? S.player.pos : S.camera.position).clone().addScaledVector(right, 0.28);
  pos.y -= 0.15;
  casings.push({
    pos,
    vel: right.multiplyScalar(2.4 + Math.random()).add(new THREE.Vector3(0, 2.1 + Math.random() * 0.8, 0)),
    rotX: 0,
    rotY: 0,
    life: 0.72
  });
}

export function spawnPooledImpact(pos, hex = 0xc8b896, count = 3) {
  if (!impactIM) return;
  for (let k = 0; k < count; k++) {
    if (impacts.length >= MAX_IMPACTS) impacts.shift();
    impacts.push({
      pos: pos.clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 3.8, 1.0 + Math.random() * 2.5, (Math.random() - 0.5) * 3.8),
      color: hex,
      life: 0.30 + Math.random() * 0.12,
      max: 0.42,
      scale: 0.7 + Math.random() * 0.8
    });
  }
}

export function spawnFireParticle(pos, hex = 0xff7a22, vy = 2.4, scale = 1.0) {
  if (!fireIM) return;
  if (fireParticles.length >= MAX_FIRE) fireParticles.shift();
  fireParticles.push({
    pos: pos.clone(),
    vel: new THREE.Vector3((Math.random() - 0.5) * 1.1, vy + Math.random() * 1.5, (Math.random() - 0.5) * 1.1),
    color: hex,
    life: 0.55 + Math.random() * 0.35,
    max: 0.90,
    scale
  });
}

export function spawnPooledTracer(a, b, color = 0xffd27a) {
  let slot = null;
  for (const t of tracers) {
    if (t.life <= 0) { slot = t; break; }
  }
  if (!slot) slot = tracers[0];
  const arr = slot.line.geometry.attributes.position.array;
  arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
  arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
  slot.line.geometry.attributes.position.needsUpdate = true;
  slot.line.material.color.setHex(color);
  slot.line.material.opacity = 0.95;
  slot.line.visible = true;
  slot.life = 0.13;
  slot.max = 0.13;
}

export function spawnCrater(x, y, z, scale = 1.0) {
  if (!craters.length) return;
  const m = craters[craterPtr % MAX_CRATERS];
  craterPtr++;
  m.position.set(x, y + 0.025, z);
  m.rotation.y = Math.random() * Math.PI * 2;
  m.scale.setScalar(scale);
  m.visible = true;
}

export function updatePools(dt) {
  // Casings
  if (casingIM) {
    for (let i = casings.length - 1; i >= 0; i--) {
      const c = casings[i];
      c.life -= dt;
      c.vel.y -= 14.0 * dt;
      c.pos.addScaledVector(c.vel, dt);
      c.rotX += dt * 14;
      c.rotY += dt * 11;
      if (c.pos.y <= DECK_TOP + 0.03 && c.vel.y < 0) {
        c.pos.y = DECK_TOP + 0.03;
        c.vel.y = -c.vel.y * 0.25;
        c.vel.x *= 0.6; c.vel.z *= 0.6;
      }
      if (c.life <= 0) { casings.splice(i, 1); continue; }
    }
    casingIM.count = casings.length;
    for (let i = 0; i < casings.length; i++) {
      const c = casings[i];
      _dummy.position.copy(c.pos);
      _dummy.rotation.set(c.rotX, c.rotY, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      casingIM.setMatrixAt(i, _dummy.matrix);
    }
    casingIM.instanceMatrix.needsUpdate = true;
  }

  // Impacts
  if (impactIM) {
    for (let i = impacts.length - 1; i >= 0; i--) {
      const p = impacts[i];
      p.life -= dt;
      if (p.life <= 0) { impacts.splice(i, 1); continue; }
      p.vel.y -= 9.5 * dt;
      p.pos.addScaledVector(p.vel, dt);
    }
    impactIM.count = impacts.length;
    for (let i = 0; i < impacts.length; i++) {
      const p = impacts[i];
      const frac = Math.max(0.05, p.life / p.max);
      _dummy.position.copy(p.pos);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(p.scale * frac);
      _dummy.updateMatrix();
      impactIM.setMatrixAt(i, _dummy.matrix);
      _col.setHex(p.color);
      impactIM.setColorAt(i, _col);
    }
    impactIM.instanceMatrix.needsUpdate = true;
    if (impactIM.instanceColor) impactIM.instanceColor.needsUpdate = true;
  }

  // Fire & embers
  if (fireIM) {
    for (let i = fireParticles.length - 1; i >= 0; i--) {
      const f = fireParticles[i];
      f.life -= dt;
      if (f.life <= 0) { fireParticles.splice(i, 1); continue; }
      f.pos.addScaledVector(f.vel, dt);
    }
    fireIM.count = fireParticles.length;
    for (let i = 0; i < fireParticles.length; i++) {
      const f = fireParticles[i];
      const frac = Math.max(0.05, f.life / f.max);
      _dummy.position.copy(f.pos);
      _dummy.rotation.set(f.life * 3, f.life * 2, 0);
      _dummy.scale.setScalar(f.scale * (0.4 + frac * 0.9));
      _dummy.updateMatrix();
      fireIM.setMatrixAt(i, _dummy.matrix);
      _col.setHex(f.color);
      fireIM.setColorAt(i, _col);
    }
    fireIM.instanceMatrix.needsUpdate = true;
    if (fireIM.instanceColor) fireIM.instanceColor.needsUpdate = true;
  }

  // Tracers
  for (const t of tracers) {
    if (t.life > 0) {
      t.life -= dt;
      if (t.life <= 0) {
        t.line.visible = false;
      } else {
        t.line.material.opacity = Math.max(0, t.life / t.max) * 0.95;
      }
    }
  }
}

export function clearPools() {
  casings.length = 0;
  impacts.length = 0;
  fireParticles.length = 0;
  if (casingIM) casingIM.count = 0;
  if (impactIM) impactIM.count = 0;
  if (fireIM) fireIM.count = 0;
  for (const t of tracers) { t.life = 0; t.line.visible = false; }
  for (const c of craters) c.visible = false;
  craterPtr = 0;
}
