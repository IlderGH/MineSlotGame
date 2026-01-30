import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const STORAGE_KEY = 'user_credits_v1';
const INITIAL_CREDITS = 250;

// Definimos la interfaz del hook para validación de tipos
interface UseCredits {
    credits: number;
    loading: boolean;
    updateCredits: (newAmount: number) => Promise<void>;
}

export function useCredits(): UseCredits {
    const [credits, setCreditsState] = useState<number>(INITIAL_CREDITS);
    const [loading, setLoading] = useState<boolean>(true);

    // Cargar créditos al montar el componente
    useEffect(() => {
        const loadCredits = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedValue !== null) {
                    setCreditsState(parseFloat(storedValue));
                } else {
                    // Si no existe, usamos el inicial
                    setCreditsState(INITIAL_CREDITS);
                }
            } catch (error) {
                console.error("Error loading credits:", error);
            } finally {
                setLoading(false);
            }
        };

        loadCredits();
    }, []);

    // Función para actualizar estado y persistencia
    const updateCredits = async (newAmount: number) => {
        setCreditsState(newAmount);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, newAmount.toString());
        } catch (error) {
            console.error("Error saving credits:", error);
        }
    };

    // Mecánica de Bancarrota
    useEffect(() => {
        // Ejecutar solo si ya terminó de cargar y los créditos son muy bajos
        if (!loading && credits <= 0) {
            Alert.alert(
                "¡Sin fondos!",
                "Uy, demasiado salado, aquí tienes mas créditos para continuar con tu vicio",
                [
                    {
                        text: "Recibir",
                        onPress: () => updateCredits(250) // Reiniciar saldo
                    }
                ],
                { cancelable: false } // Obligar a aceptar
            );
        }
    }, [credits, loading]);

    return { credits, loading, updateCredits };
}
