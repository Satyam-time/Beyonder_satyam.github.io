import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// --- NEW: Loading Screen Removal ---
window.addEventListener('load', () => {
    // Add a slight delay so the orbital animation is enjoyed
    setTimeout(() => {
        document.getElementById('page-loader').classList.add('hidden');
    }, 1000);
});

document.addEventListener('DOMContentLoaded', () => {
    
    // ( ... Keep ALL your previous GSAP, Three.js, and Scrollytelling code here ... )
    // Just paste the new blocks below at the end of the DOMContentLoaded function:

    // ==========================================
    // NEW: ERROR ANIMATIONS (Form Validation)
    // ==========================================
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const msgInput = document.getElementById('msgInput');
    const errorMsg = document.getElementById('formErrorMsg');

    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent page reload
            let hasError = false;
            errorMsg.innerText = '';

            // Reset classes
            [nameInput, emailInput, msgInput].forEach(el => el.classList.remove('error-shake'));

            if(!nameInput.value.trim() || !emailInput.value.trim() || !msgInput.value.trim()) {
                hasError = true;
                errorMsg.innerText = 'Please complete all required fields.';
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
    // NEW: HOVER WEB ANIMATION (Interactive Node Network)
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

        webCanvas.parentElement.addEventListener('mousemove', (e) => {
            const rect = webCanvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        webCanvas.parentElement.addEventListener('mouseleave', () => {
            mouse.x = null; mouse.y = null;
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
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(49, 130, 206, 0.3)'; // Primary blue color
                ctx.fill();
            }
        }

        for (let i = 0; i < 70; i++) particles.push(new WebParticle());

        function animateWeb() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                // Connect particles to mouse
                if (mouse.x != null) {
                    let dx = mouse.x - particles[i].x;
                    let dy = mouse.y - particles[i].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        ctx.beginPath();
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
