// src/context/OnboardingContext.js
import React, { createContext, useState, useContext } from 'react';

// Valor padrão da meta, alinhado com sua SettingsScreen
//
const DEFAULT_DAILY_GOAL = 100;

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    motivation: null, // 'novato' ou 'veterano'
    certification: null, // 'cpa', 'cpror', etc.
    dailyGoal: DEFAULT_DAILY_GOAL,
  });

  // Função para atualizar os dados
  const updateData = (newData) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  // Função para limpar os dados após o sync
  const clearData = () => {
    setOnboardingData({
      name: '',
      motivation: null,
      certification: null,
      dailyGoal: DEFAULT_DAILY_GOAL,
    });
  };

  return (
    <OnboardingContext.Provider value={{ onboardingData, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);