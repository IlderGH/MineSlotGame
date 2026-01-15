import React, { useEffect } from 'react';
import { Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    withRepeat,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { SLOT_IMAGES } from '../constants/assets';

interface SlotSymbolProps {
    symbol: string;
    size: number;
    status: 'falling' | 'idle' | 'winning' | 'disappearing';
    delay?: number;
    index?: number; // For stagger effect
}

export const SlotSymbol = ({ symbol, size, status, delay = 0, index = 0 }: SlotSymbolProps) => {
    const translateY = useSharedValue(status === 'falling' ? -500 : 0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);

    const imageSource = SLOT_IMAGES[symbol] || SLOT_IMAGES['item_1']; // Fallback

    useEffect(() => {
        // Reset (reuse handling)
        if (status === 'falling') {
            translateY.value = -500;
            scale.value = 1;
            rotation.value = 0;
            opacity.value = 1; // Ensure visibility

            // Staggered Drop
            translateY.value = withDelay(
                delay + (index * 50),
                withTiming(0, { duration: 600, easing: Easing.bounce }) // Bounce effect for "landing"
            );
        } else if (status === 'winning') {
            // Pulse & Rotate
            scale.value = withRepeat(withTiming(1.2, { duration: 300 }), 4, true);
            rotation.value = withRepeat(
                withSequence(
                    withTiming(-5, { duration: 100 }),
                    withTiming(5, { duration: 100 })
                ),
                4,
                true
            );
        } else if (status === 'disappearing') {
            // Expand & Fade
            scale.value = withTiming(1.5, { duration: 300 });
            opacity.value = withTiming(0, { duration: 300 });
        } else {
            // Idle
            translateY.value = 0;
            scale.value = 1;
            rotation.value = 0;
            opacity.value = 1;
        }
    }, [status, delay, index]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotation.value}deg` }
            ],
            opacity: opacity.value
        };
    });

    return (
        <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
            <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '80%',
        height: '80%',
    }
});
