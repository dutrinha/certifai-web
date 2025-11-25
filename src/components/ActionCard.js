// src/components/ActionCard.js
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

const cores = {
  primary: "#00C853", 
  textPrimary: "#1A202C",
  textSecondary: "#64748B",
  cardBackground: "#FFFFFF",
  shadow: 'rgba(0, 0, 0, 0.05)',
  gold: '#FFD700', // Cor do PRO
  goldText: '#744210',
};

export default function ActionCard({ icon: Icon, title, onPress, isLoading = false, isPro = false }) {
  return (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={onPress} 
      activeOpacity={0.7} 
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={cores.primary} style={styles.actionIconContainer} /> 
      ) : (
        <View style={styles.actionIconContainer}>
          <Icon size={24} color={cores.primary} />
        </View>
      )}
      
      <Text style={styles.actionCardTitle}>{title}</Text>
      
      {/* AQUI ESTÁ A MÁGICA: A TAG PRO */}
      {isPro && (
        <View style={styles.proBadge}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}

      <ChevronRight size={22} color={cores.textSecondary} style={styles.actionChevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: cores.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Reduzi um pouco o gap para caber a badge
    marginBottom: 12,
    shadowColor: cores.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.textPrimary,
    flex: 1, // Ocupa o espaço disponível
  },
  actionChevron: {
    marginLeft: 'auto',
    opacity: 0.5,
  },
  // Estilos da Badge PRO
  proBadge: {
    backgroundColor: '#E6F8EB', // Amarelo claro fundo
    borderColor: '#00C853',     // Borda laranja/amarela
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  proText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00C853', // Texto laranja escuro
  },
});