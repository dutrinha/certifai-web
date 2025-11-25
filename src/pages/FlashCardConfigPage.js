// /src/pages/TopicosPage.js (VERSÃO UNIFICADA)
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
// ☆ MUDANÇA ☆: Importa o useRoute
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, Minus, Plus, Play } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ☆ MUDANÇA ☆: Importa o useContent
import { useContent } from '../context/ContentContext';
import { supabase } from '../context/AuthContext';


// Paleta de cores (idêntica)
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
};

export default function FlashCardConfigPage() {
  const navigation = useNavigation();
  
  // =======================================================
  // ☆ INÍCIO DAS MUDANÇAS (LÓGICA) ☆
  // =======================================================
  
  // 1. Pega os parâmetros da rota (ex: 'cpa', 'Certificação CPA')
  const route = useRoute();
  const { 
    certificationType = 'unknown', 
    certificationName = 'Simulado' 
  } = route.params;

  // 2. Pega a função 'getTopicsForProva' do nosso contexto
  const { getTopicsForProva } = useContent();

  // 3. Busca os tópicos dinamicamente (ex: 'cpa', 'cpror', 'cpa-10', 'cea')
  const allTopics = useMemo(() => 
    getTopicsForProva(certificationType), 
    [getTopicsForProva, certificationType]
  );
  // =======================================================
  
  // 4. Inicia o estado como vazio (pois os tópicos vêm do contexto)
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionsCount, setQuestionsCount] = useState(15);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // 5. Usamos useEffect para selecionar todos os tópicos
  //    assim que eles forem carregados pelo contexto.
  useEffect(() => {
    if (allTopics && allTopics.length > 0) {
      setSelectedTopics(allTopics);
    }
  }, [allTopics]); // Roda sempre que 'allTopics' mudar

  useEffect(() => {
    setIsButtonDisabled(selectedTopics.length === 0);
  }, [selectedTopics]);

  const handleTopicChange = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // 6. handleStartQuiz agora é 100% dinâmico
const handleStartQuiz = async () => {
    if (isButtonDisabled) return;

    // Opcional: Salva o último estudo
    try {
      await AsyncStorage.setItem('lastStudiedTrail', JSON.stringify({ name: `Flashcards ${certificationName}` }));
    } catch (e) { console.error('Erro ao salvar no AsyncStorage:', e); }

    try {
      // 1. CHAMA A SUA RPC ATUALIZADA (agora com os filtros)
      const { data, error: rpcError } = await supabase.rpc(
          'fn_get_flashcards_for_review', 
          {
            p_prova: certificationType,
            p_limit: questionsCount,
            p_topic_list: selectedTopics, // <-- NOVO
            p_difficulty_filter: null // <-- MUDANÇA (enviamos nulo)
          }
        );
      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
          Alert.alert("Oops!", "Nenhum flash card encontrado para estes filtros. Tente selecionar mais tópicos.");
          return;
      }

      // 2. NAVEGA PARA A FlashCardPage (em vez de 'simulado')
      navigation.navigate('FlashCardPage', {
        // 3. PASSA O DECK DE PRÁTICA E O TIPO
        deck: data, // Passa o deck filtrado que acabamos de buscar
        certificationType: certificationType,
        isPracticeMode: true // Informa à FlashCardPage que é modo de prática
      });

    } catch (err) {
      console.error("Erro ao buscar flash cards filtrados:", err);
      Alert.alert("Erro", "Não foi possível carregar os cards. Tente novamente.");
    }
};
  
  // =======================================================
  // ☆ FIM DAS MUDANÇAS (LÓGICA) ☆
  // =======================================================

  const handleSelectAll = () => {
    setSelectedTopics(selectedTopics.length === allTopics.length ? [] : allTopics);
  };

  const handleDecrement = () => { setQuestionsCount(prev => Math.max(5, prev - 5)); };
  const handleIncrement = () => { setQuestionsCount(prev => Math.min(50, prev + 5)); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header (Agora dinâmico) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={cores.textPrimary} />
          </TouchableOpacity>
          <View>
            {/* ☆ MUDANÇA ☆: Título dinâmico */}
              <Text style={styles.headerTitle}>Flashcards {certificationName}</Text>
              <Text style={styles.headerSubtitle}>Pratique com filtros</Text>
          </View>
        </View>

        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Seção Tópicos (Já era dinâmica, lê 'allTopics') */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TÓPICOS</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.topicItem} onPress={handleSelectAll}>
                <View style={[styles.checkboxBase, selectedTopics.length === allTopics.length && styles.checkboxChecked]}>
                  {selectedTopics.length === allTopics.length && <Check size={16} color={cores.textLight} />}
                </View>
                <Text style={styles.selectAllText}>Selecionar Todos</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              {allTopics.map((topic, index) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <View key={topic}>
                    <TouchableOpacity style={styles.topicItem} onPress={() => handleTopicChange(topic)}>
                      <View style={[styles.checkboxBase, isSelected && styles.checkboxChecked]}>
                        {isSelected && <Check size={16} color={cores.textLight} />}
                      </View>
                      <Text style={styles.topicText}>{topic}</Text>
                    </TouchableOpacity>
                    {index < allTopics.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Seção de Configurações (Idêntica) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONFIGURAÇÕES</Text>
            <View style={styles.card}>
              {/* Stepper de Questões */}
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Número de Cards</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity style={[styles.stepperButton, questionsCount <= 5 && styles.stepperButtonDisabled]} onPress={handleDecrement} disabled={questionsCount <= 5}>
                    <Minus size={20} color={cores.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{questionsCount}</Text>
                  <TouchableOpacity style={[styles.stepperButton, questionsCount >= 50 && styles.stepperButtonDisabled]} onPress={handleIncrement} disabled={questionsCount >= 50}>
                    <Plus size={20} color={cores.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />
            </View>
          </View>
        </ScrollView>

        {/* Footer (Idêntico) */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, isButtonDisabled && styles.footerButtonDisabled]} onPress={handleStartQuiz} disabled={isButtonDisabled} activeOpacity={0.8}>
            <Play size={22} color={cores.textLight} />
            <Text style={styles.footerButtonText}>Iniciar Simulado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Estilos (Idênticos ao CpaTopicosPage.js)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background },
  container: { flex: 1, backgroundColor: cores.background },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    backgroundColor: cores.background,
    paddingTop: Platform.OS === 'android' ? 30 : 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: cores.textPrimary },
  headerSubtitle: { fontSize: 14, color: cores.textSecondary },
  mainContent: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 8,
  },
  section: { marginBottom: 24 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: cores.textSecondary, 
    paddingHorizontal: 4, 
    marginBottom: 8, 
    textTransform: 'uppercase' 
  },
  card: { 
    backgroundColor: cores.cardBackground, 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: cores.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  topicItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  checkboxBase: { 
    width: 24, 
    height: 24, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: cores.border, 
    backgroundColor: cores.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  checkboxChecked: { 
    backgroundColor: cores.primary, 
    borderColor: cores.primary 
  },
  topicText: { 
    fontSize: 15, 
    color: cores.textPrimary, 
    flex: 1, 
    lineHeight: 20 
  },
  selectAllText: { 
    fontSize: 15, 
    color: cores.textPrimary, 
    fontWeight: 'bold', 
    flex: 1 
  },
  divider: { 
    height: 1, 
    backgroundColor: cores.border, 
    marginHorizontal: 20 
  },
  settingsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    backgroundColor: cores.cardBackground 
  },
  settingsLabel: { 
    fontSize: 16, 
    color: cores.textPrimary, 
    fontWeight: '500' 
  },
  stepperControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: cores.background, 
    borderRadius: 20 
  },
  stepperButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  stepperButtonDisabled: { opacity: 0.3 },
  stepperValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: cores.textPrimary, 
    paddingHorizontal: 12 
  },
  difficultyContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16, 
    backgroundColor: cores.cardBackground,
  },
  difficultyButton: { 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1, 
    borderColor: cores.border, 
    backgroundColor: cores.background, 
    borderRadius: 16,
  },
  difficultyButtonSelected: { 
    backgroundColor: cores.primaryLight, 
    borderColor: cores.primary 
  },
  difficultyButtonText: { 
    color: cores.textSecondary, 
    fontWeight: '600',
    fontSize: 14,
  },
  difficultyButtonTextSelected: { 
    color: cores.primary,
  },
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, 
    backgroundColor: 'transparent', 
  },
  footerButton: { 
    backgroundColor: cores.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    gap: 10,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  footerButtonDisabled: { 
    backgroundColor: cores.textSecondary, 
    opacity: 0.5 
  },
  footerButtonText: { 
    color: cores.textLight, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});