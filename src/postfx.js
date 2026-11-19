import * as THREE from 'three';

const FULL_VS = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BRIGHT_FS = `
uniform sampler2D tDiffuse;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(tDiffuse, vUv);
  float lum = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
  float w = smoothstep(uThreshold, uThreshold + 0.45, lum);
  gl_FragColor = vec4(tex.rgb * w, 1.0);
}
`;

const BLUR_FS = `
uniform sampler2D tDiffuse;
uniform vec2 uStep;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227027;
  c += texture2D(tDiffuse, vUv + uStep * 1.384615).rgb * 0.316216;
  c += texture2D(tDiffuse, vUv - uStep * 1.384615).rgb * 0.316216;
  c += texture2D(tDiffuse, vUv + uStep * 3.230769).rgb * 0.070270;
  c += texture2D(tDiffuse, vUv - uStep * 3.230769).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}
`;

const COMP_FS = `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uStrength;
uniform float uVignette;
uniform float uGrain;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 col = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uStrength;
  if (uVignette > 0.001) {
    vec2 d = vUv - 0.5;
    float vig = smoothstep(0.32, 0.92, dot(d, d) * 1.85);
    col *= (1.0 - vig * uVignette);
  }
  if (uGrain > 0.001) {
    float n = fract(sin(dot(vUv * 1000.0 + uTime * 17.3, vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * uGrain;
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createPostFX(renderer, scene, camera) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsScene = new THREE.Scene();
  const fsGeo = new THREE.PlaneGeometry(2, 2);

  const brightMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.92 } },
    vertexShader: FULL_VS,
    fragmentShader: BRIGHT_FS,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uStep: { value: new THREE.Vector2(0.002, 0) } },
    vertexShader: FULL_VS,
    fragmentShader: BLUR_FS,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const compMat = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null },
      tBloom: { value: null },
      uStrength: { value: 0.34 },
      uVignette: { value: 0.22 },
      uGrain: { value: 0.015 },
      uTime: { value: 0 }
    },
    vertexShader: FULL_VS,
    fragmentShader: COMP_FS,
    depthTest: false,
    depthWrite: false,
    toneMapped: true
  });

  const quad = new THREE.Mesh(fsGeo, compMat);
  fsScene.add(quad);

  const rtOpts = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false
  };
  const rtBloomOpts = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false
  };

  let rtScene = null, rtBloomA = null, rtBloomB = null;
  let bw = 2, bh = 2;
  let quality = 'med';

  function allocate(w, h) {
    const sw = Math.max(4, Math.floor(w));
    const sh = Math.max(4, Math.floor(h));
    bw = Math.max(4, Math.floor(sw * 0.5));
    bh = Math.max(4, Math.floor(sh * 0.5));
    if (rtScene) rtScene.dispose();
    if (rtBloomA) rtBloomA.dispose();
    if (rtBloomB) rtBloomB.dispose();
    rtScene = new THREE.WebGLRenderTarget(sw, sh, rtOpts);
    rtBloomA = new THREE.WebGLRenderTarget(bw, bh, rtBloomOpts);
    rtBloomB = new THREE.WebGLRenderTarget(bw, bh, rtBloomOpts);
  }

  function resize(cssW, cssH, pixelRatio) {
    allocate(cssW * pixelRatio, cssH * pixelRatio);
  }

  function setQuality(level) {
    quality = level;
    if (level === 'high') {
      brightMat.uniforms.uThreshold.value = 0.84;
      compMat.uniforms.uStrength.value = 0.52;
      compMat.uniforms.uVignette.value = 0.24;
      compMat.uniforms.uGrain.value = 0.014;
    } else if (level === 'med') {
      brightMat.uniforms.uThreshold.value = 0.92;
      compMat.uniforms.uStrength.value = 0.30;
      compMat.uniforms.uVignette.value = 0.16;
      compMat.uniforms.uGrain.value = 0.0;
    } else {
      compMat.uniforms.uStrength.value = 0.0;
    }
  }

  allocate(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
  setQuality('med');

  function render(time = 0) {
    if (quality === 'low' || !rtScene) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    // 1. Scene to linear HDR target
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Selective luminance threshold -> bloom A
    quad.material = brightMat;
    brightMat.uniforms.tDiffuse.value = rtScene.texture;
    renderer.setRenderTarget(rtBloomA);
    renderer.render(fsScene, fsCam);

    // 3. Separable Gaussian blur H & V
    quad.material = blurMat;
    blurMat.uniforms.tDiffuse.value = rtBloomA.texture;
    blurMat.uniforms.uStep.value.set(1.3 / bw, 0);
    renderer.setRenderTarget(rtBloomB);
    renderer.render(fsScene, fsCam);

    blurMat.uniforms.tDiffuse.value = rtBloomB.texture;
    blurMat.uniforms.uStep.value.set(0, 1.3 / bh);
    renderer.setRenderTarget(rtBloomA);
    renderer.render(fsScene, fsCam);

    if (quality === 'high') {
      blurMat.uniforms.tDiffuse.value = rtBloomA.texture;
      blurMat.uniforms.uStep.value.set(2.4 / bw, 0);
      renderer.setRenderTarget(rtBloomB);
      renderer.render(fsScene, fsCam);

      blurMat.uniforms.tDiffuse.value = rtBloomB.texture;
      blurMat.uniforms.uStep.value.set(0, 2.4 / bh);
      renderer.setRenderTarget(rtBloomA);
      renderer.render(fsScene, fsCam);
    }

    // 4. Composite HDR + Bloom -> ACES Filmic -> Screen
    quad.material = compMat;
    compMat.uniforms.tScene.value = rtScene.texture;
    compMat.uniforms.tBloom.value = rtBloomA.texture;
    compMat.uniforms.uTime.value = time;
    renderer.setRenderTarget(null);
    renderer.render(fsScene, fsCam);
  }

  return { render, resize, setQuality };
}
