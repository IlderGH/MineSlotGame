
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    Easing,
    withDelay,
    runOnJS
} from 'react-native-reanimated';
import { Tool } from '../types/game';
import { TOOL_IMAGES } from '../constants/assets';
import { TOOL_HIT_DURATION, ENTRANCE_DURATION } from '../constants/gameRules';

interface ToolItemProps {
    tool: Tool | null;
    size: number;
    pathOffsets?: number[];
    startDelay?: number;
}

export const ToolItem = ({ tool, size, pathOffsets = [], startDelay = 0 }: ToolItemProps) => {
    const translateY = useSharedValue(-size * 1.5);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    // Dynamic overflow to allow entrance masking but permit mining movement
    const [overflowState, setOverflowState] = useState<'hidden' | 'visible'>('hidden');

    const containerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const innerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { rotate: `${rotation.value}deg` },
                { scale: scale.value }
            ],
        };
    });

    useEffect(() => {
        if (!tool) {
            opacity.value = 0;
            return;
        }

        console.log('ToolItem: scheduling animation', { type: tool.type, delay: startDelay });

        // 1. SETUP / ENTRANCE
        setOverflowState('hidden');
        opacity.value = 1;
        scale.value = 1;

        // Reset and Slide In
        translateY.value = -size * 1.5;
        rotation.value = 0;

        translateY.value = withTiming(0, {
            duration: ENTRANCE_DURATION,
            easing: Easing.out(Easing.back(1.5))
        }, (finished) => {
            if (finished) {
                runOnJS(setOverflowState)('visible');
            }
        });

        // 2. MINING SCHEDULE
        const HIT_DURATION = TOOL_HIT_DURATION;
        const miningStartDelay = startDelay + ENTRANCE_DURATION;

        const timer = setTimeout(() => {
            console.log('ToolItem: starting mining NOW');

            // Si no hay camino (no hay bloques), solo desvanecemos la herramienta sin animación de golpe
            if (pathOffsets.length === 0) {
                opacity.value = withTiming(0, { duration: 300 });
                return;
            }

            if (tool.type === 'tnt') {
                // --- TNT ANIMATION ---
                // 1. Drop to the block
                const targetY = pathOffsets[0]; // Seguro porque length > 0
                translateY.value = withTiming(targetY, { duration: HIT_DURATION * 0.5, easing: Easing.in(Easing.quad) });

                // 2. Explode (Scale Up) and Fade Out
                scale.value = withDelay(HIT_DURATION * 0.5, withTiming(2.5, { duration: 300, easing: Easing.out(Easing.quad) }));
                opacity.value = withDelay(HIT_DURATION * 0.5 + 100, withTiming(0, { duration: 200 }));

            } else if (tool.uses > 0) {
                // --- NORMAL TOOL ANIMATION ---
                // ROTATION SEQUENCE
                rotation.value = withRepeat(
                    withSequence(
                        withTiming(-60, { duration: HIT_DURATION / 2 }),
                        withTiming(30, { duration: HIT_DURATION / 4 }),
                        withTiming(0, { duration: HIT_DURATION / 4 })
                    ),
                    // Si el path es más corto que los usos (ej. rompió todo antes), limitamos la animación visual
                    Math.min(tool.uses, pathOffsets.length),
                    false
                );

                // MOVEMENT SEQUENCE
                const sequence: any[] = [];
                pathOffsets.forEach(target => {
                    // 1. Move to block (Fast Drop)
                    sequence.push(withTiming(target, { duration: HIT_DURATION * 0.3, easing: Easing.out(Easing.quad) }));
                    // 2. Stay on block (Hold) whie hitting
                    sequence.push(withTiming(target, { duration: HIT_DURATION * 0.7 }));
                });
                translateY.value = withSequence(...sequence);

                // EXIT
                const totalMiningDuration = pathOffsets.length * HIT_DURATION;
                opacity.value = withDelay(totalMiningDuration, withTiming(0, { duration: 300 }));
            }
        }, miningStartDelay);

        return () => clearTimeout(timer);

    }, [tool?.id]);

    if (!tool) {
        return <View style={{ width: size, height: size }} />;
    }

    return (
        <Animated.View style={[styles.container, { width: size, height: size, overflow: overflowState }, containerAnimatedStyle]}>
            <Animated.View style={[styles.innerContainer, innerAnimatedStyle]}>
                <Image
                    source={TOOL_IMAGES[tool.type]}
                    style={styles.image}
                    resizeMode="contain"
                />
            </Animated.View>

            <View style={styles.badge}>
                <Text style={styles.badgeText}>x {tool.uses}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {

        // overflow handled dynamically inline
        justifyContent: 'center',
        alignItems: 'center',
        // zIndex: 10,  <-- Removed to ensure masking works properly within parent context if needed, though for local masking overflow hidden is key.
    },
    innerContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: { width: '80%', height: '80%' },
    badge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        paddingHorizontal: 4,
        zIndex: 20
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});