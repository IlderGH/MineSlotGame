import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { BlockItem } from './src/components/BlockItem';
import { ToolItem } from './src/components/ToolItem';
import { GRID_COLS } from './src/constants/gameRules';
import { useGame } from './src/hooks/useGame';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 20) / GRID_COLS;

export default function App() {
  // Usamos nuestro Custom Hook
  const { grid, tools, money, spin, isAnimating } = useGame();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moneyText}>Dinero: ${money}</Text>
      </View>

      {/* Zona de Herramientas (Arriba) */}
      <View style={styles.toolsRow}>
        {tools.map((slot, index) => (
          <ToolItem key={index} tool={slot.tool} size={ITEM_SIZE} />
        ))}
      </View>

      {/* Separador Visual */}
      <View style={styles.separator} />

      {/* Zona de Bloques (Abajo) */}
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((block) => (
              <BlockItem
                key={block.id}
                type={block.type}
                size={ITEM_SIZE}
                currentHealth={block.currentHealth}
                maxHealth={block.maxHealth}
              />

            ))}
          </View>

        ))}
      </View>

      {/* Botón de Jugar (La Palanca) */}
      <TouchableOpacity
        style={[
          styles.button,
          grid.length === 0 && styles.buttonStart,
          isAnimating && styles.buttonDisabled // Estilo nuevo
        ]}
        onPress={spin}
        disabled={isAnimating} // Propiedad nativa para desactivar toque
      >
        <Text style={styles.buttonText}>
          {isAnimating ? "..." : (grid.length === 0 ? "INICIAR JUEGO" : "GIRAR")}
        </Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginBottom: 20 },
  moneyText: { color: '#FFD700', fontSize: 30, fontWeight: 'bold' },

  toolsRow: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#333', borderRadius: 10 },

  separator: { height: 2, width: '90%', backgroundColor: '#555', marginBottom: 10 },

  gridContainer: { marginBottom: 20 },
  row: { flexDirection: 'row' },

  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
  },

  buttonDisabled: {
    backgroundColor: '#888', // Gris cuando está deshabilitado
    opacity: 0.7
  },

  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' }


});