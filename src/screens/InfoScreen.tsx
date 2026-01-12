import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export const InfoScreen = ({ navigation }: any) => {
    const [info, setInfo] = useState('');

    const handleSave = () => {
        Alert.alert("Guardado", "La información ha sido registrada: " + info);
        // Aquí podrías guardar en AsyncStorage o enviar a una base de datos
        navigation.goBack(); // Regresa a la pantalla anterior
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Agregar Información</Text>

            <Text style={styles.label}>Escribe tus datos:</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: Nombre del jugador..."
                placeholderTextColor="#666"
                value={info}
                onChangeText={setInfo}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>GUARDAR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Cancelar</Text>
            </TouchableOpacity>

            <StatusBar style="light" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        color: '#FFD700',
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        fontFamily: 'Minecraft', // Usamos tu fuente personalizada
    },
    label: {
        color: 'white',
        fontSize: 18,
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#222',
        color: 'white',
        padding: 15,
        borderRadius: 10,
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#444',
        marginBottom: 30,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 15,
        alignItems: 'center',
    },
    backText: {
        color: '#f44336',
        fontSize: 16,
    }
});