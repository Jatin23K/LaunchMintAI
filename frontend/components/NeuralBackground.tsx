import React, { useRef, useEffect } from 'react';

const NeuralBackground = ({ color }: { color: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getRGB = (c: string) => {
        switch (c) {
            case 'emerald': return '16, 185, 129';
            case 'red': return '239, 68, 68';
            case 'amber': return '245, 158, 11';
            case 'violet': return '139, 92, 246';
            case 'cyan': return '6, 182, 212';
            default: return '6, 182, 212';
        }
    };

    const rgb = getRGB(color);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        let particles: any[] = [];

        const particleCount = Math.min(Math.floor(window.innerWidth * window.innerHeight / 10000), 180);
        const connectionDistance = 160;

        class Particle {
            x: number; y: number; vx: number; vy: number; radius: number;
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = Math.random() * 0.6 - 0.3;
                this.vy = Math.random() * 0.6 - 0.3;
                this.radius = Math.random() * 1.5 + 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb}, 0.8)`;
                ctx.fill();
            }
        }

        function init() {
            particles = [];
            for (let i = 0; i < particleCount; i++) particles.push(new Particle());
        }

        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDistance) {
                        const opacity = 1 - (dist / connectionDistance);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.4})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }

        init();
        animate();

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [rgb]);

    const lightRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const smoothPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        let raf: number;
        const updateLight = () => {
            const lerpSpeed = 0.04;
            smoothPos.current.x += (mousePos.current.x - smoothPos.current.x) * lerpSpeed;
            smoothPos.current.y += (mousePos.current.y - smoothPos.current.y) * lerpSpeed;

            if (lightRef.current) {
                lightRef.current.style.background = `radial-gradient(600px circle at ${smoothPos.current.x}px ${smoothPos.current.y}px, rgba(${rgb}, 0.15), transparent 80%)`;
            }
            raf = requestAnimationFrame(updateLight);
        };
        raf = requestAnimationFrame(updateLight);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(raf);
        };
    }, [rgb]);

    return (
        <div className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none bg-[#020617]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,15,30,0)_0%,rgba(2,6,23,1)_100%)]" />
            <div
                ref={lightRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${smoothPos.current.x}px ${smoothPos.current.y}px, rgba(${rgb}, 0.15), transparent 80%)`
                }}
            />
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 transition-colors duration-1000`} style={{ backgroundColor: `rgb(${rgb})` }}></div>
            <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 transition-colors duration-1000`} style={{ backgroundColor: `rgb(${rgb})` }}></div>
            <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
        </div>
    );
};

export default NeuralBackground;