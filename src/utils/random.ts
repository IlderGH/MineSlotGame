import { BlockType, ToolType } from "../types/game";

// Definimos las probabilidades (debe sumar 100 o aproximado para entenderlo fácil)
const BLOCK_CHANCES: Record<BlockType, number> = {
    dirt: 0.10,       // 40% de probabilidad
    stone: 0.20,      // 30%
    iron_ore: 0.10,  // 15%
    gold_ore: 0.20,   // 10%
    diamond_ore: 0.40 // 5% (Muy raro)
};

const TOOL_CHANCES: Record<ToolType, number> = {
    wood: 0.4,
    stone: 0.3,
    gold: 0.15,
    diamond: 0.05,
    tnt: 0.1
};

// Función genérica para elegir algo basado en pesos
function getRandomItem<T extends string>(chances: Record<T, number>): T {
    const rand = Math.random();
    let cumulative = 0;

    // Recorremos las opciones y sumamos sus probabilidades
    for (const item in chances) {
        cumulative += chances[item];
        if (rand < cumulative) {
            return item as T;
        }
    }

    // Fallback por seguridad (devuelve el último elemento)
    return Object.keys(chances).pop() as T;
}

export const generateRandomBlockType = () => getRandomItem(BLOCK_CHANCES);
export const generateRandomToolType = () => getRandomItem(TOOL_CHANCES);