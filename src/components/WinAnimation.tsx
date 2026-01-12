import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface WinAnimationProps {
    multipliers: number[];
    betAmount: number;
    onReset: () => void;
}

const FlyingMultiplier = ({ value, index, total, onArrival }: { value: number, index: number, total: number, onArrival: (val: number) => void }) => {
    // Initial Position (Bottom Grid)
    const BOX_WIDTH = 50;
    const TOTAL_WIDTH = total * BOX_WIDTH;
    const startX = (index * BOX_WIDTH) - (TOTAL_WIDTH / 2) + (BOX_WIDTH / 2);

    const translateX = useSharedValue(startX);
    const translateY = useSharedValue(0); // 0 relative to bottom container
    const scale = useSharedValue(0); // Start invisible/small? Or pop in?
    const opacity = useSharedValue(1); // Default visible
    // User said: "Multipliers despejados... escalamiento... luego ir al centro"
    // So: Start Scale 1 (visible), Scale Up (1.5), then Fly.

    useEffect(() => {
        // Sequence delay based on index
        const delay = 500 + (index * 600); // Staggered

        // 1. Scale Up (Attention)
        scale.value = withDelay(delay, withSpring(1.5));

        // 2. Fly to Center
        // We calculate distance from bottom container (bottom: 120) to screen center.
        // Screen Center Y from bottom = height / 2.
        // Distance = (height / 2) - 120.
        // Direction is UP (negative Y).
        // Adjustment: The 'sumText' is visually slightly above center due to label and layout.
        // We subtract extra 40px to aim higher.
        const targetY = -(height / 2) + 80;

        translateY.value = withDelay(delay + 300, withTiming(targetY, { duration: 500 }));
        translateX.value = withDelay(delay + 300, withTiming(0, { duration: 500 }));

        // 3. Merge Effect
        // Scale down slightly but keep visible until the very end
        scale.value = withDelay(delay + 300, withTiming(0.5, { duration: 500 }));
        // Fade out right as it hits
        opacity.value = withDelay(delay + 700, withTiming(0, { duration: 100 }, () => {
            runOnJS(onArrival)(value);
        }));

    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: isNaN(scale.value) ? 0 : scale.value }
        ],
        opacity: opacity.value
    }));

    // Start with scale 1 immediately? No, animate in?
    // User implies they are "despejados" (cleared/found). 
    // We let them appear as existing items.
    useEffect(() => { scale.value = 1; }, []);

    return (
        <Animated.View style={[styles.flyingBox, style]}>
            <Text style={styles.flyingText}>x{value}</Text>
        </Animated.View>
    );
};

export const WinAnimation = ({ multipliers, betAmount, onReset }: WinAnimationProps) => {
    const totalMultiplier = multipliers.reduce((a, b) => a + b, 0);
    const totalWin = totalMultiplier * betAmount;

    // Logic State
    const [currentSum, setCurrentSum] = useState(0);
    const [showButton, setShowButton] = useState(false);

    // Animation Values
    const sumScale = useSharedValue(1);
    const resultOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);

    const handleArrival = (val: number) => {
        setCurrentSum(prev => prev + val);
        // Pulse effect on sum
        sumScale.value = 1.5;
        sumScale.value = withSpring(1);
    };

    // Check if sequence is done to trigger final phase
    useEffect(() => {
        if (currentSum === totalMultiplier && totalMultiplier > 0) {
            // All multipliers arrived. 
            // Trigger Final Equation Phase after brief pause.
            const timeout = setTimeout(() => {
                showFinalResult();
            }, 800);
            return () => clearTimeout(timeout);
        }
    }, [currentSum]);

    const showFinalResult = () => {
        // Show Total Win
        resultOpacity.value = withTiming(1, { duration: 500 });

        // Show Button
        setTimeout(() => {
            setShowButton(true);
            buttonOpacity.value = withTiming(1, { duration: 500 });
        }, 1000);
    };

    const sumStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sumScale.value }]
    }));

    const resultStyle = useAnimatedStyle(() => ({
        opacity: resultOpacity.value,
        transform: [{ scale: resultOpacity.value }] // Pop in
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value
    }));

    return (
        <View style={styles.container}>

            {/* Phase 1: Flying Multipliers */}
            {/* Rendered at bottom, animate up */}
            <View style={styles.bottomContainer}>
                {multipliers.map((m, i) => (
                    <FlyingMultiplier
                        key={i}
                        value={m}
                        index={i}
                        total={multipliers.length}
                        onArrival={handleArrival}
                    />
                ))}
            </View>

            {/* Central Display */}
            <View style={styles.centerContainer}>

                {/* Accumulator / Total Mult */}
                <View style={styles.sumWrapper}>
                    <Text style={styles.label}>Multiplicador</Text>
                    <Animated.Text style={[styles.sumText, sumStyle]}>x{currentSum}</Animated.Text>
                </View>

                {/* Final Equation (Visible after sum completes) */}
                <Animated.View style={[styles.resultBox, resultStyle]}>
                    <View style={styles.divider} />
                    <View style={styles.equationRow}>
                        <Text style={styles.eqText}>${betAmount}</Text>
                        <Text style={styles.eqOp}> x </Text>
                        <Text style={[styles.eqText, { color: '#FFA500' }]}>{totalMultiplier}</Text>
                    </View>
                    <Text style={styles.winLabel}>GANANCIA</Text>
                    <Text style={styles.finalWinText}>${totalWin}</Text>
                </Animated.View>

                {/* Play Again Button */}
                {showButton && (
                    <Animated.View style={[styles.buttonContainer, buttonStyle]}>
                        <TouchableOpacity style={styles.button} onPress={onReset}>
                            <Text style={styles.buttonText}>JUGAR DE NUEVO</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 120,
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    flyingBox: {
        position: 'absolute',
        width: 40,
        height: 40,
        backgroundColor: '#222',
        borderWidth: 2,
        borderColor: '#FFA500',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5
    },
    flyingText: {
        color: '#FFA500',
        fontWeight: 'bold',
        fontSize: 14,
    },
    centerContainer: {
        alignItems: 'center',
        width: '80%',
        zIndex: 1,
    },
    sumWrapper: {
        alignItems: 'center',
        marginBottom: 20
    },
    label: {
        color: '#ccc',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    sumText: {
        color: '#FFA500',
        fontSize: 80,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 165, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20
    },
    resultBox: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: '#444',
        marginBottom: 15
    },
    equationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    eqText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold'
    },
    eqOp: {
        color: '#888',
        fontSize: 20,
        marginHorizontal: 10
    },
    winLabel: {
        color: '#FFD700',
        fontSize: 14,
        marginTop: 5,
        letterSpacing: 4
    },
    finalWinText: {
        color: '#00FF00',
        fontSize: 50,
        fontWeight: 'bold',
        textShadowColor: '#00FF00',
        textShadowRadius: 10
    },
    buttonContainer: {
        marginTop: 30,
        width: '100%',
        alignItems: 'center'
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#4CAF50',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        width: '80%',
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});
