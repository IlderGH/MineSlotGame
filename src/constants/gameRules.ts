// src/constants/gameRules.ts

import { ToolType, BlockType } from "../types/game";

// Configuración de los Picos
export const TOOLS_CONFIG: Record<ToolType, { uses: number; damage: number }> = {
    wood: { uses: 2, damage: 1 },
    stone: { uses: 3, damage: 2 },
    gold: { uses: 5, damage: 1 }, // El oro es rápido pero rompe poco (ejemplo)
    diamond: { uses: 8, damage: 4 },
    tnt: { uses: 1, damage: 10 }, // La TNT se usa 1 vez y hace mucho daño
};

// Configuración de los Bloques
export const BLOCKS_CONFIG: Record<BlockType, { health: number; value: number }> = {
    dirt: { health: 1, value: 5 },
    stone: { health: 3, value: 10 },
    iron_ore: { health: 5, value: 25 },
    gold_ore: { health: 8, value: 50 },
    diamond_ore: { health: 12, value: 100 },
};

export const GRID_ROWS = 6;
export const GRID_COLS = 5;