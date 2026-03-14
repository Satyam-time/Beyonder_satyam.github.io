import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
// Imports for the Big Bang Post-Processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ==========================================
// CINEMATIC WEBGL BIG BANG INTRO (Once Per Session)
// ==========================================
window.addEventListener('load', () => {
    const introWrapper = document.getElementById('intro-wrapper');
    const subpageLoader = document.getElementById('subpage-loader');
    const hasPlayed = sessionStorage.getItem('introPlayed');

    // THE MASTER REVEAL FUNCTION
    // This handles both sub-pages AND returning to the homepage
    const triggerSubpageReveal = () => {
        const tl = gsap.timeline();
        
        // If a custom sub-page loader exists, let it play for 0.8 seconds, then fade it out
        if (subpageLoader) {
            tl.to(subpageLoader, { 
                opacity: 0, 
                duration: 0.5, 
                delay: 0.8, // Gives the user just enough time to appreciate the custom animation
                ease: "power2.inOut", 
                onComplete: () => subpageLoader.remove() 
            });
        }
        
        // Bloom the main site content right as the loader fades away
        tl.fromTo('.hero-fade-in', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.5)" }, subpageLoader ? "-=0.2" : 0)
          .fromTo('.navbar', { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.6");
    };

    // SCENARIO 1: Sub-page (No Big Bang wrapper exists).
    if (!introWrapper) {
        triggerSubpageReveal();
        return; 
    }

    // SCENARIO 2: Home page, but already watched intro.
    if (hasPlayed === 'true') {
        introWrapper.remove();
        triggerSubpageReveal();
        return;
    }

    // SCENARIO 3: First time visiting! Run the Big Bang.
    if (subpageLoader) subpageLoader.remove(); // Hide the subpage loader so Big Bang can play cleanly

    // SCENARIO 4: First time visiting! Run the Big Bang.
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1; bloomPass.strength = 1.2; bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    function createEnergyCluster(colorHex, particleCount, radius) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for(let i = 0; i < particleCount; i++) {
            const u = Math.random(), v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = Math.cbrt(Math.random()) * radius;
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi);
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('basePosition', new THREE.BufferAttribute(new Float32Array(positions), 3));
        const material = new THREE.PointsMaterial({
            size: 0.15, color: new THREE.Color(colorHex), transparent: true,
            opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
        });
        return new THREE.Points(geometry, material);
    }

    const chemGroup = createEnergyCluster(0x10b981, 3000, 5); chemGroup.position.set(-15, -10, 0);
    const astroGroup = createEnergyCluster(0x3b82f6, 3000, 5); astroGroup.position.set(0, 15, 0);
    const physicsGroup = createEnergyCluster(0xd946ef, 3000, 5); physicsGroup.position.set(15, -10, 0);
    scene.add(chemGroup, astroGroup, physicsGroup);

    const singularity = createEnergyCluster(0xffffff, 5000, 1); singularity.scale.set(0,0,0);
    scene.add(singularity);

    const explosion = createEnergyCluster(0xffaa00, 20000, 10);
    explosion.material.size = 0.2; explosion.scale.set(0,0,0);
    scene.add(explosion);

    const mouse = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointOfIntersection = new THREE.Vector3();

    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, pointOfIntersection);
    });

    const clock = new THREE.Clock();
    let isOrbiting = true;
    let isInteractive = false;
    let animationId; 

    function animate() {
        animationId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if(isOrbiting) {
            chemGroup.rotation.y = elapsedTime * 0.5; chemGroup.position.y = -10 + Math.sin(elapsedTime * 2) * 2;
            astroGroup.rotation.x = elapsedTime * 0.5; astroGroup.position.y = 15 + Math.cos(elapsedTime * 1.5) * 2;
            physicsGroup.rotation.z = elapsedTime * 0.5; physicsGroup.position.y = -10 + Math.sin(elapsedTime * 2.5) * 2;
            explosion.rotation.y -= 0.01;
        } else if (!isInteractive) {
            chemGroup.rotation.y += 0.1; astroGroup.rotation.x += 0.1; physicsGroup.rotation.z += 0.1;
            singularity.rotation.y += 0.2;
            explosion.rotation.y -= 0.01;
        }

        if (isInteractive) {
            const positions = explosion.geometry.attributes.position.array;
            const basePositions = explosion.geometry.attributes.basePosition.array;
            const scale = explosion.scale.x;
            const mx = pointOfIntersection.x / scale;
            const my = pointOfIntersection.y / scale;

            for(let i = 0; i < 20000; i++) {
                const idx = i * 3;
                let px = positions[idx], py = positions[idx+1], pz = positions[idx+2];
                const bx = basePositions[idx], by = basePositions[idx+1], bz = basePositions[idx+2];
                const dx = px - mx, dy = py - my;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                const influenceRadius = 2.5; 
                if(dist < influenceRadius) {
                    const force = (influenceRadius - dist) / influenceRadius;
                    px += (dx / dist) * force * 0.15;
                    py += (dy / dist) * force * 0.15;
                }
                px += (bx - px) * 0.04; py += (by - py) * 0.04; pz += (bz - pz) * 0.04;
                positions[idx] = px; positions[idx+1] = py; positions[idx+2] = pz;
            }
            explosion.geometry.attributes.position.needsUpdate = true;
        }
        composer.render();
    }
    animate();

    // GSAP TIMELINE FOR INTRO (Accelerated)
    setTimeout(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                isInteractive = true;
                document.addEventListener('mousemove', (e) => {
                    if(!isInteractive) return; 
                    gsap.to('#ui-layer', { x: (e.clientX - window.innerWidth / 2) * 0.02, y: (e.clientY - window.innerHeight / 2) * 0.02, duration: 0.5 });
                });
            }
        });

        tl.to({}, { duration: 0.1, onStart: () => { isOrbiting = false; } })
        .to([chemGroup.position, astroGroup.position, physicsGroup.position], { x: 0, y: 0, z: 0, duration: 1, ease: "power4.in" }, "pull")
        .to([chemGroup.scale, astroGroup.scale, physicsGroup.scale], { x: 0.1, y: 0.1, z: 0.1, duration: 1, ease: "power4.in" }, "pull")
        .to(bloomPass, { strength: 3, duration: 1, ease: "power2.in" }, "pull")
        .to(singularity.scale, { x: 3, y: 3, z: 3, duration: 0.5, ease: "back.out(1.5)" }, "singularity")
        .to(singularity.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.3, ease: "expo.in" }, "singularity+=0.5")
        .to(bloomPass, { strength: 10, duration: 0.3, ease: "expo.in" }, "singularity+=0.5")
        .to(explosion.scale, { x: 40, y: 40, z: 40, duration: 1, ease: "power4.out" }, "bang")
        .to(singularity.scale, { x: 60, y: 60, z: 60, duration: 0.5, ease: "power2.in" }, "bang")
        .to(bloomPass, { strength: 15, duration: 0.2 }, "bang")
        .to("#flash", { opacity: 1, duration: 0.2, ease: "power4.in" }, "bang+=0.1")
        .to(camera.position, { z: 120, duration: 1.5, ease: "power3.out" }, "bang")
        .to("#flash", { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "reveal")
        .to(bloomPass, { strength: 1.5, duration: 1.5, ease: "power2.out" }, "reveal")
        .to("#intro-title", { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }, "reveal+=0.2")
        .to("#intro-subtitle", { opacity: 1, duration: 1, ease: "power2.out" }, "reveal+=0.5")
        .to("#enter-btn", { opacity: 1, duration: 0.5, ease: "power2.out" }, "reveal+=0.8");

    }, 300);

    // TRANSITION TO MAIN SITE
    document.getElementById('enter-btn').addEventListener('click', () => {
        isInteractive = false; 
        
        // Save to session memory! Browser remembers this until tab is closed.
        sessionStorage.setItem('introPlayed', 'true');
        
        gsap.to('#ui-layer', { opacity: 0, duration: 0.3 });
        gsap.to(camera.position, { z: -50, duration: 0.8, ease: "power2.in" });

        gsap.to(introWrapper, { 
            opacity: 0, duration: 0.8, delay: 0.4,
            onComplete: () => {
                cancelAnimationFrame(animationId);
                introWrapper.remove();
                gsap.fromTo('.hero-fade-in', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: "back.out(1.5)" });
                gsap.fromTo('.navbar', { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4");
            }
        });
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
});

// ==========================================
// MAIN SITE INTERACTIONS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // GSAP SPOTLIGHT CURSOR & EYE TRACKING
    const circle = document.querySelector(".circle");
    const follow = document.querySelector(".circle-follow");
    const ambientCursor = document.getElementById("cursor");
    
    // Grab BOTH the astronaut eyes and the new nav eyes!
    const astroEyes = document.querySelectorAll('.astro-eye, .nav-eye');

    // HIGH-PERFORMANCE MOUSE TRACKING ENGINE (120Hz+ Sync)
    let eyeFrameId = null;

    if (circle && follow) {
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX; 
            const mouseY = e.clientY;

            // 1. Let GSAP handle the custom cursor 
            gsap.to(circle, { duration: 0.3, x: mouseX, y: mouseY });
            gsap.to(follow, { duration: 0.7, x: mouseX, y: mouseY });

            if (ambientCursor) {
                const xPercent = Math.round((mouseX / window.innerWidth) * 100);
                const yPercent = Math.round((mouseY / window.innerHeight) * 100);
                gsap.to(ambientCursor, { duration: 0.6, "--x": `${xPercent}%`, "--y": `${yPercent}%`, ease: "power2.out" });
            }

            // 2. Hardware-Accelerated Eye Tracking
            if (eyeFrameId) cancelAnimationFrame(eyeFrameId); 
            
            eyeFrameId = requestAnimationFrame(() => {
                astroEyes.forEach(eye => {
                    // Measure the PARENT socket, not the moving pupil
                    const rect = eye.parentElement.getBoundingClientRect();
                    const eyeCenterX = rect.left + rect.width / 2;
                    const eyeCenterY = rect.top + rect.height / 2;
                    
                    const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
                    const distance = 5; // The cartoon travel distance
                    const moveX = Math.cos(angle) * distance;
                    const moveY = Math.sin(angle) * distance;
                    
                    eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
                });
            });
        });

        // 3. Hover effects for links and buttons
        document.querySelectorAll("a, .btn, .claymorphic, .gallery-item").forEach(el => {
            el.addEventListener("mouseenter", () => {
                gsap.to(circle, { duration: 0.3, opacity: 1, scale: 0 });
                gsap.to(follow, { duration: 0.3, width: 80, height: 80, left: -40, top: -40, backgroundColor: "rgba(255,255,255,0.3)" });
            });
            el.addEventListener("mouseleave", () => {
                gsap.to(circle, { duration: 0.3, opacity: 1, scale: 1 });
                gsap.to(follow, { duration: 0.3, width: 30, height: 30, left: -15, top: -15, backgroundColor: "#fff" });
            });
        });
    }
    
    // Faux 3D Cards
    document.querySelectorAll('.faux-3d-card').forEach(card => {
        const content = card.querySelector('.faux-3d-content');
        if(content) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                content.style.transform = `rotateY(${x / 20}deg) rotateX(${-y / 20}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                content.style.transform = `rotateY(0deg) rotateX(0deg)`;
                content.style.transition = `transform 0.5s ease`;
            });
            card.addEventListener('mouseenter', () => content.style.transition = `none`);
        }
    });

    // GSAP Expressive Typography (Fixed Word Wrapping)
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.expressive-text').forEach(el => {
        const words = el.innerText.split(' '); // Split by words first!
        el.innerHTML = ''; 
        
        words.forEach(word => {
            // Create a protective wrapper for the whole word
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block'; // Forces the word to stay together
            
            // Now split the letters inside that wrapper
            word.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.innerText = char;
                wordSpan.appendChild(charSpan);
            });
            
            el.appendChild(wordSpan);
            
            // Add a standard space between words
            const space = document.createElement('span');
            space.innerHTML = '&nbsp;';
            el.appendChild(space);
        });
        
        // The animation remains exactly the same
        gsap.to(el.querySelectorAll('.char'), { 
            scrollTrigger: { trigger: el, start: "top 85%" }, 
            y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: "back.out(1.7)" 
        });
    });

    // SKS LOGO CARTOON CLICK
    const sksLogo = document.getElementById('sks-logo');
    if (sksLogo) {
        sksLogo.addEventListener('click', (e) => {
            e.preventDefault(); 
            const text = sksLogo.querySelector('.logo-text');
            const burst = sksLogo.querySelector('.line-burst');
            text.classList.remove('rubber-bounce');
            burst.classList.remove('burst-active');
            void sksLogo.offsetWidth;
            text.classList.add('rubber-bounce');
            burst.classList.add('burst-active');
            setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
        });
    }

    // SMART 3D SCENE ROUTER
    const canvas = document.querySelector('#bg-canvas');
    let starfield; 
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        
        // Create the VR Button
        const vrBtn = VRButton.createButton(renderer);
        
        // Target the white glass panel explicitly!
        const heroPanel = document.getElementById('hero-panel');
        if(heroPanel) {
            heroPanel.appendChild(vrBtn);
        } else {
            document.body.appendChild(vrBtn);
        }
        
        camera.position.set(0, 0, 40);

        const pageId = document.body.id; 
        let activeMesh;

        const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x66fcf1, wireframe: true, transparent: true, opacity: 0.4, side: THREE.DoubleSide });

        if (pageId === 'page-research') {
            activeMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(12, 1), wireMaterial);
        } else if (pageId === 'page-publications') {
            activeMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 20, 20), wireMaterial);
            activeMesh.rotation.x = -Math.PI / 3; 
        } else if (pageId === 'page-experience') {
            activeMesh = new THREE.Group();
            const r1 = new THREE.Mesh(new THREE.TorusGeometry(8, 0.1, 16, 100), wireMaterial);
            const r2 = new THREE.Mesh(new THREE.TorusGeometry(14, 0.1, 16, 100), wireMaterial);
            r2.rotation.x = Math.PI / 2;
            const r3 = new THREE.Mesh(new THREE.TorusGeometry(20, 0.1, 16, 100), wireMaterial);
            r3.rotation.y = Math.PI / 2;
            activeMesh.add(r1, r2, r3);
            
        // ADD THIS NEW BLOCK RIGHT HERE:
        } else if (pageId === 'page-organisations') {
            activeMesh = new THREE.Group();
            
            // 1. Solid Dark Core
            const coreGlobe = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 32), new THREE.MeshBasicMaterial({ color: 0x050814 }));
            
            // 2. Glowing Holographic Grid (Lat/Long lines)
            const gridGlobe = new THREE.Mesh(new THREE.SphereGeometry(12.2, 24, 24), new THREE.MeshBasicMaterial({ color: 0x66fcf1, wireframe: true, transparent: true, opacity: 0.2 }));
            
            // 3. Data Rings Orbiting the Globe
            const orbit1 = new THREE.Mesh(new THREE.TorusGeometry(18, 0.05, 16, 100), wireMaterial);
            orbit1.rotation.x = Math.PI / 2;
            
            const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(22, 0.05, 16, 100), wireMaterial);
            orbit2.rotation.y = Math.PI / 3;

            activeMesh.add(coreGlobe, gridGlobe, orbit1, orbit2);
            activeMesh.rotation.z = 0.2; // Give it a slight planetary tilt
            
        } else if (pageId === 'page-blog') {
            activeMesh = new THREE.Group();
            
            // 1. The Singularity Core
            const core = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            
            // 2. The Accretion Disk (Denser wireframe grid)
            const disk = new THREE.Mesh(new THREE.RingGeometry(4.5, 18, 64, 12), wireMaterial);
            disk.rotation.x = Math.PI / 2; 
            
            // 3. Glowing Energy Material for the Jets
            const energyMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x66fcf1, transparent: true, opacity: 0.15, 
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false 
            });

            // 4. Top Relativistic Jet (Solid glowing core + wireframe net)
            const topJetEnergy = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.5, 35, 32, 1, true), energyMaterial);
            const topJetGrid = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 0.6, 35, 16, 12, true), wireMaterial);
            topJetEnergy.position.y = 17.5; topJetGrid.position.y = 17.5;
            
            // 5. Bottom Relativistic Jet
            const bottomJetEnergy = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.5, 35, 32, 1, true), energyMaterial);
            const bottomJetGrid = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 0.6, 35, 16, 12, true), wireMaterial);
            bottomJetEnergy.rotation.x = Math.PI; bottomJetGrid.rotation.x = Math.PI;
            bottomJetEnergy.position.y = -17.5; bottomJetGrid.position.y = -17.5;
            
            activeMesh.add(core, disk, topJetEnergy, bottomJetEnergy, topJetGrid, bottomJetGrid);
            
            // Cinematic tilt
            activeMesh.rotation.x = 0.2; 
            activeMesh.rotation.z = -0.15;

        } else {
            // 1. THE MASSIVE TORUS OVERRIDE
            const massiveGeometry = new THREE.TorusKnotGeometry(18, 4, 200, 32);
            const neonMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x66fcf1, 
                wireframe: true, 
                transparent: true, 
                opacity: 0.9, 
                side: THREE.DoubleSide 
            });
            
            activeMesh = new THREE.Mesh(massiveGeometry, neonMaterial);
            
            // EXPLICITLY center it so it hides perfectly behind the Hero Square
            activeMesh.position.x = 0; 
            activeMesh.position.y = 0;
        }
        scene.add(activeMesh);

        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(1500 * 3);
        for(let i = 0; i < 1500 * 3; i++) {
            posArray[i * 3] = (Math.random() - 0.5) * 100;
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 150; 
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starfield = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.6 }));
        scene.add(starfield);

        document.body.onscroll = () => {
            const t = document.body.getBoundingClientRect().top;
            if (pageId === 'page-publications') {
                activeMesh.rotation.z = t * -0.001; 
            } else {
                activeMesh.rotation.x = t * -0.001;
                activeMesh.rotation.y = t * -0.002;
            }
            
            // THE FIX: Zoom speed cut in half (0.008), and stops further back (28)
            camera.position.z = Math.max(28, 40 + (t * 0.008)); 
        };

        renderer.setAnimationLoop(() => {
            if (pageId === 'page-publications') {
                const time = Date.now() * 0.002;
                const positions = activeMesh.geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const x = positions.getX(i);
                    const y = positions.getY(i);
                    positions.setZ(i, Math.sin(x/5 + time) * Math.cos(y/5 + time) * 3);
                }
                positions.needsUpdate = true;
            } else if (pageId === 'page-blog') {
                activeMesh.rotation.y += 0.003; 
                activeMesh.children[1].rotation.z -= 0.04; 
                const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
                for(let j = 2; j <= 5; j++) {
                    activeMesh.children[j].scale.set(1, pulse, 1);
                }
                
            // ADD THIS NEW ANIMATION BLOCK RIGHT HERE:
            } else if (pageId === 'page-organisations') {
                activeMesh.children[1].rotation.y += 0.002; // Spin the holographic grid
                activeMesh.children[2].rotation.z += 0.005; // Spin inner data ring
                activeMesh.children[3].rotation.x += 0.004; // Spin outer data ring
                activeMesh.rotation.y += 0.001; // Slowly rotate the whole planetary system

            } else {
                activeMesh.rotation.x += 0.002;
                activeMesh.rotation.y += 0.003;
            }
            renderer.render(scene, camera);
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const cursorContainer = document.getElementById('collaborative-cursors');
        const activeCursors = {}; 
        if (typeof io !== 'undefined') {
            const socket = io('http://localhost:5000'); 
            document.addEventListener('mousemove', (e) => { socket.emit('cursor_move', { x: e.clientX, y: e.clientY }); });
            socket.on('update_cursor', (data) => {
                if (!activeCursors[data.id]) {
                    const ghost = document.createElement('div');
                    ghost.className = 'ghost-cursor';
                    if(cursorContainer) cursorContainer.appendChild(ghost);
                    activeCursors[data.id] = ghost;
                }
                activeCursors[data.id].style.transform = `translate(${data.x}px, ${data.y}px)`;
                if(starfield) { starfield.rotation.x += (data.y * 0.000005); starfield.rotation.y += (data.x * 0.000005); }
            });
            socket.on('remove_cursor', (id) => {
                if (activeCursors[id]) { activeCursors[id].remove(); delete activeCursors[id]; }
            });
        }
    }

    // Scroll Observers
    const bottomObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .gallery-item').forEach(el => {
        el.style.opacity = 0; el.style.transform = 'translateY(30px)'; el.style.transition = 'all 0.6s ease-out';
        bottomObserver.observe(el);
    });

    // HOVER WEB ANIMATION
    const webCanvas = document.querySelector('.web-canvas');
    if(webCanvas) {
        const ctx = webCanvas.getContext('2d');
        let width, height, particles = [];
        let mouse = { x: null, y: null, radius: 150 };

        function resizeWebCanvas() {
            width = webCanvas.parentElement.offsetWidth; 
            height = webCanvas.parentElement.offsetHeight;
            webCanvas.width = width; 
            webCanvas.height = height;
        }
        window.addEventListener('resize', resizeWebCanvas);
        resizeWebCanvas();

        webCanvas.parentElement.addEventListener('mousemove', (e) => {
            const rect = webCanvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
        });
        webCanvas.parentElement.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

        class WebParticle {
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 3.5; this.vy = (Math.random() - 0.5) * 3.5;
                this.size = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(49, 130, 206, 0.3)'; ctx.fill();
            }
        }
        for (let i = 0; i < 70; i++) particles.push(new WebParticle());

        function animateWeb() {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update(); particles[i].draw();
                if (mouse.x != null) {
                    let dx = mouse.x - particles[i].x; let dy = mouse.y - particles[i].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(49, 130, 206, ${1 - distance/mouse.radius})`;
                        ctx.lineWidth = 1; ctx.moveTo(particles[i].x, particles[i].y); 
                        ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateWeb);
        }
        animateWeb();
    }

    // CONTACT FORM
    const form = document.getElementById('contactForm');
    if(form) {
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const msgInput = document.getElementById('msgInput');
        const errorMsg = document.getElementById('formErrorMsg');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            let hasError = false; errorMsg.innerText = '';
            [nameInput, emailInput, msgInput].forEach(el => el.classList.remove('error-shake'));

            if(!nameInput.value.trim() || !emailInput.value.trim() || !msgInput.value.trim()) {
                hasError = true; errorMsg.innerText = 'Please complete all required fields.';
                if(!nameInput.value.trim()) nameInput.classList.add('error-shake');
                if(!emailInput.value.trim()) emailInput.classList.add('error-shake');
                if(!msgInput.value.trim()) msgInput.classList.add('error-shake');
            }

            if(!hasError) {
                btnText.innerHTML = "Routing...";
                try {
                    const response = await fetch('http://localhost:5000/api/contact', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: nameInput.value.trim(), email: emailInput.value.trim(), message: msgInput.value.trim() })
                    });
                    const data = await response.json();
                    if(response.ok) {
                        errorMsg.style.color = '#48bb78'; errorMsg.innerText = 'Message securely routed to SKS servers!';
                        btnText.innerHTML = "✓ Sent!"; submitBtn.style.background = "#48bb78"; submitBtn.style.transform = "scale(1.05)";
                        form.reset();
                    } else { throw new Error(data.error || 'Server error'); }
                } catch (error) {
                    errorMsg.style.color = '#e53e3e'; errorMsg.innerText = 'Server offline. Please try again later.'; btnText.innerHTML = "Error";
                }
                setTimeout(() => { btnText.innerHTML = "Send Message"; submitBtn.style.background = "transparent"; submitBtn.style.transform = "scale(1)"; }, 3000);
            }
        });
    }
});

// ==========================================
    // QUANTUM FIBER TIMELINE ANIMATIONS
    // ==========================================
    const timelineSpine = document.querySelector('.timeline-spine-glow');
    if (timelineSpine) {
        // 1. Draw the laser line as you scroll
        gsap.to(timelineSpine, {
            scrollTrigger: {
                trigger: '.quantum-timeline',
                start: "top 60%", // Starts drawing when timeline is 60% down the screen
                end: "bottom 80%", // Finishes drawing near the bottom
                scrub: 1 // Smoothly links to scroll bar
            },
            height: "100%",
            ease: "none"
        });

        // 2. Slide the glass cards in from the sides
        gsap.utils.toArray('.timeline-event').forEach(event => {
            const isLeft = event.classList.contains('left');
            
            // Set initial state
            gsap.set(event, { opacity: 0, x: isLeft ? -50 : 50 });
            
            // Animate on scroll
            gsap.to(event, {
                scrollTrigger: {
                    trigger: event,
                    start: "top 85%", // Triggers when the card enters the viewport
                },
                opacity: 1, 
                x: 0, 
                duration: 0.8, 
                ease: "back.out(1.5)"
            });
        });
    }

// ==========================================
// MOBILE TOUCH SYNTHESIZER
// ==========================================
window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const simulatedMouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
    });
    window.dispatchEvent(simulatedMouseEvent);
    document.dispatchEvent(simulatedMouseEvent);
}, { passive: true });
