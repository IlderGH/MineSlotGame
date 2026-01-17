
import { useState, useCallback, useEffect } from 'react';
import { Block, ToolSlot } from '../types/game';
import { createNewBoard, createNewTools, processTurn, applyTntDamage, applyToolDamage, simulateToolPath, generateMultipliers, applySingleHit } from '../utils/gameLogic';
import { TOOL_HIT_DURATION, TOOL_ROWS, GRID_COLS, MAX_SPINS, ENTRANCE_DURATION, PRESENTATION_DURATION } from '../constants/gameRules';

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
    const [accumulatedWin, setAccumulatedWin] = useState(0);
    const [recentWins, setRecentWins] = useState<{ id: string, amount: number, col: number, row: number }[]>([]);

    const [isAnimating, setIsAnimating] = useState(false);

    // Failsafe: Reset animation state if stuck
    useEffect(() => {
        if (isAnimating) {
            const t = setTimeout(() => {
                console.warn("Animation stuck? Forcing reset.");
                setIsAnimating(false);
            }, 20000); // 20s limit
            return () => clearTimeout(t);
        }
    }, [isAnimating]);

    const startGame = useCallback((amount: number, spins: number = MAX_SPINS) => {
        const newGrid = createNewBoard();
        const newMultipliers = generateMultipliers();

        // Scale Block Values based on Bet (Base 0.20)
        const betRatio = amount / 0.20;
        newGrid.forEach(row => {
            row.forEach(block => {
                // Assuming block.value comes from config. If undefined check needed?
                // Blocks created by createNewBoard HAVE values from CONFIG.
                block.value = parseFloat((block.value * betRatio).toFixed(2));
            });
        });

        setGrid(newGrid);
        setMultipliers(newMultipliers);
        setBetAmount(amount);
        setSpinsRemaining(spins);
        setTotalWin(0);
        setAccumulatedWin(0);
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
            const columnTimers = new Array(GRID_COLS).fill(0);
            let globalNonTntMaxTime = 0;
            const pendingTNTs: { r: number; c: number; slot: any }[] = [];

            // FASE 1: Procesar Herramientas Normales (Picos)
            // Esto asegura que todo el minado normal ocurra primero
            for (let col = 0; col < GRID_COLS; col++) {
                const bottomRowIdx = TOOL_ROWS - 1;
                for (let r = bottomRowIdx; r >= 0; r--) {
                    const slot = newToolsRows[r][col];
                    if (slot.tool) {
                        if (slot.tool.type === 'tnt') {
                            pendingTNTs.push({ r, c: col, slot });
                            continue;
                        }

                        // Lógica Normal
                        const path = simulateToolPath(simGrid, col, slot.tool);
                        slot.plannedPath = path;
                        slot.startDelay = columnTimers[col];

                        const hitCount = slot.plannedPath ? slot.plannedPath.length : 0;
                        // Correct timing: Only wait for actual hits. If miss (0), small buffer.
                        const myDuration = (hitCount > 0 ? hitCount : 0.5) * TOOL_HIT_DURATION;

                        const res = applyToolDamage(simGrid, col, slot.tool.damagePerHit, slot.tool.uses);
                        simGrid = res.newGrid;

                        columnTimers[col] += (myDuration + 200); // 200ms gap
                    }
                }
                if (columnTimers[col] > globalNonTntMaxTime) globalNonTntMaxTime = columnTimers[col];
            }

            // FASE 2: Procesar TNT (Finales)
            // Las TNT esperan a que terminen los picos para un efecto dramático final
            // Ordenamos por fila (abajo primero) para consistencia física
            pendingTNTs.sort((a, b) => b.r - a.r);

            pendingTNTs.forEach(({ r, c, slot }) => {
                // La TNT espera a que su columna esté libre Y a que termine la fase global de picos
                const startTime = Math.max(columnTimers[c], globalNonTntMaxTime);

                const path = simulateToolPath(simGrid, c, slot.tool);
                slot.plannedPath = path;
                slot.startDelay = startTime;

                const myDuration = TOOL_HIT_DURATION; // TNT duration (approx logic)

                const res = applyTntDamage(simGrid, c, slot.tool.damagePerHit);
                simGrid = res.newGrid;

                columnTimers[c] = startTime + myDuration + 500; // Extra gap after explosion
                if (columnTimers[c] > maxTotalDuration) maxTotalDuration = columnTimers[c];
            });

            // Actualizar maxTotalDuration con el tiempo final de la fase 1 también
            if (globalNonTntMaxTime > maxTotalDuration) maxTotalDuration = globalNonTntMaxTime;

            setTools(newToolsRows);

            // Programar actualizaciones
            newToolsRows.forEach((row, rowIndex) => {
                row.forEach((slot, colIndex) => {
                    const tool = slot.tool;
                    if (!tool) return;

                    const delay = slot.startDelay || 0;
                    let duration;
                    if (tool.type === 'tnt') {
                        // Si la TNT no rompe nada, solo desvanece rápido (300ms). Si rompe, explosión completa (1200ms).
                        duration = (slot.plannedPath?.length || 0) > 0 ? 1200 : 300;
                    } else {
                        duration = (slot.plannedPath?.length || 0) * TOOL_HIT_DURATION;
                    }
                    // Sync logic update with visual animation start (Entrance + Presentation)
                    // Add extra buffer (800ms) to ensure Visuals (controlled by App.tsx breakDelay) happen FIRST.
                    // This prevents strict Reference Checks from killing the block before the animation hits.
                    // Especially important for TNT (Uses=1).
                    // Base start time for this tool's action sequence
                    const baseTime = delay + 800 + ENTRANCE_DURATION + PRESENTATION_DURATION;

                    if (tool.type === 'tnt') {
                        setTimeout(() => {
                            setGrid(prevGrid => {
                                const { newGrid, moneyEarned, destroyedDetails } = applyTntDamage(prevGrid, colIndex, tool.damagePerHit);
                                if (moneyEarned > 0) {
                                    setAccumulatedWin(prev => parseFloat((prev + moneyEarned).toFixed(2)));
                                    const newWins = destroyedDetails.map(d => ({
                                        id: Math.random().toString(36).substr(2, 9),
                                        amount: d.value,
                                        col: d.c,
                                        row: d.r
                                    }));
                                    setRecentWins(prev => [...prev, ...newWins]);
                                }
                                return newGrid;
                            });
                        }, baseTime + duration);
                    } else {
                        // Granular Updates per Hit (Visual Sync)
                        if (slot.plannedPath && slot.plannedPath.length > 0) {
                            slot.plannedPath.forEach((targetRow, hitIdx) => {
                                // Impact happens at 70% of the swing/bounce
                                const impactTime = baseTime + (hitIdx * TOOL_HIT_DURATION) + (TOOL_HIT_DURATION * 0.7);
                                setTimeout(() => {
                                    setGrid(prevGrid => {
                                        const { newGrid, destroyedValue } = applySingleHit(prevGrid, targetRow, colIndex, tool.damagePerHit);
                                        if (destroyedValue > 0) {
                                            setAccumulatedWin(prev => parseFloat((prev + destroyedValue).toFixed(2)));
                                            setRecentWins(prev => [...prev, {
                                                id: Math.random().toString(36).substr(2, 9),
                                                amount: destroyedValue,
                                                col: colIndex,
                                                row: targetRow
                                            }]);
                                        }
                                        return newGrid;
                                    });
                                }, impactTime);
                            });
                        }
                    }
                });
            });

            // FIN DEL TIRO
            const finalDelay = Math.max(1000, maxTotalDuration + 500 + ENTRANCE_DURATION + PRESENTATION_DURATION);

            setTimeout(() => {
                setIsAnimating(false);
            }, finalDelay);

        } catch (error) {
            console.error("Error in spin logic:", error);
            setIsAnimating(false);
        }

    }, [gameState, isAnimating, spinsRemaining, grid]);

    // Efecto para auto-disparo del primer tiro
    useEffect(() => {
        if (gameState === 'PLAYING' && spinsRemaining > 0 && tools.length === 0 && !isAnimating && grid.length > 0) {
            // Pequeño delay para que se vea la UI antes de arrancar
            const t = setTimeout(() => spin(), 500);
            return () => clearTimeout(t);
        }
    }, [gameState, spinsRemaining, isAnimating, grid, spin, tools.length]);

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

                const win = accumulatedWin * (multiplierSum > 0 ? multiplierSum : 1);
                setTotalWin(parseFloat(win.toFixed(2)));
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
        setAccumulatedWin(0);
        setRecentWins([]);
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
        accumulatedWin,
        recentWins,
    };
};
