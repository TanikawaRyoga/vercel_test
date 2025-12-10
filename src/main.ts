import './style.css'
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

camera.position.z = 100;

// テクスチャローダー
const textureLoader = new THREE.TextureLoader();

// 星フィールド
function createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 4000;
        positions[i + 1] = (Math.random() - 0.5) * 4000;
        positions[i + 2] = (Math.random() - 0.5) * 4000;

        colors[i] = Math.random();
        colors[i + 1] = Math.random();
        colors[i + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 2, vertexColors: true });
    scene.add(new THREE.Points(geometry, material));
}

createStarfield();

// 惑星を作成（テクスチャ付き）
function createPlanet(size: number, color: number, x: number, y: number, z: number, textureUrl?: string) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    let material;
    
    if (textureUrl) {
        const texture = textureLoader.load(textureUrl);
        material = new THREE.MeshPhongMaterial({ map: texture });
    } else {
        material = new THREE.MeshPhongMaterial({ color });
    }
    
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    scene.add(planet);
    return planet;
}

// 衛星を作成
function createMoon(size: number, planetMesh: THREE.Mesh, distance: number, speed: number) {
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
    const moon = new THREE.Mesh(geometry, material);
    
    return { mesh: moon, planet: planetMesh, distance, speed, angle: 0 };
}

const earth = createPlanet(15, 0x4169E1, 0, 0, 0);
const mars = createPlanet(8, 0xFF6347, 60, 0, 0);
const jupiter = createPlanet(25, 0xDAA520, -80, 0, 0);

const sunLight = new THREE.PointLight(0xFFFFFF, 3, 500);
sunLight.position.set(50, 50, 50);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);

// 衛星を追加
const moonMeshes: any[] = [];
const moonData = [
    createMoon(3, earth, 25, 0.01),
    createMoon(2, earth, 35, 0.005),
    createMoon(2, mars, 15, 0.015),
    createMoon(5, jupiter, 45, 0.003),
];


window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotation.y = mouseX * Math.PI;
    targetRotation.x = mouseY * Math.PI * 0.5;
});

// タッチ操作を追加
window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
    targetRotation.y = mouseX * Math.PI;
    targetRotation.x = mouseY * Math.PI * 0.5;
}, { passive: true });

moonData.forEach(moon => {
    scene.add(moon.mesh);
    moonMeshes.push(moon);
});

// マウス操作
let mouseX = 0;
let mouseY = 0;
const targetRotation = { x: 0, y: 0 };

window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotation.y = mouseX * Math.PI;
    targetRotation.x = mouseY * Math.PI * 0.5;
});

// ウィンドウリサイズ
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// アニメーション
function animate() {
    requestAnimationFrame(animate);

    // カメラを滑らかに回転
    camera.position.x += (Math.sin(targetRotation.y) * 100 - camera.position.x) * 0.05;
    camera.position.y += (targetRotation.x * 100 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // 惑星の回転
    earth.rotation.y += 0.002;
    mars.rotation.y += 0.003;
    jupiter.rotation.y += 0.001;

    // 惑星の公転
    earth.position.x = 0;
    mars.position.x = 60 * Math.cos(Date.now() * 0.0001);
    mars.position.z = 60 * Math.sin(Date.now() * 0.0001);
    jupiter.position.x = -80 * Math.cos(Date.now() * 0.00005);
    jupiter.position.z = -80 * Math.sin(Date.now() * 0.00005);

    // 衛星の軌道
    moonMeshes.forEach(moon => {
        moon.angle += moon.speed;
        const planetPos = moon.planet.position;
        moon.mesh.position.x = planetPos.x + Math.cos(moon.angle) * moon.distance;
        moon.mesh.position.y = planetPos.y + Math.sin(moon.angle) * moon.distance * 0.3;
        moon.mesh.position.z = planetPos.z + Math.sin(moon.angle) * moon.distance;
    });

    renderer.render(scene, camera);
}

animate();