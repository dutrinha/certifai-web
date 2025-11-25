// src/Screens/OnboardingNavigator.js (VERSÃO 2.2 - Remove dailyGoal do Sync)
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, supabase } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';

// Importar as telas do fluxo
import WelcomeScreen from '../Screens/WelcomeScreen';
import OnboardingFlowScreen from '../Screens/OnboardingFlowScreen';

// --- O Sincronizador Mágico ---
const MagicSyncComponent = () => {
  const { user } = useAuth();
  const { onboardingData, clearData } = useOnboarding();

  useEffect(() => {
    if (user && onboardingData?.name && !user.user_metadata?.onboarding_completed) {
      
      console.log("MagicSync: Usuário logou. Sincronizando dados anônimos...");

      const syncData = async () => {
        try {
          // =======================================================
          // ☆ MUDANÇA (daily_goal removido) ☆
          // =======================================================
          const { error } = await supabase.auth.updateUser({
            data: {
              full_name: onboardingData.name,
              motivation: onboardingData.motivation,
              certification_focus: onboardingData.certification
            }
          });
          // =======================================================
          // ☆ FIM DA MUDANÇA ☆
          // =======================================================

          if (error) throw error;
          
          // Chame seu SDK de pagamento aqui para identificar o usuário
          // Ex: RevenueCat.logIn(user.id);
          // Ex: Superwall.identify(user.id);
          console.log("MagicSync: Sincronização e Identificação no Paywall concluídas.");

          clearData();
          
        } catch (error) {
          console.error("MagicSync: Falha ao sincronizar:", error);
        }
      };

      syncData();
    }
  }, [user, onboardingData, clearData]);

  return null;
};
// --- Fim do Sincronizador ---

const OnboardingStack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <>
      <MagicSyncComponent />
      
      <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Etapa 1: Pedir o nome e certificação (Feito) */}
        <OnboardingStack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
        />
        
        {/* Etapas 2-6: O fluxo da "Masterclass" */}
        <OnboardingStack.Screen 
          name="OnboardingFlow" 
          component={OnboardingFlowScreen} 
        />
        
      </OnboardingStack.Navigator>
    </>
  );
}