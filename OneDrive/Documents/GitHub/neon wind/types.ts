export enum GameState {
    SPLASH,
    MENU,
    PLAYING,
    GAME_OVER
}

export enum RingType {
    HEAL = 'HEAL',       // Yellow - heal HP
    SMOOTH = 'SMOOTH',   // Blue - reduce turn aggression (permanent, decays)
    WIDE = 'WIDE',       // Silver - increase tunnel width (permanent, decays)
    SHIELD = 'SHIELD',   // Green - invulnerability
}

export enum BuffType {
    SHIELD = 'SHIELD',   // Only time-based buff remaining
}

export interface ActiveBuff {
    type: BuffType;
    remainingTime: number;  // ms remaining
    totalDuration: number;  // original duration for fade calculation
    isFading: boolean;      // true when in fade-out period
}

export interface MapPoint {
    x: number;
    y: number;
}

export interface LeaderboardEntry {
    name: string;
    score: number;
    difficulty: string;
    date: number;
}
