/**
 * NEON WINDER - Game Constants
 * All tunable game parameters in one place for easy balancing
 */

// ============================================================================
// DIFFICULTY SETTINGS
// ============================================================================

export const DIFFICULTY_SETTINGS = {
    CADET: {
        label: 'Cadet',
        startSpeed: 3.0,           // 300 km/h
        accelerationMultiplier: 1.0,
    },
    PILOT: {
        label: 'Pilot',
        startSpeed: 5.0,           // 500 km/h
        accelerationMultiplier: 1.5,
    },
    ACE: {
        label: 'Ace',
        startSpeed: 7.0,           // 700 km/h
        accelerationMultiplier: 2,
    }
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_SETTINGS;

// ============================================================================
// SPEED & ACCELERATION
// ============================================================================

export const SPEED_SETTINGS = {
    baseAcceleration: 0.0005,      // Base speed increase per frame
    collisionSpeedLoss: 0.004,     // Speed reduction on wall contact per frame
    speedFloorEnabled: true,       // Prevent dropping below current 100km/h range
} as const;

// ============================================================================
// TUNNEL PARAMETERS
// ============================================================================

export const TUNNEL_SETTINGS = {
    baseWidth: 1.5,                // Base tunnel width multiplier
    widthIncreasePerLevel: 0.12,   // Width bonus per speed level (100 km/h)
    turnAggression: 0.5,           // How sharp turns are (0.0 - 1.0)
    narrowingFactor: 0.35,         // Max narrowing percentage (35%)
    narrowingFrequency: 0.15,      // Chance of narrow section per segment
    tubeRadius: 100,               // Visual tube radius
    tubeLength: 12000,             // Tube render distance
    tubeSegments: 300,             // Number of tube segments
} as const;

// ============================================================================
// RING SPAWN SETTINGS
// ============================================================================

export const RING_SPAWN_SETTINGS = {
    baseSpawnRate: 60,             // Frames between spawn attempts (lower = more rings)
    spawnChance: 0.03,             // 3% chance per spawn attempt
} as const;

// ============================================================================
// RING TYPE PROBABILITIES (Tiered Rarity System)
// Must sum to 1.0
// ============================================================================

export const RING_PROBABILITIES = {
    // Common (55%) - Yellow heals HP
    HEAL: 0.55,
    
    // Uncommon (20% each = 40%)
    SMOOTH: 0.20,        // Blue - reduce turn aggression (permanent, decays)
    WIDE: 0.20,          // Silver - increase tunnel width (permanent, decays)
    
    // Rare (5%)
    SHIELD: 0.05,        // Green - invulnerability
} as const;

// Ring colors for rendering
export const RING_COLORS = {
    HEAL: 0xFFD700,      // Yellow/Gold
    SMOOTH: 0x00BFFF,    // Blue
    WIDE: 0xC0C0C0,      // Silver/White
    SHIELD: 0x00FF00,    // Green
} as const;

// ============================================================================
// RING EFFECTS
// ============================================================================

export const RING_EFFECTS = {
    HEAL: {
        amount: 20,                // HP healed
    },
    SMOOTH: {
        // Permanent additive improvement that decays back to base
        reductionAmount: 0.15,     // How much to reduce turn aggression per ring
        decayRate: 0.0005,         // How fast it decays back to base per frame
        maxReduction: 0.4,         // Max total reduction (can't go below 0.1 aggression)
    },
    WIDE: {
        // Permanent additive improvement that decays back to level base
        widthBoost: 15,            // Tunnel width bonus per ring
        decayRate: 0.03,           // How fast it decays back to level base per frame
        maxBoost: 60,              // Max total width boost
    },
    SHIELD: {
        duration: 5000,            // 5 seconds
    },
} as const;

// ============================================================================
// HEALTH SETTINGS
// ============================================================================

export const HEALTH_SETTINGS = {
    initialHealth: 200,            // Starting health (fully filled)
    initialMaxHealth: 200,         // Starting max health (bar width)
    expandedMaxHealth: 400,        // Max health after expansion (level 1 cap)
    levelMaxHealth: 400,           // Max health for levels 2+ (bar stays 400)
    healAmount: 20,                // HP per yellow ring
    collisionDamage: 1.5,          // Damage per frame touching wall
    maxHealthReductionRatio: 0.75, // Max health reduction on damage (75%)
} as const;

// ============================================================================
// UI SETTINGS
// ============================================================================

export const UI_SETTINGS = {
    speedBarRangeSize: 100,        // km/h per speed bar range
    healthBarInitialWidth: 140,    // Initial health bar width (200 HP)
    healthBarExpandedWidth: 280,   // Expanded health bar width (400 HP)
} as const;

// ============================================================================
// SCORE SETTINGS
// ============================================================================

export const SCORE_SETTINGS = {
    ringBaseScore: 10,             // Points per ring collected
    speedMultiplier: 100,          // Convert internal speed to km/h
} as const;
