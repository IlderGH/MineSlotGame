import React, { useEffect } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    Easing,
    withDelay
} from 'react-native-reanimated';
import { Tool } from '../types/game';
import { TOOL_IMAGES } from '../constants/assets';

interface ToolItemProps {
    tool: Tool | null;
    size: number;
}

export const ToolItem = ({ tool, size }: ToolItemProps) => {
    // Valores compartidos para la animación (Estado nativo)
    const translateY = useSharedValue(0); // Movimiento vertical
    const rotation = useSharedValue(0);   // Rotación (el golpe)

    // Definimos cómo se ve el estilo animado
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { rotate: `${rotation.value}deg` } // Rotación en grados
            ],
        };
    });

    useEffect(() => {
        if (!tool) return;

        // CONFIGURACIÓN DE LA ANIMACIÓN
        // Queremos que golpee tantas veces como "usos" tenga.
        // Ojo: Esto es visual. La lógica matemática ya restó la vida.

        // 1. Definimos la duración de un golpe (bajar y subir)
        const HIT_DURATION = 300;

        // 2. Secuencia de Rotación (El "Golpe")
        // Gira a -45deg (prepara), luego a 15deg (golpea fuerte), luego a 0 (vuelve)
        rotation.value = withRepeat(
            withSequence(
                withTiming(-45, { duration: HIT_DURATION / 2 }), // Prepara hacia atrás
                withTiming(15, { duration: HIT_DURATION / 4 }),  // ¡GOLPE RÁPIDO!
                withTiming(0, { duration: HIT_DURATION / 4 })    // Retorno
            ),
            tool.uses, // Repetir X veces (según los usos del pico)
            false // No hacer reverse (no rebobinar)
        );

        // 3. Secuencia de Movimiento (Acercarse al bloque)
        // Baja 20 pixeles para simular que se acerca al grid
        translateY.value = withRepeat(
            withSequence(
                withTiming(20, { duration: HIT_DURATION / 2, easing: Easing.out(Easing.quad) }), // Baja
                withTiming(0, { duration: HIT_DURATION / 2, easing: Easing.in(Easing.quad) })    // Sube
            ),
            tool.uses,
            false
        );

    }, [tool]); // Se ejecuta cada vez que cambia la herramienta (nuevo turno)

    if (!tool) {
        return <View style={{ width: size, height: size }} />;
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Usamos Animated.View en lugar de View normal */}
            <Animated.View style={[styles.innerContainer, animatedStyle]}>
                <Image
                    source={TOOL_IMAGES[tool.type]}
                    style={styles.image}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* El badge de usos lo dejamos estático fuera de la animación para que se lea bien */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{tool.uses}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Para que el pico pase por encima de otras cosas si baja mucho
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