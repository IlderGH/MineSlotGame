import { Block, Tool, ToolSlot } from "../types/game";
import { BLOCKS_CONFIG, TOOLS_CONFIG, GRID_ROWS, GRID_COLS, TOOL_ROWS } from "../constants/gameRules";
import { generateRandomBlockType, generateRandomToolType } from "./random";

// Generar un ID único (UUID simple para este caso)
const generateId = () => Math.random().toString(36).substr(2, 9);

export const createNewBoard = (): Block[][] => {
    const grid: Block[][] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
        const rowData: Block[] = [];
        for (let col = 0; col < GRID_COLS; col++) {
            const type = generateRandomBlockType();
            const config = BLOCKS_CONFIG[type];

            rowData.push({
                id: generateId(),
                type: type,
                maxHealth: config.health,
                currentHealth: config.health,
                value: config.value,
                isDestroyed: false,
            });
        }
        grid.push(rowData);
    }
    return grid;
};

export const createNewTools = (): ToolSlot[][] => {
    const tools: ToolSlot[][] = [];

    for (let row = 0; row < TOOL_ROWS; row++) {
        const rowTools: ToolSlot[] = [];
        for (let col = 0; col < GRID_COLS; col++) {
            // 50% de probabilidad de que una casilla de herramienta esté vacía (Dificultad aumentada)
            if (Math.random() < 0.5) {
                rowTools.push({ tool: null });
                continue;
            }

            const type = generateRandomToolType();
            const config = TOOLS_CONFIG[type];

            rowTools.push({
                tool: {
                    id: generateId(),
                    type: type,
                    uses: config.uses,
                    damagePerHit: config.damage,
                }
            });
        }
        tools.push(rowTools);
    }
    return tools;
};

export const generateMultipliers = (): number[] => {
    const multipliers: number[] = [];
    // Pesos para los multiplicadores (Indice + 1 = Multiplicador)
    // 1-5: Comunes (Total ~88%)
    // 6-10: Raros (Total ~12%)
    const weights = [30, 25, 15, 10, 8, 5, 3, 2, 1, 1]; // Suma 100

    // Función helper para seleccionar basado en pesos
    const getWeightedRandom = () => {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                return i + 1; // Retorna 1-10
            }
            random -= weights[i];
        }
        return 1; // Fallback
    };

    for (let i = 0; i < GRID_COLS; i++) {
        multipliers.push(getWeightedRandom());
    }
    return multipliers;
};

//definemos que devuelve nuestra funcion

interface TurnResult {
    newGrid: Block[][];
    moneyEarned: number;
}

// Función auxiliar para encontrar el primer bloque NO destruido de una columna (desde arriba)
export const findTopBlockIndex = (grid: Block[][], colIndex: number): number => {
    for (let row = 0; row < GRID_ROWS; row++) {
        if (!grid[row][colIndex].isDestroyed) {
            return row; // Encontramos el primero vivo
        }
    }
    return -1; // No quedan bloques en esta columna
};

export const simulateToolPath = (currentGrid: Block[][], col: number, tool: { uses: number; damagePerHit: number; type: string }): number[] => {
    // Si es TNT, solo golpea una vez en la posición actual
    if (tool.type === 'tnt') {
        const topRow = findTopBlockIndex(currentGrid, col);
        return topRow === -1 ? [] : [topRow];
    }

    const simGrid = JSON.parse(JSON.stringify(currentGrid));
    const path: number[] = [];
    let remainingUses = tool.uses;

    while (remainingUses > 0) {
        let rowIndex = findTopBlockIndex(simGrid, col);

        // Si no quedan bloques, dejamos de simular golpes al aire
        if (rowIndex === -1) break;

        path.push(rowIndex);

        // Simular daño para actualizar el grid y encontrar el siguiente bloque
        const block = simGrid[rowIndex][col];
        block.currentHealth -= tool.damagePerHit;

        if (block.currentHealth <= 0) {
            block.currentHealth = 0;
            block.isDestroyed = true;
        }

        remainingUses--;
    }

    return path;
};



// --- LÓGICA GRANULAR ---

export const applyTntDamage = (currentGrid: Block[][], col: number, damage: number) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    const hitRow = findTopBlockIndex(newGrid, col);
    let moneyEarned = 0;
    const destroyedDetails: { r: number, c: number, value: number }[] = [];

    if (hitRow !== -1) {
        // TNT afecta a la columna actual y adyacentes
        for (let c = Math.max(0, col - 1); c <= Math.min(GRID_COLS - 1, col + 1); c++) {
            const r = findTopBlockIndex(newGrid, c);
            if (r !== -1) {
                // Check vertical proximity. Only hit if the block is within 1 row of the TNT center.
                // This prevents TNT from destroying blocks at the bottom of a deep adjacent column 
                // when the TNT is high up (or vice versa).
                if (Math.abs(r - hitRow) <= 1) {
                    const block = newGrid[r][c];
                    block.currentHealth -= damage;
                    if (block.currentHealth <= 0) {
                        block.currentHealth = 0;
                        block.isDestroyed = true;
                        moneyEarned += block.value;
                        destroyedDetails.push({ r, c, value: block.value });
                    }
                }
            }
        }
    }

    return { newGrid, moneyEarned, destroyedDetails };
};

export const applyToolDamage = (currentGrid: Block[][], col: number, damagePerHit: number, totalUses: number) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    let uses = totalUses;
    let moneyEarned = 0;

    while (uses > 0) {
        const hitRow = findTopBlockIndex(newGrid, col);
        if (hitRow === -1) break; // No more blocks

        const block = newGrid[hitRow][col];
        block.currentHealth -= damagePerHit;

        if (block.currentHealth <= 0) {
            block.currentHealth = 0;
            block.isDestroyed = true;
            moneyEarned += block.value;
            // Next hit will target the block below in the next iteration of while
        }
        uses--;
    }

    return { newGrid, moneyEarned };
};

export const applySingleHit = (currentGrid: Block[][], rowIndex: number, colIndex: number, damage: number) => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    let destroyedValue = 0;

    if (newGrid[rowIndex] && newGrid[rowIndex][colIndex]) {
        const block = newGrid[rowIndex][colIndex];
        // Only apply damage if not already destroyed
        if (!block.isDestroyed) {
            block.currentHealth -= damage;
            if (block.currentHealth < 0) block.currentHealth = 0;
            if (block.currentHealth === 0) {
                block.isDestroyed = true;
                destroyedValue = block.value;
            }
        }
    }
    return { newGrid, destroyedValue };
};

export const processTurn = (currentGrid: Block[][], tools: ToolSlot[]): TurnResult => {
    let newGrid = JSON.parse(JSON.stringify(currentGrid));
    let totalMoney = 0;

    for (let col = 0; col < GRID_COLS; col++) {
        const toolSlot = tools[col];
        const tool = toolSlot.tool;
        if (!tool) continue;

        let result;
        if (tool.type === 'tnt') {
            result = applyTntDamage(newGrid, col, tool.damagePerHit);
        } else {
            result = applyToolDamage(newGrid, col, tool.damagePerHit, tool.uses);
        }

        newGrid = result.newGrid;
        totalMoney += result.moneyEarned;
    }

    return { newGrid, moneyEarned: totalMoney };
};
