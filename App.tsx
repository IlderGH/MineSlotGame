import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { BlockItem } from './src/components/BlockItem';
import { ToolItem } from './src/components/ToolItem';
import { GRID_COLS, TOOL_HIT_DURATION, ENTRANCE_DURATION, PRESENTATION_DURATION } from './src/constants/gameRules';
import { useGame } from './src/hooks/useGame';
import { useState, useMemo } from 'react';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 30) / GRID_COLS;

export default function App() {
  const {
    grid, tools, multipliers,
    betAmount, spinsRemaining, totalWin,
    gameState, startGame, resetGame, spin,
    isAnimating
  } = useGame();

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
              // Pickaxe: Swing ends at 0.7-0.8. Break at 0.85.
              const hitOffsetRatio = slot.tool?.type === 'tnt' ? 1.2 : 0.85;
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {gameState === 'BETTING' && (
        <View style={styles.centerContent}>
          <Text style={styles.title}>MineSlot</Text>
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
        <View style={styles.centerContent}>
          <Text style={styles.title}>¡Juego Terminado!</Text>
          <Text style={styles.resultText}>Ganaste:</Text>
          <Text style={[styles.moneyText, { fontSize: 50 }]}>${totalWin}</Text>

          <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={resetGame}>
            <Text style={styles.buttonText}>JUGAR DE NUEVO</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    fontSize: 24,
    padding: 15,
    width: '60%',
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 10,
    marginTop: 30, // SafeArea spacing
    zIndex: 102,
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moneyText: {
    color: '#00FF00',
    fontSize: 30,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    fontSize: 16,
  },

  controls: { flexDirection: 'row', gap: 20 },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 5,
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
    width: '60%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 60,
  },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },


});