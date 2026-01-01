import React, { useState } from 'react';
import { GameState, LeaderboardEntry } from '../types';

interface UIOverlayProps {
    gameState: GameState;
    lastScore: number;
    leaderboard: LeaderboardEntry[];
    onDismissSplash: () => void;
    onStart: (speed: number, rank: string) => void;
    onRestart: () => void;
    onHome: () => void;
    onSaveScore: (name: string) => void;
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

export const UIOverlay: React.FC<UIOverlayProps> = ({
    gameState,
    lastScore,
    leaderboard,
    onDismissSplash,
    onStart,
    onRestart,
    onHome,
    onSaveScore,
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
    const [startSpeed, setStartSpeed] = useState<number>(300);
    const [playerName, setPlayerName] = useState("");
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const splashImage = '/chatgpt-splash.png';

    const getRank = (speed: number) => {
        if (speed < 300) return "CADET";
        if (speed < 450) return "PILOT";
        if (speed < 600) return "ACE";
        return "LEGEND";
    };

    const handleSubmitScore = () => {
        if (playerName.trim().length > 0 && !hasSubmitted) {
            onSaveScore(playerName.substring(0, 10)); // Limit name length
            setHasSubmitted(true);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 10
        }}>
            {/* HUD Header - Visible during gameplay only */}
            {gameState === GameState.PLAYING && (
                <header className="relative w-full h-32 p-5 text-white bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-500">
                    {/* Center: Health Bar with Multiplier */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-xl">
                        {/* Health Bar Container with Level Multiplier */}
                        <div className="flex items-center gap-3">
                            {/* Health Level Multiplier Badge (left of bar) */}
                            <div 
                                className="text-lg font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] min-w-[40px] text-right"
                                id="health-multiplier"
                            >
                                1×
                            </div>
                            <div
                                ref={healthContainerRef}
                                data-level="1×"
                                className="relative h-6 bg-black/60 border-2 rounded-full overflow-hidden shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-[width] duration-500 ease-out"
                                style={{ width: '140px', borderColor: 'rgba(74, 222, 128, 0.6)' }}
                            >
                                <div
                                    ref={healthBarRef}
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-300 shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-[width] duration-200 ease-out w-full"
                                />
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* Speed Bar - Bottom of screen during gameplay */}
            {gameState === GameState.PLAYING && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-none">
                    {/* Speed readout above the bar */}
                    <div className="mb-2 flex items-center justify-center px-6 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-cyan-500/30 pointer-events-none">
                        <span ref={speedRef} className="font-digital text-4xl md:text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-widest w-32 text-center">0</span>
                        <span className="font-digital text-sm text-cyan-400/70 ml-2 pt-2">KM/H</span>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-cyan-500/30">
                        <div className="flex justify-between text-xs text-cyan-400 mb-1">
                            <span ref={speedBarRangeRef}>600 - 700 KM/H</span>
                            <span>TOP: <span ref={speedBarTopRef}>0</span></span>
                        </div>
                        <div ref={speedBarRef} className="h-8 bg-gray-800 rounded-full overflow-hidden relative">
                            {/* Current speed fill */}
                            <div ref={speedBarFillRef} className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all" style={{ width: '50%' }} />
                            {/* Top speed needle */}
                            <div ref={speedBarNeedleRef} className="absolute top-0 h-full w-1 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" style={{ left: '80%' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* SPLASH SCREEN */}
            {gameState === GameState.SPLASH && (
                <div 
                    onClick={onDismissSplash}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        backgroundImage: splashImage ? `url(${splashImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#000'
                    }}
                >
                    {/* Content Layer */}
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '50px 60px',
                        borderRadius: '20px',
                        border: '2px solid rgba(0,255,255,0.3)',
                        boxShadow: '0 0 60px rgba(0,255,255,0.3)'
                    }}>
                        <h1 style={{
                            fontSize: 'clamp(3rem, 12vw, 7rem)',
                            fontWeight: 900,
                            fontFamily: "'Orbitron', sans-serif",
                            color: '#00ffff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '16px',
                            textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 80px rgba(0,255,255,0.5)',
                            WebkitTextStroke: '1px rgba(255,255,255,0.3)'
                        }}>
                            NEON WINDER
                        </h1>
                        <p style={{
                            color: '#22d3ee',
                            fontWeight: 'bold',
                            letterSpacing: '0.5em',
                            fontSize: '0.875rem',
                            marginTop: '16px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: '8px 16px',
                            borderRadius: '4px'
                        }}>
                            TAP TO START
                        </p>
                    </div>
                </div>
            )}

            {/* Start Menu */}
            {gameState === GameState.MENU && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        overflowY: 'auto',
                        zIndex: 100,
                        backgroundColor: splashImage ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.9)',
                        backgroundImage: splashImage ? `url(${splashImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundBlendMode: 'overlay'
                    }}
                >
                    {/* Dark overlay specifically for readability if image is present */}
                    <div className={`absolute inset-0 ${splashImage ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`} />

                    <div className="relative z-10 bg-black/80 p-8 rounded-lg border-2 border-cyan-400 text-center text-white shadow-[0_0_30px_rgba(0,242,255,0.4)] max-w-lg w-[90%] my-8 backdrop-blur-md">
                        <h1 className="text-4xl md:text-5xl font-black text-cyan-400 uppercase tracking-widest mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                            Neon Winder
                        </h1>
                        <p className="mb-4 text-gray-300 text-sm">
                            The tunnel winds aggressively. Maintain velocity.
                            <br/><span className="text-xs text-red-400 mt-1 block">Walls glow RED when you are too close!</span>
                        </p>

                        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">Select Difficulty</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStartSpeed(300)}
                                    className={`flex-1 py-3 px-2 rounded font-black uppercase tracking-wider transition-all text-sm ${
                                        startSpeed === 300
                                            ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,255,255,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-cyan-400'
                                    }`}
                                >
                                    Cadet
                                </button>
                                <button
                                    onClick={() => setStartSpeed(500)}
                                    className={`flex-1 py-3 px-2 rounded font-black uppercase tracking-wider transition-all text-sm ${
                                        startSpeed === 500
                                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-yellow-500'
                                    }`}
                                >
                                    Pilot
                                </button>
                                <button
                                    onClick={() => setStartSpeed(700)}
                                    className={`flex-1 py-3 px-2 rounded font-black uppercase tracking-wider transition-all text-sm ${
                                        startSpeed === 700
                                            ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-red-500'
                                    }`}
                                >
                                    Ace
                                </button>
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-white font-mono">{startSpeed} <span className="text-xs text-gray-400">KM/H</span></span>
                                <span className="text-xs text-gray-500 block mt-1">
                                    {startSpeed === 300 && '1.0× acceleration'}
                                    {startSpeed === 500 && '1.25× acceleration'}
                                    {startSpeed === 700 && '1.5× acceleration'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onStart(startSpeed, startSpeed === 300 ? "CADET" : startSpeed === 500 ? "PILOT" : "ACE")}
                            className="bg-transparent border-2 border-cyan-400 py-3 px-10 text-cyan-400 font-black text-xl uppercase rounded hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,255,1)] transition-all duration-200 mb-6 w-full"
                        >
                            Engage
                        </button>

                        {/* Leaderboard Preview */}
                        <div className="text-left border-t border-gray-700 pt-4">
                            <h3 className="text-cyan-400 uppercase font-bold mb-2 text-center text-xs">Top Aces</h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-center text-gray-500 text-xs">No records yet.</p>
                            ) : (
                                <table className="w-full text-xs text-gray-300">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="py-1 text-left">Pilot</th>
                                            <th className="py-1 text-center">Rank</th>
                                            <th className="py-1 text-right">Speed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.slice(0, 3).map((entry, idx) => (
                                            <tr key={idx} className="border-b border-gray-800 last:border-0">
                                                <td className="py-1">{entry.name}</td>
                                                <td className="py-1 text-center text-gray-500">{entry.difficulty}</td>
                                                <td className="py-1 text-right font-mono text-cyan-400">{Math.floor(entry.score)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Menu */}
            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center pointer-events-auto transition-opacity duration-300 overflow-y-auto">
                    <div className="bg-black/80 p-8 rounded-lg border-2 border-red-500 text-center text-white shadow-[0_0_30px_rgba(255,56,96,0.4)] max-w-lg w-[90%] my-8">
                        <h1 className="text-4xl md:text-5xl font-black text-red-500 uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(255,56,96,0.8)]">
                            Critical Error
                        </h1>
                        <p className="mb-6 text-gray-300">Hull breach detected.</p>
                        
                        <div className="flex flex-col mb-8">
                            <span className="text-xs text-red-400 uppercase tracking-widest font-bold">Final Velocity</span>
                            <span className="font-mono text-4xl font-bold">{Math.floor(lastScore)} <span className="text-sm align-top">KM/H</span></span>
                        </div>

                        {/* Score Submission */}
                        {!hasSubmitted && lastScore > 0 && (
                            <div className="mb-8 flex gap-2 justify-center">
                                <input 
                                    type="text" 
                                    placeholder="ENTER CALLSIGN" 
                                    maxLength={10}
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                                    className="bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded text-center uppercase tracking-widest outline-none focus:border-cyan-400"
                                />
                                <button 
                                    onClick={handleSubmitScore}
                                    disabled={playerName.length === 0}
                                    className="bg-cyan-900 border border-cyan-400 px-4 py-2 rounded text-cyan-400 font-bold hover:bg-cyan-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    SAVE
                                </button>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => { setHasSubmitted(false); setPlayerName(""); onRestart(); }}
                                className="bg-transparent border-2 border-red-500 py-3 px-10 text-red-500 font-black text-xl uppercase rounded hover:bg-red-500 hover:text-black hover:shadow-[0_0_20px_rgba(255,56,96,1)] transition-all duration-200"
                            >
                                Reboot System
                            </button>
                            <button 
                                onClick={() => { setHasSubmitted(false); setPlayerName(""); onHome(); }}
                                className="bg-transparent border border-white/30 py-2 px-8 text-gray-300 font-bold text-lg uppercase rounded hover:bg-white hover:text-black transition-all duration-200"
                            >
                                Return to Base
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Pause overlay (toggled by engine) */}
            <div
                ref={pauseOverlayRef}
                id="pause-overlay"
                className="pointer-events-none select-none fixed inset-0 z-50 hidden items-center justify-center bg-black/75 backdrop-blur-sm"
                style={{ display: 'none' }}
            >
                <div className="px-10 py-8 min-w-[320px] bg-black/90 border-2 border-cyan-300 rounded-2xl text-cyan-100 font-mono text-center shadow-[0_0_32px_rgba(0,255,255,0.55)] ring-1 ring-cyan-400/40">
                    <div className="text-3xl font-black tracking-[0.3em] drop-shadow-[0_0_14px_rgba(0,255,255,0.7)]">PAUSED</div>
                    <div className="text-base mt-3 opacity-85">Tap to continue</div>
                </div>
            </div>
        </div>
    );
};