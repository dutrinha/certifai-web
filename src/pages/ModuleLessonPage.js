// src/pages/ModuleLessonPage.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  CheckCircle,
  Layers,
  Zap,
  FileText,
  ListChecks,
  Play,
  Circle
} from 'lucide-react-native';
import { supabase, useAuth } from '../context/AuthContext';
import { fetchCertificationProgress } from '../context/progressService'; 
import { getLessonsForCertification } from '../utils/CertificationRules';

// --- NOVO IMPORT ---
import PremiumGuard from '../components/PremiumGuard';

const cores = {
  primary: "#00C853", primaryLight: "#E6F8EB", textPrimary: "#1A202C",
  textSecondary: "#64748B", textLight: "#FFFFFF", background: "#F7FAFC",
  cardBackground: "#FFFFFF", border: "#E2E8F0", blue: '#3B82F6',
  blueLight: '#EFF6FF', orange: '#F59E0B', orangeLight: '#FFFBEB',
  purple: '#8B5CF6', purpleLight: '#F3E8FF', gray: "#94A3B8",
};

const getTypeInfo = (type, status) => {
  if (status === 'completed') {
    return { icon: CheckCircle, label: 'Concluído', color: cores.primary, light: cores.primaryLight };
  }
  const isPending = status === 'pending';
  switch (type) {
    case 'flashcard': return { icon: Layers, label: 'Flashcards', color: isPending ? cores.textSecondary : cores.blue, light: isPending ? cores.background : cores.blueLight };
    case 'mc': return { icon: ListChecks, label: 'Múltipla Escolha', color: isPending ? cores.textSecondary : cores.primary, light: isPending ? cores.background : cores.primaryLight };
    case 'interactive': return { icon: Zap, label: 'Interativa', color: isPending ? cores.textSecondary : cores.orange, light: isPending ? cores.background : cores.orangeLight };
    case 'dissertative': return { icon: FileText, label: 'Dissertativa', color: isPending ? cores.textSecondary : cores.purple, light: isPending ? cores.background : cores.purpleLight };
    default: return { icon: Circle, label: 'Aula', color: cores.textSecondary, light: cores.background };
  }
};

const LessonTimelineItem = ({ item, index, total, onPress, isLoading, status }) => {
  const isLast = index === total - 1;
  const { icon: TypeIcon, label, color } = getTypeInfo(item.type, status);
  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isPending = status === 'pending';

  let CenterIcon = TypeIcon;
  if (isCompleted) CenterIcon = CheckCircle;
  if (isActive) CenterIcon = Play; 

  // Cores das linhas
  const topLineColor = isActive ? cores.primary : (isPending ? cores.border : cores.primary);
  const bottomLineColor = isActive ? cores.border : (isCompleted ? cores.primary : cores.border);

  return (
    <View style={styles.timelineRow}>
      {/* Coluna da Linha do Tempo - Ajustada para alinhamento perfeito */}
      <View style={styles.timelineColumn}>
        {/* Linha Superior (Flex 1) ou Espaçador Transparente se for o primeiro */}
        <View style={[styles.line, { 
            backgroundColor: index > 0 ? topLineColor : 'transparent',
            flex: 1 
        }]} />
        
        {/* Círculo do Ícone */}
        <View style={[styles.iconCircle, { 
            borderColor: isActive ? cores.primary : (isPending ? cores.border : color), 
            backgroundColor: isActive ? cores.primary : cores.cardBackground,
            borderWidth: isActive ? 0 : 2,
            shadowColor: isActive ? cores.primary : 'transparent', shadowOpacity: isActive ? 0.4 : 0, shadowRadius: 8, elevation: isActive ? 5 : 0,
          }]}>
          <CenterIcon size={isActive ? 20 : 18} color={isActive ? cores.textLight : (isPending ? cores.textSecondary : color)} fill={isActive ? cores.textLight : 'transparent'} />
        </View>
        
        {/* Linha Inferior (Flex 1) ou Espaçador Transparente se for o último */}
        <View style={[styles.line, { 
            backgroundColor: !isLast ? bottomLineColor : 'transparent', 
            flex: 1 
        }]} />

        {/* Espaçador Fixo (16px) para compensar a margem do Card */}
        {/* Isso garante que o centro do círculo alinhe com o centro do CARD, não da ROW inteira */}
        <View style={{ 
            width: 2, 
            height: 16, // Mesma altura do marginBottom do card
            backgroundColor: !isLast ? bottomLineColor : 'transparent' 
        }} />
      </View>

      {/* Card de Conteúdo (O TouchableOpacity principal) */}
      <TouchableOpacity 
        style={[styles.lessonCard, isActive && styles.lessonCardActive, isPending && styles.lessonCardPending]} 
        onPress={onPress} 
        activeOpacity={0.7} 
        disabled={isLoading}
      >
        <View style={styles.cardContent}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems: 'center'}}>
             <Text style={[styles.lessonType, { color: isActive ? cores.primary : color }]}>
               {item.type === 'mc' ? `${label} (${item.difficulty})` : label}
             </Text>
             {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>CONTINUAR</Text></View>}
          </View>
          <Text style={[styles.lessonTitle, isPending && { color: cores.textSecondary }]}>
             Aula {index + 1}: {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function ModuleLessonsPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { moduleTitle, moduleTopics, certificationType, moduleId } = route.params;
  
  const [loadingId, setLoadingId] = useState(null);
  const [completedIndex, setCompletedIndex] = useState(0);

  const lessonsList = useMemo(() => {
    return getLessonsForCertification(certificationType);
  }, [certificationType]);

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        if (!user) return;
        const progressData = await fetchCertificationProgress(user.id, certificationType);
        const thisModule = progressData.find(p => p.module_id === moduleId);
        setCompletedIndex(thisModule ? thisModule.current_lesson_index : 0);
      };
      loadProgress();
    }, [certificationType, moduleId, user])
  );

  const activeLessonId = useMemo(() => {
    if (completedIndex >= lessonsList.length) return -1;
    return lessonsList[completedIndex].id;
  }, [lessonsList, completedIndex]);

  const handleLessonPress = async (lesson, index) => {
    if (index > completedIndex) {
      console.log("Aula futura, bloqueada.");
      return; 
    }

    setLoadingId(lesson.id);

    const lessonContext = {
      certificationType,
      moduleId,
      lessonIndex: index,
      lessonTitle: `Aula ${index + 1}: ${lesson.title}`
    };

    try {
      switch (lesson.type) {
        case 'flashcard':
          const { data: flashcards, error: fcError } = await supabase.rpc('fn_get_flashcards_for_review', {
              p_prova: certificationType, p_limit: 15, p_topic_list: moduleTopics, p_difficulty_filter: null 
          });
          if (fcError) throw fcError;
          if (flashcards?.length > 0) {
            navigation.navigate('FlashCardPage', { deck: flashcards, certificationType, isPracticeMode: true, ...lessonContext });
          } else {
            Alert.alert("Aviso", "Conteúdo em breve.");
          }
          break;

        case 'mc':
          navigation.navigate('simulado', { 
            count: 10, 
            topics: moduleTopics, 
            prova: certificationType, 
            difficulty: lesson.difficulty,
            certificationName: lessonContext.lessonTitle, 
            ...lessonContext
          });
          break;

        case 'dissertative':
          const { data: caseData, error: cError } = await supabase.rpc('get_random_case', { prova_filter: certificationType });
          if (cError) throw cError;
          if (caseData?.[0]) {
             navigation.navigate('StudyCasePage', { caseData: caseData[0], ...lessonContext });
          } else {
             Alert.alert("Aviso", "Conteúdo em breve.");
          }
          break;
          
        case 'interactive':
          const { data: iData, error: iError } = await supabase.rpc('get_random_interactive_question', { prova_filter: certificationType });
          if (iError) throw iError;
          if (iData?.[0]) {
            navigation.navigate('InteractiveQuestionPage', { questionData: iData[0], ...lessonContext });
          } else {
            Alert.alert("Aviso", "Conteúdo em breve.");
          }
          break;
      }
    } catch (err) {
      console.error("Erro ao abrir aula:", err);
      Alert.alert("Erro", "Não foi possível carregar a aula.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={cores.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Complete todas as aulas para dominar o tópico.
        </Text>

        <View style={styles.timelineContainer}>
          {lessonsList.map((item, index) => {
            let status = 'pending';
            if (index < completedIndex) status = 'completed';
            if (index === completedIndex) status = 'active';
            
            const isDisabled = status === 'pending' || loadingId !== null;
            
            // --- LÓGICA DE BLOQUEIO ---
            const isProLesson = item.type === 'interactive' || item.type === 'dissertative';

            // Se for uma lição Pro, envolvemos com o PremiumGuard
            if (isProLesson) {
                return (
                    <View key={item.id}>
                        <PremiumGuard onPress={() => handleLessonPress(item, index)}>
                           {/* O PremiumGuard vai interceptar o toque. Passamos o componente visual como filho */}
                           <LessonTimelineItem
                                item={item}
                                index={index}
                                total={lessonsList.length}
                                status={status}
                                // Removemos o onPress daqui, pois o Guard vai gerenciar
                                // Mas precisamos deixar 'disabled' se estiver pendente para o visual ficar correto (cinza)
                                onPress={undefined} 
                                isLoading={loadingId === item.id}
                                // Mantemos a lógica visual de desabilitado se for aula futura
                                disabled={status === 'pending'} 
                            />
                        </PremiumGuard>
                        {loadingId === item.id && (
                            <View style={styles.itemLoadingOverlay}>
                                <ActivityIndicator color={cores.primary} />
                            </View>
                        )}
                    </View>
                );
            }

            // Se for Free, renderiza normal
            return (
              <View key={item.id}>
                 <LessonTimelineItem
                    item={item}
                    index={index}
                    total={lessonsList.length}
                    status={status}
                    onPress={() => handleLessonPress(item, index)}
                    isLoading={loadingId === item.id}
                    disabled={isDisabled}
                 />
                 {loadingId === item.id && (
                   <View style={styles.itemLoadingOverlay}>
                     <ActivityIndicator color={cores.primary} />
                   </View>
                 )}
              </View>
            );
          })}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.background, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 30 : 16,
    backgroundColor: cores.background, gap: 16
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: cores.textPrimary, flex: 1 },
  
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  description: { fontSize: 14, color: cores.textSecondary, marginBottom: 24, marginTop: 8 },
  
  timelineContainer: { paddingLeft: 10 }, 
  timelineRow: { flexDirection: 'row', minHeight: 90 }, 
  
  timelineColumn: { alignItems: 'center', width: 40, marginRight: 16 },
  line: { width: 2, backgroundColor: cores.border }, // Flex é controlado inline agora
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
    marginVertical: 4, backgroundColor: cores.cardBackground
  },

  lessonCard: {
    flex: 1, backgroundColor: cores.cardBackground, borderRadius: 16,
    padding: 16, marginBottom: 16, justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent'
  },
  lessonCardActive: {
    borderColor: cores.primary,
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4' 
  },
  lessonCardPending: {
    elevation: 0, 
    backgroundColor: '#F8FAFC', 
    borderColor: cores.border,
    borderWidth: 1,
    opacity: 0.7,
  },
  
  lessonType: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: cores.textPrimary },
  
  activeBadge: {
    backgroundColor: cores.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4
  },
  activeBadgeText: {
    color: cores.textLight,
    fontSize: 10,
    fontWeight: 'bold'
  },
  itemLoadingOverlay: {
    position: 'absolute',
    right: 20,
    top: 30,
    zIndex: 10
  }
});