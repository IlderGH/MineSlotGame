import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const { width, height } = Dimensions.get('window');

export default function CustomAlert({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "ACEPTAR",
    cancelText = "CANCELAR"
}: CustomAlertProps) {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.alertBox}>
                {/* Title Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                </View>

                {/* Message Body */}
                <View style={styles.body}>
                    <Text style={styles.message}>{message}</Text>
                </View>

                {/* Buttons Row */}
                <View style={styles.footer}>
                    {onCancel && (
                        <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel}>
                            <Text style={styles.btnText}>{cancelText}</Text>
                        </TouchableOpacity>
                    )}

                    {onConfirm && (
                        <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={onConfirm}>
                            <Text style={styles.btnText}>{confirmText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 1000,
        width: '100%',
        height: '100%',
    },
    alertBox: {
        width: 350,
        backgroundColor: '#C6C6C6', // Base gray for Minecraft UI style
        borderWidth: 2,
        borderRadius: 5,
        borderColor: '#000', // External border
        padding: 4,
        elevation: 10,
    },
    header: {
        padding: 10,
        alignItems: 'center',
    },
    title: {
        color: '#353434ff', // Gold
        fontSize: 20,
        fontFamily: 'Minecraft',
        textShadowColor: '#707070ff',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    body: {
        padding: 20,
        backgroundColor: '#262626', // Dark inner content
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#555', // Inset look
        margin: 5,
    },
    message: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Minecraft',
        textAlign: 'center',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: '#000', // Button border
        borderBottomWidth: 4, // 3D effect
        borderRightWidth: 4,
        borderRadius: 2,
        minWidth: 100,
        alignItems: 'center',
    },
    confirmBtn: {
        backgroundColor: '#72B63B', // Minecraft Green button
        borderColor: '#4A7A25',
    },
    cancelBtn: {
        backgroundColor: '#D13F3F', // Red button
        borderColor: '#8B2828',
    },
    btnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Minecraft',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    }
});
