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
    status: 'falling' | 'idle' | 'winning' | 'disappearing' | 'shifting';
    delay?: number;
    index?: number; // For stagger effect
    rowIndex?: number; // For start position optimization
    shiftRows?: number;
    shiftHeight?: number;
}

export const SlotSymbol = ({ symbol, size, status, delay = 0, index = 0, rowIndex = 0, shiftRows = 0, shiftHeight = 0 }: SlotSymbolProps) => {
    const rowHeight = shiftHeight || size;

    const getInitialTranslateY = () => {
        if (status === 'falling') {
            // Optimización: Empezar justo arriba del grid visible para evitar "tiempo muerto"
            // El item cae desde -(su posicion relativa + altura del item + margen)
            // Esto asegura que en t=0 ya está entrando a la pantalla
            return -((rowIndex * rowHeight) + rowHeight + 20);
        }
        if (status === 'shifting') return -(shiftRows * rowHeight);
        return 0;
    };

    const translateY = useSharedValue(getInitialTranslateY());
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);

    const isScatter = symbol === 'scatter';
    const imageSource = SLOT_IMAGES[symbol] || SLOT_IMAGES['item_1']; // Fallback

    useEffect(() => {
        cancelAnimation(translateY);
        cancelAnimation(scale);
        cancelAnimation(rotation);
        cancelAnimation(opacity);

        // Reset (reuse handling)
        if (status === 'falling') {
            // Recalcular posición inicial dinámica
            const startY = -((rowIndex * rowHeight) + rowHeight + 20);
            translateY.value = startY;

            scale.value = 1;
            rotation.value = 0;
            opacity.value = 1;

            // Staggered Drop
            translateY.value = withDelay(
                delay,
                withTiming(0, { duration: 350, easing: Easing.linear }) // Faster drop (requested "increase by half second" roughly)
            );
        } else if (status === 'shifting') {
            // Slide Down from previous position
            translateY.value = -(shiftRows * rowHeight);
            scale.value = 1;
            rotation.value = 0;
            opacity.value = 1;

            translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
        } else if (status === 'winning') {
            // Pulse & Rotate
            // FIX: Ensure it is centered and visible, in case it was falling
            translateY.value = 0;
            opacity.value = 1;

            const targetScale = isScatter ? 1.4 : 1.2;
            scale.value = withRepeat(withTiming(targetScale, { duration: 250 }), -1, true);
            rotation.value = withRepeat(
                withSequence(
                    withTiming(-5, { duration: 100 }),
                    withTiming(5, { duration: 100 })
                ),
                -1,
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
    }, [status, delay, shiftRows, rowHeight]);

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
                style={[styles.image, isScatter && styles.scatterImage]}
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
    },
    scatterImage: {
        width: '100%',
        height: '100%',
    }
});
