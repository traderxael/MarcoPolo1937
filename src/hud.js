import * as THREE from 'three';
import { MEDALS, SHOP_ITEMS, SQUAD_ORDERS, TACTICAL_BRIEFINGS, WEAPONS } from './config.js';
import { $, S, addScore } from './state.js';
import { playMedalSound, playRadioChirp, playStreakSound, playSupply } from './audio.js';

const damageNumbers = [];
const _dmgProjVec = new THREE.Vector3();
let currentCrosshairGap = 10;
let _lastChGapStr = '';
let _lastLockHint = null;
const killfeedItems = [];
let streakBannerTimer = 0;
let medalToastTimer = null;

export function showMsg(txt, time = 1.5) {
  const el = $('msg');
  if (!el) return;
  el.textContent = txt;
  el.style.opacity = '1';
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => { el.style.opacity = '0'; }, time * 1000);
}

export function showRadio(sender, text, dur = 5.5) {
  if (!$('radioBox')) return;
  $('radioSender').textContent = sender;
  $('radioTxt').textContent = text;
  $('radioBox').style.opacity = '1';
  playRadioChirp();
  clearTimeout(showRadio._t);
  showRadio._t = setTimeout(() => { $('radioBox').style.opacity = '0'; }, dur * 1000);
}

export function showWaveBanner(zh, es) {
  if (!$('waveBanner')) return;
  $('wbZh').textContent = zh;
  $('wbEs').textContent = es;
  $('waveBanner').style.opacity = '1';
  clearTimeout(showWaveBanner._t);
  showWaveBanner._t = setTimeout(() => { $('waveBanner').style.opacity = '0'; }, 2600);
}

export function showMedalToast(medal) {
  const el = $('medalToast');
  if (!el || !medal) return;
  $('mtTitle').textContent = `MEDALLA DESBLOQUEADA · ${medal.title}`;
  $('mtDesc').textContent = medal.desc;
  el.classList.add('show');
  playMedalSound();
  clearTimeout(medalToastTimer);
  medalToastTimer = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

export function flashHitmarker(headshot) {
  const hm = $('hitmarker');
  if (!hm) return;
  hm.style.color = headshot ? '#e8c87a' : '#f2ead6';
  hm.style.opacity = '1';
  clearTimeout(flashHitmarker._t);
  flashHitmarker._t = setTimeout(() => { hm.style.opacity = '0'; }, 110);
}

export function flashDamage() {
  const df = $('damageFlash');
  if (!df) return;
  df.style.opacity = '1';
  clearTimeout(flashDamage._t);
  flashDamage._t = setTimeout(() => { df.style.opacity = '0'; }, 180);
}

export function showDirDamage(fromPos) {
  const dd = $('dirDmg');
  if (!fromPos || !dd) return;
  const dx = fromPos.x - S.player.pos.x, dz = fromPos.z - S.player.pos.z;
  const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw);
  const rx = Math.cos(S.yaw),  rz = -Math.sin(S.yaw);
  const deg = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI;
  dd.style.transform = `rotate(${deg.toFixed(1)}deg)`;
  dd.style.opacity = '1';
  clearTimeout(showDirDamage._t);
  showDirDamage._t = setTimeout(() => { dd.style.opacity = '0'; }, 420);
}

export function updateLockHint() {
  const el = $('lockHint');
  if (!el) return;
  const needLock = S.alive && !S.paused && !S.cinematic && !S.tacticalBrief && !S.shopOpen && !S.squadWheelOpen && !S.inventoryOpen &&
    !isTouchActive() && document.pointerLockElement !== S.renderer?.domElement;
  if (needLock !== _lastLockHint) {
    _lastLockHint = needLock;
    el.style.opacity = needLock ? '1' : '0';
  }
}

export function spawnDamageNumber(worldPos, amount, kind = 'normal') {
  const layer = $('damageNumbers');
  if (!layer || !worldPos) return;
  if (damageNumbers.length >= 24) {
    const old = damageNumbers.shift();
    if (old.el.parentNode) old.el.remove();
  }
  const el = document.createElement('div');
  el.className = 'dmgNum' + (kind !== 'normal' ? ' ' + kind : '');
  el.style.opacity = '0';
  el.textContent = String(Math.max(1, Math.round(amount)));
  layer.appendChild(el);
  const jitter = new THREE.Vector3((Math.random() - 0.5) * 0.42, 0.12 + Math.random() * 0.26, (Math.random() - 0.5) * 0.42);
  damageNumbers.push({
    el,
    worldPos: worldPos.clone().add(jitter),
    life: 0.78,
    max: 0.78,
    vy: (kind === 'crit' || kind === 'blast' || kind === 'fire') ? 1.55 : 1.15,
    crit: kind === 'crit' || kind === 'blast'
  });
}

export function updateDamageNumbers(dt) {
  const w = window.innerWidth, h = window.innerHeight;
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.life -= dt;
    if (d.life <= 0) {
      if (d.el.parentNode) d.el.remove();
      damageNumbers.splice(i, 1);
      continue;
    }
    d.worldPos.y += d.vy * dt;
    d.vy *= Math.pow(0.22, dt);
    _dmgProjVec.copy(d.worldPos).project(S.camera);
    if (_dmgProjVec.z > 1 || _dmgProjVec.z < -1) {
      d.el.style.opacity = '0';
      continue;
    }
    const px = (_dmgProjVec.x * 0.5 + 0.5) * w;
    const py = (-_dmgProjVec.y * 0.5 + 0.5) * h;
    const age = 1 - (d.life / d.max);
    const sc = d.crit ? (1.32 - 0.32 * Math.min(1, age * 2.5)) : (1.08 - 0.08 * Math.min(1, age * 2));
    const op = Math.min(1, d.life / 0.24);
    d.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(2)})`;
    d.el.style.opacity = op.toFixed(2);
  }
}

export function clearDamageNumbers() {
  damageNumbers.length = 0;
  const layer = $('damageNumbers');
  if (layer) layer.replaceChildren();
}

export function updateCrosshair(dt, isMoving) {
  const ch = $('crosshair');
  if (!ch) return;
  const w = WEAPONS[S.current];
  const isMelee = !S.mgMounted && w.melee;
  ch.classList.toggle('melee', isMelee);
  ch.classList.toggle('ads', S.aiming && !isMelee);
  ch.style.opacity = (S.aiming && !isMelee && !S.thirdPerson) ? '0.68' : '0.92';

  if (S.bloomHoldTimer > 0) S.bloomHoldTimer = Math.max(0, S.bloomHoldTimer - dt);
  else S.crosshairBloom = Math.max(0, S.crosshairBloom - dt * 2.1);

  const adsMult = (S.aiming && !isMelee && !S.mgMounted) ? 0.42 : 1.0;
  let targetGap = S.mgMounted ? 11 : (S.current === 'pistol' ? 10 : (S.current === 'mp18' ? 14 : 12));
  if (S.aiming && !isMelee) targetGap *= 0.36;
  if (S.crouching && !S.mgMounted) targetGap *= 0.72;
  if (isMoving && !S.mgMounted) targetGap += ((S.running && !S.aiming) ? 9 : 4.5) * adsMult;
  if (!S.player.onGround && !S.mgMounted) targetGap += 12 * adsMult;
  targetGap += S.crosshairBloom * 17 * adsMult;
  targetGap = Math.max(3, Math.min(38, targetGap));

  currentCrosshairGap += (targetGap - currentCrosshairGap) * Math.min(1, dt * 22);
  const gapStr = currentCrosshairGap.toFixed(1) + 'px';
  if (gapStr !== _lastChGapStr) {
    _lastChGapStr = gapStr;
    ch.style.setProperty('--ch-gap', gapStr);
  }
}

export function getCrosshairState() {
  return { gap: +currentCrosshairGap.toFixed(1), bloom: +S.crosshairBloom.toFixed(2), dmgCount: damageNumbers.length };
}

export function addKillfeedEntry({ killer = 'Tú', victim = 'Fusilero japonés', weapon = 'Fusil', headshot = false, pts = 0, isAlly = false }) {
  const kf = $('killfeed');
  if (!kf) return;
  while (killfeedItems.length >= 5) {
    const old = killfeedItems.shift();
    if (old.el.parentNode) old.el.remove();
  }
  const item = document.createElement('div');
  item.className = 'kf-item' + (isAlly ? ' ally' : '') + (headshot ? ' hs' : '');
  const kSpan = document.createElement('b'); kSpan.textContent = killer;
  const wSpan = document.createElement('span'); wSpan.className = 'kf-wpn'; wSpan.textContent = `[${weapon}]` + (headshot ? ' ⌖' : '');
  const vSpan = document.createElement('span'); vSpan.textContent = '→ ' + victim;
  item.append(kSpan, wSpan, vSpan);
  if (pts > 0) {
    const pSpan = document.createElement('span'); pSpan.className = 'kf-pts'; pSpan.textContent = `+${pts}`;
    item.append(pSpan);
  }
  kf.appendChild(item);
  requestAnimationFrame(() => item.classList.add('show'));
  killfeedItems.push({ el: item, life: 4.5, fading: false });
}

export function showStreakBanner(main, sub) {
  const sb = $('streakBanner');
  if (!sb) return;
  $('sbMain').textContent = main;
  $('sbSub').textContent = sub;
  sb.classList.remove('show');
  void sb.offsetWidth;
  sb.classList.add('show');
  streakBannerTimer = 2.4;
}

export function registerPlayerKill() {
  S.streakCount = (S.streakTimer > 0) ? S.streakCount + 1 : 1;
  S.streakTimer = 6.0;
  if (S.streakCount < 2) return;
  let zh = '双杀', es = '¡DOBLE BAJA!', bonus = 50;
  if (S.streakCount === 3) { zh = '三杀'; es = '¡TRIPLE BAJA!'; bonus = 100; }
  else if (S.streakCount >= 4) {
    zh = S.streakCount === 4 ? '四杀' : `连杀 x${S.streakCount}`;
    es = '¡IMPARABLE!';
    bonus = Math.min(300, 150 + (S.streakCount - 4) * 50);
  }
  addScore(bonus);
  playStreakSound(S.streakCount);
  showStreakBanner(`${zh} · ${es}`, `RACHA DE ${S.streakCount} ELIMINACIONES · +${bonus} PTS`);
}

export function updateKillfeedAndStreak(dt) {
  for (let i = killfeedItems.length - 1; i >= 0; i--) {
    const it = killfeedItems[i];
    it.life -= dt;
    if (it.life <= 0.25 && !it.fading) {
      it.fading = true;
      it.el.classList.remove('show');
      it.el.classList.add('fade');
    }
    if (it.life <= 0) {
      if (it.el.parentNode) it.el.remove();
      killfeedItems.splice(i, 1);
    }
  }
  if (streakBannerTimer > 0) {
    streakBannerTimer -= dt;
    if (streakBannerTimer <= 0 && $('streakBanner')) $('streakBanner').classList.remove('show');
  }
}

export function clearKillfeed() {
  killfeedItems.length = 0;
  const kf = $('killfeed');
  if (kf) kf.replaceChildren();
  streakBannerTimer = 0;
  if ($('streakBanner')) $('streakBanner').classList.remove('show');
}

export function updateHUD() {
  const w = WEAPONS[S.current];
  if ($('hpbar')) $('hpbar').style.width = Math.max(0, Math.min(100, S.player.hp)) + '%';
  if ($('armorBar')) $('armorBar').style.width = Math.max(0, Math.min(100, (S.player.armor / 50) * 100)) + '%';
  if (S.mgMounted) {
    $('wname').textContent = 'Tipo 24 · Ametralladora fija [F]';
    $('ammo').textContent = S.mgOverheated ? 'SOBRECALENTADA' : `${Math.round((1 - S.mgHeat) * 100)}%`;
    $('mgHeatWrap').classList.remove('hidden');
    $('mgHeatBar').style.width = Math.min(100, Math.round(S.mgHeat * 100)) + '%';
    $('mgHeatBar').style.background = S.mgOverheated ? '#ff4433' : (S.mgHeat > 0.7 ? '#f08a24' : '#e8c87a');
  } else {
    $('wname').textContent = w.name;
    $('ammo').textContent = w.melee ? '∞' : `${w.ammo} / ${w.reserve}`;
    $('mgHeatWrap').classList.add('hidden');
  }
  if ($('grenadeCount')) $('grenadeCount').textContent = S.grenades;
  if ($('molotovCount')) $('molotovCount').textContent = S.molotovs;
  if ($('bandageCount')) $('bandageCount').textContent = S.bandages;
  if ($('mortarCount'))  $('mortarCount').textContent  = S.mortarStrikes;
  if ($('scoreVal'))     $('scoreVal').textContent     = S.stats.score;
  if ($('squadHud'))     $('squadHud').textContent     = `ESCUADRÓN [T]: ${(SQUAD_ORDERS[S.squadOrder] || SQUAD_ORDERS.cover).label}`;
  const remaining = S.toSpawn + S.enemies.filter(e => !e.userData.dead).length + (S.tankette && !S.tankette.userData.dead ? 1 : 0);
  if ($('enemyCount')) $('enemyCount').textContent = remaining;
}

export function drawRadar() {
  const cvs = $('radar');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height;
  ctx.clearRect(0, 0, W, H);

  const toX = x => 6 + ((x + 62) / 140) * 154;
  const toY = z => 36 + (z / 16) * 26;

  if (S.currentTheater === 'bridge') {
    // Railway Bridge (top band z = -15..-11)
    ctx.fillStyle = '#1e2228';
    ctx.fillRect(toX(-58), toY(-15.5), toX(60) - toX(-58), toY(-10.5) - toY(-15.5));
    ctx.fillRect(toX(44.5), toY(-11.5), toX(54.5) - toX(44.5), toY(-4.5) - toY(-11.5));
    // Main Lugouqiao deck & Wanping battlements
    ctx.fillStyle = '#25282e';
    ctx.fillRect(toX(-62), toY(-5), toX(62) - toX(-62), toY(5) - toY(-5));
    ctx.strokeStyle = '#6d6350';
    ctx.strokeRect(toX(-62), toY(-5), toX(62) - toX(-62), toY(5) - toY(-5));
    ctx.fillStyle = '#4e463a';
    ctx.fillRect(toX(68), 4, 14, H - 8);
  } else {
    ctx.fillStyle = '#24272d';
    ctx.fillRect(toX(-60), toY(-14), toX(60) - toX(-60), toY(14) - toY(-14));
    ctx.strokeStyle = '#6d6350';
    ctx.strokeRect(toX(-60), toY(-14), toX(60) - toX(-60), toY(14) - toY(-14));
  }

  // Sandbags, barrels, crate, MG, loot
  for (const sc of S.sandbagClusters) {
    if (sc.broken) continue;
    ctx.fillStyle = '#8c7f61';
    ctx.fillRect(toX(sc.x) - 2, toY(sc.z) - 2, 4, 4);
  }
  for (const b of S.explosiveBarrels) {
    if (b.exploded) continue;
    ctx.fillStyle = '#f0643b';
    ctx.fillRect(toX(b.x) - 1.5, toY(b.z) - 1.5, 3, 3);
  }
  ctx.fillStyle = '#e8c87a';
  ctx.fillRect(toX(S.supplyCratePos.x) - 2, toY(S.supplyCratePos.z) - 2, 4, 4);
  ctx.fillStyle = S.mgMounted ? '#55e0ff' : '#d5a23c';
  ctx.fillRect(toX(S.mgPos.x) - 2.5, toY(S.mgPos.z) - 2.5, 5, 5);
  for (const d of S.lootDrops) {
    ctx.fillStyle = '#7dffb3';
    ctx.fillRect(toX(d.x) - 1.5, toY(d.z) - 1.5, 3, 3);
  }
  for (const st of S.storyTargets) {
    if (st.destroyed) continue;
    ctx.fillStyle = st.planted ? '#ff3b24' : '#ffd447';
    ctx.fillRect(toX(st.x) - 3, toY(st.z) - 3, 6, 6);
  }

  // Enemy mortar warning rings
  for (const m of S.enemyMortars) {
    ctx.strokeStyle = '#ff3b24'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(toX(m.x), toY(m.z), 4.5, 0, Math.PI * 2); ctx.stroke();
  }

  // Allies
  for (const d of S.defenders) {
    if (d.fallen) continue;
    ctx.fillStyle = '#6fc97a';
    ctx.beginPath(); ctx.arc(toX(d.s.position.x), toY(d.s.position.z), 2.3, 0, Math.PI * 2); ctx.fill();
  }

  // Enemies
  for (const e of S.enemies) {
    if (e.userData.dead) continue;
    const r = e.userData.role;
    ctx.fillStyle = r === 'officer' ? '#ffd24d' : (r === 'charger' ? '#ff8833' : (r === 'sniper' ? '#cc66ff' : (r === 'mortar' ? '#55b2ff' : '#e04538')));
    ctx.beginPath(); ctx.arc(toX(e.position.x), toY(e.position.z), (r === 'officer' || r === 'mortar') ? 2.8 : 2.1, 0, Math.PI * 2); ctx.fill();
  }
  if (S.tankette && !S.tankette.userData.dead) {
    ctx.fillStyle = '#ff3b24';
    ctx.fillRect(toX(S.tankette.position.x) - 4, toY(S.tankette.position.z) - 3, 8, 6);
  }

  // Player + facing
  const px = toX(S.player.pos.x), py = toY(S.player.pos.z);
  ctx.strokeStyle = '#f2ead6'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.sin(S.yaw) * 9, py - Math.cos(S.yaw) * 9); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(px, py, 2.7, 0, Math.PI * 2); ctx.fill();
}

export function renderMedals(containerId) {
  const el = $(containerId);
  if (!el) return;
  const unlocked = new Set(S.records.medals || []);
  const nodes = MEDALS.map(m => {
    const b = document.createElement('div');
    b.className = 'medalBadge' + (unlocked.has(m.id) ? ' unlocked' : '');
    b.title = m.desc;
    b.textContent = (unlocked.has(m.id) ? '★ ' : '☆ ') + m.title;
    return b;
  });
  el.replaceChildren(...nodes);
}

export function renderAllMedals() {
  ['introMedals', 'gameoverMedals', 'outroMedals', 'shopMedals'].forEach(renderMedals);
}

export function updateRecordBanner() {
  const el = $('recordBanner');
  if (el) el.textContent = `RÉCORDS LOCALES — Campaña: ${S.records.bestCampaign} pts · Supervivencia: ${S.records.bestSurvival} pts (Oleada ${S.records.bestWave})`;
}

export function getRank(sc) {
  if (sc >= 4500) return 'S · 抗日英雄';
  if (sc >= 2800) return 'A · 精锐老兵';
  if (sc >= 1600) return 'B · 顽强守军';
  if (sc >= 700)  return 'C · 新兵战士';
  return 'D · 阵地初阵';
}

export function renderStats(containerId) {
  const el = $(containerId);
  if (!el) return;
  const acc = S.stats.shots ? Math.round(S.stats.hits * 100 / S.stats.shots) : 0;
  const sec = Math.max(1, Math.round((performance.now() - S.stats.startTime) / 1000));
  const pairs = [
    ['BAJAS', String(S.stats.kills)],
    ['A LA CABEZA', String(S.stats.headshots)],
    ['PRECISIÓN', `${acc}%`],
    ['TIEMPO', `${sec}s`],
    ['PUNTOS', String(S.stats.score)],
    ['RANGO', getRank(S.stats.score)]
  ];
  const nodes = pairs.map(([label, val]) => {
    const box = document.createElement('div');
    box.append(document.createTextNode(label));
    const b = document.createElement('b');
    b.textContent = val;
    box.append(b);
    return box;
  });
  el.replaceChildren(...nodes);
}

export function renderChinaCampaignMap(canvas, chapterIdx = 4, animT = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#181510';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(232,200,122,0.14)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 64) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 40; gy < H; gy += 64) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // China landmass silhouette (stylized eastern & central theaters)
  ctx.fillStyle = '#2b2419';
  ctx.strokeStyle = '#78684b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.14, H * 0.14);
  ctx.lineTo(W * 0.72, H * 0.10);
  ctx.lineTo(W * 0.79, H * 0.25);
  ctx.lineTo(W * 0.68, H * 0.34);
  ctx.lineTo(W * 0.80, H * 0.48);
  ctx.lineTo(W * 0.78, H * 0.64);
  ctx.lineTo(W * 0.68, H * 0.84);
  ctx.lineTo(W * 0.42, H * 0.88);
  ctx.lineTo(W * 0.16, H * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Yellow & Yangtze Rivers
  ctx.strokeStyle = 'rgba(72,130,172,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W * 0.22, H * 0.34); ctx.quadraticCurveTo(W * 0.48, H * 0.26, W * 0.69, H * 0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.20, H * 0.60); ctx.quadraticCurveTo(W * 0.52, H * 0.64, W * 0.78, H * 0.54); ctx.stroke();

  const nodes = [
    { x: W * 0.62, y: H * 0.22, label: 'BEIPING · LUGOUQIAO (1937)', ch: 0 },
    { x: W * 0.77, y: H * 0.54, label: 'SHANGHÁI · SIHANG (OCT 1937)', ch: 4 },
    { x: W * 0.64, y: H * 0.42, label: 'TAI\'ERZHUANG (ABR 1938)', ch: 5 },
    { x: W * 0.54, y: H * 0.67, label: 'CHANGSHA (1941–1942)', ch: 6 },
    { x: W * 0.41, y: H * 0.70, label: 'HUNAN · VICTORIA (1945)', ch: 7 }
  ];

  // Frontline campaign arc
  const activeNodeIdx = chapterIdx <= 3 ? 0 : (chapterIdx - 3);
  ctx.strokeStyle = chapterIdx === 7 ? '#ffd447' : 'rgba(232,120,68,0.65)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  nodes.forEach((n, idx) => { if (idx === 0) ctx.moveTo(n.x, n.y); else ctx.lineTo(n.x, n.y); });
  ctx.stroke();
  ctx.setLineDash([]);

  // Animated liberation / advance arrow
  const osc = Math.sin(animT * 2.5) * 0.5 + 0.5;
  if (activeNodeIdx > 0 && nodes[activeNodeIdx]) {
    const prev = nodes[activeNodeIdx - 1], cur = nodes[activeNodeIdx];
    const ax = prev.x + (cur.x - prev.x) * osc, ay = prev.y + (cur.y - prev.y) * osc;
    ctx.fillStyle = chapterIdx === 7 ? '#ffd447' : '#ff5638';
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
  }

  nodes.forEach((n, idx) => {
    const done = idx < activeNodeIdx;
    const active = idx === activeNodeIdx;
    ctx.fillStyle = done ? '#7dffb3' : (active ? '#ffd447' : '#8d8779');
    ctx.beginPath(); ctx.arc(n.x, n.y, active ? 7 : 5, 0, Math.PI * 2); ctx.fill();
    if (active) {
      ctx.strokeStyle = '#ffd447'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 12 + Math.sin(animT * 5) * 3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = active ? '#ffd447' : (done ? '#b8f2cd' : '#cfc9bb');
    ctx.font = active ? 'bold 12px sans-serif' : '11px sans-serif';
    ctx.fillText((done ? '✓ ' : '') + n.label, n.x - 56, n.y - 12);
  });

  ctx.fillStyle = '#e8c87a'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FRENTE DE RESISTENCIA CHINA · 1937–1945', 18, 24);
}

// Animated 1937 tactical battlefield map
export function renderTacticalMap(canvas, chapterIdx = 0, animT = 0) {
  if (!canvas) return;
  if (chapterIdx >= 4) {
    renderChinaCampaignMap(canvas, chapterIdx, animT);
    return;
  }
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Parchment & ink background
  ctx.fillStyle = '#241f16';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(232,200,122,0.18)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 40; gy < H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // Yongding River curve
  ctx.fillStyle = '#1e3342';
  ctx.beginPath();
  ctx.moveTo(W * 0.30, 0);
  ctx.quadraticCurveTo(W * 0.42, H * 0.5, W * 0.46, H);
  ctx.lineTo(W * 0.58, H);
  ctx.quadraticCurveTo(W * 0.54, H * 0.5, W * 0.42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#89adc4'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('RÍO YONGDING (永定河)', W * 0.35, H * 0.86);

  // Parallel Railway Bridge (upper)
  ctx.fillStyle = '#4e555e';
  ctx.fillRect(W * 0.14, H * 0.25, W * 0.50, 18);
  ctx.strokeStyle = '#9aa4b0'; ctx.strokeRect(W * 0.14, H * 0.25, W * 0.50, 18);
  ctx.fillStyle = '#cfc9bb'; ctx.font = '12px sans-serif';
  ctx.fillText('PUENTE FERROVIARIO (铁桥)', W * 0.23, H * 0.22);

  // Lugouqiao Marco Polo Bridge (center)
  ctx.fillStyle = '#8b7d64';
  ctx.fillRect(W * 0.14, H * 0.48, W * 0.54, 28);
  ctx.strokeStyle = '#e8c87a'; ctx.strokeRect(W * 0.14, H * 0.48, W * 0.54, 28);
  ctx.fillStyle = '#ffd447'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('PUENTE DE MARCO POLO · 卢沟桥', W * 0.22, H * 0.44);

  // Wanping Walled Citadel (right)
  ctx.fillStyle = '#4a4032';
  ctx.fillRect(W * 0.71, H * 0.28, W * 0.23, H * 0.48);
  ctx.strokeStyle = '#e8c87a'; ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.71, H * 0.28, W * 0.23, H * 0.48);
  ctx.fillStyle = '#fff2dc'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('WANPING (宛平城)', W * 0.73, H * 0.34);
  ctx.fillStyle = '#9bd18b'; ctx.font = '11px sans-serif';
  ctx.fillText('ALMENAS + MORTERO', W * 0.73, H * 0.40);

  // Animated Japanese red arrows (west -> east)
  const prog = (Math.sin(animT * 2.2) * 0.5 + 0.5) * 28;
  const arrows = [
    [W * 0.08 + prog, H * 0.51, '#e84534'],
    [W * 0.10 + prog * 0.9, H * 0.27, chapterIdx === 2 ? '#ff6a42' : '#9c3228']
  ];
  for (const [ax, ay, col] of arrows) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(ax, ay - 7); ctx.lineTo(ax + 44, ay - 7); ctx.lineTo(ax + 44, ay - 13);
    ctx.lineTo(ax + 64, ay); ctx.lineTo(ax + 44, ay + 13); ctx.lineTo(ax + 44, ay + 7); ctx.lineTo(ax, ay + 7);
    ctx.closePath(); ctx.fill();
  }

  // 29th Army defense line (gold)
  ctx.strokeStyle = '#ffd447'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(W * 0.58, H * 0.44); ctx.lineTo(W * 0.58, H * 0.62); ctx.stroke();
  ctx.fillStyle = '#ffd447'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('29.º EJÉRCITO (第29军)', W * 0.54, H * 0.68);
  if (chapterIdx === 3) {
    ctx.fillStyle = '#ff9c5b';
    ctx.fillText('TANQUETA TIPO 94 · RUPTURA DE TREGUA', W * 0.14, H * 0.64);
  }
}

let briefTypeTimer = null;

export function showTacticalBriefing(chapterIdx, onDone) {
  const ov = $('tacticalMapOverlay');
  if (!ov) { if (onDone) onDone(); return; }
  const info = TACTICAL_BRIEFINGS[Math.min(TACTICAL_BRIEFINGS.length - 1, Math.max(0, chapterIdx))];
  if ($('tacOpCode')) $('tacOpCode').textContent = info.opCode || 'OPERACIÓN LUGOUQIAO';
  if ($('tacTitle')) $('tacTitle').textContent = info.title;
  if ($('tacMeta')) $('tacMeta').textContent = `${info.date || ''} · ${info.location || ''} · ${info.unit || ''}`;
  if ($('tacObjectives')) {
    const items = (info.objectives || []).map(txt => {
      const li = document.createElement('li');
      li.textContent = txt;
      return li;
    });
    $('tacObjectives').replaceChildren(...items);
  }

  clearInterval(briefTypeTimer);
  const capEl = $('tacCaption');
  if (capEl) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      capEl.textContent = info.caption;
    } else {
      capEl.textContent = '';
      let i = 0;
      briefTypeTimer = setInterval(() => {
        i += 3;
        capEl.textContent = info.caption.slice(0, i);
        if (i >= info.caption.length) { clearInterval(briefTypeTimer); briefTypeTimer = null; }
      }, 18);
    }
  }
  ov.classList.remove('hidden');
  S.tacticalBrief = { ch: chapterIdx, start: performance.now(), onDone };
  if (document.pointerLockElement) document.exitPointerLock();
  updateLockHint();
}

export function closeTacticalBriefing() {
  if (!S.tacticalBrief) return;
  clearInterval(briefTypeTimer);
  briefTypeTimer = null;
  const done = S.tacticalBrief.onDone;
  S.tacticalBrief = null;
  if ($('tacticalMapOverlay')) $('tacticalMapOverlay').classList.add('hidden');
  updateLockHint();
  if (done) done();
}

export function toggleSquadWheel(forceState = null) {
  if (!S.alive || S.paused || S.cinematic || S.shopOpen || S.inventoryOpen) return;
  const next = forceState !== null ? forceState : !S.squadWheelOpen;
  S.squadWheelOpen = next;
  if ($('squadWheel')) $('squadWheel').classList.toggle('open', next);
  if (next && document.pointerLockElement) document.exitPointerLock();
  else if (!next && S.hooks.lockPointer && !isTouchActive()) S.hooks.lockPointer();
  updateLockHint();
}

function renderShopCards() {
  const list = $('shopItems');
  if (!list) return;
  if ($('shopPoints')) $('shopPoints').textContent = `${S.stats.score} PTS`;

  const cards = SHOP_ITEMS.map(it => {
    const card = document.createElement('div');
    card.className = 'shopCard';
    const left = document.createElement('div');
    const b = document.createElement('b'); b.textContent = it.title;
    const sm = document.createElement('small'); sm.textContent = it.desc;
    left.append(b, sm);

    const btn = document.createElement('button');
    btn.className = 'shopBuy';
    btn.textContent = `${it.cost} PTS`;
    btn.disabled = S.stats.score < it.cost;
    btn.addEventListener('click', () => buyShopItem(it));
    card.append(left, btn);
    return card;
  });
  list.replaceChildren(...cards);
}

function buyShopItem(item) {
  if (S.stats.score < item.cost) return;
  S.stats.score -= item.cost;
  if (item.id === 'armor50') S.player.armor = 50;
  else if (item.id === 'mp18') {
    if (!S.mp18Owned) S.mp18Owned = true;
    else S.mp18Tier = Math.min(3, S.mp18Tier + 1);
    WEAPONS.mp18.ammo = WEAPONS.mp18.clip;
    WEAPONS.mp18.reserve = Math.min(256, WEAPONS.mp18.reserve + 96);
  } else if (item.id === 'molotov2') S.molotovs = Math.min(4, S.molotovs + 2);
  else if (item.id === 'mortar1') S.mortarStrikes = Math.min(3, S.mortarStrikes + 1);
  else if (item.id === 'pack') {
    S.player.hp = Math.min(100, S.player.hp + 50);
    WEAPONS.rifle.reserve = Math.min(180, WEAPONS.rifle.reserve + 90);
    WEAPONS.pistol.reserve = Math.min(80, WEAPONS.pistol.reserve + 30);
    S.grenades = Math.min(4, S.grenades + 2);
    S.bandages = Math.min(4, S.bandages + 2);
    if (S.hooks.grantSupplyCrateLoot) S.hooks.grantSupplyCrateLoot();
  }
  playSupply();
  renderShopCards();
  updateHUD();
}

export function openShop(onContinue) {
  if (S.hooks.closeInventory) S.hooks.closeInventory(false);
  S.shopOpen = true;
  S.shopContinueCb = onContinue;
  S.mouseDownLeft = false; S.gpFiring = false; S.touchFiring = false;
  if (document.pointerLockElement) document.exitPointerLock();
  renderShopCards();
  renderMedals('shopMedals');
  renderTacticalMap($('shopMapCanvas'), S.wave % 4, 0.5);
  if ($('shopModal')) $('shopModal').classList.remove('hidden');
  updateLockHint();
}

export function closeShop() {
  if (!S.shopOpen) return;
  S.shopOpen = false;
  if ($('shopModal')) $('shopModal').classList.add('hidden');
  const cb = S.shopContinueCb;
  S.shopContinueCb = null;
  updateLockHint();
  if (cb) cb();
}

export function isTouchActive() {
  if (S.touchMode === 'on') return true;
  if (S.touchMode === 'off') return false;
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}

export function syncTouchControlsVisibility() {
  const el = $('touchControls');
  if (!el) return;
  const show = S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.tacticalBrief && !S.inventoryOpen && isTouchActive();
  el.classList.toggle('active', show);
  if (show && document.pointerLockElement) document.exitPointerLock();
}

export function initTouchControls() {
  const stickZone = $('touchStickZone');
  const stickKnob = $('touchStickKnob');
  const lookZone  = $('touchLookZone');
  if (!stickZone || !lookZone) return;

  let stickId = null, lookId = null, lastLx = 0, lastLy = 0;

  stickZone.addEventListener('pointerdown', e => {
    stickId = e.pointerId;
    stickZone.setPointerCapture(e.pointerId);
  });
  stickZone.addEventListener('pointermove', e => {
    if (e.pointerId !== stickId) return;
    const rect = stickZone.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const maxR = rect.width * 0.42;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    stickKnob.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`;
    S.touchMove.x = dx / maxR;
    S.touchMove.y = dy / maxR;
  });
  const resetStick = () => {
    stickId = null;
    S.touchMove.x = 0; S.touchMove.y = 0;
    stickKnob.style.transform = 'translate3d(-50%, -50%, 0)';
  };
  stickZone.addEventListener('pointerup', resetStick);
  stickZone.addEventListener('pointercancel', resetStick);

  lookZone.addEventListener('pointerdown', e => { lookId = e.pointerId; lastLx = e.clientX; lastLy = e.clientY; });
  lookZone.addEventListener('pointermove', e => {
    if (e.pointerId !== lookId) return;
    const dx = e.clientX - lastLx, dy = e.clientY - lastLy;
    lastLx = e.clientX; lastLy = e.clientY;
    S.targetYaw -= dx * 0.0045 * S.mouseSens;
    S.targetPitch = Math.max(-1.35, Math.min(1.35, S.targetPitch - dy * 0.004 * S.mouseSens));
  });
  const endLook = () => { lookId = null; };
  lookZone.addEventListener('pointerup', endLook);
  lookZone.addEventListener('pointercancel', endLook);

  const fireBtn = $('tFireBtn');
  if (fireBtn) {
    fireBtn.addEventListener('pointerdown', () => { S.touchFiring = true; if (!S.mgMounted && S.hooks.shoot) S.hooks.shoot(); });
    fireBtn.addEventListener('pointerup', () => { S.touchFiring = false; });
    fireBtn.addEventListener('pointercancel', () => { S.touchFiring = false; });
  }
  const tap = (id, fn) => { if ($(id)) $(id).addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
  tap('tAdsBtn',    () => { if (!S.mgMounted) S.aiming = !S.aiming; });
  tap('tJumpBtn',   () => { if (S.hooks.triggerJump) S.hooks.triggerJump(); });
  tap('tReloadBtn', () => { if (S.hooks.startReload) S.hooks.startReload(); });
  tap('tGrenBtn',   () => { if (S.hooks.throwGrenade) S.hooks.throwGrenade(); });
  tap('tMolBtn',    () => { if (S.hooks.throwMolotov) S.hooks.throwMolotov(); });
  tap('tHealBtn',   () => { if (S.hooks.useBandage) S.hooks.useBandage(); });
  tap('tCamBtn',    () => { if (S.hooks.toggleCameraMode) S.hooks.toggleCameraMode(); });
  tap('tSquadBtn',  () => { toggleSquadWheel(); });
  tap('tInvBtn',    () => { if (S.hooks.toggleInventory) S.hooks.toggleInventory(); });
  tap('tUseBtn',    () => {
    if (S.hooks.tryStoryInteract && S.hooks.tryStoryInteract()) return;
    if (S.mgMounted || Math.hypot(S.player.pos.x - S.mgPos.x, S.player.pos.z - S.mgPos.z) < 3.2) {
      if (S.hooks.toggleMountMG) S.hooks.toggleMountMG();
    } else if (S.hooks.tryUseSupply) {
      S.hooks.tryUseSupply();
    }
  });
}
