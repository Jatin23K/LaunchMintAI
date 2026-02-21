import React from 'react';

export default function NeuralBackground() {
    return (
        <div className="fixed inset-0 z-0 bg-[#02040F] overflow-hidden pointer-events-none select-none">

            {/* 1. THE ATMOSPHERE (Deep Teal/Blue Base) */}
            {/* Matches the "underwater" tech glow seen in your reference images */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#0f172a_0%,_#02040F_70%)] opacity-80" />

            {/* 2. THE SPOTLIGHT (Cyan Top Glow) */}
            {/* Creates the light source specifically behind the "Validate your startup" headline */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen" />

            {/* 3. THE GRID MESH (Background Texture) */}
            {/* Adds the subtle data-grid depth behind the brain */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M50 0L0 0L0 50" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
                        <circle cx="0" cy="0" r="1" fill="#22d3ee" />
                    </pattern>
                    <mask id="fade-mask">
                        <radialGradient id="grad-mask" cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="70%" stopColor="black" stopOpacity="0" />
                        </radialGradient>
                        <rect width="100%" height="100%" fill="url(#grad-mask)" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" mask="url(#fade-mask)" />
            </svg>

            {/* 4. THE BRAIN (High-Fidelity Wireframe Simulation) */}
            {/* Uses complex SVG paths to create the density of a 3D render without needing an image file */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] opacity-30">
                <svg viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <g stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">

                        {/* LEFT HEMISPHERE DETAILS */}
                        <path d="M500,150 C400,150 300,200 250,300 C200,400 220,550 300,650 C380,750 480,700 500,600" /> {/* Outer Contour */}
                        <path d="M500,180 C420,180 350,220 300,300 C260,380 280,500 340,580 C400,660 480,620 500,550" opacity="0.6" /> {/* Inner Layer 1 */}
                        <path d="M500,220 C450,220 400,250 360,300 C330,350 340,450 380,500" opacity="0.4" /> {/* Inner Layer 2 */}

                        {/* Left Neural Folds (The "Squiggles") */}
                        <path d="M350,300 C320,320 320,380 350,400" opacity="0.5" />
                        <path d="M400,250 C380,280 380,320 420,350" opacity="0.5" />
                        <path d="M450,200 C430,220 430,260 460,280" opacity="0.5" />
                        <path d="M300,450 C320,480 360,480 380,450" opacity="0.5" />

                        {/* RIGHT HEMISPHERE DETAILS (Mirrored) */}
                        <path d="M500,150 C600,150 700,200 750,300 C800,400 780,550 700,650 C620,750 520,700 500,600" />
                        <path d="M500,180 C580,180 650,220 700,300 C740,380 720,500 660,580 C600,660 520,620 500,550" opacity="0.6" />
                        <path d="M500,220 C550,220 600,250 640,300 C670,350 660,450 620,500" opacity="0.4" />

                        {/* Right Neural Folds */}
                        <path d="M650,300 C680,320 680,380 650,400" opacity="0.5" />
                        <path d="M600,250 C620,280 620,320 580,350" opacity="0.5" />
                        <path d="M550,200 C570,220 570,260 540,280" opacity="0.5" />
                        <path d="M700,450 C680,480 640,480 620,450" opacity="0.5" />

                        {/* CORPUS CALLOSUM (Center Connections) */}
                        <path d="M500,150 L500,600" strokeDasharray="6 4" opacity="0.3" />
                        <line x1="450" y1="300" x2="550" y2="300" strokeDasharray="2 2" opacity="0.4" />
                        <line x1="420" y1="400" x2="580" y2="400" strokeDasharray="2 2" opacity="0.4" />
                        <line x1="480" y1="500" x2="520" y2="500" strokeDasharray="2 2" opacity="0.4" />

                        {/* GLOWING SYNAPSE NODES */}
                        <circle cx="250" cy="300" r="3" fill="#22d3ee" className="animate-pulse" />
                        <circle cx="750" cy="300" r="3" fill="#22d3ee" className="animate-pulse" style={{ animationDelay: '1s' }} />
                        <circle cx="300" cy="650" r="2" fill="#22d3ee" opacity="0.8" />
                        <circle cx="700" cy="650" r="2" fill="#22d3ee" opacity="0.8" />
                        <circle cx="500" cy="150" r="4" fill="#22d3ee" opacity="0.6" />
                    </g>
                </svg>
            </div>

            {/* 5. VIGNETTE OVERLAY (Focus Enforcement) */}
            {/* Keeps the edges dark and the center readable */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_#02040F_90%)]" />
        </div>
    );
}