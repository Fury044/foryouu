import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');

// ─────────────────────────────
// Scene & Camera
// ─────────────────────────────
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// Renderer (transparent for CSS background)
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ─────────────────────────────
// Lighting
// ─────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);

// ─────────────────────────────
// Glow texture (radial gradient)
// ─────────────────────────────
function createGlowTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );

g.addColorStop(0, 'rgba(255, 170, 185, 0.55)');
g.addColorStop(0.4, 'rgba(255, 182, 193, 0.25)'); // soft fade
g.addColorStop(1, 'rgba(255, 182, 193, 0)');      // transparent edge

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(c);
}

// ─────────────────────────────
// Load Model
// ─────────────────────────────
let bouquet;
let glowMesh;
let glowTime = 0;

const loader = new GLTFLoader();
loader.load(
  'lily.glb',
  (gltf) => {
    bouquet = gltf.scene;
    scene.add(bouquet);

    // Center & frame
    const box = new THREE.Box3().setFromObject(bouquet);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    bouquet.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.6, maxDim * 2);
    camera.lookAt(0, 0, 0);

    // ── Emissive glow on petals ──
    // bouquet.traverse((child) => {
    //   if (child.isMesh && child.material) {
    //     child.material.emissive = new THREE.Color(0x7fffe8);
    //     child.material.emissiveIntensity = 0.35;
    //     child.material.toneMapped = false;
    //   }
    // });

    // ── Radial glow plane (NO DOME) ──
    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glowGeometry = new THREE.PlaneGeometry(1, 1);
    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

glowMesh.scale.set(maxDim * 1.3, maxDim * 1.3, 1);
    glowMesh.position.set(
      0,
      size.y * 0.45,   // lift glow upward toward flowers
      // size.z * 0.35    // push glow forward to wrap petals
    );

    bouquet.add(glowMesh);
  },
  undefined,
  (err) => console.error('GLB load error:', err)
);

// ─────────────────────────────
// Resize
// ─────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────
// Animate
// ─────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  if (bouquet) bouquet.rotation.y += 0.002;

  if (glowMesh) {
    glowTime += 0.015;
    glowMesh.material.opacity = 0.44 + Math.sin(glowTime) * 0.03;
    glowMesh.lookAt(camera.position); // prevents dome effect
  }

  renderer.render(scene, camera);
}

animate();
