import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, SafeAreaView, TouchableOpacity, TextInput, Alert, ImageBackground, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VolumeControl from '../components/VolumeControl';
import { BlockItem } from '../components/BlockItem';
import { ToolItem } from '../components/ToolItem';
import { WinAnimation } from '../components/WinAnimation';
import CustomAlert from '../components/CustomAlert';
import { GRID_COLS, TOOL_HIT_DURATION, ENTRANCE_DURATION, PRESENTATION_DURATION } from '../constants/gameRules';
import { useGame } from '../hooks/useGame';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import * as SplashScreen from 'expo-splash-screen'; // <--- Importar esto
import { useFonts } from 'expo-font';               // <--- Importar esto

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

function FloatingText({ amount, col, row, itemSize }: { amount: number, col: number, row: number, itemSize: number }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.delay(500),
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            Animated.timing(translateY, {
                toValue: -60,
                duration: 1000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            })
        ]).start();
    }, []);

    // Layout calc: padding 5, margin 2 per side (4 total spacing)
    const left = 5 + col * (itemSize + 4) + (itemSize / 2) - 20;
    const top = 5 + row * (itemSize + 4) + (itemSize / 2) - 10;

    return (
        <Animated.View style={{
            position: 'absolute',
            left,
            top,
            opacity: fadeAnim,
            transform: [{ translateY }],
            zIndex: 100
        }}>
            <Text style={styles.floatingText}>+${amount.toFixed(2)}</Text>
        </Animated.View>
    );
}

// Para cambiar el tamaño, ajusta el número restado al ancho (actualmente 60).
// Un número MAYOR (ej. 80) hará los bloques más PEQUEÑOS.
// Un número MENOR (ej. 30) los hará más GRANDES.
const ITEM_SIZE = (width - 60) / GRID_COLS;

// Componente para Multiplicadores Animados
function AnimatedMultiplier({ value, isUnlocked, size }: { value: number, isUnlocked: boolean, size: number }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | null = null;

        if (value >= 5 && isUnlocked) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true })
                ])
            );
            animation.start();
        } else {
            scaleAnim.setValue(1);
        }

        return () => {
            if (animation) animation.stop();
        };
    }, [value, isUnlocked]);

    const isHighValue = value >= 5;

    return (
        <Animated.View style={[
            styles.multBoxBase,
            { width: size },
            !isUnlocked && styles.multBoxLocked,
            !isUnlocked && isHighValue && styles.multBoxLockedHigh,
            { transform: [{ scale: scaleAnim }] }
        ]}>
            {isUnlocked ? (
                <Text style={[
                    styles.multText,
                    isHighValue && styles.multTextHigh
                ]}>
                    x{value}
                </Text>
            ) : (
                <Ionicons
                    name="help-outline"
                    size={25}
                    color={isHighValue ? "#FFA500" : "#fdfde5ff"}
                    style={isHighValue ? { textShadowColor: '#FF0000', textShadowRadius: 10 } : undefined}
                />
            )}
        </Animated.View>
    );
}

export default function FunsionScreen({ navigation, route }: any) {
    const { tiros = 10, apuesta = 0.20 } = route.params || {};

    const {
        grid, tools, multipliers,
        betAmount, spinsRemaining, totalWin, accumulatedWin, recentWins,
        gameState, startGame, resetGame, spin,
        isAnimating
    } = useGame();

    // Start Bonus Game immediately
    useEffect(() => {
        startGame(apuesta, tiros);
    }, [apuesta, tiros]);

    // Handle Exit/Finish
    // Handle Exit/Finish
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({ title: '', message: '' });

    // Handle Exit/Finish
    const handleExit = () => {
        setAlertConfig({
            title: "¿SALIR?",
            message: "Perderás el progreso de la ronda actual.",
            onCancel: () => setAlertVisible(false),
            onConfirm: () => {
                setAlertVisible(false);
                resetGame();
                navigation.navigate('Home');
            },
            confirmText: "SALIR",
            cancelText: "CANCELAR"
        });
        setAlertVisible(true);
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
                <VolumeControl />

                {/* Removed BETTING View - Bonus starts automatically */}

                {gameState === 'PLAYING' && (
                    <>
                        <View style={styles.header}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeLabel}>GANANCIA</Text>
                                <Text style={styles.badgeValue}>$ {accumulatedWin.toFixed(2)}</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeLabel}>TIROS</Text>
                                <Text style={styles.badgeValue}>{spinsRemaining}</Text>
                            </View>
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
                            {/* Floating Texts Layer */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                {recentWins.map((win) => (
                                    <FloatingText
                                        key={win.id}
                                        amount={win.amount}
                                        col={win.col}
                                        row={win.row}
                                        itemSize={ITEM_SIZE}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Multiplicadores */}
                        {/* Multiplicadores */}
                        {/* Multiplicadores */}
                        <View style={styles.multipliersRow}>
                            {multipliers.map((mult, colIndex) => {
                                const isUnlocked = grid.every(row => row[colIndex].isDestroyed);
                                return (
                                    <AnimatedMultiplier
                                        key={colIndex}
                                        value={mult}
                                        isUnlocked={isUnlocked}
                                        size={ITEM_SIZE}
                                    />
                                );
                            })}
                        </View>

                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#f44336' }, isAnimating && styles.buttonDisabled]}
                                onPress={handleExit}
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
                        earnedIndices.length > 0 ? (
                            <WinAnimation
                                multipliers={multipliers}
                                earnedIndices={earnedIndices}
                                betAmount={accumulatedWin}
                                onReset={() => {
                                    resetGame();
                                    // Calcular ganancia final: (acumulado * multiplicadores seleccionados)
                                    // WinAnimation ya calcula esto internamente para mostrarlo,
                                    // pero necesitamos pasarlo.
                                    // REVISIÓN: WinAnimation debería llamar a onReset con el monto total o
                                    // debemos calcularlo aquí.
                                    // Simplificación: Pasamos accumulatedWin y dejemos que GameScreen se encargue?
                                    // NO, necesitamos el total REAL (multiplicado).
                                    // WinAnimation calcula "totalWin" visualmente.
                                    // Debemos recalcular aquí para pasar el dato seguro.
                                    const totalMultiplier = multipliers.reduce((acc, val, idx) => {
                                        return earnedIndices.includes(idx) ? acc + val : acc;
                                    }, 0);
                                    const finalWin = accumulatedWin * (totalMultiplier || 1);

                                    navigation.navigate('Game', { bonusWin: finalWin, bonusTimestamp: Date.now() });
                                }}
                            />
                        ) : (
                            // NO MULTIPLIERS SCREEN
                            <View style={styles.centerContent}>
                                <Text style={[styles.title, { fontSize: 30, textAlign: 'center', lineHeight: 40 }]}>
                                    No conseguiste multiplicadores
                                </Text>

                                <Text style={styles.subtitle}>GANANCIA TOTAL</Text>
                                <Text style={[styles.moneyText, { fontSize: 50, marginBottom: 30 }]}>
                                    $ {accumulatedWin.toFixed(2)}
                                </Text>

                                <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={() => {
                                    resetGame();
                                    navigation.navigate('Game', { bonusWin: accumulatedWin, bonusTimestamp: Date.now() });
                                }}>
                                    <Text style={styles.buttonText}>COBRAR</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    ) : (
                        <View style={styles.centerContent}>
                            <Text style={styles.title}>¡Juego Terminado!</Text>
                            <Text style={styles.resultText}>Suerte para la proxima!</Text>

                            <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={() => { resetGame(); navigation.navigate('Game'); }}>
                                <Text style={styles.buttonText}>INTENTAR DE NUEVO</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}

                <CustomAlert
                    visible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onConfirm={alertConfig.onConfirm}
                    onCancel={alertConfig.onCancel}
                    confirmText={alertConfig.confirmText}
                    cancelText={alertConfig.cancelText}
                />

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
        width: '80%',
        backgroundColor: '#F8FAFC',
        borderRadius: 9,
        borderColor: '#525252',
        borderWidth: 5,
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 25,
        fontFamily: 'Minecraft',
        color: '#FFD700',
        textShadowColor: '#000000ff',
        textShadowRadius: 6,
        textShadowOffset: { width: -2, height: 0 },
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
        justifyContent: 'flex-start', // Moved to start (left)
        gap: 20,                      // Spacing between badges
        width: '95%',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 30, // SafeArea spacing
        zIndex: 100,
        elevation: 100,
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
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        width: '95%',
        zIndex: 100,
        elevation: 100,
        overflow: 'visible',
        // Fix for "compressed" look: Ensure it has height even if empty
        // TOOL_ROWS is 2. We add padding (5*2) + margins (approx)
        minHeight: (ITEM_SIZE * 2) + 20,
        justifyContent: 'flex-end', // Align tools to bottom if partial
    },
    toolsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        margin: 1,
        overflow: 'visible'
    },
    slot: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        margin: 1,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
        overflow: 'visible'
    },
    separator: { height: 2, width: '90%', backgroundColor: '#555', marginBottom: 10, marginTop: 10 },
    gridContainer: {
        marginBottom: 5,
        zIndex: 0,
        elevation: 0,
    },
    floatingText: {
        color: '#00FF00', // Bright green
        fontSize: 20,
        fontFamily: 'Minecraft',
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    row: { flexDirection: 'row' },

    multipliersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    multBoxBase: {
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    multBoxLocked: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderRadius: 5,
        padding: 1,
        borderColor: '#000000ff',
    },
    multBoxLockedHigh: {
        borderColor: '#FF0000', // Red border hint
        backgroundColor: 'rgba(50, 0, 0, 0.6)', // Slight red tint
    },
    multText: {
        color: '#11ff00ff',
        fontSize: 20,
        fontFamily: 'Minecraft',
        textShadowColor: 'black',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    multTextHigh: {
        color: '#FFA500', // Naranja
        textShadowColor: '#FF0000', // Rojo Brillo
        textShadowRadius: 10,
        textShadowOffset: { width: 0, height: 0 }, // Centrado para efecto glow
    },

    controls: {
        flexDirection: 'row',
        gap: 20,
        zIndex: 500,
        elevation: 500
    },
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