import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { BlockType } from '../types/game';
import { BLOCK_IMAGES } from '../constants/assets';
import { CRACK_IMAGES } from '../constants/assets';

// Definimos qué necesita este componente para funcionar
interface BlockItemProps {
    type: BlockType;
    size: number; // El tamaño lo calcularemos desde fuera
    currentHealth: number;
    maxHealth: number;
    isDestroyed?: boolean;
    breakDelay?: number;
}

export const BlockItem = ({ type, size, currentHealth, maxHealth, isDestroyed, breakDelay = 0 }: BlockItemProps) => {
    const imageSource = BLOCK_IMAGES[type];
    const opacity = useSharedValue(isDestroyed && !breakDelay ? 0 : 1);

    // Prevent re-triggering animation on re-renders (which caused "Reappear then Break Late" bug)
    const destructionTriggered = useRef(false);

    // Cálculo del porcentaje de vida (0.0 a 1.0)
    const healthPercentage = currentHealth / maxHealth;

    // Lógica de decisión de grietas
    let overlaySource = null;

    useEffect(() => {
        // Only run animation ONCE per block lifecycle
        if (breakDelay > 0) {
            if (!destructionTriggered.current) {
                destructionTriggered.current = true;
                opacity.value = 1; // Ensure visible start
                // Schedule destruction
                opacity.value = withDelay(breakDelay, withTiming(0, { duration: 50 }));
            }
        }
        // Fallback: If no delay provided (Instant) or logic updated without animation
        else if (isDestroyed && !destructionTriggered.current) {
            opacity.value = 0;
            destructionTriggered.current = true;
        }
    }, [isDestroyed, breakDelay]);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });

    // Si tiene menos del 66% de vida pero más del 33%, grieta leve
    if (healthPercentage <= 0.66 && healthPercentage > 0.33) {
        overlaySource = CRACK_IMAGES.state1;
    }
    // Si tiene menos del 33% de vida (o 0 esperando desaparecer), grieta severa
    else if (healthPercentage <= 0.33) {
        overlaySource = CRACK_IMAGES.state2;
    }

    return (
        <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
            <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
            />
            {overlaySource && (
                <Image
                    source={overlaySource}
                    style={[styles.image, styles.overlay]}
                    resizeMode="contain"
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', // Importante para que los hijos absolutos se posicionen respecto a esto
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute', // Esto hace la magia: lo saca del flujo y lo pone encima
        top: 0,
        left: 0,
        opacity: 1, // Opcional: hacer la grieta un poco transparente para que se funda mejor
    },
    debugText: {
        position: 'absolute',
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowRadius: 3
    }
});