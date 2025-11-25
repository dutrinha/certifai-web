// /src/pages/ChatPage.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  // Alert, // Alert removido
  Modal, // Importado Modal
  TouchableWithoutFeedback // Importado para fechar ao clicar fora
} from 'react-native';
import { supabase, useAuth } from '../context/AuthContext';
import { Send, Zap, RotateCcw } from 'lucide-react-native';

// --- IMPORTS DE SEGURANÇA ---
import PremiumGuard from '../components/PremiumGuard';

// Paleta de Cores
const cores = {
  primary: '#00C853',
  secondary: '#1A202C',
  textLight: '#FFFFFF',
  softGray: '#F7FAFC',
  gray200: '#E2E8F0',
  gray500: '#64748B',
  light: '#FFFFFF',
  red600: '#DC2626', // Adicionado para o botão de reset
  red50: '#FEF2F2',
};

// Componente Markdown
const AiMessageRenderer = ({ text }) => {
  if (!text) return null;
  const parts = text.split('**');
  return (
    <Text style={styles.aiMessageText}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Text key={index} style={{ fontWeight: 'bold' }}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

// Componente Quick Reply
const QuickReplyFooter = ({ replies, onTap }) => {
  return (
    <View style={styles.quickReplyContainer}>
      {replies.map((reply) => (
        <TouchableOpacity
          key={reply}
          style={styles.quickReplyButton}
          onPress={() => onTap(reply)}
        >
          <Text style={styles.quickReplyText}>{reply}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Constantes Iniciais
const INITIAL_MESSAGE = {
  role: 'ai',
  text: 'Olá! Eu sou o CertifAI. Como posso ajudar com suas dúvidas sobre finanças e certificações?',
};
const INITIAL_QUICK_REPLIES = [
  'Fale sobre Renda Fixa',
  'O que é o FGC?',
];


export default function ChatPage() {
  const { user, isPro } = useAuth();
  
  const [chatHistory, setChatHistory] = useState([INITIAL_MESSAGE]);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  
  // ESTADO DO MODAL PERSONALIZADO
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

  const flatListRef = useRef(null);
  const typingIntervalRef = useRef(null);
  
  const [isShortAnswer, setIsShortAnswer] = useState(true);
  const [quickReplies, setQuickReplies] = useState(INITIAL_QUICK_REPLIES);

  useEffect(() => {
    if (!isPro) {
      setIsShortAnswer(true);
    }
  }, [isPro]);

  const toggleShortAnswer = () => setIsShortAnswer(prev => !prev);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const simulateTyping = (fullText) => {
    const words = fullText.split(' ');
    let wordIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        const textToShow = words.slice(0, wordIndex + 1).join(' ');
        
        setChatHistory((prev) => {
          const historyWithoutLast = prev.slice(0, -1);
          const lastMessage = prev[prev.length - 1];
          const updatedMessageObject = {
            ...lastMessage,
            text: textToShow,
          };
          return [...historyWithoutLast, updatedMessageObject];
        });
        
        wordIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsAiReplying(false);
      }
    }, 50);
  };
  
  const sendChatMessage = async (messageText) => {
    setIsAiReplying(true);
    setQuickReplies([]); 
    
    setChatHistory((prev) => [...prev, { role: 'ai', text: '' }]);
    
    const fullHistory = [...chatHistory, { role: 'user', text: messageText }];
    const historyForAPI = fullHistory.slice(1);
    
    try {
      const requestBody = {
        history: historyForAPI.map(msg => ({ role: msg.role, text: msg.text })),
        isShortAnswer: isPro ? isShortAnswer : true,
      };

      const { data, error } = await supabase.functions.invoke(
        'get-ai-general-chat',
        { 
          body: JSON.stringify(requestBody)
        } 
      );
      
      if (error) throw error;
      const aiResponseText = data.text || "Não recebi uma resposta.";
      simulateTyping(aiResponseText);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      let errorMessage = error.message;
      if (error.message.includes('GEMINI_API_KEY')) {
          errorMessage = "A chave de API do chat não foi configurada no servidor.";
      }

      setChatHistory((prev) => {
         const historyWithoutLast = prev.slice(0, -1);
         return [...historyWithoutLast, { role: 'ai', text: `Desculpe, ocorreu um erro: ${errorMessage}` }];
      });
      setIsAiReplying(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || isAiReplying) return;
    const userMessageText = chatInput.trim();
    const userMessage = { role: 'user', text: userMessageText };
    setChatHistory([...chatHistory, userMessage]);
    setChatInput('');
    sendChatMessage(userMessageText);
  };
  
  const handleQuickReplyTap = (replyText) => {
    if (isAiReplying) return;
    const userMessage = { role: 'user', text: replyText };
    setChatHistory([...chatHistory, userMessage]);
    sendChatMessage(replyText);
  };

  // Abre o modal personalizado
  const handleResetChat = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setIsResetModalVisible(true);
  };

  // Lógica executada ao confirmar no modal
  const confirmResetChat = () => {
    setIsAiReplying(false);
    setChatInput('');
    const resetMsg = {
      role: 'ai',
      text: 'Olá! Eu sou o CertifAI. Como posso ajudar?',
    };
    setChatHistory([resetMsg]);
    setQuickReplies([...INITIAL_QUICK_REPLIES]);
    setIsResetModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerButtonContainer}>
          
          <PremiumGuard onPress={toggleShortAnswer}>
            <View style={[styles.toggleButton, isShortAnswer && styles.toggleButtonActive]}>
              <Zap size={16} color={isShortAnswer ? cores.primary : cores.gray500} />
              <Text style={[styles.toggleText, isShortAnswer && styles.toggleTextActive]}>
                {isShortAnswer ? "Resposta Curta" : "Resposta Completa"}
              </Text>
            </View>
          </PremiumGuard>
          
          <TouchableOpacity 
            onPress={handleResetChat} 
            style={styles.resetButton}
          >
            <RotateCcw size={18} color={cores.gray500} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} 
      >
        <FlatList
          ref={flatListRef}
          style={styles.chatScrollView}
          contentContainerStyle={styles.chatScrollContent}
          data={chatHistory}
          extraData={chatHistory}
          keyExtractor={(item, index) => index.toString()}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            if (item.role === 'user') {
              return (
                <View style={styles.userMessage}>
                  <Text style={styles.userMessageText}>{item.text}</Text>
                </View>
              );
            }
            return (
              <View style={styles.aiMessage}>
                {item.text.length === 0 && isAiReplying ? (
                    <ActivityIndicator size="small" color={cores.primary} />
                ) : (
                    <AiMessageRenderer text={item.text} />
                )}
              </View>
            );
          }}
          
          ListFooterComponent={
            !isAiReplying && chatHistory.length === 1 ? (
              <QuickReplyFooter
                replies={quickReplies}
                onTap={handleQuickReplyTap}
              />
            ) : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder={isShortAnswer ? "Pergunte (Resposta rápida)..." : "Pergunte (Resposta completa)..."}
            value={chatInput}
            onChangeText={setChatInput}
            editable={!isAiReplying}
            multiline={true} 
            placeholderTextColor={cores.gray500}
            selectionColor={cores.primary}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!chatInput.trim() || isAiReplying}
            style={[
              styles.sendButton,
              (!chatInput.trim() || isAiReplying) && styles.sendButtonDisabled,
            ]}
          >
            <Send size={20} color={cores.light} />
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>

      {/* MODAL DE CONFIRMAÇÃO DE RESET */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isResetModalVisible}
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsResetModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Reiniciar Chat</Text>
                   <Text style={styles.modalDescription}>
                     Tem certeza que deseja apagar todo o histórico da conversa atual? Esta ação não pode ser desfeita.
                   </Text>
                </View>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalButtonCancel}
                    onPress={() => setIsResetModalVisible(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalButtonConfirm}
                    onPress={confirmResetChat}
                  >
                    <Text style={styles.modalButtonConfirmText}>Reiniciar</Text>
                  </TouchableOpacity>
                </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: cores.softGray,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.softGray,
    justifyContent: 'flex-end',
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    padding: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: cores.light,
    borderWidth: 1,
    borderColor: cores.gray200,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#E6F8EB',
    borderColor: cores.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.gray500,
  },
  toggleTextActive: {
    color: cores.primary,
  },
  keyboardContainer: {
    flex: 1, 
  },
  chatScrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatScrollContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  aiMessage: {
    alignSelf: 'stretch',
    backgroundColor: cores.light,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  aiMessageText: {
    color: cores.secondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: cores.primary,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 14,
    marginBottom: 10,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    color: cores.textLight,
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16, 
    paddingVertical: 8,
    backgroundColor: cores.light, 
    borderTopWidth: 1,
    borderTopColor: cores.gray200,
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    color: cores.secondary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  sendButtonDisabled: {
    backgroundColor: cores.gray200,
  },
  quickReplyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 10, 
    marginTop: 4,
    marginBottom: 10,
  },
  quickReplyButton: {
    backgroundColor: cores.light,
    borderColor: cores.primary,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  quickReplyText: {
    color: cores.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ESTILOS DO MODAL DE RESET
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: cores.light,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: cores.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: cores.gray200,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.secondary,
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: cores.red50,
    borderWidth: 1,
    borderColor: cores.red600,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: cores.red600,
  },
});