import * as THREE from 'three';
import { DECK_TOP, SQUAD_ORDERS } from './config.js';
import { $, S } from './state.js';
import { fitModel, makeLiving, mat } from './world.js';
import { noiseBurst, playChargeBugle, playRadioChirp } from './audio.js';
import { spawnPooledTracer } from './pools.js';

function buildProceduralDefender() {
  const g = new THREE.Group();
  const uni = mat(0x6d7758, 0.92);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.36), uni);
  body.position.y = 1.25;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 6), mat(0xb89572, 0.85));
  head.position.y = 1.96;
  g.add(body, head);
  return g;
}

export function applySquadModels() {
  const specs = [
    { x: 41, z:  3.5, fallen: false, advX: 19, advZ:  2.5 },
    { x: 29, z: -2.1, fallen: false, advX: 15, advZ: -2.1 },
    { x: 37, z: -3.7, fallen: true,  advX: 37, advZ: -3.7 }
  ];
  specs.forEach((spSpec, i) => {
    const wrap = new THREE.Group();
    let living = null;
    if (S.ASSETS.chinese) {
      const s = fitModel(S.ASSETS.chinese, 2.4, { bottom: true, rotY: -0.38, tint: 0x8a8d70, noCastShadow: true });
      wrap.add(s);
      living = makeLiving(s);
    } else {
      wrap.add(buildProceduralDefender());
    }
    const sp = new THREE.Mesh(S.SHADOW_PROXY_GEO, S.SHADOW_PROXY_MAT);
    sp.position.y = 1.1; sp.castShadow = !spSpec.fallen;
    wrap.add(sp);

    wrap.position.set(spSpec.x, DECK_TOP, spSpec.z);
    wrap.rotation.y = -Math.PI / 2;
    if (spSpec.fallen) {
      wrap.rotation.z = Math.PI / 2;
      wrap.position.y = DECK_TOP + 0.35;
    }
    S.scene.add(wrap);
    const col = { minX: spSpec.x - 0.7, maxX: spSpec.x + 0.7, minZ: spSpec.z - 0.7, maxZ: spSpec.z + 0.7, topY: Infinity };
    S.playerBoxes.push(col);
    S.defenders.push({
      s: wrap,
      living,
      fallen: spSpec.fallen,
      baseYaw: wrap.rotation.y,
      homeX: spSpec.x,
      homeZ: spSpec.z,
      advX: spSpec.advX,
      advZ: spSpec.advZ,
      phase: i * 2.1,
      fireT: 1.0 + Math.random() * 1.2,
      fireAnim: 0,
      col
    });
  });
}

export function setDefenderPos(d, x, z) {
  if (!d) return;
  d.s.position.set(x, DECK_TOP, z);
  d.homeX = x; d.homeZ = z;
  if (d.col) {
    d.col.minX = x - 0.7; d.col.maxX = x + 0.7;
    d.col.minZ = z - 0.7; d.col.maxZ = z + 0.7;
  }
}

export function resetSquadPositions() {
  if (S.defenders[0]) setDefenderPos(S.defenders[0], 41, 3.5);
  if (S.defenders[1]) setDefenderPos(S.defenders[1], 29, -2.1);
}

export function setSquadAnchors(a0, a1, showFallen = true) {
  if (S.defenders[0] && a0) {
    S.defenders[0].s.visible = true;
    S.defenders[0].homeX = a0[0]; S.defenders[0].homeZ = a0[1];
    S.defenders[0].advX = Math.max(-36, a0[0] - 18); S.defenders[0].advZ = a0[1];
    if (S.currentTheater !== 'bridge' && Math.hypot(S.defenders[0].s.position.x - a0[0], S.defenders[0].s.position.z - a0[1]) > 24) {
      setDefenderPos(S.defenders[0], a0[0], a0[1]);
    }
  }
  if (S.defenders[1] && a1) {
    S.defenders[1].s.visible = true;
    S.defenders[1].homeX = a1[0]; S.defenders[1].homeZ = a1[1];
    S.defenders[1].advX = Math.max(-36, a1[0] - 18); S.defenders[1].advZ = a1[1];
    if (S.currentTheater !== 'bridge' && Math.hypot(S.defenders[1].s.position.x - a1[0], S.defenders[1].s.position.z - a1[1]) > 24) {
      setDefenderPos(S.defenders[1], a1[0], a1[1]);
    }
  }
  if (S.defenders[2]) S.defenders[2].s.visible = showFallen;
}

export function setSquadOrder(order) {
  if (!SQUAD_ORDERS[order]) return;
  S.squadOrder = order;
  const info = SQUAD_ORDERS[order];
  if ($('squadHud')) $('squadHud').textContent = `ESCUADRÓN [T]: ${info.label}`;
  document.querySelectorAll('#squadButtons .swBtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.order === order);
  });
  if (order === 'advance') playChargeBugle();
  else playRadioChirp();
  if (S.hooks.showMsg) S.hooks.showMsg(`${info.zh} · ESCUADRÓN: ${info.label.toUpperCase()}`, 1.4);
  if (S.hooks.toggleSquadWheel) S.hooks.toggleSquadWheel(false);
}

function pickAllyTarget(d, order) {
  let best = null;
  let bestScore = -1e9;
  for (const e of S.enemies) {
    if (e.userData.dead) continue;
    const dist = d.s.position.distanceTo(e.position);
    if (dist > 78) continue;
    let sc = 100 - dist;
    if (order === 'focus') {
      const r = e.userData.role;
      if (r === 'mortar') sc += 60;
      else if (r === 'grenadier') sc += 45;
      else if (r === 'officer') sc += 40;
      else if (r === 'sniper') sc += 30;
    }
    if (sc > bestScore) { bestScore = sc; best = e; }
  }
  return best;
}

export function updateSquad(dt, t) {
  const ordSpec = SQUAD_ORDERS[S.squadOrder] || SQUAD_ORDERS.cover;
  const fireInterval = ordSpec.fireRate;

  for (const d of S.defenders) {
    if (!d.living) continue;
    d.living.time(t + d.phase);
    if (d.fallen) {
      d.living.set(0, 0, 0, 1);
      continue;
    }

    // Move smoothly toward target formation XZ
    const tx = (S.squadOrder === 'advance') ? d.advX : (S.squadOrder === 'hold' ? Math.max(29, d.homeX) : d.homeX);
    const tz = (S.squadOrder === 'advance') ? d.advZ : d.homeZ;
    const dx = tx - d.s.position.x, dz = tz - d.s.position.z;
    const distToGoal = Math.hypot(dx, dz);
    let moving = false;
    if (S.alive && !S.paused && distToGoal > 0.15) {
      moving = true;
      const step = Math.min(distToGoal, dt * 3.1);
      d.s.position.x += (dx / distToGoal) * step;
      d.s.position.z += (dz / distToGoal) * step;
      if (d.col) {
        d.col.minX = d.s.position.x - 0.7; d.col.maxX = d.s.position.x + 0.7;
        d.col.minZ = d.s.position.z - 0.7; d.col.maxZ = d.s.position.z + 0.7;
      }
    }

    d.fireAnim = Math.max(0, d.fireAnim - dt);
    let target = null;
    if (S.alive && !S.paused) target = pickAllyTarget(d, S.squadOrder);

    if (target) {
      const desiredYaw = Math.atan2(target.position.x - d.s.position.x, target.position.z - d.s.position.z);
      let diff = desiredYaw - d.s.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      d.s.rotation.y += diff * Math.min(1, dt * 4);
      d.living.set(moving ? 0.9 : 0, 0.9 + d.fireAnim * 1.2, 0, 0);
      d.fireT -= dt;
      if (d.fireT <= 0 && !S.cinematic) {
        d.fireT = fireInterval + Math.random() * 0.9;
        d.fireAnim = 0.25;
        const from = d.s.position.clone(); from.y += 1.55;
        from.x += Math.sin(d.s.rotation.y) * 0.7;
        from.z += Math.cos(d.s.rotation.y) * 0.7;
        const to = target.position.clone();
        to.y += 1.35 + (Math.random() - 0.5) * 0.4;
        to.z += (Math.random() - 0.5) * 0.5;
        spawnPooledTracer(from, to, 0xffe48a);
        noiseBurst(0.1, 0.1, 1600, d.s.position);
        target.userData.hp -= (S.squadOrder === 'focus' ? 20 : 16);
        target.userData.hitT = 0.2;
        if (S.squadOrder === 'cover' || S.squadOrder === 'focus') target.userData.suppressT = 1.2;
        if (target.userData.hp <= 0 && S.hooks.killEnemy) {
          S.hooks.killEnemy(target, false, { isAlly: true });
        }
      }
    } else if (S.alive && !S.paused && S.squadOrder === 'focus' && S.tankette && !S.tankette.userData.dead) {
      const desiredYaw = Math.atan2(S.tankette.position.x - d.s.position.x, S.tankette.position.z - d.s.position.z);
      let diff = desiredYaw - d.s.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      d.s.rotation.y += diff * Math.min(1, dt * 4);
      d.living.set(moving ? 0.9 : 0, 0.95, 0, 0);
      d.fireT -= dt;
      if (d.fireT <= 0 && !S.cinematic) {
        d.fireT = fireInterval + Math.random();
        d.fireAnim = 0.25;
        const from = d.s.position.clone(); from.y += 1.55;
        const to = S.tankette.position.clone().add(new THREE.Vector3(0, 1.15, (Math.random() - 0.5) * 0.8));
        spawnPooledTracer(from, to, 0xffe48a);
        noiseBurst(0.1, 0.1, 1600, d.s.position);
        if (S.hooks.damageTankette) S.hooks.damageTankette(10, false, to, '29.º Ejército', null, 'hull');
      }
    } else {
      d.living.set(moving ? 0.9 : 0, 0, 0, 0);
      d.s.rotation.y = d.baseYaw + Math.sin(t * 0.65 + d.phase) * 0.14;
    }
  }
}
