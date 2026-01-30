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
                            Este es un proyecto recreativo desarrollado por un ludopata para ludopatas, inspirado en el videojuego Minecraft.
                            {"\n\n"}
                            Este simulador combina la mecánica clásica de las tragamonedas (Slots) con objetos del juego.
                            El objetivo principal es desbloquear la "Ronda de Bono", una función especial donde el objetivo es conseguir herramientas que te ayuden a despejar una "pared" de diversos bloques.
                            Puedes acceder a ella consiguiendo los símbolos SCATTER durante tus giros o comprando el acceso directo para jugar al instante.
                        </Text>
                        <Text style={styles.highlight}>
                            Desarrollado por <Text style={{ color: 'rgba(255, 44, 44, 0.7)', fontStyle: 'italic', fontFamily: 'monospace', fontWeight: 'bold' }}>byRedli</Text>
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

                        <Text style={[styles.text, { textAlign: 'center', marginTop: 10, marginBottom: 20 }]}>
                            Consigue <Text style={styles.highlight}>3 o mas TOTEMS</Text> para entrar a la Mina.
                        </Text>

                        {/* SECCION DE BLOQUES */}
                        <Text style={[styles.cardTitle, { fontSize: 16, color: '#AAA', borderBottomWidth: 0, marginBottom: 5 }]}>VALOR DE LOS BLOQUES</Text>
                        <Text style={[styles.text, { fontSize: 12, marginBottom: 10 }]}>Rompe bloques para ganar dinero directo:</Text>
                        <Text style={[styles.text, { fontSize: 11, marginBottom: 10, color: '#05DF72' }]}>
                            (Los valores aumentan según tu apuesta base)
                        </Text>

                        <View style={styles.blocksGrid}>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_dirt.png')} style={styles.miniBlock3D} />
                                    <Text style={styles.blockName}>Tierra</Text>
                                </View>
                                <Text style={styles.blockValue}>$0.05</Text>
                            </View>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_stone.png')} style={styles.miniBlock3D} />
                                    <Text style={styles.blockName}>Piedra</Text>
                                </View>
                                <Text style={styles.blockValue}>$0.10</Text>
                            </View>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_iron.png')} style={styles.miniBlock3D} />
                                    <Text style={styles.blockName}>Hierro</Text>
                                </View>
                                <Text style={styles.blockValue}>$0.25</Text>
                            </View>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_oro.png')} style={styles.miniBlock3D} />
                                    <Text style={styles.blockName}>Oro</Text>
                                </View>
                                <Text style={styles.blockValue}>$0.50</Text>
                            </View>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_diamond.png')} style={styles.miniBlock3D} />
                                    <Text style={[styles.blockName, { color: '#00FFFF' }]}>Diamante</Text>
                                </View>
                                <Text style={[styles.blockValue, { color: '#00FFFF' }]}>$1.00</Text>
                            </View>
                            <View style={styles.blockRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Image source={require('../assets/blocks/3d_obsidian.png')} style={styles.miniBlock3D} />
                                    <Text style={[styles.blockName, { color: '#AA00AA' }]}>Obsidiana</Text>
                                </View>
                                <Text style={[styles.blockValue, { color: '#AA00AA' }]}>$2.00</Text>
                            </View>
                        </View>

                        <View style={{ height: 20 }} />

                        {/* SECCION DE HERRAMIENTAS */}
                        <Text style={[styles.cardTitle, { fontSize: 16, color: '#AAA', borderBottomWidth: 0, marginBottom: 5 }]}>HERRAMIENTAS</Text>
                        <Text style={[styles.text, { fontSize: 12, marginBottom: 10 }]}>Cada herramienta tiene durabilidad y poder:</Text>

                        <View style={styles.toolsGrid}>
                            <View style={styles.toolRow}>
                                <Text style={styles.toolName}>Madera</Text>
                                <Text style={styles.toolStats}>2 Usos / 1 Daño</Text>
                            </View>
                            <View style={styles.toolRow}>
                                <Text style={styles.toolName}>Piedra</Text>
                                <Text style={styles.toolStats}>3 Usos / 2 Daño</Text>
                            </View>
                            <View style={styles.toolRow}>
                                <Text style={[styles.toolName, { color: '#FFD700' }]}>Oro</Text>
                                <Text style={styles.toolStats}>5 Usos / 1 Daño</Text>
                            </View>
                            <View style={styles.toolRow}>
                                <Text style={[styles.toolName, { color: '#00FFFF' }]}>Diamante</Text>
                                <Text style={styles.toolStats}>8 Usos / 4 Daño</Text>
                            </View>
                            <View style={styles.toolRow}>
                                <Text style={[styles.toolName, { color: '#FF4444' }]}>TNT</Text>
                                <Text style={styles.toolStats}>1 Uso / 10 Daño</Text>
                            </View>
                        </View>

                        <View style={{ height: 20 }} />

                        {/* SECCION DE MULTIPLICADORES */}
                        <Text style={[styles.cardTitle, { fontSize: 16, color: '#AAA', borderBottomWidth: 0, marginBottom: 5 }]}>MULTIPLICADORES</Text>

                        <Text style={[styles.text, { marginBottom: 15 }]}>
                            ¡Despeja una columna completa de bloques para desbloquear el multiplicador oculto!
                        </Text>

                        <View style={styles.mechanicRow}>
                            <View style={[styles.mechanicIconContainer, { borderColor: '#FFA500', borderWidth: 1 }]}>
                                <Text style={{ color: '#FFA500', fontFamily: 'Minecraft', fontSize: 20 }}>x6</Text>
                            </View>
                            <View style={styles.mechanicTextContainer}>
                                <Text style={styles.text}>
                                    Los multiplicadores <Text style={{ color: '#FFA500' }}>ALTOS (x5+)</Text> brillan y tienen un borde rojo.
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.mechanicRow, { marginTop: 10 }]}>
                            <View style={[styles.mechanicIconContainer, { borderColor: '#FFF', borderWidth: 1 }]}>
                                <Text style={{ color: '#FFF', fontFamily: 'Minecraft', fontSize: 20 }}>x2</Text>
                            </View>
                            <View style={styles.mechanicTextContainer}>
                                <Text style={styles.text}>
                                    Los comunes (x2-x4) son estandar.
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.text, { textAlign: 'center', marginTop: 15, fontSize: 12, opacity: 0.8 }]}>
                            Los multiplicadores se suman al final y multiplican tu ganancia total de la ronda.
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
        color: '#05df729c',
        fontFamily: 'Minecraft',
        fontSize: 13,
        marginTop: 15,
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
    blocksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    blockRow: {
        width: '45%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 5,
        borderRadius: 4,
    },
    blockName: {
        color: '#DDD',
        fontFamily: 'Minecraft',
        fontSize: 14,
    },
    blockValue: {
        color: '#05DF72',
        fontFamily: 'Minecraft',
        fontSize: 14,
    },
    miniBlock3D: {
        width: 25,
        height: 25,
        resizeMode: 'contain'
    },
    toolsGrid: {
        gap: 8,
    },
    toolRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 5,
        borderRadius: 4,
        paddingHorizontal: 10,
    },
    toolName: {
        color: '#DDD',
        fontFamily: 'Minecraft',
        fontSize: 14,
    },
    toolStats: {
        color: '#AAA',
        fontFamily: 'Minecraft',
        fontSize: 14,
    },
});