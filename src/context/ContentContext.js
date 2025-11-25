// /src/context/ContentContext.js (VERSÃO ANTI-TRAVAMENTO)
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native'; // Adicionado TouchableOpacity
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, useAuth } from './AuthContext';

const TOPICS_CACHE_KEY = '@CertifAI_TopicsCache_v5'; // Mudei a versão para v4 para limpar cache antigo
const CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24; 

const ContentContext = createContext({
  loading: true,
  error: null,
  allTopics: [],
  getTopicsForProva: (prova) => [],
});

// Loading View com botão de "Destravar" caso demore muito
const LoadingView = ({ onRetry }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00C853" />
    <Text style={styles.loadingText}>Carregando tópicos...</Text>
    <TouchableOpacity onPress={onRetry} style={{ marginTop: 20 }}>
        <Text style={{ color: '#64748B', textDecorationLine: 'underline' }}>Demorando muito? Tentar novamente</Text>
    </TouchableOpacity>
  </View>
);

export const ContentProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTopics, setAllTopics] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    
    // Tenta carregar. Se user for null, usa cache ou zera.
    loadTopics();
    
  }, [user, authLoading]); 

  const fetchTopicsFromSupabase = async (isSilentUpdate = false) => {
    if (!isSilentUpdate) setLoading(true);
    try {
      // Tenta buscar. Se der erro de RLS ou conexão, vai pro catch
      const { data, error } = await supabase.rpc('fn_get_all_topics');
      if (error) throw error;

      setAllTopics(data || []);
      await AsyncStorage.setItem(TOPICS_CACHE_KEY, JSON.stringify({
        topics: data || [],
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error("Erro ao buscar tópicos:", e);
      if (!isSilentUpdate) setError("Não foi possível carregar os tópicos.");
    } finally {
      // GARANTE que o loading pare, aconteça o que acontecer
      if (!isSilentUpdate) setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      setLoading(true);
      const cachedJson = await AsyncStorage.getItem(TOPICS_CACHE_KEY);

      if (cachedJson) {
        const { topics } = JSON.parse(cachedJson);
        setAllTopics(topics || []);
        setLoading(false); 

        // Atualiza em background se tiver user
        if (user) fetchTopicsFromSupabase(true);
      } else {
        if (user) {
            await fetchTopicsFromSupabase(false);
        } else {
            setLoading(false); // Se não tem user nem cache, libera
        }
      }
    } catch (e) {
      console.error("Erro no loadTopics:", e);
      setLoading(false); // Destrava em caso de erro
    }
  };

  const value = useMemo(() => {
    const getTopicsForProva = (prova) => {
      if (!allTopics || allTopics.length === 0 || !prova) return [];
      const provaLimpa = prova.toLowerCase().trim();
      const capitalizeFirstLetter = (str) => !str ? '' : str.charAt(0).toUpperCase() + str.slice(1);
      return allTopics
        .filter(topic => (topic.prova || '').toLowerCase().trim() === provaLimpa)
        .map(topic => capitalizeFirstLetter(topic.modulo));
    };

    return { loading, error, allTopics, getTopicsForProva };
  }, [loading, error, allTopics]);
  
  // Mostra loading apenas se estiver realmente carregando E não tiver dados
  if (loading && !authLoading && allTopics.length === 0) { 
     // Adicionei uma função de retry manual para o usuário não ficar preso
     return <LoadingView onRetry={() => setLoading(false)} />;
  }

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#64748B' },
});