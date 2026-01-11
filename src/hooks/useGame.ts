
import { useState, useCallback, useEffect } from 'react';
import { Block, ToolSlot } from '../types/game';
import { createNewBoard, createNewTools, processTurn, applyTntDamage, applyToolDamage, simulateToolPath, generateMultipliers } from '../utils/gameLogic';
import { TOOL_HIT_DURATION, TOOL_ROWS, GRID_COLS, MAX_SPINS } from '../constants/gameRules';

export type GameState = 'BETTING' | 'PLAYING' | 'FINISHED';

export const useGame = () => {
    // Estado del Juego
    const [gameState, setGameState] = useState<GameState>('BETTING');
    const [grid, setGrid] = useState<Block[][]>([]);
    const [tools, setTools] = useState<ToolSlot[][]>([]);
    const [multipliers, setMultipliers] = useState<number[]>([]);

    // Economía y Progreso
    const [betAmount, setBetAmount] = useState(0);
    const [spinsRemaining, setSpinsRemaining] = useState(0);
    const [totalWin, setTotalWin] = useState(0);

    const [isAnimating, setIsAnimating] = useState(false);

    const startGame = useCallback((amount: number) => {
        const newGrid = createNewBoard();
        const newMultipliers = generateMultipliers();

        setGrid(newGrid);
        setMultipliers(newMultipliers);
        setBetAmount(amount);
        setSpinsRemaining(MAX_SPINS);
        setTotalWin(0);
        setTools([]);

        setGameState('PLAYING');
        // El primer tiro se dispara automáticamente por el useEffect abajo
    }, []);

    const finishGame = useCallback(() => {
        // Calcular Ganancias
        // Sumar multiplicadores de columnas vacías
        let totalMult = 0;

        // Necesitamos ver el grid ACTUAL. 
        // Como finishGame se llama desde dentro de la lógica de spin (que tiene acceso al grid actualizado) o state...
        // Aquí usamos el estado 'grid'. Ojo: si se llama justo después de setGrid, 'grid' puede ser viejo.
        // Mejor calcular esto al momento de detectar el final.
        // Pero para simplificar, lo haremos en el render o aquí si confiamos en el render cycle.

        // Haremos el cálculo usando una función helper que reciba el grid
        setGameState('FINISHED');
    }, []);

    const spin = useCallback(() => {
        if (gameState !== 'PLAYING' || isAnimating || spinsRemaining <= 0) return;

        setIsAnimating(true);
        // Decrementamos al inicio o al final? Al inicio visualmente.
        setSpinsRemaining(prev => prev - 1);

        try {
            let newToolsRows = createNewTools();
            let simGrid = JSON.parse(JSON.stringify(grid));
            let maxTotalDuration = 0;

            // ... (Lógica de simulación idéntica a la anterior) ...
            for (let col = 0; col < GRID_COLS; col++) {
                let currentColumnTime = 0;
                const bottomRowIdx = TOOL_ROWS - 1;

                for (let r = bottomRowIdx; r >= 0; r--) {
                    const slot = newToolsRows[r][col];
                    if (slot.tool) {
                        const path = simulateToolPath(simGrid, col, slot.tool);
                        slot.plannedPath = path;
                        if (!slot.startDelay) slot.startDelay = 0;
                        slot.startDelay = currentColumnTime;

                        const uses = slot.tool.type === 'tnt' ? 1 : slot.tool.uses;
                        const myDuration = (uses * TOOL_HIT_DURATION);

                        if (slot.tool.type === 'tnt') {
                            const res = applyTntDamage(simGrid, col, slot.tool.damagePerHit);
                            simGrid = res.newGrid;
                        } else {
                            const res = applyToolDamage(simGrid, col, slot.tool.damagePerHit, slot.tool.uses);
                            simGrid = res.newGrid;
                        }
                        currentColumnTime += (myDuration + 200);
                    }
                }
                if (currentColumnTime > maxTotalDuration) maxTotalDuration = currentColumnTime;
            }

            setTools(newToolsRows);

            // Programar actualizaciones
            newToolsRows.forEach((row, rowIndex) => {
                row.forEach((slot, colIndex) => {
                    const tool = slot.tool;
                    if (!tool) return;

                    const delay = slot.startDelay || 0;
                    const uses = tool.type === 'tnt' ? 1 : tool.uses;
                    const duration = uses * TOOL_HIT_DURATION;
                    const updateTime = delay + duration + 100;

                    setTimeout(() => {
                        setGrid(prevGrid => {
                            let result;
                            if (tool.type === 'tnt') {
                                result = applyTntDamage(prevGrid, colIndex, tool.damagePerHit);
                            } else {
                                result = applyToolDamage(prevGrid, colIndex, tool.damagePerHit, tool.uses);
                            }
                            // NOTA: Ya no sumamos dinero aquí.
                            return result.newGrid;
                        });
                    }, updateTime);
                });
            });

            // FIN DEL TIRO
            setTimeout(() => {
                setIsAnimating(false);

                // Chequear fin de juego
                // Usamos 'simGrid' que es la predicción final de este turno?
                // O mejor, verificamos el estado en el siguiente render?
                // El problema es que spinsRemaining es clousure. 
                // Usamos functional update check?

                // Lo más seguro: Un useEffect que monitoree spinsRemaining y isAnimating.
                // Si spinsRemaining == 0 y !isAnimating -> FINISH.

            }, Math.max(1000, maxTotalDuration + 500));

        } catch (error) {
            console.error("Error in spin logic:", error);
            setIsAnimating(false);
        }

    }, [gameState, isAnimating, spinsRemaining, grid]);

    // Efecto para auto-disparo del primer tiro
    useEffect(() => {
        if (gameState === 'PLAYING' && spinsRemaining === MAX_SPINS && !isAnimating && grid.length > 0) {
            // Pequeño delay para que se vea la UI antes de arrancar
            const t = setTimeout(() => spin(), 500);
            return () => clearTimeout(t);
        }
    }, [gameState, spinsRemaining, isAnimating, grid, spin]);

    // Efecto para detectar Fin de Juego (Tiros agotados o Grid vacío)
    useEffect(() => {
        if (gameState === 'PLAYING' && !isAnimating) {
            const isGridEmpty = grid.length > 0 && grid.every(row => row.every(b => b.isDestroyed));

            if (spinsRemaining === 0 || isGridEmpty) {
                // Calcular victoria
                let multiplierSum = 0;
                if (grid.length > 0) {
                    for (let col = 0; col < GRID_COLS; col++) {
                        // Check if column is empty
                        let empty = true;
                        for (let row = 0; row < grid.length; row++) {
                            if (!grid[row][col].isDestroyed) {
                                empty = false;
                                break;
                            }
                        }
                        if (empty) {
                            multiplierSum += multipliers[col];
                        }
                    }
                }

                const win = betAmount * multiplierSum;
                setTotalWin(win);
                setGameState('FINISHED');
            }
        }
    }, [spinsRemaining, isAnimating, gameState, grid, betAmount, multipliers]);

    const resetGame = useCallback(() => {
        setGameState('BETTING');
        setGrid([]);
        setTools([]);
        setMultipliers([]);
        setBetAmount(0);
        setSpinsRemaining(0);
        setTotalWin(0);
        setIsAnimating(false);
    }, []);

    return {
        grid,
        tools,
        multipliers,
        betAmount,
        spinsRemaining,
        totalWin,
        gameState,
        startGame,
        resetGame,
        spin, // Exponemos spin por si acaso (ej. botón debug), pero el juego es auto? No, el usuario da click a spin en los siguientes 14 tiros.
        // Espera, el usuario dijo "el juego empezara cargando el primer tiro".
        // ¿Los siguientes 14 son manuales? Asumo que sí, es una "Slot".
        isAnimating,
    };
};
