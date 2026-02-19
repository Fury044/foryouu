import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);

// Load model
let bouquet;

const loader = new GLTFLoader();
console.log('⏳ Starting to load lily.glb...');
loader.load('lily.glb',
  (gltf) => {
    console.log('✅ GLB loaded successfully');
    console.log('Model details:', {
      name: gltf.scene.name || 'Unnamed',
      children: gltf.scene.children.length,
      animations: gltf.animations ? gltf.animations.length : 0,
      scene: gltf.scene
    });

    bouquet = gltf.scene;
    scene.add(bouquet);
    console.log('🎨 Model added to scene:', bouquet);
    
    // Log scene contents
    console.log('🖼️ Scene children:', scene.children);

    // --- AUTO FRAME THE MODEL ---
    const box = new THREE.Box3().setFromObject(bouquet);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center the model
    bouquet.position.sub(center);

    // Position camera based on model size
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.6, maxDim * 2);
    camera.lookAt(0, 0, 0);
  },
  undefined,
  (error) => {
    console.error('❌ GLB load error', error);
    console.log('Trying to list files in directory...');
    // This will help debug if the file is in the correct location
    fetch('.')
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        const files = links.map(link => link.href.split('/').pop()).filter(Boolean);
        console.log('📂 Files in directory:', files);
      })
      .catch(e => console.error('Error listing directory:', e));
  }
);


// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  if (bouquet) {
    bouquet.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}
animate();
