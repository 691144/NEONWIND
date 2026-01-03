import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CONFIG, MAP_LEN, MAP_RES } from '../constants';
import { GameState, MapPoint, RingType, BuffType, ActiveBuff } from '../types';
import {
    DIFFICULTY_SETTINGS,
    SPEED_SETTINGS,
    TUNNEL_SETTINGS,
    RING_SPAWN_SETTINGS,
    RING_PROBABILITIES,
    RING_COLORS,
    RING_EFFECTS,
    HEALTH_SETTINGS,
} from '../constants/gameConstants';

interface GameSceneProps {
    gameState: GameState;
    startSpeed: number; // 200 - 700 range from slider
    onGameOver: (score: number) => void;
    gameSceneRef?: React.MutableRefObject<{ togglePause: () => void } | null>;
    scoreRef: React.RefObject<HTMLSpanElement>;
    speedRef: React.RefObject<HTMLSpanElement>;
    healthBarRef: React.RefObject<HTMLDivElement>;
    healthContainerRef: React.RefObject<HTMLDivElement>;
    speedBarRef: React.RefObject<HTMLDivElement>;
    speedBarFillRef: React.RefObject<HTMLDivElement>;
    speedBarNeedleRef: React.RefObject<HTMLDivElement>;
    speedBarRangeRef: React.RefObject<HTMLSpanElement>;
    speedBarTopRef: React.RefObject<HTMLSpanElement>;
    pauseOverlayRef: React.RefObject<HTMLDivElement>;
}

export const GameScene: React.FC<GameSceneProps> = ({
    gameState,
    startSpeed,
    onGameOver,
    gameSceneRef,
    scoreRef,
    speedRef,
    healthBarRef,
    healthContainerRef,
    speedBarRef,
    speedBarFillRef,
    speedBarNeedleRef,
    speedBarRangeRef,
    speedBarTopRef,
    pauseOverlayRef
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new GameEngine(
            containerRef.current,
            speedRef,
            speedBarRef,
            speedBarFillRef,
            speedBarNeedleRef,
            speedBarRangeRef,
            speedBarTopRef,
            pauseOverlayRef,
            {
                onGameOver: (finalScore) => {
                    onGameOver(finalScore);
                },
                onUpdateHUD: (score, health, maxHealth, healthLevel, speed, smoothPercent, widePercent) => {
                    if (scoreRef.current) scoreRef.current.innerText = Math.floor(score).toString();
                    if (speedRef.current) speedRef.current.innerText = (speed * 100).toFixed(0);

                    // Health bar: fill shows health/maxHealth
                    // Bar width: 140px for 200HP, 280px for 400HP
                    const fillPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
                    
                    // Calculate container width based on maxHealth (200-400 range)
                    // 200 HP = 140px, 400 HP = 280px
                    const minWidth = 140;
                    const maxWidth = 280;
                    const healthRange = 400 - 200; // 200
                    const containerWidth = minWidth + ((maxHealth - 200) / healthRange) * (maxWidth - minWidth);
                    
                    // Update Health Bar Fill
                    if (healthBarRef.current) {
                        healthBarRef.current.style.width = `${fillPct}%`;
                        
                        // Change color based on level
                        if (healthLevel >= 3) {
                            healthBarRef.current.className = 'h-full bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-[width] duration-200 ease-out';
                        } else if (healthLevel >= 2) {
                            healthBarRef.current.className = 'h-full bg-gradient-to-r from-blue-500 to-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-[width] duration-200 ease-out';
                        } else {
                            healthBarRef.current.className = 'h-full bg-gradient-to-r from-green-500 to-emerald-300 shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-[width] duration-200 ease-out';
                        }
                    }

                    // Update container width and level multiplier indicator
                    if (healthContainerRef.current) {
                        healthContainerRef.current.style.width = `${Math.max(minWidth, Math.min(maxWidth, containerWidth))}px`;
                        // Show multiplier (1×, 2×, 3×, etc.)
                        healthContainerRef.current.setAttribute('data-level', `${healthLevel}×`);
                        
                        // Update border color based on level
                        if (healthLevel >= 3) {
                            healthContainerRef.current.style.borderColor = 'rgba(34, 211, 238, 0.6)';
                        } else if (healthLevel >= 2) {
                            healthContainerRef.current.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                        } else {
                            healthContainerRef.current.style.borderColor = 'rgba(74, 222, 128, 0.6)';
                        }
                    }
                    
                    // Update multiplier badge (separate element)
                    const multiplierEl = document.getElementById('health-multiplier');
                    if (multiplierEl) {
                        multiplierEl.innerText = `${healthLevel}×`;
                        if (healthLevel >= 3) {
                            multiplierEl.className = 'text-lg font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] min-w-[40px] text-right';
                        } else if (healthLevel >= 2) {
                            multiplierEl.className = 'text-lg font-black text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] min-w-[40px] text-right';
                        } else {
                            multiplierEl.className = 'text-lg font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] min-w-[40px] text-right';
                        }
                    }
                    
                    // Update smooth and wide percentage indicators
                    const smoothEl = document.getElementById('smooth-percent');
                    const wideEl = document.getElementById('wide-percent');
                    if (smoothEl) {
                        smoothEl.innerText = `${Math.round(smoothPercent)}%`;
                        smoothEl.style.opacity = smoothPercent > 0 ? '1' : '0.3';
                    }
                    if (wideEl) {
                        wideEl.innerText = `${Math.round(widePercent)}%`;
                        wideEl.style.opacity = widePercent > 0 ? '1' : '0.3';
                    }
                }
            }
        );

        engineRef.current = engine;

        // Expose togglePause to parent via ref
        if (gameSceneRef) {
            gameSceneRef.current = {
                togglePause: () => engine.togglePause()
            };
        }

        // Defer showing canvas until after splash screen is rendered
        // This ensures UIOverlay is visible before the 3D tunnel
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsReady(true);
                engine.onWindowResize();
            });
        });

        const handleResize = () => engine.onWindowResize();
        const handleMouseMove = (e: MouseEvent) => engine.onMouseMove(e);
        const handleTouchStart = (e: TouchEvent) => engine.onTouchStart(e);
        const handleTouchMove = (e: TouchEvent) => engine.onTouchMove(e);
        const handleTouchEnd = () => engine.onTouchEnd();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                engine.togglePause();
            }
        };
        const handleOrientationChange = () => {
            // Apply immediately, then re-apply for a short time until the viewport settles.
            // This avoids big delays (momentum loss) but prevents jitter when the browser UI
            // reports a couple of intermediate sizes during rotation.
            engine.onWindowResize();

            let lastW = window.innerWidth;
            let lastH = window.innerHeight;
            let stableFrames = 0;
            const start = performance.now();

            const tick = () => {
                const w = window.innerWidth;
                const h = window.innerHeight;
                if (w === lastW && h === lastH) stableFrames++;
                else {
                    stableFrames = 0;
                    lastW = w;
                    lastH = h;
                }

                engine.onWindowResize();

                // Small inertia threshold: require a couple stable frames, but don't wait long.
                if (stableFrames < 2 && performance.now() - start < 250) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        // Some mobile browsers update viewport via VisualViewport before/without orientationchange.
        const vv = window.visualViewport;
        vv?.addEventListener('resize', handleOrientationChange);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
            vv?.removeEventListener('resize', handleOrientationChange);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('keydown', handleKeyDown);
            engine.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only init once

    // React to game state changes
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        if (gameState === GameState.PLAYING) {
            engine.start(startSpeed);
        }
    }, [gameState, startSpeed]);

    return (
        <div
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full z-0"
            style={{ visibility: isReady ? 'visible' : 'hidden' }}
        />
    );
};

// --- Particle System Class ---
class ParticleSystem {
    public mesh: THREE.Points;
    private positions: Float32Array;
    private colors: Float32Array;
    private startColors: Float32Array; // Store initial colors for fading
    private sizes: Float32Array;
    private velocities: Float32Array; // x, y, z
    private lifes: Float32Array; // 0 to 1
    private maxParticles: number;
    private particleCount: number = 0;
    private geometry: THREE.BufferGeometry;

    constructor(scene: THREE.Scene, maxParticles: number, texture: THREE.Texture | null, baseSize: number) {
        this.maxParticles = maxParticles;
        this.positions = new Float32Array(maxParticles * 3);
        this.colors = new Float32Array(maxParticles * 3);
        this.startColors = new Float32Array(maxParticles * 3);
        this.sizes = new Float32Array(maxParticles);
        this.velocities = new Float32Array(maxParticles * 3);
        this.lifes = new Float32Array(maxParticles);

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

        const material = new THREE.PointsMaterial({
            size: baseSize,
            vertexColors: true,
            map: texture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.mesh = new THREE.Points(this.geometry, material);
        this.mesh.frustumCulled = false;
        scene.add(this.mesh);
    }

    public spawn(pos: THREE.Vector3, vel: THREE.Vector3, color: THREE.Color, size: number, lifeStart: number = 1.0) {
        if (this.particleCount >= this.maxParticles) return; // Pool full

        const i = this.particleCount;
        
        this.positions[i * 3] = pos.x;
        this.positions[i * 3 + 1] = pos.y;
        this.positions[i * 3 + 2] = pos.z;

        this.velocities[i * 3] = vel.x;
        this.velocities[i * 3 + 1] = vel.y;
        this.velocities[i * 3 + 2] = vel.z;

        this.colors[i * 3] = color.r;
        this.colors[i * 3 + 1] = color.g;
        this.colors[i * 3 + 2] = color.b;
        
        this.startColors[i * 3] = color.r;
        this.startColors[i * 3 + 1] = color.g;
        this.startColors[i * 3 + 2] = color.b;

        this.sizes[i] = size;
        this.lifes[i] = lifeStart;

        this.particleCount++;
    }

    public update() {
        let liveCount = 0;

        for (let i = 0; i < this.particleCount; i++) {
            this.lifes[i] -= 0.02; // Decay

            if (this.lifes[i] > 0) {
                // Update position
                this.positions[liveCount * 3] = this.positions[i * 3] + this.velocities[i * 3];
                this.positions[liveCount * 3 + 1] = this.positions[i * 3 + 1] + this.velocities[i * 3 + 1];
                this.positions[liveCount * 3 + 2] = this.positions[i * 3 + 2] + this.velocities[i * 3 + 2];

                // Fade Color logic
                const lifeRatio = Math.max(0, this.lifes[i]);
                const r = this.startColors[i * 3] * lifeRatio;
                const g = this.startColors[i * 3 + 1] * lifeRatio;
                const b = this.startColors[i * 3 + 2] * lifeRatio;

                this.colors[liveCount * 3] = r;
                this.colors[liveCount * 3 + 1] = g;
                this.colors[liveCount * 3 + 2] = b;

                // Compact startColors as well to keep sync
                this.startColors[liveCount * 3] = this.startColors[i * 3];
                this.startColors[liveCount * 3 + 1] = this.startColors[i * 3 + 1];
                this.startColors[liveCount * 3 + 2] = this.startColors[i * 3 + 2];
                
                this.velocities[liveCount * 3] = this.velocities[i * 3];
                this.velocities[liveCount * 3 + 1] = this.velocities[i * 3 + 1];
                this.velocities[liveCount * 3 + 2] = this.velocities[i * 3 + 2];

                // Scale size down with life
                this.sizes[liveCount] = this.sizes[i] * 0.96; // Slightly slower size decay
                this.lifes[liveCount] = this.lifes[i];

                liveCount++;
            }
        }

        this.particleCount = liveCount;
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;

        // Hide unused particles by setting range draw
        this.geometry.setDrawRange(0, this.particleCount);
    }

    public reset() {
        this.particleCount = 0;
        this.geometry.setDrawRange(0, 0);
    }

    public dispose() {
        this.mesh.parent?.remove(this.mesh);
        this.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

// --- Game Logic Class ---

class GameEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private plane!: THREE.Group;
    private dirLight!: THREE.DirectionalLight;
    private lightTarget!: THREE.Object3D;
    
    // Single geometry array for solid walls
    private wallGeometries: THREE.BufferGeometry[] = [];
    
    private centerParticles!: THREE.Points;
    private rings: THREE.Mesh[] = [];
    private particles: THREE.Mesh[] = []; // Explosion debris
    
    private sparkSystem!: ParticleSystem;
    
    private terrainMap: MapPoint[] = [];
    private frameId: number = 0;
    private isActive: boolean = false;
    
    // Game State
    private score: number = 0;
    private maxSpeedReached: number = 0;
    private health: number = HEALTH_SETTINGS.initialHealth;
    private maxHealth: number = HEALTH_SETTINGS.initialMaxHealth;
    private healthLevel: number = 1;
    private currentSpeed: number = 0;
    
    // Active Buffs
    private activeBuffs: ActiveBuff[] = [];
    private isShieldActive: boolean = false;
    
    // Decay-based buff boosts (permanent but decay over time)
    private smoothBoost: number = 0;  // Current reduction to turn aggression
    private wideBoost: number = 0;    // Current tunnel width bonus
    private ringSpawnTimer: number = 0; // Countdown timer for ring spawning
    
    // Shield visual mesh
    private shieldMesh: THREE.Mesh | null = null;
    
    // Quest ending sequence state
    private isGameOverSequence: boolean = false;
    private gameOverTimer: number = 0;
    private questOverlayEl: HTMLDivElement | null = null;
    
    private settings: {
        label: string;
        baseSpeed: number;
        maxSpeed: number;
        turnAggression: number;
        spawnRate: number;
        accelerationMultiplier: number;
    } = {
        label: "Custom",
        baseSpeed: 1.0,
        maxSpeed: 20.0,
        turnAggression: 0.5,
        spawnRate: 60,
        accelerationMultiplier: 1.0
    };

    private tubeCenterX: number = 0;
    private tubeCenterY: number = 0;
    
    // Input Handling
    private mousePos = { x: 0, y: 0 };
    private targetMousePos = { x: 0, y: 0 }; // For input smoothing
    
    // Touch tracking for relative control
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private touchActive: boolean = false;
    
    // Control Lock State
    private isControlsLocked: boolean = false;
    private startLockTimer: number = 0;

    // Wall Contact State
    private isTouchingWall: boolean = false;
    private shipHalfExtentXY: number = 10;

    // Tap Detection for Mobile Pause
    private tapStartTime: number = 0;
    private lastTapX: number = 0;
    private lastTapY: number = 0;

    // DOM Refs for direct manipulation
    private speedRef: React.RefObject<HTMLSpanElement> | null = null;
    private speedBarRef: React.RefObject<HTMLDivElement> | null = null;
    private speedBarFillRef: React.RefObject<HTMLDivElement> | null = null;
    private speedBarNeedleRef: React.RefObject<HTMLDivElement> | null = null;
    private speedBarRangeRef: React.RefObject<HTMLSpanElement> | null = null;
    private speedBarTopRef: React.RefObject<HTMLSpanElement> | null = null;
    private pauseOverlayRef: React.RefObject<HTMLDivElement> | null = null;

    // Map Generation State
    private mapGenState = {
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        segmentTimer: 0
    };

    private container: HTMLElement;

    private callbacks: {
        onGameOver: (score: number) => void;
        onUpdateHUD: (score: number, health: number, maxHealth: number, healthLevel: number, speed: number, smoothPercent: number, widePercent: number) => void;
    };

    // Current speed range minimum for speed bar
    private currentSpeedRangeMin: number = 0;
    // Max speed reached within the current range (for needle)
    private rangeMaxSpeed: number = 0;
    private isPaused: boolean = false;

    // --- Speed Bar Helper Methods ---
    private getSpeedRangeColor(min: number): { colorClass: string } {
        // Single consistent green color for all speed ranges
        return { colorClass: 'from-green-500 to-emerald-400' };
    }

    private triggerSpeedBarEffect() {
        const bar = this.speedBarRef?.current;
        const fill = this.speedBarFillRef?.current;

        if (bar) {
            bar.classList.add('ring-2', 'ring-yellow-300', 'shadow-[0_0_18px_rgba(250,204,21,0.8)]');
            setTimeout(() => {
                bar.classList.remove('ring-2', 'ring-yellow-300', 'shadow-[0_0_18px_rgba(250,204,21,0.8)]');
            }, 250);
        }

        if (fill) {
            fill.classList.add('animate-pulse');
            setTimeout(() => fill.classList.remove('animate-pulse'), 250);
        }
    }

    private triggerTopSpeedFlash(rangeMin: number) {
        const speedEl = this.speedRef?.current;
        if (!speedEl) return;

        // Balloon-style flash from center: create a transient clone at center
        const rect = speedEl.getBoundingClientRect();
        const text = speedEl.innerText;

        const balloon = document.createElement('div');
        balloon.innerText = text;
        balloon.className = 'font-digital font-black text-cyan-300 pointer-events-none select-none';
        Object.assign(balloon.style, {
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) scale(0.3)',
            opacity: '0',
            fontSize: `${rect.height * 2.8}px`,
            filter: 'drop-shadow(0 0 22px rgba(0,255,255,0.9))',
            zIndex: '9999',
            transition: 'transform 0.72s ease, opacity 0.72s ease'
        });

        document.body.appendChild(balloon);

        requestAnimationFrame(() => {
            balloon.style.transform = 'translate(-50%, -50%) scale(1.55)';
            balloon.style.opacity = '0.95';
        });

        setTimeout(() => {
            balloon.style.transform = 'translate(-50%, -50%) scale(0.8)';
            balloon.style.opacity = '0';
        }, 420);

        setTimeout(() => balloon.remove(), 1200);
    }

    public togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.loop();
            if (this.pauseOverlayRef?.current) {
                this.pauseOverlayRef.current.style.display = 'none';
            }
        } else {
            this.isPaused = true;
            cancelAnimationFrame(this.frameId);
            if (this.pauseOverlayRef?.current) {
                this.pauseOverlayRef.current.style.display = 'flex';
            }
        }
    }

    private updateSpeedBar() {
        const currentSpeedKmh = this.currentSpeed * 100;
        
        // Calculate what the range minimum SHOULD be based on current speed
        // Floor to nearest 100 km/h increment
        const expectedRangeMin = Math.floor(currentSpeedKmh / 100) * 100;
        
        // Check if we need to change range (advance to next range OR reset to current range)
        if (expectedRangeMin !== this.currentSpeedRangeMin) {
            // Only allow range to increase during gameplay (not decrease)
            // But allow it to reset on new game start
            if (expectedRangeMin > this.currentSpeedRangeMin || expectedRangeMin < this.currentSpeedRangeMin - 100) {
                // Advance to new range OR reset to match current speed
                this.currentSpeedRangeMin = expectedRangeMin;
                // Reset range max to start of new range when we change ranges
                this.rangeMaxSpeed = expectedRangeMin;
                this.triggerSpeedBarEffect();
                this.triggerTopSpeedFlash(expectedRangeMin);
            }
        }
        
        const rangeMax = this.currentSpeedRangeMin + 100;

        // Update range max speed if current speed is higher within current range
        if (currentSpeedKmh > this.rangeMaxSpeed) {
            this.rangeMaxSpeed = currentSpeedKmh;
        }

        // Update range text
        if (this.speedBarRangeRef?.current) {
            this.speedBarRangeRef.current.innerText = `${this.currentSpeedRangeMin} - ${rangeMax} KM/H`;
        }

        // Update top speed text (global max)
        const globalMaxSpeed = this.maxSpeedReached * 100;
        if (this.speedBarTopRef?.current) {
            this.speedBarTopRef.current.innerText = Math.floor(globalMaxSpeed).toString();
        }

        // Update fill bar width (percentage within current range)
        const fillPercent = ((currentSpeedKmh - this.currentSpeedRangeMin) / 100) * 100;
        if (this.speedBarFillRef?.current) {
            this.speedBarFillRef.current.style.width = `${Math.max(0, Math.min(100, fillPercent))}%`;
            // Update color class
            const colorInfo = this.getSpeedRangeColor(this.currentSpeedRangeMin);
            this.speedBarFillRef.current.className = `h-full bg-gradient-to-r ${colorInfo.colorClass} transition-all`;
        }

        // Update top speed needle (position relative to current range - shows max within range)
        // Needle stays at max reached within range, doesn't fall when slowing down
        const needlePercent = ((this.rangeMaxSpeed - this.currentSpeedRangeMin) / 100) * 100;
        if (this.speedBarNeedleRef?.current) {
            this.speedBarNeedleRef.current.style.left = `${Math.max(0, Math.min(100, needlePercent))}%`;
        }
    }

    // --- Ring Collection & Buff System ---
    
    private handleRingCollection(ringType: RingType, position: THREE.Vector3) {
        this.score += 10; // All rings give score
        
        switch (ringType) {
            case RingType.HEAL:
                // Yellow ring: heal HP, expand bar, or level up
                if (this.health < this.maxHealth) {
                    // First priority: heal current health
                    this.health = Math.min(this.maxHealth, this.health + RING_EFFECTS.HEAL.amount);
                } else if (this.maxHealth < HEALTH_SETTINGS.expandedMaxHealth) {
                    // Second priority: expand bar width (200 -> 400)
                    const expandAmount = 20;
                    this.maxHealth = Math.min(HEALTH_SETTINGS.expandedMaxHealth, this.maxHealth + expandAmount);
                    this.health = this.maxHealth; // Keep filled
                    this.createPopup("+EXPAND", position);
                } else {
                    // Bar is at 400 HP and full - level up!
                    this.healthLevel++;
                    this.maxHealth = HEALTH_SETTINGS.levelMaxHealth; // 400 HP bar
                    this.health = 0; // Start empty
                    this.createPopup(`${this.healthLevel}× HULL!`, position);
                }
                break;
                
            case RingType.SMOOTH:
                // Blue ring: permanent reduction to turn aggression (decays over time)
                // Effect scales with speed: faster = bigger reduction boost
                const smoothSpeedMultiplier = 1.0 + (this.currentSpeed - 3.0) * 0.1;
                this.smoothBoost = Math.min(
                    RING_EFFECTS.SMOOTH.maxReduction * smoothSpeedMultiplier,
                    this.smoothBoost + RING_EFFECTS.SMOOTH.reductionAmount * smoothSpeedMultiplier
                );
                this.createBalloonIcon('smooth', position);
                break;
                
            case RingType.WIDE:
                // Silver ring: permanent tunnel width boost (decays over time)
                // Effect scales with speed: faster = bigger width boost
                const wideSpeedMultiplier = 1.0 + (this.currentSpeed - 3.0) * 0.15;
                this.wideBoost = Math.min(
                    RING_EFFECTS.WIDE.maxBoost * wideSpeedMultiplier,
                    this.wideBoost + RING_EFFECTS.WIDE.widthBoost * wideSpeedMultiplier
                );
                this.createBalloonIcon('wide', position);
                break;
                
            case RingType.SHIELD:
                this.applyBuff(BuffType.SHIELD, RING_EFFECTS.SHIELD.duration);
                this.isShieldActive = true;
                this.showShieldMesh(true);
                this.createBalloonIcon('shield', position);
                break;
        }
    }
    
    private applyBuff(type: BuffType, duration: number) {
        const existingBuff = this.activeBuffs.find(b => b.type === type);
        
        if (existingBuff) {
            // Refresh or stack the buff
            existingBuff.remainingTime = duration;
            existingBuff.totalDuration = duration;
            existingBuff.isFading = false;
        } else {
            // Add new buff
            this.activeBuffs.push({
                type,
                remainingTime: duration,
                totalDuration: duration,
                isFading: false
            });
        }
    }
    
    private updateBuffs(deltaTime: number) {
        // Update time-based buffs (only SHIELD now)
        for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
            const buff = this.activeBuffs[i];
            buff.remainingTime -= deltaTime;
            
            // Remove expired buffs
            if (buff.remainingTime <= 0) {
                // If shield expired, deactivate it and hide mesh
                if (buff.type === BuffType.SHIELD) {
                    this.isShieldActive = false;
                    this.showShieldMesh(false);
                }
                this.activeBuffs.splice(i, 1);
            }
        }
        
        // Update decay-based boosts (SMOOTH and WIDE)
        // These decay gradually back to base values
        if (this.smoothBoost > 0) {
            this.smoothBoost = Math.max(0, this.smoothBoost - RING_EFFECTS.SMOOTH.decayRate);
        }
        if (this.wideBoost > 0) {
            this.wideBoost = Math.max(0, this.wideBoost - RING_EFFECTS.WIDE.decayRate);
        }
        
        // Animate the shield mesh when active - rotate rings for 3D effect
        if (this.shieldMesh && this.isShieldActive) {
            const time = Date.now() * 0.002;
            // Rotate the shield group for dynamic 3D appearance
            this.shieldMesh.rotation.x = time * 0.5;
            this.shieldMesh.rotation.y = time * 0.3;
            this.shieldMesh.rotation.z = time * 0.2;
        }
    }
    
    private getBuffMultiplier(type: BuffType): number {
        const buff = this.activeBuffs.find(b => b.type === type);
        if (!buff) return 1.0;
        return 1.0; // Shield doesn't have a multiplier effect
    }
    
    public getActiveBuffs(): ActiveBuff[] {
        return [...this.activeBuffs];
    }

    // --- Audio Properties ---
    private audioCtx: AudioContext | null = null;
    private droneOsc: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;
    private windNode: AudioBufferSourceNode | null = null;
    private windGain: GainNode | null = null;
    private windFilter: BiquadFilterNode | null = null;

    private TUBE_LENGTH = 12000;
    private TUBE_SEGMENTS = 300; 
    private WIRE_SEGMENTS_X = 16; 
    
    private tempColor = new THREE.Color();
    private stripColor = new THREE.Color(0x00FFFF); // Neon Cyan

    // Cached objects for performance
    private static glowTexture: THREE.Texture | null = null;
    private tempLerpColor = new THREE.Color();
    private tempSparkVel = new THREE.Vector3();
    private sparkColor = new THREE.Color(0xFF8800);

    constructor(
        container: HTMLElement,
        speedRef: React.RefObject<HTMLSpanElement>,
        speedBarRef: React.RefObject<HTMLDivElement>,
        speedBarFillRef: React.RefObject<HTMLDivElement>,
        speedBarNeedleRef: React.RefObject<HTMLDivElement>,
        speedBarRangeRef: React.RefObject<HTMLSpanElement>,
        speedBarTopRef: React.RefObject<HTMLSpanElement>,
        pauseOverlayRef: React.RefObject<HTMLDivElement>,
        callbacks: {
            onGameOver: (score: number) => void;
            onUpdateHUD: (score: number, health: number, maxHealth: number, healthLevel: number, speed: number, smoothPercent: number, widePercent: number) => void;
        }
    ) {
        this.speedRef = speedRef;
        this.speedBarRef = speedBarRef;
        this.speedBarFillRef = speedBarFillRef;
        this.speedBarNeedleRef = speedBarNeedleRef;
        this.speedBarRangeRef = speedBarRangeRef;
        this.speedBarTopRef = speedBarTopRef;
        this.pauseOverlayRef = pauseOverlayRef;
        this.container = container;
        this.callbacks = callbacks;
        // this.currentSpeed is already initialized to 0 at class level
        // It will be set properly in start() method

        // Init Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a15); // Slightly brighter blue-black
        this.scene.fog = new THREE.FogExp2(0x0a0a15, 0.00025);

        // Lower near plane to 0.1 to avoid clipping when close to walls
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 15000);
        this.camera.position.set(0, 0, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        this.container.appendChild(this.renderer.domElement);

        this.initMap(); 
        this.createLights();
        this.createPlane();
        this.createTube();
        this.createParticleSystems();

        this.updateTube();
        
        this.renderer.render(this.scene, this.camera);
    }

    private initAudio() {
        if (this.audioCtx) return;

        // Safely get AudioContext
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        
        if (!this.audioCtx) return;

        const dest = this.audioCtx.destination;

        // 1. Base Drone (Dark Ambience)
        this.droneOsc = this.audioCtx.createOscillator();
        this.droneOsc.type = 'sawtooth';
        this.droneOsc.frequency.value = 55; // Low A
        
        const droneFilter = this.audioCtx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 120;
        
        this.droneGain = this.audioCtx.createGain();
        this.droneGain.gain.value = 0.1; // Subtle
        
        this.droneOsc.connect(droneFilter);
        droneFilter.connect(this.droneGain);
        this.droneGain.connect(dest);
        this.droneOsc.start();

        // 2. Wind / Speed Effect (Noise)
        const bufferSize = this.audioCtx.sampleRate * 2; // 2 seconds
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        this.windNode = this.audioCtx.createBufferSource();
        this.windNode.buffer = buffer;
        this.windNode.loop = true;

        this.windFilter = this.audioCtx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.Q.value = 1.0;
        this.windFilter.frequency.value = 200;

        this.windGain = this.audioCtx.createGain();
        this.windGain.gain.value = 0.0;

        this.windNode.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(dest);
        this.windNode.start();
    }

    private updateAudio(speed: number) {
        if (!this.audioCtx || !this.windGain || !this.windFilter || !this.droneOsc) return;
        
        const now = this.audioCtx.currentTime;

        // Wind Logic (normalized based on expected game speeds ~1-50)
        const nSpeed = Math.min(Math.max((speed - 1) / 40, 0), 1); 
        
        // Freq: 200Hz -> 1500Hz
        this.windFilter.frequency.setTargetAtTime(200 + (nSpeed * 1300), now, 0.1);
        // Gain: 0.0 -> 0.4
        this.windGain.gain.setTargetAtTime(nSpeed * 0.4, now, 0.1);
        
        // Drone Pitch shift
        this.droneOsc.frequency.setTargetAtTime(55 + (nSpeed * 15), now, 0.1);
    }

    private stopAudio() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        
        // Immediate cut for game over
        if (this.droneGain) {
            this.droneGain.gain.cancelScheduledValues(now);
            this.droneGain.gain.setValueAtTime(0, now);
        }
        if (this.windGain) {
            this.windGain.gain.cancelScheduledValues(now);
            this.windGain.gain.setValueAtTime(0, now);
        }
        
        // Stop oscillators to prevent lingering background buzz
        if (this.droneOsc) {
            try { this.droneOsc.stop(now + 0.1); } catch(e){}
        }
        if (this.windNode) {
            try { this.windNode.stop(now + 0.1); } catch(e){}
        }
    }

    private createGlowTexture() {
        if (GameScene.glowTexture) return GameScene.glowTexture;

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.4)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 32, 32);
        }
        GameScene.glowTexture = new THREE.CanvasTexture(canvas);
        return GameScene.glowTexture;
    }

    private createParticleSystems() {
        const texture = this.createGlowTexture();
        this.sparkSystem = new ParticleSystem(this.scene, 600, texture, 2);
    }

    public start(startSpeed: number) {
        // Audio disabled - was causing background noise
        // if (!this.audioCtx) {
        //     this.initAudio();
        // } else if (this.audioCtx.state === 'suspended') {
        //     this.audioCtx.resume();
        // }

        // Convert UI speed (200-700) to internal speed (2.0-7.0)
        const baseSpeed = startSpeed / 100.0;
        
        // Determine difficulty-based acceleration multiplier from starting speed
        // Cadet (300) = 1.0x, Pilot (500) = 1.25x, Ace (700) = 1.5x
        let accelerationMultiplier = 1.0;
        if (startSpeed >= 650) {
            accelerationMultiplier = DIFFICULTY_SETTINGS.ACE.accelerationMultiplier;
        } else if (startSpeed >= 450) {
            accelerationMultiplier = DIFFICULTY_SETTINGS.PILOT.accelerationMultiplier;
        } else {
            accelerationMultiplier = DIFFICULTY_SETTINGS.CADET.accelerationMultiplier;
        }
        
        // Generate settings based on speed
        this.settings = {
            label: "Custom",
            baseSpeed: baseSpeed,
            maxSpeed: baseSpeed + 40.0,
            turnAggression: TUNNEL_SETTINGS.turnAggression + (baseSpeed / 40.0),
            spawnRate: Math.max(RING_SPAWN_SETTINGS.baseSpawnRate, Math.floor(200 / baseSpeed)),
            accelerationMultiplier: accelerationMultiplier
        };

        // Initialize speed range for speed bar BEFORE reset (which calls onUpdateHUD)
        // Floor to nearest 100 km/h increment
        this.currentSpeedRangeMin = Math.floor(baseSpeed * 100 / 100) * 100;
        this.rangeMaxSpeed = baseSpeed * 100; // Start needle at current speed within range

        // Initialize max speed tracking
        this.maxSpeedReached = baseSpeed;

        this.initMap();
        this.reset();
        
        // Update speed bar UI after initialization
        this.updateSpeedBar();

        // Ensure plane is reset correctly
        this.plane.position.set(0, 0, 0);
        this.plane.rotation.set(0, 0, 0);

        this.isControlsLocked = true;
        this.startLockTimer = 90; // 1.5 seconds at 60fps
        this.createPopup("GET READY", new THREE.Vector3(0, 0, -200));

        this.isActive = true;
        this.loop();
    }

    public dispose() {
        this.isActive = false;
        this.stopAudio();
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
        cancelAnimationFrame(this.frameId);
        this.sparkSystem.dispose();
        this.renderer.dispose();
        this.container.innerHTML = '';
    }

    public onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public onMouseMove(event: MouseEvent) {
        this.targetMousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    public onTouchStart(event: TouchEvent) {
        if (event.touches.length > 0) {
            // Record starting touch position
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
            this.touchActive = true;
        }
    }
    
    public onTouchMove(event: TouchEvent) {
        if (event.touches.length > 0 && this.touchActive) {
            // Calculate relative movement from touch start
            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            
            // Normalize delta to screen size for consistent sensitivity
            const deltaX = (currentX - this.touchStartX) / window.innerWidth * 3;
            const deltaY = (currentY - this.touchStartY) / window.innerHeight * 3;
            
            // Clamp to -1 to 1 range
            this.targetMousePos.x = Math.max(-1, Math.min(1, deltaX));
            this.targetMousePos.y = Math.max(-1, Math.min(1, -deltaY)); // Invert Y
        }
    }
    
    public onTouchEnd() {
        this.touchActive = false;
        // Smoothly return to center when touch ends
        this.targetMousePos.x = 0;
        this.targetMousePos.y = 0;
    }

    private reset() {
        this.score = 0;
        this.health = HEALTH_SETTINGS.initialHealth;
        this.maxHealth = HEALTH_SETTINGS.initialMaxHealth;
        this.healthLevel = 1;
        this.currentSpeed = this.settings.baseSpeed;
        
        // Clear buff system
        this.activeBuffs = [];
        this.isShieldActive = false;
        this.showShieldMesh(false);
        
        // Reset decay-based boosts
        this.smoothBoost = 0;
        this.wideBoost = 0;
        
        // Reset quest ending state
        this.isGameOverSequence = false;
        this.gameOverTimer = 0;
        if (this.questOverlayEl) {
            this.questOverlayEl.remove();
            this.questOverlayEl = null;
        }
        
        if (this.plane) {
            this.plane.position.set(0, 0, 0);
            this.plane.rotation.set(0, 0, 0);
        }

        this.mousePos = { x: 0, y: 0 };
        this.targetMousePos = { x: 0, y: 0 };
        this.tubeCenterX = 0;
        this.tubeCenterY = 0;
        
        this.wallGeometries.forEach(g => { if (g.userData) g.userData.currentIntensity = 0; });
        
        this.rings.forEach(r => this.scene.remove(r));
        this.rings = [];
        this.particles.forEach(p => this.scene.remove(p));
        this.particles = [];
        
        this.sparkSystem.reset();

        this.callbacks.onUpdateHUD(0, HEALTH_SETTINGS.initialHealth, HEALTH_SETTINGS.initialMaxHealth, 1, this.maxSpeedReached, 0, 0);
        
        // Reset Audio
        if (this.audioCtx) {
            const now = this.audioCtx.currentTime;
            if (this.windGain) {
                this.windGain.gain.cancelScheduledValues(now);
                this.windGain.gain.value = 0;
            }
            // Restore drone background
            if (this.droneGain) {
                this.droneGain.gain.cancelScheduledValues(now);
                this.droneGain.gain.setValueAtTime(0.1, now); 
            }
        }
    }

    private initMap() {
        this.terrainMap = [];
        this.mapGenState = {
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0,
            vx: 0,
            vy: 0,
            segmentTimer: 0
        };
        
        // Add straight tunnel section at start (about 1.5 seconds at base speed)
        // This gives the player time to take control after "GO!"
        const straightLength = 600; // About 60 map segments = ~1.5 sec
        for (let i = 0; i < straightLength / MAP_RES; i++) {
            this.terrainMap.push({ x: 0, y: 0 });
        }
        
        this.appendMap(MAP_LEN);
    }

    private appendMap(length: number) {
        // smoothBoost reduces turn aggression (smoother tunnel)
        const baseTurnFactor = this.settings.turnAggression;
        const turnFactor = Math.max(0.1, baseTurnFactor - this.smoothBoost);
        const mapSteps = Math.ceil(length / MAP_RES);

        let { currentX, currentY, targetX, targetY, vx, vy, segmentTimer } = this.mapGenState;

        // Smoother physics: lower accel, higher drag, capped velocity
        const accel = 0.00003;       // was 0.00005 — less sudden curves
        const drag = 0.975;          // was 0.985 — more damping
        const maxVel = 1.5 * turnFactor; // cap velocity to prevent sudden jumps

        for (let i = 0; i < mapSteps; i++) {
            if (segmentTimer <= 0) {
                // Slightly longer segments for less frequent direction changes
                segmentTimer = 200 + Math.floor(Math.random() * 400);

                const range = 2500 * turnFactor; // reduced from 3000
                targetX = (Math.random() - 0.5) * range;
                targetY = (Math.random() - 0.5) * range;
            }

            // Smoothed random walk physics with velocity cap
            const dx = targetX - currentX;
            const dy = targetY - currentY;

            vx += dx * accel;
            vy += dy * accel;

            // Apply drag
            vx *= drag;
            vy *= drag;

            // Cap velocity magnitude to prevent sudden jumps
            const vel = Math.hypot(vx, vy);
            if (vel > maxVel) {
                const scale = maxVel / vel;
                vx *= scale;
                vy *= scale;
            }

            currentX += vx;
            currentY += vy;

            this.terrainMap.push({ x: currentX, y: currentY });
            segmentTimer--;
        }

        this.mapGenState = { currentX, currentY, targetX, targetY, vx, vy, segmentTimer };
    }

    private getMapAt(z: number): MapPoint {
        if (z > 0) return this.terrainMap[0] || {x:0, y:0};

        const dist = Math.abs(z);
        const exactIdx = dist / MAP_RES;
        const idx = Math.floor(exactIdx);
        const frac = exactIdx - idx; // Fractional part for interpolation
        
        if (idx < 0) return this.terrainMap[0] || {x:0, y:0};
        if (idx >= this.terrainMap.length - 1) return this.terrainMap[this.terrainMap.length - 1] || {x:0, y:0};
        
        // Interpolate between current and next map point for smooth tunnel center
        const current = this.terrainMap[idx];
        const next = this.terrainMap[idx + 1];
        
        return {
            x: current.x + (next.x - current.x) * frac,
            y: current.y + (next.y - current.y) * frac
        };
    }

    private createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.9); // Brighter ambient
        this.scene.add(ambient);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger directional
        this.dirLight.castShadow = true;
        
        // Static shadow configuration
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        const d = 300; 
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.camera.near = 1;
        this.dirLight.shadow.camera.far = 1000;
        this.dirLight.shadow.bias = -0.0005;

        // Create a dummy target that we will move manually
        this.lightTarget = new THREE.Object3D();
        this.scene.add(this.lightTarget);
        this.dirLight.target = this.lightTarget;

        this.scene.add(this.dirLight);
    }

    private createPlane() {
        if (this.plane) this.scene.remove(this.plane);
        const group = new THREE.Group();

        const mainMat = new THREE.MeshStandardMaterial({ 
            color: 0xEEEEEE, 
            metalness: 1.0, 
            roughness: 0.0,
            flatShading: false
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x0088FF });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.8 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.1, metalness: 1.0, transparent: true, opacity: 0.6 });

        // RACER / Plasma Glider Geometry
        // Central Pod
        const rPod = new THREE.Mesh(new THREE.CapsuleGeometry(2.5, 10, 8, 16), mainMat);
        rPod.rotation.x = Math.PI/2;
        group.add(rPod);
        
        const rCockpit = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 4, 4, 8), glassMat);
        rCockpit.rotation.x = Math.PI/2;
        rCockpit.position.set(0, 1.5, -2);
        group.add(rCockpit);

        // Large Ring Wing
        const rRing = new THREE.Mesh(new THREE.TorusGeometry(8, 0.8, 8, 48), mainMat);
        rRing.rotation.x = Math.PI/2;
        rRing.position.z = 2;
        group.add(rRing);
        
        // Plasma struts
        const rStrutL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6), darkMat);
        rStrutL.rotation.z = Math.PI/2;
        rStrutL.position.set(4, 0, 2);
        group.add(rStrutL);
        
        const rStrutR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6), darkMat);
        rStrutR.rotation.z = Math.PI/2;
        rStrutR.position.set(-4, 0, 2);
        group.add(rStrutR);
        
        // Trail emitters
        const rEmitL = new THREE.Mesh(new THREE.SphereGeometry(1), glowMat);
        rEmitL.position.set(8, 0, 2);
        group.add(rEmitL);
        
        const rEmitR = new THREE.Mesh(new THREE.SphereGeometry(1), glowMat);
        rEmitR.position.set(-8, 0, 2);
        group.add(rEmitR);

        const pLight = new THREE.PointLight(0x0088FF, 1.0, 500); 
        pLight.position.set(0, 2, -5);
        group.add(pLight);

        this.plane = group;
        this.scene.add(this.plane);

        // Approximate ship size for accurate wall collisions (tunnel is rendered as 4 walls).
        // Use bounding box so collision matches visuals even if ship geometry changes.
        group.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        box.getSize(size);
        this.shipHalfExtentXY = Math.max(size.x, size.y) / 2;
        
        // Create shield mesh (initially hidden)
        this.createShieldMesh();
    }
    
    private createShieldMesh() {
        // Hollow sphere shield with enhanced 3D perception - subtle visibility
        const shieldGroup = new THREE.Group();
        
        // Outer ring/edge highlight - compact, closer to craft
        const outerRingGeometry = new THREE.TorusGeometry(13, 0.25, 12, 48);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF66,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
        });
        const outerRingH = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRingH.rotation.x = Math.PI / 2; // Horizontal ring
        shieldGroup.add(outerRingH);
        
        const outerRingV = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        // Vertical ring - no rotation needed
        shieldGroup.add(outerRingV);
        
        const outerRingD = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRingD.rotation.y = Math.PI / 2; // Depth ring
        shieldGroup.add(outerRingD);
        
        // Wireframe sphere for hollow look - compact and subtle
        const wireGeometry = new THREE.IcosahedronGeometry(12, 1);
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF88,
            transparent: true,
            opacity: 0.05,
            wireframe: true,
            blending: THREE.AdditiveBlending,
        });
        const wireSphere = new THREE.Mesh(wireGeometry, wireMaterial);
        shieldGroup.add(wireSphere);
        
        this.shieldMesh = shieldGroup as unknown as THREE.Mesh;
        this.shieldMesh.visible = false;
        this.plane.add(this.shieldMesh);
    }
    
    private showShieldMesh(visible: boolean) {
        if (this.shieldMesh) {
            this.shieldMesh.visible = visible;
        }
    }

    private createTube() {
        // Lighter, more diffuse material for better visibility
        const mat = new THREE.MeshStandardMaterial({ 
            vertexColors: true,
            roughness: 0.4, // Less sharp reflections, more diffuse brightness
            metalness: 0.4, // Less dark metallic, more plastic/visible
            side: THREE.BackSide,
            flatShading: false
        });

        // 0: Floor, 1: Ceiling, 2: Left, 3: Right
        for(let i=0; i<4; i++) {
            const geom = new THREE.PlaneGeometry(
                CONFIG.tubeRadius * 2, 
                this.TUBE_LENGTH, 
                this.WIRE_SEGMENTS_X, 
                this.TUBE_SEGMENTS
            );
            
            const count = geom.attributes.position.count;
            geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
            geom.userData = { wallIndex: i, currentIntensity: 0 };
            
            const mesh = new THREE.Mesh(geom, mat);
            mesh.receiveShadow = true;
            mesh.castShadow = false; 
            mesh.frustumCulled = false;
            this.scene.add(mesh);

            this.wallGeometries.push(geom);
        }

        // Replaced Line with Particles for Center Guide
        const centerPoints = 200;
        const pGeom = new THREE.BufferGeometry();
        const pPos = new Float32Array(centerPoints * 3);
        pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        
        const pMat = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 4,
            transparent: true,
            opacity: 0.8,
            map: this.createGlowTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.centerParticles = new THREE.Points(pGeom, pMat);
        this.centerParticles.frustumCulled = false;
        this.scene.add(this.centerParticles);
    }

    private createRing(zPos: number) {
        // Tiered rarity system (no BOOST or RESTORE rings)
        const r = Math.random();
        let ringType: RingType;
        let color: number;
        
        // Cumulative probability check
        if (r < RING_PROBABILITIES.HEAL) {
            ringType = RingType.HEAL;
            color = RING_COLORS.HEAL;
        } else if (r < RING_PROBABILITIES.HEAL + RING_PROBABILITIES.SMOOTH) {
            ringType = RingType.SMOOTH;
            color = RING_COLORS.SMOOTH;
        } else if (r < RING_PROBABILITIES.HEAL + RING_PROBABILITIES.SMOOTH + RING_PROBABILITIES.WIDE) {
            ringType = RingType.WIDE;
            color = RING_COLORS.WIDE;
        } else {
            // Remaining probability = SHIELD (green, rare)
            ringType = RingType.SHIELD;
            color = RING_COLORS.SHIELD;
        }

        const mapData = this.getMapAt(zPos);
        const safeRadius = CONFIG.tubeRadius * 0.5; 
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * safeRadius;
        
        const randX = Math.cos(angle) * dist;
        const randY = Math.sin(angle) * dist;

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(10, 2, 8, 16), 
            new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 })
        );
        
        ring.position.set(mapData.x + randX, mapData.y + randY, zPos);
        ring.userData = { ringType: ringType, rotSpeed: 0.03 };
        ring.castShadow = true;
        ring.receiveShadow = true;

        this.scene.add(ring);
        this.rings.push(ring);
    }

    private createExplosion(pos: THREE.Vector3, color: number) {
        for(let i=0; i<8; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(1,1,1),
                new THREE.MeshBasicMaterial({color: color})
            );
            p.position.copy(pos);
            p.userData = { 
                vel: new THREE.Vector3((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*5), 
                life: 1.0 
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    private spawnSparks(pos: THREE.Vector3) {
        for(let i=0; i<5; i++) { // Increased particle count
            // Use cached tempSparkVel and randRange helper
            this.tempSparkVel.set(this.randRange(8), this.randRange(8), this.randRange(8));
            // Use cached sparkColor instead of creating new Color
            this.sparkSystem.spawn(pos, this.tempSparkVel, this.sparkColor, 3.0);
        }
    }

    private createBalloonIcon(type: 'smooth' | 'wide' | 'shield' | 'heal', pos: THREE.Vector3) {
        const vector = pos.clone();
        vector.project(this.camera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = (-(vector.y * .5) + .5) * window.innerHeight;

        const el = document.createElement('div');
        el.className = 'balloon-icon';
        
        // Create SVG icons based on type
        let iconSvg = '';
        let color = '';
        
        switch(type) {
            case 'smooth':
                color = '#00BFFF'; // Blue
                iconSvg = `<svg viewBox="0 0 40 40" width="40" height="40">
                    <path d="M5 20 Q12 10 20 20 Q28 30 35 20" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
                </svg>`;
                break;
            case 'wide':
                color = '#C0C0C0'; // Silver
                iconSvg = `<svg viewBox="0 0 40 40" width="40" height="40">
                    <path d="M8 20 L16 14 L16 18 L24 18 L24 14 L32 20 L24 26 L24 22 L16 22 L16 26 Z" fill="${color}"/>
                </svg>`;
                break;
            case 'shield':
                color = '#00FF00'; // Green
                iconSvg = `<svg viewBox="0 0 40 40" width="40" height="40">
                    <path d="M20 4 L32 10 L32 22 C32 30 20 36 20 36 C20 36 8 30 8 22 L8 10 Z" fill="${color}" opacity="0.8"/>
                    <path d="M20 8 L28 12 L28 21 C28 27 20 32 20 32 C20 32 12 27 12 21 L12 12 Z" fill="none" stroke="white" stroke-width="1" opacity="0.5"/>
                </svg>`;
                break;
            case 'heal':
                color = '#FFD700'; // Gold
                iconSvg = `<svg viewBox="0 0 40 40" width="40" height="40">
                    <rect x="16" y="8" width="8" height="24" rx="2" fill="${color}"/>
                    <rect x="8" y="16" width="24" height="8" rx="2" fill="${color}"/>
                </svg>`;
                break;
        }
        
        el.innerHTML = iconSvg;
        el.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0;
            pointer-events: none;
            z-index: 1000;
            filter: drop-shadow(0 0 8px ${color});
            animation: balloonPop 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    private createPopup(text: string, pos: THREE.Vector3) {
        const vector = pos.clone();
        let x, y;
        
        if (text === "GET READY" || text === "GO!") {
             x = window.innerWidth / 2;
             y = window.innerHeight / 2;
        } else {
            vector.project(this.camera);
            x = (vector.x * .5 + .5) * window.innerWidth;
            y = (-(vector.y * .5) + .5) * window.innerHeight;
        }

        const el = document.createElement('div');
        el.className = 'score-popup';
        el.innerText = text;
        
        // Check if text is an emoji/icon (single character or emoji)
        const isIcon = /^[\p{Emoji}]/u.test(text) || text.length <= 2;
        
        if (text === "GET READY" || text === "GO!") {
            el.style.transform = 'translate(-50%, -50%)';
            el.style.fontSize = '3rem';
            el.style.textShadow = '0 0 20px cyan';
        } else if (isIcon) {
            el.style.fontSize = '2.5rem';
            el.style.filter = 'drop-shadow(0 0 10px white)';
        }

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(()=>el.remove(), 1000);
    }

    // --- Helper Methods for Duplicate Code ---

    private getDistToWall(wallIndex: number, playerPos: number, wallPos: number, radius: number): number {
        if (wallIndex === 0) { // Floor
            return Math.abs(playerPos - (wallPos - radius));
        } else if (wallIndex === 1) { // Ceiling
            return Math.abs((wallPos + radius) - playerPos);
        } else if (wallIndex === 2) { // Left
            return Math.abs(playerPos - (wallPos - radius));
        } else { // Right
            return Math.abs((wallPos + radius) - playerPos);
        }
    }

    private getWallBounds(wallIndex: number, center: { x: number, y: number }, radius: number, worldZ: number): { x1: number, y1: number, z1: number, x2: number, y2: number, z2: number } {
        if (wallIndex === 0) { // Floor
            return { x1: center.x - radius, y1: center.y - radius, z1: worldZ, x2: center.x + radius, y2: center.y - radius, z2: worldZ };
        } else if (wallIndex === 1) { // Ceiling
            return { x1: center.x + radius, y1: center.y + radius, z1: worldZ, x2: center.x - radius, y2: center.y + radius, z2: worldZ };
        } else if (wallIndex === 2) { // Left Wall
            return { x1: center.x - radius, y1: center.y + radius, z1: worldZ, x2: center.x - radius, y2: center.y - radius, z2: worldZ };
        } else { // Right Wall
            return { x1: center.x + radius, y1: center.y - radius, z1: worldZ, x2: center.x + radius, y2: center.y + radius, z2: worldZ };
        }
    }

    private randRange(multiplier: number): number {
        return (Math.random() - 0.5) * multiplier;
    }

    private updateTube() {
        const playerZ = this.plane.position.z;
        const playerX = this.plane.position.x;
        const playerY = this.plane.position.y;
        // IMPORTANT: Render walls at the same radius used for collision/constraints
        // Otherwise the ship can be clamped outside the visible tunnel (especially with WIDE active).
        const cappedWideBoost = Math.min(this.wideBoost, 40);
        const r = CONFIG.tubeRadius + cappedWideBoost;

        // Brighter base color — shift toward cyan when WIDE is active for visual feedback
        const wideRatio = Math.min(1, this.wideBoost / 40);
        const baseColor = new THREE.Color(0x151515).lerp(new THREE.Color(0x102030), wideRatio * 0.5);
        const warnColor = new THREE.Color(0xFF0033);

        // Geometric Constants
        const segmentLen = this.TUBE_LENGTH / this.TUBE_SEGMENTS; 
        const viewBuffer = 400; // Distance behind player to render
        
        // SNAP LOGIC: Snap startZ to the nearest segment multiple
        // This ensures vertices are static in world space and don't slide/swim through noise
        const rawStartZ = playerZ + viewBuffer;
        const startZ = Math.floor(rawStartZ / segmentLen) * segmentLen;

        // UPDATE CENTER PARTICLES
        const centerPositions = this.centerParticles.geometry.attributes.position;
        const centerSpacing = 60; // 60 is a multiple of 30, so this aligns well
        // Snap particle startZ too
        const particleStartZ = Math.floor(rawStartZ / centerSpacing) * centerSpacing;

        for (let i = 0; i < centerPositions.count; i++) {
            const z = particleStartZ - (i * centerSpacing);
            const data = this.getMapAt(z);
            centerPositions.setXYZ(i, data.x, data.y, z);
        }
        centerPositions.needsUpdate = true;
        this.centerParticles.position.z = 0;

        // Make transverse lights denser as speed rises to amplify warp sensation
        const speedWarp = Math.min(3, 1 + (this.currentSpeed / 10));
        const ringInterval = 600 / speedWarp;

        // Time-based pulse for futuristic energy feel
        const time = Date.now() * 0.003;

        this.wallGeometries.forEach((geom) => {
            const wallIndex = geom.userData.wallIndex;
            
            const positions = geom.attributes.position;
            const colors = geom.attributes.color;
            
            const rows = this.TUBE_SEGMENTS + 1;
            
            const currentMap = this.getMapAt(playerZ);

            // Use helper method for distance calculation
            const distToWall = wallIndex <= 1
                ? this.getDistToWall(wallIndex, playerY, currentMap.y, r)
                : this.getDistToWall(wallIndex, playerX, currentMap.x, r);

            const safeDist = 90;
            const dangerDist = 20;
            
            let targetIntensity = 0;
            if (distToWall < dangerDist) targetIntensity = 1;
            else if (distToWall > safeDist) targetIntensity = 0;
            else {
                targetIntensity = 1 - ((distToWall - dangerDist) / (safeDist - dangerDist));
            }

            if (typeof geom.userData.currentIntensity !== 'number') geom.userData.currentIntensity = 0;
            const lerpSpeed = 0.1;
            geom.userData.currentIntensity += (targetIntensity - geom.userData.currentIntensity) * lerpSpeed;

            const smoothIntensity = geom.userData.currentIntensity;
            // Use cached tempLerpColor instead of creating new Color objects
            this.tempLerpColor.copy(baseColor).lerp(warnColor, smoothIntensity);
            
            const cols = this.WIRE_SEGMENTS_X + 1;

            const hsl = { h: 0, s: 0, l: 0 };
            this.tempLerpColor.getHSL(hsl);

            const midCol = this.WIRE_SEGMENTS_X / 2;

            for (let i = 0; i < rows; i++) {
                const distAhead = i * segmentLen;
                const worldZ = startZ - distAhead;
                const center = this.getMapAt(worldZ);

                const depthRatio = Math.min(distAhead / 8000, 1.0);
                
                const s = hsl.s * (1.0 - depthRatio); 
                const l = hsl.l * (1.0 - depthRatio * 0.9); 
                
                this.tempColor.setHSL(hsl.h, s, l);

                // Neon Logic
                // 1. Transverse Rings
                const zMod = Math.abs(worldZ) % ringInterval;
                const distToRingCenter = Math.min(zMod, ringInterval - zMod);
                // Tight, sharp ring (Power 8)
                const ringGlow = Math.pow(Math.max(0, 1 - distToRingCenter / 20), 8) + Math.max(0, 1 - distToRingCenter / 60) * 0.15;

                // Use helper method for wall bounds
                const bounds = this.getWallBounds(wallIndex, center, r, worldZ);
                const { x1, y1, z1, x2, y2, z2 } = bounds;

                const rowOffset = i * cols;
                
                // Disable pulsing to avoid flashing
                const pulse = 1.0;

                for(let j=0; j < cols; j++) {
                    const ratio = j / this.WIRE_SEGMENTS_X;
                    const px = x1 + (x2 - x1) * ratio;
                    const py = y1 + (y2 - y1) * ratio;
                    const pz = z1; 

                    const idx = rowOffset + j;
                    positions.setXYZ(idx, px, py, pz);
                    
                    // 2. Longitudinal Strips (Center Line with bleed)
                    const distToStrip = Math.abs(j - midCol);
                    // Match ring width
                    const dStrip = distToStrip * 20;
                    const stripGlow = Math.pow(Math.max(0, 1 - dStrip / 20), 8) + Math.max(0, 1 - dStrip / 60) * 0.15;

                    // Combine
                    const maxGlow = Math.max(ringGlow, stripGlow);
                    
                    if (maxGlow > 0.01) {
                        // Brighter without pulsing
                        const intensity = maxGlow * 0.9;
                        
                        let r = this.tempColor.r + this.stripColor.r * intensity;
                        let g = this.tempColor.g + this.stripColor.g * intensity;
                        let b = this.tempColor.b + this.stripColor.b * intensity;
                        
                        // Core White Boost (if very bright)
                        if (maxGlow > 0.6) {
                            const core = (maxGlow - 0.6) * 1.5;
                            r += core;
                            g += core;
                            b += core;
                        }

                        // Additive blending for neon glow
                        colors.setXYZ(
                            idx, 
                            Math.min(1, r),
                            Math.min(1, g),
                            Math.min(1, b)
                        );
                    } else {
                        colors.setXYZ(idx, this.tempColor.r, this.tempColor.g, this.tempColor.b);
                    }
                }
            }

            positions.needsUpdate = true;
            colors.needsUpdate = true;
            // computeVertexNormals() removed - normals don't change when translating vertices
        });
        
        const currentMap = this.getMapAt(playerZ);
        this.tubeCenterX = currentMap.x;
        this.tubeCenterY = currentMap.y;
    }

    private takeDamage(amount: number) {
        // Ignore damage during quest ending sequence
        if (this.isGameOverSequence) return;
        
        // Shield absorbs damage
        if (this.isShieldActive) {
            // Visual feedback for shield hit
            this.createExplosion(this.plane.position, 0xffaa00); // Orange flash
            return;
        }
        
        // Reduce current health
        this.health -= amount;

        // Reduce max health by 75% of the actual health reduction
        const maxHealthReduction = amount * HEALTH_SETTINGS.maxHealthReductionRatio;
        this.maxHealth -= maxHealthReduction;
        // Ensure maxHealth doesn't go below a minimum
        this.maxHealth = Math.max(20, this.maxHealth);
        // Ensure health doesn't exceed new maxHealth
        this.health = Math.min(this.health, this.maxHealth);

        if (this.frameId % 5 === 0) {
            document.body.classList.add('shake-anim');
            setTimeout(() => document.body.classList.remove('shake-anim'), 400);
        }

        if (this.frameId % 10 === 0) {
             this.createExplosion(this.plane.position, 0xff0000);
        }

        if (this.health <= 0) {
            if (this.healthLevel > 1) {
                // Level down: go back one level and restore to max health
                this.healthLevel--;
                this.maxHealth = HEALTH_SETTINGS.levelMaxHealth; // 400 HP bar
                this.health = this.maxHealth; // Start full
                this.createPopup(`${this.healthLevel}× HULL`, this.plane.position.clone());
            } else {
                // At level 1 with no health - start quest ending sequence
                this.startQuestEnding();
            }
        }
    }
    
    private startQuestEnding() {
        if (this.isGameOverSequence) return;
        this.isGameOverSequence = true;
        this.gameOverTimer = 0;
        if (this.questOverlayEl) {
            this.questOverlayEl.remove();
            this.questOverlayEl = null;
        }
        this.isActive = true; // Keep loop running for animation
        this.isPaused = false;
        this.stopAudio();
    }
    
    private runQuestEnding() {
        const deltaTime = 16.67;
        this.gameOverTimer += deltaTime;
        
        // Gradually accelerate forward and lift upward
        this.currentSpeed = Math.min(8, this.currentSpeed + 0.08);
        this.plane.translateZ(-this.currentSpeed);
        
        // Smoothly recenter and lift the craft
        const currentMap = this.getMapAt(this.plane.position.z);
        this.plane.position.x += (currentMap.x - this.plane.position.x) * 0.05;
        this.plane.position.y += (currentMap.y - this.plane.position.y) * 0.05 + 0.35;
        
        // Tilt nose up slightly
        this.plane.rotation.x += (-0.18 - this.plane.rotation.x) * 0.08;
        this.plane.rotation.z *= 0.9;
        this.plane.rotation.y = -this.plane.rotation.z * 0.5;
        
        // Increase fog for dreamy fade effect
        if (this.scene.fog instanceof THREE.FogExp2) {
            this.scene.fog.density = Math.min(0.0006, this.scene.fog.density + 0.000002);
        }
        
        // Camera follows and lifts
        this.camera.position.x += (currentMap.x - this.camera.position.x) * 0.1;
        this.camera.position.y += (currentMap.y + 40 - this.camera.position.y) * 0.05;
        this.camera.position.z = this.plane.position.z + 60;
        this.camera.lookAt(currentMap.x, currentMap.y + 20, this.plane.position.z - 120);
        
        // After 2.5 seconds, show the "YOUR QUEST IS OVER" overlay
        if (this.gameOverTimer >= 2500 && !this.questOverlayEl) {
            const overlay = document.createElement('div');
            overlay.innerText = 'YOUR QUEST IS OVER';
            overlay.className = 'pointer-events-auto select-none';
            Object.assign(overlay.style, {
                position: 'fixed',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                fontSize: 'clamp(36px, 4vw, 72px)',
                color: '#7ffbff',
                textShadow: '0 0 18px rgba(0, 255, 255, 0.8), 0 0 32px rgba(0, 180, 255, 0.6)',
                letterSpacing: '0.3em',
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 50, 80, 0.35), rgba(0,0,0,0.8))',
                cursor: 'pointer',
                zIndex: '9999'
            });
            overlay.addEventListener('click', () => this.finishQuestEnding());
            document.body.appendChild(overlay);
            this.questOverlayEl = overlay;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    private finishQuestEnding() {
        if (this.questOverlayEl) {
            this.questOverlayEl.remove();
            this.questOverlayEl = null;
        }
        this.isGameOverSequence = false;
        this.isActive = false;
        this.stopAudio();
        this.callbacks.onGameOver(this.maxSpeedReached * 100);
    }

    private loop = () => {
        if (!this.isActive || this.isPaused) return;

        this.frameId = requestAnimationFrame(this.loop);
        
        // Handle quest ending sequence separately
        if (this.isGameOverSequence) {
            this.runQuestEnding();
            return;
        }
        
        // Update buff timers (assuming ~60fps, deltaTime ≈ 16.67ms)
        const deltaTime = 16.67;
        this.updateBuffs(deltaTime);

        const currentMaxZ = this.terrainMap.length * MAP_RES;
        const playerDist = Math.abs(this.plane.position.z);
        if (currentMaxZ - playerDist < 14000) {
            this.appendMap(10000);
        }

        // --- Score is now Velocity ---
        // Track maximum speed reached during the run
        if (this.currentSpeed > this.maxSpeedReached) {
            this.maxSpeedReached = this.currentSpeed;
        }
        // Display uses max speed reached
        this.score = Math.floor(this.maxSpeedReached * 100);

        // Speed reduction increases as health decreases (more damage = faster deceleration)
        const healthRatio = this.health / this.maxHealth;
        const speedPenaltyMultiplier = 1.0 + (1.0 - healthRatio) * 2; // 1x at full health, 3x at low health
        const wallDeceleration = 0.01 * speedPenaltyMultiplier;

        if (this.isTouchingWall) {
            // Lose speed while touching walls
            this.currentSpeed -= wallDeceleration;

            // Speed floor: don't go below current range minimum (converted to internal speed)
            const currentRangeMin = this.currentSpeedRangeMin / 100;
            this.currentSpeed = Math.max(currentRangeMin, this.currentSpeed);

            // Visual feedback: make speed indicator red and flashing
            if (this.speedRef?.current) {
                this.speedRef.current.style.color = '#ff0000';
                this.speedRef.current.classList.add('animate-pulse');
            }
        } else {
            // Normal acceleration with difficulty multiplier
            if (this.currentSpeed < this.settings.maxSpeed) {
                const baseAcceleration = SPEED_SETTINGS.baseAcceleration;
                const difficultyMultiplier = this.settings.accelerationMultiplier || 1.0;
                this.currentSpeed += baseAcceleration * difficultyMultiplier;
            }
            
            // IMPORTANT: Enforce speed floor globally, not just when touching walls
            // Speed can never drop below the current range minimum
            const currentRangeMinSpeed = this.currentSpeedRangeMin / 100;
            this.currentSpeed = Math.max(currentRangeMinSpeed, this.currentSpeed);
            
            // Reset speed indicator color when not decelerating
            if (this.speedRef?.current) {
                this.speedRef.current.style.color = '';
                this.speedRef.current.classList.remove('animate-pulse');
            }
        }

        // Update speed bar
        this.updateSpeedBar();

        this.plane.translateZ(-this.currentSpeed);

        // Get map for autopilot centering (controls locked state)
        const autoMap = this.getMapAt(this.plane.position.z);
        
        if (this.isControlsLocked) {
            this.startLockTimer--;
            
            // Autopilot: Snap to center
            this.plane.position.x = autoMap.x;
            this.plane.position.y = autoMap.y;
            
            // Autopilot: Level flight
            this.plane.rotation.z = 0;
            this.plane.rotation.x = 0;
            this.plane.rotation.y = 0;

            if (this.startLockTimer <= 0) {
                this.isControlsLocked = false;
                this.createPopup("GO!", new THREE.Vector3(0, 0, -200));
            }
        } else {
            // INPUT SMOOTHING REMOVED for instant response
            this.mousePos.x = this.targetMousePos.x;
            this.mousePos.y = this.targetMousePos.y;

            // Get tunnel center BEFORE movement to predict wall distance
            const preMovementMap = this.getMapAt(this.plane.position.z);
            const preCx = preMovementMap.x;
            const preCy = preMovementMap.y;
            
            // Calculate effective radius (with wideBoost cap)
            const preCappedWideBoost = Math.min(this.wideBoost, 40);
            const preR = CONFIG.tubeRadius + preCappedWideBoost;
            const safeMargin = 2; // Keep a tiny buffer from the wall
            const preInnerR = Math.max(1, preR - this.shipHalfExtentXY - safeMargin);
            
            // PRECISE LATERAL CONTROL with max movement limit
            const lateralSpeed = 8.0 + (this.currentSpeed * 0.5);
            let deltaX = this.mousePos.x * lateralSpeed;
            let deltaY = this.mousePos.y * lateralSpeed;
            
            // Cap maximum movement per frame to prevent overshooting
            const maxDelta = 12;
            deltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
            deltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));
            
            // Calculate intended new position
            let newX = this.plane.position.x + deltaX;
            let newY = this.plane.position.y + deltaY;
            
            // Pre-clamp to tunnel bounds BEFORE applying movement (square tunnel walls)
            const preMinX = preCx - preInnerR;
            const preMaxX = preCx + preInnerR;
            const preMinY = preCy - preInnerR;
            const preMaxY = preCy + preInnerR;
            
            newX = Math.max(preMinX, Math.min(preMaxX, newX));
            newY = Math.max(preMinY, Math.min(preMaxY, newY));
            
            this.plane.position.x = newX;
            this.plane.position.y = newY;

            // Bank Logic
            const targetRoll = -this.mousePos.x * 1.4; // Increased bank angle
            const targetPitch = this.mousePos.y * 1.0;

            this.plane.rotation.z += (targetRoll - this.plane.rotation.z) * 0.3; // Increased for snappier response
            this.plane.rotation.x += (targetPitch - this.plane.rotation.x) * 0.3; // Increased for snappier response
            this.plane.rotation.y = -this.plane.rotation.z * 0.5;
        }

        // Update artificial horizon instrument
        // Horizon instrument removed

        // Update light position
        this.dirLight.position.set(0, 100, this.plane.position.z + 50);
        this.lightTarget.position.set(0, 0, this.plane.position.z - 50);
        
        // Collision & Constraint Logic - ROBUST MULTI-POINT CHECK
        // Check tunnel bounds at current position AND slightly ahead (for high-speed turns)
        const currentMap = this.getMapAt(this.plane.position.z);
        const aheadMap = this.getMapAt(this.plane.position.z - this.currentSpeed * 2); // Look ahead 2 frames
        
        // Use the same effective radius as rendering
        const cappedWideBoost = Math.min(this.wideBoost, 40);
        const r = CONFIG.tubeRadius + cappedWideBoost;

        // The tunnel is rendered as 4 axis-aligned walls, so collision must be square too.
        const innerR = Math.max(1, r - this.shipHalfExtentXY);
        const hardMargin = 2;
        
        const cx = currentMap.x;
        const cy = currentMap.y;
        const ax = aheadMap.x;
        const ay = aheadMap.y;
        // Compute square bounds at current and ahead positions, then intersect if they overlap.
        const curMinX = cx - innerR + hardMargin;
        const curMaxX = cx + innerR - hardMargin;
        const curMinY = cy - innerR + hardMargin;
        const curMaxY = cy + innerR - hardMargin;

        const aheadMinX = ax - innerR + hardMargin;
        const aheadMaxX = ax + innerR - hardMargin;
        const aheadMinY = ay - innerR + hardMargin;
        const aheadMaxY = ay + innerR - hardMargin;

        let minX = Math.max(curMinX, aheadMinX);
        let maxX = Math.min(curMaxX, aheadMaxX);
        let minY = Math.max(curMinY, aheadMinY);
        let maxY = Math.min(curMaxY, aheadMaxY);

        // If intersection doesn't overlap (sharp turn), fall back to current bounds.
        if (minX > maxX) {
            minX = curMinX;
            maxX = curMaxX;
        }
        if (minY > maxY) {
            minY = curMinY;
            maxY = curMaxY;
        }

        // HARD CLAMP - ensure craft stays within bounds absolutely
        this.plane.position.x = Math.max(minX, Math.min(maxX, this.plane.position.x));
        this.plane.position.y = Math.max(minY, Math.min(maxY, this.plane.position.y));

        // Touching wall if near the current bounds (matches the visible walls)
        const wallThreshold = 2;
        const touchingWall =
            this.plane.position.y <= curMinY + wallThreshold ||
            this.plane.position.y >= curMaxY - wallThreshold ||
            this.plane.position.x <= curMinX + wallThreshold ||
            this.plane.position.x >= curMaxX - wallThreshold;
        if (touchingWall) {
            this.takeDamage(1.5);
            this.isTouchingWall = true;
        } else {
            this.isTouchingWall = false;
        }

        // CAMERA LOGIC
        const playerOffsetX = this.plane.position.x - cx;
        const playerOffsetY = this.plane.position.y - cy;
        
        // Follow Ratio: 0.92 = Tightly focused on ship
        const camFollowRatio = 0.92; 
        
        // Lower Lerp = Tighter camera follow
        const camLerp = 0.18; 

        const targetCamX = cx + (playerOffsetX * camFollowRatio);
        const targetCamY = cy + (playerOffsetY * camFollowRatio);
        const targetCamZ = this.plane.position.z + 50; 
        
        this.camera.position.x += (targetCamX - this.camera.position.x) * camLerp;
        this.camera.position.y += (targetCamY - this.camera.position.y) * camLerp;
        this.camera.position.z = targetCamZ; 
        
        // Look At Logic
        const lookAheadDist = 150;
        const lookAtZ = this.plane.position.z - lookAheadDist;
        const lookAtMap = this.getMapAt(lookAtZ);
        
        const lookRatio = 0.5;
        const lookAtX = lookAtMap.x + (playerOffsetX * lookRatio);
        const lookAtY = lookAtMap.y + (playerOffsetY * lookRatio);

        this.camera.lookAt(lookAtX, lookAtY, lookAtZ);

        // Clamp Camera
        const camMap = this.getMapAt(this.camera.position.z);
        const camR = r - 5;
        this.camera.position.x = Math.max(camMap.x - camR, Math.min(camMap.x + camR, this.camera.position.x));
        this.camera.position.y = Math.max(camMap.y - camR, Math.min(camMap.y + camR, this.camera.position.y));

        // Spawn Sparks
        const sparkRange = 25; 
        const pX = this.plane.position.x;
        const pY = this.plane.position.y;
        
        const floorY = cy - r;
        const ceilY = cy + r;
        const leftX = cx - r;
        const rightX = cx + r;

        if (pY < floorY + sparkRange) this.spawnSparks(new THREE.Vector3(pX, floorY, this.plane.position.z));
        if (pY > ceilY - sparkRange) this.spawnSparks(new THREE.Vector3(pX, ceilY, this.plane.position.z));
        if (pX < leftX + sparkRange) this.spawnSparks(new THREE.Vector3(leftX, pY, this.plane.position.z));
        if (pX > rightX - sparkRange) this.spawnSparks(new THREE.Vector3(rightX, pY, this.plane.position.z));

        // Update Particle Systems
        this.sparkSystem.update();

        // Dynamic spawn rate using countdown timer (not modulo) to avoid gaps
        // Faster speed = more frequent ring spawns
        const dynamicSpawnRate = Math.max(20, Math.floor(250 / this.currentSpeed));
        this.ringSpawnTimer--;
        if (this.ringSpawnTimer <= 0 && this.isActive) {
            this.createRing(this.plane.position.z - 600);
            this.ringSpawnTimer = dynamicSpawnRate; // reset timer
        }

        for(let i = this.rings.length - 1; i >= 0; i--) {
            const r = this.rings[i];
            r.rotation.z += r.userData.rotSpeed;

            if (this.plane.position.distanceTo(r.position) < 25) {
                const ringType = r.userData.ringType as RingType;
                this.handleRingCollection(ringType, r.position.clone());

                this.scene.remove(r);
                r.geometry.dispose();
                (r.material as THREE.Material).dispose();
                this.rings.splice(i, 1);
                continue;
            }

            if (r.position.z > this.plane.position.z + 20) {
                this.scene.remove(r);
                r.geometry.dispose();
                (r.material as THREE.Material).dispose();
                this.rings.splice(i, 1);
            }
        }

        for(let i=this.particles.length-1; i>=0; i--) {
            const p = this.particles[i];
            p.position.add(p.userData.vel);
            p.userData.life -= 0.05;
            p.scale.multiplyScalar(0.9);
            if(p.userData.life <= 0) {
                this.scene.remove(p);
                if (p.geometry) p.geometry.dispose();
                if (p.material) (p.material as THREE.Material).dispose();
                this.particles.splice(i, 1);
            }
        }

        this.updateTube();
        
        // Audio disabled - was causing background noise
        // this.updateAudio(this.currentSpeed);
        
        // Calculate smooth and wide percentages for HUD
        const smoothPercent = Math.min(100, (this.smoothBoost / RING_EFFECTS.SMOOTH.maxReduction) * 100);
        const widePercent = Math.min(100, (this.wideBoost / RING_EFFECTS.WIDE.maxBoost) * 100);
        this.callbacks.onUpdateHUD(this.score, this.health, this.maxHealth, this.healthLevel, this.maxSpeedReached, smoothPercent, widePercent);

        this.renderer.render(this.scene, this.camera);
    }
}