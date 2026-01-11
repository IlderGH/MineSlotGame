import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
}

export const BlockItem = ({ type, size, currentHealth, maxHealth, isDestroyed }: BlockItemProps) => {
    const imageSource = BLOCK_IMAGES[type];

    // Cálculo del porcentaje de vida (0.0 a 1.0)
    const healthPercentage = currentHealth / maxHealth;

    // Lógica de decisión de grietas
    let overlaySource = null;

    // Si la vida es 0 o menos, asumimos destruido.
    // Retornamos una View vacía del mismo tamaño para no romper el Grid
    if (currentHealth <= 0) {
        return <View style={{ width: size, height: size }} />;
    }
    // Si tiene menos del 66% de vida pero más del 33%, grieta leve
    if (healthPercentage <= 0.66 && healthPercentage > 0.33) {
        overlaySource = CRACK_IMAGES.state1;
    }
    // Si tiene menos del 33% de vida, grieta severa
    else if (healthPercentage <= 0.33 && healthPercentage > 0) {
        overlaySource = CRACK_IMAGES.state2;
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>


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

        </View>
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