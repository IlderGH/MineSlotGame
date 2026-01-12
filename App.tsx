import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, SafeAreaView, TouchableOpacity, TextInput, Alert, ImageBackground, Image } from 'react-native';
import { BlockItem } from './src/components/BlockItem';
import { ToolItem } from './src/components/ToolItem';
import { WinAnimation } from './src/components/WinAnimation';
import { GRID_COLS, TOOL_HIT_DURATION, ENTRANCE_DURATION, PRESENTATION_DURATION } from './src/constants/gameRules';
import { useGame } from './src/hooks/useGame';
import { useState, useMemo, useEffect, useCallback } from 'react';

import * as SplashScreen from 'expo-splash-screen'; // <--- Importar esto
import { useFonts } from 'expo-font';               // <--- Importar esto

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 30) / GRID_COLS;

export default function App() {

  // 1. Hook para cargar fuentes
  const [fontsLoaded] = useFonts({
    // 'NombreQueUsaras': require('RutaDelArchivo')
    'Minecraft': require('./src/assets/fonts/minecraft_font.ttf'),
  });

  const {
    grid, tools, multipliers,
    betAmount, spinsRemaining, totalWin,
    gameState, startGame, resetGame, spin,
    isAnimating
  } = useGame();

  // 2. Efecto para ocultar el Splash Screen cuando la fuente esté lista
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 3. Si la fuente no ha cargado, no renderizamos nada todavía
  if (!fontsLoaded) {
    return null;
  }



  /* Removed showWinAnim state and effect to prevent flashes. WinAnimation is now the primary view for wins. */
  const [inputBet, setInputBet] = useState('');

  // Calculate destruction delays map for efficient lookup during render
  const destructionDelays = useMemo(() => {
    const delays: Record<string, number> = {};
    if (gameState === 'PLAYING') {
      tools.forEach((row, rowIndex) => {
        row.forEach((slot, colIndex) => {
          if (slot.tool && slot.plannedPath) {
            slot.plannedPath.forEach((gridRow, stepIndex) => {
              // TNT: Drop (400) + Prime(400) + Explode(100+) -> Break at ~900ms (1.1-1.2x)
              // Pickaxe: Swing hits at ~600ms (0.75). We want break slightly early/on-time. 0.7 feels good.
              const hitOffsetRatio = slot.tool?.type === 'tnt' ? 1.2 : 0.7;
              // Add PRESENTATION_DURATION to sync with tool Pause
              const impactTime = (slot.startDelay || 0) + ENTRANCE_DURATION + PRESENTATION_DURATION + (stepIndex * TOOL_HIT_DURATION) + (TOOL_HIT_DURATION * hitOffsetRatio);

              if (grid[gridRow] && grid[gridRow][colIndex]) {
                const blockId = grid[gridRow][colIndex].id;
                delays[blockId] = impactTime;
              }
            });
          }
        });
      });
    }
    console.log(`[App] Calculated ${Object.keys(delays).length} destruction delays.`);
    return delays;
  }, [tools, grid, gameState]);

  const handleStart = () => {
    const amount = parseInt(inputBet);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    Alert.alert(
      "¡Juego Iniciado!",
      "Tienes 10 tiros para romper los bloques. ¡Buena suerte!",
      [
        { text: "¡Vamos!", onPress: () => startGame(amount) }
      ]
    );
  };



  return (
    <ImageBackground source={require('./src/assets/fondo1.png')} style={styles.container} resizeMode="cover">
      <SafeAreaView style={styles.safeArea} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        {gameState === 'BETTING' && (
          <View style={styles.centerContent}>
            <Image
              source={require('./src/assets/LogoTitulo.png')} // <--- Asegúrate que el nombre coincida
              style={styles.gameLogo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Ingresa tu apuesta</Text>
            <TextInput
              style={styles.input}
              placeholder="$0"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={inputBet}
              onChangeText={setInputBet}
            />
            <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={handleStart}>
              <Text style={styles.buttonText}>JUGAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'PLAYING' && (
          <>
            <View style={styles.header}>
              <Text style={styles.infoText}>Apuesta: ${betAmount}</Text>
              <Text style={styles.infoText}>Tiros: {spinsRemaining}</Text>
            </View>

            {/* Herramientas */}
            <View style={styles.toolsContainer}>
              {tools.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.toolsRow, { zIndex: tools.length - rowIndex, elevation: tools.length - rowIndex }]}>
                  {row.map((slot, colIndex) => {
                    const itemKey = slot.tool ? slot.tool.id : `empty-${rowIndex}-${colIndex}`;

                    if (!slot.tool) return <ToolItem key={itemKey} tool={null} size={ITEM_SIZE} />;

                    const rowPath = slot.plannedPath || [];
                    const rowsBelow = (tools.length - 1) - rowIndex;
                    const extraDistance = rowsBelow * ITEM_SIZE;


                    const pathOffsets = rowPath.map(gridRowIndex => {
                      return 60 + (gridRowIndex * ITEM_SIZE) + extraDistance;
                    });

                    return (
                      <ToolItem
                        key={itemKey}
                        tool={slot.tool}
                        size={ITEM_SIZE}
                        pathOffsets={pathOffsets}
                        startDelay={slot.startDelay}
                      />
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.separator} />

            {/* Grid de Bloques */}
            <View style={styles.gridContainer}>
              {grid.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((block) => (
                    <BlockItem
                      key={block.id}
                      type={block.type}
                      currentHealth={block.currentHealth}
                      maxHealth={block.maxHealth}
                      isDestroyed={block.isDestroyed}
                      size={ITEM_SIZE}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Multiplicadores */}
            <View style={styles.multipliersRow}>
              {multipliers.map((mult, index) => (
                <View key={index} style={[styles.multBox, { width: ITEM_SIZE }]}>
                  <Text style={styles.multText}>x{mult}</Text>
                </View>
              ))}
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#f44336' }, isAnimating && styles.buttonDisabled]}
                onPress={resetGame}
                disabled={isAnimating}
              >
                <Text style={styles.buttonText}>SALIR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isAnimating && styles.buttonDisabled]}
                onPress={spin}
                disabled={isAnimating}
              >
                <Text style={styles.buttonText}>GIRAR</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {gameState === 'FINISHED' && (
          totalWin > 0 ? (
            <WinAnimation
              multipliers={multipliers}
              betAmount={betAmount}
              onReset={resetGame}
            />
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.title}>¡Juego Terminado!</Text>
              <Text style={styles.resultText}>Suerte para la proxima!</Text>

              <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={resetGame}>
                <Text style={styles.buttonText}>INTENTAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )
        )}

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 40,
    fontFamily: 'Minecraft',
    color: '#FFD700',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    color: '#525252',
    fontFamily: 'Minecraft',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#E7E6E0',
    color: '#525252',
    fontSize: 24,
    padding: 15,
    width: '60%',
    borderRadius: 5,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#737373',
    fontFamily: 'Minecraft',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 10,
    marginTop: 30, // SafeArea spacing
    zIndex: 2000, // Ensure header is ALWAYS on top of flying tools (zIndex 100)
    elevation: 2000,
    backgroundColor: '#121212', // Opaque background to hide tools passing under? Or transparent?
    // User said "appear above". Transparent is fine if tools are truly behind. 
    // If tools slide "over" the area, we need higher Z. 
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Minecraft',
  },
  moneyText: {
    color: '#00FF00',
    fontSize: 30,
    fontFamily: 'Minecraft',
  },
  resultText: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
  toolsContainer: {
    position: 'relative', // Restore flow so it pushes grid down
    width: '100%',
    zIndex: 100, // Ensure tools are above grid for animation
    elevation: 100, // Android support
    overflow: 'visible',
    marginBottom: 10,
    // backgroundColor: 'rgba(255,0,0,0.2)', // Debug
  },
  toolsRow: {
    flexDirection: 'row',
    backgroundColor: '#333',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 5, // Spacing between tool rows
    overflow: 'visible' // Ensure tools dropping out of row aren't clipped
  },
  separator: { height: 2, width: '90%', backgroundColor: '#555', marginBottom: 10 },
  gridContainer: {
    marginBottom: 5,
    zIndex: 0,
    elevation: 0,
  },
  row: { flexDirection: 'row' },

  multipliersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  multBox: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
  },
  multText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Minecraft',
  },

  controls: { flexDirection: 'row', gap: 20 },
  button: {
    backgroundColor: '#05DF72',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 5,
    fontFamily: 'Minecraft',
  },
  buttonStart: {
    backgroundColor: '#05DF72',
    width: '70%',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 50,
    marginVertical: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#737373',
    fontFamily: 'Minecraft',
  },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#F8FAFC', fontSize: 19, fontFamily: 'Minecraft' },

  gameLogo: {
    width: '80%',    // Ocupa el 80% del ancho de la pantalla
    height: 300,     // Ajusta esta altura según tu imagen
    marginBottom: 5,
  },

});