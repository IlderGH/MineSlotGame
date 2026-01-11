// src/types/game.ts

export type ToolType = 'wood' | 'stone' | 'gold' | 'diamond' | 'tnt';

export interface Tool {
    id: string; // Identificador único
    type: ToolType;
    uses: number; // Cuántos golpes puede dar
    damagePerHit: number; // Cuánto quita por golpe
}

export type BlockType = 'dirt' | 'stone' | 'iron_ore' | 'gold_ore' | 'diamond_ore';

export interface Block {
    id: string;
    type: BlockType;
    maxHealth: number;
    currentHealth: number;
    isDestroyed: boolean;
    value: number; // Dinero que da al romperse
}

// Representa una celda en la grilla superior (donde caen los picos)
export interface ToolSlot {
    tool: Tool | null; // Puede estar vacía
    plannedPath?: number[];
    startDelay?: number;
}