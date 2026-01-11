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
    for (let i = 0; i < GRID_COLS; i++) {
        // Multiplicador aleatorio entre 1 y 10
        multipliers.push(Math.floor(Math.random() * 10) + 1);
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

    if (hitRow !== -1) {
        // TNT afecta a la columna actual y adyacentes
        for (let c = Math.max(0, col - 1); c <= Math.min(GRID_COLS - 1, col + 1); c++) {
            const r = findTopBlockIndex(newGrid, c);
            if (r !== -1) {
                const block = newGrid[r][c];
                block.currentHealth -= damage;
                if (block.currentHealth <= 0) {
                    block.currentHealth = 0;
                    block.isDestroyed = true;
                    moneyEarned += block.value;
                }
            }
        }
    }

    return { newGrid, moneyEarned };
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
