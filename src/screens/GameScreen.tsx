import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, Modal, SafeAreaView, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SLOT_IMAGES } from '../constants/assets';
import { BET_LEVELS, PAYTABLE_BASE, GRID_ROWS as MINING_ROWS } from '../constants/gameRules';
import { SlotSymbol } from '../components/SlotSymbol';

// Config specific to this screen
const SLOT_ROWS = 5;
const SLOT_COLS = 6;
const SYMBOLS = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5', 'item_6', 'item_7', 'scatter'];
const SYMBOL_WEIGHTS: Record<string, number> = {
    'item_1': 50, 'item_2': 40, 'item_3': 30, 'item_4': 25,
    'item_5': 15, 'item_6': 10, 'item_7': 4, 'scatter': 0.5
};

type SymbolStatus = 'falling' | 'idle' | 'winning' | 'disappearing';

interface SlotCell {
    id: string;
    symbol: string;
    status: SymbolStatus;
    delay?: number; // For stagger
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getWeightedSymbol = (counts: Record<string, number>) => {
    let pool = Object.keys(SYMBOL_WEIGHTS);
    pool = pool.filter(k => {
        const current = counts[k] || 0;
        if (k === 'scatter') return current < 3;
        return current < 8; // Limit to 8 (per generation step)
    });

    if (pool.length === 0) return 'item_1';

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

export default function GameScreen({ navigation }: any) {
    const [credits, setCredits] = useState(1000);
    const [betIndex, setBetIndex] = useState(0);
    const [grid, setGrid] = useState<SlotCell[][]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winAmount, setWinAmount] = useState(0);

    // Initial Fill
    useEffect(() => {
        fillInitialGrid();
    }, []);

    const currentBet = BET_LEVELS[betIndex];

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

    const handleSpin = () => {
        if (credits < currentBet) {
            Alert.alert("Saldo insuficiente", "No tienes suficientes créditos.");
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
                // Add stagger delay based on column (left to right) and row (top to bottom)?
                // Visual preference: Column based usually looks good for slots.
                // Let's do simple column stagger.
                row.push({
                    id: generateId(),
                    symbol: sym,
                    status: 'falling',
                    delay: c * 50 // Stagger per column
                });
            }
            newGrid.push(row);
        }

        setGrid(newGrid);

        // Wait for Drop Animation to finish before checking wins
        setTimeout(() => {
            processGameLoop(newGrid);
        }, 800);
    };

    const processGameLoop = async (currentGrid: SlotCell[][]) => {
        // 1. Check Matches (Global Count >= 8)
        const counts: Record<string, number> = {};
        const winIds = new Set<string>();
        let roundWin = 0;
        const betRatio = currentBet / 0.20;

        // Count symbols
        currentGrid.flat().forEach(cell => {
            counts[cell.symbol] = (counts[cell.symbol] || 0) + 1;
        });

        // Identify Winners
        Object.keys(counts).forEach(sym => {
            if (sym !== 'scatter' && counts[sym] >= 8) {
                // Determine Win Value
                if (PAYTABLE_BASE[sym]) {
                    roundWin += PAYTABLE_BASE[sym] * betRatio;
                }
                // Mark IDs
                currentGrid.flat().forEach(cell => {
                    if (cell.symbol === sym) winIds.add(cell.id);
                });
            }
        });

        if (winIds.size > 0) {
            // --- WIN SEQUENCE ---
            setWinAmount(prev => prev + roundWin);
            setCredits(prev => parseFloat((prev + roundWin).toFixed(2)));

            // A. WIN ANIMATION (Pulse)
            await new Promise(r => setTimeout(r, 1000)); // Pre-Win Delay

            const winGrid = currentGrid.map(row => row.map(cell => ({
                ...cell,
                status: winIds.has(cell.id) ? 'winning' as SymbolStatus : 'idle' as SymbolStatus
            })));
            setGrid(winGrid);

            // Wait for Pulse
            await new Promise(r => setTimeout(r, 1500));

            // B. DISAPPEAR ANIMATION (Expand/Fade)
            const disappearGrid = winGrid.map(row => row.map(cell => ({
                ...cell,
                status: winIds.has(cell.id) ? 'disappearing' as SymbolStatus : cell.status
            })));
            setGrid(disappearGrid);

            // Wait for Fade
            await new Promise(r => setTimeout(r, 1000)); // Increased Pause

            // C. CASCADE (Shift & Refill)
            const filledGrid = performCascade(disappearGrid, winIds);
            setGrid(filledGrid);

            // Wait for Drop
            await new Promise(r => setTimeout(r, 800)); // Increased Pause

            // Recursion
            processGameLoop(filledGrid);

        } else {
            // --- NO MORE WINS ---
            setIsSpinning(false);

            // Check Scatters
            let scatters = 0;
            currentGrid.flat().forEach(cell => {
                if (cell.symbol === 'scatter') scatters++;
            });

            if (scatters >= 3) {
                setTimeout(() => {
                    Alert.alert("¡BONUS!", "¡3 Scatters! Entrando a la ronda de minería...", [
                        { text: "Vamos", onPress: () => enterBonus(10) }
                    ]);
                }, 300);
            }
        }
    };

    const performCascade = (oldGrid: SlotCell[][], destroyedIds: Set<string>): SlotCell[][] => {
        const newGrid: SlotCell[][] = Array(SLOT_ROWS).fill(null).map(() => []);
        // Iterate Columns
        for (let c = 0; c < SLOT_COLS; c++) {
            const survived: SlotCell[] = [];
            // Collect survivors from bottom up
            for (let r = 0; r < SLOT_ROWS; r++) {
                const cell = oldGrid[r][c];
                if (!destroyedIds.has(cell.id)) {
                    survived.push({ ...cell, status: 'idle', delay: 0 }); // Reset status
                }
            }

            // How many missing?
            const missing = SLOT_ROWS - survived.length;

            // Generate new items for top
            const counts: Record<string, number> = {};
            // Note: Counts limiting per cascade is tricky if we don't know existing. 
            // For simplicity, we just generate valid single items locally.
            // Ideally we pass full grid context but let's approximate.

            const newItems: SlotCell[] = [];
            for (let i = 0; i < missing; i++) {
                const sym = getWeightedSymbol({}); // Simple generation
                newItems.push({
                    id: generateId(),
                    symbol: sym,
                    status: 'falling',
                    delay: c * 50 // Stagger
                });
            }

            // Combine: New items on top, survivors on bottom
            // In grid structure: Row 0 is top.
            // So column result should be [...newItems, ...survived]
            const fullColumn = [...newItems, ...survived];

            // Assign to newGrid rows
            for (let r = 0; r < SLOT_ROWS; r++) {
                newGrid[r][c] = fullColumn[r];
            }
        }
        return newGrid;
    };

    const enterBonus = (spins: number) => {
        navigation.navigate('Funsion', { tiros: spins, apuesta: currentBet });
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
            Alert.alert("Saldo insuficiente", `Necesitas $${cost.toFixed(2)} para comprar.`);
            return;
        }

        Alert.alert(
            "¿Comprar Función?",
            `Costo: $${cost.toFixed(2)}`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, Comprar",
                    onPress: () => {
                        setCredits(prev => parseFloat((prev - cost).toFixed(2)));
                        navigation.navigate('EggSelection', { apuesta: currentBet });
                    }
                }
            ]
        );
    };



    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="light" />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.backArrow}>{'<'}</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeLabel}>CREDITS</Text>
                        <Text style={styles.badgeValue}>$ {credits.toFixed(2)}</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeLabel}>WIN</Text>
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
                                <Text style={styles.arrowText}>{'<'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.betDisplay}>
                                <Text style={styles.betValue}>$ {currentBet.toFixed(2)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeBet('up')} style={styles.arrowBtn}>
                                <Text style={styles.arrowText}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.spinButton, isSpinning && styles.disabled]}
                        onPress={handleSpin}
                        disabled={isSpinning}
                    >
                        <Text style={styles.spinText}>{isSpinning ? '...' : 'GIRAR'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Buy Feature Button */}
                <TouchableOpacity style={styles.buyButton} onPress={handleBuyFeature}>
                    <Text style={styles.buyLabel}>COMPRAR</Text>
                    <Text style={styles.buyCost}>BONUS</Text>
                    <Text style={styles.buyCost}>${(currentBet * 100).toFixed(0)}</Text>
                </TouchableOpacity>

                {/* Modals moved to root */}
            </SafeAreaView>

            {/* Modals */}
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
        borderColor: '#333'
    },
    row: { flexDirection: 'row' },
    cell: {
        margin: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' // Important for drop anim masking
    },

    controls: {
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        justifyContent: 'space-between'
    },
    betControl: { alignItems: 'center' },
    controlLabel: { color: '#ccc', fontFamily: 'Minecraft', marginBottom: 5 },
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
        backgroundColor: '#05DF72',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        borderWidth: 3,
        borderColor: 'white'
    },
    disabled: { opacity: 0.7 },
    spinText: { color: 'white', fontFamily: 'Minecraft', fontSize: 14 },

    buyButton: {
        position: 'absolute',
        left: 20,
        bottom: 150,
        backgroundColor: '#FFbf00',
        padding: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
        alignItems: 'center',
        elevation: 5
    },
    buyLabel: { color: 'black', fontFamily: 'Minecraft', fontSize: 12 },
    buyCost: { color: 'black', fontFamily: 'Minecraft', fontSize: 10, fontWeight: 'bold' },

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
    modalBtnCancel: { backgroundColor: '#f44336', padding: 10, borderRadius: 5 },
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
    eggLabel: { color: 'white', fontSize: 24, marginTop: 10, fontFamily: 'Minecraft' }
});
