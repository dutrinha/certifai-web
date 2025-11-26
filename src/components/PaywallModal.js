// src/components/PaywallModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  AppState,
  Image,
  Alert,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { X, Check, Star, ArrowLeft, ShieldCheck, Trophy, Lock } from 'lucide-react-native';
import { useAuth, supabase } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// --- PALETA DE CORES DO APP ---
const theme = {
  background: '#F7FAFC',
  cardBg: '#FFFFFF',
  primary: '#00C853',
  primaryLight: '#E6F8EB',
  text: '#1A202C',
  textSec: '#64748B',
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.08)',
  red: '#EF4444',
  gold: '#FFD700',
  orange: '#FF6B00', // Nova cor para destaque de economia
};

export default function PaywallModal({ visible, onClose }) {
  const { refreshSubscription, isPro, user } = useAuth();
  const appState = useRef(AppState.currentState);

  // Fluxo: 'offer' (Hero + Preços) -> 'cpf' -> 'payment'
  const [step, setStep] = useState('offer');
  const [loadingPix, setLoadingPix] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState(''); // Novo state para o nome
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  // Preços
  const PRICES = {
    monthly: 29.90,
    yearly: 16.42,
  };

  // Cálculos
  const MONTHLY_PRICE_ANUAL_EQUIVALENT = (PRICES.yearly * 12).toFixed(0);
  const DISCOUNT_PERCENTAGE = Math.round(((PRICES.monthly - PRICES.yearly) / PRICES.monthly) * 100);

  // Monitoramento de status (Mantido igual)
  useEffect(() => {
    if (!visible) return;
    refreshSubscription();

    // Preencher nome se disponível
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    }

    const intervalId = setInterval(() => {
      if (step === 'payment') refreshSubscription();
    }, 3000);
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshSubscription();
      }
      appState.current = nextAppState;
    });
    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [visible, refreshSubscription, step, user]);

  useEffect(() => {
    if (isPro && visible) {
      onClose();
      setStep('offer');
    }
  }, [isPro, visible, onClose]);

  // Handlers
  const handleCpfChange = (text) => {
    let value = text.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  const handleGoToCpf = () => {
    setStep('cpf');
  };

  const handleCreatePix = async () => {
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      Alert.alert("CPF Inválido", "Por favor, digite um CPF válido.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Nome Inválido", "Por favor, digite seu nome completo.");
      return;
    }

    setLoadingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: {
          userId: user.id,
          email: user.email,
          name: name.trim(), // Usando o nome do input
          cpf: cpfClean,
          cycle: selectedPlan,
        },
      });

      if (error) throw error;
      if (!data?.qrCodeBase64) throw new Error('Erro ao obter QR Code.');

      setPixData(data);
      setStep('payment');
    } catch (error) {
      console.error('Erro Pix:', error);
      Alert.alert('Erro', `Falha ao gerar Pix: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoadingPix(false);
    }
  };

  const handleCopyPix = async () => {
    if (pixData?.copyPaste) {
      await Clipboard.setStringAsync(pixData.copyPaste);
      Alert.alert('Copiado!', 'Código Pix copiado para a área de transferência.');
    }
  };

  // --- TELA 1: OFERTA (Design Novo) ---
  const renderOffer = () => (
    <View style={{ flex: 1 }}>
      {/* Botão Fechar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeIconHitbox}>
          <X size={24} color={theme.textSec} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section Atualizada */}
        <View style={styles.heroContainer}>
          <View style={styles.logoCircle}>
            <Trophy size={32} color={theme.primary} fill={theme.primaryLight} />
          </View>

          <Text style={styles.heroTitle}>Não arrisque reprovar por <Text style={{ color: theme.primary }}>falta de preparo.</Text></Text>

          <Text style={styles.heroSubtitle}>
            Acesso ilimitado à IA que já ajudou centenas de profissionais a serem aprovados.
          </Text>

          {/* Prova Social */}
          <View style={styles.socialProofContainer}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <Star key={i} size={14} color={theme.gold} fill={theme.gold} />
              ))}
            </View>
            <Text style={styles.socialProofText}>Favorito dos estudantes</Text>
          </View>
        </View>

        {/* Benefícios Atualizados */}
        <View style={styles.featuresList}>
          <FeatureRow text="Correção Individual com ajuda de IA" />
          <FeatureRow text="Questões Dissertativas e Interativas" />
          <FeatureRow text="Prepare-se para qualquer desafio da carreira." />
          <FeatureRow text="Simulados Ilimitados e Personalizados" />
        </View>

        {/* Seletor de Planos */}
        <View style={styles.planSelector}>

          {/* Plano Anual */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.9}
          >
            {selectedPlan === 'yearly' && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MAIS POPULAR</Text>
              </View>
            )}
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, selectedPlan === 'yearly' && { color: theme.primary }]}>Anual</Text>
              {selectedPlan === 'yearly' ?
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View> :
                <View style={styles.radioUnselected} />
              }
            </View>

            <Text style={styles.planPrice}>
              R$ {PRICES.yearly.toFixed(2).replace('.', ',')}
              <Text style={styles.planPeriod}> /mês</Text>
            </Text>
            <Text style={styles.planEquivalent}>
              Apenas R$ {MONTHLY_PRICE_ANUAL_EQUIVALENT.replace('.', ',')} /ano
            </Text>

            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>ECONOMIZE {DISCOUNT_PERCENTAGE}%</Text>
            </View>
          </TouchableOpacity>

          {/* Plano Mensal */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.9}
          >
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, selectedPlan === 'monthly' && { color: theme.primary }]}>Mensal</Text>
              {selectedPlan === 'monthly' ?
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View> :
                <View style={styles.radioUnselected} />
              }
            </View>
            <Text style={styles.planPrice}>
              R$ {PRICES.monthly.toFixed(2).replace('.', ',')}
              <Text style={styles.planPeriod}> /mês</Text>
            </Text>
          </TouchableOpacity>

        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleGoToCpf}>
          <Text style={styles.ctaText}>DESBLOQUEAR MINHA APROVAÇÃO</Text>
        </TouchableOpacity>

        <View style={styles.guaranteeContainer}>
          <ShieldCheck size={14} color={theme.textSec} />
          <Text style={styles.guaranteeText}>Garantia de 7 dias incondicional</Text>
        </View>

      </ScrollView>
    </View>
  );

  // --- TELA 2: CPF (Segurança) ---
  const renderCpfInput = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('offer')} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Identificação Segura</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.centerContent}>
        {/* Ícone de Segurança */}
        <View style={styles.securityHeader}>
          <View style={styles.lockCircle}>
            <Lock size={28} color={theme.primary} />
          </View>
          <Text style={styles.securityTitle}>Segurança em primeiro lugar</Text>
        </View>

        <Text style={styles.inputLabel}>Nome Completo</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Seu nome completo"
          placeholderTextColor={theme.textSec}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.inputLabel}>Informe seu CPF</Text>
        <TextInput
          style={styles.inputField}
          placeholder="000.000.000-00"
          placeholderTextColor={theme.textSec}
          keyboardType="numeric"
          value={cpf}
          onChangeText={handleCpfChange}
          maxLength={14}
        />

        <View style={styles.secureHintContainer}>
          <ShieldCheck size={16} color={theme.textSec} />
          <Text style={styles.inputHint}>
            Seus dados estão criptografados. O CPF é obrigatório apenas para a emissão automática da sua Nota Fiscal.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { marginTop: 24 }, loadingPix && { opacity: 0.7 }]}
          onPress={handleCreatePix}
          disabled={loadingPix}
        >
          {loadingPix ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>IR PARA PAGAMENTO</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- TELA 3: PAGAMENTO (Pix) ---
  const renderPayment = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('cpf')} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Pagamento via Pix</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.centerContent}>
        <Text style={styles.paymentInstructions}>
          Escaneie o QR Code abaixo para liberar seu acesso imediato:
        </Text>

        <View style={styles.qrCodeBox}>
          {pixData?.qrCodeBase64 ? (
            <Image
              source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator size="large" color={theme.primary} />
          )}
        </View>

        <View style={styles.divider} />

        <Text style={[styles.paymentInstructions, { marginTop: 24 }]}>
          Ou copie o código Pix Copia e Cola:
        </Text>

        <View style={styles.copyPasteContainer}>
          <View style={styles.copyPasteTextContainer}>
            <Text style={styles.copyPasteLabel} numberOfLines={1}>
              {pixData?.copyPaste || "Carregando código..."}
            </Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyPix}>
            <Text style={styles.copyButtonText}>Copiar</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputHint, { textAlign: 'center' }]}>
          Abra o app do seu banco, escolha Pix e depois "Pix Copia e Cola".
        </Text>

        <View style={styles.checkingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.checkingText}>Aguardando pagamento...</Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {step === 'offer' ? renderOffer() : (step === 'cpf' ? renderCpfInput() : renderPayment())}
      </View>
    </Modal>
  );
}

const FeatureRow = ({ text }) => (
  <View style={styles.featureRow}>
    <View style={styles.checkCircle}>
      <Check size={12} color="#FFF" strokeWidth={4} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 20 : 16,
    marginBottom: 10,
  },
  closeIconHitbox: {
    padding: 8,
    backgroundColor: '#F1F5F9', // Fundo leve para o botão X
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Hero Section
  heroContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 0,
  },
  logoCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.textSec,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  socialProofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4', // Fundo verde bem claro
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.text,
    marginLeft: 8,
  },

  // Features
  featuresList: {
    marginBottom: 30,
    gap: 14,
    backgroundColor: theme.cardBg,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600', // Texto um pouco mais bold para leitura fácil
    flex: 1,
  },

  // Plans
  planSelector: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: theme.cardBg,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardSelected: {
    borderColor: theme.primary,
    backgroundColor: '#F0FDF4', // Fundo levemente verde quando selecionado
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  radioUnselected: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border,
  },
  radioSelected: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.text,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: theme.textSec,
  },
  planEquivalent: {
    fontSize: 13,
    color: theme.textSec,
    marginTop: 4,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.orange, // Cor Laranja para contraste alto
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // CTA
  ctaButton: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    width: '100%',
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  guaranteeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  guaranteeText: {
    fontSize: 13,
    color: theme.textSec,
  },

  // --- Estilos Telas Secundárias (CPF/Pix) ---
  simpleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  simpleHeaderTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  centerContent: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  // Header de Segurança na tela CPF
  securityHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lockCircle: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  inputLabel: {
    color: theme.text,
    alignSelf: 'flex-start',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputField: {
    width: '100%',
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 12,
  },
  secureHintContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
    paddingRight: 10,
  },
  inputHint: {
    color: theme.textSec,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  qrCodeBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentInstructions: {
    color: theme.text,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: theme.border,
    marginVertical: 10,
  },
  copyPasteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  copyPasteTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  copyPasteLabel: {
    fontSize: 14,
    color: theme.textSec,
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderLeftWidth: 1,
    borderLeftColor: theme.border,
  },
  copyButtonText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkingContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    backgroundColor: theme.primaryLight,
    borderRadius: 12,
  },
  checkingText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 14,
  }
});