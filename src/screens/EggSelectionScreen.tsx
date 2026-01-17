import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SLOT_IMAGES } from '../constants/assets';

const { width, height } = Dimensions.get('window');

export default function EggSelectionScreen({ navigation, route }: any) {
    const { apuesta } = route.params;

    const handleEggPick = () => {
        const outcomes = [7, 10, 13];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];

        Alert.alert("¡PREMIO!", `¡Has conseguido ${result} Tiros Gratis!`, [
            {
                text: "JUGAR",
                onPress: () => {
                    navigation.replace('Funsion', { tiros: result, apuesta: apuesta });
                }
            }
        ]);
    };

    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container}>
            <View style={styles.overlay}>
                <Text style={styles.title}>¡ELIGE UN HUEVO!</Text>
                <Text style={styles.subtitle}>Descubre tus tiros gratis</Text>

                <View style={styles.eggsContainer}>
                    {[1, 2, 3].map((i) => (
                        <TouchableOpacity key={i} onPress={handleEggPick} style={styles.eggButton}>
                            <Image source={SLOT_IMAGES['egg']} style={styles.eggImage} resizeMode="contain" />
                            <Text style={styles.eggLabel}>?</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <StatusBar style="light" />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        color: '#FFD700',
        fontSize: 32,
        fontFamily: 'Minecraft',
        marginBottom: 10,
        textShadowColor: 'black',
        textShadowRadius: 4,
        textAlign: 'center'
    },
    subtitle: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Minecraft',
        marginBottom: 50,
        textAlign: 'center'
    },
    eggsContainer: {
        flexDirection: 'row',
        gap: 20
    },
    eggButton: {
        alignItems: 'center',
        padding: 10
    },
    eggImage: {
        width: 100,
        height: 120
    },
    eggLabel: {
        color: 'white',
        fontSize: 24,
        marginTop: 10,
        fontFamily: 'Minecraft'
    }
});
