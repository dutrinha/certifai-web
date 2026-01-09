// src/Screens/OnboardingFlowScreen.js
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
  Platform,
  useWindowDimensions,
  Easing, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../context/OnboardingContext';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { 
  Sparkles, Check, Lock, Briefcase, TrendingUp, Brain, 
  Layers, ArrowLeft, Target, BarChart3, UserCheck, 
  BookOpen, MessageSquare, Shield, X, User, CheckCircle
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

const CONTENT_MAX_WIDTH = 500; 

// --- COMPONENTES INTERNOS ---

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
  options: { 
    A: "Tesouro Selic (LFT)", 
    B: "Tesouro Prefixado (LTN)", 
    C: "Tesouro IPCA+ (NTN-B)", 
    D: "CDB de liquidez diária" 
  },
  answer: "C",
  // 1. Feedback Padrão (Texto curto que aparece logo que responde)
  explanation: {
    B: { 
      title: "Alternativa Incorreta", 
      text: "O **Tesouro Prefixado** tem taxa fixa e não protege contra a alta da inflação. O correto é o IPCA+." 
    },
  },
  chatFlow: [
    { type: 'user', text: "Mas o Prefixado não é seguro?" },
    { type: 'ai', text: "É seguro contra calote, mas não contra a **perda de poder de compra**. Se a inflação subir para 15% e seu título pagar 10%, você perde dinheiro real!" }
  ]
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
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(300, windowWidth - 60); 
  const height = 220;
  
  const start = { x: 30, y: 180 };
  const mid = { x: width * 0.53, y: 100 }; 
  const endGood = { x: width * 0.93, y: 40 }; 
  const endBad = { x: width * 0.8, y: 150 };

  return (
    <View style={styles.lightGraphContainer}>
      <View style={styles.graphCardLight}>
        <Text style={styles.graphTitleLight}>Aumento de produtividade</Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          
          <View style={{ width: width, height: height, position: 'relative' }}>
            <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', top: 0, left: 0 }}>
              <Defs>
                <LinearGradient id="gradPrimary" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={cores.primary} stopOpacity="0.1" />
                  <Stop offset="1" stopColor={cores.primary} stopOpacity="0.4" />
                </LinearGradient>
              </Defs>
              {[1, 2, 3, 4].map(i => (
                <Line key={`v-${i}`} x1={i * (width/5)} y1="20" x2={i * (width/5)} y2="200" stroke={cores.gray200} strokeWidth="1" strokeDasharray="4 4" />
              ))}
              {[1, 2, 3].map(i => (
                <Line key={`h-${i}`} x1="20" y1={i * 50} x2={width - 20} y2={i * 50} stroke={cores.gray200} strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <Path
                d={`M ${start.x} ${start.y} Q ${width * 0.4} 170 ${endBad.x} ${endBad.y}`}
                stroke={cores.red500} strokeWidth="2" fill="none" opacity="0.8"
              />
              <Path
                d={`M ${start.x} ${start.y} Q ${width * 0.33} 140 ${mid.x} ${mid.y} T ${endGood.x} ${endGood.y}`}
                stroke={cores.primary} strokeWidth="6" strokeOpacity="0.2" fill="none"
              />
              <Path
                d={`M ${start.x} ${start.y} Q ${width * 0.33} 140 ${mid.x} ${mid.y} T ${endGood.x} ${endGood.y}`}
                stroke={cores.primary} strokeWidth="3" fill="none"
              />
              <Circle cx={start.x} cy={start.y} r="6" fill={cores.light} stroke={cores.secondary} strokeWidth="2" />
              <Circle cx={mid.x} cy={mid.y} r="5" fill={cores.light} stroke={cores.primary} strokeWidth="3" />
              <Circle cx={endGood.x} cy={endGood.y} r="5" fill={cores.light} stroke={cores.primary} strokeWidth="3" />
            </Svg>
            
            <View style={[styles.labelTagLight, { left: start.x - 28, top: start.y + 15 }]}>
              <Text style={styles.labelTextLight}>Início</Text>
            </View>
            <View style={[styles.labelTagLight, { left: mid.x - 45, top: mid.y - 35 }]}>
              <Text style={styles.labelTextLight}>em 10 dias</Text>
            </View>
            <View style={[styles.labelTagLight, { left: endGood.x - 25, top: endGood.y - 35 }]}>
              <Text style={styles.labelTextLight}>Meta</Text>
            </View>
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

const features = [
  { icon: Brain, title: "Cases Dissertativos", subtitle: "Corrija seu raciocínio em cenários reais." },
  { icon: BookOpen, title: "Questões Interativas", subtitle: "Aprenda com desafios dinâmicos." },
  { icon: Layers, title: "Flashcards", subtitle: "Memorize conceitos com iteração." },
  { icon: BarChart3, title: "Métricas de Hábito", subtitle: "Acompanhe sua evolução e pontos fracos." },
  { icon: Shield, title: "Todas Certificações", subtitle: "Uma assinatura, acesso total à sua carreira." },
  { icon: MessageSquare, title: "Ajuda Personalizada", subtitle: "Tire dúvidas 24/7 com o Professor IA." },
];
const duplicatedFeatures = [...features, ...features]; 

const FeatureCard = ({ icon: Icon, title, subtitle, width }) => (
  <View style={[styles.featureCard, { width: width }]}>
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
  const { width: windowWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current; 
  
  const isDesktop = windowWidth > 768;
  const CARD_MARGIN = 16;
  const cardWidth = isDesktop ? 280 : (windowWidth - 80) * 0.85;
  const itemFullWidth = cardWidth + CARD_MARGIN;
  
  const singleSetWidth = itemFullWidth * features.length;

  useEffect(() => {
    const startLoop = () => {
      scrollX.setValue(0);
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -singleSetWidth,
          duration: 30000, 
          easing: Easing.linear, 
          useNativeDriver: true, 
        })
      ).start();
    };

    startLoop();

    return () => {
      scrollX.stopAnimation();
    };
  }, [singleSetWidth, scrollX]);

  return (
    <View style={styles.carouselWrapper}>
      <View style={{ width: '100%', overflow: 'hidden' }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: singleSetWidth * 2, 
            transform: [{ translateX: scrollX }], 
            paddingLeft: 16, 
          }}
        >
          {duplicatedFeatures.map((item, index) => (
            <View key={`${item.title}-${index}`} style={{ marginRight: CARD_MARGIN }}>
              <FeatureCard 
                icon={item.icon} 
                title={item.title} 
                subtitle={item.subtitle} 
                width={cardWidth} 
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

// =======================================================
// ☆ TELA PRINCIPAL (ONBOARDING) ☆
// =======================================================
export default function OnboardingFlowScreen() {
  const navigation = useNavigation();
  const { onboardingData, updateData } = useOnboarding();
  const { user, loading: authLoading } = useAuth(); 

  const isUserReal = user && !user.is_anonymous;
  const initialStep = isUserReal ? 8 : 1;
  const [step, setStep] = useState(initialStep);
  
  const [planBuildingStatus, setPlanBuildingStatus] = useState(initialStep === 8 ? 'building' : 'idle');

  // Campos dos passos anteriores
  const [motivation, setMotivation] = useState(null);
  const [certification, setCertification] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [name, setName] = useState('');

  // =======================================================
  // ☆ NOVOS ESTADOS PARA A DEMO (Adicione isto!) ☆
  // =======================================================
  const [aiButtonPressed, setAiButtonPressed] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatStep, setChatStep] = useState(0); 

  // =======================================================
  // ☆ LÓGICA DE AUTO-PLAY (Adicione/Substitua isto!) ☆
  // =======================================================
// =======================================================
  // ☆ LÓGICA DE AUTO-PLAY CORRIGIDA ☆
  // =======================================================
  useEffect(() => {
    let timers = []; 

    if (step === 3) {
      // Se já tiver resposta (ex: voltou da tela seguinte), apenas garante q tá verificado
      if (selectedAnswer && !isVerified) {
         setIsVerified(true);
      } 
      // Se NÃO tiver resposta, roda o TEATRINHO completo
      else if (!selectedAnswer) {
         // 1.0s: Seleciona Errado (B)
         timers.push(setTimeout(() => setSelectedAnswer("B"), 1000));

         // 2.0s: Feedback Padrão (Verifica)
         timers.push(setTimeout(() => setIsVerified(true), 2000));

         // 3.5s: Clica no botão "Corrigir com IA"
         timers.push(setTimeout(() => setAiButtonPressed(true), 3500));

         // 4.0s: Abre o Modal do Chat e solta o botão
         timers.push(setTimeout(() => {
           setAiButtonPressed(false);
           setShowChatModal(true);
         }, 4000));

         // 5.0s: Mensagem do Usuário aparece
         timers.push(setTimeout(() => setChatStep(1), 5000));

         // 6.5s: Resposta da IA aparece
         timers.push(setTimeout(() => setChatStep(2), 6500));
      }
    }

    // Efeito de "Montando Plano" do passo 8
    if (step === 8) {
      setPlanBuildingStatus('building');
      const timer = setTimeout(() => {
        setPlanBuildingStatus('ready');
      }, 3000);
      timers.push(timer);
    }

    return () => timers.forEach(t => clearTimeout(t));
    
    // 👇 A MÁGICA ESTÁ AQUI: Removemos 'selectedAnswer' das dependências.
    // Assim, quando a resposta muda, o React NÃO cancela os timers restantes.
  }, [step]);

  const nextStep = (data = {}) => {
    if (Object.keys(data).length > 0) updateData(data);
    setIsVerified(false);
    setSelectedAnswer(null);
    setStep((s) => s + 1);
  };



const handleBack = () => {
    // 1. Se estiver nos passos seguintes (2, 3, 4...), apenas volta um slide
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }

    // 2. Se estiver no Passo 1 (O começo de tudo):
    if (navigation.canGoBack()) {
      // Se tiver histórico (veio navegando normal), volta
      navigation.goBack();
    } else {
      // Se NÃO tiver histórico (veio do Anúncio/Deep Link), FORÇA ir para a capa
      navigation.navigate('Welcome');
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {/* Botão de Voltar com a nova função */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <ArrowLeft size={24} color={cores.gray500} />
      </TouchableOpacity>
      
      {/* Barra de Progresso */}
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${(step / 9) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{step} / 9</Text>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Para qual certificação você vai estudar?</Text>
            <Text style={styles.subtitle}>Isso nos ajuda a ajustar seu plano de estudos.</Text>
            
            <MotivationButton 
              icon={Briefcase} 
              title="CPA" 
              subtitle={
                <Text>
                  Porta de entrada em bancos e cooperativas{"\n"}Média Salarial:
                  <Text style={{ fontWeight: 'bold' }}> R$ 3.500 a R$ 4.500</Text>
                </Text>
              } 
              selected={certification === 'cpa'} 
              onPress={() => setCertification('cpa')} 
            />

            <MotivationButton 
              icon={Briefcase} 
              title="C-PRO R" 
              subtitle={
                <Text>
                  Especialista em relacionamentos{"\n"}Média Salarial:
                  <Text style={{ fontWeight: 'bold' }}> R$ 6.000 a R$ 9.000</Text>
                </Text>
              } 
              selected={certification === 'cpror'} 
              onPress={() => setCertification('cpror')} 
            />

            <MotivationButton 
              icon={Briefcase} 
              title="C-PRO I" 
              subtitle={
                <Text>
                  Especialista em investimentos{"\n"}Média Salarial:
                  <Text style={{ fontWeight: 'bold' }}> R$ 10.000 a R$ 18.000+</Text>
                </Text>
              } 
              selected={certification === 'cproi'} 
              onPress={() => setCertification('cproi')} 
            />
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
        const explanationData = isVerified ? dummyQuestion.explanation["B"] : null;

        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Professor particular 24h</Text>
            <Text style={styles.subtitle}>Feedback imediato e chat inteligente para tirar qualquer dúvida.</Text>
            
            {/* --- CELULAR FAKE --- */}
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              
              {/* CONTEÚDO DA TELA */}
              <View style={[styles.phoneContent, {opacity: showChatModal ? 0.3 : 1}]}> 
                  
                  {/* Pergunta */}
                  <Text style={styles.phoneQuestionText}>{dummyQuestion.question}</Text>

                  {/* Opções */}
                  <View style={{gap: 8, marginBottom: 16}}>
                    {Object.entries(dummyQuestion.options).map(([key, value]) => {
                      const isSelected = selectedAnswer === key;
                      // Lógica de Cores:
                      // 1. Erro: Se verificado E for a B (que selecionamos na demo) -> Vermelho
                      const isError = isVerified && key === "B"; 
                      // 2. Acerto: Se verificado E for a C (a resposta real) -> Verde
                      const isCorrect = isVerified && key === dummyQuestion.answer; 

                      return (
                        <TouchableOpacity
                          key={key} disabled={true}
                          style={[
                            styles.phoneOption,
                            isSelected && styles.phoneOptionSelected, // Azul (seleção antes de verificar)
                            isError && styles.phoneOptionError,       // Vermelho (erro)
                            isCorrect && styles.phoneOptionCorrect,   // Verde (gabarito)
                          ]}
                        >
                          <View style={[
                              styles.phoneOptionBadge, 
                              isSelected && {backgroundColor: cores.primary, borderColor: cores.primary},
                              isError && {backgroundColor: cores.red500, borderColor: cores.red500},
                              isCorrect && {backgroundColor: cores.green500, borderColor: cores.green500}
                          ]}>
                            <Text style={[
                                styles.phoneOptionBadgeText, 
                                (isSelected || isCorrect || isError) && {color: 'white'}
                            ]}>{key}</Text>
                          </View>
                          <Text style={styles.phoneOptionText}>{value}</Text>
                          
                          {/* Ícones de Feedback */}
                          {isError && <X size={16} color={cores.red500} style={{marginLeft: 'auto'}} />}
                          {isCorrect && <Check size={16} color={cores.green500} style={{marginLeft: 'auto'}} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* FEEDBACK PADRÃO (Agora com MarkdownRenderer para Negrito) */}
                  {isVerified && explanationData && (
                     <View style={styles.standardFeedbackBox}>
                        <Text style={styles.feedbackTitle}>{explanationData.title}</Text>
                        {/* AQUI ESTÁ A CORREÇÃO DO NEGRITO: */}
                        <MarkdownRenderer text={explanationData.text} style={styles.feedbackText} />
                     </View>
                  )}

                  {/* BOTÃO QUE ABRE O CHAT */}
                  {isVerified && (
                    <Animated.View style={{transform: [{scale: aiButtonPressed ? 0.95 : 1}], marginTop: 12}}>
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setShowChatModal(true)} 
                        onPressIn={() => setAiButtonPressed(true)}
                        onPressOut={() => setAiButtonPressed(false)}
                        style={[styles.aiButton, aiButtonPressed && styles.aiButtonPressed]}
                      >
                         <Sparkles size={16} color="white" style={{marginRight: 6}} />
                         <Text style={styles.aiButtonText}>Corrigir com IA</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
              </View>

              {/* --- MODAL DE CHAT --- */}
              {showChatModal && (
                <View style={styles.chatModalOverlay}>
                  <View style={styles.chatHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <View style={styles.chatAvatar}>
                          <Sparkles size={12} color="white" />
                        </View>
                        <Text style={styles.chatHeaderTitle}>Professor IA</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowChatModal(false)} hitSlop={20}>
                      <X size={16} color={cores.gray500} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chatBody}>
                    {chatStep >= 1 && (
                      <View style={styles.chatBubbleUser}>
                          <Text style={styles.chatTextUser}>{dummyQuestion.chatFlow[0].text}</Text>
                      </View>
                    )}
                    {chatStep >= 2 && (
                      <View style={styles.chatBubbleAi}>
                          {/* Chat também usa Markdown agora, por garantia */}
                          <MarkdownRenderer text={dummyQuestion.chatFlow[1].text} style={styles.chatTextAi} />
                      </View>
                    )}
                    {chatStep === 1 && (
                        <Text style={{fontSize: 10, color: cores.gray500, marginLeft: 4, marginTop: 4}}>IA digitando...</Text>
                    )}
                  </View>

                  <View style={styles.chatInputBar}>
                    <View style={styles.fakeInput} />
                    <View style={styles.sendButton} />
                  </View>
                </View>
              )}

            </View>
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
          <View style={[styles.stepContainer, {alignItems: 'stretch'}]}>
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
                console.log("Onboarding: Login com sucesso! Avançando para a montagem do plano.");
                nextStep(); // Vai para o passo 8
              }}
            />
          </View>
        );

      // ☆ PASSO 8: MONTANDO PLANO -> PRONTO -> PAYWALL/ACESSO
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

        // 1. Evita flash se ainda estiver carregando o user
        if (authLoading) {
             return (
               <View style={styles.stepContainer}>
                 <ActivityIndicator size="large" color={cores.primary} />
                 <Text style={{marginTop: 16, color: cores.gray500}}>Sincronizando conta...</Text>
               </View>
             );
        }

        // 2. Tela de "Montando Plano" (3 segundos)
        if (planBuildingStatus === 'building') {
             return (
               <View style={styles.stepContainer}>
                 <ActivityIndicator size="large" color={cores.primary} />
                 <Text style={[styles.title, {marginTop: 24, fontSize: 22}]}>
                    Montando seu plano de estudos personalizado...
                 </Text>
                 <Text style={styles.subtitle}>
                    Analisando suas respostas e calibrando a IA.
                 </Text>
               </View>
             );
        }

        // 3. Tela de "Plano Pronto" (Sucesso)
        return (
          <View style={styles.stepContainer}>
            <View style={{alignItems: 'center', marginBottom: 40}}>
                <View style={{
                    width: 100, height: 100, borderRadius: 50, 
                    backgroundColor: cores.primaryLight, 
                    justifyContent: 'center', alignItems: 'center',
                    marginBottom: 24
                }}>
                    <CheckCircle size={50} color={cores.primary} />
                </View>
                <Text style={styles.title}>Seu plano está pronto!</Text>
                <Text style={styles.subtitle}>
                    Tudo configurado para você conquistar sua aprovação na {onboardingData.certification ? onboardingData.certification.toUpperCase() : 'certificação'}.
                </Text>
            </View>
            
            {/* Botão ACESSAR - Gatilho do Paywall */}
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: cores.primary}]} 
              onPress={() => {
                  if (isPro) {
                      // Se for PRO, entra direto
                      handleCompleteOnboarding(); 
                  } else {
                      // Se for FREE, mostra o Paywall
                      setShowPaywall(true); 
                  }
              }}
            >
              <Text style={[styles.buttonText, {marginLeft: 10}]}>Acessar Plano</Text>
            </TouchableOpacity>

            {/* Modal de Paywall */}
            {/* onClose chama handleCompleteOnboarding, ou seja, ao fechar o Paywall, vai pra Home */}
            <PaywallModal 
              visible={showPaywall} 
              onClose={handleCompleteOnboarding} 
            />
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
    // Esconde o botão padrão do footer nos passos 7 (Login) e 8 (Final)
    if (step === 7 || step === 8) return null;

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
        // Libera SOMENTE se a IA já terminou de falar no chat (step 2)
        // Ou se, por segurança, o chat já foi fechado/finalizado
        const isDemoFinished = chatStep === 2; 

        return isDemoFinished ? (
          <TouchableOpacity style={styles.button} onPress={() => nextStep()}>
            <Text style={styles.buttonText}>Que incrível! Quero começar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled={true}>
             {/* Feedback visual enquanto a demo roda */}
             <ActivityIndicator size="small" color={cores.gray500} style={{marginRight: 8}} />
             <Text style={[styles.buttonText, {color: cores.gray500, fontSize: 14}]}>
                {showChatModal ? "A IA está explicando..." : "Aguarde a demonstração..."}
             </Text>
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
        <View style={styles.footerContentContainer}>
            {renderFooterButton()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.light },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24, alignItems: 'center' },
  stepContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    width: '100%', 
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center' 
  },
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
  carouselWrapper: { height: 220, width: '100%', marginBottom: 24, justifyContent: 'center', marginTop: 20, alignItems: 'center' },
  featureCard: { backgroundColor: cores.light, borderRadius: 20, padding: 24, height: 150, justifyContent: 'space-between', borderWidth: 0.5, borderColor: cores.gray200, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3, alignItems: 'center' },
  featureIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: cores.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 5},
  featureTitle: { fontSize: 15, fontWeight: 'bold', color: cores.secondary, textAlign: 'center' },
  featureSubtitle: { fontSize: 11, color: cores.gray500, marginTop: 4, lineHeight: 20, marginBottom: 5, textAlign: 'center'},
  paywallPlaceholder: { width: '100%', borderRadius: 16, borderWidth: 2, borderColor: cores.gray100, padding: 24, alignItems: 'center', backgroundColor: cores.light },
  paywallPlaceholderText: { fontSize: 14, color: cores.gray500, textAlign: 'center', fontStyle: 'italic', marginBottom: 24, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: cores.gray100,
    borderRadius: 12, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1,
    borderColor: cores.gray100,
    width: '100%',
  },
  inputIcon: { 
    marginRight: 8 
  },
  input: { 
    outlineStyle: 'none',
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
  footer: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    backgroundColor: cores.light, 
    borderTopWidth: 1, 
    borderTopColor: cores.gray100,
    alignItems: 'center', 
    width: '100%'
  },
  footerContentContainer: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 300,        // Mais estreito (elegante)
    minHeight: 580,       // <--- ADICIONE ISSO: Altura mínima de celular moderno
    backgroundColor: '#fff',
    borderWidth: 8,
    borderColor: '#1e293b', 
    borderRadius: 32,
    padding: 16,
    paddingTop: 32,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
    overflow: 'hidden',
    alignSelf: 'center'   // Garante centralização
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 120,
    height: 24,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10
  },
  phoneContent: {
    flex: 1,
  },
  phoneQuestionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'center'
  },
  phoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  phoneOptionSelected: {
    borderColor: cores.primary,
    backgroundColor: '#f0fdf4', // verde bem clarinho
  },
  phoneOptionError: {
    borderColor: cores.red500,
    backgroundColor: '#fef2f2', // vermelho clarinho
  },
  phoneOptionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'white'
  },
  phoneOptionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b'
  },
  phoneOptionText: {
    fontSize: 12,
    color: '#334155',
    flex: 1
  },
  
  // Botão IA
  aiButton: {
    backgroundColor: cores.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: cores.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  aiButtonPressed: {
    backgroundColor: cores.green700, // Tom mais escuro para simular click
    transform: [{scale: 0.98}]
  },
  aiButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },
  
  // Resultado IA
  aiResultContainer: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderColor: cores.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: cores.primary,
    marginLeft: 6
  },
  aiText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  // ... estilos anteriores ...
  
  // Feedback Padrão (Caixa estática)
  standardFeedbackBox: {
    padding: 12,
    backgroundColor: '#fef2f2', // Vermelho bem claro
    borderLeftWidth: 4,
    borderLeftColor: cores.red500,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 8
  },
  feedbackTitle: {
    color: cores.red600,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4
  },
  feedbackText: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 16
  },

  // MODAL DE CHAT (Estilo WhatsApp/ChatGPT)
  chatModalOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%', // Ocupa parte de baixo da tela
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    padding: 16,
    justifyContent: 'space-between', // Separa header, body e input
    zIndex: 20
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.gray100
  },
  chatAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: cores.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatHeaderTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: cores.secondary
  },
  chatBody: {
    flex: 1,
    paddingVertical: 12,
    gap: 12
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: cores.primary,
    padding: 10,
    borderRadius: 12,
    borderBottomRightRadius: 2,
    maxWidth: '85%'
  },
  chatTextUser: {
    color: 'white',
    fontSize: 12
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: cores.gray100,
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 2,
    maxWidth: '90%'
  },
  chatTextAi: {
    color: cores.secondary,
    fontSize: 12,
    lineHeight: 18
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    opacity: 0.5 // Deixa meio apagado pq é fake
  },
  fakeInput: {
    flex: 1,
    height: 36,
    backgroundColor: cores.gray100,
    borderRadius: 18
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.primary
  },
  phoneOptionCorrect: {
    borderColor: cores.green500,
    backgroundColor: cores.green50, // Verde clarinho de fundo
  },
});
