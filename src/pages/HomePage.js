// src/pages/HomePage.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Platform, ScrollView, ActivityIndicator,
  Modal, TouchableWithoutFeedback, Alert, StatusBar
} from 'react-native';
// Voltamos para o SafeAreaView nativo do React Native (sem dependência de contexto)
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  Settings, Flame, CheckCircle,
  ShieldCheck, Users, Lightbulb, Briefcase,
  ChevronDown,
  ClipboardList, Layers, LayoutList, FileText, Zap, ChevronRight
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Circle } from 'react-native-svg';
import { getSmartHomeData, updateUserCertificationFocus } from '../context/progressService';
import { supabase } from '../context/AuthContext';
import { getCertificationRules } from '../utils/CertificationRules';

// --- IMPORTS DE SEGURANÇA E UI ---
import PremiumGuard from '../components/PremiumGuard';
import ActionCard from '../components/ActionCard';
import PaywallModal from '../components/PaywallModal';

// Paleta de Cores
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
  orange: '#F59E0B',
  orangeLight: '#FFFBEB',
};

// Dados estáticos dos módulos
const CERTIFICATION_TRACKS = {
  'cpa': [
    { id: 1, title: "Módulo 1: Sistema Financeiro Nacional", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Estrutura e dinâmica do sistema financeiro nacional"] },
    { id: 2, title: "Módulo 2: Produtos do mercado financeiro", icon: Briefcase, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Produtos do mercado financeiro"] },
    { id: 3, title: "Módulo 3: Relacionamento com o cliente", icon: Users, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Relacionamento com o cliente – prospecção, atendimento e suporte"] },
    { id: 4, title: "Módulo 4: Inovação e desenvolvimento de mercado", icon: Lightbulb, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Inovação e desenvolvimento de mercado"] },
  ],
  'cpror': [
    { id: 1, title: "Módulo 1: Prospecção e Relacionamento", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Prospecção e relacionamento com a pessoa investidora"] },
    { id: 2, title: "Módulo 2: Análise de informações do cliente", icon: Users, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Análise de informações do cliente"] },
    { id: 3, title: "Módulo 3: Indicação de investimentos", icon: Lightbulb, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Indicação de investimentos"] },
    { id: 4, title: "Módulo 4: Análise de portfólio e monitoramento da carteira", icon: Briefcase, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Análise de portfólio e monitoramento da carteira"] }
  ],
  'cproi': [
    { id: 1, title: "Módulo 1: Produtos de investimentos", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Produtos de investimentos"] },
    { id: 2, title: "Módulo 2: Investimentos alternativos, digitais e no exterior", icon: Users, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Investimentos alternativos, digitais e no exterior"] },
    { id: 3, title: "Módulo 3: Previdência Complementar", icon: Lightbulb, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Previdência Complementar"] },
    { id: 4, title: "Módulo 4: Gestão de risco, análise de carteiras e indicadores de performance", icon: Zap, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Gestão de risco, análise de carteiras e indicadores de performance"] }
  ],
  'default': [
    { id: 1, title: "Módulo Geral", icon: ShieldCheck, totalLessons: 1, moduleColor: cores.primary, moduleColorLight: cores.primaryLight, topics: [] }
  ]
};
const AVAILABLE_CERTIFICATIONS = ['cpa', 'cpror', 'cproi'];

// Componente auxiliar para progresso do módulo
const ModuleProgressCard = ({ icon: Icon, title, progress, onPress, moduleColor, moduleColorLight }) => {
  const isCompleted = progress >= 100;
  const iconColor = isCompleted ? cores.primary : moduleColor;
  const barColor = isCompleted ? cores.primary : moduleColor;
  const containerBorderColor = isCompleted ? cores.primary : moduleColor;
  const containerBgColor = isCompleted ? cores.primaryLight : moduleColorLight;
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.moduleIconContainer, { borderColor: containerBorderColor, backgroundColor: containerBgColor }]}>
        {isCompleted ? <CheckCircle size={28} color={iconColor} /> : <Icon size={28} color={iconColor} />}
      </View>
      <View style={styles.moduleTextContainer}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: barColor }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={styles.moduleProgressText}>{progress}% Concluído</Text>
        </View>
      </View>
      <ChevronRight size={20} color={cores.textSecondary} style={{ opacity: 0.5 }} />
    </TouchableOpacity>
  );
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [lastStudied, setLastStudied] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isLoadingInterativa, setIsLoadingInterativa] = useState(false);

  const [showAutoPaywall, setShowAutoPaywall] = useState(false);
  const hasCheckedPaywallRef = useRef(false);

  const navigation = useNavigation();
  const { user, isPro, loading: authLoading } = useAuth();

  // Estado local para o nome para garantir update rápido
  const [userName, setUserName] = useState('Estudante');

  const [homeData, setHomeData] = useState({
    points: 0,
    goal: 100,
    streak: 0,
    certification: 'cpa',
    allProgressMaps: { cpa: {}, cpror: {}, cproi: {} }, // Agora armazenamos todos
  });

  const rules = getCertificationRules(homeData.certification);

  // =======================================================
  // LÓGICA DE DADOS
  // =======================================================
  const loadHomeData = useCallback(async () => {
    if (!user) return;

    // SÓ mostra loading se for a primeira vez (sem dados)
    // Se já tiver dados, faz refresh silencioso
    if (!homeData.points && Object.keys(homeData.allProgressMaps.cpa).length === 0) {
      setLoading(true);
    }

    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (freshUser?.user_metadata?.full_name) {
        setUserName(freshUser.user_metadata.full_name.split(' ')[0]);
      } else {
        setUserName('Estudante');
      }

      const data = await getSmartHomeData(freshUser || user);
      if (data) {
        setHomeData(prev => ({
          ...prev,
          ...data
        }));
      }

      const storedTrail = await AsyncStorage.getItem('lastStudiedTrail');
      if (storedTrail) {
        setLastStudied(JSON.parse(storedTrail));
      }
    } catch (e) {
      console.error("Erro ao carregar dados frescos da Home:", e);
    } finally {
      setLoading(false);
    }
  }, [user, homeData.points]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  // CORREÇÃO CRÍTICA: Adicionado Timer e Cleanup para evitar "piscada" do Paywall
  useEffect(() => {
    let timer;
    if (!authLoading && user) {
      // Só agenda se NÃO for PRO e ainda não tiver checado
      if (!isPro && !hasCheckedPaywallRef.current) {
        hasCheckedPaywallRef.current = true;
        timer = setTimeout(() => {
          setShowAutoPaywall(true);
        }, 600);
      }
    }

    // A função de limpeza cancela o timer se o status 'isPro' mudar para true
    // antes dos 600ms terminarem. Isso impede o Paywall de abrir em usuários PRO.
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [authLoading, user, isPro]);


  // Handlers (Mantidos)
  const handleModulePress = (module) => {
    navigation.navigate('ModuleLessonsPage', {
      moduleTitle: module.title,
      moduleTopics: module.topics,
      certificationType: homeData.certification,
      moduleId: module.id
    });
  };

  const handleChangeCertification = async (newCert) => {
    if (newCert === homeData.certification) {
      setModalVisible(false);
      return;
    }
    setModalVisible(false);

    // TROCA INSTANTÂNEA (Optimistic UI)
    // Não ativamos loading, pois já temos os dados em allProgressMaps
    setHomeData(prev => ({
      ...prev,
      certification: newCert
    }));

    // Atualiza no backend em background
    updateUserCertificationFocus(newCert).catch(err => console.error(err));
  };

  const handleNavigateToSimuladoCompleto = () => {
    navigation.navigate('simulado-completo-config', {
      certificationType: homeData.certification,
      certificationName: homeData.certification.toUpperCase(),
    });
  };

  const handleNavigateToPersonalizado = () => {
    navigation.navigate('topicos', {
      certificationType: homeData.certification,
      certificationName: homeData.certification.toUpperCase(),
    });
  };

  const handleNavigateToFlashCards = () => {
    navigation.navigate('FlashCardConfigPage', {
      certificationType: homeData.certification,
      certificationName: homeData.certification.toUpperCase(),
    });
  };

  const handleNavigateToCases = async () => {
    setIsLoadingCase(true);
    try {
      const { data, error } = await supabase.rpc('get_random_case', { prova_filter: homeData.certification });
      if (error) throw error;
      if (data && data.length > 0) {
        navigation.navigate('StudyCasePage', { caseData: data[0] });
      } else {
        Alert.alert('Indisponível', 'Nenhum case encontrado para esta certificação.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao carregar case.');
    } finally {
      setIsLoadingCase(false);
    }
  };

  const handleNavigateToInterativa = async () => {
    setIsLoadingInterativa(true);
    try {
      const { data, error } = await supabase.rpc('get_random_interactive_question', { prova_filter: homeData.certification });
      if (error) throw error;
      if (data && data.length > 0) {
        navigation.navigate('InteractiveQuestionPage', { questionData: data[0] });
      } else {
        Alert.alert('Indisponível', 'Nenhuma questão interativa encontrada.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao carregar questão interativa.');
    } finally {
      setIsLoadingInterativa(false);
    }
  };

  const progressPercentage = homeData.goal > 0 ? Math.min(100, (homeData.points / homeData.goal) * 100) : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercentage / 100);
  const currentTrack = CERTIFICATION_TRACKS[homeData.certification] || CERTIFICATION_TRACKS['default'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Adicionado style flex:1 aqui para garantir scroll */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainContainer}
        bounces={true}
        overScrollMode="always"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Olá,</Text>
            <Text style={styles.headerName}>{userName}!</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
            <Settings size={26} color={cores.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Meta Diária */}
        <View style={styles.dailyGoalCard}>
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalValue}>{homeData.points}</Text>
            <Text style={styles.goalLabel}>de {homeData.goal} pontos hoje</Text>
            <View style={styles.streakContainer}>
              <Flame size={16} color={cores.orange} />
              <Text style={styles.streakText}>{homeData.streak} dias de ofensiva</Text>
            </View>
          </View>
          <View style={styles.goalProgressCircle}>
            <Svg width="100%" height="100%" viewBox="0 0 74 74">
              <Circle cx="37" cy="37" r={radius} stroke={cores.border} strokeWidth="7" fill={cores.cardBackground} />
              <Circle cx="37" cy="37" r={radius} stroke={cores.primary} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} originX="37" originY="37" rotation="-90" />
            </Svg>
            <Text style={styles.goalPercentageText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>

        {/* Sua Trilha */}
        <View style={styles.trackSection}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Sua Trilha:</Text>
            <TouchableOpacity style={styles.certificationSwitcher} onPress={() => setModalVisible(true)}>
              <Text style={styles.certificationSwitcherText}>{homeData.certification.toUpperCase()}</Text>
              <ChevronDown size={20} color={cores.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={cores.primary} style={{ marginTop: 20 }} />
          ) : (
            currentTrack.map((module) => {
              // Busca o progresso no mapa específico da certificação atual
              const currentMap = homeData.allProgressMaps?.[homeData.certification] || {};
              const currentLesson = currentMap[module.id] || 0;
              const totalLessons = module.totalLessons || 15;
              const progressPercent = Math.min(100, Math.floor((currentLesson / totalLessons) * 100));
              return (
                <ModuleProgressCard
                  key={module.id}
                  icon={module.icon}
                  title={module.title}
                  progress={progressPercent}
                  moduleColor={module.moduleColor}
                  moduleColorLight={module.moduleColorLight}
                  onPress={() => handleModulePress(module)}
                />
              );
            })
          )}
        </View>

        {/* --- PRÁTICA EXTRA --- */}
        <View style={styles.extraPracticeSection}>
          <Text style={styles.sectionTitle}>Prática Extra</Text>

          {/* Flashcards (FREE) */}
          <ActionCard
            icon={Layers}
            title="Flashcards de Revisão"
            onPress={handleNavigateToFlashCards}
          />

          {/* Simulado Completo (PRO) */}
          <PremiumGuard onPress={handleNavigateToSimuladoCompleto}>
            <ActionCard
              icon={ClipboardList}
              title="Simulado Completo"
              isPro={true}
            />
          </PremiumGuard>

          {/* Simulado Personalizado (FREE) */}
          <ActionCard
            icon={LayoutList}
            title="Simulado Personalizado"
            onPress={handleNavigateToPersonalizado}
          />

          {/* Cases (PRO) */}
          {rules.hasCase && (
            <PremiumGuard onPress={handleNavigateToCases}>
              <ActionCard
                icon={FileText}
                title="Questões Dissertativas"
                isLoading={isLoadingCase}
                isPro={true}
              />
            </PremiumGuard>
          )}

          {/* Interativas (PRO) */}
          {rules.hasInteractive && (
            <PremiumGuard onPress={handleNavigateToInterativa}>
              <ActionCard
                icon={Zap}
                title="Questões Interativas"
                isLoading={isLoadingInterativa}
                isPro={true}
              />
            </PremiumGuard>
          )}
        </View>

      </ScrollView>

      {/* Modal de Troca de Trilha */}
      <Modal transparent={true} visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Mudar Foco da Trilha</Text>
                {AVAILABLE_CERTIFICATIONS.map((cert) => (
                  <TouchableOpacity key={cert} style={styles.modalOption} onPress={() => handleChangeCertification(cert)}>
                    <Text style={[styles.modalOptionText, homeData.certification === cert && styles.modalOptionTextActive]}>
                      {cert.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CORREÇÃO 2: Renderização Condicional do Modal Paywall */}
      {/* Isso evita que ele renderize "invisível" bloqueando a tela */}
      {showAutoPaywall && (
        <PaywallModal
          visible={true}
          onClose={() => setShowAutoPaywall(false)}
        />
      )}

    </SafeAreaView>
  );
}

// Estilos Restaurados (iguais aos seus originais)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cores.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  mainContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'flex-start',
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  headerGreeting: { fontSize: 18, color: cores.textSecondary, marginBottom: -4 },
  headerName: { fontSize: 24, fontWeight: 'bold', color: cores.textPrimary },
  headerButton: { padding: 4 },
  dailyGoalCard: {
    backgroundColor: cores.cardBackground,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: cores.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 15, elevation: 5,
  },
  goalTextContainer: { flexShrink: 1, gap: 4 },
  goalValue: { fontSize: 44, fontWeight: 'bold', color: cores.textPrimary, lineHeight: 50 },
  goalLabel: { fontSize: 14, color: cores.textSecondary },
  goalProgressCircle: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  goalPercentageText: { position: 'absolute', fontSize: 15, fontWeight: 'bold', color: cores.primary },
  streakContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: cores.orangeLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4,
  },
  streakText: { fontSize: 13, fontWeight: 'bold', color: cores.orange },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: cores.textPrimary, marginBottom: 8, paddingHorizontal: 4 },
  sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  certificationSwitcher: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: cores.cardBackground,
    borderWidth: 1, borderColor: cores.border, borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 8, shadowColor: cores.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2,
  },
  certificationSwitcherText: { fontSize: 14, fontWeight: 'bold', color: cores.textPrimary, marginRight: 6 },
  moduleCard: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: cores.cardBackground,
    borderRadius: 20, padding: 16, shadowColor: cores.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 15, elevation: 2,
  },
  moduleIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.cardBackground, borderWidth: 3, borderColor: cores.primary, marginRight: 16 },
  moduleTextContainer: { flex: 1, marginRight: 8 },
  moduleTitle: { fontSize: 16, fontWeight: 'bold', color: cores.textPrimary, marginBottom: 8 },
  progressBarContainer: { height: 8, backgroundColor: cores.border, borderRadius: 4, overflow: 'hidden', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: cores.primary, borderRadius: 4 },
  moduleProgressText: { fontSize: 12, fontWeight: '600', color: cores.textSecondary, marginTop: 6 },
  extraPracticeSection: { marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: cores.cardBackground, borderRadius: 20, padding: 10, width: '80%', maxWidth: 300, shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: cores.textPrimary, textAlign: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: cores.border, marginBottom: 8 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 16 },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: cores.textSecondary, textAlign: 'center' },
  modalOptionTextActive: { color: cores.primary, fontWeight: 'bold' },
});