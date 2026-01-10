// src/constants/assets.ts
import { BlockType, ToolType } from "../types/game";

// Mapeamos el "Tipo de Bloque" (nuestro ID lógico) a la "Imagen Real" (el archivo)
export const BLOCK_IMAGES: Record<BlockType, any> = {
    dirt: require("../assets/blocks/dirt.png"),
    stone: require("../assets/blocks/stone.png"),
    iron_ore: require("../assets/blocks/iron.png"), // Asegúrate que coincida con tus nombres de archivo
    gold_ore: require("../assets/blocks/oro.png"),
    diamond_ore: require("../assets/blocks/diamond.png"),
};

export const TOOL_IMAGES: Record<ToolType, any> = {
    wood: require("../assets/tools/pico_madera.png"),
    stone: require("../assets/tools/pico_hierro.png"),
    gold: require("../assets/tools/pico_oro.png"),
    diamond: require("../assets/tools/pico_diamante.png"),
    tnt: require("../assets/tools/TNT.png"),
};

export const CRACK_IMAGES = {
    state1: require("../assets/Quiebre_estado_1.png"), // Grieta leve
    state2: require("../assets/Quiebre_estado_2.png"), // Grieta severa
};