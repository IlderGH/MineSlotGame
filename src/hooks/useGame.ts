import { useState, useCallback, useEffect } from 'react';
import { Block, ToolSlot } from '../types/game';
import { createNewBoard, createNewTools, processTurn } from '../utils/gameLogic';

export const useGame = () => {
    const [grid, setGrid] = useState<Block[][]>([]);
    const [tools, setTools] = useState<ToolSlot[]>([]);
    const [money, setMoney] = useState(0);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    // Inicializar el juego (Crear bloques)
    // Esta función se puede llamar al principio o cuando quieras reiniciar el nivel
    const initGame = useCallback(() => {
        const newGrid = createNewBoard();
        setGrid(newGrid);
        setTools([]); // Al inicio no hay herramientas, o podrías dar unas gratis
        setMoney(0);
        setIsGameStarted(true);
    }, []);

    // Efecto: Iniciar el juego automáticamente al cargar el componente
    useEffect(() => {
        initGame();
    }, [initGame]);

    const spin = useCallback(() => {
        if (!isGameStarted || isAnimating) return; // Evita doble click

        setIsAnimating(true);

        // 1. Generar nuevas herramientas
        const newTools = createNewTools();
        setTools(newTools);

        // 2. Procesar el turno (Calcular daños y dinero)
        // Pasamos 'grid' (estado actual) y 'newTools' (las que acaban de salir)
        const { newGrid, moneyEarned } = processTurn(grid, newTools);

        // 3. Actualizar estados
        // IMPORTANTE: Aquí se actualiza todo "de golpe".
        setTimeout(() => {
            setGrid(newGrid);
            setMoney(prev => prev + moneyEarned);
            setIsAnimating(false); // Desbloqueamos el botón
        }, 1000);

    }, [isGameStarted, grid]); // <--- Agregamos 'grid' a las dependencias porque lo usamos dentro

    return {
        grid,
        tools,
        money,
        spin,
        isAnimating // Exportamos esto por si quieres deshabilitar el botón visualmente
    };


};