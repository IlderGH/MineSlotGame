import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { SOUNDS } from '../constants/assets';

export const useSoundManager = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    // Initial configuration for Audio Mode
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true, // Allow background music even if switch is silent
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    staysActiveInBackground: false,
                });
            } catch (error) {
                console.error("Error setting audio mode", error);
            }
        };
        configureAudio();
    }, []);

    // Function to play background music
    const playBackgroundMusic = useCallback(async () => {
        try {
            // Unload if exists
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                SOUNDS.background,
                { isLooping: true, volume: 0.5, shouldPlay: true }
            );

            soundRef.current = newSound;
            setSound(newSound);

        } catch (error) {
            console.error("Error playing background music", error);
        }
    }, []);

    // Function to stop music
    const stopMusic = useCallback(async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setSound(null);
            }
        } catch (error) {
            console.error("Error stopping music", error);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    return {
        playBackgroundMusic,
        stopMusic,
        // Future: playSound for SFX
    };
};
