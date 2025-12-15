import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  FlatList, 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../context/AuthContext';
import { X, Check, Sparkles, Send, ArrowLeft } from 'lucide-react-native';
import PremiumGuard from '../components/PremiumGuard'; // <--- Importando o Guardião Premium

const cores = {
  primary: '#00C853',
  secondary: '#1A202C',
  softGray: '#F7FAFC',
  gray200: '#E2E8F0',
  gray500: '#64748B',
  gray700: '#334155',
  light: '#FFFFFF',
  red50: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',
  green50: '#F0FDF4',
  green500: '#22C55E',
  green700: '#007032',
  redBorder: '#FECACA', 
  greenBorder: '#B3EBC6',
};

const AiMessageRenderer = ({ text }) => {
  if (!text) return null;
  const parts = text.split('**');
  return (
    <Text style={styles.aiMessageText}>
      {parts.map((part, index) =>
        index % 2 === 1 ? <Text key={index} style={{ fontWeight: 'bold' }}>{part}</Text> : part
      )}
    </Text>
  );
};

const QuestionReviewCard = ({ question, onAskAI }) => {
  const { 
    question_context, 
    question_main, 
    options, 
    explanation, 
    user_answer, 
    correct_answer,
    question_type 
  } = question;

  const isCorrect = question_type === 'mc' 
    ? (user_answer === correct_answer) 
    : (explanation && !explanation.toLowerCase().includes('incorreto'));

  const renderMCOptions = () => (
    <View style={styles.optionsContainer}>
      {options && typeof options === 'object' ? (
        Object.entries(options).map(([key, value]) => {
          const isUserAnswer = user_answer === key;
          const isCorrectAnswer = correct_answer === key;
  
          let optionStyle = [styles.optionBtn];
          if (isCorrectAnswer) optionStyle.push(styles.optionCorrect);
          else if (isUserAnswer && !isCorrectAnswer) optionStyle.push(styles.optionIncorrect);
  
          return (
            <View key={key} style={optionStyle}>
              <View style={styles.iconContainer}>
                {isCorrectAnswer && <Check color={cores.green500} />}
                {isUserAnswer && !isCorrectAnswer && <X color={cores.red500} />}
                {!isUserAnswer && !isCorrectAnswer && <Text style={styles.optionKey}>{key}</Text>}
              </View>
              <Text style={styles.optionValue}>{value}</Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.errorText}>Erro: Opções não encontradas.</Text>
      )}
    </View>
  );

  const renderCaseAnswers = () => (
    <View style={styles.caseContainer}>
      <Text style={styles.caseLabel}>Sua Resposta:</Text>
      <View style={[styles.caseBox, styles.caseUser]}>
        <Text style={styles.caseText}>{user_answer || "(Não respondeu)"}</Text>
      </View>
      <Text style={styles.caseLabel}>Resposta Ideal (sugerida):</Text>
      <View style={[styles.caseBox, styles.caseIdeal]}>
        <Text style={styles.caseText}>{correct_answer}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionContainer}>
        {question_context && (
          <Text style={styles.contextText}>{question_context}</Text>
        )}
        <Text style={styles.mainQuestionText}>{question_main}</Text>
      </View>

      <View style={[
        styles.explanationBox, 
        isCorrect ? styles.explanationBoxCorrect : styles.explanationBoxIncorrect
      ]}>
        <View style={[
          styles.explanationHeader,
          isCorrect ? styles.explanationHeaderCorrect : styles.explanationHeaderIncorrect
        ]}>
          <Text style={[
            styles.explanationHeaderText,
            isCorrect ? styles.explanationHeaderTextCorrect : styles.explanationHeaderTextIncorrect
          ]}>
            Análise da IA (Explicação)
          </Text>
        </View>
        <Text style={styles.explanationText}>
          {explanation || "Sem explicação disponível."}
        </Text>
      </View>

      {question_type === 'mc' ? renderMCOptions() : renderCaseAnswers()}

      {/* --- BOTÃO AGORA PROTEGIDO PELO PREMIUM GUARD --- */}
      <PremiumGuard onPress={() => onAskAI(question)}>
        <View style={styles.aiButton}>
          <Sparkles size={20} color={cores.primary} />
          <Text style={styles.aiButtonText}>Perguntar à IA sobre esta questão</Text>
        </View>
      </PremiumGuard>
      
    </View>
  );
};

export default function ReviewSimuladoPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, sessionTitle } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [currentAIQuestion, setCurrentAIQuestion] = useState(null);
  
  const typingIntervalRef = useRef(null);

  // --- FUNÇÃO DE LIMPEZA DE DIGITAÇÃO ---
  const stopTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsAiReplying(false);
  };

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);

  // Busca dados
  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não fornecido.');
      setLoading(false);
      return;
    }
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        const { data: answersData, error: answersError } = await supabase
          .from('simulado_answers')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }); 

        if (answersError) throw answersError;
        setAnswers(answersData || []);
      } catch (err) {
        console.error("Erro ao buscar dados da revisão:", err);
        setError(err.message || "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviewData();
  }, [sessionId]);

  const simulateTyping = (fullText) => {
    const words = fullText.split(' ');
    let wordIndex = 0;
    
    // Garante que não há intervalo anterior rodando
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        const textToShow = words.slice(0, wordIndex + 1).join(' ');
        setChatHistory((prev) => {
          const historyWithoutLast = prev.slice(0, -1);
          const lastMessage = prev[prev.length - 1];
          const updatedMessageObject = { ...lastMessage, text: textToShow };
          return [...historyWithoutLast, updatedMessageObject];
        });
        wordIndex++;
      } else {
        stopTyping();
      }
    }, 50);
  };

  const openAiChat = (question) => {
    stopTyping(); // Limpa animações anteriores ao abrir nova conversa
    
    setCurrentAIQuestion(question); 
    
    let hiddenPrompt = "";
    if (question.question_type === 'mc' && question.options) {
      hiddenPrompt = `Estou revisando esta questão de Múltipla Escolha:
- Pergunta: "${question.question_main}"
- Minha resposta: "${question.options[question.user_answer] || 'Não respondi'}" (${question.user_answer})
- Correta: "${question.options[question.correct_answer]}" (${question.correct_answer})

Pode me dar uma análise detalhada sobre meu erro (ou acerto)?`;
    } else if (question.question_type === 'case') {
      hiddenPrompt = `Estou revisando esta questão de Case Prático:
- Pergunta: "${question.question_main}"
- Minha resposta: "${question.user_answer || 'Não respondi'}"
- Resposta Ideal: "${question.correct_answer}"
- Análise da IA (que já recebi): "${question.explanation}"

Pode me dar um coaching mais detalhado sobre o que eu poderia ter feito melhor?`;
    } else {
      hiddenPrompt = "Analise esta questão.";
    }

    const hiddenHistory = [{ role: "user", text: hiddenPrompt }];
    setChatHistory([]); 
    setIsModalOpen(true);
    
    getAiReviewChat(hiddenHistory, question);
  };
  
  const getAiReviewChat = async (currentHistory, questionContext) => {
    setIsAiReplying(true);
    setChatHistory((prev) => [...prev, { role: "ai", text: '' }]);

    const requestBody = {
      chatHistory: currentHistory, 
      questionContext: questionContext,
    };

    try {
      const { data, error } = await supabase.functions.invoke('get-ai-review-chat', { 
        body: JSON.stringify(requestBody) 
      });

      if (error) throw error;
      const aiResponseText = data.text; 
      simulateTyping(aiResponseText);

    } catch (error) {
      console.error("Erro ao chamar a Edge Function:", error);
      setChatHistory((prev) => {
         const historyWithoutLast = prev.slice(0, -1);
         return [...historyWithoutLast, { role: "ai", text: "Desculpe, não consegui processar a correção neste momento." }];
      });
      setIsAiReplying(false);
    }
  };
  
  const handleSendMessage = () => {
    if (!chatInput.trim() || isAiReplying || !currentAIQuestion) return;
    stopTyping(); // Prevenção extra
    
    const newUserMessage = { role: 'user', text: chatInput };
    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);
    setChatInput('');
    
    getAiReviewChat(newHistory, currentAIQuestion); 
  };

  if (loading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color={cores.primary} style={{marginTop: 50}} /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.safeArea}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <ArrowLeft size={24} color={cores.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
                Revisão: {sessionTitle || 'Simulado'}
            </Text>
        </View>

        <FlatList
          data={answers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <QuestionReviewCard 
              question={item} 
              onAskAI={openAiChat}
            />
          )}
          style={styles.mainContent}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        />
      </View>
      
      {/* Modal de IA */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={isModalOpen} 
        onRequestClose={() => {
          stopTyping(); // Limpa animação ao fechar via hardware back
          setIsModalOpen(false);
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                 <Sparkles size={20} color={cores.primary} />
                 <Text style={styles.headerTitle}>Correção com CertifAI</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  stopTyping(); // Limpa animação ao fechar via botão X
                  setIsModalOpen(false);
                }} 
                style={styles.closeButton}
              >
                <X size={20} color={cores.secondary} />
              </TouchableOpacity>
            </View>
             <View style={styles.modalQuestionContext}>
                <Text style={styles.modalContextTitle}>Analisando a questão:</Text>
                <Text style={styles.modalContextQuestion} numberOfLines={3}>
                  {currentAIQuestion?.question_main || "..."}
                </Text>
             </View>
             <ScrollView style={styles.chatScrollView} contentContainerStyle={{ paddingBottom: 20 }}>
                {chatHistory.map((msg, index) => (
                   <View key={index} style={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
                      {msg.role === 'user' ? (
                        <Text style={styles.userMessageText}>{msg.text}</Text>
                      ) : (
                        msg.text.length === 0 && isAiReplying ? (
                          <ActivityIndicator size="small" color={cores.primary} />
                        ) : (
                          <AiMessageRenderer text={msg.text} />
                        )
                      )}
                   </View>
                ))}
             </ScrollView>
             <View style={styles.chatInputContainer}>
                <TextInput 
                  style={styles.chatInput} 
                  placeholder="Tire suas dúvidas..." 
                  value={chatInput} 
                  onChangeText={setChatInput} 
                  onSubmitEditing={handleSendMessage} 
                  editable={!isAiReplying}
                  placeholderTextColor={cores.gray500}
                  selectionColor={cores.primary}
                  multiline={true}
                />
                <TouchableOpacity 
                  onPress={handleSendMessage} 
                  disabled={!chatInput.trim() || isAiReplying} 
                  style={[styles.sendButton, (!chatInput.trim() || isAiReplying) && styles.sendButtonDisabled]}
                >
                   <Send size={20} color={cores.light} />
                </TouchableOpacity>
             </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.softGray, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  container: { flex: 1 },
  header: { 
    backgroundColor: cores.light, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderColor: cores.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Platform.OS === 'android' ? 20 : 12,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: cores.secondary, flex: 1 },
  closeButton: { padding: 4 },
  
  mainContent: { flex: 1, paddingHorizontal: 16 },

  questionCard: {
    backgroundColor: cores.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.gray200,
    marginBottom: 16,
    overflow: 'hidden',
  },
  questionContainer: { padding: 16 },
  contextText: { fontSize: 15, color: cores.gray700, lineHeight: 22, marginBottom: 16 },
  mainQuestionText: { fontSize: 16, fontWeight: '600', color: cores.secondary, lineHeight: 20 },
  
  explanationBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.gray200,
    marginTop: 8,
  },
  explanationBoxCorrect: { backgroundColor: cores.green50, borderColor: cores.greenBorder },
  explanationBoxIncorrect: { backgroundColor: cores.red50, borderColor: cores.redBorder },
  explanationHeader: { paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, backgroundColor: 'rgba(0, 0, 0, 0.03)' },
  explanationHeaderCorrect: { borderColor: cores.greenBorder },
  explanationHeaderIncorrect: { borderColor: cores.redBorder },
  explanationHeaderText: { fontWeight: 'bold', fontSize: 14 },
  explanationHeaderTextCorrect: { color: cores.green700 },
  explanationHeaderTextIncorrect: { color: cores.red600 },
  explanationText: { padding: 16, fontSize: 15, color: cores.secondary, lineHeight: 22 },
  
  optionsContainer: { gap: 12, padding: 16 },
  optionBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderWidth: 2, 
    borderColor: cores.gray200, borderRadius: 12, backgroundColor: cores.light 
  },
  optionCorrect: { borderColor: cores.green500, backgroundColor: cores.green50 },
  optionIncorrect: { borderColor: cores.red500, backgroundColor: cores.red50 },
  iconContainer: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.softGray },
  optionKey: { fontSize: 16, fontWeight: 'bold', color: cores.secondary },
  optionValue: { flex: 1, fontSize: 14, fontWeight: '600', color: cores.secondary },
  
  caseContainer: { padding: 16, gap: 8 },
  caseLabel: { fontSize: 13, fontWeight: '600', color: cores.gray500, paddingLeft: 4 },
  caseBox: { borderRadius: 8, padding: 12, borderWidth: 1 },
  caseUser: { backgroundColor: cores.softGray, borderColor: cores.gray200 },
  caseIdeal: { backgroundColor: cores.green50, borderColor: cores.greenBorder },
  caseText: { fontSize: 14, color: cores.secondary, lineHeight: 20 },

  aiButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12,
    backgroundColor: cores.softGray, borderTopWidth: 1, borderTopColor: cores.gray200,
  },
  aiButtonText: { color: cores.primary, fontWeight: '600', fontSize: 15 },
  
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: cores.softGray },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center' },
  primaryButton: { backgroundColor: cores.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: cores.light, fontSize: 16, fontWeight: 'bold' },

  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: { height: '85%', backgroundColor: cores.softGray, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderColor: cores.gray200, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: cores.light },
  modalQuestionContext: { padding: 16, backgroundColor: cores.light, borderBottomWidth: 1, borderColor: cores.gray200 },
  modalContextTitle: { fontSize: 12, color: cores.gray500, fontWeight: '600', marginBottom: 4 },
  modalContextQuestion: { fontSize: 14, color: cores.secondary },
  chatScrollView: { flex: 1, padding: 16, backgroundColor: cores.softGray },
  
  userMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: cores.primary, 
    padding: 12, 
    borderRadius: 16, 
    borderBottomRightRadius: 2, 
    marginBottom: 8, 
    maxWidth: '80%' 
  },
  userMessageText: { color: cores.light, fontSize: 14 },
  aiMessage: { 
    alignSelf: 'center', 
    backgroundColor: cores.light, 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 10, 
    maxWidth: '99%', 
    shadowColor: 'rgba(0,0,0,0.05)', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  aiMessageText: { color: cores.secondary, fontSize: 14, lineHeight: 20, textAlign: 'left' },
  
  chatInputContainer: { 
    flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 12, marginBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingVertical: 8, paddingHorizontal: 12, backgroundColor: cores.light, borderRadius: 30, borderWidth: 1,
    borderColor: cores.gray200, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 5, elevation: 3,
  },
  chatInput: { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: Platform.OS === 'ios' ? 10 : 8, maxHeight: 120, color: cores.secondary },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: cores.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: Platform.OS === 'ios' ? 0 : 2 },
  sendButtonDisabled: { backgroundColor: cores.gray200 },
});
