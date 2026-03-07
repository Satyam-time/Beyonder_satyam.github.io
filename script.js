document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // 1. Smooth scrolling and Fade In Animations
    // --------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-hidden').forEach(section => {
        observer.observe(section);
    });

    // --------------------------------------------------------
    // 2. Real-Time 3D Rendering (Three.js)
    // --------------------------------------------------------
    const canvas = document.querySelector('#bg-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        // Setup Scene
        const scene = new THREE.Scene();
        
        // Setup Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        // Setup Renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // 3D Object 1: Torus Knot (Represents Magnetic Confinement / Plasma Physics)
        const geometry = new THREE.TorusKnotGeometry(12, 3, 150, 20);
        // Wireframe material so it looks highly technical and mathematical
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x2b6cb0, // Matches your secondary CSS variable
            wireframe: true, 
            transparent: true, 
            opacity: 0.15 
        });
        const torusKnot = new THREE.Mesh(geometry, material);
        scene.add(torusKnot);

        // 3D Object 2: Particle Starfield (Represents Astrophysics)
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 800;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            // Spread particles over a large area
            posArray[i] = (Math.random() - 0.5) * 150; 
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ 
            size: 0.2, 
            color: 0x1a365d, // Matches your primary CSS variable
            transparent: true,
            opacity: 0.5
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Mouse Interactivity
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });

        // Animation Loop
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            // Rotate objects continuously
            torusKnot.rotation.x = elapsedTime * 0.1;
            torusKnot.rotation.y = elapsedTime * 0.15;
            
            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.x = elapsedTime * 0.02;

            // Parallax camera effect based on mouse movement
            targetX = mouseX * 0.015;
            targetY = mouseY * 0.015;

            // Smoothly move the knot to counter the mouse
            torusKnot.position.x += 0.05 * (targetX - torusKnot.position.x);
            torusKnot.position.y += 0.05 * (-targetY - torusKnot.position.y);

            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

        // Handle Window Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});
