// src/constants/gameRules.ts

import { ToolType, BlockType } from "../types/game";

export const BET_LEVELS = [0.20, 0.40, 0.80, 1.00, 1.20, 1.40, 1.80, 2.00];

// Pays for 8+ symbols at 0.20 bet
export const PAYTABLE_BASE: Record<string, number> = {
    item_1: 0.08,
    item_2: 0.10,
    item_3: 0.15,
    item_4: 0.20,
    item_5: 0.30,
    item_6: 0.40,
    item_7: 0.55,
};

// Base values for Mining Blocks (at 0.20 bet)
export const BLOCK_VALUES_BASE: Record<BlockType, number> = {
    dirt: 0.15,
    stone: 0.25,
    iron_ore: 0.35,
    gold_ore: 0.30,
    diamond_ore: 0.45,
    obsidian: 1.20,
};

// Configuración de los Picos
export const TOOLS_CONFIG: Record<ToolType, { uses: number; damage: number }> = {
    wood: { uses: 2, damage: 1 },
    stone: { uses: 3, damage: 2 },
    gold: { uses: 5, damage: 1 }, // El oro es rápido pero rompe poco (ejemplo)
    diamond: { uses: 8, damage: 4 },
    tnt: { uses: 1, damage: 10 }, // La TNT se usa 1 vez y hace mucho daño
    eye: { uses: 0, damage: 0 }, // El ojo solo ocupa espacio
};

// Configuración de los Bloques
export const BLOCKS_CONFIG: Record<BlockType, { health: number; value: number }> = {
    dirt: { health: 1, value: 5 },
    stone: { health: 3, value: 10 },
    iron_ore: { health: 5, value: 25 },
    gold_ore: { health: 8, value: 50 },
    diamond_ore: { health: 12, value: 100 },
    obsidian: { health: 24, value: 200 },
};

export const GRID_ROWS = 5;
export const GRID_COLS = 5;

// Duración de la animación de UN golpe (ms)
export const TOOL_HIT_DURATION = 900;
export const ENTRANCE_DURATION = 700;
export const PRESENTATION_DURATION = 800;

export const TOOL_ROWS = 2;
export const MAX_SPINS = 5;