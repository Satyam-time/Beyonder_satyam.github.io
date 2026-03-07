import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// ==========================================
// 1. LOADING SCREEN (Orbital Physics Loader)
// ==========================================
window.addEventListener('load', () => {
    // Add a slight delay so the orbital animation is enjoyed before revealing the site
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if(loader) loader.classList.add('hidden');
    }, 1200);
});

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 2. EXPRESSIVE TYPOGRAPHY & FADE-INS (GSAP)
    // ==========================================
    // Register the ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Expressive text reveal (character by character)
    const textElements = document.querySelectorAll('.expressive-text');
    textElements.forEach(el => {
        const text = el.innerText;
        el.innerHTML = ''; // Clear original text
        
        // Wrap each character in a span
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            el.appendChild(span);
        });

        // Animate the spans
        gsap.to(el.querySelectorAll('.char'), {
            scrollTrigger: { 
                trigger: el, 
                start: "top 85%" 
            },
            y: 0, 
            opacity: 1, 
            stagger: 0.02, 
            duration: 0.8, 
            ease: "back.out(1.7)"
        });
    });

    // Fade in scrollytelling glass panels
    const panels = document.querySelectorAll('.step');
    panels.forEach(panel => {
        gsap.to(panel, {
            scrollTrigger: { 
                trigger: panel, 
                start: "top 80%" 
            },
            opacity: 1, 
            y: 0, 
            duration: 1
        });
    });

    // ==========================================
    // 3. AR/VR & 3D SCROLLYTELLING (Three.js)
    // ==========================================
    const canvas = document.querySelector('#bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Enable WebXR for AR/VR capabilities
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer)); 
    
    camera.position.set(0, 0, 40);

    // 3D Geometry: Multi-Turn Solenoid / Plasma Magnetic Confinement representation
    const knotGeometry = new THREE.TorusKnotGeometry(10, 2.5, 200, 32);
    const knotMaterial = new THREE.MeshBasicMaterial({ color: 0x3182ce, wireframe: true, transparent: true, opacity: 0.4 });
    const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
    scene.add(torusKnot);

    // 3D Background: Deep Starfield
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 100;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 150; // Deep Z axis for fly-through
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.6 });
    const starfield = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(starfield);

    // Scrollytelling: Camera Fly-Through Logic
    function moveCamera() {
        const t = document.body.getBoundingClientRect().top;
        torusKnot.rotation.x = t * -0.001;
        torusKnot.rotation.y = t * -0.002;
        camera.position.z = 40 + (t * 0.015);
    }
    document.body.onscroll = moveCamera;

    // Render Loop (Uses setAnimationLoop for WebXR support)
    renderer.setAnimationLoop(() => {
        torusKnot.rotation.x += 0.001;
        torusKnot.rotation.y += 0.001;
        renderer.render(scene, camera);
    });

    // Handle Window Resizing for 3D Canvas
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // 4. FAKE COLLABORATIVE CURSORS
    // ==========================================
    const cursorContainer = document.getElementById('collaborative-cursors');
    const ghostCursors = [];
    
    // Create 2 simulated "guests" viewing your portfolio
    for(let i=0; i<2; i++) {
        const cursor = document.createElement('div');
        cursor.className = 'ghost-cursor';
        if(cursorContainer) cursorContainer.appendChild(cursor);
        ghostCursors.push({
            element: cursor,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            targetX: Math.random() * window.innerWidth,
            targetY: Math.random() * window.innerHeight
        });
    }

    // Animate the ghost cursors and slightly shift the 3D starfield based on their movement
    setInterval(() => {
        ghostCursors.forEach(gc => {
            // Give them a new random target occasionally
            if(Math.random() > 0.9) {
                gc.targetX = Math.random() * window.innerWidth;
                gc.targetY = window.innerHeight * Math.random(); 
            }
            // Smoothly move toward target (easing)
            gc.x += (gc.targetX - gc.x) * 0.05;
            gc.y += (gc.targetY - gc.y) * 0.05;
            gc.element.style.transform = `translate(${gc.x}px, ${gc.y}px)`;
            
            // Interactive Physics: Rotate stars slightly based on guest cursors
            starfield.rotation.x += (gc.y * 0.000005);
            starfield.rotation.y += (gc.x * 0.000005);
        });
    }, 50);

    // ==========================================
    // 5. BOTTOM HALF CARDS REVEAL OBSERVER
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

    // ==========================================
    // 6. ERROR ANIMATIONS (Form Validation)
    // ==========================================
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const msgInput = document.getElementById('msgInput');
    const errorMsg = document.getElementById('formErrorMsg');

    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); 
            let hasError = false;
            errorMsg.innerText = '';

            // Reset shake classes
            [nameInput, emailInput, msgInput].forEach(el => el.classList.remove('error-shake'));

            // Check if fields are empty
            if(!nameInput.value.trim() || !emailInput.value.trim() || !msgInput.value.trim()) {
                hasError = true;
                errorMsg.innerText = 'Please complete all required fields.';
                
                // Add shake class to specific empty fields
                if(!nameInput.value.trim()) nameInput.classList.add('error-shake');
                if(!emailInput.value.trim()) emailInput.classList.add('error-shake');
                if(!msgInput.value.trim()) msgInput.classList.add('error-shake');
            }

            if(!hasError) {
                errorMsg.style.color = 'green';
                errorMsg.innerText = 'Message sent successfully! (Simulation)';
                form.reset();
            }
        });
    }

    // ==========================================
    // 7. HOVER WEB ANIMATION (Interactive Canvas)
    // ==========================================
    const webCanvas = document.querySelector('.web-canvas');
    if(webCanvas) {
        const ctx = webCanvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: null, y: null, radius: 150 };

        function resizeWebCanvas() {
            width = webCanvas.parentElement.offsetWidth;
            height = webCanvas.parentElement.offsetHeight;
            webCanvas.width = width;
            webCanvas.height = height;
        }
        window.addEventListener('resize', resizeWebCanvas);
        resizeWebCanvas();

        // Track mouse movement strictly within the section containing the canvas
        webCanvas.parentElement.addEventListener('mousemove', (e) => {
            const rect = webCanvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        webCanvas.parentElement.addEventListener('mouseleave', () => {
            mouse.x = null; 
            mouse.y = null;
        });

        class WebParticle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(49, 130, 206, 0.3)'; 
                ctx.fill();
            }
        }

        // Initialize particles
        for (let i = 0; i < 70; i++) {
            particles.push(new WebParticle());
        }

        function animateWeb() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                // Connect particles to mouse with a line if close enough
                if (mouse.x != null) {
                    let dx = mouse.x - particles[i].x;
                    let dy = mouse.y - particles[i].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        ctx.beginPath();
                        // Opacity fades as distance increases
                        ctx.strokeStyle = `rgba(49, 130, 206, ${1 - distance/mouse.radius})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateWeb);
        }
        animateWeb();
    }
});
