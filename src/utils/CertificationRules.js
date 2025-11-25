// src/utils/CertificationRules.js

// --- 1. DEFINIÇÕES DAS TRILHAS DE AULAS ---

// CPA (e aliases): Sem 'dissertative' (Case)
const LESSONS_CPA = [
  { id: 1, title: "Conceitos Fundamentais", type: 'flashcard', difficulty: 'Fácil' },
  { id: 2, title: "Quiz de Aquecimento", type: 'mc', difficulty: 'Fácil' },
  { id: 3, title: "Cenário Prático", type: 'interactive', difficulty: 'Fácil' },
  { id: 4, title: "Fixação de Termos", type: 'flashcard', difficulty: 'Fácil' },
  { id: 5, title: "Quiz: Conceitos", type: 'mc', difficulty: 'Fácil' },
  { id: 6, title: "Prática de Mercado", type: 'mc', difficulty: 'Médio' }, // Substitui Case
  { id: 7, title: "Revisão Rápida", type: 'flashcard', difficulty: 'Médio' },
  { id: 8, title: "Desafio Interativo", type: 'interactive', difficulty: 'Médio' },
  { id: 9, title: "Simulado Parcial", type: 'mc', difficulty: 'Médio' },
  { id: 10, title: "Ética e Conduta", type: 'mc', difficulty: 'Médio' }, // Substitui Case
  { id: 11, title: "Termos Técnicos", type: 'flashcard', difficulty: 'Difícil' },
  { id: 12, title: "Decisão de Investimento", type: 'interactive', difficulty: 'Difícil' },
  { id: 13, title: "Quiz Avançado", type: 'mc', difficulty: 'Difícil' },
  { id: 14, title: "Intensivo de Questões", type: 'mc', difficulty: 'Difícil' }, // Substitui Case
  { id: 15, title: "Prova do Módulo", type: 'mc', difficulty: 'Difícil' },
];

// C-PRO I: Sem 'interactive'
const LESSONS_CPROI = [
  { id: 1, title: "Conceitos Fundamentais", type: 'flashcard', difficulty: 'Fácil' },
  { id: 2, title: "Quiz de Aquecimento", type: 'mc', difficulty: 'Fácil' },
  { id: 3, title: "Memorização de Ativos", type: 'flashcard', difficulty: 'Fácil' }, // Substitui Interativa
  { id: 4, title: "Fixação de Termos", type: 'flashcard', difficulty: 'Fácil' },
  { id: 5, title: "Quiz: Produtos", type: 'mc', difficulty: 'Fácil' },
  { id: 6, title: "Análise de Caso: Cliente", type: 'dissertative', difficulty: 'Médio' },
  { id: 7, title: "Revisão Rápida", type: 'flashcard', difficulty: 'Médio' },
  { id: 8, title: "Quiz: Tributação", type: 'mc', difficulty: 'Médio' }, // Substitui Interativa
  { id: 9, title: "Simulado Parcial", type: 'mc', difficulty: 'Médio' },
  { id: 10, title: "Case: Montagem de Carteira", type: 'dissertative', difficulty: 'Médio' },
  { id: 11, title: "Termos Técnicos", type: 'flashcard', difficulty: 'Difícil' },
  { id: 12, title: "Quiz: Gestão de Risco", type: 'mc', difficulty: 'Difícil' }, // Substitui Interativa
  { id: 13, title: "Quiz Avançado", type: 'mc', difficulty: 'Difícil' },
  { id: 14, title: "Case Complexo", type: 'dissertative', difficulty: 'Difícil' },
  { id: 15, title: "Prova do Módulo", type: 'mc', difficulty: 'Difícil' },
];

// C-PRO R: Tem tudo
const LESSONS_CPROR = [
  { id: 1, title: "Conceitos Básicos", type: 'flashcard', difficulty: 'Fácil' },
  { id: 2, title: "Quiz Introdutório", type: 'mc', difficulty: 'Fácil' },
  { id: 3, title: "Cenário Prático", type: 'interactive', difficulty: 'Fácil' },
  { id: 4, title: "Fixação de Termos", type: 'flashcard', difficulty: 'Fácil' },
  { id: 5, title: "Aprofundamento", type: 'mc', difficulty: 'Fácil' },
  { id: 6, title: "Análise de Caso", type: 'dissertative', difficulty: 'Médio' },
  { id: 7, title: "Revisão Rápida", type: 'flashcard', difficulty: 'Médio' },
  { id: 8, title: "Desafio Interativo", type: 'interactive', difficulty: 'Médio' },
  { id: 9, title: "Simulado Parcial", type: 'mc', difficulty: 'Médio' },
  { id: 10, title: "Ética e Conduta", type: 'dissertative', difficulty: 'Médio' },
  { id: 11, title: "Termos Técnicos", type: 'flashcard', difficulty: 'Difícil' },
  { id: 12, title: "Decisão de Investimento", type: 'interactive', difficulty: 'Difícil' },
  { id: 13, title: "Quiz Avançado", type: 'mc', difficulty: 'Difícil' },
  { id: 14, title: "Case Complexo", type: 'dissertative', difficulty: 'Difícil' },
  { id: 15, title: "Prova do Módulo", type: 'mc', difficulty: 'Difícil' },
];

// Default: Apenas Múltipla Escolha (MC)
const LESSONS_DEFAULT = [
  { id: 1, title: "Conceitos Básicos", type: 'mc', difficulty: 'Fácil' },
  { id: 2, title: "Quiz Introdutório", type: 'mc', difficulty: 'Fácil' },
  { id: 3, title: "Cenário Prático", type: 'mc', difficulty: 'Fácil' },
  { id: 4, title: "Fixação de Termos", type: 'mc', difficulty: 'Fácil' },
  { id: 5, title: "Aprofundamento", type: 'mc', difficulty: 'Fácil' },
  { id: 6, title: "Análise de Caso", type: 'mc', difficulty: 'Médio' },
  { id: 7, title: "Revisão Rápida", type: 'mc', difficulty: 'Médio' },
  { id: 8, title: "Desafio", type: 'mc', difficulty: 'Médio' },
  { id: 9, title: "Simulado Parcial", type: 'mc', difficulty: 'Médio' },
  { id: 10, title: "Ética e Conduta", type: 'mc', difficulty: 'Médio' },
  { id: 11, title: "Termos Técnicos", type: 'mc', difficulty: 'Difícil' },
  { id: 12, title: "Decisão de Investimento", type: 'mc', difficulty: 'Difícil' },
  { id: 13, title: "Quiz Avançado", type: 'mc', difficulty: 'Difícil' },
  { id: 14, title: "Case Complexo", type: 'mc', difficulty: 'Difícil' },
  { id: 15, title: "Prova do Módulo", type: 'mc', difficulty: 'Difícil' },
];


// --- 2. REGRA MESTRA (Agora inclui as lições) ---

const BASE_RULES = {
  cpa: {
    hasMC: true,
    hasInteractive: true,
    hasCase: false,
    lessons: LESSONS_CPA,
  },
  cpror: {
    hasMC: true,
    hasInteractive: true,
    hasCase: true,
    lessons: LESSONS_CPROR, // ATUALIZADO
  },
  cproi: {
    hasMC: true,
    hasInteractive: false,
    hasCase: true,
    lessons: LESSONS_CPROI,
  },
  // Fallback
  default: {
    hasMC: true,
    hasInteractive: false, // ATUALIZADO
    hasCase: false,      // ATUALIZADO
    lessons: LESSONS_DEFAULT, // ATUALIZADO
  }
};

// --- 3. EXPORTAÇÕES (Helpers) ---

// Adiciona aliases para as regras da CPA
export const CERTIFICATION_RULES = {
  ...BASE_RULES,
  'cpa10': BASE_RULES.cpa,
  'cpa20': BASE_RULES.cpa,
  'cea': BASE_RULES.cpa,
};

// Função helper para pegar as regras GERAIS
export const getCertificationRules = (certificationType) => {
  const key = certificationType ? certificationType.toLowerCase().trim() : 'default';
  return CERTIFICATION_RULES[key] || CERTIFICATION_RULES.default;
};

// NOVA Função helper para pegar APENAS as lições
export const getLessonsForCertification = (certificationType) => {
  const rules = getCertificationRules(certificationType);
  return rules.lessons || LESSONS_DEFAULT; // Garante um fallback
};