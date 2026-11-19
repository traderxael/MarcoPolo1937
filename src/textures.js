import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function makeTex(canvas, repeatX = 1, repeatY = 1, isColor = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createPBRTextures() {
  // 1. Lugouqiao stone cobblestone (color + roughness puddles + bump)
  const size = 256;
  const [cCol, xCol] = makeCanvas(size, size);
  const [cRgh, xRgh] = makeCanvas(size, size);
  const [cBmp, xBmp] = makeCanvas(size, size);

  xCol.fillStyle = '#4f4a41';
  xCol.fillRect(0, 0, size, size);
  xRgh.fillStyle = '#dcdcdc';
  xRgh.fillRect(0, 0, size, size);
  xBmp.fillStyle = '#505050';
  xBmp.fillRect(0, 0, size, size);

  const rows = 8, cols = 4;
  const rw = size / cols, rh = size / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (rw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * rw + off + 3;
      const by = r * rh + 3;
      const bw = rw - 6;
      const bh = rh - 6;
      const shade = 92 + ((r * 17 + c * 31) & 31);
      xCol.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 12})`;
      xCol.fillRect(bx, by, bw, bh);

      const bmpVal = 175 + ((r * 13 + c * 29) & 47);
      xBmp.fillStyle = `rgb(${bmpVal}, ${bmpVal}, ${bmpVal})`;
      xBmp.fillRect(bx, by, bw, bh);

      const puddle = ((r + c * 2) % 5 === 0) ? 45 : (175 + ((r * 7 + c * 11) & 45));
      xRgh.fillStyle = `rgb(${puddle}, ${puddle}, ${puddle})`;
      xRgh.fillRect(bx, by, bw, bh);
    }
  }
  // Subtle surface grain
  for (let i = 0; i < 900; i++) {
    const gx = (i * 73) % size;
    const gy = (i * 137) % size;
    xCol.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    xCol.fillRect(gx, gy, 2, 2);
  }

  const cobbleMap = makeTex(cCol, 24, 3, true);
  const cobbleRgh = makeTex(cRgh, 24, 3, false);
  const cobbleBmp = makeTex(cBmp, 24, 3, false);

  const cobbleMat = new THREE.MeshStandardMaterial({
    map: cobbleMap,
    roughnessMap: cobbleRgh,
    bumpMap: cobbleBmp,
    bumpScale: 0.045,
    roughness: 0.88,
    metalness: 0.08
  });

  // 2. Wanping aged grey-ochre stone masonry
  const [wCol, xwCol] = makeCanvas(256, 256);
  const [wBmp, xwBmp] = makeCanvas(256, 256);
  xwCol.fillStyle = '#5c5448';
  xwCol.fillRect(0, 0, 256, 256);
  xwBmp.fillStyle = '#404040';
  xwBmp.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const off = (r % 2) * 32;
    for (let c = -1; c <= 4; c++) {
      const s = 104 + ((r * 19 + c * 23) & 23);
      xwCol.fillStyle = `rgb(${s + 10}, ${s + 2}, ${s - 8})`;
      xwCol.fillRect(c * 64 + off + 2, r * 32 + 2, 60, 28);
      xwBmp.fillStyle = `rgb(${165 + ((r * c * 11) & 35)},${165 + ((r * c * 11) & 35)},${165 + ((r * c * 11) & 35)})`;
      xwBmp.fillRect(c * 64 + off + 2, r * 32 + 2, 60, 28);
    }
  }
  const wallMat = new THREE.MeshStandardMaterial({
    map: makeTex(wCol, 3, 2, true),
    bumpMap: makeTex(wBmp, 3, 2, false),
    bumpScale: 0.035,
    roughness: 0.92,
    metalness: 0.04
  });

  // 3. Sandbag woven burlap
  const [sCol, xsCol] = makeCanvas(128, 128);
  const [sBmp, xsBmp] = makeCanvas(128, 128);
  xsCol.fillStyle = '#8b7d5e';
  xsCol.fillRect(0, 0, 128, 128);
  xsBmp.fillStyle = '#808080';
  xsBmp.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 4) {
    xsCol.fillStyle = (y % 8 === 0) ? 'rgba(0,0,0,0.10)' : 'rgba(255,245,220,0.06)';
    xsCol.fillRect(0, y, 128, 2);
    xsBmp.fillStyle = (y % 8 === 0) ? '#555' : '#aaa';
    xsBmp.fillRect(0, y, 128, 2);
  }
  for (let x = 0; x < 128; x += 4) {
    xsCol.fillStyle = (x % 8 === 0) ? 'rgba(0,0,0,0.08)' : 'rgba(255,245,220,0.05)';
    xsCol.fillRect(x, 0, 2, 128);
  }
  const sandMat = new THREE.MeshStandardMaterial({
    map: makeTex(sCol, 2, 2, true),
    bumpMap: makeTex(sBmp, 2, 2, false),
    bumpScale: 0.03,
    roughness: 0.96,
    metalness: 0.01
  });

  // 4. Radial blast crater decal
  const [crCvs, xCr] = makeCanvas(128, 128);
  const grad = xCr.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0.0, 'rgba(14,12,10,0.92)');
  grad.addColorStop(0.45, 'rgba(28,22,16,0.72)');
  grad.addColorStop(0.8, 'rgba(35,30,24,0.22)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');
  xCr.fillStyle = grad;
  xCr.fillRect(0, 0, 128, 128);
  const craterTex = new THREE.CanvasTexture(crCvs);
  craterTex.colorSpace = THREE.SRGBColorSpace;
  const craterMat = new THREE.MeshBasicMaterial({
    map: craterTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1
  });

  return {
    cobbleMat,
    wallMat,
    sandMat,
    craterMat,
    setRainWetness(active) {
      cobbleMat.roughness = active ? 0.24 : 0.88;
      cobbleMat.metalness = active ? 0.26 : 0.08;
    }
  };
}
