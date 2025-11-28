// src/components/PaywallModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, AppState, Image, Alert, TextInput, Dimensions, StatusBar, Animated
} from 'react-native';
import { 
  X, Check, Star, ArrowLeft, ShieldCheck, Trophy, Lock, 
  CreditCard, QrCode, ChevronDown, Copy, Clock, Zap
} from 'lucide-react-native';
import { useAuth, supabase } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');
const CONTENT_MAX_WIDTH = 500;

const theme = {
  background: '#F7FAFC', cardBg: '#FFFFFF', primary: '#00C853',
  primaryLight: '#E6F8EB', text: '#1A202C', textSec: '#64748B',
  border: '#E2E8F0', shadow: 'rgba(0, 0, 0, 0.08)', red: '#EA1D2C', // Vermelho iFood
  gold: '#FFD700', orange: '#FF6B00', darkBlue: '#0F172A'
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

  // Animação de pulsação para o botão
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const PRICES = { monthly: 29.90, yearly: 197.00 }; 
  const DAILY_PRICE_YEARLY = (PRICES.yearly / 365).toFixed(2);
  const MONTHLY_PRICE_ANUAL_EQUIVALENT = (PRICES.yearly / 12).toFixed(2);
  const DISCOUNT_PERCENTAGE = Math.round(((PRICES.monthly * 12 - PRICES.yearly) / (PRICES.monthly * 12)) * 100);

  useEffect(() => {
    if (visible) {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
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
          installments: selectedPlan === 'yearly' ? installments : 1,
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
      Alert.alert("CPF Inválido", "Por favor, digite um CPF válido para a nota fiscal.");
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
          method: 'pix', 
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
      if (Platform.OS === 'web') {
        window.alert('Código Pix copiado!');
      } else {
        Alert.alert('Sucesso', 'Código Pix copiado para a área de transferência.');
      }
    }
  };

  const FeatureRow = ({ text, bold }) => (
    <View style={styles.featureRow}>
      <View style={styles.checkCircle}><Check size={12} color="#FFF" strokeWidth={4} /></View>
      <Text style={styles.featureText}>
        {bold ? <Text style={{fontWeight: 'bold'}}>{bold} </Text> : null}
        {text}
      </Text>
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

  // --- TELA 1: OFERTA IRRESISTÍVEL ---
  const renderOffer = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeIconHitbox}>
          <X size={24} color={theme.textSec} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADLINE DE ALTO IMPACTO */}
        <View style={styles.heroContainer}>
          <View style={styles.tagContainer}>
            <Star size={14} color="#FFF" fill="#FFF" />
            <Text style={styles.tagText}>OFERTA POR TEMPO LIMITADO</Text>
          </View>
          <Text style={styles.heroTitle}>
            Sua Carreira no Mercado Financeiro <Text style={{ color: theme.primary }}>Começa Agora.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Junte-se a <Text style={{fontWeight: 'bold', color: theme.text}}>+1.000 alunos aprovados</Text> e pare de perder tempo estudando errado.
          </Text>
        </View>

        {/* BENEFÍCIOS CLAROS */}
        <View style={styles.featuresList}>
          <FeatureRow bold="Professor IA 24/7:" text="Tire dúvidas na hora, sem esperar." />
          <FeatureRow bold="Correção Inteligente:" text="Entenda exatamente onde você errou." />
          <FeatureRow bold="Simulados Ilimitados:" text="Treine até se sentir 100% seguro." />
          <FeatureRow bold="Todas as Certificações:" text="CPA, C-PRO R, C-PRO I e mais." />
        </View>

        {/* SELETOR DE PLANOS (ANCORAGEM) */}
        <View style={styles.planSelector}>
          {/* PLANO ANUAL (HERÓI) */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]} 
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.9}
          >
            {selectedPlan === 'yearly' && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MAIS VENDIDO 🔥</Text>
                </View>
            )}
            <View style={styles.planHeaderRow}>
              <View>
                <Text style={[styles.planName, selectedPlan === 'yearly' && { color: theme.primary }]}>Plano Anual</Text>
                <Text style={styles.planBestValue}>Menos de R$ {DAILY_PRICE_YEARLY}/dia</Text>
              </View>
              {selectedPlan === 'yearly' ? (
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
            </View>
            
            <View style={styles.pricingContainer}>
                <Text style={styles.oldPrice}>R$ {(PRICES.monthly * 12).toFixed(2)}</Text>
                <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 4}}>
                    <Text style={styles.currency}>R$</Text>
                    <Text style={styles.bigPrice}>{MONTHLY_PRICE_ANUAL_EQUIVALENT.replace('.', ',')}</Text>
                    <Text style={styles.period}>/mês</Text>
                </View>
            </View>
            
            <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>ECONOMIA DE {DISCOUNT_PERCENTAGE}% HOJE</Text>
            </View>
          </TouchableOpacity>

          {/* PLANO MENSAL (ÂNCORA) */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]} 
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.9}
          >
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, selectedPlan === 'monthly' && { color: theme.text }]}>Plano Mensal</Text>
              {selectedPlan === 'monthly' ? (
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
            </View>
            <Text style={styles.planPriceSimple}>R$ {PRICES.monthly.toFixed(2).replace('.', ',')} /mês</Text>
            <Text style={styles.planNote}>Sem fidelidade. Cancele quando quiser.</Text>
          </TouchableOpacity>
        </View>

        {/* CTA ANIMADO */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.ctaButton} onPress={() => setStep('method')}>
            <Text style={styles.ctaText}>QUERO SER APROVADO AGORA</Text>
            <Zap size={20} color="#FFF" fill="#FFF" style={{marginLeft: 8}} />
            </TouchableOpacity>
        </Animated.View>

        <View style={styles.guaranteeContainer}>
            <ShieldCheck size={16} color={theme.textSec} />
            <Text style={styles.guaranteeText}>Compra Segura • Acesso Imediato</Text>
        </View>

      </ScrollView>
    </View>
  );

  // --- TELA 2: DADOS (CPF) ---
  const renderCpfInput = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('method')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Dados para Nota Fiscal</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.centerContent}>
        <View style={styles.progressSteps}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <View style={[styles.stepDot, styles.stepActive]} />
            <View style={styles.stepDot} />
        </View>
        
        <Text style={styles.inputTitle}>Para quem vamos emitir a nota?</Text>
        <Text style={styles.inputSubtitle}>Precisamos apenas do seu nome e CPF para liberar seu acesso.</Text>

        <Text style={styles.inputLabel}>Nome Completo</Text>
        <TextInput 
            style={styles.inputField} 
            placeholder="Seu nome" 
            placeholderTextColor={theme.textSec} 
            value={name} 
            onChangeText={setName} 
            autoCapitalize="words"
        />
        
        <Text style={styles.inputLabel}>CPF</Text>
        <TextInput 
            style={styles.inputField} 
            placeholder="000.000.000-00" 
            placeholderTextColor={theme.textSec} 
            keyboardType="numeric" 
            value={cpf} 
            onChangeText={handleCpfChange} 
            maxLength={14} 
        />
        
        <TouchableOpacity style={[styles.ctaButton, { marginTop: 24 }]} onPress={handleCreatePix} disabled={loadingPix}>
          {loadingPix ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>GERAR CÓDIGO PIX</Text>}
        </TouchableOpacity>
        
        <View style={styles.secureBadge}>
            <Lock size={12} color={theme.primary} />
            <Text style={styles.secureText}>Seus dados estão protegidos.</Text>
        </View>
      </View>
    </View>
  );

  // --- TELA 3: PAGAMENTO (PIX COPIA E COLA - ESTILO IFOOD) ---
  const renderPayment = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('cpf')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Pagamento via Pix</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.centerContent}>
        <View style={styles.timerContainer}>
            <Clock size={16} color={theme.orange} />
            <Text style={styles.timerText}>Aguardando pagamento...</Text>
        </View>

        <Text style={styles.paymentInstructions}>
            Escaneie o QR Code ou use o <Text style={{fontWeight: 'bold'}}>Pix Copia e Cola</Text> abaixo para liberar seu acesso imediatamente.
        </Text>
        
        {/* QR CODE BOX */}
        <View style={styles.qrCodeBox}>
          {pixData?.qrCodeBase64 ? (
            <Image source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }} style={{ width: 220, height: 220 }} resizeMode="contain" />
          ) : (
            <ActivityIndicator size="large" color={theme.primary} />
          )}
        </View>

        {/* PIX COPIA E COLA ESTILO IFOOD */}
        <View style={styles.copyPasteContainer}>
            <View style={styles.copyPasteTextContainer}>
                <Text style={styles.copyPasteLabel}>Pix Copia e Cola</Text>
                <Text style={styles.copyPasteCode} numberOfLines={1} ellipsizeMode="middle">
                    {pixData?.copyPaste || "Carregando código..."}
                </Text>
            </View>
            <TouchableOpacity style={styles.copyPasteButton} onPress={handleCopyPix}>
                <Copy size={20} color="#FFF" />
                <Text style={styles.copyPasteButtonText}>Copiar</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Como pagar?</Text>
            <Text style={styles.infoText}>1. Abra o app do seu banco.</Text>
            <Text style={styles.infoText}>2. Escolha pagar via Pix.</Text>
            <Text style={styles.infoText}>3. Cole o código acima ou escaneie o QR Code.</Text>
        </View>
      </ScrollView>
    </View>
  );

  // --- TELA DE FORMA DE PAGAMENTO (REUTILIZADA) ---
  const renderPaymentMethod = () => (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => setStep('offer')} style={styles.backButton}><ArrowLeft color={theme.text} size={24} /></TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <Text style={styles.sectionTitle}>Como você prefere pagar?</Text>
        
        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'pix' && styles.methodCardSelected]} onPress={() => setPaymentMethod('pix')}>
          <View style={styles.methodIconContainer}><QrCode size={24} color={paymentMethod === 'pix' ? theme.primary : theme.textSec} /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.methodTitle, paymentMethod === 'pix' && {color: theme.primary}]}>Pix (Liberação Imediata)</Text>
            <Text style={styles.methodSubtitle}>Aprovação em segundos</Text>
          </View>
          {paymentMethod === 'pix' && <View style={styles.radioSelected}><View style={styles.radioInner} /></View>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardSelected]} onPress={() => setPaymentMethod('card')}>
          <View style={styles.methodIconContainer}><CreditCard size={24} color={paymentMethod === 'card' ? theme.primary : theme.textSec} /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.methodTitle, paymentMethod === 'card' && {color: theme.primary}]}>Cartão de Crédito</Text>
            <Text style={styles.methodSubtitle}>Até 12x no plano anual</Text>
          </View>
          {paymentMethod === 'card' && <View style={styles.radioSelected}><View style={styles.radioInner} /></View>}
        </TouchableOpacity>

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
          {loadingCard ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>CONTINUAR PARA DADOS</Text>}
        </TouchableOpacity>
        
        <View style={styles.secureHintContainer}>
          <Lock size={14} color={theme.textSec} />
          <Text style={styles.guaranteeText}>Ambiente criptografado e seguro</Text>
        </View>
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
  closeIconHitbox: { padding: 8, backgroundColor: '#EDF2F7', borderRadius: 20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  heroContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, gap: 6 },
  tagText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: theme.darkBlue, textAlign: 'center', marginBottom: 10, lineHeight: 32 },
  heroSubtitle: { fontSize: 16, color: theme.textSec, textAlign: 'center', paddingHorizontal: 10, lineHeight: 22 },
  
  featuresList: { marginBottom: 30, gap: 12, backgroundColor: theme.cardBg, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 15, color: theme.text, flex: 1 },
  
  planSelector: { gap: 16, marginBottom: 24 },
  planCard: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 20, position: 'relative' },
  planCardSelected: { borderColor: theme.primary, backgroundColor: '#F0FDF4', borderWidth: 2, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  popularBadge: { position: 'absolute', top: -12, right: 16, backgroundColor: theme.darkBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, zIndex: 10 },
  popularText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
  
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  planName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  planBestValue: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  
  pricingContainer: { marginTop: 4 },
  oldPrice: { textDecorationLine: 'line-through', color: theme.textSec, fontSize: 14, marginBottom: -4 },
  currency: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  bigPrice: { fontSize: 32, fontWeight: '900', color: theme.text },
  period: { fontSize: 16, color: theme.textSec, marginBottom: 4 },
  
  savingsBadge: { alignSelf: 'flex-start', backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 12 },
  savingsText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  
  planPriceSimple: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 4 },
  planNote: { fontSize: 13, color: theme.textSec, marginTop: 4 },
  
  radioUnselected: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border },
  radioSelected: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary },
  
  ctaButton: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  
  guaranteeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  guaranteeText: { color: theme.textSec, fontSize: 13, fontWeight: '500' },
  
  // Headers Internos
  simpleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border },
  simpleHeaderTitle: { color: theme.text, fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 8 },
  
  centerContent: { padding: 24, flexGrow: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 24, textAlign: 'center' },
  
  // Metodos de Pagamento
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12, gap: 16 },
  methodCardSelected: { borderColor: theme.primary, backgroundColor: '#F0FDF4', borderWidth: 2 },
  methodIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  methodSubtitle: { fontSize: 13, color: theme.textSec, marginTop: 2 },
  
  // Inputs
  progressSteps: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
  stepActive: { backgroundColor: theme.primary, width: 24 },
  
  inputTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  inputSubtitle: { fontSize: 15, color: theme.textSec, marginBottom: 24 },
  inputLabel: { color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputField: { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, color: theme.text, padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16 },
  
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8 },
  secureText: { fontSize: 12, color: theme.primary, fontWeight: '600' },
  
  // Pix Pagamento (Estilo iFood)
  timerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB', padding: 8, borderRadius: 8, gap: 6, marginBottom: 20, alignSelf: 'center' },
  timerText: { color: theme.orange, fontWeight: 'bold', fontSize: 13 },
  paymentInstructions: { color: theme.text, textAlign: 'center', fontSize: 16, marginBottom: 24, lineHeight: 22 },
  
  qrCodeBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24, alignSelf: 'center', shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  
  // Copia e Cola Estilo iFood
  copyPasteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 4, // Padding interno pequeno
    marginBottom: 24,
  },
  copyPasteTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyPasteLabel: {
    fontSize: 12,
    color: theme.textSec,
    marginBottom: 2,
  },
  copyPasteCode: {
    fontSize: 14,
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Fonte monoespaçada para código
  },
  copyPasteButton: {
    backgroundColor: theme.primary, // Vermelho iFood
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  copyPasteButtonText: {
    color: 'primary',
    fontWeight: 'bold',
    fontSize: 14,
  },

  infoBox: { backgroundColor: theme.background, padding: 16, borderRadius: 12 },
  infoTitle: { fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  infoText: { color: theme.textSec, fontSize: 13, marginBottom: 4 },

  // Installment Styles
  installmentContainer: { width: '100%', marginTop: 12, marginBottom: 12 },
  installmentSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 16 },
  installmentSelectorText: { fontSize: 16, color: theme.text, fontWeight: '500' },
  installmentDropdown: { marginTop: 8, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 12, maxHeight: 200, overflow: 'hidden' },
  installmentOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  installmentOptionSelected: { backgroundColor: '#F0FDF4' },
  installmentText: { fontSize: 15, color: theme.text },
  
  secureHintContainer: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
});
