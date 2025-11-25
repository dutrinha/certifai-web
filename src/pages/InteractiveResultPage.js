// src/pages/InteractiveResultPage.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase, useAuth } from '../context/AuthContext';
import { Home, ChevronRight, ArrowLeft } from 'lucide-react-native'; 
// Importa o serviço de progresso da trilha
import { markLessonAsCompleted } from '../context/progressService';

// Paleta de cores
const cores = {
  primary: "#00C853", primaryChat: "#DCF8C6", primaryLight: "#E6F8EB", 
  textPrimary: "#1A202C", textSecondary: "#64748B", textLight: "#FFFFFF", 
  background: "#F7FAFC", cardBackground: "#FFFFFF", border: "#E2E8F0", 
  redText: '#DC2626', greenText: '#16A34A',
};

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function InteractiveResultPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // --- PARÂMETROS DA ROTA (FLUXO COMBINADO) ---
  const { 
    // Modo Revisão (Histórico)
    sessionId,

    // Modo Padrão (só Diálogo)
    userPath = [], 
    totalScore: directDialogueScore, // Score se veio direto
    
    // Modo Combinado (Diálogo + Quiz)
    questionData = {},
    finalDialogueScore = 0,
    finalQuizScore = 0,
    finalQuizTotal = 0,
    hasQuizData = false,

    // Dados da Trilha
    moduleId,
    lessonIndex,
    certificationType
  } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // Ref para evitar processamento duplicado
  const hasProcessedRef = useRef(false);

  // --- CÁLCULO DE PONTUAÇÃO (FOCO NO BREAKDOWN) ---

  // 1. Calcula os scores iniciais
  const d_score = hasQuizData ? finalDialogueScore : (directDialogueScore || 0);
  const d_max = userPath.length * 5 || (hasQuizData ? (finalDialogueScore / 5 * 5) : 0); // Estima o max do diálogo
  const q_score = finalQuizScore;
  const q_max = finalQuizTotal;
  
  const totalScore = d_score + q_score;
  const totalMaxScore = d_max + q_max;

  // 2. Cria o string de breakdown
  let initialBreakdown = "";
  if (hasQuizData && d_max > 0) {
    // Formato: 20/25 | 1/2
    initialBreakdown = `${d_score}/${d_max} | ${q_score}/${q_max}`;
  } else if (d_max > 0) {
    // Formato (só diálogo): 20/25
    initialBreakdown = `${d_score}/${d_max}`;
  } else {
    // Fallback (Modo Revisão inicial)
    initialBreakdown = "...";
  }

  // 3. Seta os estados
  const [displayScore, setDisplayScore] = useState(totalScore);
  const [displayMaxScore, setDisplayMaxScore] = useState(totalMaxScore);
  const [breakdownText, setBreakdownText] = useState(initialBreakdown); // <-- NOVO ESTADO PRINCIPAL
  
  const dialogueHistory = userPath; 
  const interactiveQuestionData = questionData || route.params?.questionData || {};


  useEffect(() => {
    // --- MODO 2: REVISÃO (Vindo do Histórico) ---
    if (sessionId) {
      setIsReviewMode(true);
      
      const fetchReviewData = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('simulado_sessions')
            .select('score_achieved, score_total, result_display') // Pega o result_display
            .eq('id', sessionId)
            .single();
          if (error) throw error;

          // Atualiza os estados com dados do banco
          setDisplayScore(data.score_achieved || 0);
          setDisplayMaxScore(data.score_total || 0);
          
          // USA O result_display COMO BREAKDOWN
          setBreakdownText(data.result_display || `${data.score_achieved}/${data.score_total}`);
          
        } catch (err) {
          console.error("Erro ao carregar dados da revisão:", err);
          setBreakdownText("Erro");
        } finally {
          setIsLoading(false);
        }
      };
      fetchReviewData();

    } 
    // --- MODO 1: PADRÃO (Vindo da Questão ou do Simulado) ---
    else if (dialogueHistory.length > 0 || hasQuizData) {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;
      
      // Removemos o loading da IA, então a tela carrega instantaneamente
      setIsLoading(false);

      const saveData = async () => {
        try {
          // 1. Salvar Pontos de Streak (XP Diário)
          if (displayScore > 0) {
             try {
                // ... (código de salvar streak) ...
                const today = getLocalDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toISOString().split('T')[0];
                const pointsToAdd = displayScore; 
                const currentMeta = user?.user_metadata || {};
                const progress = currentMeta.daily_progress || { date: null, count: 0 };
                const streak = currentMeta.study_streak || { count: 0, lastStudiedDate: null };
                let dataToUpdate = {}; 
                const newProgressCount = (progress.date === today) ? (progress.count || 0) + pointsToAdd : pointsToAdd;
                dataToUpdate.daily_progress = { date: today, count: newProgressCount };
                if (streak.lastStudiedDate !== today) {
                  const newStreakCount = (streak.lastStudiedDate === yesterdayString) ? (streak.count || 0) + 1 : 1;
                  dataToUpdate.study_streak = { count: newStreakCount, lastStudiedDate: today };
                }
                await supabase.auth.updateUser({ data: dataToUpdate });
             } catch (e) {
                console.error('Erro ao atualizar pontos da Interativa:', e); 
             }
          }
          
          // 2. Salvar Histórico da Sessão (sem feedback)
          try {
            // Salva o 'breakdownText'
            const sessionData = {
              type: 'Interativa',
              certification: interactiveQuestionData?.prova?.toUpperCase() || 'INTERATIVA',
              topic_title: interactiveQuestionData?.topico || 'Diálogo Interativo',
              result_display: breakdownText, 
              is_success: (displayMaxScore > 0 ? (displayScore / displayMaxScore) : 0) >= 0.7, 
              score_achieved: displayScore, 
              score_total: displayMaxScore, 
              review_feedback: null // Não salvamos mais o feedback da IA
            };
            await supabase.from('simulado_sessions').insert(sessionData);
          } catch (saveError) {
            console.error("Falha ao salvar o histórico da Interativa:", saveError);
          }

          // 3. Salvar Progresso da Trilha (se veio da trilha)
          if (moduleId !== undefined) {
            try {
              await markLessonAsCompleted(certificationType, moduleId, lessonIndex);
              console.log(`Progresso da Trilha (Interativa) salvo: Mod ${moduleId}, Aula ${lessonIndex}`);
            } catch(e) {
              console.error("Falha ao salvar progresso da trilha (Interativa):", e);
            }
          }
        } catch (e) {
            console.error("Erro no processo de salvar dados:", e);
        }
      };
      
      saveData();
    }
  }, [route.params, user]); // Dependências


  const irParaHub = () => {
    if (!interactiveQuestionData.prova) {
      navigation.goBack();
      return;
    }
    navigation.navigate(`${interactiveQuestionData.prova.toLowerCase()}-hub`);
  };

  // --- RENDERIZAÇÃO ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {isReviewMode && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
              <ArrowLeft size={24} color={cores.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {isReviewMode ? "Revisão da Atividade" : "Análise de Desempenho"}
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Ajuste no Título do Card */}
          <Text style={styles.sectionTitle}>
            {hasQuizData || (breakdownText && breakdownText.includes('|')) 
              ? "Diálogo | Quiz" 
              : "Sua Pontuação"}
          </Text>
          
          {isLoading ? (
            <ActivityIndicator color={cores.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.scoreContainer}>
              {/* --- CORREÇÃO VISUAL APLICADA AQUI --- */}
              <Text 
                style={styles.breakdownScoreText}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
              >
                {breakdownText}
              </Text>
            </View>
          )}
          
        </View>

        {/* --- CARD DE FEEDBACK DA IA REMOVIDO --- */}

        {!isReviewMode && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recomendação</Text>
            <Text style={styles.recommendationText}>
              Continue praticando o tópico: <Text style={{fontWeight: 'bold'}}>{interactiveQuestionData?.topico || "..."}</Text>
            </Text>
            <TouchableOpacity style={styles.buttonSecondary} onPress={irParaHub}>
              <Text style={styles.buttonSecondaryText}>Ver Hub da Certificação</Text>
              <ChevronRight size={18} color={cores.primary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.popToTop()}>
          <Home size={20} color={cores.textLight} />
          <Text style={styles.buttonPrimaryText}>
            {isReviewMode ? "Voltar ao Início" : "Concluir Lição"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODAL DE CHAT REMOVIDO --- */}

    </SafeAreaView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 25 : 16, 
    paddingBottom: 16, 
    backgroundColor: cores.background,
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: cores.textPrimary },
  container: { padding: 20, gap: 16, paddingBottom: 60 },
  card: {
    backgroundColor: cores.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: cores.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 8, // Adiciona um padding vertical
  },
  breakdownScoreText: {
    fontSize: 36, // Reduzido de 40 para 36
    fontWeight: 'bold',
    color: cores.primary,
    textAlign: 'center',
    lineHeight: 44, // Ajustado para o novo fontSize
    paddingHorizontal: 4, // Adiciona padding para não colar nas bordas
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: cores.primary,
    lineHeight: 52,
  },
  scoreMaxText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.textSecondary,
    paddingBottom: 4,
    marginLeft: 4,
  },
  scoreSubtitle: {
    fontSize: 14,
    color: cores.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 15,
    color: cores.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: cores.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 3,
  },
  buttonPrimaryText: {
    color: cores.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: cores.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonSecondaryText: {
    color: cores.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});