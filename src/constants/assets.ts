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

export const BLOCK_IMAGES_3D: Record<BlockType, any> = {
    dirt: require("../assets/blocks/3d_dirt.png"),
    stone: require("../assets/blocks/3d_stone.png"),
    iron_ore: require("../assets/blocks/3d_iron.png"),
    gold_ore: require("../assets/blocks/3d_oro.png"),
    diamond_ore: require("../assets/blocks/3d_diamond.png"),
    obsidian: require("../assets/blocks/3d_obsidian.png"),
};

export const IMAGES_EXTRAS = {
    scatters: require("../assets/scatters.png"),

}

export const SLOT_IMAGES: Record<string, any> = {
    item_1: require("../assets/items/huevo.png"),
    item_2: require("../assets/items/hueso.png"),
    item_3: require("../assets/items/oro.png"),
    item_4: require("../assets/items/campana.png"),
    item_5: require("../assets/items/pollo.png"),
    item_6: require("../assets/items/esmeralda.png"),
    item_7: require("../assets/items/diamante.png"),
    item_8: require('../assets/items/zanahoria.png'),
    item_9: require('../assets/items/manzana.png'),
    scatter: require("../assets/items/Totem.png"),
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

export const SOUNDS = {
    background: require("../assets/sounds/ambiente_4.mp3"),
    egg_crack: require("../assets/sounds/egg_cracking.mp3"),
    win_items: require("../assets/sounds/win_items.mp3"),
    game_start: require("../assets/sounds/game_star.mp3"),
    win_bonus: require("../assets/sounds/win_bonus.mp3"),
};