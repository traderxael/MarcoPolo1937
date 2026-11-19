import * as THREE from 'three';
import { DECK_TOP, DIFFS, ENEMY_ROLES, WAVES } from './config.js';
import { $, S, addScore, unlockMedal } from './state.js';
import { box, fitModel, makeLiving, mat } from './world.js';
import {
  noiseBurst, playExplosion, playHit, playMortarWhistle, playOfficerWhistle,
  playParryClang, tone
} from './audio.js';
import { spawnPooledImpact, spawnPooledTracer } from './pools.js';
import { applyPlayerDamage, spawnArtilleryBlast } from './weapons.js';

const HELMET_GEO = new THREE.SphereGeometry(0.19, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58);
const HELMET_MAT = mat(0x525742, 0.72, 0.3);
const EGREN_GEO  = new THREE.SphereGeometry(0.11, 7, 6);
const EGREN_MAT  = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.42, 0.22) });

export function spawnFlyingHelmet(pos) {
  if (!pos) return;
  if (S.flyingHelmets.length >= 10) {
    const old = S.flyingHelmets.shift();
    S.scene.remove(old.mesh);
  }
  const m = new THREE.Mesh(HELMET_GEO, HELMET_MAT);
  m.position.copy(pos);
  m.position.y += 0.15;
  S.scene.add(m);
  S.flyingHelmets.push({
    mesh: m,
    vel: new THREE.Vector3((Math.random() - 0.5) * 4.5, 5.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4.5),
    spin: new THREE.Vector3(9 + Math.random() * 6, 7 + Math.random() * 5, 8 + Math.random() * 6),
    life: 2.2
  });
}

export function makeEnemy(role = 'rifleman', lane = 'main') {
  const spec = ENEMY_ROLES[role] || ENEMY_ROLES.rifleman;
  const diff = DIFFS[S.diffKey] || DIFFS.normal;
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';

  const torso = new THREE.Mesh(S.ENEMY_TORSO_GEO, S.HITBOX_MAT); torso.position.y = 1.02; g.add(torso);
  const head  = new THREE.Mesh(S.ENEMY_HEAD_GEO,  S.HITBOX_MAT); head.position.y  = 2.26; g.add(head);
  const shadowProxy = new THREE.Mesh(S.SHADOW_PROXY_GEO, S.SHADOW_PROXY_MAT);
  shadowProxy.position.y = 1.1; shadowProxy.castShadow = true; g.add(shadowProxy);

  const eflash = new THREE.Mesh(S.ENEMY_FLASH_GEO, S.ENEMY_FLASH_MAT);
  eflash.rotation.x = Math.PI / 2;
  eflash.position.set(0.42, 1.15, 0.72);
  eflash.visible = false;
  g.add(eflash);

  let glint = null;
  if (role === 'sniper') {
    glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 6, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.9, 1.9), transparent: true, opacity: 0.95 })
    );
    glint.position.set(0.38, 1.48, 0.65);
    glint.visible = false;
    g.add(glint);
  }

  let katana = null;
  if (role === 'officer') {
    katana = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.05, 0.06), mat(0xe0e8f0, 0.25, 0.88));
    katana.position.set(0.45, 1.35, 0.45);
    katana.rotation.set(0.85, 0, -0.2);
    g.add(katana);
  } else if (role === 'mortar') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.85, 7), mat(0x2f3430, 0.8, 0.4));
    tube.position.set(-0.32, 1.4, -0.22);
    tube.rotation.z = 0.28;
    g.add(tube);
  }

  let model = null, living = null;
  if (S.ASSETS.enemy) {
    model = fitModel(S.ASSETS.enemy, 2.55, { bottom: true, rotY: -0.45, tint: spec.tint, noCastShadow: true });
    g.add(model);
    living = makeLiving(model);
  } else {
    const uni = mat(spec.tint || 0x555c40, 1);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.1, 0.44), uni); body.position.y = 1.35; g.add(body);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), mat(0xb89774, 1)); hd.position.y = 2.12; g.add(hd);
  }
  if (spec.scale !== 1) g.scale.setScalar(spec.scale);

  const stopDist = spec.stopDistBase + ((role === 'charger' || role === 'officer') ? 0 : Math.random() * 11);
  const maxHp = Math.round(spec.hp * diff.enemyHp);
  g.userData = {
    torso, head, eflash, glint, katana, shadowProxy, role, spec, lane, stopDist, hp: maxHp,
    fireT: 0.7 + Math.random() * 1.1, pauseT: 0, flashT: 0, glintT: 0,
    suppressT: 0, coverT: 0, flankSign: (Math.random() < 0.5 ? -1 : 1),
    dead: false, deathT: 1, whistlePlayed: false,
    model, living, walk: 0, aim: 0, hitT: 0, fireAnim: 0, phase: Math.random() * 6.28
  };
  torso.userData.enemy = g;
  head.userData.enemy = g;
  return g;
}

export function spawnEnemy(forceRole = null, forceLane = null) {
  let role = forceRole || 'rifleman';
  const r = Math.random();
  const w = S.wave;
  if (!forceRole) {
    if (S.gameMode === 'survival') {
      if (w >= 2 && r < 0.14) role = 'mortar';
      else if (w >= 1 && r < 0.28) role = 'grenadier';
      else if (w >= 1 && r < 0.42) role = 'officer';
      else if (w >= 1 && r < 0.56) role = 'sniper';
      else if (r < 0.78) role = 'charger';
    } else if (w === 1) {
      if (S.toSpawn === WAVES[1]) role = 'officer';
      else if (r < 0.20) role = 'mortar';
      else if (r < 0.36) role = 'sniper';
      else if (r < 0.64) role = 'charger';
    } else if (w === 2) {
      if (S.toSpawn === WAVES[2]) role = 'officer';
      else if (r < 0.22) role = 'grenadier';
      else if (r < 0.38) role = 'sniper';
      else if (r < 0.76) role = 'charger';
    } else if (w === 3) {
      if (S.toSpawn >= WAVES[3] - 1) role = 'officer';
      else if (r < 0.18) role = 'mortar';
      else if (r < 0.34) role = 'grenadier';
      else if (r < 0.48) role = 'sniper';
      else if (S.toSpawn >= 4) role = 'charger';
    }
  }

  let lane = forceLane || 'main';
  if (!forceLane && (w === 2 || (S.gameMode === 'survival' && w % 4 === 2)) && Math.random() < 0.35 && role !== 'officer') {
    lane = 'rail';
  }
  const e = makeEnemy(role, lane);
  if (lane === 'rail') {
    e.position.set(-40 - Math.random() * 8, DECK_TOP, -13.1 + (Math.random() - 0.5) * 2.4);
  } else {
    e.position.set(-40 - Math.random() * 8, DECK_TOP, (Math.random() - 0.5) * 6.2);
  }
  S.scene.add(e);
  S.enemies.push(e);
  S.enemyHitboxes.push(e.userData.torso, e.userData.head);
  return e;
}

export function spawnTankette() {
  if (S.tankette) return;
  const diff = DIFFS[S.diffKey] || DIFFS.normal;
  const g = new THREE.Group();
  const hull = box(3.4, 1.15, 2.2, 0x454a3e, 0, 0.75, 0, g, { cast: true, receive: true, rough: 0.7, metal: 0.45 });
  const trkL = box(3.6, 0.45, 0.45, 0x222524, 0, 0.24, -1.05, g, { cast: true });
  const trkR = box(3.6, 0.45, 0.45, 0x222524, 0, 0.24,  1.05, g, { cast: true });
  const turret = box(1.4, 0.65, 1.3, 0x4f5546, 0.25, 1.6, 0, g, { cast: true });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 6), mat(0x282b2e, 0.5, 0.7));
  barrel.rotation.z = Math.PI / 2; barrel.position.set(1.55, 1.6, 0.12); g.add(barrel);

  const tflash = new THREE.Mesh(S.ENEMY_FLASH_GEO, S.ENEMY_FLASH_MAT);
  tflash.rotation.z = -Math.PI / 2; tflash.position.set(2.35, 1.6, 0.12); tflash.visible = false; g.add(tflash);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.32, 0.72),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 0.62, 0.25) })
  );
  visor.position.set(1.72, 1.12, 0);
  g.add(visor);

  hull.userData.tankPart = 'hull';
  visor.userData.tankPart = 'visor';
  trkL.userData.tankPart = 'tracks';
  trkR.userData.tankPart = 'tracks';
  turret.userData.tankPart = 'turret';

  const maxHp = Math.round(540 * diff.enemyHp);
  g.position.set(-50, DECK_TOP, 0.4);
  g.userData = {
    hp: maxHp, maxHp,
    hull, visor, trkL, trkR, turret, tflash,
    tracksHp: 130, visorHp: 110, turretHp: 150,
    tracksBroken: false, visorBroken: false, turretBroken: false,
    dead: false, fireT: 2.0, burst: 0, burstT: 0, flashT: 0
  };
  S.scene.add(g);
  S.tankette = g;
  S.enemyHitboxes.push(hull, visor, trkL, trkR, turret);
  if ($('bossBarWrap')) $('bossBarWrap').classList.remove('hidden');
  if ($('bossBar')) $('bossBar').style.width = '100%';
  ['bossPartTracks', 'bossPartVisor', 'bossPartTurret'].forEach(id => {
    if ($(id)) $(id).classList.remove('broken');
  });
  if (S.hooks.showRadio) S.hooks.showRadio('OBSERVADOR 29.º EJÉRCITO', '¡Tanqueta Tipo 94 avanzando! Destruye sus orugas, visor naranja o torreta.', 6.5);
}

export function damageTankette(dmg, critical, hitWorldPos = null, weaponName = 'Fusil', dmgKind = null, part = 'hull') {
  if (!S.tankette || S.tankette.userData.dead) return;
  const u = S.tankette.userData;
  u.hp -= dmg;

  if (part === 'tracks' && !u.tracksBroken) {
    u.tracksHp -= dmg;
    if (u.tracksHp <= 0) {
      u.tracksBroken = true;
      u.trkL.material = mat(0x161616, 1.0);
      u.trkR.material = mat(0x161616, 1.0);
      if ($('bossPartTracks')) $('bossPartTracks').classList.add('broken');
      if (S.hooks.showMsg) S.hooks.showMsg('¡ORUGAS DESTRUIDAS! TANQUETA INMOVILIZADA', 1.8);
    }
  } else if (part === 'visor' && !u.visorBroken) {
    u.visorHp -= dmg;
    if (u.visorHp <= 0) {
      u.visorBroken = true;
      u.visor.material.color.setRGB(0.2, 0.2, 0.2);
      if ($('bossPartVisor')) $('bossPartVisor').classList.add('broken');
      if (S.hooks.showMsg) S.hooks.showMsg('¡VISOR CIEGO! PRECISIÓN ENEMIGA REDUCIDA', 1.6);
    }
  } else if (part === 'turret' && !u.turretBroken) {
    u.turretHp -= dmg;
    if (u.turretHp <= 0) {
      u.turretBroken = true;
      u.turret.material = mat(0x2a2420, 0.95);
      if ($('bossPartTurret')) $('bossPartTurret').classList.add('broken');
      if (S.hooks.showMsg) S.hooks.showMsg('¡TORRETA DAÑADA! RÁFAGAS LENTAS', 1.6);
    }
  }

  if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(critical);
  playHit(critical);
  const pos = hitWorldPos || S.tankette.position.clone().add(new THREE.Vector3(0, 1.6, 0));
  if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(pos, dmg, dmgKind || (critical ? 'crit' : 'armor'));
  if ($('bossBar')) $('bossBar').style.width = Math.max(0, (u.hp / u.maxHp) * 100) + '%';

  if (u.hp <= 0) {
    u.dead = true;
    [u.hull, u.visor, u.trkL, u.trkR, u.turret].forEach(hb => {
      const idx = S.enemyHitboxes.indexOf(hb);
      if (idx >= 0) S.enemyHitboxes.splice(idx, 1);
    });
    const tx = S.tankette.position.x, tz = S.tankette.position.z;
    spawnArtilleryBlast(tx, DECK_TOP, tz);
    setTimeout(() => spawnArtilleryBlast(tx + 1, DECK_TOP + 0.5, tz - 0.5), 220);
    S.scene.remove(S.tankette);
    S.tankette = null;
    if ($('bossBarWrap')) $('bossBarWrap').classList.add('hidden');
    addScore(500);
    S.stats.kills++;
    unlockMedal('tank_hunter');
    if (S.hooks.addKillfeedEntry) {
      S.hooks.addKillfeedEntry({ killer: 'Tú', victim: 'Tanqueta Tipo 94 Te-Ke', weapon: weaponName, headshot: Boolean(critical && dmgKind !== 'blast'), pts: 500 });
    }
    if (S.hooks.registerPlayerKill) S.hooks.registerPlayerKill();
    if (S.hooks.showMsg) S.hooks.showMsg('九四式装甲车击毁 · ¡TANQUETA DESTRUIDA! (+500)', 2.2);
  }
}

export function killEnemy(e, fromGrenade = false, opt = {}) {
  if (e.userData.dead) return;
  e.userData.dead = true;
  e.userData.deathT = 1.0;
  if (e.userData.eflash) e.userData.eflash.visible = false;
  if (e.userData.glint) e.userData.glint.visible = false;
  if (e.userData.shadowProxy) e.userData.shadowProxy.castShadow = false;
  S.stats.kills++;

  const basePts = (e.userData.spec ? e.userData.spec.pts : 100) + (S.current === 'sword' && !fromGrenade && !opt.isAlly ? 50 : 0);
  addScore(basePts);

  const t = e.userData.torso, h = e.userData.head;
  let i = S.enemyHitboxes.indexOf(t); if (i >= 0) S.enemyHitboxes.splice(i, 1);
  i = S.enemyHitboxes.indexOf(h); if (i >= 0) S.enemyHitboxes.splice(i, 1);

  if (opt.headshot) {
    spawnFlyingHelmet(e.position.clone().add(new THREE.Vector3(0, 2.25, 0)));
    if (S.stats.headshots >= 5) unlockMedal('headshot5');
  }
  unlockMedal('first_blood');

  const vLabel = (e.userData.spec && e.userData.spec.label) || 'Soldado japonés';
  if (opt.isAlly) {
    if (S.hooks.addKillfeedEntry) S.hooks.addKillfeedEntry({ killer: '29.º Ejército', victim: vLabel, weapon: 'Fusil', headshot: false, pts: 0, isAlly: true });
  } else {
    const wLabel = opt.weapon || (fromGrenade ? 'Granada Tipo 24' : 'Fusil');
    if (S.hooks.addKillfeedEntry) S.hooks.addKillfeedEntry({ killer: 'Tú', victim: vLabel, weapon: wLabel, headshot: Boolean(opt.headshot), pts: basePts });
    if (S.hooks.registerPlayerKill) S.hooks.registerPlayerKill();
    if (S.hooks.showMsg) {
      S.hooks.showMsg(e.userData.role === 'officer' ? '敌军军官击倒 · OFICIAL ABATIDO' : (e.userData.role === 'sniper' ? '狙击手击倒 · TIRADOR ABATIDO' : '敌兵击倒 · ABATIDO'), 0.8);
    }
  }
}

function throwEnemyGrenade(e) {
  const m = new THREE.Mesh(EGREN_GEO, EGREN_MAT);
  m.position.copy(e.position).add(new THREE.Vector3(0.3, 1.5, 0));
  S.scene.add(m);
  const tgt = S.player.pos.clone();
  tgt.y = DECK_TOP + 0.1;
  const dtFlight = 1.65;
  const vx = (tgt.x - m.position.x) / dtFlight;
  const vz = (tgt.z - m.position.z) / dtFlight;
  const vy = (tgt.y - m.position.y + 0.5 * 14.0 * dtFlight * dtFlight) / dtFlight;
  S.enemyGrenades.push({ mesh: m, vel: new THREE.Vector3(vx, vy, vz), life: 2.0 });
  tone(420, 0.08, 0.1, 'square', 280, false, e.position);
}

function fireEnemyMortar(e) {
  const tx = Math.max(-25, Math.min(62, S.player.pos.x + (Math.random() - 0.5) * 3.5));
  const tz = Math.max(-14.5, Math.min(4.0, S.player.pos.z + (Math.random() - 0.5) * 2.5));
  const ty = (tx > 68 && S.player.feetY > 9) ? 11.45 : DECK_TOP + 0.05;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.9, 22),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.25, 0.15), side: THREE.DoubleSide, transparent: true, opacity: 0.78, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(tx, ty, tz);
  S.scene.add(ring);
  S.enemyMortars.push({ x: tx, y: ty, z: tz, timer: 1.9, ring });
  playMortarWhistle(new THREE.Vector3(tx, ty + 8, tz));
}

function enemyFire(e, dist) {
  if (!S.alive) return;
  const u = e.userData;
  u.fireAnim = 0.25;
  u.pauseT = 0.58;
  u.flashT = 0.07;
  if (u.eflash) u.eflash.visible = true;
  if (u.glint) u.glint.visible = false;

  const from = new THREE.Vector3();
  if (u.eflash) { u.eflash.updateWorldMatrix(true, false); u.eflash.getWorldPosition(from); }
  else { u.torso.getWorldPosition(from); from.y += 0.25; }

  const target = S.player.pos.clone().add(new THREE.Vector3(0, -0.15, 0));
  const dirToPlayer = new THREE.Vector3().subVectors(target, from);
  const losDist = dirToPlayer.length() || 1;
  dirToPlayer.divideScalar(losDist);
  S.raycaster.set(from, dirToPlayer);
  S.raycaster.far = losDist;
  const obs = S.raycaster.intersectObjects(S.worldColliders, false).filter(h => h.object.visible !== false);
  if (obs.length) {
    spawnPooledImpact(obs[0].point, 0xc8b896, 3);
    spawnPooledTracer(from, obs[0].point, 0xff9c5b);
    noiseBurst(0.1, 0.12, 1400, from);
    return;
  }

  const coverMult = (S.mgMounted ? 0.5 : (S.crouching ? 0.55 : 1.0));
  const baseAcc = u.role === 'sniper' ? 0.58 : 0.38;
  const hitChance = baseAcc * coverMult * Math.max(0.28, 1 - dist / 82);
  const hit = Math.random() < hitChance && dist < 76;
  const to = target.clone();
  if (!hit) {
    to.z += (Math.random() < 0.5 ? -1 : 1) * (1.1 + Math.random() * 1.4);
    to.y += (Math.random() - 0.35) * 1.4;
    to.addScaledVector(dirToPlayer, 4);
  }
  spawnPooledTracer(from, to, 0xff9c5b);
  noiseBurst(0.1, 0.14, 1400, from);
  if (hit) {
    const raw = u.role === 'sniper' ? (13 + Math.random() * 4) : (dist < 32 ? (7 + Math.random() * 6) : (4 + Math.random() * 4));
    applyPlayerDamage(raw, e.position);
  }
}

export function updateEnemies(dt, t) {
  const diff = DIFFS[S.diffKey] || DIFFS.normal;

  for (const e of S.enemies) {
    const u = e.userData;
    if (u.dead) {
      u.deathT -= dt;
      e.rotation.z = Math.min(Math.PI / 2.3, e.rotation.z + dt * 2.6);
      e.position.y -= dt * 0.45;
      if (u.living) { u.living.time(t + u.phase); u.living.set(0, 0, 0, Math.min(1, 1 - u.deathT)); }
      if (u.deathT <= 0) { if (u.living) u.living.dispose(); S.scene.remove(e); }
      continue;
    }

    if (u.flashT > 0) { u.flashT -= dt; if (u.flashT <= 0 && u.eflash) u.eflash.visible = false; }
    if (u.pauseT > 0) u.pauseT = Math.max(0, u.pauseT - dt);
    if (u.suppressT > 0) u.suppressT = Math.max(0, u.suppressT - dt);

    const d = e.position.distanceTo(S.player.pos);
    const lookObj = e;
    const desiredYaw = Math.atan2(S.player.pos.x - e.position.x, S.player.pos.z - e.position.z);
    let dyaw = desiredYaw - lookObj.rotation.y;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    lookObj.rotation.y += dyaw * Math.min(1, dt * 5);

    const suppressedDuck = u.suppressT > 0 && u.role !== 'charger' && u.role !== 'officer';
    if (u.model) u.model.scale.y = suppressedDuck ? 0.78 : (u.spec.scale || 1);

    const moving = d > u.stopDist && u.pauseT <= 0 && !suppressedDuck;
    if (moving) {
      if (u.lane === 'rail') {
        if (e.position.x < 48) {
          e.position.x += dt * u.spec.speed;
        } else {
          const dx = S.player.pos.x - e.position.x, dz = S.player.pos.z - e.position.z;
          const len = Math.hypot(dx, dz) || 1;
          e.position.x += (dx / len) * dt * u.spec.speed;
          e.position.z += (dz / len) * dt * u.spec.speed;
        }
      } else {
        const dx = S.player.pos.x - e.position.x;
        const dz = S.player.pos.z - e.position.z;
        const len = Math.hypot(dx, dz) || 1;
        // Slight flanking weave when mid-range
        const lat = (d > 10 && d < 32) ? u.flankSign * 0.25 : 0;
        e.position.x += ((dx / len) - (dz / len) * lat) * dt * u.spec.speed;
        e.position.z += ((dz / len) + (dx / len) * lat) * dt * u.spec.speed;
      }
    }

    // Separation
    for (const other of S.enemies) {
      if (other === e || other.userData.dead) continue;
      const dx = e.position.x - other.position.x, dz = e.position.z - other.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 0.001 && distSq < 2.56) {
        const dist = Math.sqrt(distSq);
        const push = (1.6 - dist) * dt * 2.2;
        e.position.x += (dx / dist) * push;
        e.position.z += (dz / dist) * push;
      }
    }
    e.position.y = DECK_TOP;
    e.position.x = Math.max(-60, Math.min(62, e.position.x));
    if (u.lane === 'rail' && e.position.x < 46) {
      e.position.z = Math.max(-15.0, Math.min(-11.0, e.position.z));
    } else {
      e.position.z = Math.max(-3.5, Math.min(3.5, e.position.z));
    }

    u.walk += ((moving ? 1 : 0) - u.walk) * Math.min(1, dt * 5);
    const aimTarget = (u.role === 'charger' || u.role === 'officer') ? (d < 9 ? 1 : 0) : ((d < 78 || u.pauseT > 0) ? 1 : 0);
    u.aim += (aimTarget - u.aim) * Math.min(1, dt * 4);
    u.hitT = Math.max(0, u.hitT - dt);
    u.fireAnim = Math.max(0, u.fireAnim - dt);
    if (u.living) {
      u.living.time(t + u.phase);
      u.living.set(u.walk, u.aim + u.fireAnim * 1.6, u.hitT * 3, 0);
    }
    e.rotation.z = Math.sin(t * 4.25 + u.phase) * 0.03 * u.walk;

    if ((u.role === 'officer' || u.role === 'charger') && !u.whistlePlayed && d < 18) {
      u.whistlePlayed = true;
      if (u.role === 'officer') playOfficerWhistle(e.position);
    }

    u.fireT -= dt;
    if (suppressedDuck) continue;

    if (u.role === 'charger' || (u.role === 'officer' && d < 3.2)) {
      if (u.fireT <= 0 && d < 2.6) {
        u.fireT = u.spec.fireRate;
        u.fireAnim = 0.35;
        if (S.parryTimer > 0) {
          playParryClang();
          e.userData.hp -= 120;
          e.userData.hitT = 0.4;
          unlockMedal('dadao_parry');
          if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 120, 'crit');
          if (S.hooks.showMsg) S.hooks.showMsg('¡PARRY CON DADAO!', 0.9);
          if (e.userData.hp <= 0) killEnemy(e, false, { weapon: 'Parry Dadao', headshot: true });
        } else {
          applyPlayerDamage((u.role === 'officer' ? 14 : 10) + Math.random() * 6, e.position);
          noiseBurst(0.08, 0.2, 850);
        }
      } else if (u.role === 'officer' && u.fireT <= 0 && d < 72) {
        u.fireT = u.spec.fireRate + Math.random();
        enemyFire(e, d);
      }
    } else if (u.role === 'sniper') {
      if (u.fireT <= 0.65 && u.fireT > 0 && d < 78) {
        if (u.glint) {
          u.glint.visible = true;
          u.glint.lookAt(S.camera.position);
          const pulse = 0.8 + Math.sin(t * 28) * 0.25;
          u.glint.scale.set(pulse, pulse, pulse);
        }
      } else if (u.glint) {
        u.glint.visible = false;
      }
      if (u.fireT <= 0 && d < 78) {
        u.fireT = u.spec.fireRate + Math.random() * 1.2;
        enemyFire(e, d);
      }
    } else if (u.role === 'grenadier') {
      if (u.fireT <= 0 && d < 52 && d > 8) {
        u.fireT = u.spec.fireRate + Math.random() * 1.4;
        u.fireAnim = 0.3;
        throwEnemyGrenade(e);
      } else if (u.fireT <= 0 && d < 72) {
        u.fireT = 1.6;
        enemyFire(e, d);
      }
    } else if (u.role === 'mortar') {
      if (u.fireT <= 0 && d < 85 && d > 12) {
        u.fireT = u.spec.fireRate + Math.random() * 1.6;
        u.fireAnim = 0.3;
        fireEnemyMortar(e);
      }
    } else if (u.fireT <= 0 && d < 76) {
      u.fireT = u.spec.fireRate + Math.random() * 1.1;
      enemyFire(e, d);
    }
  }
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    if (S.enemies[i].userData.deathT <= 0) S.enemies.splice(i, 1);
  }

  // Enemy Type 97 grenades + proximity alert
  let closeGrenadeDist = Infinity;
  for (let i = S.enemyGrenades.length - 1; i >= 0; i--) {
    const g = S.enemyGrenades[i];
    g.life -= dt;
    g.vel.y -= 14.0 * dt;
    g.mesh.position.addScaledVector(g.vel, dt);
    if (g.mesh.position.y <= DECK_TOP + 0.1 && g.vel.y < 0) {
      g.mesh.position.y = DECK_TOP + 0.1;
      g.vel.y = -g.vel.y * 0.35;
      g.vel.x *= 0.65; g.vel.z *= 0.65;
    }
    const distP = g.mesh.position.distanceTo(S.player.pos);
    if (distP < closeGrenadeDist) closeGrenadeDist = distP;
    if (g.life <= 0) {
      const gp = g.mesh.position.clone();
      S.scene.remove(g.mesh);
      S.enemyGrenades.splice(i, 1);
      spawnArtilleryBlast(gp.x, DECK_TOP, gp.z);
      const dHit = gp.distanceTo(S.player.pos);
      if (dHit < 5.5) applyPlayerDamage(Math.round(28 * (1 - dHit / 6.0)), gp);
    }
  }
  if ($('grenadeWarn')) $('grenadeWarn').classList.toggle('show', closeGrenadeDist < 7.5 && S.alive);

  // Enemy mortar rings
  for (let i = S.enemyMortars.length - 1; i >= 0; i--) {
    const m = S.enemyMortars[i];
    m.timer -= dt;
    m.ring.scale.setScalar(1 + Math.sin(m.timer * 18) * 0.16);
    if (m.timer <= 0) {
      S.scene.remove(m.ring);
      m.ring.geometry.dispose(); m.ring.material.dispose();
      S.enemyMortars.splice(i, 1);
      spawnArtilleryBlast(m.x, m.y, m.z);
      const dM = Math.hypot(S.player.pos.x - m.x, S.player.pos.z - m.z);
      if (dM < 3.4) applyPlayerDamage(Math.round(30 * (1 - dM / 3.8)), new THREE.Vector3(m.x, m.y, m.z));
    }
  }

  // Flying helmets
  for (let i = S.flyingHelmets.length - 1; i >= 0; i--) {
    const h = S.flyingHelmets[i];
    h.life -= dt;
    h.vel.y -= 16.0 * dt;
    h.mesh.position.addScaledVector(h.vel, dt);
    h.mesh.rotation.x += h.spin.x * dt;
    h.mesh.rotation.y += h.spin.y * dt;
    h.mesh.rotation.z += h.spin.z * dt;
    if (h.mesh.position.y <= DECK_TOP + 0.08 && h.vel.y < 0) {
      h.mesh.position.y = DECK_TOP + 0.08;
      h.vel.y = -h.vel.y * 0.4;
      h.vel.x *= 0.6; h.vel.z *= 0.6;
    }
    if (h.life <= 0) {
      S.scene.remove(h.mesh);
      S.flyingHelmets.splice(i, 1);
    }
  }

  // Type 94 Tankette boss AI
  if (S.tankette && !S.tankette.userData.dead) {
    const tu = S.tankette.userData;
    if (tu.flashT > 0) { tu.flashT -= dt; if (tu.flashT <= 0 && tu.tflash) tu.tflash.visible = false; }
    if (!tu.tracksBroken && S.tankette.position.x < -8) {
      S.tankette.position.x += dt * 2.2;
      S.tankette.position.y = DECK_TOP + Math.abs(Math.sin(t * 8)) * 0.025;
    } else {
      S.tankette.position.y = DECK_TOP;
    }
    if (!tu.visorBroken && tu.visor && tu.visor.material) {
      const pulse = Math.sin(t * 6) > 0 ? 1.55 : 1.15;
      tu.visor.material.color.setRGB(pulse, pulse * 0.45, pulse * 0.16);
    }
    tu.fireT -= dt;
    const baseCd = tu.turretBroken ? 5.2 : 3.2;
    if (tu.fireT <= 0 && tu.burst <= 0) {
      tu.burst = tu.turretBroken ? 2 : 4;
      tu.burstT = 0;
      tu.fireT = baseCd + Math.random() * 1.2;
    }
    if (tu.burst > 0) {
      tu.burstT -= dt;
      if (tu.burstT <= 0) {
        tu.burst--; tu.burstT = 0.15;
        tu.flashT = 0.06;
        if (tu.tflash) tu.tflash.visible = true;
        const from = new THREE.Vector3();
        tu.tflash.updateWorldMatrix(true, false);
        tu.tflash.getWorldPosition(from);
        const tgt = S.player.pos.clone().add(new THREE.Vector3(0, -0.15, 0));
        const dirT = new THREE.Vector3().subVectors(tgt, from);
        const dT = dirT.length() || 1;
        dirT.divideScalar(dT);
        S.raycaster.set(from, dirT); S.raycaster.far = dT;
        const obs = S.raycaster.intersectObjects(S.worldColliders, false).filter(h => h.object.visible !== false);
        if (obs.length) {
          spawnPooledImpact(obs[0].point, 0xc8b896, 3);
          spawnPooledTracer(from, obs[0].point, 0xffaa44);
          noiseBurst(0.08, 0.14, 900, from);
        } else {
          const cov = (S.mgMounted ? 0.45 : (S.crouching ? 0.5 : 1.0)) * (tu.visorBroken ? 0.45 : 1.0);
          const hit = Math.random() < (0.34 * cov);
          const to = tgt.clone();
          if (!hit) { to.z += (Math.random() - 0.5) * 2.6; to.y += (Math.random() - 0.3) * 1.2; }
          spawnPooledTracer(from, to, 0xffaa44);
          noiseBurst(0.08, 0.16, 900, from);
          if (hit) applyPlayerDamage((6 + Math.random() * 4) * diff.enemyDmg, S.tankette.position);
        }
      }
    }
  }
}
