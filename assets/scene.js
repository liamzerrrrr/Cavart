/* =================================================================
   CAVART — Moteur 3D de la séquence d'ouverture

   Orbite 360° autour de l'œuvre pilotée par le scroll, fond animé
   par shader, étincelles de forge, fondu croisé entre les modèles.

   POUR AJOUTER UNE ŒUVRE : déposez le .glb à la racine du site et
   ajoutez son chemin dans MODEL_URLS ci-dessous. La répartition sur
   les quatre jalons et les transitions s'ajustent automatiquement.
   ================================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODEL_URLS = [
  './crampon-1.glb',
  './crampon-2.glb'
];

const SLIDE_COUNT = 4;
const TRANSITION  = 0.12;   // largeur du fondu, en fraction de jalon

const canvas = document.getElementById('webgl');
if (canvas) init();

function init(){

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------- Rendu ------------------------- */
const renderer = new THREE.WebGLRenderer({
  canvas, antialias:true, alpha:false, powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.autoClear = false;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 1.2, 7);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.5).texture;

/* ------- Fond GLSL : vagues métalliques bronze/or → sombre ------- */
const bgScene  = new THREE.Scene();
const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const bgMaterial = new THREE.ShaderMaterial({
  depthWrite:false, depthTest:false,
  uniforms:{
    uTime:{ value:0 }, uProgress:{ value:0 },
    uVelocity:{ value:0 }, uAspect:{ value:window.innerWidth / window.innerHeight }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform float uTime, uProgress, uVelocity, uAspect;

    vec2 hash2(vec2 p){
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
            dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
            dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for(int i = 0; i < 5; i++){ v += a * noise(p); p = rot * p * 2.02; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = vUv;
      vec2 p  = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
      float t = uTime * 0.05;

      float warp  = fbm(p * 1.6 + vec2(t, -t * 0.6));
      float warp2 = fbm(p * 3.1 - vec2(t * 0.8, t * 0.4) + warp);

      float waves = sin((p.y * 7.0 + warp * 4.2 + t * 2.0) + uProgress * 3.1416);
      waves = pow(waves * 0.5 + 0.5, 2.4);

      float sheen = smoothstep(0.35, 0.98, waves + warp2 * 0.35);
      float ridge = pow(abs(sin(p.x * 3.0 - warp2 * 2.6 + t)), 6.0);

      vec3 gold   = vec3(0.86, 0.66, 0.26);
      vec3 bronze = vec3(0.44, 0.29, 0.13);
      vec3 steel  = vec3(0.13, 0.14, 0.17);
      vec3 deep   = vec3(0.012, 0.012, 0.016);

      float fade = smoothstep(0.10, 0.92, uProgress);
      vec3 warm = mix(bronze, gold, sheen);
      vec3 cold = mix(deep, steel, sheen * 0.75);
      vec3 col  = mix(warm, cold, fade);

      col += gold * ridge * (0.20 - 0.14 * fade);
      col *= 0.16 + 0.72 * waves;
      col += vec3(0.9, 0.72, 0.4) * uVelocity * 0.08 * sheen;

      float vig = smoothstep(1.15, 0.16, length(p * vec2(1.0, 1.25)));
      col *= vig;
      col = mix(col, deep, 0.30 + 0.42 * fade);
      col += (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.016;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `
});
bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial));

/* ------------------------ Lumières ------------------------ */
scene.add(new THREE.AmbientLight(0xffffff, 0.32));

const keyLight = new THREE.DirectionalLight(0xfff0d6, 2.6);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xc9a227, 3.1);
rimLight.position.set(-5, 2.4, -4);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x8a6a3a, 13, 22, 2);
fillLight.position.set(0, -2.4, 3);
scene.add(fillLight);

/* ------------------------- Œuvres ------------------------- */
const pivot = new THREE.Group();
scene.add(pivot);
const sculpture = new THREE.Group();
pivot.add(sculpture);

function frameObject(object){
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.6 / maxAxis;
  object.scale.setScalar(scale);
  object.position.sub(center.multiplyScalar(scale));
}

function buildFallbackSculpture(){
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color:0xb8862f, metalness:1.0, roughness:0.24, envMapIntensity:1.35 });
  const dark  = new THREE.MeshStandardMaterial({ color:0x1a1a1d, metalness:0.9, roughness:0.42, envMapIntensity:0.9 });

  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), metal);
  bodyMesh.scale.set(1.65, 0.62, 0.78);
  bodyMesh.position.y = 0.42;
  group.add(bodyMesh);

  const collar = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), metal);
  collar.scale.set(0.46, 0.58, 0.62);
  collar.position.set(-1.02, 0.72, 0);
  group.add(collar);

  const sole = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), dark);
  sole.scale.set(1.74, 0.16, 0.84);
  sole.position.y = 0.02;
  group.add(sole);

  const studGeo = new THREE.ConeGeometry(0.12, 0.34, 18);
  [[1.28,0],[0.86,0.36],[0.86,-0.36],[0.16,0.48],[0.16,-0.48],
   [-0.62,0.42],[-0.62,-0.42],[-1.24,0]].forEach(([x, z]) => {
    const stud = new THREE.Mesh(studGeo, metal);
    stud.position.set(x, -0.16, z);
    stud.rotation.x = Math.PI;
    group.add(stud);
  });

  return group;
}

// Répartition régulière des modèles sur les jalons
const slideToModel = [];
for (let i = 0; i < SLIDE_COUNT; i++){
  slideToModel.push(Math.min(MODEL_URLS.length - 1, Math.floor(i * MODEL_URLS.length / SLIDE_COUNT)));
}

const pieces = MODEL_URLS.map(() => {
  const holder = new THREE.Group();
  holder.visible = false;
  sculpture.add(holder);
  return { holder, materials:[], weight:0, dir:0, loaded:false };
});

let anyReady = false;
function revealSite(){
  if (anyReady) return;
  anyReady = true;
  document.body.classList.remove('no-3d');
  canvas.classList.add('is-ready');
  if (window.__cavartLoader) window.__cavartLoader.reveal();
}

function adoptModel(object, index){
  const piece = pieces[index];
  if (!piece || piece.loaded) return;
  piece.loaded = true;

  object.traverse((child) => {
    if (child.isMesh && child.material){
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if ('envMapIntensity' in m) m.envMapIntensity = 1.3;
        if ('metalness' in m && m.metalness < 0.2) m.metalness = 0.85;
        if ('roughness' in m && m.roughness > 0.85) m.roughness = 0.35;
        m.depthWrite = true;
        piece.materials.push(m);
      });
    }
  });

  frameObject(object);
  piece.holder.add(object);
  revealSite();
}

/* Modèles compressés (géométrie Draco, textures WebP) : le décodeur
   est chargé à la demande. Si un modèle échoue, la sculpture de repli
   occupe sa place sans interrompre les autres. */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const loadRatios = new Array(MODEL_URLS.length).fill(0);
function refreshProgress(){
  const sum = loadRatios.reduce((a, b) => a + b, 0);
  if (window.__cavartLoader){
    window.__cavartLoader.progress(0.06 + (sum / MODEL_URLS.length) * 0.9);
  }
}
refreshProgress();

MODEL_URLS.forEach((url, index) => {
  gltfLoader.load(
    url,
    (gltf) => { loadRatios[index] = 1; refreshProgress(); adoptModel(gltf.scene, index); },
    (evt) => {
      if (evt && evt.total){
        loadRatios[index] = Math.min(1, evt.loaded / evt.total);
        refreshProgress();
      }
    },
    () => { loadRatios[index] = 1; refreshProgress(); adoptModel(buildFallbackSculpture(), index); }
  );
});

setTimeout(() => {
  pieces.forEach((piece, index) => {
    if (!piece.loaded) adoptModel(buildFallbackSculpture(), index);
  });
}, 9000);

/* ------------------- Fondu croisé entre œuvres ------------------- */
const targetWeights = new Array(MODEL_URLS.length).fill(0);

function smoothstep(t){
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function updatePieces(p, dt){
  targetWeights.fill(0);

  const slidePos = Math.max(0, Math.min(SLIDE_COUNT - 0.0001, p * SLIDE_COUNT));
  const index = Math.floor(slidePos);
  const frac  = slidePos - index;

  const half = TRANSITION / 2;
  let from = index, to = index, t = 0;

  if (frac > 1 - half && index < SLIDE_COUNT - 1){
    from = index; to = index + 1;
    t = (frac - (1 - half)) / TRANSITION;
  } else if (frac < half && index > 0){
    from = index - 1; to = index;
    t = 0.5 + frac / TRANSITION;
  }

  const mFrom = slideToModel[from];
  const mTo   = slideToModel[to];
  const blend = smoothstep(t);

  targetWeights[mFrom] += 1 - blend;
  targetWeights[mTo]   += blend;

  /* Sens de passage : l'œuvre sortante se retire vers le bas, l'entrante
     descend depuis le haut. Sans cela les deux pièces se superposent au
     même endroit et l'échange se lit comme un doublon. */
  pieces.forEach((piece) => { piece.dir = 0; });
  if (mFrom !== mTo){
    pieces[mFrom].dir = -1;
    pieces[mTo].dir   = 1;
  }

  const ease = Math.min(1, dt * 6.5);

  pieces.forEach((piece, i) => {
    piece.weight += (targetWeights[i] - piece.weight) * ease;

    const w = piece.weight;
    const visible = w > 0.004;
    piece.holder.visible = visible;
    if (!visible) return;

    const away = 1 - w;
    const dir  = piece.dir || 0;

    piece.holder.scale.setScalar(0.74 + 0.26 * w);
    piece.holder.position.y = dir * away * 0.85;
    piece.holder.rotation.y = dir * away * 0.45;

    const opaque = w > 0.995;
    piece.materials.forEach((m) => {
      m.transparent = !opaque;
      m.opacity = opaque ? 1 : w;
      m.depthWrite = opaque || w > 0.5;
    });
  });
}

/* --------------------- Étincelles de forge --------------------- */
const SPARKS = reduced ? 260 : 1400;
const sparkGeo = new THREE.BufferGeometry();
const sPos = new Float32Array(SPARKS * 3);
const sSeed = new Float32Array(SPARKS);
const sSpeed = new Float32Array(SPARKS);
const sSize = new Float32Array(SPARKS);

for (let i = 0; i < SPARKS; i++){
  const radius = 2.2 + Math.random() * 7.5;
  const angle  = Math.random() * Math.PI * 2;
  sPos[i * 3]     = Math.cos(angle) * radius;
  sPos[i * 3 + 1] = 0;
  sPos[i * 3 + 2] = Math.sin(angle) * radius;
  sSeed[i]  = Math.random();
  sSpeed[i] = 0.28 + Math.random() * 1.05;
  sSize[i]  = 6 + Math.random() * 22;
}

sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
sparkGeo.setAttribute('aSeed',  new THREE.BufferAttribute(sSeed, 1));
sparkGeo.setAttribute('aSpeed', new THREE.BufferAttribute(sSpeed, 1));
sparkGeo.setAttribute('aSize',  new THREE.BufferAttribute(sSize, 1));

const sparkMaterial = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  uniforms:{
    uFlow:{ value:0 }, uTime:{ value:0 },
    uRatio:{ value:Math.min(window.devicePixelRatio, 2) }, uHeat:{ value:0 }
  },
  vertexShader: /* glsl */`
    attribute float aSeed, aSpeed, aSize;
    uniform float uFlow, uTime, uRatio;
    varying float vLife, vSeed;
    void main(){
      float life = fract(aSeed + uFlow * aSpeed * 0.06);
      vLife = life; vSeed = aSeed;
      vec3 p = position;
      p.y = mix(-4.2, 7.4, life);
      p.x += sin(uTime * 0.6 + aSeed * 42.0) * (0.22 + life * 0.75);
      p.z += cos(uTime * 0.45 + aSeed * 31.0) * (0.18 + life * 0.6);
      p.xz *= 1.0 - life * 0.16;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uRatio * (1.0 / max(-mv.z, 0.4)) * (1.25 - life * 0.55);
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying float vLife, vSeed;
    uniform float uHeat;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      if (d > 0.5) discard;
      float core = pow(smoothstep(0.5, 0.0, d), 2.4);
      vec3 col = mix(vec3(1.0, 0.42, 0.10), vec3(1.0, 0.82, 0.42), vLife * 0.85 + uHeat * 0.3);
      float fade = smoothstep(0.0, 0.10, vLife) * smoothstep(1.0, 0.62, vLife);
      float flick = 0.72 + 0.28 * sin(vSeed * 90.0 + vLife * 34.0);
      gl_FragColor = vec4(col, core * fade * flick * (0.55 + uHeat * 0.6));
    }
  `
});

const sparks = new THREE.Points(sparkGeo, sparkMaterial);
scene.add(sparks);

/* ------------------------ Boucle de rendu ------------------------ */
const stage = document.getElementById('stage');
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3(0, 0.15, 0);
let sparkFlow = 0;

function render(){
  requestAnimationFrame(render);

  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.getElapsedTime();

  const state = window.__cavart || { p:0, velocity:0 };
  const p = state.p;
  const heat = Math.min(1, state.velocity * 1.9);

  const y = window.scrollY || 0;
  const stageVisible = !stage || y < stage.offsetHeight + window.innerHeight * 0.4;

  // Orbite 360° pilotée par le scroll
  const angle  = p * Math.PI * 2 + Math.PI * 0.12;
  const radius = 7.4 - Math.sin(p * Math.PI) * 2.3;
  const height = Math.max(0.45, 1.35 + Math.sin(p * Math.PI * 2.0) * 1.35 + p * 0.35);

  camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
  camera.lookAt(camTarget);
  camera.fov = 38 - Math.sin(p * Math.PI) * 5;
  camera.updateProjectionMatrix();

  updatePieces(p, dt);

  sculpture.rotation.y = p * Math.PI * 0.7 + t * 0.04;
  sculpture.position.y = Math.sin(t * 0.55) * 0.07;
  pivot.rotation.z = Math.sin(p * Math.PI * 2) * 0.06;

  rimLight.intensity = 3.1 + heat * 2.4;
  fillLight.intensity = 13 + Math.sin(t * 1.4) * 2.5 + heat * 10;

  sparkFlow += dt * (0.85 + heat * 9.0);
  sparkMaterial.uniforms.uFlow.value = sparkFlow;
  sparkMaterial.uniforms.uTime.value = t;
  sparkMaterial.uniforms.uHeat.value += (heat - sparkMaterial.uniforms.uHeat.value) * 0.08;
  sparks.rotation.y = t * 0.02;

  bgMaterial.uniforms.uTime.value = t;
  bgMaterial.uniforms.uProgress.value = p;
  bgMaterial.uniforms.uVelocity.value += (heat - bgMaterial.uniforms.uVelocity.value) * 0.1;

  if (stageVisible){
    renderer.clear();
    renderer.render(bgScene, bgCamera);
    renderer.render(scene, camera);
  }
}
render();

/* ----------------------- Redimensionnement ----------------------- */
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    bgMaterial.uniforms.uAspect.value = w / h;
    sparkMaterial.uniforms.uRatio.value = Math.min(window.devicePixelRatio, 2);
  }, 150);
}, { passive:true });

window.addEventListener('beforeunload', () => {
  dracoLoader.dispose();
  pmrem.dispose();
  renderer.dispose();
});

}
