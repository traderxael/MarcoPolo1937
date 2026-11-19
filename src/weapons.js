import * as THREE from 'three';
import { DECK_TOP, DIFFS, WEAPONS } from './config.js';
import { $, S, addScore, unlockMedal } from './state.js';
import { box, damageSandbagCluster, fitModel, makeLiving, mat } from './world.js';
import {
  noiseBurst, playBandageSound, playDryFire, playExplosion, playHit, playHurt,
  playMolotovShatter, playMortarWhistle, playParryClang, playReload, playShatter,
  playSupply, tone
} from './audio.js';
import { spawnCrater, spawnFireParticle, spawnPooledCasing, spawnPooledImpact, spawnPooledTracer } from './pools.js';

const GREN_HANDLE_GEO = new THREE.CylinderGeometry(0.028, 0.032, 0.28, 6);
const GREN_HEAD_GEO   = new THREE.CylinderGeometry(0.058, 0.058, 0.14, 8);
const MOLO_BOTTLE_GEO = new THREE.CylinderGeometry(0.036, 0.048, 0.24, 7);
const BLAST_FIRE_GEO  = new THREE.SphereGeometry(0.9, 10, 8);
const BLAST_SMOKE_GEO = new THREE.SphereGeometry(1.1, 8, 6);

export function buildViewModels() {
  const vm = new THREE.Group();
  S.camera.add(vm);
  const steel = mat(0x2c3033, 0.5, 0.6);

  // Rifle (Chiang Kai-shek auto)
  const rifle = new THREE.Group();
  box(0.11, 0.14, 1.05, 0x6b4423, 0, -0.05, 0.18, rifle);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.98, 8), steel);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, -0.62); rifle.add(barrel);
  box(0.085, 0.19, 0.13, 0x2c3033, 0, -0.17, -0.05, rifle);
  const bay = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.42, 4), steel);
  bay.rotation.x = -Math.PI / 2; bay.position.set(0, 0.02, -1.3); rifle.add(bay);
  box(0.14, 0.14, 0.32, 0x4b5338, -0.02, -0.17, -0.48, rifle);
  box(0.14, 0.14, 0.3, 0x4b5338, 0, -0.2, 0.3, rifle);
  const flashR = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), transparent: true, opacity: 0.85, depthWrite: false }));
  flashR.rotation.x = -Math.PI / 2; flashR.position.set(0, 0.02, -0.72); flashR.visible = false; flashR.userData.isFlash = true; rifle.add(flashR);
  rifle.position.set(0.34, -0.3, -0.5); rifle.rotation.y = -0.05; vm.add(rifle);

  // Mauser C96 Pistol
  const pistol = new THREE.Group();
  box(0.1, 0.13, 0.36, 0x2c3033, 0, 0, 0, pistol);
  box(0.09, 0.22, 0.11, 0x6b4423, 0, -0.16, 0.06, pistol);
  const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.4, 8), steel);
  pb.rotation.x = Math.PI / 2; pb.position.set(0, 0.04, -0.3); pistol.add(pb);
  box(0.14, 0.14, 0.26, 0x4b5338, 0, -0.14, 0.06, pistol);
  const flashP = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), transparent: true, opacity: 0.85, depthWrite: false }));
  flashP.rotation.x = -Math.PI / 2; flashP.position.set(0, 0.04, -0.56); flashP.visible = false; flashP.userData.isFlash = true; pistol.add(flashP);
  pistol.position.set(0.36, -0.32, -0.45); pistol.rotation.y = -0.05; pistol.visible = false; vm.add(pistol);

  // Dadao Broadsword
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.92, 0.028), mat(0x9ca6ad, 0.35, 0.78));
  blade.position.set(0, 0.58, -0.1); blade.rotation.x = -0.35; sword.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), steel);
  tip.position.set(0, 1.08, -0.19); tip.rotation.x = Math.PI - 0.35; sword.add(tip);
  box(0.1, 0.28, 0.09, 0x3c2b1e, 0, 0.08, 0.02, sword);
  box(0.26, 0.05, 0.12, 0x2c3033, 0, 0.22, 0.02, sword);
  box(0.14, 0.14, 0.24, 0x4b5338, 0, -0.08, 0.05, sword);
  sword.position.set(0.38, -0.4, -0.45); sword.rotation.set(0.35, -0.12, -0.25); sword.visible = false; vm.add(sword);

  // MP-18 Submachine gun (wooden stock, perforated barrel shroud, side stick magazine)
  const mp18 = new THREE.Group();
  box(0.10, 0.13, 0.86, 0x623b1e, 0, -0.06, 0.14, mp18);
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.72, 10), mat(0x282b2e, 0.45, 0.75));
  shroud.rotation.x = Math.PI / 2; shroud.position.set(0, 0.02, -0.42); mp18.add(shroud);
  const sideMag = box(0.26, 0.045, 0.065, 0x222528, -0.16, 0.02, -0.22, mp18, { metal: 0.75, rough: 0.4 });
  sideMag.rotation.z = 0.15;
  box(0.13, 0.13, 0.28, 0x4b5338, 0, -0.18, 0.25, mp18);
  const flashM = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), transparent: true, opacity: 0.88, depthWrite: false }));
  flashM.rotation.x = -Math.PI / 2; flashM.position.set(0, 0.02, -0.85); flashM.visible = false; flashM.userData.isFlash = true; mp18.add(flashM);
  mp18.position.set(0.33, -0.31, -0.48); mp18.rotation.y = -0.04; mp18.visible = false; vm.add(mp18);

  S.vmRes = { vm, groups: { rifle, pistol, sword, mp18 }, flashes: { rifle: flashR, pistol: flashP, mp18: flashM } };
}

function buildProceduralPlayerFallback() {
  const g = new THREE.Group();
  const uni = mat(0x6d7758, 0.92);
  const legM = mat(0x565e45, 0.95);
  const skin = mat(0xb89572, 0.85);
  const dark = mat(0x2d2b26, 0.8);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.92, 0.38), uni); body.position.y = 1.28; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 6), skin); head.position.y = 1.98; head.castShadow = true; g.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.14, 8), uni); cap.position.y = 2.12; g.add(cap);
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.24), legM); lLeg.position.set(-0.17, 0.41, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.24), legM); rLeg.position.set(0.17, 0.41, 0); g.add(rLeg);
  const rifleB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.96), dark); rifleB.position.set(0.24, 1.32, 0.44); g.add(rifleB);
  return g;
}

export function buildPlayerAvatar() {
  const av = new THREE.Group();
  const avBody = new THREE.Group();
  av.add(avBody);
  const avatarFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.30, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.55), transparent: true, opacity: 0.9, depthWrite: false })
  );
  avatarFlash.rotation.x = Math.PI / 2;
  avatarFlash.position.set(0.24, 1.38, 0.92);
  avatarFlash.visible = false;
  av.add(avatarFlash);

  const avatarSword = new THREE.Group();
  const avGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.08), mat(0x2c3033, 0.5, 0.6));
  avGuard.position.set(0, 0.04, 0);
  const avBlade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.92, 0.024), mat(0x9aa4ab, 0.35, 0.75));
  avBlade.position.set(0, 0.50, 0);
  avatarSword.add(avGuard, avBlade);
  avatarSword.position.set(-0.44, 1.30, 0.34);
  avatarSword.rotation.set(0.32, 0.12, 0.32);
  avatarSword.visible = false;
  av.add(avatarSword);

  av.visible = false;
  S.scene.add(av);
  S.playerAvatar = av;
  S.playerAvatarBody = avBody;
  S.avatarFlash = avatarFlash;
  S.avatarSword = avatarSword;
  setupPlayerAvatarMesh();
}

export function setupPlayerAvatarMesh() {
  S.playerAvatarBody.clear();
  if (S.playerLiving) { S.playerLiving.dispose(); S.playerLiving = null; }
  if (S.ASSETS.chinese) {
    const s = fitModel(S.ASSETS.chinese, 2.4, { bottom: true, rotY: -0.38, tint: 0x8c9274, noCastShadow: true });
    S.playerAvatarBody.add(s);
    const sp = new THREE.Mesh(S.SHADOW_PROXY_GEO, S.SHADOW_PROXY_MAT);
    sp.position.y = 1.1; sp.castShadow = true;
    S.playerAvatarBody.add(sp);
    S.playerLiving = makeLiving(s);
  } else {
    S.playerAvatarBody.add(buildProceduralPlayerFallback());
  }
}

export function applyWeaponModels() {
  const cfgs = {
    rifle:  { height: 0.98, rotX: -Math.PI / 2, dz: -0.25, dy: -0.04 },
    pistol: { height: 0.4,  rotY: Math.PI / 2,  dz: -0.1 },
    sword:  { height: 1.25, dy: 0.5, dx: -0.1 }
  };
  for (const k of Object.keys(cfgs)) {
    if (!S.ASSETS[k]) continue;
    const cfg = cfgs[k], grp = S.vmRes.groups[k];
    [...grp.children].forEach(c => { if (!c.userData.isFlash) c.visible = false; });
    grp.add(fitModel(S.ASSETS[k], cfg.height, cfg));
  }
  setupPlayerAvatarMesh();
}

export function spawnArtilleryBlast(x, y, z, posForAudio = true) {
  const fire = new THREE.Mesh(
    BLAST_FIRE_GEO,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 0.82, 0.25), transparent: true, opacity: 0.95, depthWrite: false })
  );
  fire.position.set(x, y + 0.6, z); S.scene.add(fire);
  S.effects.push({ obj: fire, life: 0.45, max: 0.45, line: false, grow: 4.8, sharedGeo: true });
  const smoke = new THREE.Mesh(
    BLAST_SMOKE_GEO,
    new THREE.MeshBasicMaterial({ color: 0x22201d, transparent: true, opacity: 0.75, depthWrite: false })
  );
  smoke.position.set(x, y + 1.2, z); S.scene.add(smoke);
  S.effects.push({ obj: smoke, life: 1.4, max: 1.4, line: false, grow: 3.4, sharedGeo: true });
  const pl = new THREE.PointLight(0xff7733, 60, 35, 2);
  pl.position.set(x, y + 2.5, z); S.scene.add(pl);
  S.effects.push({ obj: pl, life: 0.42, max: 0.42, light: true, baseInt: 60 });
  if (Math.abs(y - DECK_TOP) < 1.2) spawnCrater(x, DECK_TOP, z, 0.95);
  const d = S.player.pos.distanceTo(new THREE.Vector3(x, y, z));
  S.cameraShake = Math.max(S.cameraShake, Math.max(0.12, 0.65 - d / 55));
  playExplosion(0.38, posForAudio ? new THREE.Vector3(x, y, z) : null);
}

export function applyPlayerDamage(rawDmg, fromPos) {
  if (!S.alive) return;
  const diff = DIFFS[S.diffKey] || DIFFS.normal;
  let dmg = rawDmg * diff.enemyDmg;
  if (S.player.armor > 0) {
    const abs = Math.min(S.player.armor, dmg * 0.65);
    S.player.armor = Math.max(0, S.player.armor - abs);
    dmg -= abs;
  }
  S.player.hp -= dmg;
  if (S.hooks.flashDamage) S.hooks.flashDamage();
  if (S.hooks.showDirDamage) S.hooks.showDirDamage(fromPos);
  playHurt();
  if (S.player.hp <= 0) {
    S.player.hp = 0;
    if (S.hooks.die) S.hooks.die();
  }
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function detonateBarrel(barrel) {
  if (!barrel || barrel.exploded) return;
  barrel.exploded = true;
  barrel.mesh.visible = false;
  barrel.colBox.broken = true;
  const p = new THREE.Vector3(barrel.x, DECK_TOP + 0.4, barrel.z);
  spawnArtilleryBlast(barrel.x, DECK_TOP, barrel.z);
  for (let i = 0; i < 8; i++) spawnFireParticle(p, 0xff7722, 3.0, 1.3);

  for (const e of S.enemies) {
    if (e.userData.dead) continue;
    const d = e.position.distanceTo(p);
    if (d < 8.0) {
      const dmg = Math.round(210 * (1 - d / 8.8));
      e.userData.hp -= dmg;
      e.userData.hitT = 0.35;
      if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(true);
      if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.8, 0)), dmg, 'blast');
      if (e.userData.hp <= 0 && S.hooks.killEnemy) {
        S.hooks.killEnemy(e, true, { weapon: 'Barril Explosivo' });
        addScore(50);
      }
    }
  }
  for (const sc of S.sandbagClusters) {
    if (!sc.broken && Math.hypot(sc.x - barrel.x, sc.z - barrel.z) < 6.0) damageSandbagCluster(sc, 80, p);
  }
  if (S.tankette && !S.tankette.userData.dead && S.tankette.position.distanceTo(p) < 8.5) {
    S.hooks.damageTankette(190, true, S.tankette.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 'Barril Explosivo', 'blast', 'tracks');
  }
}

export function switchWeapon(name) {
  if (!S.alive || name === S.current || S.mgMounted) return;
  if (name === 'mp18' && !S.mp18Owned) {
    if (S.hooks.showMsg) S.hooks.showMsg('MP-18 DESBLOQUEABLE EN TIENDA DE SUPERVIVENCIA', 1.4);
    return;
  }
  S.current = name;
  S.fireTimer = 0; S.reloadTimer = 0; S.meleeSwing = 0; S.aiming = false;
  for (const k in S.vmRes.groups) S.vmRes.groups[k].visible = (k === name);
  if (S.hooks.showMsg) S.hooks.showMsg(WEAPONS[name].name, 1.1);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function startReload() {
  const w = WEAPONS[S.current];
  if (!S.alive || S.mgMounted || w.melee || S.reloadTimer > 0 || w.ammo >= w.clip || w.reserve <= 0) return;
  S.reloadTimer = w.reload;
  S.aiming = false;
  playReload();
  if (S.hooks.showMsg) S.hooks.showMsg('RECARGANDO…', w.reload);
}

export function triggerParryOrHeavy() {
  if (!S.alive || S.paused || S.cinematic || S.mgMounted || S.current !== 'sword') return false;
  if (S.fireTimer > 0) return false;
  S.parryTimer = 0.50;
  S.meleeSwing = 1.0;
  S.fireTimer = 0.48;
  noiseBurst(0.11, 0.24, 1100);
  tone(420, 0.08, 0.14, 'triangle', 680);
  // Check immediate melee arc & bayonet/katana deflect
  for (const e of S.enemies) {
    if (e.userData.dead) continue;
    const d = e.position.distanceTo(S.player.pos);
    if (d < 4.2 && (e.userData.role === 'charger' || e.userData.role === 'officer')) {
      playParryClang();
      e.userData.hp -= 160;
      e.userData.hitT = 0.45;
      if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(true);
      if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 160, 'crit');
      unlockMedal('dadao_parry');
      if (e.userData.hp <= 0 && S.hooks.killEnemy) S.hooks.killEnemy(e, false, { weapon: 'Parry Dadao', headshot: true });
      return true;
    }
  }
  return true;
}

export function throwGrenade() {
  if (!S.alive || S.paused || S.cinematic) return;
  if (S.grenades <= 0) { if (S.hooks.showMsg) S.hooks.showMsg('SIN GRANADAS · RECOGE SUMINISTROS [E]', 1.1); playDryFire(); return; }
  S.grenades--;
  const g = new THREE.Group();
  const handle = new THREE.Mesh(GREN_HANDLE_GEO, mat(0x6b4423, 0.9));
  const head   = new THREE.Mesh(GREN_HEAD_GEO, mat(0x2f352e, 0.7, 0.4));
  head.position.y = 0.18;
  g.add(handle, head);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(S.camera.quaternion);
  g.position.copy(S.player.pos).addScaledVector(dir, 0.7);
  S.scene.add(g);
  const vel = dir.multiplyScalar(17).add(new THREE.Vector3(0, 4.8, 0));
  S.grenadesList.push({ mesh: g, vel, life: 2.0 });
  tone(320, 0.08, 0.15, 'triangle', 560);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function detonateGrenade(p) {
  spawnArtilleryBlast(p.x, DECK_TOP, p.z);
  for (const e of S.enemies) {
    if (e.userData.dead) continue;
    const d = e.position.distanceTo(p);
    if (d < 6.8) {
      const dmg = Math.round(180 * (1 - d / 7.5));
      e.userData.hp -= dmg;
      e.userData.hitT = 0.35;
      if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(true);
      if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.8, 0)), dmg, 'blast');
      if (e.userData.hp <= 0 && S.hooks.killEnemy) {
        S.hooks.killEnemy(e, true, { weapon: 'Granada Tipo 24' });
        addScore(40);
      }
    }
  }
  for (const sc of S.sandbagClusters) {
    if (!sc.broken && Math.hypot(sc.x - p.x, sc.z - p.z) < 4.5) damageSandbagCluster(sc, 70, p);
  }
  for (const b of S.explosiveBarrels) {
    if (!b.exploded && Math.hypot(b.x - p.x, b.z - p.z) < 5.5) detonateBarrel(b);
  }
  if (S.tankette && !S.tankette.userData.dead) {
    const dt = S.tankette.position.distanceTo(p);
    if (dt < 7.5 && S.hooks.damageTankette) {
      S.hooks.damageTankette(165, true, S.tankette.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 'Granada Tipo 24', 'blast', 'tracks');
    }
  }
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function throwMolotov() {
  if (!S.alive || S.paused || S.cinematic) return;
  if (S.molotovs <= 0) { if (S.hooks.showMsg) S.hooks.showMsg('SIN MOLOTOV · COMPRA O RECOGE SUMINISTROS', 1.1); playDryFire(); return; }
  S.molotovs--;
  const m = new THREE.Mesh(MOLO_BOTTLE_GEO, mat(0x3a6432, 0.25, 0.1));
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(S.camera.quaternion);
  m.position.copy(S.player.pos).addScaledVector(dir, 0.7);
  S.scene.add(m);
  const vel = dir.multiplyScalar(16).add(new THREE.Vector3(0, 4.6, 0));
  S.molotovsList.push({ mesh: m, vel, life: 2.8 });
  tone(380, 0.08, 0.12, 'sine', 610);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

function spawnMolotovZone(p) {
  playMolotovShatter(p);
  const pl = new THREE.PointLight(0xff6b22, 24, 14, 2);
  pl.position.set(p.x, DECK_TOP + 1.2, p.z);
  S.scene.add(pl);
  S.molotovZones.push({ x: p.x, y: DECK_TOP, z: p.z, radius: 4.0, life: 6.5, tickT: 0.1, light: pl });
  for (let i = 0; i < 10; i++) {
    spawnFireParticle(new THREE.Vector3(p.x + (Math.random() - 0.5) * 3.0, DECK_TOP + 0.2, p.z + (Math.random() - 0.5) * 3.0), 0xff6e1a, 2.8, 1.3);
  }
}

export function useBandage() {
  if (!S.alive || S.paused || S.cinematic) return;
  if (S.bandages <= 0) { if (S.hooks.showMsg) S.hooks.showMsg('SIN VENDAJES · COMPRA O RECOGE SUMINISTROS', 1.1); return; }
  if (S.player.hp >= 99) { if (S.hooks.showMsg) S.hooks.showMsg('SALUD AL MÁXIMO', 0.9); return; }
  S.bandages--;
  S.player.hp = Math.min(100, S.player.hp + 38);
  playBandageSound();
  if (S.hooks.showMsg) S.hooks.showMsg('VENDAJE APLICADO (+38 SALUD)', 1.2);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function callAlliedMortar() {
  if (!S.alive || S.paused || S.cinematic) return;
  if (S.mortarStrikes <= 0) { if (S.hooks.showMsg) S.hooks.showMsg('SIN APOYO DE MORTERO DISPONIBLE', 1.1); playDryFire(); return; }
  S.mortarStrikes--;
  // Compute aimed point on bridge deck
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(S.camera.quaternion);
  let tx = -18, tz = 0;
  if (dir.y < -0.05) {
    const tHit = (DECK_TOP - S.camera.position.y) / dir.y;
    if (tHit > 1 && tHit < 120) {
      tx = Math.max(-55, Math.min(40, S.camera.position.x + dir.x * tHit));
      tz = Math.max(-15, Math.min(4.2, S.camera.position.z + dir.z * tHit));
    }
  } else {
    tx = Math.max(-55, Math.min(35, S.player.pos.x + dir.x * 26));
    tz = Math.max(-14, Math.min(3.5, S.player.pos.z + dir.z * 26));
  }
  if (S.hooks.showRadio) S.hooks.showRadio('BATERÍA DE MORTEROS · WANPING', '¡Coordenadas recibidas! Tres proyectiles en camino sobre el puente.', 4.5);
  playMortarWhistle(new THREE.Vector3(tx, DECK_TOP + 6, tz));

  [0.7, 1.35, 2.0].forEach((delay, idx) => {
    const ox = tx + (idx - 1) * 5.2 + (Math.random() - 0.5) * 2.5;
    const oz = Math.max(-14.5, Math.min(3.8, tz + (Math.random() - 0.5) * 3.0));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.45, 20),
      new THREE.MeshBasicMaterial({ color: 0x55d8ff, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ox, DECK_TOP + 0.05, oz);
    S.scene.add(ring);
    S.alliedMortars.push({ x: ox, z: oz, timer: delay, ring });
  });
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function toggleMountMG() {
  if (S.mgMounted) {
    S.mgMounted = false;
    S.vmRes.vm.visible = !S.cinematic && !S.thirdPerson;
    S.playerAvatar.visible = !S.cinematic && S.thirdPerson && S.alive;
    if ($('mgHeatWrap')) $('mgHeatWrap').classList.add('hidden');
    S.player.pos.set(25.8, DECK_TOP + S.eyeHeight, -1.5);
    S.player.feetY = DECK_TOP; S.player.velY = 0; S.player.onGround = true;
    S.playerAvatar.position.set(S.player.pos.x, S.player.feetY, S.player.pos.z);
    S.playerAvatar.rotation.y = S.yaw + Math.PI;
    S.camera.position.copy(S.player.pos);
    if (S.hooks.updateHUD) S.hooks.updateHUD();
    if (S.hooks.showMsg) S.hooks.showMsg('AMETRALLADORA SOLTADA', 1.0);
    return;
  }
  if (Math.hypot(S.player.pos.x - 24.5, S.player.pos.z + 2.0) < 3.2 && S.player.feetY < 8.5) {
    S.mgMounted = true; S.aiming = false; S.crouching = false; S.reloadTimer = 0;
    S.player.feetY = DECK_TOP; S.player.velY = 0; S.player.onGround = true;
    if ($('crouchTag')) $('crouchTag').textContent = '';
    S.vmRes.vm.visible = false;
    S.playerAvatar.visible = false;
    if ($('mgHeatWrap')) $('mgHeatWrap').classList.remove('hidden');
    S.player.pos.set(25.35, DECK_TOP + 1.48, -2.0);
    S.camera.position.copy(S.player.pos);
    S.yaw = S.targetYaw = Math.max(Math.PI / 2 - 0.85, Math.min(Math.PI / 2 + 0.85, S.yaw));
    S.pitch = S.targetPitch = Math.max(-0.35, Math.min(0.35, S.pitch));
    if (S.hooks.updateHUD) S.hooks.updateHUD();
    if (S.hooks.showMsg) S.hooks.showMsg('二四式重机枪 · AMETRALLADORA TIPO 24 LISTA', 1.4);
  }
}

export function muzzlePos() {
  if (S.thirdPerson && !S.mgMounted && S.avatarFlash && S.playerAvatar.visible) {
    S.avatarFlash.updateWorldMatrix(true, false);
    return S.avatarFlash.getWorldPosition(new THREE.Vector3());
  }
  const f = S.vmRes.flashes[S.current];
  if (f && S.vmRes.vm.visible) {
    f.updateWorldMatrix(true, false);
    return f.getWorldPosition(new THREE.Vector3());
  }
  const camRight = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
  return S.player.pos.clone().addScaledVector(camRight, 0.22).add(new THREE.Vector3(0, -0.1, 0));
}

export function setupPlayerShotRay(spread, isMelee) {
  if (!S.thirdPerson || S.mgMounted) {
    S.raycaster.setFromCamera(new THREE.Vector2((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread), S.camera);
    S.raycaster.far = isMelee ? 3.4 : 200;
    return;
  }
  const camDir = new THREE.Vector3();
  S.camera.getWorldDirection(camDir);
  const planeDist = Math.max(0.2, new THREE.Vector3().subVectors(S.player.pos, S.camera.position).dot(camDir) - 0.15);
  const aimOrigin = S.camera.position.clone().addScaledVector(camDir, planeDist);
  S.raycaster.set(aimOrigin, camDir);
  S.raycaster.far = isMelee ? 4.4 : 200;
  const aimTargets = [...S.enemyHitboxes, ...S.worldColliders, ...S.shootableLanterns];
  const aimHits = S.raycaster.intersectObjects(aimTargets, false).filter(h => h.object.visible !== false);
  const aimPoint = aimHits.length ? aimHits[0].point : aimOrigin.clone().addScaledVector(camDir, isMelee ? 3.4 : 140);

  const camRight = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
  const shotOrigin = S.player.pos.clone().addScaledVector(camRight, 0.22);
  shotOrigin.y -= 0.08;
  const shotDir = new THREE.Vector3().subVectors(aimPoint, shotOrigin);
  if (shotDir.lengthSq() < 1e-4) shotDir.copy(camDir);
  shotDir.normalize();
  if (spread > 0) {
    const rx = (Math.random() - 0.5) * spread;
    const ry = (Math.random() - 0.5) * spread;
    const upAxis = new THREE.Vector3().crossVectors(camRight, shotDir).normalize();
    shotDir.addScaledVector(camRight, rx).addScaledVector(upAxis, ry).normalize();
  }
  S.raycaster.set(shotOrigin, shotDir);
  S.raycaster.far = isMelee ? 3.6 : 200;
}

export function resolveBulletHit(baseDmg, startPos, isMelee = false, weaponName = null) {
  const wLabel = weaponName || (WEAPONS[S.current] ? WEAPONS[S.current].short : 'Fusil');
  const hits = S.raycaster.intersectObjects(S.enemyHitboxes, false);
  const rawObs = S.raycaster.intersectObjects(S.worldColliders, false).filter(h => h.object.visible !== false);
  const obsHits = S.mgMounted ? rawObs.filter(h => !h.object.userData.isMgShield) : rawObs;
  const lanHits = isMelee ? [] : S.raycaster.intersectObjects(S.shootableLanterns, false);
  const obsDist = obsHits.length ? obsHits[0].distance : Infinity;
  const lanDist = (lanHits.length && lanHits[0].object.visible) ? lanHits[0].distance : Infinity;

  let end;
  if (lanDist < obsDist && (!hits.length || lanDist < hits[0].distance)) {
    const item = lanHits[0].object.userData.lantern;
    end = lanHits[0].point;
    if (item && item.intact) {
      item.intact = false; item.mesh.visible = false;
      if (item.light) item.light.intensity = 0;
      spawnPooledImpact(end, 0xffd27a, 6);
      playShatter(end);
      addScore(25);
    }
  } else if (hits.length && hits[0].distance < obsDist) {
    const h = hits[0]; end = h.point;
    const part = h.object.userData.tankPart;
    if (part && S.hooks.damageTankette) {
      S.stats.hits++;
      const isVisor = (part === 'visor');
      const scaled = isVisor ? baseDmg : (part === 'hull' ? Math.max(6, Math.round(baseDmg * 0.25)) : Math.round(baseDmg * 0.72));
      S.hooks.damageTankette(scaled, isVisor, end, wLabel, null, part);
      spawnPooledImpact(end, isVisor ? 0xffaa44 : 0xaab2ba, 5);
    } else {
      const e = h.object.userData.enemy;
      if (e && !e.userData.dead) {
        const headshot = (h.object === e.userData.head);
        const dmg = headshot ? baseDmg * 2 : baseDmg;
        e.userData.hp -= dmg;
        e.userData.hitT = 0.3;
        e.userData.suppressT = Math.max(e.userData.suppressT || 0, 0.8);
        S.stats.hits++;
        if (headshot) { S.stats.headshots++; addScore(50); }
        if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(headshot);
        playHit(headshot);
        spawnPooledImpact(h.point, 0xb82b22, 4);
        if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(h.point, dmg, headshot ? 'crit' : 'normal');
        if (e.userData.hp <= 0 && S.hooks.killEnemy) {
          S.hooks.killEnemy(e, false, { weapon: wLabel, headshot, impactPoint: h.point });
        }
      }
    }
  } else if (obsDist < S.raycaster.far) {
    const oh = obsHits[0];
    end = oh.point;
    if (oh.object.userData.explosiveBarrel) {
      detonateBarrel(oh.object.userData.explosiveBarrel);
    } else if (oh.object.userData.sandbagCluster) {
      damageSandbagCluster(oh.object.userData.sandbagCluster, isMelee ? 40 : Math.round(baseDmg * 0.55), end);
    } else {
      spawnPooledImpact(end, 0xc8b896, 3);
    }
  } else {
    end = S.raycaster.ray.origin.clone().addScaledVector(S.raycaster.ray.direction, isMelee ? 3 : 140);
  }
  if (!isMelee) spawnPooledTracer(startPos, end);
}

export function fireMG() {
  if (S.mgTimer > 0 || S.mgOverheated) return;
  S.mgTimer = 0.11;
  S.mgHeat = Math.min(1.0, S.mgHeat + 0.075);
  S.crosshairBloom = Math.min(1.4, S.crosshairBloom + 0.24);
  S.bloomHoldTimer = 0.14;
  if (S.mgHeat >= 1.0) { S.mgOverheated = true; if (S.hooks.showMsg) S.hooks.showMsg('¡CAÑÓN SOBRECALENTADO!', 1.4); }
  S.recoil = 0.55;
  noiseBurst(0.08, 0.34, 1950);
  if (S.mgFlash) { S.mgFlash.visible = true; S.flashTimer = 0.05; S.mgFlash.updateWorldMatrix(true, false); }
  spawnPooledCasing();
  S.stats.shots++;
  S.raycaster.setFromCamera(new THREE.Vector2((Math.random() - 0.5) * 0.028, (Math.random() - 0.5) * 0.028), S.camera);
  S.raycaster.far = 200;
  resolveBulletHit(36, S.mgFlash ? S.mgFlash.getWorldPosition(new THREE.Vector3()) : muzzlePos(), false, 'Tipo 24 MG');
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function shoot() {
  const w = WEAPONS[S.current];
  if (S.reloadTimer > 0 || S.fireTimer > 0 || S.mgMounted) return;
  if (!w.melee && w.ammo <= 0) {
    if (S.dryFireCd <= 0) {
      playDryFire();
      S.dryFireCd = 0.35;
      if (w.reserve <= 0 && S.hooks.showMsg) S.hooks.showMsg('SIN MUNICIÓN · RECOGE SUMINISTROS [E]', 1.1);
    }
    if (w.reserve > 0) startReload();
    else S.fireTimer = 0.25;
    return;
  }
  S.fireTimer = w.rate;
  if (!w.melee) {
    w.ammo--; S.stats.shots++; S.recoil = 1; spawnPooledCasing();
    const bloomStep = (S.current === 'rifle' ? 0.32 : (S.current === 'mp18' ? 0.22 : 0.40));
    S.crosshairBloom = Math.min(1.4, S.crosshairBloom + bloomStep);
    S.bloomHoldTimer = 0.14;
    const kick = (S.current === 'rifle' ? (S.aiming ? 0.0052 : 0.008) : (S.current === 'mp18' ? 0.004 : 0.012));
    S.recoilPitch = Math.min(0.085, S.recoilPitch + kick);
  } else {
    S.meleeSwing = 1.0;
    S.parryTimer = Math.max(S.parryTimer, 0.22);
  }
  if (w.melee) noiseBurst(0.09, 0.18, 900);
  else {
    noiseBurst(0.10, S.current === 'mp18' ? 0.25 : 0.34, S.current === 'mp18' ? 2250 : 1950);
    if (S.current === 'rifle' || S.current === 'mp18') tone(S.current === 'mp18' ? 175 : 145, 0.05, 0.11, 'sawtooth', 62);
  }
  if (S.thirdPerson && S.playerAvatar.visible && !w.melee) {
    S.avatarFlash.visible = true; S.flashTimer = 0.048;
  } else {
    const f = S.vmRes.flashes[S.current];
    if (f) { f.visible = true; S.flashTimer = 0.048; }
  }
  const spreadScale = (S.aiming ? 0.28 : 1.0) * (S.crouching ? 0.72 : 1.0) * (S.player.onGround ? 1.0 : 1.8) * (0.45 + S.crosshairBloom * 1.15);
  const dmg = (S.current === 'mp18') ? Math.round(w.dmg * (1 + 0.15 * (S.mp18Tier - 1))) : w.dmg;
  setupPlayerShotRay(w.spread * spreadScale, w.melee);
  resolveBulletHit(dmg, muzzlePos(), w.melee, w.short);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function tryUseSupply() {
  const d = Math.hypot(S.player.pos.x - 32, S.player.pos.z - 3.2);
  if (d >= 3.4 || S.supplyCooldown > 0 || S.player.feetY > 8.5) {
    if (S.hooks.tryCollectNearbyLoot) S.hooks.tryCollectNearbyLoot();
    return;
  }
  const diff = DIFFS[S.diffKey] || DIFFS.normal;
  S.player.hp = Math.min(100, S.player.hp + 35);
  S.player.armor = Math.min(50, S.player.armor + 25);
  WEAPONS.rifle.reserve  = Math.min(180, WEAPONS.rifle.reserve + 60);
  WEAPONS.pistol.reserve = Math.min(70, WEAPONS.pistol.reserve + 20);
  WEAPONS.mp18.reserve   = Math.min(192, WEAPONS.mp18.reserve + 64);
  S.grenades = Math.min(4, S.grenades + 2);
  S.molotovs = Math.min(3, S.molotovs + 1);
  S.bandages = Math.min(4, S.bandages + 1);
  S.supplyCooldown = diff.supplyCd;
  if (S.hooks.grantSupplyCrateLoot) S.hooks.grantSupplyCrateLoot();
  playSupply();
  if (S.hooks.showMsg) S.hooks.showMsg('SUMINISTROS, BLINDAJE, VENDAJE, RACIÓN Y MUNICIÓN', 1.6);
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function updateWeapons(dt) {
  if (S.parryTimer > 0) S.parryTimer = Math.max(0, S.parryTimer - dt);

  // Hand grenades
  for (let i = S.grenadesList.length - 1; i >= 0; i--) {
    const g = S.grenadesList[i];
    g.life -= dt;
    g.vel.y -= 18.0 * dt;
    g.mesh.position.addScaledVector(g.vel, dt);
    g.mesh.rotation.x += dt * 9;
    g.mesh.rotation.z += dt * 7;
    if (g.mesh.position.y <= DECK_TOP + 0.12 && g.vel.y < 0) {
      g.mesh.position.y = DECK_TOP + 0.12;
      g.vel.y = -g.vel.y * 0.36;
      g.vel.x *= 0.72; g.vel.z *= 0.72;
      tone(260, 0.03, 0.04, 'triangle');
    }
    if (g.life <= 0) {
      const pos = g.mesh.position.clone();
      S.scene.remove(g.mesh);
      S.grenadesList.splice(i, 1);
      detonateGrenade(pos);
    }
  }

  // Thrown Molotovs
  for (let i = S.molotovsList.length - 1; i >= 0; i--) {
    const m = S.molotovsList[i];
    m.life -= dt;
    m.vel.y -= 17.5 * dt;
    m.mesh.position.addScaledVector(m.vel, dt);
    m.mesh.rotation.x += dt * 11;
    m.mesh.rotation.z += dt * 8;
    if (m.mesh.position.y <= DECK_TOP + 0.15 || m.life <= 0) {
      const pos = m.mesh.position.clone();
      pos.y = DECK_TOP;
      S.scene.remove(m.mesh);
      S.molotovsList.splice(i, 1);
      spawnMolotovZone(pos);
    }
  }

  // Burning Molotov fire zones
  for (let i = S.molotovZones.length - 1; i >= 0; i--) {
    const z = S.molotovZones[i];
    z.life -= dt;
    z.tickT -= dt;
    if (Math.random() < dt * 14) {
      spawnFireParticle(new THREE.Vector3(z.x + (Math.random() - 0.5) * 3.4, DECK_TOP + 0.25, z.z + (Math.random() - 0.5) * 3.4), 0xff6b1c, 2.4, 1.15);
    }
    z.light.intensity = Math.max(0, Math.min(1, z.life / 1.2) * (18 + Math.sin(z.life * 22) * 5));
    if (z.tickT <= 0 && S.alive) {
      z.tickT = 0.45;
      for (const e of S.enemies) {
        if (e.userData.dead) continue;
        if (Math.hypot(e.position.x - z.x, e.position.z - z.z) < z.radius) {
          e.userData.hp -= 24;
          e.userData.hitT = 0.2;
          if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 24, 'fire');
          if (e.userData.hp <= 0 && S.hooks.killEnemy) S.hooks.killEnemy(e, true, { weapon: 'Cóctel Molotov' });
        }
      }
      if (S.tankette && !S.tankette.userData.dead && Math.hypot(S.tankette.position.x - z.x, S.tankette.position.z - z.z) < z.radius + 1.5) {
        S.hooks.damageTankette(28, false, S.tankette.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 'Molotov', 'fire', 'tracks');
      }
    }
    if (z.life <= 0) {
      S.scene.remove(z.light);
      S.molotovZones.splice(i, 1);
    }
  }

  // Allied mortar shells incoming
  for (let i = S.alliedMortars.length - 1; i >= 0; i--) {
    const am = S.alliedMortars[i];
    am.timer -= dt;
    am.ring.scale.setScalar(1 + Math.sin(am.timer * 14) * 0.14);
    if (am.timer <= 0) {
      S.scene.remove(am.ring);
      am.ring.geometry.dispose(); am.ring.material.dispose();
      const p = new THREE.Vector3(am.x, DECK_TOP, am.z);
      spawnArtilleryBlast(am.x, DECK_TOP, am.z);
      for (const e of S.enemies) {
        if (e.userData.dead) continue;
        const d = e.position.distanceTo(p);
        if (d < 7.2) {
          const dmg = Math.round(180 * (1 - d / 8.0));
          e.userData.hp -= dmg;
          if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(e.position.clone().add(new THREE.Vector3(0, 1.8, 0)), dmg, 'blast');
          if (e.userData.hp <= 0 && S.hooks.killEnemy) S.hooks.killEnemy(e, true, { weapon: 'Mortero Aliado' });
        }
      }
      if (S.tankette && !S.tankette.userData.dead && S.tankette.position.distanceTo(p) < 8.0) {
        S.hooks.damageTankette(150, true, S.tankette.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 'Mortero Aliado', 'blast', 'turret');
      }
      S.alliedMortars.splice(i, 1);
    }
  }
}
