import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay, // Importamos withDelay
    ZoomOut,
    BounceInUp,
} from 'react-native-reanimated';
import { SLOT_IMAGES } from '../constants/assets';

interface SlotSymbolProps {
    symbol: string;
    size: number;
    isWinning: boolean; // Reemplaza 'status' por un booleano simple
    delay?: number; // Para el efecto escalonado (stagger)
}

export const SlotSymbol = ({ symbol, size, isWinning, delay = 0 }: SlotSymbolProps) => {
    // Valores compartidos para la animación de victoria (pulso y rotación)
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const isScatter = symbol === 'scatter';
    const imageSource = SLOT_IMAGES[symbol] || SLOT_IMAGES['item_1']; // Fallback

    // Efecto para activar la animación de victoria cuando isWinning cambia a true
    useEffect(() => {
        if (isWinning) {
            // Animación de pulso
            const targetScale = isScatter ? 1.4 : 1.2;

            // Agregamos un delay de 1000ms (1 segundo) antes de empezar el pulso
            scale.value = withDelay(
                1000,
                withRepeat(withTiming(targetScale, { duration: 250 }), -1, true)
            );

            // Animación de rotación (wobble)
            // Agregamos el mismo delay a la rotación
            rotation.value = withDelay(
                1000,
                withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 100 }),
                        withTiming(5, { duration: 100 })
                    ),
                    -1,
                    true
                )
            );
        } else {
            // Resetear valores si deja de ganar (aunque normalmente se desmontará)
            scale.value = 1;
            rotation.value = 0;
        }
    }, [isWinning]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { rotate: `${rotation.value}deg` }
            ],
        };
    });

    return (
        <Animated.View
            // OUTER VIEW: Layout Animations (Entrance / Exit)
            // entering={BounceInUp.delay(delay).duration(600).springify()}
            // Note: Since we are nesting, we apply the layout prop here.
            entering={BounceInUp.delay(delay).duration(600).springify()}

            // Layout Animation de Salida: Eliminada a petición del usuario
            // exiting={ZoomOut.duration(1000)}

            style={[styles.container, { width: size, height: size }]}
        >
            <Animated.View
                // INNER VIEW: Transform Animations (Win Pulse / Rotation)
                // This separates the transforms from the layout animation to avoid conflicts/warnings.
                style={[styles.innerContainer, animatedStyle]}
            >
                <Image
                    source={imageSource}
                    style={[styles.image, isScatter && styles.scatterImage]}
                    resizeMode="contain"
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
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
    scatterImage: {
        width: '100%',
        height: '100%',
    }
});
