import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.module.js';

window.__heatModelStatus = { loaded: true, started: [], completed: [], failed: [] };

const configs = [
  {
    id: 'bodyModel',
    path: 'assets/models/khronos-cesium-man.glb',
    fit: 3.55,
    yOffset: -0.08,
    camera: [0, 1.18, 5.25],
    rotation: [0.03, 0.24, 0],
    autoRotate: 0.0023,
    edgeColor: 0xcfc8bb,
    material: {
      color: 0xf9f7f0,
      roughness: 0.84,
      metalness: 0.02
    }
  },
  {
    id: 'homeModel',
    path: 'assets/models/kenney-building-a.glb',
    fit: 3.65,
    yOffset: -0.12,
    camera: [0, 1.45, 5.4],
    rotation: [-0.24, -0.62, 0],
    autoRotate: 0.002,
    edgeColor: 0xd8cfc0,
    material: {
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.01
    }
  }
];

const loader = new GLTFLoader();

function initViewer(config) {
  const host = document.getElementById(config.id);
  const canvas = host?.querySelector('canvas');
  if (!host || !canvas) return;

  window.__heatModelStatus.started.push(config.id);
  host.dataset.modelState = 'loading';
  host.dataset.modelSource = config.path;
  host.classList.add('loading');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(...config.camera);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const root = new THREE.Group();
  root.rotation.set(...config.rotation);
  scene.add(root);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c4a5, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(3.4, 4.6, 5.6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xf1dfc5, 1.2);
  rimLight.position.set(-4, 2.4, 1.8);
  scene.add(rimLight);

  const clay = new THREE.MeshStandardMaterial(config.material);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: config.edgeColor || 0xd5cec0,
    transparent: true,
    opacity: 0.62
  });

  function resize() {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function normalizeModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(config.fit / maxDim);
    model.position.y += config.yOffset;
  }

  loader.load(
    config.path,
    gltf => {
      const model = gltf.scene;
      const outlinedMeshes = [];
      model.traverse(node => {
        if (!node.isMesh) return;
        node.material = clay.clone();
        node.material.flatShading = true;
        node.material.needsUpdate = true;
        node.castShadow = false;
        node.receiveShadow = false;
        outlinedMeshes.push(node);
      });
      outlinedMeshes.forEach(node => {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(node.geometry, 24),
          edgeMaterial.clone()
        );
        edges.renderOrder = 2;
        node.add(edges);
      });
      normalizeModel(model);
      root.add(model);
      host.classList.remove('loading', 'failed');
      host.dataset.modelState = 'ready';
      window.__heatModelStatus.completed.push(config.id);
    },
    undefined,
    error => {
      host.classList.remove('loading');
      host.classList.add('failed');
      host.dataset.modelState = 'failed';
      host.dataset.modelError = error?.message || 'model load failed';
      window.__heatModelStatus.failed.push({ id: config.id, message: host.dataset.modelError });
      console.warn('Heatmap model failed:', config.path, error);
    }
  );

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  host.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture?.(event.pointerId);
  });

  host.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    root.rotation.y += dx * 0.01;
    root.rotation.x = Math.max(-0.72, Math.min(0.72, root.rotation.x + dy * 0.006));
  });

  function stopDrag(event) {
    dragging = false;
    if (event?.pointerId !== undefined) host.releasePointerCapture?.(event.pointerId);
  }

  host.addEventListener('pointerup', stopDrag);
  host.addEventListener('pointercancel', stopDrag);
  host.addEventListener('pointerleave', stopDrag);

  function animate() {
    if (!dragging) root.rotation.y += config.autoRotate;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  animate();
}

configs.forEach(initViewer);
