import * as THREE from 'three';
import { GLTFLoader } from '../loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../libs/meshopt_decoder.module.js';
import {
  CHAPTER_TITLES, CINE_SCRIPTS, DECK_TOP, DIFFS, MID_WAVE_RADIOS,
  MODEL_URLS, SQUAD_ORDERS, WAVE_BANNERS, WAVE_RADIOS, WAVES, WEAPONS
} from './config.js';
import { $, S, addScore, loadRecords, saveRecords, unlockMedal } from './state.js';
import { clearPools, updatePools } from './pools.js';
import {
  activateTheater, applyWorldModels, damageSandbagCluster, getFloorY, initWorld,
  resetWorldProps, resolvePlayerCollision, setChapterAtmosphere, updateWorld
} from './world.js';
import {
  initAudio, noiseBurst, playWaveHorn, syncAmbientVolume,
  toggleMute, tone, updateAudioListener, updateMusic
} from './audio.js';
import { applySquadModels, resetSquadPositions, setDefenderPos, setSquadAnchors, setSquadOrder, updateSquad } from './squad.js';
import {
  applyPlayerDamage, applyWeaponModels, buildPlayerAvatar, buildViewModels, callAlliedMortar, detonateBarrel,
  fireMG, shoot, spawnArtilleryBlast, startReload, switchWeapon, throwGrenade,
  throwMolotov, toggleMountMG, triggerParryOrHeavy, tryUseSupply, updateWeapons, useBandage
} from './weapons.js';
import {
  damageTankette, killEnemy, makeEnemy, spawnEnemy, spawnTankette, updateEnemies
} from './enemies.js';
import {
  addKillfeedEntry, clearDamageNumbers, clearKillfeed, closeShop, closeTacticalBriefing,
  drawRadar, flashDamage, flashHitmarker, getCrosshairState, initTouchControls, isTouchActive,
  openShop, registerPlayerKill, renderAllMedals, renderStats, renderTacticalMap,
  showDirDamage, showMedalToast, showMsg, showRadio, showTacticalBriefing, showWaveBanner,
  spawnDamageNumber, syncTouchControlsVisibility, toggleSquadWheel, updateCrosshair,
  updateDamageNumbers, updateHUD, updateKillfeedAndStreak, updateLockHint, updateRecordBanner
} from './hud.js';
import {
  clearLootDrops, closeInventory, dropTanketteLoot, getInventoryUsedSlots,
  getNearestLootDrop, grantSupplyCrateLoot, initInventoryUI, maybeDropEnemyLoot,
  openInventory, resetInventory, spawnLootDrop, syncInventoryBadge, toggleInventory,
  tryCollectNearbyLoot, updateLootDrops, useInventoryItem
} from './inventory.js';
import {
  clearStorySetPieces, damageStoryTarget, getStoryInteractPrompt, renderObjectiveHud,
  showStorySubtitle, startStoryMission, tryStoryInteract, updateObjectiveMarker, updateStory
} from './story.js';

// ---------- boot world & systems ----------
initWorld();
buildViewModels();
buildPlayerAvatar();
initTouchControls();
initInventoryUI();

// Register cross-module hooks (eliminates circular imports)
Object.assign(S.hooks, {
  spawnArtilleryBlast,
  setChapterAtmosphere,
  killEnemy,
  damageTankette,
  spawnEnemy,
  spawnTankette,
  activateTheater,
  setSquadAnchors,
  startWave,
  victory,
  showTacticalBriefing,
  damageStoryTarget,
  tryStoryInteract,
  showMsg,
  showRadio,
  showWaveBanner,
  flashHitmarker,
  flashDamage,
  showDirDamage,
  spawnDamageNumber,
  addKillfeedEntry,
  registerPlayerKill,
  updateHUD,
  updateRecordBanner,
  renderAllMedals,
  showMedalToast,
  toggleSquadWheel,
  switchWeapon,
  openInventory,
  closeInventory,
  toggleInventory,
  isTouchActive,
  syncTouchControlsVisibility,
  updateLockHint,
  maybeDropEnemyLoot,
  dropTanketteLoot,
  grantSupplyCrateLoot,
  tryCollectNearbyLoot,
  lockPointer,
  triggerJump,
  startReload,
  throwGrenade,
  throwMolotov,
  useBandage,
  callAlliedMortar,
  toggleMountMG,
  toggleCameraMode,
  tryUseSupply,
  shoot,
  die
});

// ---------- lock / camera / jump / graphics ----------
export function lockPointer() {
  if (isTouchActive()) return;
  const el = S.renderer.domElement;
  if (!el || document.pointerLockElement === el) return;
  try {
    const res = el.requestPointerLock({ unadjustedMovement: true });
    if (res && typeof res.catch === 'function') {
      res.catch(() => {
        try {
          const p2 = el.requestPointerLock();
          if (p2 && p2.catch) p2.catch(() => {});
        } catch {}
      });
    }
  } catch {
    try {
      const p2 = el.requestPointerLock();
      if (p2 && p2.catch) p2.catch(() => {});
    } catch {}
  }
}

function toggleCameraMode() {
  if (!S.alive || S.paused || S.cinematic || S.mgMounted || S.shopOpen || S.tacticalBrief || S.inventoryOpen) return;
  S.thirdPerson = !S.thirdPerson;
  S.playerAvatar.position.set(S.player.pos.x, S.player.feetY, S.player.pos.z);
  S.playerAvatar.rotation.y = S.yaw + Math.PI;
  if ($('camTag')) $('camTag').textContent = S.thirdPerson ? '[3.ª PERSONA · V]' : '[1.ª PERSONA · V]';
  showMsg(S.thirdPerson ? 'CÁMARA 3.ª PERSONA (HOMBRO)' : 'CÁMARA 1.ª PERSONA', 1.1);
}

function triggerJump() {
  if (!S.alive || S.paused || S.cinematic || S.mgMounted || S.shopOpen || S.tacticalBrief || S.inventoryOpen) return;
  if (S.player.onGround) {
    if (S.crouching) {
      S.crouching = false;
      if ($('crouchTag')) $('crouchTag').textContent = '';
    }
    S.player.velY = 7.6;
    S.player.onGround = false;
    S.jumpBuffer = 0;
    tone(185, 0.06, 0.08, 'sine', 260);
  } else {
    S.jumpBuffer = 0.12;
  }
}

function applyPixelSize() {
  const baseCap = S.gfxLevel === 'low' ? 1.0 : (S.gfxLevel === 'high' ? 1.8 : 1.35);
  const pr = Math.max(0.65, Math.min(window.devicePixelRatio, baseCap) * S.drsScale);
  S.renderer.setPixelRatio(pr);
  S.renderer.setSize(window.innerWidth, window.innerHeight);
  if (S.postFX) S.postFX.resize(window.innerWidth, window.innerHeight, pr);
}

function applyGraphics(level) {
  S.gfxLevel = level;
  S.drsScale = 1.0;
  const setShadowSize = (sz) => {
    if (S.moonLight.shadow.mapSize.width !== sz) {
      S.moonLight.shadow.mapSize.set(sz, sz);
      if (S.moonLight.shadow.map) { S.moonLight.shadow.map.dispose(); S.moonLight.shadow.map = null; }
    }
  };
  const setLionLod = (dist) => {
    for (const l of S.lionGroups) {
      const lod = l.children[0];
      if (lod && lod.isLOD && lod.levels[1]) lod.levels[1].distance = dist;
    }
  };
  if (level === 'low') {
    S.renderer.shadowMap.enabled = false;
    S.moonLight.castShadow = false;
    setLionLod(10);
  } else if (level === 'high') {
    S.renderer.shadowMap.enabled = true;
    S.moonLight.castShadow = true;
    setShadowSize(1024);
    setLionLod(26);
  } else {
    S.renderer.shadowMap.enabled = true;
    S.moonLight.castShadow = true;
    setShadowSize(512);
    setLionLod(15);
  }
  applyPixelSize();
  if (S.postFX) S.postFX.setQuality(level);
  if (S.rainPoints) S.rainPoints.visible = (S.rainActive && S.gfxLevel !== 'low');
}

// ---------- input: keyboard, mouse, pointer lock & gamepad ----------
const gpPrev = {};

addEventListener('keydown', e => {
  S.keys[e.code] = true;
  if (S.cinematic) {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); endCinematic(); }
    return;
  }
  if (S.tacticalBrief) {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); closeTacticalBriefing(); }
    return;
  }
  if (S.inventoryOpen) {
    if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); if (!e.repeat) closeInventory(true); }
    return;
  }
  if (S.squadWheelOpen) {
    if (e.code === 'Digit1') { setSquadOrder('cover'); return; }
    if (e.code === 'Digit2') { setSquadOrder('advance'); return; }
    if (e.code === 'Digit3') { setSquadOrder('hold'); return; }
    if (e.code === 'Digit4') { setSquadOrder('focus'); return; }
    if (e.code === 'KeyT' || e.code === 'Escape') { e.preventDefault(); if (!e.repeat) toggleSquadWheel(false); return; }
  }
  if ((e.code === 'KeyI' || e.code === 'Tab') && S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.tacticalBrief) {
    e.preventDefault();
    if (!e.repeat) openInventory();
    return;
  }
  if (e.code === 'Escape' && S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.inventoryOpen && (performance.now() - (S.invClosedAt || 0)) > 120 && document.pointerLockElement !== S.renderer.domElement && !e.repeat) {
    pauseGame();
    return;
  }
  if (e.code === 'Space' && S.alive && !S.paused && !S.shopOpen) {
    e.preventDefault();
    if (!e.repeat) triggerJump();
    return;
  }
  if (e.code === 'KeyV' && !e.repeat) toggleCameraMode();
  if (e.code === 'KeyT' && !e.repeat) toggleSquadWheel();
  if (e.code === 'Digit1' && !S.mgMounted) switchWeapon('rifle');
  if (e.code === 'Digit2' && !S.mgMounted) switchWeapon('pistol');
  if (e.code === 'Digit3' && !S.mgMounted) switchWeapon('sword');
  if (e.code === 'Digit4' && !S.mgMounted) switchWeapon('mp18');
  if (e.code === 'KeyR' && !S.mgMounted) startReload();
  if (e.code === 'KeyQ' && S.alive && !S.paused && !S.mgMounted && !e.repeat) {
    if (S.current === 'sword') triggerParryOrHeavy();
    else if (!WEAPONS[S.current].melee && S.reloadTimer <= 0) S.aiming = !S.aiming;
  }
  if (e.code === 'KeyC' && S.alive && !S.paused && !S.mgMounted && !e.repeat) {
    S.crouching = !S.crouching;
    if ($('crouchTag')) $('crouchTag').textContent = S.crouching ? '[AGACHADO]' : '';
  }
  if (e.code === 'KeyM' && !e.repeat) toggleMute();
  if (e.code === 'KeyE' && S.alive && !S.paused && !e.repeat) tryUseSupply();
  if (e.code === 'KeyG' && S.alive && !S.paused && !e.repeat) throwGrenade();
  if (e.code === 'KeyX' && S.alive && !S.paused && !e.repeat) throwMolotov();
  if (e.code === 'KeyH' && S.alive && !S.paused && !e.repeat) useBandage();
  if ((e.code === 'KeyB' || e.code === 'Digit5') && S.alive && !S.paused && !e.repeat) callAlliedMortar();
  if (e.code === 'KeyF' && S.alive && !S.paused && !e.repeat) toggleMountMG();
});

addEventListener('keyup', e => { S.keys[e.code] = false; });
addEventListener('blur', () => {
  for (const k in S.keys) S.keys[k] = false;
  S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false; S.aiming = false;
});
addEventListener('contextmenu', e => e.preventDefault());

addEventListener('mousemove', e => {
  if (S.cinematic || !S.alive || S.paused || S.shopOpen || S.tacticalBrief || S.squadWheelOpen || S.inventoryOpen) return;
  if (document.pointerLockElement !== S.renderer.domElement) return;
  const rawX = e.movementX || 0;
  const rawY = e.movementY || 0;
  if ((performance.now() - S.plLockTime) < 180 && Math.hypot(rawX, rawY) > 45) return;
  if (Math.abs(rawX) > 520 || Math.abs(rawY) > 520) return;
  const dx = Math.max(-180, Math.min(180, rawX));
  const dy = Math.max(-180, Math.min(180, rawY));
  const sensMult = S.aiming ? 0.62 : 1.0;
  const step = 0.0019 * S.mouseSens * sensMult;
  S.targetYaw   -= dx * step;
  S.targetPitch -= dy * step;
  if (S.mgMounted) {
    S.targetYaw = Math.max(Math.PI / 2 - 0.85, Math.min(Math.PI / 2 + 0.85, S.targetYaw));
    S.targetPitch = Math.max(-0.35, Math.min(0.35, S.targetPitch));
  } else {
    S.targetPitch = Math.max(-1.35, Math.min(1.35, S.targetPitch));
  }
});

addEventListener('mousedown', e => {
  if (S.cinematic || !S.alive || S.paused || S.shopOpen || S.tacticalBrief || S.squadWheelOpen || S.inventoryOpen) return;
  if (isTouchActive()) return;
  if (document.pointerLockElement !== S.renderer.domElement) {
    if (e.target === S.renderer.domElement || e.target === document.body) lockPointer();
    return;
  }
  if (e.button === 0) { S.mouseDownLeft = true; if (!S.mgMounted) shoot(); }
  if (e.button === 2 && !S.mgMounted) {
    if (S.current === 'sword') triggerParryOrHeavy();
    else if (!WEAPONS[S.current].melee && S.reloadTimer <= 0) S.aiming = true;
  }
});

addEventListener('mouseup', e => {
  if (e.button === 0) S.mouseDownLeft = false;
  if (e.button === 2) S.aiming = false;
});

addEventListener('wheel', e => {
  if (!S.alive || S.paused || S.cinematic || S.mgMounted || S.inventoryOpen || document.pointerLockElement !== S.renderer.domElement) return;
  const order = S.mp18Owned ? ['rifle', 'pistol', 'sword', 'mp18'] : ['rifle', 'pistol', 'sword'];
  const step = e.deltaY > 0 ? 1 : (order.length - 1);
  const idx = (order.indexOf(S.current) + step) % order.length;
  switchWeapon(order[idx]);
});

document.addEventListener('pointerlockchange', () => {
  const locked = (document.pointerLockElement === S.renderer.domElement);
  S.mouseDownLeft = false;
  if (locked) {
    S.hadPointerLock = true;
    S.plLockTime = performance.now();
  } else {
    if (S.hadPointerLock && S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.tacticalBrief && !S.squadWheelOpen && !S.inventoryOpen && !isTouchActive()) pauseGame();
    S.hadPointerLock = false;
  }
  updateLockHint();
});

document.addEventListener('pointerlockerror', () => {
  S.hadPointerLock = false;
  updateLockHint();
});

addEventListener('resize', () => {
  S.camera.aspect = window.innerWidth / window.innerHeight;
  S.camera.updateProjectionMatrix();
  applyPixelSize();
  syncTouchControlsVisibility();
});

function pollGamepad(dt) {
  if (!navigator.getGamepads) { S.gpFiring = false; return; }
  const pads = navigator.getGamepads();
  const gp = pads && pads[0];
  if (!gp) { S.gpFiring = false; return; }
  const edge = (idx) => {
    const down = !!(gp.buttons[idx] && gp.buttons[idx].pressed);
    const hit = down && !gpPrev[idx];
    gpPrev[idx] = down;
    return hit;
  };
  if (S.cinematic) { S.gpFiring = false; if (edge(0) || edge(9)) endCinematic(); return; }
  if (edge(8)) { S.gpFiring = false; if (S.alive && !S.paused && !S.shopOpen && !S.tacticalBrief) toggleInventory(); return; }
  if (edge(9)) { S.gpFiring = false; if (S.inventoryOpen) closeInventory(true); else if (S.paused) resumeGame(); else if (S.alive) pauseGame(); return; }
  if (!S.alive || S.paused || S.shopOpen || S.tacticalBrief || S.inventoryOpen) { S.gpFiring = false; return; }

  const dz = v => Math.abs(v) < 0.16 ? 0 : v;
  const lx = dz(gp.axes[0] || 0), ly = dz(gp.axes[1] || 0);
  const rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
  if (rx || ry) {
    const sm = S.aiming ? 0.62 : 1.0;
    S.targetYaw   -= rx * 2.2 * S.mouseSens * sm * dt;
    S.targetPitch -= ry * 1.7 * S.mouseSens * sm * dt;
    if (S.mgMounted) {
      S.targetYaw = Math.max(Math.PI / 2 - 0.85, Math.min(Math.PI / 2 + 0.85, S.targetYaw));
      S.targetPitch = Math.max(-0.35, Math.min(0.35, S.targetPitch));
    } else {
      S.targetPitch = Math.max(-1.35, Math.min(1.35, S.targetPitch));
    }
  }
  if (!S.mgMounted && (lx || ly)) {
    const sp = S.crouching ? 4.2 : ((gp.buttons[10] && gp.buttons[10].pressed && !S.aiming) ? 11 : 6.6);
    _tmpFwd.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
    _tmpRight.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
    _tmpMove.set(0, 0, 0).addScaledVector(_tmpFwd, -ly).addScaledVector(_tmpRight, lx);
    if (_tmpMove.lengthSq() > 0) {
      _tmpMove.normalize().multiplyScalar(sp * dt);
      resolvePlayerCollision(S.player.pos.x + _tmpMove.x, S.player.pos.z + _tmpMove.z);
    }
  }
  const r2 = Boolean(gp.buttons[7] && gp.buttons[7].pressed);
  const l2 = Boolean(gp.buttons[6] && gp.buttons[6].pressed);
  S.gpFiring = r2;
  if (!S.mgMounted) {
    if (r2 && (WEAPONS[S.current].auto || !gpPrev.r2)) shoot();
    gpPrev.r2 = r2;
    if (l2 !== Boolean(gpPrev.l2)) {
      gpPrev.l2 = l2;
      if (S.current === 'sword' && l2) triggerParryOrHeavy();
      else S.aiming = Boolean(l2 && !WEAPONS[S.current].melee && S.reloadTimer <= 0);
    }
  } else {
    gpPrev.r2 = r2; gpPrev.l2 = l2;
  }
  if (edge(2)) {
    if (tryStoryInteract() || Math.hypot(S.player.pos.x - S.supplyCratePos.x, S.player.pos.z - S.supplyCratePos.z) < 3.4) tryUseSupply();
    else if (!S.mgMounted) startReload();
  }
  if (edge(1) && !S.mgMounted) { S.crouching = !S.crouching; if ($('crouchTag')) $('crouchTag').textContent = S.crouching ? '[AGACHADO]' : ''; }
  if (edge(3) && !S.mgMounted) {
    const order = S.mp18Owned ? ['rifle', 'pistol', 'sword', 'mp18'] : ['rifle', 'pistol', 'sword'];
    switchWeapon(order[(order.indexOf(S.current) + 1) % order.length]);
  }
  if (edge(5)) throwGrenade();
  if (edge(4)) toggleCameraMode();
  if (edge(0)) {
    if (S.mgMounted || Math.hypot(S.player.pos.x - S.mgPos.x, S.player.pos.z - S.mgPos.z) < 3.2) toggleMountMG();
    else triggerJump();
  }
  if (edge(12)) setSquadOrder('advance');
  if (edge(13)) setSquadOrder('hold');
  if (edge(14)) setSquadOrder('cover');
  if (edge(15)) setSquadOrder('focus');
}

// ---------- cinematics & chapter flow ----------
function startCinematic(type, onDone) {
  const scr = CINE_SCRIPTS[type];
  if (!scr) { if (onDone) onDone(); return; }
  S.cinematic = { type, t: 0, dur: scr.dur, shots: scr.shots, onDone, triggered: {} };
  S.aiming = false; S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false;
  S.vmRes.vm.visible = false;
  S.playerAvatar.visible = false;
  if ($('hud')) $('hud').style.display = 'none';
  if ($('cinema')) $('cinema').style.display = 'block';
  if (document.pointerLockElement) document.exitPointerLock();
  syncTouchControlsVisibility();
  updateLockHint();
}

function endCinematic() {
  if (!S.cinematic) return;
  const done = S.cinematic.onDone;
  S.cinematic = null;
  if ($('cinema')) $('cinema').style.display = 'none';
  S.vmRes.vm.visible = !S.thirdPerson && !S.mgMounted;
  S.playerAvatar.visible = S.alive && S.thirdPerson && !S.mgMounted;
  S.camera.fov = 74;
  S.camera.rotation.z = 0;
  S.camera.updateProjectionMatrix();
  if (S.alive && $('hud')) {
    $('hud').style.display = 'block';
    lockPointer();
  }
  syncTouchControlsVisibility();
  updateLockHint();
  if (done) done();
}

function updateCinematic(dt) {
  const cin = S.cinematic;
  if (!cin) return;
  cin.t += dt;
  const t = Math.min(cin.t, cin.dur);
  let active = cin.shots[cin.shots.length - 1];
  for (const s of cin.shots) { if (t >= s.t0 && t <= s.t1) { active = s; break; } }
  const u = Math.max(0, Math.min(1, (t - active.t0) / Math.max(0.01, active.t1 - active.t0)));
  const s = u * u * (3 - 2 * u);
  S.camera.position.set(
    active.fromPos[0] + (active.toPos[0] - active.fromPos[0]) * s,
    active.fromPos[1] + (active.toPos[1] - active.fromPos[1]) * s,
    active.fromPos[2] + (active.toPos[2] - active.fromPos[2]) * s
  );
  S.camera.lookAt(
    active.fromLook[0] + (active.toLook[0] - active.fromLook[0]) * s,
    active.fromLook[1] + (active.toLook[1] - active.fromLook[1]) * s,
    active.fromLook[2] + (active.toLook[2] - active.fromLook[2]) * s
  );
  if ($('cineTag')) $('cineTag').textContent = active.tag;
  if ($('cineZh'))  $('cineZh').textContent  = active.zh;
  if ($('cineSub')) $('cineSub').textContent = active.sub;
  if (active.events) {
    active.events.forEach((ev, idx) => {
      const key = active.t0 + '_' + idx;
      if (t >= ev.at && !cin.triggered[key]) { cin.triggered[key] = true; ev.fn(S); }
    });
  }
  if (cin.t >= cin.dur) endCinematic();
}

function clearActiveEntities() {
  if (S.tankette) {
    const tu = S.tankette.userData;
    [tu.hull, tu.visor, tu.trkL, tu.trkR, tu.turret].forEach(hb => {
      const i = S.enemyHitboxes.indexOf(hb); if (i >= 0) S.enemyHitboxes.splice(i, 1);
    });
    S.scene.remove(S.tankette);
    S.tankette = null;
  }
  if ($('bossBarWrap')) $('bossBarWrap').classList.add('hidden');
  S.grenadesList.forEach(g => S.scene.remove(g.mesh)); S.grenadesList.length = 0;
  S.molotovsList.forEach(m => S.scene.remove(m.mesh)); S.molotovsList.length = 0;
  S.molotovZones.forEach(z => S.scene.remove(z.light)); S.molotovZones.length = 0;
  S.alliedMortars.forEach(a => { S.scene.remove(a.ring); a.ring.geometry.dispose(); a.ring.material.dispose(); }); S.alliedMortars.length = 0;
  S.enemyGrenades.forEach(g => S.scene.remove(g.mesh)); S.enemyGrenades.length = 0;
  S.enemyMortars.forEach(m => { S.scene.remove(m.ring); m.ring.geometry.dispose(); m.ring.material.dispose(); }); S.enemyMortars.length = 0;
  S.flyingHelmets.forEach(h => S.scene.remove(h.mesh)); S.flyingHelmets.length = 0;
  if ($('grenadeWarn')) $('grenadeWarn').classList.remove('show');

  S.enemies.forEach(e => { if (e.userData.living) e.userData.living.dispose(); S.scene.remove(e); });
  S.enemies.length = 0; S.enemyHitboxes.length = 0;
  S.effects.forEach(f => { S.scene.remove(f.obj); if (!f.sharedGeo && f.obj.geometry) f.obj.geometry.dispose(); if (f.obj.material) f.obj.material.dispose(); });
  S.effects.length = 0;
  clearStorySetPieces();
  clearPools();
  clearLootDrops();
}

function startWave(n) {
  clearActiveEntities();
  const diff = DIFFS[S.diffKey] || DIFFS.normal;
  const ch = S.gameMode === 'survival' ? (n % 4) : Math.min(7, n);
  S.wave = n;
  S.waveInitialCount = (S.gameMode === 'survival') ? (5 + n * 2) : (ch < 4 ? (WAVES[ch] || 10) : 6);
  S.toSpawn = S.waveInitialCount;
  S.spawnTimer = 0.6;
  S.midWaveRadioSent = false;
  S.rainActive = (ch === 2 || ch === 6);
  if (S.rainPoints) S.rainPoints.visible = (S.rainActive && S.gfxLevel !== 'low');
  setChapterAtmosphere(ch);

  if ($('modeLabel')) $('modeLabel').textContent = (S.gameMode === 'survival') ? 'Oleada' : 'Capítulo';
  if ($('wave')) $('wave').textContent = (n + 1);
  if ($('waveTotal')) $('waveTotal').textContent = (S.gameMode === 'survival') ? '' : ' / 8';

  if (S.gameMode === 'survival') {
    if (S.currentTheater !== 'bridge') activateTheater('bridge');
    S.storyMission = null;
    if (ch === 2) {
      setDefenderPos(S.defenders[1], 14, -1.2);
      S.player.hp = Math.min(100, S.player.hp + 20);
    }
    if ($('chapterTitle')) $('chapterTitle').textContent = `SUPERVIVENCIA · Oleada ${n + 1} · ${diff.label}`;
    if (n > 0) {
      S.grenades = Math.min(4, S.grenades + 1);
      S.player.hp = Math.min(100, S.player.hp + 15);
      if (n + 1 >= 5) unlockMedal('survivor_w5');
    }
    showWaveBanner(`无尽抗战 · OLEADA ${n + 1}`, `RESISTENCIA SIN FIN · ${S.toSpawn} ATACANTES`);
    if (n === 0 || ch === 2) showRadio(WAVE_RADIOS[ch][0], WAVE_RADIOS[ch][1], 5.5);
    if ((n + 1) % 4 === 0) spawnTankette();
    renderObjectiveHud();
  } else {
    startStoryMission(ch);
    if (ch === 2) {
      setDefenderPos(S.defenders[1], 14, -1.2);
      S.player.hp = Math.min(100, S.player.hp + 20);
    }
    if ($('chapterTitle')) $('chapterTitle').textContent = CHAPTER_TITLES[ch] || CHAPTER_TITLES[0];
    showWaveBanner(WAVE_BANNERS[ch][0], WAVE_BANNERS[ch][1]);
    showRadio(WAVE_RADIOS[ch][0], WAVE_RADIOS[ch][1], 6.0);
    if (n === 3) spawnTankette();
  }
  playWaveHorn();
  updateHUD();
}

function recordProgress(isVictory, bannerId) {
  let isNew = false;
  if (!S.matchRecorded) {
    S.matchRecorded = true;
    if (S.gameMode === 'campaign') {
      if (S.stats.score > (S.records.bestCampaign || 0)) { S.records.bestCampaign = S.stats.score; isNew = true; }
    } else {
      if (S.stats.score > (S.records.bestSurvival || 0)) { S.records.bestSurvival = S.stats.score; isNew = true; }
      if ((S.wave + 1) > (S.records.bestWave || 0)) { S.records.bestWave = S.wave + 1; isNew = true; }
    }
    S.records.totalKills = (S.records.totalKills || 0) + S.stats.kills;
    saveRecords();
  }
  renderAllMedals();
  const el = $(bannerId);
  if (el) {
    const diff = DIFFS[S.diffKey] || DIFFS.normal;
    if (isNew && S.stats.score > 0) {
      el.textContent = `★ NUEVO RÉCORD PERSONAL (${diff.label}) · ${S.stats.score} PTS`;
      el.classList.remove('hidden');
    } else if (isVictory) {
      el.textContent = `CAMPAÑA COMPLETADA EN ${diff.label.toUpperCase()} · ${S.stats.score} PTS`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }
}

function cleanupTransientCombat() {
  clearActiveEntities();
  closeInventory(false);
  clearKillfeed();
  clearDamageNumbers();
}

export function beginGame(skipCine = false) {
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  S.cinematic = null; S.tacticalBrief = null; S.shopOpen = false; S.squadWheelOpen = false; S.inventoryOpen = false;
  if ($('cinema')) $('cinema').style.display = 'none';
  if ($('tacticalMapOverlay')) $('tacticalMapOverlay').classList.add('hidden');
  if ($('shopModal')) $('shopModal').classList.add('hidden');
  if ($('squadWheel')) $('squadWheel').classList.remove('open');

  S.mgMounted = false; S.mgHeat = 0; S.mgOverheated = false; S.mgTimer = 0;
  S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false;
  if ($('mgHeatWrap')) $('mgHeatWrap').classList.add('hidden');
  S.vmRes.vm.visible = !S.thirdPerson;
  S.playerAvatar.visible = false;
  S.avatarFlash.visible = false;

  S.rainActive = false; if (S.rainPoints) S.rainPoints.visible = false;
  S.flareLife = 0; S.flareTimer = 5; S.lightningTimer = 7;
  if (S.flareObj) S.flareObj.visible = false;
  if (S.flareLight) S.flareLight.intensity = 0;
  for (const l of S.lanterns) {
    l.intact = true;
    if (l.mesh) l.mesh.visible = true;
    if (l.light) l.light.intensity = l.baseInt;
  }

  cleanupTransientCombat();
  resetWorldProps();
  setChapterAtmosphere(0);
  resetSquadPositions();
  setSquadOrder('cover');

  S.crosshairBloom = 0; S.bloomHoldTimer = 0; S.dryFireCd = 0; S.recoilPitch = 0; S.avatarHitT = 0;
  S.jumpBuffer = 0; S.parryTimer = 0; S.streakCount = 0; S.streakTimer = 0;
  S.crouching = false; S.aiming = false; S.eyeHeight = 1.7;
  if ($('crouchTag')) $('crouchTag').textContent = '';
  if ($('dirDmg')) $('dirDmg').style.opacity = '0';
  if ($('camTag')) $('camTag').textContent = S.thirdPerson ? '[3.ª PERSONA · V]' : '[1.ª PERSONA · V]';

  S.supplyCooldown = 0; S.cameraShake = 0; S.artilleryTimer = 8;
  S.grenades = 3; S.molotovs = 1; S.bandages = 2; S.mortarStrikes = 1;
  resetInventory();
  S.mp18Owned = (S.gameMode === 'campaign'); S.mp18Tier = 1;
  S.stats = { shots: 0, hits: 0, headshots: 0, kills: 0, score: 0, startTime: performance.now() };
  S.matchRecorded = false;

  S.player.pos.set(34, DECK_TOP + 1.7, 0); S.player.feetY = DECK_TOP; S.player.velY = 0; S.player.onGround = true;
  S.player.hp = 100; S.player.armor = 50;
  S.yaw = S.targetYaw = Math.PI / 2; S.pitch = S.targetPitch = -0.02; S.tpBlend = S.thirdPerson ? 1 : 0;
  S.camera.fov = 74; S.camera.updateProjectionMatrix();

  for (const k in WEAPONS) { WEAPONS[k].ammo = WEAPONS[k].clip; WEAPONS[k].reserve = WEAPONS[k].initReserve; }
  S.current = 'rifle'; S.fireTimer = 0; S.reloadTimer = 0; S.meleeSwing = 0;
  for (const k in S.vmRes.groups) S.vmRes.groups[k].visible = (k === 'rifle');

  ['intro', 'gameover', 'outro', 'pause', 'codex'].forEach(id => { if ($(id)) $(id).classList.add('hidden'); });
  initAudio();

  const firstWave = (S.gameMode === 'campaign') ? S.startChapter : 0;
  const launchCombat = () => {
    S.alive = true; S.paused = false;
    S.stats.startTime = performance.now();
    if ($('hud')) $('hud').style.display = 'block';
    S.playerAvatar.position.set(S.player.pos.x, S.player.feetY, S.player.pos.z);
    S.playerAvatar.rotation.y = S.yaw + Math.PI;
    S.playerAvatar.visible = S.thirdPerson;
    S.vmRes.vm.visible = !S.thirdPerson;
    syncTouchControlsVisibility();
    lockPointer();
    updateLockHint();
    startWave(firstWave);
    updateHUD();
  };

  if (skipCine || S.gameMode === 'survival' || firstWave > 0) {
    launchCombat();
  } else {
    S.alive = false; S.paused = false;
    startCinematic('intro', () => showTacticalBriefing(0, launchCombat));
  }
}

export function pauseGame() {
  if (!S.alive || S.paused || S.cinematic || S.shopOpen || S.tacticalBrief || S.inventoryOpen) return;
  S.paused = true; S.aiming = false; S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false; S.squadWheelOpen = false;
  if ($('squadWheel')) $('squadWheel').classList.remove('open');
  if ($('pause')) $('pause').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  syncTouchControlsVisibility();
  updateLockHint();
}

export function resumeGame() {
  if (!S.alive) return;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  S.paused = false;
  if ($('pause')) $('pause').classList.add('hidden');
  syncTouchControlsVisibility();
  lockPointer();
  updateLockHint();
}

export function die() {
  if (!S.alive) return;
  closeInventory(false);
  clearStorySetPieces();
  S.alive = false; S.aiming = false; S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false; S.mgMounted = false; S.squadWheelOpen = false;
  S.vmRes.vm.visible = true; S.playerAvatar.visible = false; S.avatarFlash.visible = false;
  if ($('mgHeatWrap')) $('mgHeatWrap').classList.add('hidden');
  if ($('squadWheel')) $('squadWheel').classList.remove('open');
  if ($('grenadeWarn')) $('grenadeWarn').classList.remove('show');
  clearKillfeed();
  clearDamageNumbers();
  S.rainActive = false; if (S.rainPoints) S.rainPoints.visible = false;
  renderStats('gameoverStats');
  recordProgress(false, 'gameoverRecord');
  if ($('hud')) $('hud').style.display = 'none';
  if ($('gameover')) $('gameover').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  syncTouchControlsVisibility();
  updateLockHint();
}

function showOutroCard() {
  renderStats('outroStats');
  recordProgress(true, 'outroRecord');
  if ($('hud')) $('hud').style.display = 'none';
  if ($('outro')) $('outro').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  syncTouchControlsVisibility();
  updateLockHint();
}

function victory() {
  closeInventory(false);
  clearStorySetPieces();
  S.alive = false; S.aiming = false; S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false; S.mgMounted = false; S.squadWheelOpen = false;
  S.vmRes.vm.visible = true; S.playerAvatar.visible = false; S.avatarFlash.visible = false;
  if ($('mgHeatWrap')) $('mgHeatWrap').classList.add('hidden');
  if ($('squadWheel')) $('squadWheel').classList.remove('open');
  clearKillfeed();
  clearDamageNumbers();
  S.rainActive = false; if (S.rainPoints) S.rainPoints.visible = false;
  if (S.flareObj) S.flareObj.visible = false; if (S.flareLight) S.flareLight.intensity = 0;
  unlockMedal('wanping_hero');
  startCinematic('outro', showOutroCard);
}

// ---------- main loop ----------
const clock = new THREE.Clock();
const _tmpFwd = new THREE.Vector3();
const _tmpRight = new THREE.Vector3();
const _tmpMove = new THREE.Vector3();
let drsTimer = 0, drsFrames = 0;

function animate() {
  requestAnimationFrame(animate);
  S.frameCount++;
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  const t = clock.elapsedTime;

  // Dynamic Resolution Scaling (DRS) in low / med
  drsFrames++;
  drsTimer += rawDt;
  if (drsTimer >= 1.5) {
    const avgFps = drsFrames / drsTimer;
    if (S.gfxLevel !== 'high' && avgFps < 40 && S.drsScale > 0.78) {
      S.drsScale = Math.max(0.78, S.drsScale - 0.11);
      applyPixelSize();
    } else if (S.gfxLevel !== 'high' && avgFps > 56 && S.drsScale < 1.0) {
      S.drsScale = Math.min(1.0, S.drsScale + 0.08);
      applyPixelSize();
    }
    drsTimer = 0; drsFrames = 0;
  }

  if (S.showFps) {
    S.fpsFrames++;
    const now = performance.now();
    if (now - S.fpsClock >= 500) {
      if ($('fpsBox')) $('fpsBox').textContent = `${Math.round(S.fpsFrames * 1000 / (now - S.fpsClock))} FPS`;
      S.fpsFrames = 0; S.fpsClock = now;
    }
  }

  updateWorld(dt, t);
  updateMusic(dt);
  updateAudioListener(S.camera);
  updateSquad(dt, t);

  if (S.tacticalBrief && $('tacticalMapCanvas')) {
    renderTacticalMap($('tacticalMapCanvas'), S.tacticalBrief.ch, (performance.now() - S.tacticalBrief.start) * 0.001);
  }
  if (S.shopOpen && $('shopMapCanvas')) {
    renderTacticalMap($('shopMapCanvas'), S.wave % 4, t);
  }

  const activePlay = S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.tacticalBrief && !S.inventoryOpen;

  if (S.cinematic) {
    updateCinematic(dt);
  } else {
    const lookAlpha = 1 - Math.exp(-65 * dt);
    if (Math.abs(S.targetYaw - S.yaw) < 1e-5) S.yaw = S.targetYaw;
    else S.yaw += (S.targetYaw - S.yaw) * lookAlpha;
    if (Math.abs(S.targetPitch - S.pitch) < 1e-5) S.pitch = S.targetPitch;
    else S.pitch += (S.targetPitch - S.pitch) * lookAlpha;
    if (!S.paused && !S.inventoryOpen) S.recoilPitch = Math.max(0, S.recoilPitch - dt * 0.16);
    const viewPitch = S.mgMounted
      ? Math.max(-0.35, Math.min(0.35, S.pitch + S.recoilPitch * 0.35))
      : Math.max(-1.35, Math.min(1.35, S.pitch + S.recoilPitch));
    S.camera.rotation.y = S.yaw;
    S.camera.rotation.x = viewPitch;

    if (activePlay) {
      pollGamepad(dt);
      if (S.supplyCooldown > 0) S.supplyCooldown = Math.max(0, S.supplyCooldown - dt);
      if (S.mgTimer > 0) S.mgTimer = Math.max(0, S.mgTimer - dt);
      if (S.dryFireCd > 0) S.dryFireCd = Math.max(0, S.dryFireCd - dt);
      if (S.avatarHitT > 0) S.avatarHitT = Math.max(0, S.avatarHitT - dt);
      if (S.jumpBuffer > 0) S.jumpBuffer = Math.max(0, S.jumpBuffer - dt);
      if (S.boostTimer > 0) { S.boostTimer = Math.max(0, S.boostTimer - dt); syncInventoryBadge(); }
      if (S.streakTimer > 0) { S.streakTimer -= dt; if (S.streakTimer <= 0) S.streakCount = 0; }
      updateKillfeedAndStreak(dt);
      updateLootDrops(dt, t);

      const firingHeld = S.mouseDownLeft || S.gpFiring || S.touchFiring;
      if (S.mgMounted) {
        S.player.pos.set(S.mgPos.x + 0.85, DECK_TOP + 1.48, S.mgPos.z);
        S.camera.position.copy(S.player.pos);
        S.playerAvatar.visible = false;
        S.vmRes.vm.visible = false;
        if (S.mgHead) {
          S.mgHead.rotation.order = 'YXZ';
          S.mgHead.rotation.y = S.yaw;
          S.mgHead.rotation.x = viewPitch;
          S.mgHead.rotation.z = 0;
        }
        if (firingHeld && !S.mgOverheated) {
          if (S.mgTimer <= 0) fireMG();
        } else {
          S.mgHeat = Math.max(0, S.mgHeat - dt * 0.28);
          if (S.mgOverheated && S.mgHeat <= 0.25) S.mgOverheated = false;
        }
        if ($('mgHeatBar')) {
          $('mgHeatBar').style.width = Math.min(100, Math.round(S.mgHeat * 100)) + '%';
          $('mgHeatBar').style.background = S.mgOverheated ? '#ff4433' : (S.mgHeat > 0.7 ? '#f08a24' : '#e8c87a');
        }
        if ($('ammo')) $('ammo').textContent = S.mgOverheated ? 'SOBRECALENTADA' : `${Math.round((1 - S.mgHeat) * 100)}%`;
      } else {
        if (S.mgHeat > 0) {
          S.mgHeat = Math.max(0, S.mgHeat - dt * 0.28);
          if (S.mgOverheated && S.mgHeat <= 0.25) S.mgOverheated = false;
        }
        if (firingHeld && WEAPONS[S.current].auto && S.fireTimer <= 0 && S.reloadTimer <= 0 && !S.squadWheelOpen) {
          shoot();
        }
        S.running = !!(S.keys['ShiftLeft'] || S.keys['ShiftRight']);
        const speed = (S.crouching ? 4.2 : (S.running && !S.aiming ? 11 : 6.6)) * (S.boostTimer > 0 ? 1.2 : 1.0);
        _tmpFwd.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
        _tmpRight.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
        _tmpMove.set(0, 0, 0);
        if (S.keys['KeyW']) _tmpMove.add(_tmpFwd);
        if (S.keys['KeyS']) _tmpMove.sub(_tmpFwd);
        if (S.keys['KeyD']) _tmpMove.add(_tmpRight);
        if (S.keys['KeyA']) _tmpMove.sub(_tmpRight);
        if (Math.abs(S.touchMove.x) > 0.12 || Math.abs(S.touchMove.y) > 0.12) {
          _tmpMove.addScaledVector(_tmpRight, S.touchMove.x).addScaledVector(_tmpFwd, -S.touchMove.y);
        }
        if (_tmpMove.lengthSq() > 0) {
          _tmpMove.normalize().multiplyScalar(speed * dt);
          resolvePlayerCollision(S.player.pos.x + _tmpMove.x, S.player.pos.z + _tmpMove.z);
        }
        const floorY = getFloorY(S.player.pos.x, S.player.pos.z);
        if (!S.player.onGround || S.player.feetY > floorY + 0.001) {
          S.player.velY -= 21.0 * dt;
          S.player.feetY += S.player.velY * dt;
          if (S.player.feetY <= floorY) {
            if (S.player.velY < -4.5) tone(110, 0.05, 0.07, 'sine', 58);
            S.player.feetY = floorY;
            S.player.velY = 0;
            S.player.onGround = true;
            if (S.jumpBuffer > 0) triggerJump();
          }
        } else {
          S.player.feetY = floorY;
        }
        S.eyeHeight += ((S.crouching ? 1.02 : 1.7) - S.eyeHeight) * Math.min(1, dt * 10);
        S.player.pos.y = S.player.feetY + S.eyeHeight;

        const wantThird = S.thirdPerson && !S.mgMounted;
        S.tpBlend += ((wantThird ? 1 : 0) - S.tpBlend) * Math.min(1, dt * 13);
        if (S.tpBlend > 0.01) {
          const camFwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(viewPitch, S.yaw, 0, 'YXZ'));
          const camRight = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
          const camUp = new THREE.Vector3().crossVectors(camRight, camFwd).normalize();
          const backDist = S.aiming ? 1.72 : 3.05;
          const sideDist = S.aiming ? 0.64 : 0.78;
          const upDist = S.aiming ? 0.14 : 0.24;
          const pivot = S.player.pos.clone();
          const desired = pivot.clone()
            .addScaledVector(camFwd, -backDist)
            .addScaledVector(camRight, sideDist)
            .addScaledVector(camUp, upDist);
          const toCam = new THREE.Vector3().subVectors(desired, pivot);
          const maxD = toCam.length();
          if (maxD > 0.01) {
            toCam.divideScalar(maxD);
            S.raycaster.set(pivot, toCam);
            S.raycaster.far = maxD;
            const camCols = S.raycaster.intersectObjects(S.worldColliders, false).filter(h => h.object.visible !== false && !h.object.userData.isMgShield);
            if (camCols.length) {
              desired.copy(pivot).addScaledVector(toCam, Math.max(0.45, camCols[0].distance - 0.25));
            }
          }
          desired.y = Math.max(DECK_TOP + 0.55, desired.y);
          S.camera.position.lerpVectors(S.player.pos, desired, S.tpBlend);
        } else {
          S.camera.position.copy(S.player.pos);
        }

        const showAvatar = S.tpBlend > 0.15 && S.camera.position.distanceTo(S.player.pos) > 0.52;
        S.playerAvatar.visible = showAvatar;
        S.vmRes.vm.visible = !showAvatar;
        if (S.thirdPerson || S.tpBlend > 0.001) {
          S.playerAvatar.position.set(S.player.pos.x, S.player.feetY, S.player.pos.z);
          S.playerAvatar.rotation.y = S.yaw + Math.PI;
          S.playerAvatar.scale.set(1, S.crouching ? 0.76 : 1.0, 1);
        }
        if (showAvatar) {
          if (S.playerLiving) {
            S.playerLiving.time(t);
            const movingNow = !!(S.keys['KeyW'] || S.keys['KeyS'] || S.keys['KeyA'] || S.keys['KeyD'] || Math.abs(S.touchMove.x) > 0.15 || Math.abs(S.touchMove.y) > 0.15);
            const walkVal = (movingNow && S.player.onGround) ? (S.running && !S.aiming ? 1.35 : 1.0) : 0;
            const aimVal = (S.aiming || firingHeld) ? 1.0 : 0.25;
            S.playerLiving.set(walkVal, aimVal, S.avatarHitT * 2.5, 0);
          }
          S.avatarSword.visible = (S.current === 'sword');
          if (S.avatarSword.visible) {
            const sw = Math.sin(S.meleeSwing * Math.PI);
            S.avatarSword.rotation.set(0.32 + sw * 1.25, 0.12 + sw * 0.65, 0.32 - sw * 0.55);
          }
        }
      }

      const promptEl = $('interactPrompt');
      if (promptEl) {
        const storyPrompt = getStoryInteractPrompt();
        if (storyPrompt) {
          promptEl.textContent = storyPrompt;
          promptEl.style.opacity = '1';
        } else if (S.mgMounted) {
          promptEl.textContent = '[F] Soltar ametralladora Tipo 24';
          promptEl.style.opacity = '1';
        } else if (Math.hypot(S.player.pos.x - S.mgPos.x, S.player.pos.z - S.mgPos.z) < 3.2 && S.player.feetY < 8.5) {
          promptEl.textContent = '[F] Montar ametralladora Tipo 24 (cobertura frontal)';
          promptEl.style.opacity = '1';
        } else if (Math.hypot(S.player.pos.x - S.supplyCratePos.x, S.player.pos.z - S.supplyCratePos.z) < 3.4 && S.player.feetY < 8.5) {
          promptEl.textContent = S.supplyCooldown > 0
            ? `Suministros disponibles en ${Math.ceil(S.supplyCooldown)}s`
            : '[E] Tomar munición, blindaje (+25), vendaje, ración y Molotov';
          promptEl.style.opacity = '1';
        } else {
          const nearLoot = getNearestLootDrop(3.6);
          if (nearLoot && nearLoot.spec) {
            promptEl.textContent = `[E] Recoger ${nearLoot.spec.name}`;
            promptEl.style.opacity = '1';
          } else {
            promptEl.style.opacity = '0';
          }
        }
      }
      drawRadar();
    } else {
      if ($('interactPrompt')) $('interactPrompt').style.opacity = '0';
      if (!S.alive) {
        S.vmRes.vm.visible = !S.mgMounted && !S.thirdPerson;
        S.playerAvatar.visible = false;
      }
    }
  }

  if (!S.paused && S.cameraShake > 0) {
    S.cameraShake = Math.max(0, S.cameraShake - dt * 1.4);
    S.camera.position.x += (Math.random() - 0.5) * S.cameraShake * 0.35;
    S.camera.position.y += (Math.random() - 0.5) * S.cameraShake * 0.35;
    S.camera.position.z += (Math.random() - 0.5) * S.cameraShake * 0.35;
  }

  const adsFov = S.thirdPerson ? WEAPONS[S.current].adsThirdFov : WEAPONS[S.current].adsFov;
  const targetFov = (!S.cinematic && S.alive && S.aiming && (!WEAPONS[S.current].melee || S.mgMounted) && S.reloadTimer <= 0) ? (S.mgMounted ? 56 : adsFov) : 74;
  if (Math.abs(S.camera.fov - targetFov) > 0.05) {
    S.camera.fov += (targetFov - S.camera.fov) * Math.min(1, dt * 12);
    S.camera.updateProjectionMatrix();
  }

  const isMoving = activePlay && !S.mgMounted && (S.keys['KeyW'] || S.keys['KeyS'] || S.keys['KeyA'] || S.keys['KeyD'] || Math.abs(S.touchMove.x) > 0.15 || Math.abs(S.touchMove.y) > 0.15);
  if (!S.paused && !S.inventoryOpen) {
    const wDt = Math.min(rawDt, 0.25);
    if (S.fireTimer > 0) S.fireTimer -= wDt;
    if (S.flashTimer > 0) {
      S.flashTimer -= wDt;
      if (S.flashTimer <= 0) {
        for (const f of Object.values(S.vmRes.flashes)) f.visible = false;
        if (S.mgFlash) S.mgFlash.visible = false;
        S.avatarFlash.visible = false;
      }
    }
    if (S.reloadTimer > 0) {
      S.reloadTimer -= wDt * (S.boostTimer > 0 ? 1.35 : 1.0);
      if (S.reloadTimer <= 0) {
        const w = WEAPONS[S.current];
        const need = w.clip - w.ammo, give = Math.min(need, w.reserve);
        w.ammo += give; w.reserve -= give; updateHUD();
      }
    }
    updateCrosshair(dt, isMoving);
    updatePools(dt);
    updateWeapons(dt);
    S.recoil *= Math.pow(0.001, dt);
    if (S.meleeSwing > 0) S.meleeSwing = Math.max(0, S.meleeSwing - dt * 3.2);
  }
  updateLockHint();

  const swingAng = Math.sin(S.meleeSwing * Math.PI);
  S.vmRes.groups.sword.rotation.set(0.35 + swingAng * 1.15, -0.12 - swingAng * 0.8, -0.25 + swingAng * 0.5);
  const targetVmX = (S.aiming && !WEAPONS[S.current].melee && S.reloadTimer <= 0) ? -0.22 : 0;
  S.vmRes.vm.position.x += (targetVmX - S.vmRes.vm.position.x) * Math.min(1, dt * 14);
  S.vmRes.vm.position.z = -S.recoil * 0.12 - swingAng * 0.14;
  S.vmRes.vm.position.y = -Math.abs(Math.sin(t * (S.running && !S.crouching && !S.aiming ? 11 : 6.6))) * 0.012 * (isMoving ? 1 : 0) * (S.aiming ? 0.35 : 1) - (S.reloadTimer > 0 ? 0.08 : 0);
  S.vmRes.vm.rotation.x = S.reloadTimer > 0 ? -0.35 : 0;

  if (activePlay) {
    if (S.rainActive) {
      S.lightningTimer -= dt;
      if (S.lightningTimer <= 0) {
        S.lightningTimer = 7 + Math.random() * 9;
        S.moonLight.intensity = S.baseMoonInt + 3.8;
        setTimeout(() => { if (S.alive && !S.paused) noiseBurst(0.65, 0.32, 180); }, 240 + Math.random() * 320);
      } else if (S.moonLight.intensity > S.baseMoonInt) {
        S.moonLight.intensity = Math.max(S.baseMoonInt, S.moonLight.intensity - dt * 11);
      }
    } else if (S.moonLight.intensity !== S.baseMoonInt) {
      S.moonLight.intensity = S.baseMoonInt;
    }

    if (S.gameMode === 'survival' || S.wave >= 1) {
      S.flareTimer -= dt;
      if (S.flareTimer <= 0) {
        S.flareTimer = 15 + Math.random() * 10;
        S.flareLife = 12.0;
        if (S.flareObj) {
          S.flareObj.visible = true;
          S.flareObj.position.set(-22 + Math.random() * 36, 26, (Math.random() - 0.5) * 10);
          if (S.flareLight) S.flareLight.position.copy(S.flareObj.position);
        }
      }
    }
    if (S.flareLife > 0 && S.flareObj && S.flareLight) {
      S.flareLife -= dt;
      S.flareObj.position.y -= dt * 1.15;
      S.flareLight.position.copy(S.flareObj.position);
      const fFrac = Math.min(1, S.flareLife / 2.2);
      S.flareLight.intensity = fFrac * (48 + Math.sin(t * 19) * 6);
      if (S.flareLife <= 0) { S.flareObj.visible = false; S.flareLight.intensity = 0; }
    }

    if (S.gameMode === 'survival' || S.wave >= 1) {
      S.artilleryTimer -= dt;
      if (S.artilleryTimer <= 0) {
        S.artilleryTimer = 8 + Math.random() * 5;
        spawnArtilleryBlast(-45 + Math.random() * 55, 1.5, (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 11));
      }
    }

    updateEnemies(dt, t);
    updateStory(dt, t);

    const rem = S.toSpawn + S.enemies.filter(e => !e.userData.dead).length + (S.tankette && !S.tankette.userData.dead ? 1 : 0);
    const chIdx = S.gameMode === 'survival' ? (S.wave % 4) : Math.min(7, S.wave);
    if (!S.midWaveRadioSent && rem > 0 && rem <= Math.ceil(S.waveInitialCount / 2)) {
      S.midWaveRadioSent = true;
      showRadio(MID_WAVE_RADIOS[chIdx][0], MID_WAVE_RADIOS[chIdx][1], 6.0);
      if (S.storyMission && !S.storyMission.phases && S.storyMission.storyMid) {
        showStorySubtitle(S.storyMission.storyMid[0], S.storyMission.storyMid[1], 6.5);
      }
    }
    if (S.toSpawn > 0) {
      S.spawnTimer -= dt;
      if (S.spawnTimer <= 0) {
        spawnEnemy(); S.toSpawn--;
        S.spawnTimer = S.gameMode === 'survival' ? Math.max(0.55, 1.1 - S.wave * 0.04) : 1.1;
        updateHUD();
      }
    } else if (S.enemies.length === 0 && (!S.tankette || S.tankette.userData.dead) && !S.cinematic) {
      if (S.gameMode === 'survival') {
        openShop(() => startWave(S.wave + 1));
      } else if (S.wave < 4) {
        if (S.wave === 0) startCinematic('wave2', () => showTacticalBriefing(1, () => startWave(1)));
        else if (S.wave === 1) startCinematic('wave3', () => showTacticalBriefing(2, () => startWave(2)));
        else if (S.wave === 2) startCinematic('wave4', () => showTacticalBriefing(3, () => startWave(3)));
        else { unlockMedal('wanping_hero'); showTacticalBriefing(4, () => startWave(4)); }
      }
    }
  }

  if (!S.paused && !S.inventoryOpen) {
    for (let i = S.effects.length - 1; i >= 0; i--) {
      const fx = S.effects[i]; fx.life -= dt;
      if (fx.light) fx.obj.intensity = Math.max(0, fx.life / fx.max) * fx.baseInt;
      else if (fx.line) fx.obj.material.opacity = Math.max(0, fx.life / fx.max) * 0.95;
      else { fx.obj.material.opacity = Math.max(0, fx.life / fx.max); fx.obj.scale.multiplyScalar(1 + dt * (fx.grow || 2)); }
      if (fx.life <= 0) {
        S.scene.remove(fx.obj);
        if (!fx.sharedGeo && fx.obj.geometry) fx.obj.geometry.dispose();
        if (fx.obj.material) fx.obj.material.dispose();
        S.effects.splice(i, 1);
      }
    }
  }

  S.camera.updateMatrixWorld();
  updateDamageNumbers(S.paused || S.inventoryOpen ? 0 : dt);
  updateObjectiveMarker();
  if (S.postFX) S.postFX.render(t);
  else S.renderer.render(S.scene, S.camera);
}
animate();

// ---------- automation / capture / debug API ----------
window.__capture = () => {
  if (S.postFX) S.postFX.render(clock.elapsedTime);
  else S.renderer.render(S.scene, S.camera);
  const w = S.renderer.domElement.width, h = S.renderer.domElement.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(S.renderer.domElement, 0, 0, w, h);
  x.textBaseline = 'top';
  x.fillStyle = 'rgba(0,0,0,0.42)'; x.fillRect(0, 0, w, 108);
  x.font = 'bold 28px "Microsoft YaHei", sans-serif'; x.fillStyle = '#e8c87a';
  x.fillText('卢沟桥 · 七七事变', 26, 18);
  x.font = '12px sans-serif'; x.fillStyle = '#b9b4a6';
  x.fillText('PUENTE DE MARCO POLO — 7 JULIO 1937', 26, 56);
  x.font = '13px sans-serif'; x.fillStyle = '#d8d2c4';
  x.fillText('OBJETIVO: contener el asalto japonés · ' + ($('modeLabel')?.textContent || '') + ' ' + ($('wave')?.textContent || '') + ($('waveTotal')?.textContent || '') + ' · ' + S.stats.score + ' pts', 26, 82);
  x.fillStyle = '#b9b4a6'; x.font = '11px sans-serif'; x.fillText('BLINDAJE / SALUD', 28, h - 54);
  x.fillStyle = '#101a20'; x.fillRect(28, h - 40, 220, 6);
  x.fillStyle = '#56d8ff'; x.fillRect(28, h - 40, 220 * (S.player.armor / 50), 6);
  x.fillStyle = '#1a1a18'; x.fillRect(28, h - 30, 220, 10);
  x.fillStyle = '#d5a23c'; x.fillRect(28, h - 30, 220 * (S.player.hp / 100), 10);
  return c.toDataURL('image/png');
};

window.__state = () => {
  const cs = getCrosshairState();
  const tu = S.tankette ? S.tankette.userData : null;
  return {
    alive: S.alive, paused: S.paused, hp: Math.round(S.player.hp), armor: Math.round(S.player.armor),
    wave: S.wave, gameMode: S.gameMode, diffKey: S.diffKey, gfxLevel: S.gfxLevel, drsScale: +S.drsScale.toFixed(2),
    ammo: WEAPONS[S.current].ammo, reserve: WEAPONS[S.current].reserve, currentWeapon: S.current,
    mp18Owned: S.mp18Owned, mp18Tier: S.mp18Tier,
    grenades: S.grenades, molotovs: S.molotovs, bandages: S.bandages, mortarStrikes: S.mortarStrikes,
    molotovZones: S.molotovZones.length, alliedMortars: S.alliedMortars.length,
    enemyGrenades: S.enemyGrenades.length, enemyMortars: S.enemyMortars.length,
    mgMounted: S.mgMounted, score: S.stats.score,
    enemies: S.enemies.filter(e => !e.userData.dead).length,
    tanketteHp: tu ? tu.hp : 0,
    tanketteParts: tu ? { tracksBroken: tu.tracksBroken, visorBroken: tu.visorBroken, turretBroken: tu.turretBroken } : null,
    squadOrder: S.squadOrder, squadWheelOpen: S.squadWheelOpen, shopOpen: S.shopOpen,
    inventoryOpen: S.inventoryOpen, inventory: { ...S.inventory }, inventoryUsedSlots: getInventoryUsedSlots(),
    lootDrops: S.lootDrops.length, boostTimer: +S.boostTimer.toFixed(2),
    theater: S.currentTheater, storyPhase: S.storyPhase, storyProgress: S.storyProgress,
    plantedBombs: S.plantedBombs.length, storyTargetsLeft: S.storyTargets.filter(t => !t.destroyed).length,
    storyWaypoint: S.storyWaypoint, storyFlagRaised: S.storyFlagRaised, shellshock: +(S.shellshockT || 0).toFixed(2),
    tacticalBrief: !!S.tacticalBrief,
    medals: [...(S.records.medals || [])],
    sandbagsIntact: S.sandbagClusters.filter(c => !c.broken).length,
    barrelsIntact: S.explosiveBarrels.filter(b => !b.exploded).length,
    rainActive: S.rainActive, frames: S.frameCount, toSpawn: S.toSpawn, crouching: S.crouching, aiming: S.aiming,
    thirdPerson: S.thirdPerson, pos: S.player.pos.toArray().map(v => +v.toFixed(2)),
    onGround: S.player.onGround, feetY: +S.player.feetY.toFixed(3), velY: +S.player.velY.toFixed(2),
    yaw: +S.yaw.toFixed(4), pitch: +S.pitch.toFixed(4),
    streak: S.streakCount, streakTimer: +S.streakTimer.toFixed(2),
    crosshairGap: cs.gap, crosshairBloom: cs.bloom, damageNumbers: cs.dmgCount,
    killfeedCount: $('killfeed') ? $('killfeed').children.length : 0,
    pointerLocked: document.pointerLockElement === S.renderer.domElement,
    cinematic: S.cinematic ? S.cinematic.type : null,
    stats: { ...S.stats }
  };
};

window.__demo = {
  positions: () => S.enemies.map(e => [+e.position.x.toFixed(1), +e.position.z.toFixed(1)]),
  bring: () => S.enemies.forEach((e, i) => { if (!e.userData.dead) e.position.set(20 - i * 4, DECK_TOP, -0.6 + i * 0.6); }),
  spawn: (n = 4, role = 'rifleman', lane = 'main') => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const e = makeEnemy(role, lane);
      e.position.set(lane === 'rail' ? -36 - i * 3 : -38 - i * 3, DECK_TOP, lane === 'rail' ? -13.1 : (Math.random() - 0.5) * 5.2);
      S.scene.add(e); S.enemies.push(e); S.enemyHitboxes.push(e.userData.torso, e.userData.head);
      out.push(e);
    }
    updateHUD();
    return out.length;
  },
  spawnTankette: () => spawnTankette(),
  detonateBarrel: (idx = 0) => { if (S.explosiveBarrels[idx]) detonateBarrel(S.explosiveBarrels[idx]); },
  hitSandbag: (idx = 0, dmg = 140) => { if (S.sandbagClusters[idx]) damageSandbagCluster(S.sandbagClusters[idx], dmg); },
  damageTank: (dmg = 140, part = 'tracks') => damageTankette(dmg, part === 'visor', null, 'Fusil', null, part),
  hurt: (dmg = 40) => applyPlayerDamage(dmg, new THREE.Vector3(-10, DECK_TOP, 0)),
  setPos: (x, z, feetY = DECK_TOP) => { S.player.feetY = feetY; S.player.pos.set(x, feetY + S.eyeHeight, z); S.player.velY = 0; S.player.onGround = true; },
  enemyHP: () => S.enemies.map(e => Math.round(e.userData.hp)),
  shoot: () => shoot(),
  skipCinematic: () => { if (S.cinematic) endCinematic(); if (S.tacticalBrief) closeTacticalBriefing(); },
  beginDirect: () => beginGame(true),
  openShop: () => openShop(() => startWave(S.wave + 1)),
  closeShop: () => closeShop(),
  openInventory: () => openInventory(),
  closeInventory: () => closeInventory(true),
  spawnLoot: (id = 'intel_doc', dx = 0, dz = 0) => spawnLootDrop(id, S.player.pos.x + dx, S.player.pos.z + dz, 0.05, S.player.feetY),
  useInvItem: (id) => useInventoryItem(id),
  startChapter: (ch = 4) => { S.gameMode = 'campaign'; S.startChapter = ch; beginGame(true); },
  clearEnemies: () => {
    S.toSpawn = 0;
    for (const e of S.enemies) {
      if (!e.userData.dead) killEnemy(e, true, { weapon: 'E2E' });
      if (e.userData.living) e.userData.living.dispose();
      S.scene.remove(e);
    }
    S.enemies.length = 0;
    if (S.tankette && !S.tankette.userData.dead) damageTankette(9999, true, null, 'E2E', 'blast', 'visor');
  },
  storyInteract: () => tryStoryInteract(),
  fastForwardHold: (sec = 22) => { if (S.storyHoldTimer > 0) S.storyHoldTimer = Math.max(0.05, S.storyHoldTimer - sec); },
  showBriefing: (ch = 0) => showTacticalBriefing(ch, null),
  setOrder: (ord) => setSquadOrder(ord),
  touch: (mode) => { S.touchMode = mode; syncTouchControlsVisibility(); },
  assets: () => Object.keys(S.ASSETS),
  sceneCount: () => S.scene.children.length,
  view: (y, p) => { S.yaw = S.targetYaw = y; if (p !== undefined) S.pitch = S.targetPitch = p; S.recoilPitch = 0; S.camera.rotation.y = S.yaw; S.camera.rotation.x = S.pitch; }
};

// ---------- boot & UI listeners ----------
function boot() {
  loadRecords();
  applyGraphics(S.gfxLevel);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const modelKeys = Object.keys(MODEL_URLS);
  const total = modelKeys.length;
  let loaded = 0;
  if ($('loadText')) $('loadText').textContent = `CARGANDO MODELOS 3D (0/${total})…`;
  Promise.all(modelKeys.map(n =>
    loader.loadAsync(MODEL_URLS[n])
      .then(g => { S.ASSETS[n] = g.scene; })
      .catch(e => console.warn('Modelo no cargado:', n, e))
      .finally(() => {
        loaded++;
        if ($('loadText')) $('loadText').textContent = `CARGANDO MODELOS 3D (${loaded}/${total})…`;
        if ($('loadBar')) $('loadBar').style.width = Math.round(loaded * 100 / total) + '%';
      })
  )).then(() => {
    applyWorldModels();
    applyWeaponModels();
    applySquadModels();
    applyGraphics(S.gfxLevel);
    renderAllMedals();
    if ($('loading')) $('loading').classList.add('hidden');
    if ($('intro')) $('intro').classList.remove('hidden');
  });
}
boot();

function bindPillGroup(containerId, attr, onSelect) {
  const wrap = $(containerId);
  if (!wrap) return;
  wrap.addEventListener('click', ev => {
    const btn = ev.target.closest('button');
    if (!btn || !wrap.contains(btn)) return;
    wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    onSelect(btn.dataset[attr], btn);
  });
}

bindPillGroup('modePills', 'mode', val => {
  S.gameMode = (val === 'survival') ? 'survival' : 'campaign';
  if ($('chapterPickRow')) $('chapterPickRow').classList.toggle('hidden', S.gameMode !== 'campaign');
  updateRecordBanner();
});
bindPillGroup('chapterPills', 'ch', val => { S.startChapter = Math.max(0, Math.min(7, parseInt(val, 10) || 0)); });
bindPillGroup('diffPills', 'diff', val => { if (DIFFS[val]) S.diffKey = val; });
bindPillGroup('gfxPills', 'gfx', val => { applyGraphics(val); });

if ($('squadButtons')) {
  $('squadButtons').addEventListener('click', ev => {
    const btn = ev.target.closest('button');
    if (btn && btn.dataset.order) setSquadOrder(btn.dataset.order);
  });
}

$('startBtn')?.addEventListener('click', () => { initAudio(); beginGame(false); });
$('skipIntroStartBtn')?.addEventListener('click', () => { initAudio(); beginGame(true); });
$('cineSkip')?.addEventListener('click', () => { initAudio(); endCinematic(); });
$('tacSkipBtn')?.addEventListener('click', () => { initAudio(); closeTacticalBriefing(); });
$('shopContinueBtn')?.addEventListener('click', () => { initAudio(); closeShop(); });
$('openCodexIntroBtn')?.addEventListener('click', () => $('codex')?.classList.remove('hidden'));
$('openCodexOutroBtn')?.addEventListener('click', () => $('codex')?.classList.remove('hidden'));
$('closeCodexBtn')?.addEventListener('click', () => $('codex')?.classList.add('hidden'));
$('resumeBtn')?.addEventListener('click', resumeGame);
$('retryBtn')?.addEventListener('click', () => { initAudio(); beginGame(true); });
$('againBtn')?.addEventListener('click', () => { initAudio(); beginGame(false); });
$('pauseRestartBtn')?.addEventListener('click', () => { initAudio(); beginGame(true); });
$('muteBtn')?.addEventListener('click', toggleMute);

$('fpsBtn')?.addEventListener('click', () => {
  S.showFps = !S.showFps;
  $('fpsBox')?.classList.toggle('hidden', !S.showFps);
  $('fpsBtn').textContent = 'FPS: ' + (S.showFps ? 'ON' : 'OFF');
  S.fpsFrames = 0; S.fpsClock = performance.now();
});

$('touchBtn')?.addEventListener('click', () => {
  const order = ['auto', 'on', 'off'];
  S.touchMode = order[(order.indexOf(S.touchMode) + 1) % 3];
  $('touchBtn').textContent = 'TÁCTIL: ' + (S.touchMode === 'auto' ? 'AUTO' : (S.touchMode === 'on' ? 'SÍ' : 'NO'));
  syncTouchControlsVisibility();
});

$('sensRange')?.addEventListener('input', e => {
  S.mouseSens = parseFloat(e.target.value);
  if ($('sensVal')) $('sensVal').textContent = S.mouseSens.toFixed(2) + '×';
});
$('musicRange')?.addEventListener('input', e => {
  S.musicVol = parseFloat(e.target.value);
  if ($('musicVal')) $('musicVal').textContent = Math.round(S.musicVol * 100) + '%';
});
$('sfxRange')?.addEventListener('input', e => {
  S.sfxVol = parseFloat(e.target.value);
  if ($('sfxVal')) $('sfxVal').textContent = Math.round(S.sfxVol * 100) + '%';
  syncAmbientVolume();
});
