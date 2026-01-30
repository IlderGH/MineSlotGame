import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import VolumeControl from '../components/VolumeControl';
import { useSound } from '../context/SoundContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { playSound } = useSound();

    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container}>
            <StatusBar style="light" />

            {/* VOLUMEN TOP RIGHT */}
            {/* Volume Control */}
            <VolumeControl />

            <View style={styles.content}>
                <Image
                    source={require('../assets/LogoTitulo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                        playSound('game_start');
                        navigation.navigate('Game');
                    }}
                >
                    <Text style={styles.playText}>JUGAR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Info')}
                >
                    <Text style={styles.linkText}>+README</Text>
                </TouchableOpacity>

            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
        paddingBottom: 50,
        justifyContent: 'center'
    },
    logo: {
        width: '80%',    // Ocupa el 80% del ancho de la pantalla
        height: 300,     // Ajusta esta altura según tu imagen
        marginBottom: 5,
    },
    spacer: {
        height: 20
    },
    playButton: {
        backgroundColor: '#05DF72',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 6,
        elevation: 5,
        // Efecto Relieve (Botón 3D)
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.5)',
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(255,255,255,0.5)',
        borderBottomWidth: 4,
        borderBottomColor: 'rgba(0,0,0,0.3)',
        borderRightWidth: 4,
        borderRightColor: 'rgba(0,0,0,0.3)',
    },
    playText: {
        color: 'white',
        fontSize: 28,
        fontFamily: 'Minecraft',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2
    },
    linkButton: {
        marginTop: 20
    },
    linkText: {
        color: '#525252',
        fontSize: 18,
        fontFamily: 'Minecraft',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    soundBtn: {
        marginTop: 30,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20
    },
    topRightContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    volumePanel: {
        marginTop: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#555',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5
    }
});
