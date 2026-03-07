import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. EXPRESSIVE TYPOGRAPHY (GSAP)
    // ==========================================
    gsap.registerPlugin(ScrollTrigger);

    const textElements = document.querySelectorAll('.expressive-text');
    textElements.forEach(el => {
        const text = el.innerText;
        el.innerHTML = '';
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            el.appendChild(span);
        });

        gsap.to(el.querySelectorAll('.char'), {
            scrollTrigger: { trigger: el, start: "top 85%" },
            y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: "back.out(1.7)"
        });
    });

    // Fade in scrollytelling glass panels
    const panels = document.querySelectorAll('.step');
    panels.forEach(panel => {
        gsap.to(panel, {
            scrollTrigger: { trigger: panel, start: "top 80%" },
            opacity: 1, y: 0, duration: 1
        });
    });

    // ==========================================
    // 2. AR/VR & 3D SCROLLYTELLING (Three.js)
    // ==========================================
    const canvas = document.querySelector('#bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // WebXR Button
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer)); 
    
    camera.position.set(0, 0, 40);

    // Geometry: Multi-Turn Solenoid / Plasma representation
    const knotGeometry = new THREE.TorusKnotGeometry(10, 2.5, 200, 32);
    const knotMaterial = new THREE.MeshBasicMaterial({ color: 0x3182ce, wireframe: true, transparent: true, opacity: 0.4 });
    const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
    scene.add(torusKnot);

    // Starfield
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 100;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.6 });
    const starfield = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(starfield);

    // Camera Fly-Through Logic
    function moveCamera() {
        const t = document.body.getBoundingClientRect().top;
        torusKnot.rotation.x = t * -0.001;
        torusKnot.rotation.y = t * -0.002;
        camera.position.z = 40 + (t * 0.015);
    }
    document.body.onscroll = moveCamera;

    renderer.setAnimationLoop(() => {
        torusKnot.rotation.x += 0.001;
        torusKnot.rotation.y += 0.001;
        renderer.render(scene, camera);
    });

    // ==========================================
    // 3. FAKE COLLABORATIVE CURSORS
    // ==========================================
    const cursorContainer = document.getElementById('collaborative-cursors');
    const ghostCursors = [];
    
    for(let i=0; i<2; i++) {
        const cursor = document.createElement('div');
        cursor.className = 'ghost-cursor';
        cursorContainer.appendChild(cursor);
        ghostCursors.push({
            element: cursor,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            targetX: Math.random() * window.innerWidth,
            targetY: Math.random() * window.innerHeight
        });
    }

    setInterval(() => {
        ghostCursors.forEach(gc => {
            if(Math.random() > 0.9) {
                gc.targetX = Math.random() * window.innerWidth;
                gc.targetY = window.innerHeight * Math.random(); 
            }
            gc.x += (gc.targetX - gc.x) * 0.05;
            gc.y += (gc.targetY - gc.y) * 0.05;
            gc.element.style.transform = `translate(${gc.x}px, ${gc.y}px)`;
            
            starfield.rotation.x += (gc.y * 0.000005);
            starfield.rotation.y += (gc.x * 0.000005);
        });
    }, 50);

    // ==========================================
    // 4. OBSERVER FOR BOTTOM HALF CARDS
    // ==========================================
    const bottomObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .timeline-item, .gallery-item').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        bottomObserver.observe(el);
    });
});
