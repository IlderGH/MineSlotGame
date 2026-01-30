import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSound } from '../context/SoundContext';

export default function VolumeControl() {
    const { musicVolume, setMusicVolume, sfxVolume, setSfxVolume } = useSound();
    const [showVolumeControl, setShowVolumeControl] = useState(false);

    // Local state for smooth sliding
    const [localMusic, setLocalMusic] = useState(musicVolume);
    const [localSfx, setLocalSfx] = useState(sfxVolume);

    // Refs to track dragging state
    const isSlidingMusic = useRef(false);
    const isSlidingSfx = useRef(false);

    // Sync local state ONLY if not sliding
    useEffect(() => {
        if (!isSlidingMusic.current) setLocalMusic(musicVolume);
    }, [musicVolume]);

    useEffect(() => {
        if (!isSlidingSfx.current) setLocalSfx(sfxVolume);
    }, [sfxVolume]);

    return (
        <View style={styles.topRightContainer}>
            <TouchableOpacity
                onPress={() => setShowVolumeControl(!showVolumeControl)}
                style={styles.iconButton}
            >
                <Ionicons
                    name="settings-sharp"
                    size={24}
                    color="white"
                />
            </TouchableOpacity>

            {showVolumeControl && (
                <View style={styles.volumePanel}>
                    {/* Music Slider */}
                    <View style={styles.sliderRow}>
                        <TouchableOpacity onPress={() => setMusicVolume(musicVolume > 0 ? 0 : 0.5)}>
                            <Ionicons
                                name={musicVolume > 0 ? "musical-notes" : "musical-notes-outline"}
                                size={20}
                                color={musicVolume > 0 ? "white" : "#888"}
                                style={{ marginRight: 5 }}
                            />
                        </TouchableOpacity>
                        <Slider
                            style={{ width: 150, height: 40 }}
                            minimumValue={0}
                            maximumValue={1}
                            minimumTrackTintColor="#05DF72"
                            maximumTrackTintColor="#FFFFFF"
                            thumbTintColor="#FFD700"
                            value={localMusic}
                            onSlidingStart={() => { isSlidingMusic.current = true; }}
                            onSlidingComplete={(v) => {
                                isSlidingMusic.current = false;
                                setMusicVolume(v);
                            }}
                            onValueChange={(v) => {
                                setLocalMusic(v);
                            }}
                        />
                    </View>

                    {/* SFX Slider */}
                    <View style={styles.sliderRow}>
                        <TouchableOpacity onPress={() => setSfxVolume(sfxVolume > 0 ? 0 : 1.0)}>
                            <Ionicons
                                name={sfxVolume > 0 ? "flash" : "flash-outline"}
                                size={20}
                                color={sfxVolume > 0 ? "white" : "#888"}
                                style={{ marginRight: 5 }}
                            />
                        </TouchableOpacity>
                        <Slider
                            style={{ width: 150, height: 40 }}
                            minimumValue={0}
                            maximumValue={1}
                            minimumTrackTintColor="#05DF72"
                            maximumTrackTintColor="#FFFFFF"
                            thumbTintColor="#FF4500"
                            value={localSfx}
                            onSlidingStart={() => { isSlidingSfx.current = true; }}
                            onSlidingComplete={(v) => {
                                isSlidingSfx.current = false;
                                setSfxVolume(v);
                            }}
                            onValueChange={(v) => {
                                setLocalSfx(v);
                            }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    topRightContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 999, // High zIndex ensuring visibility
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
