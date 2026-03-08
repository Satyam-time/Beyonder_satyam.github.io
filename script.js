import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

window.addEventListener('load', () => {
    setTimeout(() => {
        const tl = gsap.timeline();
        tl.to('#page-loader', { yPercent: -100, duration: 1.2, ease: "power4.inOut" })
          .to('.hero-fade-in', { opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: "back.out(1.5)" }, "-=0.5")
          .from('.navbar', { y: -100, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.8");
    }, 1200);
});

document.addEventListener('DOMContentLoaded', () => {
    
    // Custom Magnetic Cursor & Eye Tracking
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    // Grab the astronaut eyes
    const astroEyes = document.querySelectorAll('.astro-eye');

    if (cursorDot && cursorRing) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

            // --- NEW EYE TRACKING LOGIC ---
            astroEyes.forEach(eye => {
                const rect = eye.getBoundingClientRect();
                const eyeCenterX = rect.left + rect.width / 2;
                const eyeCenterY = rect.top + rect.height / 2;
                
                // Calculate the angle between the eye and the mouse
                const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
                
                // Limit the pupil movement to a 3-pixel radius so they stay inside the visor
                const distance = 3; 
                const moveX = Math.cos(angle) * distance;
                const moveY = Math.sin(angle) * distance;
                
                eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
            // ------------------------------
        });

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

    // GSAP Expressive Typography
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.expressive-text').forEach(el => {
        const text = el.innerText;
        el.innerHTML = ''; 
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            el.appendChild(span);
        });
        gsap.to(el.querySelectorAll('.char'), { scrollTrigger: { trigger: el, start: "top 85%" }, y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: "back.out(1.7)" });
    });

    document.querySelectorAll('.step').forEach(panel => {
        if(!panel.id.includes('hero')) { 
            gsap.to(panel, { scrollTrigger: { trigger: panel, start: "top 80%" }, opacity: 1, y: 0, duration: 1 });
        }
    });

    // ==========================================
    // 11. SKS LOGO CARTOON CLICK ANIMATION
    // ==========================================
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

    // ==========================================
    // SMART 3D SCENE ROUTER (Page-Specific Geometry)
    // ==========================================
    const canvas = document.querySelector('#bg-canvas');
    let starfield; // Declared here so sockets can access it
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(renderer)); 
        camera.position.set(0, 0, 40);

        const pageId = document.body.id; 
        let activeMesh;
        const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x3182ce, wireframe: true, transparent: true, opacity: 0.4 });

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
        } else {
            activeMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(10, 2.5, 200, 32), wireMaterial);
        }
        scene.add(activeMesh);

        // Deep Starfield
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
            camera.position.z = 40 + (t * 0.015); 
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

        // ==========================================
        // NEW: REAL-TIME MULTIPLAYER CURSORS
        // ==========================================
        const cursorContainer = document.getElementById('collaborative-cursors');
        const activeCursors = {}; 

        if (typeof io !== 'undefined') {
            const socket = io('http://localhost:5000'); // Connects to your running Node server

            document.addEventListener('mousemove', (e) => {
                socket.emit('cursor_move', { x: e.clientX, y: e.clientY });
            });

            socket.on('update_cursor', (data) => {
                if (!activeCursors[data.id]) {
                    const ghost = document.createElement('div');
                    ghost.className = 'ghost-cursor';
                    if(cursorContainer) cursorContainer.appendChild(ghost);
                    activeCursors[data.id] = ghost;
                }
                activeCursors[data.id].style.transform = `translate(${data.x}px, ${data.y}px)`;
                
                // Real-time interactive physics with the starfield
                if(starfield) {
                    starfield.rotation.x += (data.y * 0.000005);
                    starfield.rotation.y += (data.x * 0.000005);
                }
            });

            socket.on('remove_cursor', (id) => {
                if (activeCursors[id]) {
                    activeCursors[id].remove();
                    delete activeCursors[id];
                }
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

    // ==========================================
    // 10. HOVER WEB ANIMATION (Interactive Particle Canvas)
    // ==========================================
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
            mouse.x = e.clientX - rect.left; 
            mouse.y = e.clientY - rect.top;
        });
        
        webCanvas.parentElement.addEventListener('mouseleave', () => {
            mouse.x = null; 
            mouse.y = null;
        });

        class WebParticle {
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 3.5; 
                this.vy = (Math.random() - 0.5) * 3.5;
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

    // ==========================================
    // NEW: LIVE EMAIL ROUTING & MICROINTERACTION
    // ==========================================
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
            let hasError = false;
            errorMsg.innerText = '';

            [nameInput, emailInput, msgInput].forEach(el => el.classList.remove('error-shake'));

            if(!nameInput.value.trim() || !emailInput.value.trim() || !msgInput.value.trim()) {
                hasError = true;
                errorMsg.innerText = 'Please complete all required fields.';
                if(!nameInput.value.trim()) nameInput.classList.add('error-shake');
                if(!emailInput.value.trim()) emailInput.classList.add('error-shake');
                if(!msgInput.value.trim()) msgInput.classList.add('error-shake');
            }

            if(!hasError) {
                btnText.innerHTML = "Routing...";
                
                try {
                    const response = await fetch('http://localhost:5000/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: nameInput.value.trim(),
                            email: emailInput.value.trim(),
                            message: msgInput.value.trim()
                        })
                    });

                    const data = await response.json();

                    if(response.ok) {
                        errorMsg.style.color = '#48bb78';
                        errorMsg.innerText = 'Message securely routed to SKS servers!';
                        btnText.innerHTML = "✓ Sent!";
                        submitBtn.style.background = "#48bb78";
                        submitBtn.style.transform = "scale(1.05)";
                        form.reset();
                    } else {
                        throw new Error(data.error || 'Server error');
                    }
                } catch (error) {
                    errorMsg.style.color = '#e53e3e';
                    errorMsg.innerText = 'Server offline. Please try again later.';
                    btnText.innerHTML = "Error";
                }

                setTimeout(() => {
                    btnText.innerHTML = "Send Message";
                    submitBtn.style.background = "transparent";
                    submitBtn.style.transform = "scale(1)";
                }, 3000);
            }
        });
    }
});
