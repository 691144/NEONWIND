import React, { useState, useRef, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import { GameState, LeaderboardEntry } from './types';

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