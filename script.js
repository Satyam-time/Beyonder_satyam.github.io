document.addEventListener('DOMContentLoaded', () => {
    
    // --------------------------------------------------------
    // 1. Scroll Fade-In Observer for Text Panels
    // --------------------------------------------------------
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.step').forEach(step => {
        observer.observe(step);
    });

    // --------------------------------------------------------
    // 2. Three.js Scrollytelling Setup
    // --------------------------------------------------------
    const canvas = document.querySelector('#bg-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        
        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.set(0, 0, 40); // Start position

        // Create Object: Wireframe Torus Knot (Plasma/Magnetic Physics)
        const knotGeometry = new THREE.TorusKnotGeometry(10, 2.5, 200, 32);
        const knotMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x3182ce, 
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
        scene.add(torusKnot);

        // Create Object: Starfield / Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1500;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            // Spread particles deeply along the Z-axis for fly-through effect
            posArray[i * 3] = (Math.random() - 0.5) * 100;     // X
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 100; // Y
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 150; // Z
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ 
            size: 0.15, 
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        const starfield = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(starfield);

        // --------------------------------------------------------
        // 3. Scrollytelling Logic (Tying Scroll to 3D Space)
        // --------------------------------------------------------
        function moveCamera() {
            // Get the current scroll depth
            const t = document.body.getBoundingClientRect().top;
            
            // 1. Rotate the Knot based on scroll
            torusKnot.rotation.x = t * -0.001;
            torusKnot.rotation.y = t * -0.002;
            torusKnot.rotation.z = t * -0.001;

            // 2. Fly the camera forward through the starfield
            // The deeper you scroll (more negative 't'), the further the camera moves into the Z axis
            camera.position.z = 40 + (t * 0.015);
            camera.position.y = t * 0.002;
            
            // Subtly rotate the starfield to make the universe feel vast
            starfield.rotation.y = t * 0.0002;
        }

        // Fire the function immediately, and on every scroll event
        document.body.onscroll = moveCamera;
        moveCamera();

        // --------------------------------------------------------
        // 4. Subtle Ambient Animation Loop
        // --------------------------------------------------------
        const animate = () => {
            requestAnimationFrame(animate);
            // Add a tiny bit of ambient rotation even when not scrolling
            torusKnot.rotation.x += 0.001;
            torusKnot.rotation.y += 0.001;
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
