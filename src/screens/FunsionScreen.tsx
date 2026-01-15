import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, SafeAreaView, TouchableOpacity, TextInput, Alert, ImageBackground, Image } from 'react-native';
import { BlockItem } from '../components/BlockItem';
import { ToolItem } from '../components/ToolItem';
import { WinAnimation } from '../components/WinAnimation';
import { GRID_COLS, TOOL_HIT_DURATION, ENTRANCE_DURATION, PRESENTATION_DURATION } from '../constants/gameRules';
import { useGame } from '../hooks/useGame';
import { useState, useMemo, useEffect, useCallback } from 'react';

import * as SplashScreen from 'expo-splash-screen'; // <--- Importar esto
import { useFonts } from 'expo-font';               // <--- Importar esto

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
// Para cambiar el tamaño, ajusta el número restado al ancho (actualmente 60).
// Un número MAYOR (ej. 80) hará los bloques más PEQUEÑOS.
// Un número MENOR (ej. 30) los hará más GRANDES.
const ITEM_SIZE = (width - 60) / GRID_COLS;

export default function FunsionScreen({ navigation, route }: any) {
    const { tiros = 10, apuesta = 0.20 } = route.params || {};

    const {
        grid, tools, multipliers,
        betAmount, spinsRemaining, totalWin,
        gameState, startGame, resetGame, spin,
        isAnimating
    } = useGame();

    // Start Bonus Game immediately
    useEffect(() => {
        startGame(apuesta, tiros);
    }, [apuesta, tiros]);

    // Handle Exit/Finish
    const handleExit = () => {
        resetGame();
        navigation.goBack(); // Return to Main Slot
    };

    // Calculate Earned Multipliers (Cleared Columns)
    const earnedIndices = useMemo(() => {
        if (!grid || grid.length === 0) return [];
        const indices: number[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
            const isColumnCleared = grid.every(row => row[c] && row[c].isDestroyed);
            if (isColumnCleared) indices.push(c);
        }
        return indices;
    }, [grid]);

    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container} resizeMode="cover">
            <SafeAreaView style={styles.safeArea} >
                <StatusBar style="light" />

                {/* Removed BETTING View - Bonus starts automatically */}

                {gameState === 'PLAYING' && (
                    <>
                        <View style={styles.header}>
                            <Text style={styles.infoText}>Apuesta: $ {betAmount.toFixed(2)}</Text>
                            <Text style={styles.infoText}>Tiros: {spinsRemaining}</Text>
                        </View>

                        {/* Herramientas */}
                        <View style={styles.toolsContainer}>
                            {tools.map((row, rowIndex) => (
                                <View key={rowIndex} style={[styles.toolsRow, { zIndex: tools.length - rowIndex, elevation: tools.length - rowIndex }]}>
                                    {row.map((slot, colIndex) => {
                                        const itemKey = slot.tool ? slot.tool.id : `empty-${rowIndex}-${colIndex}`;

                                        if (!slot.tool) {
                                            return (
                                                <View key={itemKey} style={[styles.slot, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
                                                    <ToolItem tool={null} size={ITEM_SIZE} />
                                                </View>
                                            );
                                        }

                                        const rowPath = slot.plannedPath || [];
                                        const rowsBelow = (tools.length - 1) - rowIndex;
                                        const extraDistance = rowsBelow * ITEM_SIZE;

                                        const pathOffsets = rowPath.map(gridRowIndex => {
                                            return ((gridRowIndex + 1) * ITEM_SIZE) + 30 + extraDistance;
                                        });

                                        return (
                                            <View key={itemKey} style={[styles.slot, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
                                                <ToolItem
                                                    tool={slot.tool}
                                                    size={ITEM_SIZE}
                                                    pathOffsets={pathOffsets}
                                                    startDelay={slot.startDelay}
                                                />
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>

                        <View style={styles.separator} />

                        {/* Grid de Bloques */}
                        <View style={styles.gridContainer}>
                            {grid.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.row}>
                                    {row.map((block) => (
                                        <BlockItem
                                            key={block.id}
                                            type={block.type}
                                            currentHealth={block.currentHealth}
                                            maxHealth={block.maxHealth}
                                            isDestroyed={block.isDestroyed}
                                            size={ITEM_SIZE}
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>

                        {/* Multiplicadores */}
                        <View style={styles.multipliersRow}>
                            {multipliers.map((mult, index) => (
                                <View key={index} style={[styles.multBox, { width: ITEM_SIZE }]}>
                                    <Text style={styles.multText}>x{mult}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#f44336' }, isAnimating && styles.buttonDisabled]}
                                onPress={() => { resetGame(); navigation.navigate('Home'); }}
                                disabled={isAnimating}
                            >
                                <Text style={styles.buttonText}>SALIR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, isAnimating && styles.buttonDisabled]}
                                onPress={spin}
                                disabled={isAnimating}
                            >
                                <Text style={styles.buttonText}>GIRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {gameState === 'FINISHED' && (
                    totalWin > 0 ? (
                        <WinAnimation
                            multipliers={multipliers}
                            earnedIndices={earnedIndices}
                            betAmount={betAmount}
                            onReset={resetGame}
                        />
                    ) : (
                        <View style={styles.centerContent}>
                            <Text style={styles.title}>¡Juego Terminado!</Text>
                            <Text style={styles.resultText}>Suerte para la proxima!</Text>

                            <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={resetGame}>
                                <Text style={styles.buttonText}>INTENTAR DE NUEVO</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}

            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    title: {
        fontSize: 40,
        fontFamily: 'Minecraft',
        color: '#FFD700',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 18,
        color: '#525252',
        fontFamily: 'Minecraft',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#E7E6E0',
        color: '#525252',
        fontSize: 24,
        padding: 15,
        width: '60%',
        borderRadius: 5,
        textAlign: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#737373',
        fontFamily: 'Minecraft',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        marginBottom: 10,
        marginTop: 30, // SafeArea spacing
        zIndex: 2000, // Ensure header is ALWAYS on top of flying tools (zIndex 100)
        elevation: 2000,
    },
    infoText: {
        backgroundColor: '#E7E6E0',
        borderColor: '#737373',
        borderWidth: 3,
        borderRadius: 5,
        padding: 10,
        paddingHorizontal: 20,
        color: '#525252',
        fontSize: 13,
        fontFamily: 'Minecraft',
    },

    moneyText: {
        color: '#00FF00',
        fontSize: 30,
        fontFamily: 'Minecraft',
    },
    resultText: {
        color: 'white',
        fontSize: 24,
        marginBottom: 10,
    },
    toolsContainer: {
        position: 'relative',
        backgroundColor: '#ebebe8ff',
        borderRadius: 5,
        borderColor: '#737373',
        borderWidth: 3,
        paddingTop: 3,
        paddingBottom: 3,
        width: '95%',
        zIndex: 100, // Ensure tools are above grid for animation
        elevation: 100, // Android support
        overflow: 'visible',
    },
    toolsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        margin: 1,
        overflow: 'visible'
    },
    slot: {
        backgroundColor: '#bebebeff',
        margin: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
        // Dando profundidad (Efecto Hundido)
        borderTopWidth: 2,
        borderTopColor: '#373737', // Sombra Superior
        borderLeftWidth: 2,
        borderLeftColor: '#373737', // Sombra Izquierda
        borderBottomWidth: 2,
        borderBottomColor: '#ffffff', // Brillo Inferior
        borderRightWidth: 2,
        borderRightColor: '#ffffff', // Brillo Derecho
    },
    separator: { height: 2, width: '90%', backgroundColor: '#555', marginBottom: 10, marginTop: 10 },
    gridContainer: {
        marginBottom: 5,
        zIndex: 0,
        elevation: 0,
    },
    row: { flexDirection: 'row' },

    multipliersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    multBox: {
        height: 40,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#373737',
        borderWidth: 2,
        borderColor: '#bebebeff',
    },
    multText: {
        color: '#ffae00ff',
        fontSize: 18,
        fontFamily: 'Minecraft',
    },

    controls: { flexDirection: 'row', gap: 20 },
    button: {
        backgroundColor: '#05DF72',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 6,
        elevation: 5,
        // Efecto Relieve (Botón 3D)
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.5)',
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(255,255,255,0.5)',
        borderBottomWidth: 4,
        borderBottomColor: 'rgba(0,0,0,0.3)',
        borderRightWidth: 4,
        borderRightColor: 'rgba(0,0,0,0.3)',
    },
    buttonStart: {
        backgroundColor: '#05DF72',
        width: '70%',
        alignItems: 'center',
        paddingVertical: 25,
        paddingHorizontal: 50,
        marginVertical: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#737373',
        fontFamily: 'Minecraft',
    },
    buttonDisabled: { backgroundColor: '#555' },
    buttonText: { color: '#F8FAFC', fontSize: 19, fontFamily: 'Minecraft' },

    gameLogo: {
        width: '80%',    // Ocupa el 80% del ancho de la pantalla
        height: 300,     // Ajusta esta altura según tu imagen
        marginBottom: 5,
    },

    infoLink: { marginTop: 20 },
    infoLinkText: { color: '#525252', fontSize: 18, fontFamily: 'Minecraft' }

});