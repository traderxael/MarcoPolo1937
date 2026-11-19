import * as THREE from 'three';
import { CAMPAIGN_MISSIONS, DECK_TOP, WAVES, WEAPONS } from './config.js';
import { $, S, addScore, unlockMedal } from './state.js';
import { box, mat } from './world.js';
import {
  noiseBurst, playBombPlant, playBombTick, playChargeBugle, playRadioChirp,
  playShellshock, playSupply, playVictoryFanfare, tone
} from './audio.js';
import { spawnFireParticle, spawnPooledImpact, spawnPooledTracer } from './pools.js';
import { applyPlayerDamage, spawnArtilleryBlast } from './weapons.js';

const _proj = new THREE.Vector3();
let subTimer = null;
let flagEndTimer = null;

export function showStorySubtitle(speaker, text, dur = 6.5) {
  const wrap = $('storySub');
  if (!wrap) return;
  if ($('storySpeaker')) $('storySpeaker').textContent = speaker || 'CRÓNICA HISTÓRICA';
  if ($('storyText')) $('storyText').textContent = text || '';
  wrap.classList.add('show');
  clearTimeout(subTimer);
  subTimer = setTimeout(() => wrap.classList.remove('show'), dur * 1000);
}

export function clearStorySetPieces() {
  clearTimeout(flagEndTimer);
  flagEndTimer = null;
  for (const tgt of S.storyTargets) {
    if (tgt.hitboxes) {
      for (const hb of tgt.hitboxes) {
        const i = S.enemyHitboxes.indexOf(hb);
        if (i >= 0) S.enemyHitboxes.splice(i, 1);
      }
    }
    if (tgt.group) S.scene?.remove(tgt.group);
  }
  S.storyTargets.length = 0;
  for (const b of S.plantedBombs) {
    if (b.mesh) S.scene?.remove(b.mesh);
  }
  S.plantedBombs.length = 0;
  S.storyWaypoint = null;
  S.shellshockT = 0;
  if ($('shellshockOverlay')) $('shellshockOverlay').style.opacity = '0';
  if ($('objMarker')) $('objMarker').style.opacity = '0';
}

export function renderObjectiveHud() {
  const listEl = $('objList');
  const progEl = $('objProgress');
  if (!listEl || !progEl) return;

  if (S.gameMode !== 'campaign') {
    const row = document.createElement('div');
    row.className = 'objRow active';
    row.textContent = '◆ Resistir oleadas enemigas (无尽抗战)';
    listEl.replaceChildren(row);
    const total = Math.max(1, S.waveInitialCount || 1);
    const rem = S.toSpawn + S.enemies.filter(e => !e.userData.dead).length + (S.tankette && !S.tankette.userData.dead ? 1 : 0);
    progEl.value = Math.max(0, Math.min(100, Math.round(((total - rem) / total) * 100)));
    return;
  }

  const m = CAMPAIGN_MISSIONS[S.wave];
  if (!m || !m.phases) {
    const row = document.createElement('div');
    row.className = 'objRow active';
    row.textContent = '◆ ' + (S.wave === 3 ? 'Contener asalto y destruir la Tanqueta Tipo 94' : 'Contener el asalto japonés en Lugouqiao');
    listEl.replaceChildren(row);
    const total = Math.max(1, WAVES[S.wave] || S.waveInitialCount || 5);
    const rem = S.toSpawn + S.enemies.filter(e => !e.userData.dead).length + (S.tankette && !S.tankette.userData.dead ? 1 : 0);
    progEl.value = Math.max(0, Math.min(100, Math.round(((total - rem) / total) * 100)));
    return;
  }

  const nodes = [];
  for (let i = 0; i <= Math.min(m.phases.length - 1, S.storyPhase); i++) {
    const p = m.phases[i];
    const done = i < S.storyPhase || (i === S.storyPhase && S.storyPhaseDone);
    const div = document.createElement('div');
    div.className = 'objRow' + (done ? ' done' : (i === S.storyPhase ? ' active' : ''));
    let extra = '';
    if (i === S.storyPhase && !done && p.type === 'hold_timer' && S.storyHoldMax > 0) {
      extra = ` · ${Math.ceil(S.storyHoldTimer)}s`;
    }
    div.textContent = (done ? '✓ ' : '◆ ') + p.label + extra;
    nodes.push(div);
  }
  listEl.replaceChildren(...nodes);
  progEl.value = Math.max(0, Math.min(100, Math.round(S.storyProgress || 0)));
}

function makeTargetBeacon(parent, height, colorHex = 0xffd447) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 20),
    new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.78, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 })
  );
  gem.position.y = height;
  parent.add(ring, gem);
  return { ring, gem };
}

function spawnTargetMesh(spec) {
  const g = new THREE.Group();
  g.position.set(spec.x, spec.y || DECK_TOP, spec.z);
  const hitboxes = [];
  let flash = null;

  if (spec.type === 'mg_nest') {
    // Sandbag bunker + Japanese Type 92 tripod MG
    const sb1 = box(1.2, 1.0, 3.2, S.pbr ? S.pbr.sandMat : 0x8b7e62, 0.75, 0.5, 0, g, { cast: true, receive: true });
    const body = box(1.0, 0.55, 0.65, 0x2a2e30, 0.1, 1.15, 0, g, { rough: 0.5, metal: 0.7 });
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 8), mat(0x222628, 0.4, 0.75));
    gunBarrel.rotation.z = Math.PI / 2;
    gunBarrel.position.set(0.95, 1.2, 0);
    flash = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.42, 6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.2, 0.45), transparent: true, opacity: 0.92, depthWrite: false })
    );
    flash.rotation.z = -Math.PI / 2;
    flash.position.set(1.75, 1.2, 0);
    flash.visible = false;
    g.add(gunBarrel, flash);
    hitboxes.push(sb1, body);
  } else if (spec.type === 'sabotage') {
    if (spec.id === 'sh_cannon' || spec.id === 'cs_mortar') {
      box(1.5, 0.75, 1.8, 0x454a3c, 0, 0.38, 0, g, { cast: true, receive: true });
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.3, 10), mat(0x2c302e, 0.45, 0.75));
      tube.rotation.z = -1.15;
      tube.position.set(0.55, 1.15, 0);
      g.add(tube);
    } else {
      // Ammo / Bunker sabotage cache
      box(2.2, 1.45, 2.2, 0x4d4638, 0, 0.72, 0, g, { cast: true, receive: true });
      box(1.1, 0.7, 1.1, 0x733224, 0.35, 1.75, 0.2, g, { cast: true });
    }
  } else if (spec.type === 'flag') {
    // Flag target relies on world's built Victory Flagpole mesh
  }

  const beacon = makeTargetBeacon(g, spec.type === 'flag' ? 3.8 : 2.5, spec.type === 'flag' ? 0xffe87a : 0xffaa3b);
  S.scene.add(g);

  const tgt = {
    ...spec,
    group: g,
    beacon,
    flash,
    hitboxes,
    maxHp: spec.hp || 140,
    hp: spec.hp || 140,
    destroyed: false,
    planted: false,
    fireT: 1.6,
    burst: 0,
    burstT: 0,
    flashT: 0
  };
  for (const hb of hitboxes) {
    hb.userData.storyTarget = tgt;
    S.enemyHitboxes.push(hb);
  }
  S.storyTargets.push(tgt);
  return tgt;
}

function syncWaypointToActiveTarget() {
  const intact = S.storyTargets.find(t => !t.destroyed && !t.planted);
  if (intact) {
    S.storyWaypoint = { x: intact.x, y: (intact.y || DECK_TOP) + 2.4, z: intact.z, label: intact.label };
  } else {
    S.storyWaypoint = null;
  }
}

export function startStoryPhase(phaseIdx) {
  clearStorySetPieces();
  const m = S.storyMission;
  if (!m || !m.phases) return;
  const phase = m.phases[phaseIdx];
  if (!phase) { completeCurrentMission(); return; }

  S.storyPhase = phaseIdx;
  S.storyPhaseDone = false;
  S.storyObjectiveText = phase.label;
  S.storyProgress = 0;
  S.storyHoldMax = phase.dur || 0;
  S.storyHoldTimer = phase.dur || 0;

  if (phase.squad && S.hooks.setSquadAnchors) {
    S.hooks.setSquadAnchors(phase.squad[0], phase.squad[1], false);
    if (phaseIdx > 0) playChargeBugle();
  }

  if (phase.target) spawnTargetMesh(phase.target);
  if (phase.targets) phase.targets.forEach(spawnTargetMesh);
  syncWaypointToActiveTarget();

  if (phase.spawn && phase.spawn.count > 0 && S.hooks.spawnEnemy) {
    const roles = phase.spawn.roles || ['rifleman'];
    for (let i = 0; i < phase.spawn.count; i++) {
      const role = roles[i % roles.length];
      const e = S.hooks.spawnEnemy(role, 'main');
      if (e) e.position.x = -36 - (i % 4) * 5 - Math.random() * 6;
    }
  }
  if (phase.spawn && phase.spawn.tankette && S.hooks.spawnTankette) {
    S.hooks.spawnTankette();
  }

  if (phase.intro) {
    showStorySubtitle(phase.intro[0], phase.intro[1], 6.5);
    playRadioChirp();
  }
  if (S.hooks.showMsg) S.hooks.showMsg(`OBJETIVO: ${phase.label.toUpperCase()}`, 2.0);
  renderObjectiveHud();
  if (S.hooks.updateHUD) S.hooks.updateHUD();
}

export function startStoryMission(missionIdx) {
  const m = CAMPAIGN_MISSIONS[missionIdx] || null;
  S.storyMission = m;
  S.storyPhase = 0;
  S.storyPhaseDone = false;
  S.storyHoldTimer = 0;
  S.storyHoldMax = 0;
  S.storyProgress = 0;
  clearStorySetPieces();

  if (!m) {
    renderObjectiveHud();
    return;
  }

  const prevTheater = S.currentTheater;
  if (S.hooks.activateTheater) S.hooks.activateTheater(m.theater);
  if ((prevTheater !== m.theater || m.id >= 4 || !S.alive) && m.spawnStart) {
    S.player.pos.set(m.spawnStart[0], DECK_TOP + 1.7, m.spawnStart[1]);
    S.player.feetY = DECK_TOP; S.player.velY = 0; S.player.onGround = true;
    S.yaw = S.targetYaw = Math.PI / 2;
    S.pitch = S.targetPitch = -0.02;
  }
  if (S.hooks.setSquadAnchors) {
    const firstSquad = m.phases && m.phases[0] && m.phases[0].squad ? m.phases[0].squad : [[41, 3.5], [29, -2.1]];
    S.hooks.setSquadAnchors(firstSquad[0], firstSquad[1], m.theater === 'bridge');
  }

  if (m.storyStart) showStorySubtitle(m.storyStart[0], m.storyStart[1], 7.0);

  if (m.phases && m.phases.length) {
    S.toSpawn = 0;
    startStoryPhase(0);
  } else {
    S.storyObjectiveText = 'Contener el asalto japonés en Lugouqiao';
    renderObjectiveHud();
  }
}

export function advanceStoryPhase() {
  if (!S.storyMission || !S.storyMission.phases) return;
  addScore(150);
  // Light field resupply between phases
  S.player.hp = Math.min(100, S.player.hp + 15);
  S.bandages = Math.min(4, S.bandages + 1);
  WEAPONS.rifle.reserve = Math.min(180, WEAPONS.rifle.reserve + 25);
  WEAPONS.mp18.reserve = Math.min(256, WEAPONS.mp18.reserve + 24);
  playSupply();
  if (S.hooks.updateHUD) S.hooks.updateHUD();

  const next = S.storyPhase + 1;
  if (next >= S.storyMission.phases.length) completeCurrentMission();
  else startStoryPhase(next);
}

export function completeCurrentMission() {
  const m = S.storyMission;
  clearStorySetPieces();
  S.storyPhaseDone = true;
  renderObjectiveHud();
  if (!m) return;

  if (m.storyMid) showStorySubtitle(m.storyMid[0], m.storyMid[1], 6.0);

  const curIdx = S.wave;
  if (curIdx === 3) unlockMedal('wanping_hero');
  if (curIdx === 4) unlockMedal('sihang_hero');

  if (curIdx < 7) {
    const nextIdx = curIdx + 1;
    if (S.hooks.showTacticalBriefing) {
      S.hooks.showTacticalBriefing(nextIdx, () => {
        if (S.hooks.startWave) S.hooks.startWave(nextIdx);
      });
    } else if (S.hooks.startWave) {
      S.hooks.startWave(nextIdx);
    }
  } else {
    unlockMedal('china_liberated');
    if (S.hooks.victory) S.hooks.victory();
  }
}

export function damageStoryTarget(tgt, dmg, hitPos = null, weaponName = 'Fusil') {
  if (!tgt || tgt.destroyed || tgt.type !== 'mg_nest') return false;
  tgt.hp -= dmg;
  spawnPooledImpact(hitPos || new THREE.Vector3(tgt.x, DECK_TOP + 1.1, tgt.z), 0xffb24a, 5);
  if (S.hooks.flashHitmarker) S.hooks.flashHitmarker(true);
  if (S.hooks.spawnDamageNumber) S.hooks.spawnDamageNumber(hitPos || new THREE.Vector3(tgt.x, DECK_TOP + 1.6, tgt.z), dmg, 'crit');
  if (tgt.hp <= 0) {
    tgt.destroyed = true;
    for (const hb of tgt.hitboxes) {
      const i = S.enemyHitboxes.indexOf(hb);
      if (i >= 0) S.enemyHitboxes.splice(i, 1);
    }
    if (tgt.group) S.scene.remove(tgt.group);
    spawnArtilleryBlast(tgt.x, DECK_TOP, tgt.z);
    addScore(250);
    if (S.hooks.addKillfeedEntry) {
      S.hooks.addKillfeedEntry({ killer: 'Tú', victim: 'Nido de Ametralladora', weapon: weaponName, headshot: true, pts: 250 });
    }
    syncWaypointToActiveTarget();
    advanceStoryPhase();
  } else {
    S.storyProgress = Math.round(((tgt.maxHp - tgt.hp) / tgt.maxHp) * 100);
    renderObjectiveHud();
  }
  return true;
}

function plantBombOnTarget(tgt) {
  if (!tgt || tgt.planted || tgt.destroyed) return false;
  tgt.planted = true;
  const bomb = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.24, 0.34),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 0.25, 0.18) })
  );
  bomb.position.set(tgt.x + 0.55, DECK_TOP + 1.0, tgt.z);
  S.scene.add(bomb);
  S.plantedBombs.push({ mesh: bomb, tgt, timer: 3.6, tickT: 0.55 });
  playBombPlant();
  if (S.hooks.showMsg) S.hooks.showMsg(`CARGA PLANTADA EN ${tgt.label} · ¡RETROCEDE!`, 2.0);
  syncWaypointToActiveTarget();
  return true;
}

export function getStoryInteractPrompt() {
  if (!S.alive || S.player.feetY > 8.5) return null;
  for (const t of S.storyTargets) {
    if (t.destroyed || t.planted) continue;
    if (t.type !== 'sabotage' && t.type !== 'flag') continue;
    const d = Math.hypot(S.player.pos.x - t.x, S.player.pos.z - t.z);
    if (d < 4.8) {
      return t.type === 'flag'
        ? '[E] Izar la Bandera de la Victoria de 1945'
        : `[E] Plantar carga explosiva (${t.label})`;
    }
  }
  return null;
}

export function tryStoryInteract() {
  if (!S.alive || S.player.feetY > 8.5) return false;
  for (const t of S.storyTargets) {
    if (t.destroyed || t.planted) continue;
    const d = Math.hypot(S.player.pos.x - t.x, S.player.pos.z - t.z);
    if (d >= 4.8) continue;
    if (t.type === 'sabotage') return plantBombOnTarget(t);
    if (t.type === 'flag') {
      t.destroyed = true;
      S.storyFlagRaised = true;
      S.storyProgress = 100;
      S.storyWaypoint = null;
      if (t.group) { S.scene.remove(t.group); }
      playVictoryFanfare();
      addScore(1000);
      unlockMedal('china_liberated');
      showStorySubtitle('VICTORIA DE 1945 · 抗战胜利', '¡La bandera china vuelve a ondear libre! Tras ocho años de lucha heroica desde Lugouqiao hasta 1945, la invasión ha sido derrotada.', 7.0);
      renderObjectiveHud();
      flagEndTimer = setTimeout(() => {
        if (S.alive && S.hooks.victory) S.hooks.victory();
      }, 1700);
      return true;
    }
  }
  return false;
}

export function updateObjectiveMarker() {
  const el = $('objMarker');
  if (!el) return;
  const wp = S.storyWaypoint;
  if (!wp || !S.alive || S.paused || S.cinematic || S.tacticalBrief || S.shopOpen || S.inventoryOpen || !S.camera) {
    el.style.opacity = '0';
    return;
  }
  _proj.set(wp.x, wp.y, wp.z);
  const dist = S.player.pos.distanceTo(_proj);
  _proj.project(S.camera);
  if (_proj.z > 1) { _proj.x = -_proj.x; _proj.y = -_proj.y; }
  const w = window.innerWidth, h = window.innerHeight;
  let px = (_proj.x * 0.5 + 0.5) * w;
  let py = (-_proj.y * 0.5 + 0.5) * h;
  px = Math.max(66, Math.min(w - 66, px));
  py = Math.max(74, Math.min(h - 118, py));
  el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%)`;
  el.style.opacity = '1';
  if ($('objMarkerLabel')) $('objMarkerLabel').textContent = `◆ ${wp.label} · ${Math.round(dist)}m`;
}

export function updateStory(dt, t) {
  if (S.shellshockT > 0) {
    S.shellshockT = Math.max(0, S.shellshockT - dt);
    if ($('shellshockOverlay')) $('shellshockOverlay').style.opacity = Math.min(0.65, S.shellshockT * 0.45).toFixed(2);
  }
  if (S.storyFlagRaised && S.storyFlagMesh && S.storyFlagMesh.position.y < DECK_TOP + 9.4) {
    S.storyFlagMesh.position.y = Math.min(DECK_TOP + 9.4, S.storyFlagMesh.position.y + dt * 4.8);
  }

  // Animate beacons & enemy MG nest fire
  for (const tgt of S.storyTargets) {
    if (tgt.destroyed) continue;
    if (tgt.beacon) {
      tgt.beacon.gem.rotation.y += dt * 2.2;
      const sc = 0.9 + Math.sin(t * 4.5) * 0.14;
      tgt.beacon.ring.scale.set(sc, sc, 1);
    }
    if (tgt.type === 'mg_nest') {
      if (tgt.flashT > 0) {
        tgt.flashT -= dt;
        if (tgt.flashT <= 0 && tgt.flash) tgt.flash.visible = false;
      }
      tgt.fireT -= dt;
      if (tgt.fireT <= 0 && tgt.burst <= 0) {
        tgt.burst = 3;
        tgt.burstT = 0;
        tgt.fireT = 2.6 + Math.random() * 0.8;
      }
      if (tgt.burst > 0) {
        tgt.burstT -= dt;
        if (tgt.burstT <= 0) {
          tgt.burst--; tgt.burstT = 0.14;
          tgt.flashT = 0.06;
          if (tgt.flash) tgt.flash.visible = true;
          const from = new THREE.Vector3(tgt.x + 1.75, DECK_TOP + 1.2, tgt.z);
          const plTarget = S.player.pos.clone().add(new THREE.Vector3(0, -0.15, 0));
          const dir = new THREE.Vector3().subVectors(plTarget, from);
          const dLen = dir.length() || 1;
          dir.divideScalar(dLen);
          S.raycaster.set(from, dir); S.raycaster.far = dLen;
          const obs = S.raycaster.intersectObjects(S.worldColliders, false).filter(h => h.object.visible !== false);
          if (obs.length) {
            spawnPooledImpact(obs[0].point, 0xc8b896, 3);
            spawnPooledTracer(from, obs[0].point, 0xff9c5b);
          } else {
            const cov = (S.mgMounted ? 0.5 : (S.crouching ? 0.55 : 1.0));
            const hit = Math.random() < (0.28 * cov) && dLen < 68;
            const to = plTarget.clone();
            if (!hit) { to.z += (Math.random() - 0.5) * 2.4; to.y += (Math.random() - 0.3) * 1.2; }
            spawnPooledTracer(from, to, 0xff9c5b);
            noiseBurst(0.08, 0.12, 1200, from);
            if (hit) applyPlayerDamage(6, new THREE.Vector3(tgt.x, DECK_TOP, tgt.z));
          }
        }
      }
    }
  }

  // Planted explosive bombs countdown
  for (let i = S.plantedBombs.length - 1; i >= 0; i--) {
    const b = S.plantedBombs[i];
    b.timer -= dt;
    b.tickT -= dt;
    if (b.tickT <= 0) {
      b.tickT = b.timer < 1.3 ? 0.22 : 0.55;
      playBombTick(b.timer < 1.3);
      if (b.mesh && b.mesh.material) {
        const bright = Math.sin(t * 24) > 0 ? 2.2 : 0.6;
        b.mesh.material.color.setRGB(bright, 0.2, 0.15);
      }
    }
    if (b.timer <= 0) {
      const tgt = b.tgt;
      S.scene.remove(b.mesh);
      S.plantedBombs.splice(i, 1);
      tgt.destroyed = true;
      if (tgt.group) S.scene.remove(tgt.group);
      const bp = new THREE.Vector3(tgt.x, DECK_TOP, tgt.z);
      spawnArtilleryBlast(tgt.x, DECK_TOP, tgt.z);
      for (let k = 0; k < 10; k++) spawnFireParticle(bp, 0xff7722, 3.2, 1.3);
      S.shellshockT = 1.5;
      playShellshock();
      addScore(300);
      if (S.hooks.addKillfeedEntry) {
        S.hooks.addKillfeedEntry({ killer: 'Tú', victim: tgt.label, weapon: 'Carga C4', headshot: true, pts: 300 });
      }
      for (const e of S.enemies) {
        if (!e.userData.dead && e.position.distanceTo(bp) < 9.0) {
          e.userData.hp = 0;
          if (S.hooks.killEnemy) S.hooks.killEnemy(e, true, { weapon: 'Sabotaje' });
        }
      }
      syncWaypointToActiveTarget();
    }
  }

  // Evaluate story mission phase progression (chapters 4..7)
  const m = S.storyMission;
  if (S.gameMode !== 'campaign' || !m || !m.phases || S.storyPhaseDone) {
    renderObjectiveHud();
    return;
  }
  const phase = m.phases[S.storyPhase];
  if (!phase) return;

  const liveEnemies = S.enemies.filter(e => !e.userData.dead).length;
  const tankAlive = !!(S.tankette && !S.tankette.userData.dead);

  if (phase.type === 'clear_sector') {
    const total = Math.max(1, phase.spawn ? phase.spawn.count : 5);
    S.storyProgress = Math.round(((total - Math.min(total, liveEnemies)) / total) * 100);
    if (liveEnemies === 0) advanceStoryPhase();
  } else if (phase.type === 'destroy_nest') {
    const nest = S.storyTargets.find(x => !x.destroyed);
    if (!nest) advanceStoryPhase();
  } else if (phase.type === 'sabotage' || phase.type === 'sabotage_dual') {
    const total = S.storyTargets.length || 1;
    const doneCount = S.storyTargets.filter(x => x.destroyed).length;
    S.storyProgress = Math.round((doneCount / total) * 100);
    if (doneCount >= total && S.plantedBombs.length === 0) advanceStoryPhase();
  } else if (phase.type === 'hold_timer') {
    S.storyHoldTimer = Math.max(0, S.storyHoldTimer - dt);
    S.storyProgress = Math.round(((S.storyHoldMax - S.storyHoldTimer) / Math.max(1, S.storyHoldMax)) * 100);
    // Keep pressure alive with occasional spawns during holdout
    if (liveEnemies < 3 && S.storyHoldTimer > 3.5 && S.hooks.spawnEnemy) {
      const roles = phase.spawn && phase.spawn.roles ? phase.spawn.roles : ['rifleman', 'charger'];
      S.hooks.spawnEnemy(roles[Math.floor(Math.random() * roles.length)], 'main');
    }
    if (S.storyHoldTimer <= 0) {
      for (const e of S.enemies) {
        if (!e.userData.dead) { e.userData.hp = 0; if (S.hooks.killEnemy) S.hooks.killEnemy(e, true, { weapon: 'Cerco Aliado', isAlly: true }); }
      }
      advanceStoryPhase();
    }
  } else if (phase.type === 'hold_boss') {
    const tu = S.tankette ? S.tankette.userData : null;
    S.storyProgress = tu && !tu.dead ? Math.round(((tu.maxHp - tu.hp) / tu.maxHp) * 100) : 100;
    if (!tankAlive && liveEnemies === 0) advanceStoryPhase();
  }
  renderObjectiveHud();
}
