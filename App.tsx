import React, { useState, useRef, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import { GameState, LeaderboardEntry } from './types';

function getIsLandscape() {
    return window.matchMedia
        ? window.matchMedia('(orientation: landscape)').matches
        : window.innerWidth > window.innerHeight;
}

function App() {
    const [gameState, setGameState] = useState<GameState>(GameState.SPLASH);
    const [startSpeed, setStartSpeed] = useState<number>(300);
    const [rankName, setRankName] = useState<string>("CADET");
    const [lastScore, setLastScore] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // Refs for direct manipulation by the game loop to avoid React render cycles
    const scoreRef = useRef<HTMLSpanElement>(null);
    const speedRef = useRef<HTMLSpanElement>(null);
    const healthBarRef = useRef<HTMLDivElement>(null);
    const healthContainerRef = useRef<HTMLDivElement>(null);
    const speedBarRef = useRef<HTMLDivElement>(null);
    const speedBarFillRef = useRef<HTMLDivElement>(null);
    const speedBarNeedleRef = useRef<HTMLDivElement>(null);
    const speedBarRangeRef = useRef<HTMLSpanElement>(null);
    const speedBarTopRef = useRef<HTMLSpanElement>(null);
    const pauseOverlayRef = useRef<HTMLDivElement>(null);
    const gameSceneRef = useRef<{ togglePause: () => void } | null>(null);
    const [isLandscape, setIsLandscape] = useState<boolean>(() => {
        // SSR not used here, but keep it safe.
        if (typeof window === 'undefined') return false;
        return getIsLandscape();
    });

    // Load leaderboard on mount
    useEffect(() => {
        const saved = localStorage.getItem('sky_ace_lb');
        if (saved) {
            try {
                setLeaderboard(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse leaderboard", e);
            }
        }
    }, []);

    // Orientation: update immediately, with a tiny stability threshold.
    useEffect(() => {
        let rafId = 0;
        let last = getIsLandscape();
        let stableFrames = 0;

        const update = () => {
            const next = getIsLandscape();
            if (next === last) stableFrames++;
            else {
                last = next;
                stableFrames = 0;
            }

            // Small inertia threshold: require a couple stable frames to avoid bouncing.
            if (stableFrames >= 2) {
                setIsLandscape(next);
                stableFrames = 0;
            }
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);

        const kick = () => {
            // Immediate kick on known events.
            last = getIsLandscape();
            stableFrames = 2;
        };

        window.addEventListener('orientationchange', kick);
        window.addEventListener('resize', kick);
        window.visualViewport?.addEventListener('resize', kick);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('orientationchange', kick);
            window.removeEventListener('resize', kick);
            window.visualViewport?.removeEventListener('resize', kick);
        };
    }, []);

    const handleDismissSplash = () => {
        setGameState(GameState.MENU);
    };

    const handleStart = (speed: number, rank: string) => {
        setStartSpeed(speed);
        setRankName(rank);
        setGameState(GameState.PLAYING);
    };

    const handleRestart = () => {
        setGameState(GameState.PLAYING);
    };

    const handleHome = () => {
        setGameState(GameState.MENU);
    };

    const handleGameOver = (score: number) => {
        setLastScore(score);
        setGameState(GameState.GAME_OVER);
    };

    const handleSaveScore = (name: string) => {
        const newEntry: LeaderboardEntry = {
            name,
            score: lastScore,
            difficulty: rankName,
            date: Date.now()
        };

        const newLb = [...leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Keep top 10

        setLeaderboard(newLb);
        localStorage.setItem('sky_ace_lb', JSON.stringify(newLb));
    };

    const handlePause = () => {
        gameSceneRef.current?.togglePause();
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'black' }}>
            <GameScene 
                gameState={gameState} 
                startSpeed={startSpeed}
                onGameOver={handleGameOver}
                gameSceneRef={gameSceneRef}
                scoreRef={scoreRef}
                speedRef={speedRef}
                healthBarRef={healthBarRef}
                healthContainerRef={healthContainerRef}
                speedBarRef={speedBarRef}
                speedBarFillRef={speedBarFillRef}
                speedBarNeedleRef={speedBarNeedleRef}
                speedBarRangeRef={speedBarRangeRef}
                speedBarTopRef={speedBarTopRef}
                pauseOverlayRef={pauseOverlayRef}
            />
            <UIOverlay
                gameState={gameState}
                lastScore={lastScore}
                leaderboard={leaderboard}
                isLandscape={isLandscape}
                onDismissSplash={handleDismissSplash}
                onStart={handleStart}
                onRestart={handleRestart}
                onHome={handleHome}
                onSaveScore={handleSaveScore}
                onPause={handlePause}
                scoreRef={scoreRef}
                speedRef={speedRef}
                healthBarRef={healthBarRef}
                healthContainerRef={healthContainerRef}
                speedBarRef={speedBarRef}
                speedBarFillRef={speedBarFillRef}
                speedBarNeedleRef={speedBarNeedleRef}
                speedBarRangeRef={speedBarRangeRef}
                speedBarTopRef={speedBarTopRef}
                pauseOverlayRef={pauseOverlayRef}
            />
        </div>
    );
}

export default App;