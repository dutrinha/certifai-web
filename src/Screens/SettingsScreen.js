import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Modal, // Novo
  TouchableWithoutFeedback // Novo
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase, useAuth } from '../context/AuthContext';
import { ArrowLeft, LogOut, User, Target, Award, ChevronDown } from 'lucide-react-native'; // Novos ícones
import { POINT_RULES } from '../utils/PointSystem';
// Importa a função de salvar o foco
import { updateUserCertificationFocus } from '../context/progressService'; 

// --- PALETA DE CORES ---
const cores = {
  primary: "#00C853",
  primaryLight: "#E6F8EB",
  textPrimary: "#1A202C",
  textSecondary: "#64748B",
  textLight: "#FFFFFF",
  background: "#F7FAFC",
  cardBackground: "#FFFFFF",
  border: "#E2E8F0",
  shadow: 'rgba(0, 0, 0, 0.05)',
  redText: '#DC2626',
};

const DEFAULT_DAILY_GOAL = 100;
// Lista de certificações que o usuário pode escolher
const AVAILABLE_CERTIFICATIONS = ['cpa', 'cpror', 'cproi'];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth(); 

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [dailyGoalInput, setDailyGoalInput] = useState(
    (user?.user_metadata?.daily_goal || DEFAULT_DAILY_GOAL).toString()
  );
  
  // --- NOVOS ESTADOS ---
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFocus, setCurrentFocus] = useState(
    user?.user_metadata?.certification_focus || 'cpa'
  );

  // Sincroniza o estado local se o 'user' do AuthContext mudar
  useEffect(() => {
    if (user && !isSaving) {
      setName(user.user_metadata?.full_name || '');
      setDailyGoalInput((user.user_metadata?.daily_goal || DEFAULT_DAILY_GOAL).toString());
      // Atualiza o foco local se o 'user' mudar
      setCurrentFocus(user.user_metadata?.certification_focus || 'cpa');
    }
  }, [user, isSaving]);

  // --- FUNÇÕES DE ATUALIZAÇÃO ---
  
  // Salva nome
  const handleUpdateName = async () => {
    const trimmedName = name.trim();
    const currentName = user?.user_metadata?.full_name || '';
    if (trimmedName === currentName || !trimmedName) {
      setName(currentName); // Restaura se for igual ou vazio
      return; 
    }
    
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName } 
    });
    
    if (error) { 
      Alert.alert('Erro', 'Não foi possível atualizar o nome.'); 
      setName(currentName);
    }
    setIsSaving(false);
  };

  // Salva meta diária
  const handleUpdateGoal = async () => {
    const goalNumber = parseInt(dailyGoalInput, 10);
    const currentGoal = (user?.user_metadata?.daily_goal || DEFAULT_DAILY_GOAL);
    const currentGoalString = currentGoal.toString();

    if (dailyGoalInput === currentGoalString || goalNumber === currentGoal) return;

    if (isNaN(goalNumber) || !Number.isInteger(goalNumber) || goalNumber <= 0) {
      Alert.alert('Meta Inválida', 'Insira um número inteiro maior que zero.');
      setDailyGoalInput(currentGoalString);
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { daily_goal: goalNumber } 
    });

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a meta diária.');
      setDailyGoalInput(currentGoalString);
    }
    setIsSaving(false);
  };

  // --- NOVA FUNÇÃO: Salvar Foco da Trilha ---
  const handleUpdateFocus = async (newCert) => {
    if (newCert === currentFocus) {
      setModalVisible(false);
      return;
    }

    setModalVisible(false);
    setIsSaving(true);

    const success = await updateUserCertificationFocus(newCert);

    if (success) {
      // Atualiza o estado local otimistamente
      setCurrentFocus(newCert);
    } else {
      Alert.alert('Erro', 'Não foi possível salvar o foco da trilha.');
    }
    setIsSaving(false);
  };

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
    } else {
      navigation.replace('WelcomeScreen'); // Redireciona para o início
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={cores.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- Seção Perfil --- */}
        <Text style={styles.sectionTitle}>PERFIL</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <User size={20} color={cores.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Seu nome" 
              value={name} 
              onChangeText={setName} 
              autoCapitalize="words" 
              editable={!isSaving}
              onEndEditing={handleUpdateName}
              onBlur={handleUpdateName}
              placeholderTextColor={cores.textSecondary}
            />
            {isSaving && <ActivityIndicator size="small" color={cores.primary} />}
          </View>
        </View>
        
        {/* --- NOVA SEÇÃO: Foco da Trilha --- */}
        <Text style={styles.sectionTitle}>FOCO DA TRILHA</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.focusButton} 
            onPress={() => setModalVisible(true)}
            disabled={isSaving}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
              <Award size={20} color={cores.textSecondary} style={styles.inputIcon} />
              <Text style={styles.focusButtonText}>Foco principal</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={styles.focusButtonValue}>{currentFocus.toUpperCase()}</Text>
              <ChevronDown size={20} color={cores.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Seção Metas --- */}
        <Text style={styles.sectionTitle}>METAS</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Target size={20} color={cores.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Meta diária (pontos)"
              value={dailyGoalInput} 
              onChangeText={setDailyGoalInput} 
              keyboardType="number-pad"
              returnKeyType="done"
              editable={!isSaving}
              onEndEditing={handleUpdateGoal}
              onBlur={handleUpdateGoal}
              placeholderTextColor={cores.textSecondary}
            />
            {isSaving && <ActivityIndicator size="small" color={cores.primary} />}
          </View>
          
          <View style={styles.helperContainer}>
            <Text style={styles.helperText}>
              Lembrete da pontuação:
              {'\n'}• Múltipla Escolha: <Text style={{fontWeight: 'bold'}}>{POINT_RULES.MC_CORRECT} pts</Text> (acerto), <Text style={{fontWeight: 'bold'}}>{POINT_RULES.MC_INCORRECT} pts</Text> (erro)
              {'\n'}• Cases: <Text style={{fontWeight: 'bold'}}>{POINT_RULES.CASE_CORRECT} pts</Text> (correto), <Text style={{fontWeight: 'bold'}}>{POINT_RULES.CASE_PARTIAL} pts</Text> (parcial), <Text style={{fontWeight: 'bold'}}>{POINT_RULES.CASE_INCORRECT} pts</Text> (erro)
            </Text>
          </View>

        </View>
        
        {/* --- Botão Logout --- */}
        <Text style={styles.sectionTitle}>CONTA</Text>
        <TouchableOpacity style={styles.card} onPress={handleLogout}>
            <View style={styles.logoutRow}>
                <LogOut size={20} color={cores.redText} />
                <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </View>
        </TouchableOpacity>
      </ScrollView>

      {/* --- NOVO: Modal de Seleção de Foco --- */}
      <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
      >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                      <View style={styles.modalContent}>
                          <Text style={styles.modalTitle}>Alterar Foco</Text>
                          {AVAILABLE_CERTIFICATIONS.map((cert) => (
                              <TouchableOpacity
                                  key={cert}
                                  style={styles.modalOption}
                                  onPress={() => handleUpdateFocus(cert)}
                              >
                                  <Text style={[
                                      styles.modalOptionText,
                                      currentFocus === cert && styles.modalOptionTextActive
                                  ]}>
                                      {cert.toUpperCase()}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                      </View>
                  </TouchableWithoutFeedback>
              </View>
          </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: cores.background, 
    gap: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: cores.textPrimary },
  content: { 
    flex: 1, 
    paddingTop: 8,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: cores.textSecondary, 
    paddingHorizontal: 4, 
    marginBottom: -8,
    textTransform: 'uppercase', 
  },
  card: { 
    backgroundColor: cores.cardBackground, 
    borderRadius: 20, 
    shadowColor: cores.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inputIcon: { marginRight: 16 },
  input: { 
    flex: 1, 
    height: 48,
    fontSize: 16, 
    color: cores.textPrimary,
    fontWeight: '500',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  logoutButtonText: { 
    color: cores.redText, 
    fontSize: 16, 
    fontWeight: 'bold', 
  },
  helperContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: cores.border,
    marginHorizontal: 16,
  },
  helperText: {
    fontSize: 13,
    color: cores.textSecondary,
    lineHeight: 18,
  },
  
  // --- NOVOS ESTILOS (Dropdown e Modal) ---
  focusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  focusButtonText: {
    fontSize: 16,
    color: cores.textPrimary,
    fontWeight: '500',
  },
  focusButtonValue: {
    fontSize: 16,
    color: cores.textPrimary,
    fontWeight: 'bold',
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  modalContent: {
      backgroundColor: cores.cardBackground,
      borderRadius: 20,
      padding: 10,
      width: '80%',
      maxWidth: 300,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 15,
      elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
    marginBottom: 8,
  },
  modalOption: {
      paddingVertical: 16,
      paddingHorizontal: 16,
  },
  modalOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: cores.textSecondary,
      textAlign: 'center',
  },
  modalOptionTextActive: {
      color: cores.primary,
      fontWeight: 'bold',
  },
});