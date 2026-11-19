import * as THREE from 'three';
import { $, S } from './state.js';

let actx = null;
let ambientGain = null;
let musicTimer = 0;
let musicStep = 0;
const PENTA = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33];
const _fwd = new THREE.Vector3();
const _up  = new THREE.Vector3();

export function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC && !actx) actx = new AC();
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
  startAmbience();
}

export function startAmbience() {
  if (!actx || ambientGain) return;
  const len = actx.sampleRate * 2;
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340;
  ambientGain = actx.createGain();
  ambientGain.gain.value = S.muted ? 0 : 0.025 * S.sfxVol;
  src.connect(lp); lp.connect(ambientGain); ambientGain.connect(actx.destination);
  src.start();
}

export function syncAmbientVolume() {
  if (ambientGain) ambientGain.gain.value = S.muted ? 0 : 0.025 * S.sfxVol;
}

export function updateAudioListener(camera) {
  if (!actx || !actx.listener || !camera) return;
  const l = actx.listener;
  const p = camera.position;
  if (l.positionX) {
    l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
    camera.getWorldDirection(_fwd);
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    l.forwardX.value = _fwd.x; l.forwardY.value = _fwd.y; l.forwardZ.value = _fwd.z;
    l.upX.value = _up.x; l.upY.value = _up.y; l.upZ.value = _up.z;
  }
}

function makePanner(worldPos) {
  if (!actx || !actx.createPanner || !worldPos) return actx.destination;
  const pan = actx.createPanner();
  pan.panningModel = 'HRTF';
  pan.distanceModel = 'inverse';
  pan.refDistance = 6;
  pan.maxDistance = 120;
  pan.rolloffFactor = 1.1;
  pan.positionX.value = worldPos.x;
  pan.positionY.value = worldPos.y;
  pan.positionZ.value = worldPos.z;
  pan.connect(actx.destination);
  return pan;
}

export function noiseBurst(dur, vol, freq, worldPos = null) {
  if (!actx || S.muted || S.sfxVol <= 0.01) return;
  const len = Math.max(16, Math.floor(actx.sampleRate * dur));
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = actx.createGain(); g.gain.value = vol * S.sfxVol;
  const dest = worldPos ? makePanner(worldPos) : actx.destination;
  src.connect(f); f.connect(g); g.connect(dest);
  src.start();
}

export function tone(freq, dur, vol = 0.15, type = 'sine', slideTo = null, isMusic = false, worldPos = null) {
  const mult = isMusic ? S.musicVol : S.sfxVol;
  if (!actx || S.muted || mult <= 0.01) return;
  const now = actx.currentTime;
  const osc = actx.createOscillator();
  const g = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  g.gain.setValueAtTime(vol * mult, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  const dest = worldPos ? makePanner(worldPos) : actx.destination;
  osc.connect(g); g.connect(dest);
  osc.start(now); osc.stop(now + dur);
}

export function updateMusic(dt) {
  if (!actx || S.muted || S.musicVol <= 0.01 || (!S.alive && !S.cinematic)) return;
  musicTimer -= dt;
  if (musicTimer <= 0) {
    const intense = S.alive && (S.wave >= 2 || !!S.tankette);
    musicTimer = intense ? 0.38 : 0.56;
    musicStep++;
    tone(68, 0.22, intense ? 0.14 : 0.09, 'sine', 34, true);
    if (musicStep % 2 === 0) {
      const note = PENTA[(musicStep * 3 + S.wave) % PENTA.length];
      tone(note, 0.45, 0.045, 'triangle', null, true);
    }
  }
}

export const playDryFire      = () => tone(1100, 0.03, 0.12, 'square');
export const playReload       = () => { tone(520, 0.04, 0.11, 'square'); setTimeout(() => tone(760, 0.05, 0.12, 'square'), 220); };
export const playHit          = (hs) => tone(hs ? 1420 : 340, 0.075, hs ? 0.24 : 0.16, hs ? 'triangle' : 'sine');
export const playHurt         = () => noiseBurst(0.14, 0.32, 380);
export const playSupply       = () => { tone(520, 0.09, 0.18, 'triangle'); setTimeout(() => tone(780, 0.14, 0.18, 'triangle'), 90); };
export const playWaveHorn     = () => { tone(293, 0.35, 0.12, 'sawtooth'); setTimeout(() => tone(440, 0.55, 0.14, 'sawtooth'), 320); };
export const playExplosion    = (vol = 0.38, pos = null) => { noiseBurst(0.45, vol, 240, pos); tone(95, 0.4, vol * 0.7, 'sine', 28, false, pos); };
export const playShatter      = (pos = null) => tone(2400, 0.08, 0.14, 'triangle', 900, false, pos);
export const playMolotovShatter = (pos = null) => { tone(2200, 0.09, 0.16, 'triangle', 760, false, pos); noiseBurst(0.26, 0.22, 1200, pos); };
export const playParryClang   = () => { tone(1680, 0.12, 0.22, 'triangle', 920); tone(2480, 0.09, 0.14, 'sine', 1320); };
export const playBandageSound = () => { noiseBurst(0.14, 0.12, 950); tone(460, 0.14, 0.12, 'sine', 640); };
export const playMortarWhistle = (pos = null) => tone(980, 0.52, 0.12, 'sine', 340, false, pos);
export const playBombPlant = () => { tone(560, 0.08, 0.16, 'square', 420); setTimeout(() => tone(880, 0.09, 0.15, 'triangle'), 95); };
export const playBombTick = (urgent = false) => tone(urgent ? 1320 : 960, 0.045, urgent ? 0.16 : 0.10, 'square');
export const playShellshock = () => { tone(2800, 1.35, 0.09, 'sine', 1650); noiseBurst(0.55, 0.28, 320); };
export const playVictoryFanfare = () => {
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
    setTimeout(() => tone(f, idx === 4 ? 0.65 : 0.24, 0.16, 'triangle'), idx * 140);
  });
};

export function playRadioChirp() {
  tone(1540, 0.035, 0.07, 'sine');
  noiseBurst(0.05, 0.05, 1900);
}

export function playChargeBugle() {
  const notes = [[392, 0.14], [523.25, 0.14], [659.25, 0.16], [783.99, 0.32]];
  let delay = 0;
  for (const [f, d] of notes) {
    setTimeout(() => tone(f, d, 0.13, 'sawtooth'), delay);
    delay += d * 900;
  }
}

export function playOfficerWhistle(pos = null) {
  tone(2200, 0.18, 0.11, 'sine', 2550, false, pos);
  setTimeout(() => tone(2450, 0.22, 0.11, 'sine', 2100, false, pos), 160);
}

export function playMedalSound() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
    setTimeout(() => tone(f, 0.22, 0.15, 'triangle'), idx * 80);
  });
}

export function playStreakSound(count) {
  if (!actx || S.muted || S.sfxVol <= 0.01) return;
  const notes = count === 2 ? [523.25, 783.99]
              : count === 3 ? [587.33, 783.99, 987.77]
              : [587.33, 783.99, 987.77, 1174.66];
  notes.forEach((f, idx) => {
    setTimeout(() => tone(f, 0.18, 0.16, 'triangle'), idx * 85);
  });
}

export function toggleMute() {
  S.muted = !S.muted;
  syncAmbientVolume();
  if ($('muteBtn')) $('muteBtn').textContent = S.muted ? 'AUDIO: NO' : 'AUDIO: SÍ';
  if (S.hooks.showMsg) S.hooks.showMsg(S.muted ? 'AUDIO SILENCIADO' : 'AUDIO ACTIVADO', 1.0);
}
