import { supabase } from '../context/AuthContext';

// Helper para pegar a data
const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * O "CÉREBRO" DA HOMEPAGE
 * Busca todos os dados necessários para a HomePage de uma vez.
 */
export const getSmartHomeData = async (user) => {
  if (!user) return null;

  try {
    // 1. Pega os dados estáticos do usuário (foco, meta)
    const meta = user.user_metadata || {};
    const certificationFocus = meta.certification_focus || 'cpa';
    const dailyGoal = meta.daily_goal || 100;

    // 2. Pega os dados dinâmicos (pontos, streak)
    const today = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    let currentPoints = 0;
    if (meta.daily_progress && meta.daily_progress.date === today) {
      currentPoints = meta.daily_progress.count;
    }

    let currentStreak = 0;
    if (meta.study_streak && (meta.study_streak.lastStudiedDate === today || meta.study_streak.lastStudiedDate === yesterdayString)) {
      currentStreak = meta.study_streak.count;
    }

    // 3. Busca o progresso real de TODAS as certificações (Pre-load)
    const allProgress = await fetchAllCertificationsProgress(user.id);

    // 4. Converte o progresso em um objeto aninhado: { cpa: {1: 5}, cpror: {1: 2} }
    const allProgressMaps = {
      cpa: {},
      cpror: {},
      cproi: {}
    };

    allProgress.forEach(item => {
      if (!allProgressMaps[item.certification]) {
        allProgressMaps[item.certification] = {};
      }
      allProgressMaps[item.certification][item.module_id] = item.current_lesson_index;
    });

    // 5. Retorna um objeto único com tudo que a Home precisa
    return {
      points: currentPoints,
      goal: dailyGoal,
      streak: currentStreak,
      certification: certificationFocus,
      allProgressMaps: allProgressMaps, // Agora retornamos todos os mapas
    };

  } catch (error) {
    console.error("Erro ao buscar dados da Home:", error);
    return null;
  }
};

/**
 * Busca o progresso de TODOS os módulos de TODAS as certificações do usuário
 */
export const fetchAllCertificationsProgress = async (userId) => {
  try {
    if (!userId) {
      console.warn("fetchAllCertificationsProgress chamado sem userId.");
      return [];
    }

    // Removemos o filtro .eq('certification', certificationType) para pegar tudo
    const { data, error } = await supabase
      .from('user_module_progress')
      .select('certification, module_id, current_lesson_index')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return [];
  }
};

/**
 * Busca o progresso de todos os módulos de uma certificação
 * Mantido para compatibilidade, mas agora pode ser redundante se usarmos o fetchAll
 */
export const fetchCertificationProgress = async (userId, certificationType) => {
  try {
    if (!userId) {
      console.warn("fetchCertificationProgress chamado sem userId.");
      return [];
    }

    const { data, error } = await supabase
      .from('user_module_progress')
      .select('module_id, current_lesson_index')
      .eq('user_id', userId)
      .eq('certification', certificationType);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return [];
  }
};

/**
 * Avança o progresso (conclui uma aula)
 */
export const markLessonAsCompleted = async (certificationType, moduleId, lessonIndex) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    const { data: currentData } = await supabase
      .from('user_module_progress')
      .select('current_lesson_index')
      .eq('user_id', user.id)
      .eq('certification', certificationType)
      .eq('module_id', moduleId)
      .single();

    const currentIndex = currentData?.current_lesson_index || 0;

    // --- CORREÇÃO DO BUG 2 ---
    // MUDADO DE (lessonIndex >= currentIndex) para (lessonIndex === currentIndex)
    // Isso garante que o progresso SÓ avance se você completar a aula ATUAL.
    // (Evita que refazer a aula 0 avance o progresso da aula 3 para 4)
    if (lessonIndex === currentIndex) {
      const newIndex = currentIndex + 1;
      const { error } = await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user.id,
          certification: certificationType,
          module_id: moduleId,
          current_lesson_index: newIndex,
          updated_at: new Date()
        }, { onConflict: 'user_id, certification, module_id' }); // Garante que vai atualizar a linha correta

      if (error) throw error;
      console.log(`Progresso atualizado: Módulo ${moduleId} -> Próxima aula é ${newIndex}`);
      return newIndex;
    }

    // Se a aula completada for uma antiga (ex: index 0) e o progresso já estiver no 3, não faz nada
    console.log(`Aula ${lessonIndex} refeita, progresso atual (${currentIndex}) mantido.`);
    return currentIndex;
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    throw error;
  }
};

/**
 * Atualiza a certificação principal do usuário no Supabase
 */
export const updateUserCertificationFocus = async (newCertification) => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { certification_focus: newCertification }
    });
    if (error) throw error;
    console.log("Foco de certificação atualizado para:", newCertification);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar foco de certificação:", error);
    return false;
  }
};