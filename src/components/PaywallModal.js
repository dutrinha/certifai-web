// src/components/PaywallModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, AppState, Image, Alert, TextInput, Dimensions, StatusBar
} from 'react-native';
import { 
  X, Check, Star, ArrowLeft, ShieldCheck, Trophy, Lock, 
  CreditCard, QrCode, ChevronDown 
} from 'lucide-react-native';
import { useAuth, supabase } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = 500;

const theme = {
  background: '#F7FAFC', cardBg: '#FFFFFF', primary: '#00C853',
  primaryLight: '#E6F8EB', text: '#1A202C', textSec: '#64748B',
  border: '#E2E8F0', shadow: 'rgba(0, 0, 0, 0.08)', red: '#EF4444',
  gold: '#FFD700', orange: '#FF6B00',
};

export default function PaywallModal({ visible, onClose }) {
  const { refreshSubscription, isPro, user } = useAuth();
  const appState = useRef(AppState.currentState);

  const [step, setStep] = useState('offer');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  
  // NOVO: Estado para parcelamento
  const [installments, setInstallments] = useState(1);
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);

  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');

  const PRICES = { monthly: 29.90, yearly: 197.00 }; // Atualizado para 197
  const MONTHLY_PRICE_ANUAL_EQUIVALENT = (PRICES.yearly / 12).toFixed(2);
  const DISCOUNT_PERCENTAGE = Math.round(((PRICES.monthly * 12 - PRICES.yearly) / (PRICES.monthly * 12)) * 100);

  useEffect(() => {
    if (!visible) return;
    refreshSubscription();
    if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
    
    // Reseta parcelas ao abrir
    setInstallments(1);

    const intervalId = setInterval(() => {
      if (step === 'payment' || loadingCard) refreshSubscription();
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
  }, [visible, refreshSubscription, step, user, loadingCard]);

  useEffect(() => {
    if (isPro && visible) {
      onClose();
      setStep('offer');
    }
  }, [isPro, visible, onClose]);

  const handleCpfChange = (text) => {
    let value = text.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  const handleCardCheckout = async () => {
    if (!user?.email) {
      Alert.alert("Erro", "E-mail não identificado.");
      return;
    }
    setLoadingCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: {
          userId: user.id,
          email: user.email,
          name: name.trim() || user.user_metadata?.full_name,
          cpf: cpf.replace(/\D/g, ''),
          cycle: selectedPlan,
          method: 'credit_card',
          installments: selectedPlan === 'yearly' ? installments : 1, // Envia parcelas
        },
      });

      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error('URL de pagamento não retornada.');

      await Linking.openURL(data.checkoutUrl);
    } catch (error) {
      console.error('Erro Checkout:', error);
      Alert.alert('Erro', 'Não foi possível gerar o link de pagamento. Tente novamente.');
    } finally {
      setLoadingCard(false);
    }
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
          name: name.trim(),
          cpf: cpfClean,
          cycle: selectedPlan,
          method: 'pix', // method pix
        },
      });
      if (error) throw error;
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
      Alert.alert('Copiado!', 'Código Pix copiado.');
    }
  };

  // --- COMPONENTES AUXILIARES ---
  const FeatureRow = ({ text }) => (
    <View style={styles.featureRow}>
      <View style={styles.checkCircle}><Check size={12} color="#FFF" strokeWidth={4} /></View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  const InstallmentOption = ({ num }) => {
    const value = PRICES.yearly / num;
    return (
        <TouchableOpacity 
            style={[styles.installmentOption, installments === num && styles.installmentOptionSelected]}
            onPress={() => { setInstallments(num); setShowInstallmentPicker(false); }}
        >
            <Text style={[styles.installmentText, installments === num && {color: theme.primary, fontWeight: 'bold'}]}>
                {num}x de R$ {value.toFixed(2).replace('.', ',')}
            </Text>
            {installments === num && <Check size={16} color={theme.primary} />}
        </TouchableOpacity>
    )
  }

  // --- TELAS ---
  const renderOffer = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeIconHitbox}>
          <X size={24} color={theme.textSec} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <View style={styles.logoCircle}><Trophy size={32} color={theme.primary} fill={theme.primaryLight} /></View>
          <Text style={styles.heroTitle}>Aprovação <Text style={{ color: theme.primary }}>Garantida.</Text></Text>
          <Text style={styles.heroSubtitle}>Acesso ilimitado à IA que já ajudou centenas de profissionais.</Text>
        </View>
        <View style={styles.featuresList}>
          <FeatureRow text="Correção Individual com IA" />
          <FeatureRow text="Questões Interativas e Cases" />
          <FeatureRow text="Simulados Ilimitados" />
        </View>
        <View style={styles.planSelector}>
          <TouchableOpacity style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]} onPress={() => setSelectedPlan('yearly')}>
            {selectedPlan === 'yearly' && <View style={styles.popularBadge}><Text style={styles.popularText}>MAIS POPULAR</Text></View>}
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, selectedPlan === 'yearly' && { color: theme.primary }]}>Anual</Text>
              {selectedPlan === 'yearly' ? <View style={styles.radioSelected}><View style={styles.radioInner} /></View> : <View style={styles.radioUnselected} />}
            </View>
            <Text style={styles.planPrice}>R$ {MONTHLY_PRICE_ANUAL_EQUIVALENT.replace('.', ',')}<Text style={styles.planPeriod}> /mês</Text></Text>
            <Text style={styles.planEquivalent}>Investimento de R$ {PRICES.yearly.toFixed(2).replace('.', ',')} /ano</Text>
            <View style={styles.savingsBadge}><Text style={styles.savingsText}>ECONOMIZE {DISCOUNT_PERCENTAGE}%</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]} onPress={() => setSelectedPlan('monthly')}>
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, selectedPlan === 'monthly' && { color: theme.primary }]}>Mensal</Text>
              {selectedPlan === 'monthly' ? <View style={styles.radioSelected}><View style={styles.radioInner} /></View> : <View style={styles.radioUnselected} />}
            </View>
            <Text style={styles.planPrice}>R$ {PRICES.monthly.toFixed(2).replace('.', ',')}<Text style={styles.planPeriod}> /mês</Text></Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={() => setStep('method')}>
          <Text style={styles.ctaText}>DESBLOQUEAR AGORA</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('offer')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Forma de Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <Text style={styles.sectionTitle}>Escolha como pagar</Text>
        
        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'pix' && styles.methodCardSelected]} onPress={() => setPaymentMethod('pix')}>
          <View style={styles.methodIconContainer}><QrCode size={24} color={paymentMethod === 'pix' ? theme.primary : theme.textSec} /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.methodTitle, paymentMethod === 'pix' && {color: theme.primary}]}>Pix</Text>
            <Text style={styles.methodSubtitle}>Liberação imediata</Text>
          </View>
          {paymentMethod === 'pix' && <Check size={20} color={theme.primary} />}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardSelected]} onPress={() => setPaymentMethod('card')}>
          <View style={styles.methodIconContainer}><CreditCard size={24} color={paymentMethod === 'card' ? theme.primary : theme.textSec} /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.methodTitle, paymentMethod === 'card' && {color: theme.primary}]}>Cartão de Crédito</Text>
            <Text style={styles.methodSubtitle}>Até 12x no plano anual</Text>
          </View>
          {paymentMethod === 'card' && <Check size={20} color={theme.primary} />}
        </TouchableOpacity>

        {/* SELETOR DE PARCELAS (Só aparece se for Cartão + Anual) */}
        {paymentMethod === 'card' && selectedPlan === 'yearly' && (
            <View style={styles.installmentContainer}>
                <Text style={styles.inputLabel}>Parcelamento</Text>
                <TouchableOpacity style={styles.installmentSelector} onPress={() => setShowInstallmentPicker(!showInstallmentPicker)}>
                    <Text style={styles.installmentSelectorText}>
                        {installments}x de R$ {(PRICES.yearly / installments).toFixed(2).replace('.', ',')}
                    </Text>
                    <ChevronDown size={20} color={theme.textSec} />
                </TouchableOpacity>
                
                {showInstallmentPicker && (
                    <View style={styles.installmentDropdown}>
                        <ScrollView style={{maxHeight: 200}} nestedScrollEnabled={true}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                <InstallmentOption key={num} num={num} />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, { marginTop: 32 }]}
          onPress={() => {
            if (paymentMethod === 'pix') setStep('cpf');
            else handleCardCheckout();
          }}
          disabled={loadingCard}
        >
          {loadingCard ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>CONTINUAR</Text>}
        </TouchableOpacity>
        
        <View style={styles.secureHintContainer}>
          <Lock size={14} color={theme.textSec} />
          <Text style={styles.guaranteeText}>Pagamento 100% seguro</Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderCpfInput = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('method')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Dados para Nota Fiscal</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.centerContent}>
        <Text style={styles.inputLabel}>Nome Completo</Text>
        <TextInput style={styles.inputField} placeholder="Seu nome" placeholderTextColor={theme.textSec} value={name} onChangeText={setName} />
        <Text style={styles.inputLabel}>CPF</Text>
        <TextInput style={styles.inputField} placeholder="000.000.000-00" placeholderTextColor={theme.textSec} keyboardType="numeric" value={cpf} onChangeText={handleCpfChange} maxLength={14} />
        <TouchableOpacity style={[styles.ctaButton, { marginTop: 24 }]} onPress={handleCreatePix} disabled={loadingPix}>
          {loadingPix ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>GERAR PIX</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPayment = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('cpf')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Pagamento via Pix</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <Text style={styles.paymentInstructions}>Escaneie o QR Code:</Text>
        <View style={styles.qrCodeBox}>
          {pixData?.qrCodeBase64 ? <Image source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }} style={{ width: 200, height: 200 }} resizeMode="contain" /> : <ActivityIndicator size="large" color={theme.primary} />}
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyPix}>
            <Text style={styles.copyButtonText}>Copiar Código Pix</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {step === 'offer' && renderOffer()}
          {step === 'method' && renderPaymentMethod()}
          {step === 'cpf' && renderCpfInput()}
          {step === 'payment' && renderPayment()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, alignItems: 'center' },
  contentContainer: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginTop: Platform.OS === 'android' ? 20 : 16, marginBottom: 10 },
  closeIconHitbox: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  heroContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: theme.text, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: theme.textSec, textAlign: 'center' },
  featuresList: { marginBottom: 30, gap: 14, backgroundColor: theme.cardBg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 14, color: theme.text, fontWeight: '600', flex: 1 },
  planSelector: { gap: 16, marginBottom: 24 },
  planCard: { backgroundColor: theme.cardBg, borderWidth: 1.5, borderColor: theme.border, borderRadius: 16, padding: 20, position: 'relative' },
  planCardSelected: { borderColor: theme.primary, backgroundColor: '#F0FDF4', borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -12, right: 16, backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, zIndex: 10 },
  popularText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  radioUnselected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border },
  radioSelected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  planPrice: { fontSize: 26, fontWeight: 'bold', color: theme.text },
  planPeriod: { fontSize: 16, fontWeight: 'normal', color: theme.textSec },
  planEquivalent: { fontSize: 13, color: theme.textSec, marginTop: 4 },
  savingsBadge: { alignSelf: 'flex-start', backgroundColor: theme.orange, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  savingsText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, padding: 20, borderRadius: 16, borderWidth: 1.5, borderColor: theme.border, marginBottom: 12, gap: 16 },
  methodCardSelected: { borderColor: theme.primary, backgroundColor: '#F0FDF4' },
  methodIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  methodSubtitle: { fontSize: 13, color: theme.textSec, marginTop: 2 },
  ctaButton: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 12, width: '100%' },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  simpleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border },
  simpleHeaderTitle: { color: theme.text, fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8 },
  centerContent: { padding: 24, alignItems: 'center', flexGrow: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 24, textAlign: 'center' },
  inputLabel: { color: theme.text, alignSelf: 'flex-start', fontSize: 16, marginBottom: 8, fontWeight: '600' },
  inputField: { outlineStyle: 'none', width: '100%', backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, color: theme.text, padding: 16, borderRadius: 12, fontSize: 18, marginBottom: 12 },
  secureHintContainer: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10, justifyContent: 'center' },
  guaranteeText: { fontSize: 13, color: theme.textSec },
  qrCodeBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  paymentInstructions: { color: theme.text, textAlign: 'center', fontSize: 16, fontWeight: '500', marginBottom: 16 },
  copyButton: { backgroundColor: theme.background, paddingVertical: 14, width: '100%', borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  copyButtonText: { color: theme.primary, fontWeight: 'bold' },
  
  // Installment Styles
  installmentContainer: { width: '100%', marginTop: 12, marginBottom: 12 },
  installmentSelector: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, padding: 16
  },
  installmentSelectorText: { fontSize: 16, color: theme.text, fontWeight: '500' },
  installmentDropdown: {
      marginTop: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, maxHeight: 200, overflow: 'hidden' // Limita altura se tiver muitos
  },
  installmentOption: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border
  },
  installmentOptionSelected: { backgroundColor: '#F0FDF4' },
  installmentText: { fontSize: 15, color: theme.text },
});
