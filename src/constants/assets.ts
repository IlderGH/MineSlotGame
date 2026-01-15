// src/constants/assets.ts
import { BlockType, ToolType } from "../types/game";

// Mapeamos el "Tipo de Bloque" (nuestro ID lógico) a la "Imagen Real" (el archivo)
export const BLOCK_IMAGES: Record<BlockType, any> = {
    dirt: require("../assets/blocks/dirt.png"),
    stone: require("../assets/blocks/stone.png"),
    iron_ore: require("../assets/blocks/iron.png"), // Asegúrate que coincida con tus nombres de archivo
    gold_ore: require("../assets/blocks/oro.png"),
    diamond_ore: require("../assets/blocks/diamond.png"),
    obsidian: require("../assets/blocks/obsidian.png"),
};

export const SLOT_IMAGES: Record<string, any> = {
    item_1: require("../assets/items/huevo.png"),
    item_2: require("../assets/items/hueso.png"),
    item_3: require("../assets/items/oro.png"),
    item_4: require("../assets/items/campana.png"),
    item_5: require("../assets/items/pollo.png"),
    item_6: require("../assets/items/esmeralda.png"),
    item_7: require("../assets/items/diamante.png"),
    scatter: require("../assets/items/manzana.png"),
    egg: require("../assets/items/huevo.png"),
};

export const TOOL_IMAGES: Record<ToolType, any> = {
    wood: require("../assets/tools/pico_madera.png"),
    stone: require("../assets/tools/pico_hierro.png"),
    gold: require("../assets/tools/pico_oro.png"),
    diamond: require("../assets/tools/pico_diamante.png"),
    tnt: require("../assets/tools/TNT.png"),
    eye: require("../assets/tools/ojo.png"),
};

export const CRACK_IMAGES = {
    state1: require("../assets/Quiebre_estado_1.png"), // Grieta leve
    state2: require("../assets/Quiebre_estado_2.png"), // Grieta severa
};