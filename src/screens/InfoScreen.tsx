import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SLOT_IMAGES, IMAGES_EXTRAS } from '../constants/assets';

export const InfoScreen = ({ navigation }: any) => {

    return (
        <ImageBackground source={require('../assets/fondo1.png')} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar style="light" />

                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>INFORMACION</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>SOBRE EL JUEGO</Text>
                        <Text style={styles.text}>
                            Este es un proyecto recreativo desarrollado con fines de entretenimiento, inspirado en el videojuego Minecraft.
                            {"\n\n"}
                            Este simulador combina la mecánica clásica de las tragamonedas (Slots) con objetos del juego.
                            El objetivo principal es desbloquear la "Ronda de Bono", una función especial donde el objetivo es conseguir herramientas que te ayuden a despejar una "pared" de diversos bloques.
                            Puedes acceder a ella consiguiendo los símbolos SCATTER durante tus giros o comprando el acceso directo para jugar al instante.
                        </Text>
                        <Text style={styles.highlight}>
                            Nota: Aun esta en desarrollo, pero tengo pensado subirlo a la pagina oficial de la herramienta que estoy utilizando para su desarrollo
                            y permitir que cualquiera pueda hacer uso de esta app.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>¿COMO GANAR?</Text>
                        <View style={styles.mechanicRow}>
                            <View style={styles.mechanicIconContainer}>
                                <View style={styles.miniGrid}>
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.miniIcon} />
                                </View>
                            </View>
                            <View style={styles.mechanicTextContainer}>
                                <Text style={styles.text}>
                                    No necesitas lineas de pago.
                                </Text>
                                <Text style={[styles.text, styles.highlight]}>
                                    Consigue 8 o mas simbolos iguales
                                </Text>
                                <Text style={styles.text}>
                                    en cualquier lugar de la pantalla para ganar.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>SIMBOLOS Y VALOR</Text>
                        <Text style={[styles.text, { textAlign: 'center', marginBottom: 15, fontSize: 12 }]}>
                            (De menor a mayor valor)
                        </Text>

                        <View style={styles.paytableGrid}>
                            <View style={styles.paytableColumn}>
                                <Text style={styles.paytableHeader}>COMUNES</Text>
                                <View style={styles.itemRow}>
                                    <Image source={SLOT_IMAGES.item_1} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_2} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_3} style={styles.payIcon} resizeMode="contain" />
                                </View>
                            </View>

                            <View style={styles.paytableColumn}>
                                <Text style={styles.paytableHeader}>VALIOSOS</Text>
                                <View style={styles.itemRow}>
                                    <Image source={SLOT_IMAGES.item_4} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_5} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_6} style={styles.payIcon} resizeMode="contain" />
                                </View>
                            </View>

                            <View style={styles.paytableColumn}>
                                <Text style={[styles.paytableHeader, { color: '#FF4444' }]}>MUY VALIOSOS</Text>
                                <View style={styles.itemRow}>
                                    <Image source={SLOT_IMAGES.item_7} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_8} style={styles.payIcon} resizeMode="contain" />
                                    <Image source={SLOT_IMAGES.item_9} style={styles.payIcon} resizeMode="contain" />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.card, { borderColor: '#05DF72' }]}>
                        <Text style={[styles.cardTitle, { color: '#05DF72' }]}>RONDA DE BONUS</Text>

                        <View style={styles.scatterContainer}>
                            <Image source={IMAGES_EXTRAS.scatters} style={styles.scatterIcon} resizeMode="contain" />
                        </View>

                        <Text style={[styles.text, { textAlign: 'center', marginTop: 10 }]}>
                            Consigue <Text style={styles.highlight}>3 o mas TOTEMS</Text> en un solo giro para activar la funcion de Mineria.
                        </Text>
                        <Text style={[styles.text, { textAlign: 'center', fontSize: 12, opacity: 0.8 }]}>
                            ¡Elige tu suerte y gana Tiros Gratis!
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />

                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 40,
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#555',
    },
    backArrow: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'Minecraft',
        marginTop: -4,
    },
    headerTitle: {
        color: '#FFD700',
        fontSize: 24,
        fontFamily: 'Minecraft',
        textShadowColor: 'black',
        textShadowRadius: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#444',
    },
    cardTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontFamily: 'Minecraft',
        marginBottom: 15,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 10,
    },
    text: {
        color: '#EEE',
        fontFamily: 'Minecraft',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 22,
    },
    highlight: {
        color: '#05DF72',
        fontFamily: 'Minecraft',
        textAlign: 'center',
        fontSize: 16,
    },
    mechanicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    mechanicIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 5,
    },
    miniGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 60,
        gap: 2,
        justifyContent: 'center',
    },
    miniIcon: {
        width: 25,
        height: 25,
    },
    mechanicTextContainer: {
        flex: 1,
    },
    paytableGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paytableColumn: {
        alignItems: 'center',
        flex: 1,
    },
    paytableHeader: {
        color: '#AAA',
        fontFamily: 'Minecraft',
        fontSize: 10,
        marginBottom: 10,
    },
    itemRow: {
        gap: 10,
        alignItems: 'center',
    },
    payIcon: {
        width: 45,
        height: 45,
        marginVertical: 5,
    },
    scatterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 10,
    },
    scatterIcon: {
        width: 160,
        height: 120,
    },
});