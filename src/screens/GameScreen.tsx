import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Modal, SafeAreaView, ImageBackground, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SLOT_IMAGES } from '../constants/assets';
import { BET_LEVELS, PAYTABLE_BASE, GRID_ROWS as MINING_ROWS } from '../constants/gameRules';
import { SlotSymbol } from '../components/SlotSymbol';
import CustomAlert from '../components/CustomAlert';

// Config specific to this screen
const SLOT_ROWS = 5;
const SLOT_COLS = 6;
const SYMBOLS = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5', 'item_6', 'item_7', 'item_8', 'item_9', 'scatter'];
// Total Weight: ~300. 
// Esto define el "RTP" (Retorno al Jugador) y la "Volatilidad".
const SYMBOL_WEIGHTS: Record<string, number> = {
    'item_1': 65,  // Bajamos de 80 a 65
    'item_2': 55,
    'item_3': 45,
    'item_4': 40,
    'item_5': 35,
    'item_6': 25,
    'item_7': 15,
    'item_8': 10,  // Raro
    'item_9': 5,   // Muy raro (Premium)
    'scatter': 1.8 // Ajuste fino para el bonus
};
type SymbolStatus = 'falling' | 'idle' | 'winning' | 'disappearing' | 'shifting';

interface SlotCell {
    id: string;
    symbol: string;
    status: SymbolStatus;
    delay?: number; // For stagger
    shiftRows?: number;
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

// ANIMATION TIMINGS (ms)
const TIMINGS = {
    FALL: 950,        // 350ms drop + 450ms max stagger (cols*90) + buffer
    WIN_PULSE: 1400,  // Keep pulsing time
    DISAPPEAR: 600,   // Fade out time
    CASCADE: 950      // Faster cascade
};

export default function GameScreen({ navigation }: any) {
    const [credits, setCredits] = useState(1000);
    const [betIndex, setBetIndex] = useState(0);
    const [grid, setGrid] = useState<SlotCell[][]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [autoSpinCount, setAutoSpinCount] = useState(0);
    const [showAutoMenu, setShowAutoMenu] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: () => { } });

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
                row.push({ id: generateId(), symbol: sym, status: 'idle' });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
    };

    const handleSpin = (isAuto: boolean = false) => {
        // STOP Logic: If user clicks while Auto is active
        if (autoSpinRef.current > 0 && !isAuto) {
            setAutoSpinCount(0);
            autoSpinRef.current = 0;
            return;
        }

        if (credits < currentBet) {
            Alert.alert("Saldo insuficiente", "No tienes suficientes créditos.");
            setAutoSpinCount(0); // Stop auto
            return;
        }

        setIsSpinning(true);
        setCredits(prev => parseFloat((prev - currentBet).toFixed(2)));
        setWinAmount(0);

        // 1. Generate New Grid (All Falling)
        const newGrid: SlotCell[][] = [];
        const counts: Record<string, number> = {};

        for (let r = 0; r < SLOT_ROWS; r++) {
            const row: SlotCell[] = [];
            for (let c = 0; c < SLOT_COLS; c++) {
                const sym = getWeightedSymbol(counts);
                counts[sym] = (counts[sym] || 0) + 1;
                row.push({
                    id: generateId(),
                    symbol: sym,
                    status: 'falling',
                    delay: c * 90 // Faster stagger (was 100)
                });
            }
            newGrid.push(row);
        }

        setGrid(newGrid);

        // Wait for Drop Animation to finish before checking wins
        setTimeout(() => {
            processGameLoop(newGrid);
        }, 100);
    };

    function performCascade(oldGrid: SlotCell[][], destroyedIds: Set<string>): SlotCell[][] {
        const newGrid: SlotCell[][] = Array(SLOT_ROWS).fill(null).map(() => []);
        // Iterate Columns
        for (let c = 0; c < SLOT_COLS; c++) {
            const survived: (SlotCell & { originalRow: number })[] = [];
            // Collect survivors from bottom up
            for (let r = 0; r < SLOT_ROWS; r++) {
                const cell = oldGrid[r][c];
                if (!destroyedIds.has(cell.id)) {
                    survived.push({ ...cell, status: 'idle', delay: 0, originalRow: r } as any);
                }
            }

            // How many missing?
            const missing = SLOT_ROWS - survived.length;

            // Generate new items for top
            const newItems: SlotCell[] = [];
            for (let i = 0; i < missing; i++) {
                const sym = getWeightedSymbol({}); // Simple generation
                newItems.push({
                    id: generateId(),
                    symbol: sym,
                    status: 'falling',
                    delay: c * 90 // Faster stagger (was 100)
                });
            }

            // Combine: New items on top, survivors on bottom
            const fullColumn = [...newItems, ...survived];

            // Assign to newGrid rows
            for (let r = 0; r < SLOT_ROWS; r++) {
                const cell = fullColumn[r];
                if (r < missing) {
                    newGrid[r][c] = cell;
                } else {
                    const originalRow = (cell as any).originalRow;
                    const shift = r - originalRow;
                    newGrid[r][c] = {
                        ...cell,
                        status: shift > 0 ? 'shifting' : 'idle',
                        shiftRows: shift
                    };
                    delete (newGrid[r][c] as any).originalRow;
                }
            }
        }
        return newGrid;
    }

    // Agregamos el parámetro 'fromCascade' al final
    const processGameLoop = async (
        currentGrid: SlotCell[][],
        skipRegularWins: boolean = false,
        accumulatedWin: number = 0,
        fromCascade: boolean = false // <--- NUEVO PARÁMETRO
    ) => {
        // 1. Check Matches
        const counts: Record<string, number> = {};
        const winIds = new Set<string>();
        let roundWin = 0;
        const betRatio = currentBet / 0.20;

        // Count symbols
        currentGrid.flat().forEach(cell => {
            counts[cell.symbol] = (counts[cell.symbol] || 0) + 1;
        });

        // Identify Winners
        if (!skipRegularWins) {
            Object.keys(counts).forEach(sym => {
                if (sym !== 'scatter') {
                    // Lógica de Dificultad (9 para comunes, 8 para el resto)
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

        // --- CORRECCIÓN DE LA ESPERA INICIAL ---
        // Si venimos de una cascada, NO esperamos (porque ya esperamos en el paso anterior).
        // Si es el primer giro, SÍ esperamos a que caigan (tu preferencia de 1300ms para asegurar).
        if (!fromCascade) {
            // Ajustamos a 1300ms: 700ms caída base + 500ms delay max + 100ms buffer
            await new Promise(r => setTimeout(r, TIMINGS.FALL));
        }

        if (winIds.size > 0) {
            // --- SECUENCIA DE VICTORIA ---
            setWinAmount(prev => prev + roundWin);

            // Pequeña pausa técnica para asegurar que el renderizado esté listo
            await new Promise(r => setTimeout(r, 50));

            // 1. ESTADO WINNING (Brillo/Pulso)
            const winGrid = currentGrid.map(row => row.map(cell => ({
                ...cell,
                status: winIds.has(cell.id) ? 'winning' as SymbolStatus : 'idle' as SymbolStatus
            })));
            setGrid(winGrid);

            // CORRECCIÓN DEL "CONGELAMIENTO":
            await new Promise(r => setTimeout(r, TIMINGS.WIN_PULSE));

            // 2. ESTADO DISAPPEARING (Desaparecer)
            const disappearGrid = winGrid.map(row => row.map(cell => ({
                ...cell,
                status: winIds.has(cell.id) ? 'disappearing' as SymbolStatus : cell.status
            })));
            setGrid(disappearGrid);

            // Esperamos a que terminen de desaparecer (fade out)
            await new Promise(r => setTimeout(r, TIMINGS.DISAPPEAR));

            // 3. CASCADA (Rellenar huecos)
            const filledGrid = performCascade(disappearGrid, winIds);
            setGrid(filledGrid);

            // CORRECCIÓN DE CASCADA ROTA:
            // Aquí esperamos a que caigan los NUEVOS bloques.
            // Aumentamos a 1300ms para garantizar que la columna 6 (delay 500ms) termine su caída (700ms).
            await new Promise(r => setTimeout(r, TIMINGS.CASCADE));

            // 4. RECURSIÓN
            // Importante: Pasamos 'true' en fromCascade para que el siguiente ciclo 
            // NO vuelva a esperar los 1200ms iniciales y detecte el premio inmediatamente.
            processGameLoop(filledGrid, false, accumulatedWin + roundWin, true);

        } else {
            // --- NO MÁS VICTORIAS ---
            if (accumulatedWin > 0) {
                setCredits(prev => parseFloat((prev + accumulatedWin).toFixed(2)));
            }
            setIsSpinning(false);

            // Check Scatters
            const scatterIds: string[] = [];
            currentGrid.flat().forEach(cell => {
                if (cell.symbol === 'scatter') scatterIds.push(cell.id);
            });

            if (scatterIds.length >= 3) {
                const scatterGrid = currentGrid.map(row => row.map(cell => ({
                    ...cell,
                    status: scatterIds.includes(cell.id) ? 'winning' as SymbolStatus : 'idle' as SymbolStatus
                })));
                setGrid(scatterGrid);

                setTimeout(() => {
                    Alert.alert("¡BONUS!", `¡${scatterIds.length} Scatters! Entrando a la ronda de minería...`, [
                        { text: "Vamos", onPress: () => enterBonus(10) }
                    ]);
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
            onConfirm: () => {
                setAlertVisible(false);
                setCredits(prev => parseFloat((prev - cost).toFixed(2)));
                setIsSpinning(true);

                // 1. Clone Current Grid
                const newGrid = grid.map(row => row.map(cell => ({ ...cell, status: 'idle' as SymbolStatus })));

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
                            status: 'idle',
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

                {/* Slot Grid */}
                <View style={styles.gridContainer}>
                    {grid.map((row, rIndex) => (
                        <View key={rIndex} style={styles.row}>
                            {row.map((cell, cIndex) => (
                                <View key={`${cell.id}-${cIndex}`} style={[styles.cell, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
                                    <SlotSymbol
                                        symbol={cell.symbol}
                                        size={ITEM_SIZE * 0.8}
                                        status={cell.status}
                                        delay={cell.delay}
                                        index={cIndex}
                                        rowIndex={rIndex} // Pass row index for smart start position
                                        shiftRows={cell.shiftRows}
                                        shiftHeight={ITEM_SIZE + 4}
                                    />
                                </View>
                            ))}
                        </View>
                    ))}
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
                onCancel={() => setAlertVisible(false)}
                confirmText={alertConfig.title.includes("INSUFICIENTE") ? "ENTENDIDO" : "COMPRAR"}
                cancelText="CANCELAR"
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
        backgroundColor: 'rgba(255,255,255,0.1)',
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
