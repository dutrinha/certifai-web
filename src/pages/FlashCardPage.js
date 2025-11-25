// /src/pages/FlashCardPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase, useAuth } from '../context/AuthContext'; 
import { 
  POINT_RULES, 
  updateUserProgressAndStreak 
} from '../utils/PointSystem'; 
// Importa o serviço de progresso da trilha
import { markLessonAsCompleted } from '../context/progressService'; 
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react-native';

// Paleta de cores
const cores = {
  primary: '#00C853',
  secondary: '#1A202C',
  softGray: '#F7FAFC',
  gray200: '#E2E8F0',
  gray500: '#64748B',
  gray700: '#334155',
  light: '#FFFFFF',
  red50: '#FEE2E2',
  red600: '#DC2626',
  green50: '#F0FDF4',
  green600: '#16A34A',
  blue50: '#EFF6FF',
  blue600: '#2563EB',
};

const REVIEW_LIMIT = 20;

export default function FlashCardPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth(); 
  
  // Recebe o contexto da trilha (se houver)
  const { 
    certificationType, 
    deck: practiceDeck, 
    isPracticeMode,
    moduleId,
    lessonIndex
  } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deck, setDeck] = useState(practiceDeck || []);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref para garantir que o progresso da trilha seja salvo apenas uma vez
  const hasSavedTrilhaProgressRef = useRef(false);

  // Efeito para buscar os cards (se não for modo prática)
  useEffect(() => {
    if (isPracticeMode && practiceDeck && practiceDeck.length > 0) {
      console.log("FlashCardPage: Usando deck de PRÁTICA pré-carregado.");
      setDeck(practiceDeck);
      setLoading(false);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      return; 
    }

    const fetchCards = async () => {
      if (!certificationType) {
        setError('Tipo de prova não definido.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc(
          'fn_get_flashcards_for_review',
          {
            p_prova: certificationType,
            p_limit: REVIEW_LIMIT,
            p_topic_list: null, 
            p_difficulty_filter: null 
          }
        );
        if (rpcError) throw rpcError;
        setDeck(data || []);
      } catch (err) {
        console.error('Erro ao buscar flash cards:', err);
        setError(err.message || 'Ocorreu um erro ao carregar os cards.');
      } finally {
        setLoading(false);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    };

    fetchCards();
  }, [certificationType, practiceDeck, isPracticeMode]); 

  // --- NOVO: EFEITO PARA SALVAR O PROGRESSO DA TRILHA ---
  // Roda quando o usuário chega à tela de conclusão
  useEffect(() => {
    // Verifica se chegamos ao fim do deck E se viemos de uma trilha E se ainda não salvamos
    if (
      currentCardIndex >= deck.length && 
      deck.length > 0 && // Garante que não rode se o deck veio vazio
      moduleId !== undefined && 
      !hasSavedTrilhaProgressRef.current
    ) {
      
      const saveTrilhaProgress = async () => {
        try {
          hasSavedTrilhaProgressRef.current = true; // Marca como salvo
          await markLessonAsCompleted(certificationType, moduleId, lessonIndex);
          console.log(`Progresso da Trilha (FlashCard) salvo: Mod ${moduleId}, Aula ${lessonIndex}`);
        } catch (e) {
          console.error("Falha ao salvar progresso da trilha (FlashCard):", e);
          // Não trava o usuário, apenas loga o erro
        }
      };

      saveTrilhaProgress();
    }
  }, [currentCardIndex, deck.length, moduleId, lessonIndex, certificationType]); // Dependências


  // Ações do Usuário
  const handleFlipCard = () => {
    if (isSaving) return;
    setIsFlipped(!isFlipped);
  };

  // Função de salvar progresso (SRS e Pontos Diários)
  const handleReviewAnswer = async (rating) => {
    if (isSaving) return; 
    setIsSaving(true);
    
    // Lógica de Pontos Diários (XP)
    let pointsToAdd = 0;
    switch (rating) {
      case 1: pointsToAdd = POINT_RULES.FLASHCARD_WRONG; break;
      case 2: pointsToAdd = POINT_RULES.FLASHCARD_GOOD; break;
      case 3: pointsToAdd = POINT_RULES.FLASHCARD_EASY; break;
    }
    if (pointsToAdd > 0) {
      await updateUserProgressAndStreak(user, pointsToAdd); 
    }

    // Se NÃO for modo de prática, salva o progresso SRS
    if (!isPracticeMode) {
      const cardToUpdate = deck[currentCardIndex];
      try {
        const { error: rpcError } = await supabase.rpc(
          'fn_update_flashcard_progress',
          {
            p_flash_card_id: cardToUpdate.flash_card_id,
            p_rating: rating,
          }
        );
        if (rpcError) throw rpcError;
      } catch (err) {
        console.error('Erro ao salvar progresso SRS do flash card:', err);
      }
    }

    // Avança para o próximo card
    setIsFlipped(false);
    setCurrentCardIndex(currentCardIndex + 1);
    setIsSaving(false);
  };
  
  // --- Telas de Estado (Loading, Erro) ---
  if (loading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={cores.primary} />
        <Text style={styles.loadingText}>Carregando cards...</Text>
      </View>
    );
  }

  if (error) {
     return (
      <View style={styles.centeredScreen}>
        <Text style={styles.errorText}>Oops! Algo deu errado.</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()}>
          <Text style={styles.btnPrimaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Tela de Conclusão ---
  if (deck.length === 0 || currentCardIndex >= deck.length) {
     return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <ArrowLeft size={24} color={cores.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Flash Cards</Text>
        </View>
        <View style={styles.centeredScreen}>
          <Check size={60} color={cores.primary} />
          <Text style={styles.mainTitle}>
            {deck.length === 0 ? "Tudo certo!" : (isPracticeMode ? "Prática Concluída!" : "Revisão Concluída!")}
          </Text>
          <Text style={styles.mainSubtitle}>
            {deck.length === 0 
              ? `Nenhum card encontrado.`
              : `Você revisou ${deck.length} ${deck.length === 1 ? 'card' : 'cards'}.`
            }
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnPrimaryText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
     );
  }
  
  // --- Tela Principal (Revisão) ---
  const currentCard = deck[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / deck.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header (com progresso) */}
        <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <ArrowLeft size={24} color={cores.secondary} />
              </TouchableOpacity>
              <Text style={styles.progressTextInfo}>
                {currentCardIndex + 1} / {deck.length}
              </Text>
              <View style={{width: 24}} />
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFg, { width: `${progressPercentage}%` }]} />
            </View>
        </View>

        {/* Corpo (O Card) */}
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={handleFlipCard}
            disabled={isSaving}
          >
            {!isFlipped && (
              <View style={styles.cardFace}>
                <Text style={styles.cardFrontText}>
                  {currentCard.front}
                </Text>
              </View>
            )}
            
            {isFlipped && (
              <View style={styles.cardFace}>
                <Text style={styles.cardBackText}>
                  {currentCard.back}
                </Text>
              </View>
            )}
            
            <View style={styles.flipIndicator}>
                <RotateCcw size={16} color={cores.gray500} />
                <Text style={styles.flipText}>
                  {isFlipped ? 'Ver Pergunta' : 'Ver Resposta'}
                </Text>
            </View>
            
          </TouchableOpacity>
        </ScrollView>
        
        {/* Footer (Botões de Ação) */}
        <View style={styles.footer}>
          {!isFlipped && (
            <TouchableOpacity
              style={[styles.btnPrimary, isSaving && styles.btnDisabled]}
              onPress={handleFlipCard}
              disabled={isSaving}
            >
              <Text style={styles.btnPrimaryText}>Virar Card</Text>
            </TouchableOpacity>
          )}
          
          {isFlipped && (
            <View style={styles.srsButtonsContainer}>
              <TouchableOpacity
                style={[styles.btnSrs, styles.btnSrsRed, isSaving && styles.btnDisabled]}
                onPress={() => handleReviewAnswer(1)} // 1 = Errei
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={cores.red600} /> : <Text style={[styles.btnSrsText, styles.btnSrsTextRed]}>Errei</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.btnSrs, styles.btnSrsBlue, isSaving && styles.btnDisabled]}
                onPress={() => handleReviewAnswer(2)} // 2 = Bom
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={cores.blue600} /> : <Text style={[styles.btnSrsText, styles.btnSrsTextBlue]}>Bom</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.btnSrs, styles.btnSrsGreen, isSaving && styles.btnDisabled]}
                onPress={() => handleReviewAnswer(3)} // 3 = Fácil
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color={cores.green600} /> : <Text style={[styles.btnSrsText, styles.btnSrsTextGreen]}>Fácil</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View> 
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.softGray, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  container: { flex: 1 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: cores.softGray },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: cores.gray500 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: cores.red600, textAlign: 'center' },
  errorSubtitle: { marginTop: 8, fontSize: 14, color: cores.gray500, textAlign: 'center', marginBottom: 24 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 8 },
  mainSubtitle: { fontSize: 15, color: cores.gray500, textAlign: 'center', marginBottom: 32 },
  header: { backgroundColor: cores.light, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: cores.gray200 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: cores.secondary },
  closeButton: { padding: 4 },
  progressTextInfo: { fontSize: 14, fontWeight: '600', color: cores.gray500 },
  progressBarBg: { height: 6, backgroundColor: cores.gray200, borderRadius: 3 },
  progressBarFg: { height: 6, backgroundColor: cores.primary, borderRadius: 3 },
  mainScroll: { flex: 1 },
  mainContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: cores.light,
    borderRadius: 24,
    minHeight: 350,
    borderWidth: 1,
    borderColor: cores.gray200,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardFace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrontText: {
    fontSize: 22,
    fontWeight: '600',
    color: cores.secondary,
    textAlign: 'center',
    lineHeight: 30,
  },
  cardBackText: {
    fontSize: 18,
    fontWeight: '500',
    color: cores.gray700,
    textAlign: 'center',
    lineHeight: 26,
  },
  flipIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    bottom: 20,
    opacity: 0.6,
  },
  flipText: {
    fontSize: 14,
    color: cores.gray500,
    fontWeight: '500',
  },
  footer: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderTopWidth: 1, 
    borderColor: cores.gray200, 
    padding: 16, 
    paddingBottom: Platform.OS === 'ios' ? 32 : 16 
  },
  btnPrimary: { 
    backgroundColor: cores.primary, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnPrimaryText: { color: cores.light, fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { 
    opacity: 0.7,
  },
  srsButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  btnSrs: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 48, 
  },
  btnSrsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnSrsRed: { backgroundColor: cores.red50, borderColor: cores.red600 },
  btnSrsTextRed: { color: cores.red600 },
  btnSrsBlue: { backgroundColor: cores.blue50, borderColor: cores.blue600 },
  btnSrsTextBlue: { color: cores.blue600 },
  btnSrsGreen: { backgroundColor: cores.green50, borderColor: cores.green600 },
  btnSrsTextGreen: { color: cores.green600 },
});