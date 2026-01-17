import { BlockType, ToolType } from "../types/game";

// Definimos las probabilidades (debe sumar 100 o aproximado para entenderlo fácil)
const BLOCK_CHANCES: Record<BlockType, number> = {
    dirt: 0.10,       // 40% de probabilidad
    stone: 0.25,      // 30%
    iron_ore: 0.10,  // 15%
    gold_ore: 0.20,   // 10%
    diamond_ore: 0.30, // 5% (Muy raro) -- Reduced to make room for obsidian
    obsidian: 0.05   // Igual que dirt
};

const TOOL_CHANCES: Record<ToolType, number> = {
    wood: 0.02, //0.2,
    stone: 0.25, //0.25,
    gold: 0.1, //0.1,
    diamond: 0.05,//0.05,
    tnt: 0.1,//0.1,
    eye: 0.05,//0.3 // Ocupa espacio para reducir herramientas útiles


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