import { Block, Tool, ToolSlot } from "../types/game";
import { BLOCKS_CONFIG, TOOLS_CONFIG, GRID_ROWS, GRID_COLS } from "../constants/gameRules";
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

export const createNewTools = (): ToolSlot[] => {
    const tools: ToolSlot[] = [];

    for (let col = 0; col < GRID_COLS; col++) {
        // 30% de probabilidad de que una casilla de herramienta esté vacía
        if (Math.random() < 0.3) {
            tools.push({ tool: null });
            continue;
        }

        const type = generateRandomToolType();
        const config = TOOLS_CONFIG[type];

        tools.push({
            tool: {
                id: generateId(),
                type: type,
                uses: config.uses,
                damagePerHit: config.damage,
            }
        });
    }
    return tools;
};

//definemos que devuelve nuestra funcion

interface TurnResult {
    newGrid: Block[][];
    moneyEarned: number;
}

export const processTurn = (currentGrid: Block[][], tools: ToolSlot[]): TurnResult => {
    const newGrid: Block[][] = JSON.parse(JSON.stringify(currentGrid));
    let totalMoney = 0;

    for (let col = 0; col < GRID_COLS; col++) {
        const toolSlot = tools[col];

        // Si no hay herramienta en esta columna, pasamos a la siguiente
        if (!toolSlot.tool) {
            continue;
        }

        const tool = toolSlot.tool;

        // --- LÓGICA TNT ---

        if (tool.type === 'tnt') {
            // La TNT daña al primer bloque de su columna Y a los vecinos (Izquierda y Derecha)
            const affectedCols = [col - 1, col, col + 1];

            affectedCols.forEach((targetCol) => {
                //verificamos que la columna exista
                if (targetCol >= 0 && targetCol < GRID_COLS) {
                    const targetRow = findTopBlockIndex(newGrid, targetCol);
                    if (targetRow !== -1) {
                        const block = newGrid[targetRow][targetCol];
                        //La TNT hace mucho daño
                        const damege = tool.damagePerHit;
                        //aplicamos el daño
                        block.currentHealth -= damege;
                        if (block.currentHealth <= 0) {
                            block.currentHealth = 0;
                            block.isDestroyed = true;
                            totalMoney += block.value;
                        }
                    }
                }
            });
        } else {
            let remainingUses = tool.uses;

            // Mientras el pico tenga filo (usos), sigue golpeando hacia abajo
            while (remainingUses > 0) {
                // Buscamos el bloque más alto disponible en esta columna
                const rowIndex = findTopBlockIndex(newGrid, col);

                // Si no quedan bloques en esta columna, el pico se detiene
                if (rowIndex === -1) break;

                const block = newGrid[rowIndex][col];

                // Calculamos cuánto daño haremos en este golpe
                // (No podemos hacer más daño que la vida que le queda al bloque)
                const damageDealt = tool.damagePerHit;

                block.currentHealth -= damageDealt;
                remainingUses--; // Gastamos un uso

                // Verificamos si se rompió
                if (block.currentHealth <= 0) {
                    block.currentHealth = 0;
                    block.isDestroyed = true;
                    totalMoney += block.value;
                    // Al romperse, el bucle 'while' continuará y el siguiente golpe
                    // le dará al bloque de abajo (rowIndex + 1) en la siguiente iteración
                }
            }
        }
    }

    return { newGrid, moneyEarned: totalMoney };
};

// Función auxiliar para encontrar el primer bloque NO destruido de una columna (desde arriba)
const findTopBlockIndex = (grid: Block[][], colIndex: number): number => {
    for (let row = 0; row < GRID_ROWS; row++) {
        if (!grid[row][colIndex].isDestroyed) {
            return row; // Encontramos el primero vivo
        }
    }
    return -1; // No quedan bloques en esta columna
};
