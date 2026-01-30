import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Modal, SafeAreaView, ImageBackground, ScrollView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolateColor, FadeOut, LinearTransition, ZoomOut } from 'react-native-reanimated';
import { useSound } from '../context/SoundContext'; // Optional if needed

import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import VolumeControl from '../components/VolumeControl';
import { SLOT_IMAGES } from '../constants/assets';
import { BET_LEVELS, PAYTABLE_BASE, GRID_ROWS as MINING_ROWS } from '../constants/gameRules';
import { SlotSymbol } from '../components/SlotSymbol';
import CustomAlert from '../components/CustomAlert';
import { useCredits } from '../hooks/useCredits'; // Hook Persistencia

// Config specific to this screen
const SLOT_ROWS = 5;
const SLOT_COLS = 6;
const SYMBOLS = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5', 'item_7', 'item_8', 'item_9', 'scatter'];
// Total Weight: ~300. 
// Esto define el "RTP" (Retorno al Jugador) y la "Volatilidad".
const SYMBOL_WEIGHTS: Record<string, number> = {
    'item_1': 65,  // Bajamos de 80 a 65
    'item_2': 55,
    'item_3': 45,
    'item_4': 40,
    'item_5': 35,
    // 'item_6': 25, // ELIMINADO
    'item_7': 15,
    'item_8': 10,  // Raro
    'item_9': 5,   // Muy raro (Premium)
    'scatter': 1.8 // Ajuste fino para el bonus
};

interface SlotCell {
    id: string;
    symbol: string;
    isWinning: boolean;
    isExploding?: boolean; // Para trigger de animación de salida manual
    delay?: number; // Para el efecto escalonado (stagger) de las animaciones de entrada
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getWeightedSymbol = (counts: Record<string, number>) => {
    let pool = Object.keys(SYMBOL_WEIGHTS);

    // Solo limitamos el Scatter para no romper el juego con demasiados bonos
    pool = pool.filter(k => {
        if (k === 'scatter') {
            const current = counts[k] || 0;
            return current < 5; // Máximo 5 scatters visuales
        }
        return true; // ¡SIN LÍMITE para el resto!
    });

    // Algoritmo de selección ponderada estándar
    let totalWeight = 0;
    pool.forEach(k => totalWeight += SYMBOL_WEIGHTS[k]);

    let random = Math.random() * totalWeight;
    for (const key of pool) {
        random -= SYMBOL_WEIGHTS[key];
        if (random <= 0) return key;
    }
    return pool[0];
};

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / SLOT_COLS;

const WinningCell = ({ children, isWinning, isExploding, width, height }: { children: React.ReactNode, isWinning: boolean, isExploding?: boolean, width: number, height: number }) => {
    // Shared value for animation (0 to 1)
    const anim = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (isExploding) {
            // EXPLODE: Scale Up & Fade Out
            scale.value = withTiming(1.5, { duration: 500 });
            opacity.value = withTiming(0, { duration: 500 });
        } else if (isWinning) {
            // WIN: Pulse (Reset scale/opacity just in case)
            scale.value = withTiming(1);
            opacity.value = withTiming(1);
            anim.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 400 }),
                    withTiming(0, { duration: 400 })
                ),
                -1, // Infinite repeat
                true // Revert (yoyo)
            );
        } else {
            // RESET
            anim.value = withTiming(0);
            scale.value = withTiming(1);
            opacity.value = withTiming(1);
        }
    }, [isWinning, isExploding]);

    const animatedStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            anim.value,
            [0, 1],
            ['rgba(0,0,0,0)', '#FFD700'] // From transparent to GOLD
        );
        const backgroundColor = interpolateColor(
            anim.value,
            [0, 1],
            ['rgba(0,0,0,0)', 'rgba(255, 215, 0, 0.4)'] // From transparent to Glowing Gold
        );

        return {
            borderColor,
            backgroundColor,
            borderWidth: isWinning ? 2 : 0, // Force border when winning
            transform: [{ scale: scale.value }],
            opacity: opacity.value
        };
    });

    return (
        <Animated.View style={[styles.cell, { width, height }, animatedStyle]}>
            {children}
        </Animated.View>
    );
};


// ANIMATION TIMINGS (ms)
const TIMINGS = {
    SPIN_DELAY: 200,  // Pequeña espera antes de procesar lógica tras girar
    WIN_PULSE: 2000,  // Sync with pulse cycles (approx 2-3 cycles)
    CASCADE_DELAY: 800 // Tiempo para esperar que caigan las nuevas piezas
};

export default function GameScreen({ navigation, route }: any) {
    // Hook de Créditos (Persistencia + Bancarrota)
    const {
        credits,
        updateCredits: setCredits,
        loading
    } = useCredits();

    // Usar route prop en lugar de hook para evitar problemas de importación
    // const route = useRoute();
    const params = route.params as { bonusWin?: number; bonusTimestamp?: number } | undefined;
    const bonusWin = params?.bonusWin ?? 0;
    const bonusTimestamp = params?.bonusTimestamp;

    // Ref to track processed bonuses and prevent duplicate adds
    const lastProcessedBonusRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (bonusWin > 0) {
            // Log para debug si fuera necesario
            // console.log("Recibido bonusWin:", bonusWin);
        }
    }, [bonusWin]);

    // GLOBAL SOUND CONTEXT
    const { playSound } = useSound();

    // Sync Ref

    const [betIndex, setBetIndex] = useState(0);
    const [grid, setGrid] = useState<SlotCell[][]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [autoSpinCount, setAutoSpinCount] = useState(0);
    const [showAutoMenu, setShowAutoMenu] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({ title: '', message: '' });
    const autoSpinRef = useRef(0);
    const currentBet = BET_LEVELS[betIndex];

    // Sync Ref
    useEffect(() => {
        autoSpinRef.current = autoSpinCount;
    }, [autoSpinCount]);

    // Initial Fill
    useEffect(() => {
        fillInitialGrid();
    }, []);

    const fillInitialGrid = () => {
        const newGrid: SlotCell[][] = [];
        const counts: Record<string, number> = {};
        for (let r = 0; r < SLOT_ROWS; r++) {
            const row: SlotCell[] = [];
            for (let c = 0; c < SLOT_COLS; c++) {
                const sym = getWeightedSymbol(counts);
                counts[sym] = (counts[sym] || 0) + 1;
                // Inicializamos sin animación ganadora
                row.push({ id: generateId(), symbol: sym, isWinning: false });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
    };

    // Update Credits when returning from Bonus - ROBUST TIMESTAMP VERSION
    useEffect(() => {
        // CRITICAL: Wait for credits to load from storage to avoid overwriting with initial state (250)
        if (loading) return;

        const bonus = Number(bonusWin);
        // Ensure valid bonus AND unique timestamp (prevent reprocessing)
        if (!isNaN(bonus) && bonus > 0 && bonusTimestamp && bonusTimestamp !== lastProcessedBonusRef.current) {

            // Mark as processed immediately
            lastProcessedBonusRef.current = bonusTimestamp;

            // Calculate new total using FRESH credits dependency
            const newTotal = parseFloat((credits + bonus).toFixed(2));

            if (!isNaN(newTotal)) {
                setCredits(newTotal);

                setAlertConfig({
                    title: "¡BONUS TERMINADO!",
                    message: `Ganaste $${bonus.toFixed(2)} en la mina.`,
                    onConfirm: () => {
                        setAlertVisible(false);
                    },
                    confirmText: "GENIAL!!"
                });
                setAlertVisible(true);

                // We don't even need to clear params immediately anymore because the timestamp guards us,
                // but it's cleaner to do so.
                navigation.setParams({ bonusWin: 0, bonusTimestamp: undefined });
            }
        }
    }, [bonusWin, bonusTimestamp, credits, loading]);

    const handleSpin = (isAuto: boolean = false) => {
        // STOP Logic: If user clicks while Auto is active
        if (autoSpinRef.current > 0 && !isAuto) {
            setAutoSpinCount(0);
            autoSpinRef.current = 0;
            return;
        }

        if (loading) return; // Esperar a que carguen los créditos

        if (credits < currentBet) {
            setAlertConfig({
                title: "SALDO INSUFICIENTE",
                message: "No tienes suficientes créditos para girar.",
                onConfirm: () => setAlertVisible(false),
                confirmText: "ENTENDIDO"
            });
            setAlertVisible(true);
            setAutoSpinCount(0); // Stop auto
            return;
        }

        setIsSpinning(true);
        const newCredits = parseFloat((credits - currentBet).toFixed(2));
        setCredits(newCredits);
        setWinAmount(0);

        // 1. Generar Nuevo Grid
        // Al cambiar los IDs, React desmontará los viejos componentes (Exiting: ZoomOut)
        // y montará los nuevos (Entering: BounceInUp).
        const newGrid: SlotCell[][] = [];
        const counts: Record<string, number> = {};

        for (let r = 0; r < SLOT_ROWS; r++) {
            const row: SlotCell[] = [];
            for (let c = 0; c < SLOT_COLS; c++) {
                const sym = getWeightedSymbol(counts);
                counts[sym] = (counts[sym] || 0) + 1;
                row.push({
                    id: generateId(), // ID NUEVO -> Activa animación de entrada
                    symbol: sym,
                    isWinning: false,
                    delay: c * 80 // Stagger por columnas para efecto ola
                });
            }
            newGrid.push(row);
        }

        setGrid(newGrid);

        // Esperar un poco a que termine la caída inicial antes de buscar premios
        // La animación dura ~600ms + delays. Esperamos 900ms para asegurar.
        setTimeout(() => {
            processGameLoop(newGrid);
        }, 900);
    };

    // Función para rellenar huecos tras eliminar ganadores
    function performCascade(oldGrid: SlotCell[][], destroyedIds: Set<string>): SlotCell[][] {
        const newGrid: SlotCell[][] = Array(SLOT_ROWS).fill(null).map(() => []);

        // Iterar por columnas
        for (let c = 0; c < SLOT_COLS; c++) {
            const survived: SlotCell[] = [];

            // 1. Recolectar sobrevivientes (de abajo hacia arriba)
            for (let r = 0; r < SLOT_ROWS; r++) {
                const cell = oldGrid[r][c];
                if (!destroyedIds.has(cell.id)) {
                    // Conservamos el ID original para que NO se re-anime la entrada
                    // Resetamos isWinning y el delay
                    survived.push({ ...cell, isWinning: false, delay: 0 });
                }
            }

            // 2. ¿Cuántos faltan?
            const missing = SLOT_ROWS - survived.length;

            // 3. Generar NUEVOS items para arriba
            const newItems: SlotCell[] = [];
            for (let i = 0; i < missing; i++) {
                const sym = getWeightedSymbol({});
                newItems.push({
                    id: generateId(),     // ID NUEVO -> Animación Entrada
                    symbol: sym,
                    isWinning: false,
                    delay: c * 80         // Stagger por columnas
                });
            }

            // 4. Combinar: Nuevos arriba + Sobrevivientes abajo
            // Nota: En la pantalla, índice 0 es arriba.
            const fullColumn = [...newItems, ...survived];

            // 5. Asignar al grid
            for (let r = 0; r < SLOT_ROWS; r++) {
                newGrid[r][c] = fullColumn[r];
            }
        }
        return newGrid;
    }

    const processGameLoop = async (
        currentGrid: SlotCell[][],
        skipRegularWins: boolean = false,
        accumulatedWin: number = 0
    ) => {
        // 1. Contar y Buscar Ganadores
        const counts: Record<string, number> = {};
        const winIds = new Set<string>();
        let roundWin = 0;
        const betRatio = currentBet / 0.20;

        currentGrid.flat().forEach(cell => {
            counts[cell.symbol] = (counts[cell.symbol] || 0) + 1;
        });

        if (!skipRegularWins) {
            Object.keys(counts).forEach(sym => {
                if (sym !== 'scatter') {
                    let threshold = 8;
                    if (['item_1', 'item_2', 'item_3'].includes(sym)) {
                        threshold = 8;
                    }

                    if (counts[sym] >= threshold) {
                        const count = counts[sym];
                        const basePay = PAYTABLE_BASE[sym];

                        if (basePay) {
                            let quantityMultiplier = 1;
                            if (count >= 10 && count < 12) quantityMultiplier = 1.2;
                            if (count >= 12) quantityMultiplier = 2.0;

                            roundWin += (basePay * quantityMultiplier) * betRatio;
                        }

                        currentGrid.flat().forEach(cell => {
                            if (cell.symbol === sym) winIds.add(cell.id);
                        });
                    }
                }
            });
        }

        if (winIds.size > 0) {
            // --- HAY GANADORES ---
            // Small delay to sync with visual pulse start
            setTimeout(() => playSound('win_items'), 100);
            setWinAmount(prev => prev + roundWin);

            // 1. Marcar ganadores (Activa animación de Pulso/Win)
            const winGrid = currentGrid.map(row => row.map(cell => ({
                ...cell,
                isWinning: winIds.has(cell.id)
            })));
            setGrid(winGrid);

            // 2. Esperar a que el jugador vea la celebración (pulso)
            await new Promise(r => setTimeout(r, TIMINGS.WIN_PULSE));

            // NEW: EXPLICIT EXPLOSION PHASE
            // Trigger manual Scale/Fade animation
            const explodingGrid = winGrid.map(row => row.map(cell => ({
                ...cell,
                isExploding: winIds.has(cell.id)
            })));
            setGrid(explodingGrid);


            // Wait for explosion animation (500ms)
            await new Promise(r => setTimeout(r, 500));

            // 3. Cascada: Eliminar ganadores y traer nuevos
            // Al actualizar 'grid' con menos items o items nuevos,
            // Reanimated maneja:
            // - Exiting (ZoomOut) para los que están en 'destroyedIds' (ya no están en newGrid)
            // - Entering (BounceInUp) para los nuevos generados
            const cascadeGrid = performCascade(explodingGrid, winIds);
            setGrid(cascadeGrid);

            // 4. Esperar a que caigan las nuevas piezas
            await new Promise(r => setTimeout(r, TIMINGS.CASCADE_DELAY));

            // 5. Recursión: Verificar si hay nuevos premios tras la cascada
            processGameLoop(cascadeGrid, false, accumulatedWin + roundWin);

        } else {
            // --- FIN DEL TURNO (No más premios) ---
            if (accumulatedWin > 0) {
                const newCredits = parseFloat((credits + accumulatedWin).toFixed(2));
                setCredits(newCredits);
            }
            setIsSpinning(false);

            // Comprobar Scatters (Bonus)
            const scatterIds: string[] = [];
            currentGrid.flat().forEach(cell => {
                if (cell.symbol === 'scatter') scatterIds.push(cell.id);
            });

            if (scatterIds.length >= 3) {
                // Animación especial para scatters
                const scatterGrid = currentGrid.map(row => row.map(cell => ({
                    ...cell,
                    isWinning: scatterIds.includes(cell.id)
                })));
                setGrid(scatterGrid);
                setTimeout(() => playSound('win_bonus'), 1000);


                setTimeout(() => {
                    setAlertConfig({
                        title: "¡BONUS!",
                        message: `¡${scatterIds.length} Scatters! Entrando a la ronda de minería...`,
                        onConfirm: () => {
                            setAlertVisible(false);
                            enterBonus(10);
                        },
                        confirmText: "VAMOS"
                    });
                    setAlertVisible(true);
                }, 1000);
            }

            // Auto Spin
            if (autoSpinRef.current > 0 && credits >= currentBet) {
                setAutoSpinCount(prev => prev - 1);
                setTimeout(() => {
                    handleSpin(true);
                }, 500);
            }
        }
    };

    const enterBonus = (spins: number) => {
        navigation.navigate('EggSelection', { apuesta: currentBet });
    };

    const changeBet = (direction: 'up' | 'down') => {
        if (direction === 'up' && betIndex < BET_LEVELS.length - 1) {
            setBetIndex(betIndex + 1);
        } else if (direction === 'down' && betIndex > 0) {
            setBetIndex(betIndex - 1);
        }
    };

    const handleBuyFeature = () => {
        const cost = currentBet * 100;
        if (credits < cost) {
            setAlertConfig({
                title: "SALDO INSUFICIENTE",
                message: `Necesitas $${cost.toFixed(2)} para comprar el bonus.`,
                onConfirm: () => setAlertVisible(false)
            });
            setAlertVisible(true);
            return;
        }

        setAlertConfig({
            title: "¿COMPRAR FUNCION?",
            message: `Costo: $${cost.toFixed(2)}\n\n¿Deseas activar el Bonus inmediatamente?`,
            onCancel: () => setAlertVisible(false), // Needs cancel button
            onConfirm: () => {
                setAlertVisible(false);
                const newCredits = parseFloat((credits - cost).toFixed(2));
                setCredits(newCredits);
                setIsSpinning(true);

                // 1. Clone Current Grid
                const newGrid = grid.map(row => row.map(cell => ({ ...cell, isWinning: false })));

                // 2. Count Existing Scatters & Find Available Slots
                let scatterCount = 0;
                const availablePositions: { r: number, c: number }[] = [];

                newGrid.forEach((row, r) => {
                    row.forEach((cell, c) => {
                        if (cell.symbol === 'scatter') {
                            scatterCount++;
                        } else {
                            availablePositions.push({ r, c });
                        }
                    });
                });

                // 3. Inject Needed Scatters
                const needed = Math.max(0, 3 - scatterCount);

                // Shuffle available positions
                for (let i = availablePositions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
                }

                // Replace random items with Scatters
                for (let i = 0; i < needed; i++) {
                    if (availablePositions.length > i) {
                        const pos = availablePositions[i];
                        newGrid[pos.r][pos.c] = {
                            id: generateId(),
                            symbol: 'scatter',
                            isWinning: false,
                            delay: 0
                        };
                    }
                }

                setGrid(newGrid);


                // 3. Process Game Loop
                setTimeout(() => {
                    processGameLoop(newGrid, true);
                }, 1000);
            }
        });
        setAlertVisible(true);
    };



    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="light" />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="arrow-back" size={30} color="white" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeLabel}>SALDO</Text>
                        <Text style={styles.badgeValue}>$ {credits.toFixed(2)}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeLabel}>GANANCIAS</Text>
                        <Text style={styles.badgeValue}>$ {winAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Global Volume Control */}
                <VolumeControl />

                {/* Slot Grid */}
                <View style={styles.gridContainer}>
                    {/* STATIC BACKGROUND GRID (Empty Slots) */}
                    <View style={[StyleSheet.absoluteFill, { padding: 5, justifyContent: 'center' }]}>
                        {Array(SLOT_ROWS).fill(0).map((_, r) => (
                            <View key={`bg-row-${r}`} style={styles.row}>
                                {Array(SLOT_COLS).fill(0).map((_, c) => (
                                    <View key={`bg-cell-${c}`} style={[styles.cell, { width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* ANIMATED CONTENT GRID */}
                    {/* ANIMATED CONTENT GRID - Rendered by COLUMNS for Drop Animation */}
                    <View style={{ flexDirection: 'row' }}>
                        {Array(SLOT_COLS).fill(0).map((_, cIndex) => (
                            <View key={`col-${cIndex}`} style={{ flexDirection: 'column' }}>
                                {grid.map((row) => row[cIndex]).filter(cell => cell !== undefined).map((cell) => (
                                    <Animated.View
                                        key={cell.id}
                                        exiting={cell.isWinning ? ZoomOut.duration(500) : undefined}
                                        layout={LinearTransition.springify().damping(15)}
                                    >
                                        <WinningCell
                                            isWinning={cell.isWinning}
                                            isExploding={cell.isExploding}
                                            width={ITEM_SIZE}
                                            height={ITEM_SIZE}
                                        >
                                            <SlotSymbol
                                                symbol={cell.symbol}
                                                size={ITEM_SIZE * 0.8}
                                                isWinning={cell.isWinning}
                                                delay={cell.delay}
                                            />
                                        </WinningCell>
                                    </Animated.View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <View style={styles.betControl}>
                        <Text style={styles.controlLabel}>APUESTA</Text>
                        <View style={styles.betSelector}>
                            <TouchableOpacity onPress={() => changeBet('down')} style={styles.arrowBtn}>
                                <Ionicons name="caret-back" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.betDisplay}>
                                <Text style={styles.betValue}>$ {currentBet.toFixed(2)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeBet('up')} style={styles.arrowBtn}>
                                <Ionicons name="caret-forward" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        {/* ANCHORED DROPDOWN + BACKDROP */}
                        {showAutoMenu && (
                            <>
                                {/* Transparent Backdrop to close on click outside */}
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        top: -1000, bottom: -1000,
                                        left: -1000, right: -1000,
                                        zIndex: 199,
                                        backgroundColor: 'transparent'
                                    }}
                                    activeOpacity={1}
                                    onPress={() => setShowAutoMenu(false)}
                                />

                                <View style={styles.autoDropdown}>
                                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true} indicatorStyle="white">
                                        {[10, 15, 20, 30, 40, 50, 100].map(num => (
                                            <TouchableOpacity
                                                key={num}
                                                style={styles.autoDropdownOption}
                                                onPress={() => {
                                                    setShowAutoMenu(false);
                                                    setAutoSpinCount(num);
                                                    autoSpinRef.current = num;
                                                    handleSpin(true);
                                                }}
                                            >
                                                <Text style={styles.autoDropdownText}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.spinButton, isSpinning && autoSpinCount === 0 && styles.disabled]}
                            onPress={() => handleSpin(false)}
                            disabled={isSpinning && autoSpinCount === 0}
                        >
                            {autoSpinCount > 0 ? (
                                <View style={styles.stopIcon} />
                            ) : (
                                <Text style={styles.spinText}>{isSpinning ? '...' : 'GIRAR'}</Text>
                            )}

                            {/* Counter Moved INSIDE or Absolute to prevent layout shift */}
                            {autoSpinCount > 0 && (
                                <View style={styles.counterBadge}>
                                    <Text style={styles.autoCounterText}>{autoSpinCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Button Moved Here - Stacked Vertically */}
                        <TouchableOpacity
                            style={[styles.autoButton, { marginTop: 15 }, isSpinning && autoSpinCount === 0 && styles.disabled]}
                            onPress={() => !isSpinning && setShowAutoMenu(!showAutoMenu)}
                            disabled={isSpinning && autoSpinCount === 0}
                        >
                            <Text style={styles.autoButtonText}>TIR. AUTO</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Buy Feature Button */}
                <TouchableOpacity style={styles.buyButton} onPress={handleBuyFeature}>
                    <ImageBackground
                        source={require('../assets/cartel_textura.png')}
                        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                        imageStyle={{ resizeMode: 'stretch' }}
                    >
                        <Text style={styles.buyLabel}>COMPRAR</Text>
                        <Text style={styles.buyCost}>BONUS</Text>
                        <Text style={styles.buyCost}>${(currentBet * 100).toFixed(0)}</Text>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Modals moved to root */}
            </SafeAreaView>

            {/* Modals */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
                confirmText={alertConfig.confirmText || "ACEPTAR"}
                cancelText={alertConfig.cancelText || "CANCELAR"}
            />
        </ImageBackground>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 100,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#fff'
    },
    backArrow: {
        color: 'white',
        fontSize: 30,
        fontFamily: 'Minecraft',
        fontWeight: 'bold',
        marginTop: -3
    },

    safeArea: { flex: 1, alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '95%',
        marginTop: 130,
        marginBottom: 20,
    },
    badge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
        minWidth: 100,
        alignItems: 'center'
    },
    badgeLabel: { color: '#FFD700', fontSize: 10, fontFamily: 'Minecraft' },
    badgeValue: { color: 'white', fontSize: 16, fontFamily: 'Minecraft' },

    gridContainer: {
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        overflow: 'hidden'
    },
    row: { flexDirection: 'row' },
    cell: {
        margin: 2,
        // backgroundColor: 'rgba(255,255,255,0.1)', // Moved to Static Grid
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    controls: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        justifyContent: 'space-between'
    },
    betControl: { alignItems: 'center' },
    controlLabel: { color: '#ffffffff', fontFamily: 'Minecraft', marginBottom: 5, fontSize: 16, textShadowColor: '#000000bb', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, },
    betSelector: {
        flexDirection: 'row',
        backgroundColor: '#222',
        borderRadius: 5,
        alignItems: 'center'
    },
    arrowBtn: { padding: 10, backgroundColor: '#444', borderRadius: 5 },
    arrowText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    betDisplay: { paddingHorizontal: 15, minWidth: 80, alignItems: 'center' },
    betValue: { color: 'white', fontFamily: 'Minecraft', fontSize: 18 },

    spinButton: {
        backgroundColor: '#444',
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        borderWidth: 1,
        borderColor: '#ffffffff'
    },
    disabled: { opacity: 0.7 },
    spinText: { color: 'white', fontFamily: 'Minecraft', fontSize: 14 },

    buyButton: {
        position: 'absolute',
        left: 20,
        bottom: 150,
        width: 170,
        height: 90,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#665230',
        zIndex: 50,
        elevation: 5,
        overflow: 'hidden'
    },
    buyLabel: { color: 'white', fontSize: 15, fontFamily: 'Minecraft', textShadowColor: '#000000bb', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, },
    buyCost: { color: 'white', fontSize: 15, fontFamily: 'Minecraft', textShadowColor: '#000000bb', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, },

    modalOverlay: {
        width: width,
        height: height,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#333', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700'
    },
    modalTitle: { color: '#FFD700', fontSize: 20, fontFamily: 'Minecraft', marginBottom: 10 },
    modalText: { color: 'white', fontSize: 18, marginBottom: 20, fontFamily: 'Minecraft' },
    modalButtons: { flexDirection: 'row', gap: 20 },
    modalBtnCancel: { backgroundColor: '#f08982ff', padding: 10, borderRadius: 5 },
    modalBtnConfirm: { backgroundColor: '#05DF72', padding: 10, borderRadius: 5 },
    modalBtnText: { color: 'white', fontFamily: 'Minecraft' },

    eggOverlay: {
        width: width,
        height: height,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    eggTitle: { color: '#FFD700', fontSize: 32, fontFamily: 'Minecraft', marginBottom: 10, textShadowColor: 'black', textShadowRadius: 4 },
    eggSubtitle: { color: 'white', fontSize: 18, fontFamily: 'Minecraft', marginBottom: 50 },
    eggsContainer: { flexDirection: 'row', gap: 20 },
    eggButton: { alignItems: 'center' },
    eggImage: { width: 100, height: 120 },
    eggLabel: { color: 'white', fontSize: 24, marginTop: 10, fontFamily: 'Minecraft' },

    // Auto Spin Styles
    autoSpinContainer: {
        position: 'absolute',
        bottom: 15,
        right: '5%',
        alignItems: 'center'
    },
    autoButton: {
        backgroundColor: '#444',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#fff'
    },
    autoButtonText: { color: 'white', fontFamily: 'Minecraft', fontSize: 12 },

    autoDropdown: {
        position: 'absolute',
        bottom: 45, // Anchored to bottom (relative to parent center column)
        width: 100,
        height: 220,
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ffffffff',
        zIndex: 200,
        elevation: 10,
        paddingTop: 5,
        alignItems: 'center'
    },
    autoDropdownOption: {
        paddingVertical: 10,
        width: 80,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        alignItems: 'center',
        justifyContent: 'center'
    },
    autoDropdownText: {
        color: 'white',
        fontFamily: 'Minecraft',
        fontSize: 16
    },

    stopIcon: {
        width: 30,
        height: 30,
        backgroundColor: '#f7574cff',
        borderRadius: 2
    },
    autoCounterText: {
        color: '#ffffffff',
        fontFamily: 'Minecraft',
        backgroundColor: '#444',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        width: 80,
        borderRadius: 5,
        fontSize: 18,
        textShadowColor: 'black', // Removed marginBottom and absolute positioned it
        textShadowRadius: 2
    },
    counterBadge: {
        position: 'absolute',
        top: -30,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    }
});
