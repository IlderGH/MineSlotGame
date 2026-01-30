import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Audio } from 'expo-av';
import { SOUNDS } from '../constants/assets';

type SoundContextType = {
    isPlaying: boolean;
    isMuted: boolean;
    musicVolume: number;
    sfxVolume: number;
    toggleMute: () => void;
    setMusicVolume: (v: number) => void;
    setSfxVolume: (v: number) => void;
    playSound: (name: string) => Promise<void>;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
    // Music State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // Separate Volumes
    const [musicVolume, setMusicVolumeState] = useState(0.3);
    const [sfxVolume, setSfxVolumeState] = useState(1.0);

    const soundRef = useRef<Audio.Sound | null>(null); // Background Music
    const sfxRefs = useRef<Record<string, Audio.Sound>>({}); // Preloaded SFX

    // Init Audio & Load Sounds
    useEffect(() => {
        const init = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                });

                // Load Background Music
                await loadBackgroundMusic();

                // Preload SFX
                await preloadSound('egg_crack');
                await preloadSound('win_items');
                await preloadSound('game_start');
                await preloadSound('win_bonus');


            } catch (e) {
                console.error("Audio init error", e);
            }
        };
        init();

        return () => {
            // Unload Music
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            // Unload SFX
            Object.values(sfxRefs.current).forEach(async (s) => {
                try { await s.unloadAsync(); } catch (e) { }
            });
        };
    }, []);

    const preloadSound = async (name: string) => {
        try {
            const source = SOUNDS[name as keyof typeof SOUNDS];
            if (!source) return;
            const { sound } = await Audio.Sound.createAsync(source);
            sfxRefs.current[name] = sound;
        } catch (e) {
            console.error(`Failed to preload ${name}`, e);
        }
    };

    const loadBackgroundMusic = async () => {
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                SOUNDS.background,
                { isLooping: true, volume: musicVolume * 0.5, shouldPlay: !isMuted } // Slightly lower base for bg
            );
            soundRef.current = newSound;
            setSound(newSound);
        } catch (e) {
            console.error("Failed to load bg music", e);
        }
    };

    const setMusicVolume = async (v: number) => {
        setMusicVolumeState(v);
        if (soundRef.current) {
            // Appears softer than SFX usually
            await soundRef.current.setVolumeAsync(v * 0.5);
        }
    };

    const setSfxVolume = (v: number) => {
        setSfxVolumeState(v);
    };

    // Handle Mute Toggle
    const toggleMute = async () => {
        if (!soundRef.current) return;

        if (isMuted) {
            await soundRef.current.setIsMutedAsync(false);
            if (musicVolume > 0) await soundRef.current.playAsync();
            setIsMuted(false);
        } else {
            await soundRef.current.setIsMutedAsync(true);
            setIsMuted(true);
        }
    };

    const playSound = async (name: string) => {
        if (isMuted) return;

        // 1. Try Preloaded Sound First (Zero Latency)
        const preloaded = sfxRefs.current[name];
        if (preloaded) {
            try {
                // To replay immediately, we replay from 0
                await preloaded.stopAsync();
                await preloaded.setVolumeAsync(sfxVolume);
                await preloaded.playFromPositionAsync(0);
                return;
            } catch (e) {
                console.warn(`Error playing preloaded ${name}, falling back`, e);
            }
        }

        // 2. Fallback: Load & Play (Higher Latency)
        try {
            const soundSource = SOUNDS[name as keyof typeof SOUNDS];
            if (!soundSource) return;

            const { sound: sfx } = await Audio.Sound.createAsync(
                soundSource,
                { shouldPlay: true, volume: sfxVolume }
            );

            sfx.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sfx.unloadAsync();
                }
            });
        } catch (error) {
            console.error("Failed to play sound", name, error);
        }
    };

    return (
        <SoundContext.Provider value={{
            isPlaying: !isMuted,
            isMuted,
            musicVolume,
            sfxVolume,
            toggleMute,
            setMusicVolume,
            setSfxVolume,
            playSound
        }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) throw new Error("useSound must be used within SoundProvider");
    return context;
};
