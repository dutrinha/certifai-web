// src/context/AuthContext.js (VERSÃO OTIMIZADA + ANTI-LOOP)
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suas credenciais
const SUPABASE_URL = 'https://eojpsitiyrgndjrcmeic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvanBzaXRpeXJnbmRqcmNtZWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDQxMzgsImV4cCI6MjA3NjAyMDEzOH0.1DnI26htw_o_3Ex81suiCsq9qz84STBbVa11MbDr2jY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const AuthContext = createContext({
  session: null,
  user: null,
  subscription: null,
  isPro: false,
  loading: true,
  refreshSubscription: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca assinatura (Definida fora para ser usada no useEffect e no refresh)
  const fetchSubscription = useCallback(async (userId) => {
    console.log(`[AuthContext] fetchSubscription: Iniciando para user ${userId}...`);
    try {
      const dbPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout busca assinatura')), 3000)
      );

      const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        console.error('[AuthContext] Erro busca:', error.message);
      } else if (data) {
        // Só atualiza se o status mudou para evitar re-renders desnecessários
        setSubscription(prev => {
            if (prev?.status === data.status) return prev;
            return data;
        });
        console.log(`[AuthContext] Assinatura carregada: ${data.status}`);
      }
    } catch (error) {
      console.log('[AuthContext] Aviso na busca de assinatura:', error.message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false); 

          if (session?.user) {
            fetchSubscription(session.user.id); 
          }
        }
      } catch (err) {
        console.error("[AuthContext] Erro crítico no loadSession:", err);
        if (mounted) setLoading(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora atualizações de usuário (XP, nome) para não gerar loop de busca
      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') return;
      
      console.log(`[AuthContext] Evento Auth Relevante: ${event}`);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); 

        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
           fetchSubscription(session.user.id);
        } else if (event === 'SIGNED_OUT') {
           setSubscription(null);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchSubscription]);

  const isPro = subscription?.status === 'active';

  // useCallback garante que essa função não mude de identidade a cada render
  const refreshSubscription = useCallback(async () => {
    if (user) {
        await fetchSubscription(user.id);
    }
  }, [user, fetchSubscription]);

  // useMemo garante que o objeto 'value' seja estável
  const value = useMemo(() => ({
    session,
    user,
    subscription,
    isPro,
    loading,
    refreshSubscription
  }), [session, user, subscription, isPro, loading, refreshSubscription]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};