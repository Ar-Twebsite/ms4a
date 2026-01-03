import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- SETUP ---
const container = document.querySelector('#canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.04);

const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimization limit
container.appendChild(renderer.domElement);

// --- POST PROCESSING ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- ASSETS GROUPS ---
const groups = {};

// 1. HERO (Icosahedron)
const heroG = new THREE.Group();
const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2, 1),
    new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.9, emissive: 0x00f0ff, emissiveIntensity: 0.6, wireframe: true })
);
heroG.add(ico);
groups.hero = heroG;
scene.add(heroG);

// 2. HOBBY (Steps)
const hobbyG = new THREE.Group();
const sMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x7000ff, emissiveIntensity: 0.5 });
for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.5), sMat);
    m.position.set(Math.sin(i) * 1.5, i - 2, 0); m.rotation.y = i * 0.4; hobbyG.add(m);
}
hobbyG.visible = false;
groups.hobby = hobbyG;
scene.add(hobbyG);

// 3. CITY (Blocks)
const cityG = new THREE.Group();
const bMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00f0ff, emissiveIntensity: 0.4 });
for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, Math.random() * 3 + 1, 0.8), bMat);
    m.position.set((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 3);
    cityG.add(m);
}
cityG.visible = false;
groups.city = cityG;
scene.add(cityG);

// 4. CARDS
const cardG = new THREE.Group();
const cMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.3 });
for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.05), cMat);
    m.position.set((i - 2) * 0.6, 0, 0); m.rotation.z = (i - 2) * 0.1; cardG.add(m);
}
cardG.visible = false;
groups.cards = cardG;
scene.add(cardG);

// 5. HOUSE
const houseG = new THREE.Group();
const hMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400, emissiveIntensity: 0.4 });
const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 2), hMat);
const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1, 4), hMat);
roof.position.y = 1.1; roof.rotation.y = Math.PI / 4;
houseG.add(base, roof);
houseG.visible = false;
groups.house = houseG;
scene.add(houseG);

// 6. NEVE (Particles)
const neveG = new THREE.Group();
const pGeo = new THREE.BufferGeometry();
const pCount = 800;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 10;
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const snow = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, opacity: 0.8, transparent: true }));
neveG.add(snow);
neveG.visible = false;
groups.neve = neveG;
scene.add(neveG);

// LIGHTS
const amb = new THREE.AmbientLight(0xffffff, 0.1); scene.add(amb);
const dir = new THREE.DirectionalLight(0xffffff, 2); dir.position.set(5, 10, 5); scene.add(dir);
const pl = new THREE.PointLight(0x00f0ff, 1, 20); pl.position.set(-5, 2, 5); scene.add(pl);

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
    const t = clock.getElapsedTime();

    if (groups.hero.visible) { groups.hero.rotation.y = t * 0.2; groups.hero.rotation.x = Math.sin(t * 0.5) * 0.1; }
    if (groups.hobby.visible) { groups.hobby.rotation.y = -t * 0.3; }
    if (groups.city.visible) { groups.city.rotation.y = t * 0.1; }
    if (groups.cards.visible) { groups.cards.rotation.y = Math.sin(t) * 0.2; }
    if (groups.neve.visible) { snow.rotation.y = t * 0.1; snow.position.y = Math.sin(t * 0.5) * 0.5; }

    composer.render();
    requestAnimationFrame(animate);
}
animate();

// --- SCROLL LOGIC ---
gsap.registerPlugin(ScrollTrigger);

function switchScene(key) {
    for (let k in groups) {
        if (groups[k].visible) gsap.to(groups[k].scale, { x: 0, y: 0, z: 0, duration: 0.3, onComplete: () => { groups[k].visible = false; } });
    }
    const t = groups[key];
    if (t) {
        t.visible = true; t.scale.set(0, 0, 0);
        gsap.to(t.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(1.7)" });
    }
}

const sections = ['hero', 'hobby', 'city', 'cards', 'house', 'neve']; // IDs mapping to Group keys
sections.forEach(id => {
    ScrollTrigger.create({
        trigger: `#${id}`, start: "top center", end: "bottom center",
        onEnter: () => switchScene(id === 'process' || id === 'contact' ? 'hero' : id), // Reuse hero for generic sections
        onEnterBack: () => switchScene(id === 'process' || id === 'contact' ? 'hero' : id)
    });
});

// Smooth Scroll
const lenis = new Lenis();
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Scroll Bar
window.addEventListener('scroll', () => {
    const r = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    document.getElementById('scrollBar').style.width = `${r * 100}%`;
});

// Cursor
document.addEventListener('mousemove', (e) => {
    gsap.to('.cursor-dot', { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to('.cursor-circle', { x: e.clientX, y: e.clientY, duration: 0.4 });
    // Parallax
    gsap.to(camera.position, { x: (e.clientX / window.innerWidth - 0.5), y: -(e.clientY / window.innerHeight - 0.5), duration: 1 });
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    composer.setSize(container.offsetWidth, container.offsetHeight);
});

// Loader
window.onload = () => {
    setTimeout(() => document.getElementById('loading').classList.add('hidden'), 1000);
}