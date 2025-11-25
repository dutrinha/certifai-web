// /src/pages/StudyCasePage.jsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, X, Check, Sparkles } from 'lucide-react-native'; 
import { supabase, useAuth } from '../context/AuthContext'; 
import { 
  POINT_RULES, 
  updateUserProgressAndStreak 
} from '../utils/PointSystem';
// Importa o serviço de progresso da trilha
import { markLessonAsCompleted } from '../context/progressService'; 

// Paleta de cores
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
  red500: '#EF4444',
  red50: '#FEF2E2',
  redBorder: '#FECACA',
  redText: '#DC2626',
  green500: '#22C55E',
  green50: '#F0FDF4',
  greenBorder: '#BBF7D0',
  greenText: '#16A34A',
  orangeBorder: '#FDBA74', 
  orangeBg: '#FFFBEB', 
  orangeText: '#D97706', 
};

export default function StudyCasePage() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Recebe o contexto (seja do Runner ou da Trilha)
  const { 
    runnerContext, 
    caseData,
    moduleId,
    lessonIndex,
    certificationType
  } = route.params;

  const isRunnerMode = !!runnerContext;
  const currentCaseData = isRunnerMode ? caseData : route.params.caseData;
  const { user } = useAuth(); 
  
  // Refs para salvar o progresso apenas uma vez
  const hasSavedHistoryRef = useRef(false);
  const hasSavedTrilhaProgressRef = useRef(false);

  const [answers, setAnswers] = useState(
    currentCaseData?.questions ? Array(currentCaseData.questions.length).fill('') : []
  );
  const [isVerified, setIsVerified] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState(
    currentCaseData?.questions ? Array(currentCaseData.questions.length).fill(null) : []
  );

  const handleAnswerChange = (text, index) => {
    if (isVerified || isAnalyzing) return;
    if (index >= 0 && index < answers.length) {
      const newAnswers = [...answers];
      newAnswers[index] = text;
      setAnswers(newAnswers);
    }
  };

  // Função para chamar a IA
  const handleAiBulkAnalysis = async () => {
    if (!currentCaseData?.questions || isAnalyzing) return;

    setIsAnalyzing(true);
    setAiAnalysisResults(Array(currentCaseData.questions.length).fill(null));
    setIsVerified(false);

    const analysisPayload = currentCaseData.questions.map((q, index) => ({
      question: q.pergunta,
      userAnswer: answers[index],
      idealAnswer: q.resposta_ideal,
      explanationContext: q.explicacao
    }));

    try {
      const { data: analysisResultsArray, error } = await supabase.functions.invoke(
        'get-ai-bulk-evaluation', 
        {
          body: JSON.stringify({ cases: analysisPayload })
        }
      );
      if (error) throw error;

      if (Array.isArray(analysisResultsArray) && analysisResultsArray.length === currentCaseData.questions.length) {
         setAiAnalysisResults(analysisResultsArray);
         setIsVerified(true);

         // --- INÍCIO DA LÓGICA DE SALVAMENTO (APÓS ANÁLISE) ---
         
         // 1. Salvar no Histórico (simulado_sessions)
         if (!isRunnerMode && !hasSavedHistoryRef.current) { 
           try {
             hasSavedHistoryRef.current = true;
             let correctCount = 0;
             let caseScore = 0;
             const caseTotal = currentCaseData.questions.length;

             analysisResultsArray.forEach(result => {
                if (result.evaluation === 'correct') {
                   caseScore += 1;
                   correctCount += 1;
                } else if (result.evaluation === 'partial') {
                   caseScore += 0.5;
                }
             });

             const sessionData = {
                type: 'Case',
                certification: currentCaseData?.prova?.toUpperCase() || 'CASE',
                topic_title: `Case Prático (${caseTotal}q)`,
                result_display: `${correctCount}/${caseTotal} Corretas`,
                is_success: (caseScore / caseTotal) >= 0.7, 
                score_achieved: caseScore,
                score_total: caseTotal,
             };
             const { data: sessionResult, error: sessionError } = await supabase
                .from('simulado_sessions')
                .insert(sessionData)
                .select('id')
                .single();
             if (sessionError) throw sessionError;
             
             const newSessionId = sessionResult.id;
             const answersData = currentCaseData.questions.map((q, index) => ({
                session_id: newSessionId,
                question_type: 'case',
                topic: q.modulo,
                question_main: q.pergunta,
                explanation: analysisResultsArray[index].justification,
                user_answer: answers[index],
                correct_answer: q.resposta_ideal,
             }));
             await supabase.from('simulado_answers').insert(answersData);
             console.log('Histórico de Case Prático salvo com sucesso!', newSessionId);
           } catch (saveError) {
             console.error("Falha ao salvar o histórico do Case:", saveError);
             hasSavedHistoryRef.current = false;
           }
         }

         // 2. Salvar Pontos Diários (XP) e preparar dados do Runner
         let totalPointsFromCase = 0;
         let caseRunnerResults = []; 
         analysisResultsArray.forEach(result => {
           caseRunnerResults.push({ status: result.evaluation });
           if (result.evaluation === 'correct') totalPointsFromCase += POINT_RULES.CASE_CORRECT;
           else if (result.evaluation === 'partial') totalPointsFromCase += POINT_RULES.CASE_PARTIAL;
           else if (result.evaluation === 'incorrect') totalPointsFromCase += POINT_RULES.CASE_INCORRECT;
         });

         if (isRunnerMode) {
            runnerContext.results.caseResults.push(...caseRunnerResults);
         }
         if (totalPointsFromCase > 0) {
           await updateUserProgressAndStreak(user, totalPointsFromCase);
         }

         // 3. NOVO: Salvar Progresso da Trilha
         if (moduleId !== undefined && !hasSavedTrilhaProgressRef.current) {
           try {
             hasSavedTrilhaProgressRef.current = true;
             const certType = certificationType || currentCaseData?.prova; // Pega o tipo de certificação
             await markLessonAsCompleted(certType, moduleId, lessonIndex);
             console.log(`Progresso da Trilha (Case) salvo: Mod ${moduleId}, Aula ${lessonIndex}`);
           } catch (e) {
             console.error("Falha ao salvar progresso da trilha (Case):", e);
           }
         }
         // --- FIM DA LÓGICA DE SALVAMENTO ---

      } else {
         throw new Error("Resposta da IA em formato inválido.");
      }
    } catch (err) {
       console.error("Erro ao chamar IA em bloco:", err);
       Alert.alert("Erro", "Não foi possível analisar as respostas com a IA.");
       setAiAnalysisResults(Array(currentCaseData.questions.length).fill({ evaluation: 'error', justification: 'Falha na análise.' }));
       setIsVerified(true);
    } finally {
       setIsAnalyzing(false);
    }
  };
  
  // Lógica de Navegação
  const handleFinishCase = () => {
    if (isRunnerMode) {
      // MODO RUNNER: Volta para o Handler
      navigation.replace('simulado-completo-handler', {
        questQueue: runnerContext.questQueue,
        currentStep: runnerContext.currentStep + 1,
        results: runnerContext.results,
      });
    } else {
      // MODO PADRÃO: Volta (para ModuleLessonsPage)
      navigation.goBack();
    }
  };

  // Fallback
  if (!currentCaseData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <ArrowLeft size={24} color={cores.textPrimary} />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Erro</Text>
        </View>
        <View style={styles.centered}>
            <Text style={styles.errorText}>Erro ao carregar dados do caso.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allAnswered = answers.every(ans => ans && ans.trim().length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={cores.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
             {isRunnerMode ? 'Simulado Completo - Case' : (route.params.lessonTitle || `Case Prático`)}
          </Text>
        </View>

        {/* ScrollView com o conteúdo */}
        <ScrollView
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONTEXTO</Text>
            <View style={styles.questionContainer}>
              <Text style={styles.contextText}>
                {currentCaseData.context || 'Contexto não carregado.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERGUNTAS</Text>
            {currentCaseData.questions?.map((q, index) => {
              const aiResult = aiAnalysisResults[index];
              let cardStyle = [styles.questionContainer, styles.questionCardMargin];
              let inputStyle = [styles.answerInput];
              if (isVerified && aiResult?.evaluation === 'correct') {
                  cardStyle.push(styles.cardCorrect);
                  inputStyle.push(styles.inputCorrect);
              } else if (isVerified && aiResult?.evaluation === 'incorrect') {
                  cardStyle.push(styles.cardIncorrect);
                  inputStyle.push(styles.inputIncorrect);
              } else if (isVerified && aiResult?.evaluation === 'partial') {
                  cardStyle.push(styles.cardPartial);
                  inputStyle.push(styles.inputPartial);
              }

              return (
                <View key={index} style={cardStyle}>
                  <View style={styles.topicContainer}>
                      <Text style={styles.topicText}>{q.modulo || 'Módulo Indefinido'}</Text>
                      {q.dificuldade && (
                      <View style={[
                          styles.difficultyBadge,
                          q.dificuldade === 'Fácil' && styles.difficultyEasy,
                          q.dificuldade === 'Médio' && styles.difficultyMedium,
                          q.dificuldade === 'Difícil' && styles.difficultyHard,
                      ]}>
                          <Text style={styles.difficultyText}>{q.dificuldade}</Text>
                      </View>
                      )}
                  </View>

                  <Text style={styles.mainQuestionText}>
                    {`${index + 1}. ${q.pergunta || 'Pergunta não carregada.'}`}
                  </Text>

                  <TextInput
                    style={inputStyle}
                    placeholder="Digite sua resposta..."
                    placeholderTextColor={cores.textSecondary}
                    value={answers[index] || ''}
                    onChangeText={(text) => handleAnswerChange(text, index)}
                    multiline={true}
                    editable={!isVerified && !isAnalyzing}
                  />

                  {isVerified && aiAnalysisResults[index] && (
                    <View style={[
                      styles.explanationBox,
                      aiResult.evaluation === 'correct' && styles.explanationBoxCorrect,
                      aiResult.evaluation === 'incorrect' && styles.explanationBoxIncorrect,
                      aiResult.evaluation === 'partial' && styles.explanationBoxPartial,
                      (!['correct', 'incorrect', 'partial'].includes(aiResult.evaluation)) && styles.explanationBoxNeutral
                    ]}>
                      <View style={[
                         styles.explanationHeader,
                         aiResult.evaluation === 'correct' && styles.explanationHeaderCorrect,
                         aiResult.evaluation === 'incorrect' && styles.explanationHeaderIncorrect,
                         aiResult.evaluation === 'partial' && styles.explanationHeaderPartial,
                         (!['correct', 'incorrect', 'partial'].includes(aiResult.evaluation)) && styles.explanationHeaderNeutral
                      ]}>
                        <Text style={[
                           styles.explanationHeaderText,
                           aiResult.evaluation === 'correct' && styles.explanationHeaderTextCorrect,
                           aiResult.evaluation === 'incorrect' && styles.explanationHeaderTextIncorrect,
                           aiResult.evaluation === 'partial' && styles.explanationHeaderTextPartial,
                           (!['correct', 'incorrect', 'partial'].includes(aiResult.evaluation)) && styles.explanationHeaderTextNeutral
                        ]}>
                          {aiResult.evaluation === 'correct' ? 'Correto' :
                           aiResult.evaluation === 'incorrect' ? 'Incorreto' :
                           aiResult.evaluation === 'partial' ? 'Parcialmente Correto' :
                           'Análise'}
                        </Text>
                      </View>

                      {aiResult.evaluation !== 'correct' && (
                        <>
                          <Text style={[styles.explanationText, styles.idealAnswerText]}>
                             <Text style={{fontWeight: 'bold'}}>Resposta Ideal: </Text>{q.resposta_ideal || '-'}
                          </Text>
                          <View style={styles.explanationDivider}/>
                        </>
                      )}

                      <Text style={styles.explanationText}>
                         <Text style={{fontWeight: 'bold'}}> CertifAI: </Text>
                         {aiResult.justification || 'Sem justificativa da IA.'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Flutuante */}
        {!isVerified && !isAnalyzing && (
            <View style={styles.floatingFooter}>
              <TouchableOpacity
                 style={[styles.footerButton, (!allAnswered) && styles.footerButtonDisabled]}
                 onPress={handleAiBulkAnalysis}
                 disabled={!allAnswered || isAnalyzing}
              >
                <Text style={styles.footerButtonText}>Corrigir com IA</Text>
              </TouchableOpacity>
            </View>
        )}
        {isAnalyzing && (
             <View style={styles.floatingFooter}>
                <View style={[styles.footerButton, styles.footerButtonLoading]}>
                    <ActivityIndicator color={cores.textLight} />
                    <Text style={styles.footerButtonText}>Analisando...</Text>
                </View>
             </View>
        )}
         {isVerified && !isAnalyzing && (
             <View style={styles.floatingFooter}>
                 <TouchableOpacity
                     style={[styles.footerButton, {backgroundColor: cores.textSecondary}]}
                     onPress={handleFinishCase}
                 >
                     <Text style={styles.footerButtonText}>
                       {isRunnerMode ? 'Próxima Questão' : 'Voltar'}
                     </Text>
                 </TouchableOpacity>
             </View>
         )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// Estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: cores.textSecondary, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: cores.background,
    gap: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20, // Ajustado
    fontWeight: 'bold',
    color: cores.textPrimary,
    flexShrink: 1, 
  },
  mainContent: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.textSecondary,
    paddingHorizontal: 4,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  questionContainer: {
    padding: 16,
    backgroundColor: cores.cardBackground,
    borderRadius: 16,
    shadowColor: cores.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  questionCardMargin: {
     marginBottom: 16,
  },
  contextText: {
     fontSize: 15,
     color: cores.textPrimary,
     lineHeight: 22,
     opacity: 0.9
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
    paddingBottom: 12,
    gap: 8,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textSecondary,
    flexShrink: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  difficultyEasy: { backgroundColor: cores.green50 },
  difficultyMedium: { backgroundColor: '#FEF9C3' },
  difficultyHard: { backgroundColor: cores.red50 },
  difficultyText: { fontSize: 11, fontWeight: 'bold', color: cores.textPrimary },
  mainQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.textPrimary,
    lineHeight: 23,
    marginBottom: 16,
  },
  answerInput: {
    backgroundColor: cores.background,
    borderColor: cores.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: cores.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
   cardCorrect: { borderColor: cores.greenBorder },
   cardIncorrect: { borderColor: cores.redBorder },
   cardPartial: { borderColor: cores.orangeBorder }, 
   inputCorrect: { backgroundColor: cores.green50, borderColor: cores.greenBorder },
   inputIncorrect: { backgroundColor: cores.red50, borderColor: cores.redBorder },
   inputPartial: { backgroundColor: cores.orangeBg, borderColor: cores.orangeBorder }, 
  explanationBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  explanationBoxNeutral: { borderColor: cores.border, backgroundColor: cores.cardBackground },
  explanationBoxCorrect: { borderColor: cores.greenBorder, backgroundColor: cores.green50 },
  explanationBoxIncorrect: { borderColor: cores.redBorder, backgroundColor: cores.red50 },
  explanationBoxPartial: { borderColor: cores.orangeBorder, backgroundColor: cores.orangeBg }, 
  explanationHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  explanationHeaderNeutral: { borderColor: cores.border },
  explanationHeaderCorrect: { borderColor: cores.greenBorder },
  explanationHeaderIncorrect: { borderColor: cores.redBorder },
  explanationHeaderPartial: { borderColor: cores.orangeBorder }, 
  explanationHeaderText: { fontWeight: 'bold', fontSize: 13 },
  explanationHeaderTextNeutral: { color: cores.textSecondary },
  explanationHeaderTextCorrect: { color: cores.greenText },
  explanationHeaderTextIncorrect: { color: cores.redText },
  explanationHeaderTextPartial: { color: cores.orangeText }, 
  explanationText: {
    paddingHorizontal: 12,
    paddingVertical: 8, 
    fontSize: 14,
    color: cores.textPrimary,
    lineHeight: 20,
  },
  idealAnswerText: {
     fontStyle: 'italic',
     color: cores.textSecondary,
     paddingBottom: 0, 
     paddingTop: 12, 
  },
   explanationDivider: {
    height: 1,
    backgroundColor: cores.border,
    marginHorizontal: 12,
    marginVertical: 4, 
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: cores.background,
    borderTopWidth: 1,
    borderTopColor: cores.border,
  },
  footerButton: {
    backgroundColor: cores.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  footerButtonText: { color: cores.textLight, fontSize: 16, fontWeight: 'bold' },
  footerButtonDisabled: { backgroundColor: cores.textSecondary, opacity: 0.6, elevation: 0 },
  footerButtonLoading: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: cores.textSecondary,
    opacity: 0.8,
  },
});