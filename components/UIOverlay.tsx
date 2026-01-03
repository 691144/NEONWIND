import React, { useState } from 'react';
import { GameState, LeaderboardEntry } from '../types';

interface UIOverlayProps {
    gameState: GameState;
    lastScore: number;
    leaderboard: LeaderboardEntry[];
    isLandscape: boolean;
    onDismissSplash: () => void;
    onStart: (speed: number, rank: string) => void;
    onRestart: () => void;
    onHome: () => void;
    onSaveScore: (name: string) => void;
    onPause: () => void;
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
    isLandscape,
    onDismissSplash,
    onStart,
    onRestart,
    onHome,
    onSaveScore,
    onPause,
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
                <header
                    className={
                        isLandscape
                            ? 'relative w-full h-20 p-3 text-white bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-500'
                            : 'relative w-full h-32 p-5 text-white bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-500'
                    }
                >
                    {/* Center: Health Bar with Multiplier */}
                    <div
                        className={
                            isLandscape
                                ? 'absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-sm'
                                : 'absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-xl'
                        }
                    >
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
                <div
                    className={
                        isLandscape
                            ? 'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-full max-w-sm px-2 pointer-events-none'
                            : 'absolute bottom-2 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-none'
                    }
                >
                    {/* Pause + Orientation buttons row */}
                    <div className={isLandscape ? 'flex justify-center gap-2 mb-0.5' : 'flex justify-center gap-2 mb-1'}>
                        {/* Orientation toggle button - mobile only */}
                        <button
                            onClick={() => {
                                const o: any = (screen as any).orientation;
                                if (o && typeof o.lock === 'function') {
                                    // Prefer primary orientations so we switch portrait<->landscape
                                    // instead of flipping between landscape-primary/secondary.
                                    const target = isLandscape ? 'portrait-primary' : 'landscape-primary';
                                    o.lock(target).catch(() => {
                                        // Fallbacks for older implementations
                                        o.lock(isLandscape ? 'portrait' : 'landscape').catch(() => {});
                                    });
                                }
                            }}
                            className={
                                isLandscape
                                    ? 'w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/40 flex items-center justify-center pointer-events-auto hover:bg-cyan-500/20 transition-all md:hidden'
                                    : 'w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/40 flex items-center justify-center pointer-events-auto hover:bg-cyan-500/20 transition-all md:hidden'
                            }
                            title="Rotate"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isLandscape ? 'w-3 h-3 text-cyan-400' : 'w-4 h-4 text-cyan-400'}>
                                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {/* Pause button */}
                        <button
                            onClick={onPause}
                            className={
                                isLandscape
                                    ? 'w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border-2 border-cyan-500/50 flex items-center justify-center pointer-events-auto hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]'
                                    : 'w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border-2 border-cyan-500/50 flex items-center justify-center pointer-events-auto hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]'
                            }
                            title="Pause"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isLandscape ? 'w-3 h-3 text-cyan-400' : 'w-4 h-4 text-cyan-400'}>
                                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Speed readout above the bar - more compact in landscape */}
                    <div className={isLandscape ? 'mb-0 flex items-center justify-center px-1.5 py-0 bg-black/50 backdrop-blur-md rounded-md border border-cyan-500/30 pointer-events-none' : 'mb-1 flex items-center justify-center px-3 py-0.5 bg-black/50 backdrop-blur-md rounded-md border border-cyan-500/30 pointer-events-none'}>
                        <span ref={speedRef} className={isLandscape ? 'font-digital text-base font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-widest w-12 text-center' : 'font-digital text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-widest w-20 text-center'}>0</span>
                        <span className={isLandscape ? 'font-digital text-[8px] text-cyan-400/70 ml-1' : 'font-digital text-[10px] text-cyan-400/70 ml-1'}>KM/H</span>
                    </div>

                    <div className={isLandscape ? 'bg-black/60 backdrop-blur-md rounded-md p-1 border border-cyan-500/30' : 'bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-cyan-500/30'}>
                        <div className={isLandscape ? 'hidden' : 'flex justify-between text-[9px] text-cyan-400 mb-0.5'}>
                            <span ref={speedBarRangeRef}>600 - 700 KM/H</span>
                            <span>TOP: <span ref={speedBarTopRef}>0</span></span>
                        </div>
                        <div className={isLandscape ? 'flex items-center gap-1' : 'flex items-center gap-1.5'}>
                            {/* Smooth indicator - left side */}
                            <div className={isLandscape ? 'flex flex-col items-center min-w-[24px]' : 'flex flex-col items-center min-w-[32px]'}>
                                <svg viewBox="0 0 40 40" className={isLandscape ? 'w-3 h-3' : 'w-4 h-4'}>
                                    <path d="M5 20 Q12 10 20 20 Q28 30 35 20" stroke="#00BFFF" strokeWidth="4" fill="none" strokeLinecap="round"/>
                                </svg>
                                <span id="smooth-percent" className={isLandscape ? 'text-[6px] font-bold text-sky-400 opacity-30 transition-opacity' : 'text-[8px] font-bold text-sky-400 opacity-30 transition-opacity'}>0%</span>
                            </div>
                            
                            {/* Speed bar */}
                            <div ref={speedBarRef} className={isLandscape ? 'flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative' : 'flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative'}>
                                {/* Current speed fill */}
                                <div ref={speedBarFillRef} className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all" style={{ width: '50%' }} />
                                {/* Top speed needle */}
                                <div ref={speedBarNeedleRef} className="absolute top-0 h-full w-0.5 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" style={{ left: '80%' }} />
                            </div>
                            
                            {/* Wide indicator - right side */}
                            <div className={isLandscape ? 'flex flex-col items-center min-w-[24px]' : 'flex flex-col items-center min-w-[32px]'}>
                                <svg viewBox="0 0 40 40" className={isLandscape ? 'w-3 h-3' : 'w-4 h-4'}>
                                    <path d="M8 20 L16 14 L16 18 L24 18 L24 14 L32 20 L24 26 L24 22 L16 22 L16 26 Z" fill="#C0C0C0"/>
                                </svg>
                                <span id="wide-percent" className={isLandscape ? 'text-[6px] font-bold text-gray-400 opacity-30 transition-opacity' : 'text-[8px] font-bold text-gray-400 opacity-30 transition-opacity'}>0%</span>
                            </div>
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

                    <div className="relative z-10 bg-black/80 p-4 landscape:p-3 rounded-lg border-2 border-cyan-400 text-center text-white shadow-[0_0_30px_rgba(0,242,255,0.4)] max-w-lg w-[95%] max-h-[90vh] overflow-y-auto my-2 backdrop-blur-md">
                        <h1 className="text-2xl landscape:text-xl md:text-4xl font-black text-cyan-400 uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                            Neon Winder
                        </h1>
                        <p className="mb-2 text-gray-300 text-xs landscape:text-[10px]">
                            The tunnel winds aggressively. Maintain velocity.
                            <br/><span className="text-[10px] landscape:text-[9px] text-red-400 mt-1 block">Walls glow RED when you are too close!</span>
                        </p>

                        <div className="mb-3 landscape:mb-2 p-3 landscape:p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-2">Select Difficulty</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStartSpeed(300)}
                                    className={`flex-1 py-2 landscape:py-1.5 px-1 rounded font-black uppercase tracking-wider transition-all text-xs landscape:text-[10px] ${
                                        startSpeed === 300
                                            ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,255,255,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-cyan-400'
                                    }`}
                                >
                                    Cadet
                                </button>
                                <button
                                    onClick={() => setStartSpeed(500)}
                                    className={`flex-1 py-2 landscape:py-1.5 px-1 rounded font-black uppercase tracking-wider transition-all text-xs landscape:text-[10px] ${
                                        startSpeed === 500
                                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-yellow-500'
                                    }`}
                                >
                                    Pilot
                                </button>
                                <button
                                    onClick={() => setStartSpeed(700)}
                                    className={`flex-1 py-2 landscape:py-1.5 px-1 rounded font-black uppercase tracking-wider transition-all text-xs landscape:text-[10px] ${
                                        startSpeed === 700
                                            ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                                            : 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-red-500'
                                    }`}
                                >
                                    Ace
                                </button>
                            </div>
                            <div className="mt-2 text-center">
                                <span className="text-white font-mono text-sm">{startSpeed} <span className="text-[10px] text-gray-400">KM/H</span></span>
                                <span className="text-[9px] text-gray-500 block mt-0.5">
                                    {startSpeed === 300 && '1.0× acceleration'}
                                    {startSpeed === 500 && '1.25× acceleration'}
                                    {startSpeed === 700 && '1.5× acceleration'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onStart(startSpeed, startSpeed === 300 ? "CADET" : startSpeed === 500 ? "PILOT" : "ACE")}
                            className="bg-transparent border-2 border-cyan-400 py-2 landscape:py-1.5 px-6 text-cyan-400 font-black text-base landscape:text-sm uppercase rounded hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,255,1)] transition-all duration-200 mb-3 landscape:mb-2 w-full"
                        >
                            Engage
                        </button>

                        {/* Leaderboard Preview */}
                        <div className="text-left border-t border-gray-700 pt-2">
                            <h3 className="text-cyan-400 uppercase font-bold mb-1 text-center text-[10px]">Top Aces</h3>
                            {leaderboard.length === 0 ? (
                                <p className="text-center text-gray-500 text-[10px]">No records yet.</p>
                            ) : (
                                <table className="w-full text-[10px] text-gray-300">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="py-0.5 text-left">Pilot</th>
                                            <th className="py-0.5 text-center">Rank</th>
                                            <th className="py-0.5 text-right">Speed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.slice(0, 3).map((entry, idx) => (
                                            <tr key={idx} className="border-b border-gray-800 last:border-0">
                                                <td className="py-0.5">{entry.name}</td>
                                                <td className="py-0.5 text-center text-gray-500">{entry.difficulty}</td>
                                                <td className="py-0.5 text-right font-mono text-cyan-400">{Math.floor(entry.score)}</td>
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
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center pointer-events-auto transition-opacity duration-300 overflow-y-auto py-2">
                    <div className="bg-black/80 p-4 landscape:p-3 rounded-lg border-2 border-red-500 text-center text-white shadow-[0_0_30px_rgba(255,56,96,0.4)] max-w-lg w-[95%] max-h-[95vh] overflow-y-auto">
                        <h1 className="text-2xl landscape:text-xl md:text-4xl font-black text-red-500 uppercase tracking-widest mb-1 drop-shadow-[0_0_10px_rgba(255,56,96,0.8)]">
                            Critical Error
                        </h1>
                        <p className="mb-3 landscape:mb-2 text-gray-300 text-xs">Hull breach detected.</p>
                        
                        <div className="flex flex-col mb-4 landscape:mb-2">
                            <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Final Velocity</span>
                            <span className="font-mono text-2xl landscape:text-xl font-bold">{Math.floor(lastScore)} <span className="text-xs align-top">KM/H</span></span>
                        </div>

                        {/* Score Submission */}
                        {!hasSubmitted && lastScore > 0 && (
                            <div className="mb-4 landscape:mb-2 flex gap-2 justify-center">
                                <input 
                                    type="text" 
                                    placeholder="CALLSIGN" 
                                    maxLength={10}
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                                    className="bg-gray-900 border border-gray-600 text-white px-3 py-1.5 rounded text-center text-sm uppercase tracking-widest outline-none focus:border-cyan-400 w-32"
                                />
                                <button 
                                    onClick={handleSubmitScore}
                                    disabled={playerName.length === 0}
                                    className="bg-cyan-900 border border-cyan-400 px-3 py-1.5 rounded text-cyan-400 font-bold text-sm hover:bg-cyan-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    SAVE
                                </button>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => { setHasSubmitted(false); setPlayerName(""); onRestart(); }}
                                className="bg-transparent border-2 border-red-500 py-2 landscape:py-1.5 px-6 text-red-500 font-black text-base landscape:text-sm uppercase rounded hover:bg-red-500 hover:text-black hover:shadow-[0_0_20px_rgba(255,56,96,1)] transition-all duration-200"
                            >
                                Reboot System
                            </button>
                            <button 
                                onClick={() => { setHasSubmitted(false); setPlayerName(""); onHome(); }}
                                className="bg-transparent border border-white/30 py-1.5 landscape:py-1 px-6 text-gray-300 font-bold text-sm landscape:text-xs uppercase rounded hover:bg-white hover:text-black transition-all duration-200"
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
                onClick={onPause}
                className="select-none fixed inset-0 z-50 items-center justify-center bg-black/75 backdrop-blur-sm cursor-pointer"
                style={{ display: 'none', pointerEvents: 'auto' }}
            >
                <div className="px-6 py-5 landscape:px-4 landscape:py-3 min-w-[240px] landscape:min-w-[200px] bg-black/90 border-2 border-cyan-300 rounded-2xl text-cyan-100 font-mono text-center shadow-[0_0_32px_rgba(0,255,255,0.55)] ring-1 ring-cyan-400/40">
                    <div className="text-2xl landscape:text-xl font-black tracking-[0.3em] drop-shadow-[0_0_14px_rgba(0,255,255,0.7)]">PAUSED</div>
                    <div className="text-sm landscape:text-xs mt-2 opacity-85">Tap to continue</div>
                </div>
            </div>
        </div>
    );
};