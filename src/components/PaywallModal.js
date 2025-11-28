// src/components/PaywallModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, AppState, Image, Alert, TextInput, Dimensions, StatusBar, Animated, SafeAreaView
} from 'react-native';
import { 
  X, Check, Star, ArrowLeft, ShieldCheck, Trophy, Lock, 
  CreditCard, QrCode, ChevronDown, Copy, Clock, Zap,
  Brain, Target, TrendingUp, BookOpen
} from 'lucide-react-native';
import { useAuth, supabase } from '../context/AuthContext'; // Ajuste o caminho conforme seu projeto
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = 500;

const theme = {
  background: '#F7FAFC', cardBg: '#FFFFFF', primary: '#00C853',
  primaryLight: '#E6F8EB', text: '#1A202C', textSec: '#64748B',
  border: '#E2E8F0', shadow: 'rgba(0, 0, 0, 0.08)', 
  red: '#EA1D2C', 
  gold: '#FFD700', orange: '#FF6B00', darkBlue: '#0F172A',
  black: '#000000', white: '#FFFFFF',
  grayInput: '#F2F4F7'
};

export default function PaywallModal({ visible, onClose }) {
  const { refreshSubscription, isPro, user } = useAuth();
  const appState = useRef(AppState.currentState);

  const [step, setStep] = useState('offer');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  
  const [installments, setInstallments] = useState(1);
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);

  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const PRICES = { monthly: 29.90, yearly: 197.00 }; 
  const MONTHLY_PRICE_ANUAL_EQUIVALENT = (PRICES.yearly / 12).toFixed(2);
  const DISCOUNT_PERCENTAGE = 45; 

  useEffect(() => {
    if (visible) {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (refreshSubscription) refreshSubscription();
    if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
    setInstallments(1);
    
    const intervalId = setInterval(() => {
      if (step === 'payment' || loadingCard) {
          if (refreshSubscription) refreshSubscription();
      }
    }, 3000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (refreshSubscription) refreshSubscription();
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
    if (!user?.email) { Alert.alert("Erro", "E-mail não identificado."); return; }
    setLoadingCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: {
          userId: user.id, email: user.email, name: name.trim() || user.user_metadata?.full_name,
          cpf: cpf.replace(/\D/g, ''), cycle: selectedPlan, method: 'credit_card',
          installments: selectedPlan === 'yearly' ? installments : 1,
        },
      });
      if (error) throw error;
      if (!data?.checkoutUrl) throw new Error('URL não retornada.');
      await Linking.openURL(data.checkoutUrl);
    } catch (error) {
      console.error('Erro Checkout:', error);
      Alert.alert('Erro', 'Tente novamente.');
    } finally { setLoadingCard(false); }
  };

  const handleCreatePix = async () => {
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) { Alert.alert("CPF Inválido", "Digite um CPF válido."); return; }
    if (!name.trim()) { Alert.alert("Nome Inválido", "Digite seu nome."); return; }
    setLoadingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-charge', {
        body: { userId: user.id, email: user.email, name: name.trim(), cpf: cpfClean, cycle: selectedPlan, method: 'pix' },
      });
      if (error) throw error;
      setPixData(data);
      setStep('payment');
    } catch (error) {
      Alert.alert('Erro', `Falha ao gerar Pix: ${error.message}`);
    } finally { setLoadingPix(false); }
  };

  const handleCopyPix = async () => {
    if (pixData?.copyPaste) {
      await Clipboard.setStringAsync(pixData.copyPaste);
      if (Platform.OS === 'web') window.alert('Copiado!');
      else Alert.alert('Sucesso', 'Código Pix copiado.');
    }
  };

  const BenefitRow = ({ icon: Icon, title, description }) => (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIconBox}>
        <Icon size={20} color={theme.primary} strokeWidth={2.5} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{description}</Text>
      </View>
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
                {num}x R$ {value.toFixed(2).replace('.', ',')}
            </Text>
            {installments === num && <Check size={16} color={theme.primary} />}
        </TouchableOpacity>
    )
  }

  // --- RENDER OFFER: VERSÃO COM RODAPÉ FIXO ---
  const renderOffer = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.mainLayout}>
        
        {/* 1. HEADER FIXO */}
        <View style={styles.fixedHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeIconHitbox}>
            <X size={20} color={theme.textSec} />
          </TouchableOpacity>
        </View>

        {/* 2. CONTEÚDO ROLÁVEL (HERO + BENEFÍCIOS) */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 380 // Espaço extra para o conteúdo não ficar atrás do footer
          }}
        >
            {/* HERO SECTION */}
            <View style={styles.heroContainer}>
              <View style={styles.tagContainer}>
                <Star size={12} color="#FFF" fill="#FFF" />
                <Text style={styles.tagText}>OFERTA POR TEMPO LIMITADO</Text>
              </View>
              <Text style={styles.heroTitle}>
                Sua Carreira no Mercado Financeiro <Text style={{ color: theme.primary }}>Começa agora.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Desbloqueie o método que já aprovou <Text style={{fontWeight: 'bold', color: theme.text}}>+1.000 profissionais</Text> e elimine o risco de reprovar.
              </Text>
            </View>

            {/* LISTA DE VANTAGENS */}
            <View style={styles.benefitsListContainer}>
              
              <BenefitRow 
                icon={Brain} title="Mentor IA Pessoal 24/7" 
                description="Tire dúvidas complexas na hora e receba explicações detalhadas."
              />
              <BenefitRow 
                icon={Target} title="Simulados Reais de Prova" 
                description="Banco de questões idênticas às da prova oficial."
              />
              <BenefitRow 
                icon={TrendingUp} title="Flashcards Inteligentes" 
                description="Metodologia de retenção que garante que você não esqueça o que estudou."
              />
              <BenefitRow 
                icon={BookOpen} title="Cases Práticos de Mercado" 
                description="Não decore apenas. Aprenda a aplicar o conhecimento no dia a dia."
              />
              <BenefitRow 
                icon={Trophy} title="Acesso Total Imediato" 
                description="Libere todas as certificações (CPA, C-Pro R, C-Pro I) em um único plano."
              />

            </View>
        </ScrollView>

        {/* 3. RODAPÉ FIXO (PLANOS + BOTÃO) */}
        <View style={styles.fixedBottomContainer}>
            <View style={styles.plansContainerCompact}>
              {/* PLANO ANUAL */}
              <TouchableOpacity 
                style={[styles.planCardOld, selectedPlan === 'yearly' && styles.planCardSelectedOld]} 
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.9}
              >
                <View style={styles.popularBadgeOld}>
                    <Text style={styles.popularTextOld}>MAIS VENDIDO</Text>
                </View>
                <View style={styles.planRowOld}>
                    <View style={{flex: 1}}>
                        <Text style={styles.planNameOldGreen}>Plano Anual</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                            <Text style={styles.savingsTextOld}>ECONOMIZE {DISCOUNT_PERCENTAGE}%</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                            <Text style={styles.currencyOld}>R$</Text>
                            <Text style={styles.bigPriceOld}>{MONTHLY_PRICE_ANUAL_EQUIVALENT.replace('.', ',')}</Text>
                            <Text style={styles.periodOld}>/mês</Text>
                        </View>
                        <Text style={styles.fullPriceTextOld}>R$ {PRICES.yearly.toFixed(2).replace('.', ',')} à vista</Text>
                    </View>
                </View>
              </TouchableOpacity>

              {/* PLANO MENSAL */}
              <TouchableOpacity 
                style={[styles.planCardOld, selectedPlan === 'monthly' && styles.planCardSelectedOldMonthly]} 
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.9}
              >
                <View style={styles.planRowOld}>
                    <View style={{flex: 1}}>
                        <Text style={styles.planNameOldBlack}>Plano Mensal</Text>
                        <Text style={styles.planNoteOld}>Sem fidelidade</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                            <Text style={styles.currencyOld}>R$</Text>
                            <Text style={styles.bigPriceOld}>{PRICES.monthly.toFixed(2).replace('.', ',')}</Text>
                            <Text style={styles.periodOld}>/mês</Text>
                        </View>
                    </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* BOTÃO CTA */}
            <View style={styles.footerCompact}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                    <TouchableOpacity style={styles.ctaButtonCompact} onPress={() => setStep('method')}>
                    <Text style={styles.ctaTextCompact}>COMEÇAR AGORA</Text>
                    </TouchableOpacity>
                </Animated.View>
                <View style={styles.guaranteeRowCompact}>
                    <ShieldCheck size={14} color={theme.textSec} />
                    <Text style={styles.guaranteeTextCompact}>Compra Segura • 7 Dias de Garantia</Text>
                </View>
            </View>
        </View>

      </View>
    </SafeAreaView>
  );

  const renderPaymentMethod = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => setStep('offer')} style={{padding: 8}}><ArrowLeft color={theme.text} size={20} /></TouchableOpacity>
        <Text style={styles.compactHeaderTitle}>Pagamento</Text>
        <View style={{width: 20}} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.inputLabel}>Escolha a forma de pagamento:</Text>
        
        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'pix' && styles.methodCardSelected]} onPress={() => setPaymentMethod('pix')}>
          <QrCode size={20} color={paymentMethod === 'pix' ? theme.primary : theme.textSec} />
          <Text style={[styles.methodTitle, paymentMethod === 'pix' && {color: theme.primary}]}>Pix (Imediato)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardSelected]} onPress={() => setPaymentMethod('card')}>
          <CreditCard size={20} color={paymentMethod === 'card' ? theme.primary : theme.textSec} />
          <Text style={[styles.methodTitle, paymentMethod === 'card' && {color: theme.primary}]}>Cartão de Crédito</Text>
        </TouchableOpacity>

        {paymentMethod === 'card' && selectedPlan === 'yearly' && (
            <View style={{marginTop: 12}}>
                <Text style={styles.inputLabel}>Parcelamento</Text>
                <TouchableOpacity style={styles.installmentSelector} onPress={() => setShowInstallmentPicker(!showInstallmentPicker)}>
                    <Text style={styles.installmentSelectorText}>
                        {installments}x de R$ {(PRICES.yearly / installments).toFixed(2).replace('.', ',')}
                    </Text>
                    <ChevronDown size={20} color={theme.textSec} />
                </TouchableOpacity>
                {showInstallmentPicker && (
                    <View style={styles.installmentDropdown}>
                        <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => <InstallmentOption key={num} num={num} />)}
                        </ScrollView>
                    </View>
                )}
            </View>
        )}

        <TouchableOpacity
          style={[styles.ctaButtonCompact, { marginTop: 24 }]}
          onPress={() => { if (paymentMethod === 'pix') setStep('cpf'); else handleCardCheckout(); }}
          disabled={loadingCard}
        >
          {loadingCard ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaTextCompact}>CONTINUAR</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderCpfInput = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => setStep('method')} style={{padding: 8}}><ArrowLeft color={theme.text} size={20} /></TouchableOpacity>
        <Text style={styles.compactHeaderTitle}>Dados Fiscais</Text>
        <View style={{width: 20}} />
      </View>
      <View style={{ padding: 20 }}>
        <Text style={styles.inputLabel}>Nome Completo</Text>
        <TextInput 
            style={styles.inputFieldCompact} placeholder="Seu nome" value={name} onChangeText={setName} 
        />
        <Text style={styles.inputLabel}>CPF (apenas números)</Text>
        <TextInput 
            style={styles.inputFieldCompact} placeholder="000.000.000-00" keyboardType="numeric" value={cpf} onChangeText={handleCpfChange} maxLength={14} 
        />
        <TouchableOpacity style={[styles.ctaButtonCompact, { marginTop: 24 }]} onPress={handleCreatePix} disabled={loadingPix}>
          {loadingPix ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaTextCompact}>GERAR PIX</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderPayment = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => setStep('cpf')} style={{padding: 8}}><ArrowLeft color={theme.text} size={20} /></TouchableOpacity>
        <Text style={styles.compactHeaderTitle}>Pagamento Pix</Text>
        <View style={{width: 20}} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <View style={styles.timerContainer}>
            <Clock size={14} color={theme.primary} />
            <Text style={styles.timerText}>Aguardando confirmação...</Text>
        </View>
        <View style={styles.qrCodeBoxCompact}>
          {pixData?.qrCodeBase64 ? (
            <Image source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }} style={{ width: 180, height: 180 }} resizeMode="contain" />
          ) : (
            <ActivityIndicator size="large" color={theme.primary} />
          )}
        </View>
        <View style={{width: '100%', marginBottom: 24}}>
            <Text style={{fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8}}>
                Pix Copia e Cola
            </Text>
            <TouchableOpacity 
                style={styles.ifoodPixContainer} 
                onPress={handleCopyPix}
                activeOpacity={0.7}
            >
                <Text style={styles.ifoodPixText} numberOfLines={1} ellipsizeMode="tail">
                    {pixData?.copyPaste || "Carregando código..."}
                </Text>
                <View style={styles.ifoodCopyButton}>
                    <Copy size={18} color={theme.primary} />
                </View>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  
  // --- LAYOUT ESTRUTURAL NOVO ---
  mainLayout: { flex: 1, position: 'relative' },
  
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-end',
    backgroundColor: theme.background,
    zIndex: 10,
  },

  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },

  // --- COMPONENTES ANTERIORES ---
  closeIconHitbox: { padding: 6, backgroundColor: '#EDF2F7', borderRadius: 16 },
  
  // --- HERO SECTION ---
  heroContainer: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.orange, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12, gap: 6 },
  tagText: { color: '#FFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: theme.darkBlue, textAlign: 'center', marginBottom: 8, lineHeight: 32 },
  heroSubtitle: { fontSize: 15, color: theme.textSec, textAlign: 'center', paddingHorizontal: 10, lineHeight: 22 },
  
  // --- BENEFITS LIST ---
  benefitsListContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  benefitIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  benefitDesc: { fontSize: 13, color: theme.textSec, lineHeight: 18 },

  // --- DIVIDER ---
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { fontSize: 12, fontWeight: '700', color: theme.textSec, marginHorizontal: 12, letterSpacing: 1 },

  // --- PLANOS (AJUSTADOS PARA O FOOTER) ---
  plansContainerCompact: { gap: 10, marginBottom: 16 },
  planCardOld: { 
    backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 12, 
    paddingHorizontal: 16, paddingVertical: 12, position: 'relative' 
  },
  planCardSelectedOld: { borderColor: theme.primary, backgroundColor: '#F0FDF4', borderWidth: 2 },
  planCardSelectedOldMonthly: { borderColor: theme.primary, backgroundColor: theme.cardBg, borderWidth: 2 },
  popularBadgeOld: { position: 'absolute', top: -10, left: 16, backgroundColor: theme.black, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, zIndex: 10 },
  popularTextOld: { color: theme.white, fontSize: 10, fontWeight: 'bold' },
  planRowOld: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planNameOldGreen: { fontSize: 16, fontWeight: 'bold', color: theme.primary }, 
  planNameOldBlack: { fontSize: 16, fontWeight: 'bold', color: theme.text }, 
  savingsTextOld: { fontSize: 11, fontWeight: 'bold', color: theme.primary, marginRight: 6 },
  oldPriceOld: { textDecorationLine: 'line-through', color: theme.textSec, fontSize: 12 },
  currencyOld: { fontSize: 14, fontWeight: '600', color: theme.text, marginRight: 2 },
  bigPriceOld: { fontSize: 26, fontWeight: '900', color: theme.text },
  periodOld: { fontSize: 13, color: theme.textSec, fontWeight: '400', marginLeft: 2 },
  fullPriceTextOld: { fontSize: 11, color: theme.textSec, marginTop: 2 },
  planNoteOld: { fontSize: 12, color: theme.textSec, marginTop: 2 },
  
  // --- FOOTER ELEMENTS ---
  footerCompact: { paddingVertical: 0, alignItems: 'center', gap: 12 },
  ctaButtonCompact: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  ctaTextCompact: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  guaranteeRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guaranteeTextCompact: { color: theme.textSec, fontSize: 12, fontWeight: '500' },

  // --- OUTROS ESTILOS (MANTIDOS) ---
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  compactHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  
  inputLabel: { color: theme.grayInput ,fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6, marginTop: 12 },
  inputFieldCompact: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 10, fontSize: 15 },
  
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 12, marginBottom: 8, gap: 12 },
  methodCardSelected: { borderColor: theme.primary, backgroundColor: '#F0FDF4' },
  methodTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  
  installmentSelector: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 10 },
  installmentSelectorText: { fontSize: 14 },
  installmentDropdown: { marginTop: 4, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 10, maxHeight: 150 },
  installmentOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  installmentOptionSelected: { backgroundColor: '#F0FDF4' },
  installmentText: { fontSize: 13 },

  timerContainer: { flexDirection: 'row', gap: 6, backgroundColor: theme.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  timerText: { fontSize: 12, color: theme.primary, fontWeight: 'bold' },
  qrCodeBoxCompact: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  ifoodPixContainer: { backgroundColor: theme.grayInput, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'transparent' },
  ifoodPixText: { fontSize: 14, color: theme.textSec, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginRight: 10 },
  ifoodCopyButton: { paddingLeft: 8 },
});
