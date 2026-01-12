import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { ToolType } from '../types/game'; // Adjust if needed
import { TOOL_IMAGES } from '../constants/assets';
import { ENTRANCE_DURATION, TOOL_HIT_DURATION, PRESENTATION_DURATION } from '../constants/gameRules';

interface ToolItemProps {
    tool: { type: ToolType; uses: number; id: string } | null;
    size: number;
    pathOffsets?: number[];
    startDelay?: number;
}

const TOOL_TYPES = Object.keys(TOOL_IMAGES) as ToolType[];

export const ToolItem = ({ tool, size, pathOffsets = [], startDelay = 0 }: ToolItemProps) => {
    // State for Slot Effect
    const [displayType, setDisplayType] = useState<ToolType>('wood');
    const [isSpinning, setIsSpinning] = useState(true);
    const [overflowState, setOverflowState] = useState<'hidden' | 'visible'>('hidden');
    const [zIndexState, setZIndexState] = useState(1); // Low Z-index during spin

    const translateY = useSharedValue(-size * 1.5);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const flashOpacity = useSharedValue(0); // For TNT Prime effect

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const innerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ]
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
        backgroundColor: '#fff', // White flash
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: size / 2, // Circular flash
    }));

    useEffect(() => {
        // 1. SLOT SPIN ANIMATION (Image Cycling)
        const spinInterval = setInterval(() => {
            const randomType = TOOL_TYPES[Math.floor(Math.random() * TOOL_TYPES.length)];
            setDisplayType(randomType);
        }, 120); // Slower spin for visibility

        // 2. ENTRANCE SLIDE (Physical Movement)
        setZIndexState(1); // Low Z-index ensure inside "cell" feel
        opacity.value = 1;
        scale.value = 1;
        flashOpacity.value = 0; // Reset flash
        translateY.value = -size * 1.5;
        rotation.value = 0;

        translateY.value = withTiming(0, {
            duration: ENTRANCE_DURATION,
            easing: Easing.out(Easing.back(1.0))
        }, (finished) => {
            if (finished) {
                runOnJS(setOverflowState)('visible');
            }
        });

        // 2.1 POP EFFECT (Stop & Scale)
        // Happens right after entrance finishes to emphasize the "Stop"
        if (tool) {
            scale.value = withDelay(ENTRANCE_DURATION, withSequence(
                withTiming(1.2, { duration: 150, easing: Easing.out(Easing.quad) }),
                withTiming(1, { duration: 150, easing: Easing.in(Easing.quad) })
            ));
        }

        // 3. STOP SPIN & START MINING
        const spinStopTimer = setTimeout(() => {
            clearInterval(spinInterval);
            setIsSpinning(false);

            if (tool) {
                setDisplayType(tool.type);
            }
        }, ENTRANCE_DURATION);

        // 4. MINING LOGIC
        let miningTimer: NodeJS.Timeout;

        if (tool) {
            const HIT_DURATION = TOOL_HIT_DURATION;
            // Delay = Entrance (1500) + PresentationWindow (500) + Logic Delay
            const miningStartDelay = startDelay + ENTRANCE_DURATION + PRESENTATION_DURATION;

            miningTimer = setTimeout(() => {
                setOverflowState('visible');
                setZIndexState(100); // Pop to top for mining action!
                console.log('ToolItem: starting mining NOW');

                if (pathOffsets.length === 0) {
                    opacity.value = withTiming(0, { duration: 300 });
                    return;
                }

                if (tool.type === 'tnt') {
                    const targetY = pathOffsets[0];

                    // 1. DROP (0ms -> 400ms)
                    translateY.value = withTiming(targetY, { duration: 400, easing: Easing.in(Easing.quad) });

                    // 2. PRIME (400ms -> 800ms)
                    // Stop, Pulse Scale, Flash White/Red
                    scale.value = withDelay(400, withSequence(
                        withTiming(1.3, { duration: 200 }), // Swell
                        withTiming(1.0, { duration: 200 })  // Shrink
                    ));
                    flashOpacity.value = withDelay(400, withSequence(
                        withTiming(0.8, { duration: 200 }), // Flash On
                        withTiming(0, { duration: 200 })    // Flash Off
                    ));

                    // 3. EXPLODE (800ms -> 1300ms)
                    // Big Boom
                    scale.value = withDelay(800, withTiming(5, { duration: 500, easing: Easing.out(Easing.quad) }));
                    opacity.value = withDelay(900, withTiming(0, { duration: 400 })); // Fade out mid-explosion
                } else if (tool.uses > 0) {
                    rotation.value = withRepeat(
                        withSequence(
                            withTiming(-60, { duration: HIT_DURATION / 2 }),
                            withTiming(90, { duration: HIT_DURATION / 4 }),
                            withTiming(0, { duration: HIT_DURATION / 4 })
                        ),
                        Math.min(tool.uses, pathOffsets.length),
                        false
                    );

                    const sequence: any[] = [];
                    pathOffsets.forEach(target => {
                        sequence.push(withTiming(target, { duration: HIT_DURATION * 0.3, easing: Easing.out(Easing.quad) }));
                        sequence.push(withTiming(target, { duration: HIT_DURATION * 0.7 }));
                    });
                    translateY.value = withSequence(...sequence);

                    const totalMiningDuration = pathOffsets.length * HIT_DURATION;
                    opacity.value = withDelay(totalMiningDuration, withTiming(0, { duration: 300 }));
                }
            }, miningStartDelay);
        }

        return () => {
            clearInterval(spinInterval);
            clearTimeout(spinStopTimer);
            if (miningTimer) clearTimeout(miningTimer);
        };

    }, [tool?.id]);

    // RENDER
    // If we are finished spinning and there is no tool, show empty space
    if (!isSpinning && !tool) {
        return <View style={{ width: size, height: size }} />;
    }

    return (
        <Animated.View style={[
            styles.container,
            { width: size, height: size, overflow: overflowState, zIndex: zIndexState, elevation: zIndexState },
            containerAnimatedStyle
        ]}>
            <Animated.View style={[styles.innerContainer, innerAnimatedStyle]}>
                <Image
                    source={TOOL_IMAGES[displayType]}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Animated.View style={flashStyle} />

                {/* Badge logic: Show only if real tool is finalized and spinning stopped */}
                {tool && !isSpinning && tool.type !== 'tnt' && tool.type !== 'eye' && (
                    <Animated.View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>x{tool.uses}</Text>
                    </Animated.View>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // position: 'absolute' REMOVED to allow Flex layout in Row
    },
    innerContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '80%',
        height: '80%',
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
