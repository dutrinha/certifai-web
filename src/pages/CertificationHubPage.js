import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, ShieldCheck, Users, Lightbulb, Briefcase, CheckCircle, 
  Layers, Zap, FileText, ClipboardList, LayoutList, ChevronRight, ChevronDown
} from 'lucide-react-native';
import { supabase, useAuth } from '../context/AuthContext'; 
import { fetchCertificationProgress } from '../context/progressService'; 
import { getCertificationRules } from '../utils/CertificationRules';

// --- IMPORTS DE SEGURANÇA E UI ---
import PremiumGuard from '../components/PremiumGuard';
import ActionCard from '../components/ActionCard';

const cores = {
  primary: "#00C853", primaryLight: "#E6F8EB", textPrimary: "#1A202C",
  textSecondary: "#64748B", textLight: "#FFFFFF", background: "#F7FAFC",
  cardBackground: "#FFFFFF", border: "#E2E8F0", shadow: 'rgba(0, 0, 0, 0.05)',
};

const CERTIFICATION_TRACKS = {
  'cpa': [
    { id: 1, title: "Módulo 1: Sistema Financeiro Nacional", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Estrutura e dinâmica do sistema financeiro nacional"] },
    { id: 2, title: "Módulo 2: Produtos do mercado financeiro", icon: Briefcase, totalLessons: 15, moduleColor: cores.textSecondary, moduleColorLight: cores.border, topics: ["Produtos do mercado financeiro"] },
    { id: 3, title: "Módulo 3: Relacionamento com o cliente", icon: Users, totalLessons: 15, moduleColor: "#3B82F6", moduleColorLight: "#DBEAFE", topics: ["Relacionamento com o cliente – prospecção, atendimento e suporte"] },
    { id: 4, title: "Módulo 4: Inovação e desenvolvimento de mercado", icon: Lightbulb, totalLessons: 15, moduleColor: "#A855F7", moduleColorLight: "#F3E8FF", topics: ["Inovação e desenvolvimento de mercado"] },
  ],
  'cpror': [
    { id: 1, title: "Módulo 1: Prospecção e Relacionamento", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Prospecção e relacionamento com a pessoa investidora"] },
    { id: 2, title: "Módulo 2: Análise de informações do cliente", icon: Users, totalLessons: 15, moduleColor: "#3B82F6", moduleColorLight: "#DBEAFE", topics: ["Análise de informações do cliente"] },
    { id: 3, title: "Módulo 3: Indicação de investimentos", icon: Lightbulb, totalLessons: 15, moduleColor: "#A855F7", moduleColorLight: "#F3E8FF", topics: ["Indicação de investimentos"] },
    { id: 4, title: "Módulo 4: Análise de portfólio e monitoramento da carteira", icon: Briefcase, totalLessons: 15, moduleColor: cores.textSecondary, moduleColorLight: cores.border, topics: ["Análise de portfólio e monitoramento da carteira"] }
  ],
  'cproi': [
    { id: 1, title: "Módulo 1: Produtos de investimentos", icon: ShieldCheck, totalLessons: 15, moduleColor: "#00C853", moduleColorLight: "#E6F8EB", topics: ["Produtos de investimentos"] },
    { id: 2, title: "Módulo 2: Investimentos alternativos, digitais e no exterior", icon: Users, totalLessons: 15, moduleColor: "#3B82F6", moduleColorLight: "#DBEAFE", topics: ["Investimentos alternativos, digitais e no exterior"] },
    { id: 3, title: "Módulo 3: Previdência Complementar", icon: Lightbulb, totalLessons: 15, moduleColor: "#A855F7", moduleColorLight: "#F3E8FF", topics: ["Previdência Complementar"] },
    { id: 4, title: "Módulo 4: Gestão de risco, análise de carteiras e indicadores de performance", icon: Zap, totalLessons: 15, moduleColor: cores.textSecondary, moduleColorLight: cores.border, topics: ["Gestão de risco, análise de carteiras e indicadores de performance"] }
  ],
  'default': [
    { id: 1, title: "Módulo Geral", icon: ShieldCheck, totalLessons: 1, moduleColor: cores.primary, moduleColorLight: cores.primaryLight, topics: [] }
  ]
};

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
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
           <Text style={styles.moduleProgressText}>{progress}% Concluído</Text>
        </View>
      </View>
      <ChevronDown size={20} color={cores.textSecondary} style={{ opacity: 0.5, transform: [{rotate: '-90deg'}] }} />
    </TouchableOpacity>
  );
};

export default function CertificationHubPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth(); 

  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isLoadingInterativa, setIsLoadingInterativa] = useState(false);
  const [progressMap, setProgressMap] = useState({});

  const certificationType = route.params?.certificationType || 'unknown';
  const certificationName = route.params?.certificationName || 'Certificação';
  const provasClassicas = ['cpa10', 'cpa20', 'cea'];
  const isProvaClassica = provasClassicas.includes(certificationType);

  const rules = getCertificationRules(certificationType);
  
  const currentTrack = CERTIFICATION_TRACKS[certificationType] || CERTIFICATION_TRACKS['default'];

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        if (!user) return; 
        const progressData = await fetchCertificationProgress(user.id, certificationType);
        const newProgressMap = progressData.reduce((acc, item) => {
          acc[item.module_id] = item.current_lesson_index;
          return acc;
        }, {});
        setProgressMap(newProgressMap);
      };
      loadProgress();
    }, [certificationType, user])
  );

  // --- HANDLERS ---
  const handleModulePress = (moduleData) => {
    navigation.navigate('ModuleLessonsPage', {
      moduleTitle: moduleData.title,
      moduleTopics: moduleData.topics, 
      certificationType: certificationType,
      moduleId: moduleData.id
    });
  };

  const handleNavigateToSimuladoCompleto = () => navigation.navigate('simulado-completo-config', { certificationType, certificationName });
  const handleNavigateToPersonalizado = () => navigation.navigate('topicos', { certificationType, certificationName });
  const handleNavigateToFlashCards = () => navigation.navigate('FlashCardConfigPage', { certificationType, certificationName });
  
  const handleNavigateToCases = async () => {
    setIsLoadingCase(true);
    try {
      const { data, error } = await supabase.rpc('get_random_case', { prova_filter: certificationType });
      if (error) throw error;
      if (data && data.length > 0) navigation.navigate('StudyCasePage', { caseData: data[0] });
      else Alert.alert('Indisponível', 'Nenhum case encontrado.');
    } catch (err) { Alert.alert('Erro', 'Falha ao carregar case.'); } 
    finally { setIsLoadingCase(false); }
  };
  
  const handleNavigateToInterativa = async () => {
    setIsLoadingInterativa(true);
    try {
      const { data, error } = await supabase.rpc('get_random_interactive_question', { prova_filter: certificationType });
      if (error) throw error;
      if (data && data.length > 0) navigation.navigate('InteractiveQuestionPage', { questionData: data[0] });
      else Alert.alert('Indisponível', 'Nenhuma interativa encontrada.');
    } catch (err) { Alert.alert('Erro', 'Falha ao carregar questão.'); } 
    finally { setIsLoadingInterativa(false); }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={cores.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{certificationName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.description}>
          Complete os módulos para dominar o conteúdo.
        </Text>

        {/* LISTA DE MÓDULOS */}
        {!isProvaClassica && currentTrack.map((module) => {
          const currentLesson = progressMap[module.id] || 0;
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
        })}

        <View style={{height: 24}} />

        {/* --- LISTA DE AÇÕES COM BLOQUEIO --- */}
        {!isProvaClassica ? (
          <>
            {/* Flashcards (FREE) */}
            <ActionCard icon={Layers} title="Flashcards de Revisão" onPress={handleNavigateToFlashCards} />
            {/* Simulado Completo (PRO) */}
            <PremiumGuard onPress={handleNavigateToSimuladoCompleto}>
                <ActionCard 
                  icon={ClipboardList} 
                  title="Simulado Completo" 
                  isPro={true} 
                />
            </PremiumGuard>

            {/* Simulado Personalizado (FREE) */}
            <ActionCard icon={LayoutList} title="Simulado Personalizado" onPress={handleNavigateToPersonalizado} />
            
            
            {/* Cases Dissertativos (PRO - Condicional) */}
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
            
            {/* Interativas (PRO - Condicional) */}
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
          </>
        ) : (
          <>
             {/* Provas Clássicas (Mantido simples por enquanto) */}
             <ActionCard icon={LayoutList} title="Praticar por Tópicos" onPress={handleNavigateToPersonalizado} />
             <ActionCard icon={Layers} title="Flashcards de Revisão" onPress={handleNavigateToFlashCards} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background, paddingTop: Platform.OS === "android" ? 25 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 30 : 16, backgroundColor: cores.background, position: 'relative' },
  backButton: { position: 'absolute', left: 20, top: Platform.OS === 'android' ? 30 : 16, zIndex: 10, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: cores.textPrimary, textAlign: 'center' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  description: { fontSize: 14, color: cores.textSecondary, marginBottom: 24, textAlign: 'left', lineHeight: 20 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: cores.cardBackground, borderRadius: 20, padding: 16, shadowColor: cores.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 15, elevation: 2 },
  moduleIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.cardBackground, borderWidth: 3, borderColor: cores.primary, marginRight: 16 },
  moduleTextContainer: { flex: 1, marginRight: 8 },
  moduleTitle: { fontSize: 16, fontWeight: 'bold', color: cores.textPrimary, marginBottom: 8 },
  progressBarContainer: { height: 8, backgroundColor: cores.border, borderRadius: 4, overflow: 'hidden', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: cores.primary, borderRadius: 4 },
  moduleProgressText: { fontSize: 12, fontWeight: '600', color: cores.textSecondary, marginTop: 6 },
});