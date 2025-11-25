// src/Screens/OnboardingFlowScreen.js (VERSÃO FINAL - PAYWALL ATIVO NO FIM)
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  FlatList,
  Animated,
  TextInput,
  useWindowDimensions, // Import added
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../context/OnboardingContext';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import {
  Sparkles, Check, Lock, Briefcase, TrendingUp, Brain,
  Layers, ArrowLeft, Target, BarChart3, UserCheck,
  BookOpen, MessageSquare, Shield, X, User
} from 'lucide-react-native';

import { supabase, useAuth } from '../context/AuthContext';
import LoginAuth from '../context/LoginAuth';

// ☆ IMPORTANTE: Importando o Modal Real de Paywall
import PaywallModal from '../components/PaywallModal';

// Cores
const cores = {
  primary: '#00C853',
  light: '#FFFFFF',
  secondary: '#1A202C',
  gray100: '#F1F5F9',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  red50: '#FEE2E2',
  red500: '#EF4444',
  green50: '#F0FDF4',
  green500: '#22C55E',
  green700: '#007032',
  red600: '#DC2626',
  primaryLight: '#E6F8EB',
  neonOrange: "000000"
};

// --- COMPONENTES INTERNOS (MANTIDOS) ---

const MarkdownRenderer = ({ text, style }) => {
  if (!text) return null;
  const parts = text.split('**');
  return (
    <Text style={style}>
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

const dummyQuestion = {
  question: "Qual título público federal protege o investidor contra a inflação (IPCA)?",
  options: { A: "Tesouro Selic (LFT)", B: "Tesouro Prefixado (LTN)", C: "Tesouro IPCA+ (NTN-B)", D: "CDB de liquidez diária" },
  answer: "C",
  explanation: {
    C: { title: "Você tem boa base!", text: "Exato! O **Tesouro IPCA+ (NTN-B)** é o único que garante o rendimento acima da inflação. Vamos te ajudar a dominar todos os pontos." },
    A: { title: "Quase lá!", text: "O **Tesouro Selic (LFT)** protege da variação da *taxa de juros*, mas não da *inflação*." },
    B: { title: "Cuidado com essa!", text: "O **Prefixado (LTN)** tem taxa *fixa*, então se a inflação subir, seu dinheiro perde valor." },
    D: { title: "Atenção aos detalhes!", text: "O **CDB** é um título *privado* (de banco). A pergunta foi sobre *públicos federais*." }
  }
};

const MotivationButton = ({ icon: Icon, title, subtitle, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.motivationButton, selected && styles.motivationButtonSelected]}
    onPress={onPress}
  >
    <Icon size={24} color={selected ? cores.primary : cores.gray500} style={styles.motivationIcon} />
    <View style={styles.motivationTextContainer}>
      <Text style={[styles.motivationTitle, selected && styles.motivationTitleSelected]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.motivationSubtitle, selected && styles.motivationSubtitleSelected]}>{subtitle}</Text>
      )}
    </View>
  </TouchableOpacity>
);

const ProductivityGraphCard = () => {
  const width = 300;
  const height = 220;
  const start = { x: 30, y: 180 };
  const mid = { x: 160, y: 100 };
  const endGood = { x: 280, y: 40 };
  const endBad = { x: 240, y: 150 };

  return (
    <View style={styles.lightGraphContainer}>
      <View style={styles.graphCardLight}>
        <Text style={styles.graphTitleLight}>Aumento de produtividade</Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              <LinearGradient id="gradPrimary" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0" stopColor={cores.primary} stopOpacity="0.1" />
                <Stop offset="1" stopColor={cores.primary} stopOpacity="0.4" />
              </LinearGradient>
            </Defs>
            {[1, 2, 3, 4].map(i => (
              <Line key={`v-${i}`} x1={i * 60} y1="20" x2={i * 60} y2="200" stroke={cores.gray200} strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {[1, 2, 3].map(i => (
              <Line key={`h-${i}`} x1="20" y1={i * 50} x2="280" y2={i * 50} stroke={cores.gray200} strokeWidth="1" strokeDasharray="4 4" />
            ))}
            <Path
              d={`M ${start.x} ${start.y} Q 120 170 ${endBad.x} ${endBad.y}`}
              stroke={cores.red500} strokeWidth="2" fill="none" opacity="0.8"
            />
            <Path
              d={`M ${start.x} ${start.y} Q 100 140 ${mid.x} ${mid.y} T ${endGood.x} ${endGood.y}`}
              stroke={cores.primary} strokeWidth="6" strokeOpacity="0.2" fill="none"
            />
            <Path
              d={`M ${start.x} ${start.y} Q 100 140 ${mid.x} ${mid.y} T ${endGood.x} ${endGood.y}`}
              stroke={cores.primary} strokeWidth="3" fill="none"
            />
            <Circle cx={start.x} cy={start.y} r="6" fill={cores.light} stroke={cores.secondary} strokeWidth="2" />
            <Circle cx={mid.x} cy={mid.y} r="5" fill={cores.light} stroke={cores.primary} strokeWidth="3" />
            <Circle cx={endGood.x} cy={endGood.y} r="5" fill={cores.light} stroke={cores.primary} strokeWidth="3" />
          </Svg>
          <View style={[styles.labelTagLight, { left: 0, bottom: 40 }]}>
            <Text style={styles.labelTextLight}>Início</Text>
          </View>
          <View style={[styles.labelTagLight, { left: 100, top: 70 }]}>
            <Text style={styles.labelTextLight}>em 10 dias</Text>
          </View>
          <View style={[styles.labelTagLight, { right: 0, top: 10 }]}>
            <Text style={styles.labelTextLight}>Meta</Text>
          </View>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cores.primary }]} />
            <Text style={styles.legendText}>Progresso</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cores.red500 }]} />
            <Text style={styles.legendText}>Sem o CertifAI</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const CARD_MARGIN = 16;
const features = [
  { icon: Brain, title: "Cases Dissertativos", subtitle: "Corrija seu raciocínio em cenários reais." },
  { icon: BookOpen, title: "Questões Interativas", subtitle: "Aprenda com desafios dinâmicos." },
  { icon: Layers, title: "Flashcards", subtitle: "Memorize conceitos com iteração." },
  { icon: BarChart3, title: "Métricas de Hábito", subtitle: "Acompanhe sua evolução e pontos fracos." },
  { icon: Shield, title: "Todas Certificações", subtitle: "Uma assinatura, acesso total à sua carreira." },
  { icon: MessageSquare, title: "Ajuda Personalizada", subtitle: "Tire dúvidas 24/7 com o Professor IA." },
];
const duplicatedFeatures = [...features, ...features];

const FeatureCard = ({ icon: Icon, title, subtitle, cardWidth }) => (
  <View style={[styles.featureCard, { width: cardWidth }]}>
    <View style={styles.featureIconContainer}>
      <Icon size={26} color={cores.primary} />
    </View>
    <View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const AutoCarousel = () => {
  const { width } = useWindowDimensions();
  const screenWidth = Math.min(width, 1200); // Clamp to max width
  const cardWidth = (screenWidth - 48) * 0.8; // Adjust calculation based on padding

  const flatListRef = useRef(null);
  const scrollOffset = useRef(0);
  const singleListWidth = (cardWidth + CARD_MARGIN) * features.length;

  useEffect(() => {
    const scroll = () => {
      scrollOffset.current += 1;
      if (scrollOffset.current >= singleListWidth) {
        scrollOffset.current = 0;
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        flatListRef.current?.scrollToOffset({ offset: scrollOffset.current, animated: false });
      }
    };
    const timer = setInterval(scroll, 16);
    return () => clearInterval(timer);
  }, [singleListWidth]);

  return (
    <View style={[styles.carouselWrapper, { width: screenWidth + 48, marginLeft: -24 }]}>
      <FlatList
        ref={flatListRef}
        data={duplicatedFeatures}
        renderItem={({ item }) => <FeatureCard icon={item.icon} title={item.title} subtitle={item.subtitle} cardWidth={cardWidth} />}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: (screenWidth - cardWidth) / 2, gap: CARD_MARGIN }}
      />
    </View>
  );
};

// =======================================================
// ☆ COMPONENTE PRINCIPAL ☆
// =======================================================
export default function OnboardingFlowScreen() {
  const navigation = useNavigation();
  const { onboardingData, updateData } = useOnboarding();
  const { user, isPro } = useAuth();

  // Começa no passo 8 (Paywall) se já tiver usuário real
  const initialStep = (user && !user.is_anonymous) ? 8 : 1;
  const [step, setStep] = useState(initialStep);

  const [motivation, setMotivation] = useState(null);
  const [certification, setCertification] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [name, setName] = useState('');

  const nextStep = (data = {}) => {
    if (Object.keys(data).length > 0) updateData(data);
    setIsVerified(false);
    setSelectedAnswer(null);
    setStep((s) => s + 1);
  };
  const prevStep = () => (step === 1 ? navigation.goBack() : setStep((s) => s - 1));

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <TouchableOpacity onPress={prevStep} style={styles.backButton}>
        <ArrowLeft size={24} color={cores.gray500} />
      </TouchableOpacity>
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${((step + 1) / 9) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{step + 1} / 9</Text>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Para qual certificação você estuda?</Text>
            <Text style={styles.subtitle}>Isso nos ajuda a ajustar seu plano de estudos.</Text>
            <MotivationButton icon={Briefcase} title="CPA" subtitle="Porta de entrada do mercado financeiro" selected={certification === 'cpa'} onPress={() => setCertification('cpa')} />
            <MotivationButton icon={Briefcase} title="C-PRO R" subtitle="Especialista em relacionamentos" selected={certification === 'cpror'} onPress={() => setCertification('cpror')} />
            <MotivationButton icon={Briefcase} title="C-PRO I" subtitle="Especialista em investimentos" selected={certification === 'cproi'} onPress={() => setCertification('cproi')} />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Por que você quer essa certificação?</Text>
            <Text style={styles.subtitle}>Isso nos ajuda a ajustar seu plano de estudos.</Text>
            <MotivationButton icon={Briefcase} title="Entrar no mercado financeiro" selected={motivation === 'novato'} onPress={() => setMotivation('novato')} />
            <MotivationButton icon={TrendingUp} title="Ser promovido(a)" selected={motivation === 'veterano'} onPress={() => setMotivation('veterano')} />
            <MotivationButton icon={UserCheck} title="Aprender para crescer" selected={motivation === 'aprendiz'} onPress={() => setMotivation('aprendiz')} />
          </View>
        );
      case 3:
        const isCorrect = selectedAnswer === dummyQuestion.answer;
        const explanationData = isVerified ? dummyQuestion.explanation[selectedAnswer || "A"] : null;
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Teste sua inteligência financeira</Text>
            <Text style={styles.subtitle}>Responda (sem medo) para calibrarmos seu nível.</Text>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{dummyQuestion.question}</Text>
            </View>
            {Object.entries(dummyQuestion.options).map(([key, value]) => {
              const isSelected = selectedAnswer === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionBtn, isSelected && !isVerified && styles.optionSelected, isVerified && key === dummyQuestion.answer && styles.optionCorrect, isVerified && isSelected && key !== dummyQuestion.answer && styles.optionIncorrect,]}
                  disabled={isVerified} onPress={() => setSelectedAnswer(key)}
                >
                  <View style={styles.iconContainer}>
                    {isVerified && key === dummyQuestion.answer && <Check color={cores.green500} />}
                    {isVerified && isSelected && key !== dummyQuestion.answer && <X color={cores.red500} />}
                    {!isVerified && <Text style={styles.optionKey}>{key}</Text>}
                    {isVerified && !isSelected && key !== dummyQuestion.answer && <Text style={styles.optionKey}>{key}</Text>}
                  </View>
                  <Text style={styles.optionValue}>{value}</Text>
                </TouchableOpacity>
              );
            })}
            {isVerified && explanationData && (
              <ScrollView style={styles.explanationScroll}>
                <View style={[styles.explanationBox, isCorrect ? styles.explanationBoxInfo : styles.explanationBoxError]}>
                  <View style={[styles.explanationHeader, isCorrect ? styles.explanationHeaderInfo : styles.explanationHeaderError]}>
                    <Sparkles size={16} color={isCorrect ? cores.primary : cores.red600} />
                    <Text style={[styles.explanationHeaderText, isCorrect ? styles.explanationHeaderTextInfo : styles.explanationHeaderTextError]}>{explanationData.title}</Text>
                  </View>
                  <MarkdownRenderer text={explanationData.text} style={styles.explanationText} />
                </View>
              </ScrollView>
            )}
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>O CertifAI cria resultados</Text>
            <Text style={styles.subtitle}>
              Estudar com IA foca seu tempo no que importa, aumentando em até 3x sua velocidade de aprendizado.
            </Text>
            <ProductivityGraphCard />
            <Text style={styles.graphSubtitle}>
              80% dos usuários CertifAI relatam se sentir “prontos para a prova” na metade do tempo.
            </Text>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>É assim que o CertifAI te faz aprender</Text>
            <Text style={styles.subtitle}>Um plano de aprovação completo na sua mão.</Text>
            <AutoCarousel />
          </View>
        );

      case 6:
        return (
          <View style={[styles.stepContainer, { alignItems: 'stretch' }]}>
            <Text style={styles.title}>Como podemos te chamar?</Text>
            <Text style={styles.subtitle}>Seu nome será usado para personalizar sua jornada.</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={cores.gray500} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor={cores.gray500}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>
        );

      case 7:
        return (
          <View style={[styles.stepContainer, { alignItems: 'stretch' }]}>
            <LoginAuth
              onLoginSuccess={() => {
                console.log("Onboarding: Login com sucesso! Avançando para o Paywall.");
                nextStep();
              }}
            />
          </View>
        );

      // ☆ CASO 8: PAYWALL MODAL (CORREÇÃO SOLICITADA) ☆
      case 8:
        const handleCompleteOnboarding = async () => {
          try {
            const { error } = await supabase.auth.updateUser({
              data: { onboarding_completed: true }
            });
            if (error) throw error;
            navigation.replace('Tabs');
          } catch (e) {
            console.error("Erro ao completar onboarding:", e);
            navigation.replace('Tabs');
          }
        };

        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>
              {isPro ? "Tudo pronto! 🚀" : "Finalizando..."}
            </Text>
            <Text style={styles.subtitle}>
              {isPro
                ? "Sua assinatura Premium está ativa. Aproveite!"
                : "Estamos preparando seu ambiente de estudos..."}
            </Text>

            {/* Se for PRO, mostra botão de entrar direto */}
            {isPro && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: cores.primary }]}
                onPress={handleCompleteOnboarding}
              >
                <Check size={18} color={cores.light} />
                <Text style={[styles.buttonText, { marginLeft: 10 }]}>Acessar o App</Text>
              </TouchableOpacity>
            )}

            {/* ☆ AQUI ESTÁ A LÓGICA PEDIDA: ☆ */}
            {/* Se NÃO é PRO, o Modal abre por cima AUTOMATICAMENTE. */}
            {/* O modal tem seu próprio botão "X" (fechar). */}
            {/* Quando fecha (onClose), chamamos handleCompleteOnboarding para ir pra Home (como Free). */}
            {!isPro && (
              <PaywallModal
                visible={true}
                onClose={handleCompleteOnboarding}
              />
            )}
          </View>
        );

      default:
        return (
          <View style={styles.stepContainer}>
            <Text>Carregando...</Text>
          </View>
        );
    }
  };

  const renderFooterButton = () => {
    switch (step) {
      case 1:
        return (
          <TouchableOpacity style={[styles.button, !certification && styles.buttonDisabled]} onPress={() => nextStep({ certification: certification })} disabled={!certification}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        );
      case 2:
        return (
          <TouchableOpacity style={[styles.button, !motivation && styles.buttonDisabled]} onPress={() => nextStep({ motivation: motivation })} disabled={!motivation}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        );
      case 3:
        return !isVerified ? (
          <TouchableOpacity style={[styles.button, !selectedAnswer && styles.buttonDisabled]} onPress={() => setIsVerified(true)} disabled={!selectedAnswer}>
            <Text style={styles.buttonText}>Verificar Resposta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        );
      case 4:
        return (
          <TouchableOpacity style={[styles.button, { backgroundColor: cores.primary }]} onPress={() => nextStep()}>
            <Text style={[styles.buttonText, { color: cores.light }]}>Continuar</Text>
          </TouchableOpacity>
        );
      case 5:
        return (
          <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
            <Text style={styles.buttonText}>Quero começar meus estudos</Text>
          </TouchableOpacity>
        );

      case 6:
        const isNameValid = name.trim().length > 1;
        return (
          <TouchableOpacity
            style={[styles.button, !isNameValid && styles.buttonDisabled]}
            onPress={() => nextStep({ name: name.trim() })}
            disabled={!isNameValid}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        );

      case 7:
        return null; // O LoginAuth tem seus próprios botões

      case 8:
        return null; // O Paywall (Modal) ou o botão PRO controlam o fluxo

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderProgressBar()}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>
      <View style={styles.footer}>
        {renderFooterButton()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.light },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  stepContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, width: '100%' },
  title: { fontSize: 26, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: cores.gray500, textAlign: 'center', marginBottom: 24 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: cores.light, borderBottomWidth: 1, borderBottomColor: cores.gray100 },
  backButton: { padding: 8 },
  progressBar: { flex: 1, height: 8, backgroundColor: cores.gray100, borderRadius: 4, marginHorizontal: 16 },
  progressBarFill: { height: '100%', backgroundColor: cores.primary, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: cores.gray500 },
  motivationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: cores.light, borderWidth: 2, borderColor: cores.gray200, borderRadius: 16, padding: 16, marginBottom: 12, width: '100%' },
  motivationButtonSelected: { borderColor: cores.primary, backgroundColor: cores.primaryLight },
  motivationIcon: { marginRight: 16, alignSelf: 'center', marginTop: 2, },
  motivationTextContainer: { flex: 1, },
  motivationTitle: { fontSize: 16, fontWeight: 'bold', color: cores.secondary },
  motivationTitleSelected: { color: cores.primary },
  motivationSubtitle: { fontSize: 12, color: cores.gray500, marginTop: 4, },
  motivationSubtitleSelected: { color: cores.green700, },
  questionCard: { backgroundColor: cores.gray100, borderRadius: 12, padding: 20, width: '100%', marginBottom: 16 },
  questionText: { fontSize: 16, fontWeight: '600', color: cores.secondary, textAlign: 'center' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderWidth: 2, borderColor: cores.gray200, borderRadius: 12, backgroundColor: cores.light, marginBottom: 12, width: '100%' },
  optionSelected: { borderColor: cores.primary, backgroundColor: cores.green50 },
  optionCorrect: { borderColor: cores.green500, backgroundColor: cores.green50 },
  optionIncorrect: { borderColor: cores.red500, backgroundColor: cores.red50 },
  iconContainer: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.gray100 },
  optionKey: { fontSize: 16, fontWeight: 'bold', color: cores.secondary },
  optionValue: { flex: 1, fontSize: 14, fontWeight: '600', color: cores.secondary },
  explanationScroll: { maxHeight: 200, width: '100%', marginBottom: 24 },
  explanationBox: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', width: '100%' },
  explanationBoxInfo: { backgroundColor: cores.green50, borderColor: cores.green500 },
  explanationBoxError: { backgroundColor: cores.red50, borderColor: cores.red500 },
  explanationHeader: { paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationHeaderInfo: { borderColor: cores.green500 },
  explanationHeaderError: { borderColor: cores.red500 },
  explanationHeaderText: { fontWeight: 'bold', fontSize: 14 },
  explanationHeaderTextInfo: { color: cores.green700 },
  explanationHeaderTextError: { color: cores.red600 },
  explanationText: { padding: 16, fontSize: 15, color: cores.secondary, lineHeight: 22 },
  lightGraphContainer: { width: '100%', alignItems: 'center', },
  topTextBoxLight: { backgroundColor: cores.gray100, borderRadius: 16, padding: 20, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: cores.gray200, },
  topTextLight: { color: cores.secondary, fontSize: 16, lineHeight: 24, textAlign: 'center', },
  graphCardLight: { width: '100%', backgroundColor: cores.light, borderRadius: 24, padding: 20, position: 'relative', },
  graphTitleLight: { fontSize: 18, fontWeight: '600', color: cores.secondary, textAlign: 'center', marginBottom: 8, },
  labelTagLight: { position: 'absolute', backgroundColor: cores.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: cores.gray200, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 2, elevation: 2, },
  labelTextLight: { color: cores.secondary, fontSize: 10, fontWeight: '600', },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 24, },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  legendDot: { width: 10, height: 10, borderRadius: 5, },
  legendText: { color: cores.gray500, fontSize: 12, fontWeight: '500', },
  graphSubtitle: { fontSize: 14, color: cores.gray500, textAlign: 'center', marginTop: 20, lineHeight: 20, },
  carouselWrapper: { height: 220, marginBottom: 24, justifyContent: 'center', marginTop: 20 },
  featureCard: { backgroundColor: cores.light, borderRadius: 20, padding: 24, height: 150, justifyContent: 'space-between', borderWidth: 0.5, borderColor: cores.gray200, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3, alignItems: 'center' },
  featureIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: cores.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  featureTitle: { fontSize: 15, fontWeight: 'bold', color: cores.secondary, textAlign: 'center' },
  featureSubtitle: { fontSize: 11, color: cores.gray500, marginTop: 4, lineHeight: 20, marginBottom: 5, textAlign: 'center' },
  paywallPlaceholder: { width: '100%', borderRadius: 16, borderWidth: 2, borderColor: cores.gray100, padding: 24, alignItems: 'center', backgroundColor: cores.light },
  paywallPlaceholderText: { fontSize: 14, color: cores.gray500, textAlign: 'center', fontStyle: 'italic', marginBottom: 24, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: cores.gray100,
    borderRadius: 12, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1,
    borderColor: cores.gray100,
    width: '100%', // Garante a largura total
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: cores.secondary
  },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: cores.primary, width: '100%' },
  buttonSecondary: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: cores.light, borderWidth: 1.5, borderColor: cores.gray200, width: '100%', marginTop: 12 },
  buttonSecondaryText: { color: cores.gray500, fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: cores.light, fontSize: 16, fontWeight: 'bold' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: cores.light, borderTopWidth: 1, borderTopColor: cores.gray100 },
});