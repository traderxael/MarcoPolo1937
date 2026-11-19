import * as THREE from 'three';
import { DECK_TOP, INVENTORY_ITEMS, INVENTORY_MAX_SLOTS, WEAPONS } from './config.js';
import { $, S, addScore } from './state.js';
import { playBandageSound, playDryFire, playRadioChirp, playSupply, tone } from './audio.js';

const ITEM_MAP = Object.fromEntries(INVENTORY_ITEMS.map(it => [it.id, it]));
const LOOT_BOX_GEO = new THREE.BoxGeometry(0.46, 0.34, 0.36);
const LOOT_RING_GEO = new THREE.RingGeometry(0.30, 0.44, 16);
const LOOT_MAT_CACHE = new Map();

let wantRelock = true;
let pendingCombatAction = null;
let fullMsgCd = 0;

function lootMat(hexStr) {
  if (LOOT_MAT_CACHE.has(hexStr)) return LOOT_MAT_CACHE.get(hexStr);
  const col = new THREE.Color(hexStr || '#e8c87a');
  const m = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col.clone().multiplyScalar(0.32),
    roughness: 0.55,
    metalness: 0.25
  });
  LOOT_MAT_CACHE.set(hexStr, m);
  return m;
}

function ringMat(hexStr) {
  const k = 'ring_' + hexStr;
  if (LOOT_MAT_CACHE.has(k)) return LOOT_MAT_CACHE.get(k);
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hexStr || '#e8c87a'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });
  LOOT_MAT_CACHE.set(k, m);
  return m;
}

export function getInventoryUsedSlots() {
  let sum = 0;
  for (const it of INVENTORY_ITEMS) {
    if (it.cat === 'supply') sum += Math.max(0, S.inventory[it.id] || 0);
  }
  return sum;
}

export function syncInventoryBadge() {
  const el = $('invBadgeCount');
  if (el) el.textContent = `${getInventoryUsedSlots()}/${INVENTORY_MAX_SLOTS}`;
  const bTag = $('boostTag');
  if (bTag) bTag.textContent = S.boostTimer > 0 ? `[TÓNICO ${Math.ceil(S.boostTimer)}s]` : '';
}

export function resetInventory() {
  S.inventory = { ration: 1, plate: 1, ammo_pouch: 1, flare_kit: 0, adrenaline: 1, intel_doc: 0 };
  S.boostTimer = 0;
  S.inventoryFilter = 'all';
  S.inventorySelected = 'rifle';
  pendingCombatAction = null;
  syncInventoryBadge();
}

export function addInventoryItem(itemId, qty = 1, silent = false) {
  const spec = ITEM_MAP[itemId];
  if (!spec || spec.cat !== 'supply' || qty <= 0) return 0;
  const freeTotal = Math.max(0, INVENTORY_MAX_SLOTS - getInventoryUsedSlots());
  const cur = Math.max(0, S.inventory[itemId] || 0);
  const freeStack = Math.max(0, (spec.maxStack || 4) - cur);
  const add = Math.min(qty, freeTotal, freeStack);
  if (add <= 0) {
    if (!silent && fullMsgCd <= 0 && S.hooks.showMsg) {
      fullMsgCd = 2.5;
      S.hooks.showMsg(freeTotal <= 0 ? 'MOCHILA LLENA (12/12) · ABRE [I]' : `${spec.short.toUpperCase()} AL MÁXIMO`, 1.3);
    }
    return 0;
  }
  S.inventory[itemId] = cur + add;
  if (!silent) {
    playSupply();
    if (S.hooks.showMsg) S.hooks.showMsg(`+ ${add} ${spec.name.toUpperCase()} [MOCHILA ${getInventoryUsedSlots()}/${INVENTORY_MAX_SLOTS}]`, 1.4);
  }
  syncInventoryBadge();
  if (S.inventoryOpen) renderInventory();
  return add;
}

export function spawnLootDrop(itemId, x, z, pickupDelay = 0.3, y = DECK_TOP) {
  const spec = ITEM_MAP[itemId];
  if (!spec || !S.scene) return null;
  if (S.lootDrops.length >= 14) {
    const old = S.lootDrops.shift();
    S.scene.remove(old.mesh);
  }
  const grp = new THREE.Group();
  const box = new THREE.Mesh(LOOT_BOX_GEO, lootMat(spec.color));
  box.position.y = 0.28;
  const ring = new THREE.Mesh(LOOT_RING_GEO, ringMat(spec.color));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  grp.add(box, ring);
  grp.position.set(x, y, z);
  S.scene.add(grp);
  const drop = { itemId, mesh: grp, box, ring, x, y, z, life: 48, pickupDelay };
  S.lootDrops.push(drop);
  return drop;
}

export function maybeDropEnemyLoot(pos, role) {
  if (!pos) return;
  const y = Math.abs(pos.y - 11.4) < 1.2 ? 11.4 : DECK_TOP;
  let itemId = null;
  const r = Math.random();
  if (role === 'officer') {
    itemId = r < 0.72 ? 'intel_doc' : 'plate';
  } else if (role === 'grenadier' || role === 'mortar') {
    if (r < 0.55) {
      const pool = ['ammo_pouch', 'flare_kit', 'ration'];
      itemId = pool[Math.floor(Math.random() * pool.length)];
    }
  } else if (role === 'sniper') {
    if (r < 0.50) itemId = Math.random() < 0.5 ? 'adrenaline' : 'ammo_pouch';
  } else if (r < 0.28) {
    const pool = ['ration', 'ammo_pouch', 'plate'];
    itemId = pool[Math.floor(Math.random() * pool.length)];
  }
  if (itemId) spawnLootDrop(itemId, pos.x, pos.z, 0.35, y);
}

export function dropTanketteLoot(x, z) {
  spawnLootDrop('intel_doc', x - 0.8, z, 0.4, DECK_TOP);
  spawnLootDrop('ammo_pouch', x + 0.8, z, 0.4, DECK_TOP);
}

export function grantSupplyCrateLoot() {
  const a = addInventoryItem('ration', 1, true);
  const b = addInventoryItem('ammo_pouch', 1, true);
  syncInventoryBadge();
  return a + b;
}

function collectDropAtIndex(idx) {
  const d = S.lootDrops[idx];
  if (!d) return false;
  const added = addInventoryItem(d.itemId, 1, false);
  if (added <= 0) return false;
  S.scene.remove(d.mesh);
  S.lootDrops.splice(idx, 1);
  return true;
}

export function getNearestLootDrop(maxDist = 3.6) {
  let best = null, bestIdx = -1, bestD = maxDist;
  for (let i = 0; i < S.lootDrops.length; i++) {
    const d = S.lootDrops[i];
    if (d.pickupDelay > 0) continue;
    if (Math.abs(S.player.feetY - d.y) > 2.2) continue;
    const dist = Math.hypot(S.player.pos.x - d.x, S.player.pos.z - d.z);
    if (dist < bestD) { bestD = dist; best = d; bestIdx = i; }
  }
  return best ? { drop: best, idx: bestIdx, spec: ITEM_MAP[best.itemId] } : null;
}

export function tryCollectNearbyLoot() {
  const near = getNearestLootDrop(3.6);
  if (!near) return false;
  return collectDropAtIndex(near.idx);
}

export function updateLootDrops(dt, t) {
  if (fullMsgCd > 0) fullMsgCd = Math.max(0, fullMsgCd - dt);
  for (let i = S.lootDrops.length - 1; i >= 0; i--) {
    const d = S.lootDrops[i];
    d.life -= dt;
    if (d.pickupDelay > 0) d.pickupDelay = Math.max(0, d.pickupDelay - dt);
    if (d.box) {
      d.box.rotation.y += dt * 2.1;
      d.box.position.y = 0.28 + Math.sin(t * 3.5 + i) * 0.06;
    }
    if (d.ring) {
      const sc = 0.92 + Math.sin(t * 4.5 + i) * 0.14;
      d.ring.scale.set(sc, sc, 1);
    }
    if (S.alive && d.pickupDelay <= 0 && Math.abs(S.player.feetY - d.y) < 2.2) {
      const dist = Math.hypot(S.player.pos.x - d.x, S.player.pos.z - d.z);
      if (dist < 2.35 && collectDropAtIndex(i)) continue;
    }
    if (d.life <= 0) {
      S.scene.remove(d.mesh);
      S.lootDrops.splice(i, 1);
    }
  }
}

export function clearLootDrops() {
  for (const d of S.lootDrops) S.scene?.remove(d.mesh);
  S.lootDrops.length = 0;
}

function setStatus(msg) {
  const st = $('invStatus');
  if (st) st.textContent = msg || '';
}

function getItemQuantityText(spec) {
  if (spec.cat === 'weapon') {
    if (spec.id === 'mp18' && !S.mp18Owned) return 'BLOQ.';
    const w = WEAPONS[spec.id];
    if (!w) return '';
    return w.melee ? '∞' : `${w.ammo}/${w.reserve}`;
  }
  if (spec.id === 'grenade') return `×${S.grenades}`;
  if (spec.id === 'molotov') return `×${S.molotovs}`;
  if (spec.id === 'bandage') return `×${S.bandages}`;
  if (spec.id === 'mortar')  return `×${S.mortarStrikes}`;
  return `×${S.inventory[spec.id] || 0}`;
}

export function useInventoryItem(itemId) {
  const spec = ITEM_MAP[itemId];
  if (!spec || !S.alive) return false;
  S.inventorySelected = itemId;

  if (spec.cat === 'weapon') {
    if (itemId === 'mp18' && !S.mp18Owned) {
      playDryFire();
      setStatus('El MP-18 se desbloquea en la Tienda de Supervivencia o empieza equipado en Campaña.');
      renderInventory();
      return false;
    }
    if (S.hooks.switchWeapon) S.hooks.switchWeapon(itemId);
    setStatus(`Arma equipada: ${spec.name}.`);
    renderInventory();
    return true;
  }

  if (itemId === 'grenade' || itemId === 'molotov' || itemId === 'mortar') {
    const count = itemId === 'grenade' ? S.grenades : (itemId === 'molotov' ? S.molotovs : S.mortarStrikes);
    if (count <= 0) {
      playDryFire();
      setStatus(`No quedan existencias de ${spec.short}. Recoge suministros [E] o botín.`);
      renderInventory();
      return false;
    }
    pendingCombatAction = itemId;
    closeInventory(true);
    return true;
  }

  if (itemId === 'bandage') {
    if (S.bandages <= 0) {
      playDryFire();
      setStatus('Sin vendajes de campaña.');
      renderInventory();
      return false;
    }
    if (S.player.hp >= 99) {
      setStatus('La salud ya está al máximo.');
      renderInventory();
      return false;
    }
    S.bandages--;
    S.player.hp = Math.min(100, S.player.hp + 38);
    playBandageSound();
    setStatus('Vendaje aplicado: +38 de salud.');
  } else if (itemId === 'ration') {
    if ((S.inventory.ration || 0) <= 0) {
      playDryFire();
      setStatus('No quedan raciones en la mochila.');
      renderInventory();
      return false;
    }
    if (S.player.hp >= 100 && S.player.armor >= 50) {
      setStatus('Salud y blindaje ya están al máximo.');
      renderInventory();
      return false;
    }
    S.inventory.ration--;
    S.player.hp = Math.min(100, S.player.hp + 25);
    S.player.armor = Math.min(50, S.player.armor + 15);
    playBandageSound();
    setStatus('Ración consumida: +25 salud y +15 blindaje.');
  } else if (itemId === 'plate') {
    if ((S.inventory.plate || 0) <= 0) {
      playDryFire();
      setStatus('No quedan placas de blindaje en la mochila.');
      renderInventory();
      return false;
    }
    if (S.player.armor >= 50) {
      setStatus('El blindaje ya está al máximo (50).');
      renderInventory();
      return false;
    }
    S.inventory.plate--;
    S.player.armor = Math.min(50, S.player.armor + 35);
    playSupply();
    setStatus('Placa instalada: +35 de blindaje táctico.');
  } else if (itemId === 'ammo_pouch') {
    if ((S.inventory.ammo_pouch || 0) <= 0) {
      playDryFire();
      setStatus('No quedan cartucheras en la mochila.');
      renderInventory();
      return false;
    }
    S.inventory.ammo_pouch--;
    WEAPONS.rifle.reserve = Math.min(180, WEAPONS.rifle.reserve + 30);
    WEAPONS.pistol.reserve = Math.min(80, WEAPONS.pistol.reserve + 15);
    WEAPONS.mp18.reserve = Math.min(256, WEAPONS.mp18.reserve + 32);
    playSupply();
    setStatus('Reserva recargada: +30 Fusil, +15 Mauser C96, +32 MP-18.');
  } else if (itemId === 'flare_kit') {
    if ((S.inventory.flare_kit || 0) <= 0) {
      playDryFire();
      setStatus('No quedan bengalas tácticas.');
      renderInventory();
      return false;
    }
    S.inventory.flare_kit--;
    S.flareLife = 14.0;
    const fx = Math.max(-35, Math.min(25, S.player.pos.x - 14));
    if (S.flareObj) {
      S.flareObj.visible = true;
      S.flareObj.position.set(fx, 24, 0);
    }
    if (S.flareLight) {
      S.flareLight.position.set(fx, 24, 0);
      S.flareLight.intensity = 52;
    }
    addScore(50);
    tone(640, 0.16, 0.14, 'triangle', 1080);
    setStatus('Bengala táctica lanzada sobre el río Yongding (+50 PTS).');
  } else if (itemId === 'adrenaline') {
    if ((S.inventory.adrenaline || 0) <= 0) {
      playDryFire();
      setStatus('Sin tónicos del 29.º Ejército en la mochila.');
      renderInventory();
      return false;
    }
    S.inventory.adrenaline--;
    S.boostTimer = Math.max(S.boostTimer, 12.0);
    tone(480, 0.14, 0.14, 'triangle', 840);
    setStatus('Tónico activo durante 12 s: +20% velocidad y +35% recarga.');
  } else if (itemId === 'intel_doc') {
    if ((S.inventory.intel_doc || 0) <= 0) {
      playDryFire();
      setStatus('Sin documentos japoneses para descifrar.');
      renderInventory();
      return false;
    }
    S.inventory.intel_doc--;
    addScore(250);
    playRadioChirp();
    if (S.hooks.showRadio) {
      S.hooks.showRadio('INTELIGENCIA · 29.º EJÉRCITO', '¡Documento enemigo descifrado! Despliegue japonés identificado (+250 PTS).', 5.0);
    }
    setStatus('Documento transmitido al mando de Wanping (+250 PTS).');
  }

  syncInventoryBadge();
  if (S.hooks.updateHUD) S.hooks.updateHUD();
  renderInventory();
  return true;
}

export function dropInventoryItem(itemId) {
  const spec = ITEM_MAP[itemId];
  if (!spec || spec.cat !== 'supply' || !spec.droppable) return false;
  if ((S.inventory[itemId] || 0) <= 0) return false;
  S.inventory[itemId]--;
  let nx = S.player.pos.x - Math.sin(S.yaw) * 2.2;
  let nz = S.player.pos.z - Math.cos(S.yaw) * 2.2;
  nx = Math.max(-54, Math.min(72, nx));
  nz = (nz < -7) ? Math.max(-14.5, Math.min(-11.5, nz)) : Math.max(-3.5, Math.min(3.5, nz));
  spawnLootDrop(itemId, nx, nz, 1.8, S.player.feetY);
  syncInventoryBadge();
  if (S.hooks.updateHUD) S.hooks.updateHUD();
  setStatus(`Soltado en el puente: 1 ${spec.name}.`);
  renderInventory();
  return true;
}

function makeItemIconSvg(icon, color) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', '26');
  svg.setAttribute('height', '26');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.color = color || '#e8c87a';
  svg.style.flexShrink = '0';

  const shape = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    svg.appendChild(el);
  };

  if (icon === 'rifle' || icon === 'mp18') {
    shape('path', { d: 'M3 19 L14 14 L29 11 L29 14 L18 16 L15 21 L9 21 L4 24 Z', fill: 'currentColor' });
    if (icon === 'mp18') shape('rect', { x: '16', y: '16', width: '3', height: '7', fill: 'currentColor' });
  } else if (icon === 'pistol') {
    shape('path', { d: 'M5 12 H27 V16 H14 L11 25 H6 L9 16 H5 Z', fill: 'currentColor' });
  } else if (icon === 'sword') {
    shape('path', { d: 'M6 25 L10 21 L23 6 L27 7 L14 23 L10 27 Z', fill: 'currentColor' });
  } else if (icon === 'grenade') {
    shape('rect', { x: '12', y: '4', width: '8', height: '9', rx: '2', fill: 'currentColor' });
    shape('rect', { x: '14', y: '13', width: '4', height: '14', rx: '1', fill: 'currentColor', opacity: '0.75' });
  } else if (icon === 'molotov') {
    shape('path', { d: 'M13 4 H19 V9 L22 14 V27 H10 V14 L13 9 Z', fill: 'currentColor', opacity: '0.85' });
    shape('path', { d: 'M15 1 C17 3 19 2 18 5 H14 C13 3 14 2 15 1 Z', fill: '#ffd447' });
  } else if (icon === 'bandage' || icon === 'ration') {
    shape('rect', { x: '6', y: '8', width: '20', height: '16', rx: '3', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2' });
    shape('path', { d: 'M16 11 V21 M11 16 H21', stroke: 'currentColor', 'stroke-width': '2.8', 'stroke-linecap': 'round' });
  } else if (icon === 'mortar') {
    shape('circle', { cx: '16', cy: '16', r: '10', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' });
    shape('path', { d: 'M16 3 V11 M16 21 V29 M3 16 H11 M21 16 H29', stroke: 'currentColor', 'stroke-width': '2' });
  } else if (icon === 'plate') {
    shape('path', { d: 'M7 7 L16 4 L25 7 V16 C25 22 16 28 16 28 C16 28 7 22 7 16 Z', fill: 'currentColor', opacity: '0.85' });
  } else if (icon === 'ammo') {
    for (const x of [9, 15, 21]) {
      shape('rect', { x, y: '11', width: '3', height: '15', fill: 'currentColor' });
      shape('polygon', { points: `${x},11 ${x + 1.5},5 ${x + 3},11`, fill: '#ffe89e' });
    }
  } else if (icon === 'flare') {
    shape('circle', { cx: '16', cy: '10', r: '4', fill: '#fff4c2' });
    shape('path', { d: 'M16 2 V5 M9 5 L11 7 M23 5 L21 7 M14 14 H18 V27 H14 Z', stroke: 'currentColor', 'stroke-width': '2', fill: 'currentColor' });
  } else if (icon === 'tonic') {
    shape('path', { d: 'M13 4 H19 V8 L23 13 V26 H9 V13 L13 8 Z', fill: 'currentColor', opacity: '0.85' });
  } else {
    shape('rect', { x: '7', y: '5', width: '18', height: '22', rx: '2', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2' });
    shape('path', { d: 'M11 11 H21 M11 16 H21 M11 21 H17', stroke: 'currentColor', 'stroke-width': '2' });
  }
  return svg;
}

export function renderInventory() {
  const dlg = $('inventoryDialog');
  if (!dlg) return;

  if ($('invHpVal'))    $('invHpVal').textContent = `${Math.round(S.player.hp)}/100`;
  if ($('invArmorVal')) $('invArmorVal').textContent = `${Math.round(S.player.armor)}/50`;
  if ($('invPtsVal'))   $('invPtsVal').textContent = `${S.stats.score} PTS`;
  if ($('invCapVal'))   $('invCapVal').textContent = `${getInventoryUsedSlots()}/${INVENTORY_MAX_SLOTS}`;
  if ($('invBoostNote')) {
    $('invBoostNote').textContent = S.boostTimer > 0
      ? `Tónico activo (${Math.ceil(S.boostTimer)}s): +20% velocidad, +35% recarga`
      : 'Sin estimulantes activos';
  }

  const filterWrap = $('invFilters');
  if (filterWrap) {
    filterWrap.querySelectorAll('button[data-filter]').forEach(btn => {
      const active = btn.dataset.filter === S.inventoryFilter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  const visible = INVENTORY_ITEMS.filter(it => S.inventoryFilter === 'all' || it.cat === S.inventoryFilter);
  if (!visible.some(it => it.id === S.inventorySelected) && visible.length) {
    S.inventorySelected = visible[0].id;
  }

  const grid = $('invGrid');
  if (grid) {
    const slots = visible.map(spec => {
      const qtyTxt = getItemQuantityText(spec);
      const isEquipped = spec.cat === 'weapon' && S.current === spec.id;
      const isSelected = S.inventorySelected === spec.id;
      const isEmpty = (spec.cat === 'supply' && (S.inventory[spec.id] || 0) <= 0) ||
        (spec.id === 'grenade' && S.grenades <= 0) ||
        (spec.id === 'molotov' && S.molotovs <= 0) ||
        (spec.id === 'bandage' && S.bandages <= 0) ||
        (spec.id === 'mortar' && S.mortarStrikes <= 0) ||
        (spec.id === 'mp18' && !S.mp18Owned);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'invSlot' + (isSelected ? ' selected' : '') + (isEquipped ? ' equipped' : '') + (isEmpty ? ' empty' : '');
      btn.dataset.item = spec.id;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-label', `${spec.short} (${qtyTxt})${isEquipped ? ' · Equipado' : ''}`);

      const top = document.createElement('div');
      top.className = 'invSlotTop';
      const hk = document.createElement('span');
      hk.className = 'invHk';
      hk.textContent = spec.hotkey ? `[${spec.hotkey}]` : 'MOCH.';
      const cnt = document.createElement('span');
      cnt.className = 'invQty';
      cnt.textContent = qtyTxt;
      top.append(hk, cnt);

      const iconWrap = document.createElement('div');
      iconWrap.className = 'invIcon';
      iconWrap.appendChild(makeItemIconSvg(spec.icon, isEmpty ? '#7c7668' : spec.color));

      const lbl = document.createElement('span');
      lbl.className = 'invSlotName';
      lbl.textContent = spec.short;

      btn.append(top, iconWrap, lbl);
      if (isEquipped) {
        const eq = document.createElement('span');
        eq.className = 'invEqTag';
        eq.textContent = 'EN MANO';
        btn.appendChild(eq);
      }
      btn.addEventListener('click', () => {
        S.inventorySelected = spec.id;
        setStatus('');
        renderInventory();
      });
      return btn;
    });
    grid.replaceChildren(...slots);
  }

  const detail = $('invDetail');
  const sel = ITEM_MAP[S.inventorySelected] || visible[0];
  if (detail && sel) {
    const catLabel = sel.cat === 'weapon' ? 'ARMAMENTO' : (sel.cat === 'tactical' ? 'EQUIPO TÁCTICO' : 'SUMINISTRO DE MOCHILA');
    const kicker = document.createElement('div');
    kicker.className = 'invDetCat';
    kicker.textContent = `${catLabel} · ${sel.zh}`;

    const h2 = document.createElement('h2');
    h2.textContent = sel.name;

    const meta = document.createElement('div');
    meta.className = 'invDetMeta';
    meta.textContent = `Cantidad / Munición: ${getItemQuantityText(sel)}${sel.hotkey ? ` · Tecla [${sel.hotkey}]` : ''}`;

    const desc = document.createElement('p');
    desc.className = 'invDetDesc';
    desc.textContent = sel.desc;

    const lore = document.createElement('p');
    lore.className = 'invDetLore';
    lore.textContent = sel.lore;

    const actions = document.createElement('div');
    actions.className = 'invDetActions';

    const qtySupply = sel.cat === 'supply' ? (S.inventory[sel.id] || 0) : 0;
    const primaryBtn = document.createElement('button');
    primaryBtn.type = 'button';
    primaryBtn.className = 'btn invActBtn';

    if (sel.cat === 'weapon') {
      const unlocked = sel.id !== 'mp18' || S.mp18Owned;
      primaryBtn.textContent = !unlocked ? `${sel.short} bloqueado` : (S.current === sel.id ? `${sel.short} equipado` : `Equipar ${sel.short}`);
      primaryBtn.disabled = !unlocked || S.current === sel.id;
      primaryBtn.addEventListener('click', () => useInventoryItem(sel.id));
      actions.appendChild(primaryBtn);

      const w = WEAPONS[sel.id];
      if (w && !w.melee && unlocked && w.ammo < w.clip && w.reserve > 0) {
        const reloadBtn = document.createElement('button');
        reloadBtn.type = 'button';
        reloadBtn.className = 'btn secondary invActBtn';
        reloadBtn.textContent = `Recargar ${sel.short} [R]`;
        reloadBtn.addEventListener('click', () => {
          if (S.current !== sel.id && S.hooks.switchWeapon) S.hooks.switchWeapon(sel.id);
          closeInventory(true);
          if (S.hooks.startReload) S.hooks.startReload();
        });
        actions.appendChild(reloadBtn);
      }
    } else if (sel.id === 'grenade' || sel.id === 'molotov' || sel.id === 'mortar') {
      const count = sel.id === 'grenade' ? S.grenades : (sel.id === 'molotov' ? S.molotovs : S.mortarStrikes);
      primaryBtn.textContent = `Preparar y usar ${sel.short}`;
      primaryBtn.disabled = count <= 0;
      primaryBtn.addEventListener('click', () => useInventoryItem(sel.id));
      actions.appendChild(primaryBtn);
    } else {
      const count = sel.id === 'bandage' ? S.bandages : qtySupply;
      primaryBtn.textContent = sel.id === 'intel_doc' ? 'Transmitir Documento (+250 PTS)' : `Usar ${sel.short}`;
      primaryBtn.disabled = count <= 0;
      primaryBtn.addEventListener('click', () => useInventoryItem(sel.id));
      actions.appendChild(primaryBtn);

      if (sel.cat === 'supply' && sel.droppable) {
        const dropBtn = document.createElement('button');
        dropBtn.type = 'button';
        dropBtn.className = 'btn secondary invActBtn';
        dropBtn.textContent = `Soltar 1 ${sel.short}`;
        dropBtn.disabled = qtySupply <= 0;
        dropBtn.addEventListener('click', () => dropInventoryItem(sel.id));
        actions.appendChild(dropBtn);
      }
    }

    detail.replaceChildren(kicker, h2, meta, desc, lore, actions);
  }
}

export function openInventory() {
  if (!S.alive || S.paused || S.cinematic || S.shopOpen || S.tacticalBrief || S.inventoryOpen) return;
  if (S.squadWheelOpen && S.hooks.toggleSquadWheel) S.hooks.toggleSquadWheel(false);

  // Mark open BEFORE exiting pointer lock so pointerlockchange never triggers pauseGame()
  S.inventoryOpen = true;
  S.mouseDownLeft = false;
  S.gpFiring = false;
  S.touchFiring = false;
  S.aiming = false;
  for (const k in S.keys) S.keys[k] = false;

  if (document.pointerLockElement) document.exitPointerLock();
  setStatus('');
  renderInventory();

  const dlg = $('inventoryDialog');
  if (dlg && !dlg.open) dlg.showModal();
  if (S.hooks.syncTouchControlsVisibility) S.hooks.syncTouchControlsVisibility();
  if (S.hooks.updateLockHint) S.hooks.updateLockHint();
}

export function closeInventory(relock = true) {
  wantRelock = relock;
  const dlg = $('inventoryDialog');
  if (dlg && dlg.open) {
    dlg.close();
  } else {
    S.inventoryOpen = false;
    pendingCombatAction = null;
  }
}

export function toggleInventory() {
  if (S.inventoryOpen) closeInventory(true);
  else openInventory();
}

export function initInventoryUI() {
  const dlg = $('inventoryDialog');
  if (dlg) {
    dlg.addEventListener('close', () => {
      void dlg.returnValue;
      dlg.returnValue = '';
      S.inventoryOpen = false;
      S.invClosedAt = performance.now();
      for (const k in S.keys) S.keys[k] = false;

      const act = pendingCombatAction;
      pendingCombatAction = null;
      const shouldRelock = wantRelock;
      wantRelock = true;

      if (S.hooks.syncTouchControlsVisibility) S.hooks.syncTouchControlsVisibility();
      if (S.hooks.updateLockHint) S.hooks.updateLockHint();
      if (S.hooks.updateHUD) S.hooks.updateHUD();
      syncInventoryBadge();

      if (shouldRelock && S.alive && !S.paused && !S.cinematic && !S.shopOpen && !S.tacticalBrief && !(S.hooks.isTouchActive && S.hooks.isTouchActive())) {
        if (S.hooks.lockPointer) S.hooks.lockPointer();
      }
      if (act && S.alive && !S.paused) {
        if (act === 'grenade' && S.hooks.throwGrenade) S.hooks.throwGrenade();
        else if (act === 'molotov' && S.hooks.throwMolotov) S.hooks.throwMolotov();
        else if (act === 'mortar' && S.hooks.callAlliedMortar) S.hooks.callAlliedMortar();
      }
    });

    // Mandatory fallback for browsers without native <dialog closedby="any">
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e, d) => {
        const r = d.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dlg.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dlg); });
      dlg.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dlg)) dlg.close(); });
    }
  }

  const filters = $('invFilters');
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      S.inventoryFilter = btn.dataset.filter || 'all';
      setStatus('');
      renderInventory();
    });
  }

  const hudBtn = $('invHudBtn');
  if (hudBtn) {
    hudBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInventory();
    });
  }

  syncInventoryBadge();
}
