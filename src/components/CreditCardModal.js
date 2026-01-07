import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { X, Lock, CreditCard, Check, User, MapPin, Smartphone, Calendar, Hash } from 'lucide-react-native';
import { useAuth, supabase } from '../context/AuthContext';

const theme = {
  background: '#F7FAFC', cardBg: '#FFFFFF', primary: '#00C853',
  text: '#1A202C', textSec: '#64748B', border: '#E2E8F0',
  red: '#EA1D2C', darkBlue: '#0F172A', placeholder: '#A0AEC0', 
  inputBg: '#F8FAFC'
};

// --- COMPONENTE DE INPUT (DEFINIDO FORA PARA EVITAR PERDA DE FOCO) ---
const InputItem = ({ label, icon: Icon, value, onChangeText, placeholder, keyboardType, maxLength, secureTextEntry, style, half, isFocused, onFocus, onBlur }) => (
  <View style={[styles.inputContainer, half && { flex: 1 }, isFocused && styles.inputFocused, style]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputRow}>
      {Icon && <Icon size={18} color={isFocused ? theme.primary : theme.textSec} style={{marginRight: 8}} />}
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize={label.includes('Nome') ? 'characters' : 'none'}
      />
    </View>
  </View>
);

export default function CreditCardModal({ visible, onClose, onSuccess, plan, installments }) {
  const { user, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Dados
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  
  // Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState(''); 

  useEffect(() => {
    if (visible) {
      if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
      setSuccess(false);
      setErrorMessage('');
    }
  }, [visible, user]);

  // Formatadores
  const formatCPF = (t) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
  const formatPhone = (t) => t.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
  const formatCEP = (t) => t.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  const formatExpiry = (t) => t.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5);
  const formatCardNumber = (t) => t.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);

  const handleCheckout = async () => {
    setErrorMessage('');
    const cpfClean = cpf.replace(/\D/g, '');
    
    // Validações
    if (cpfClean.length !== 11) return setErrorMessage("CPF inválido.");
    if (cardNumber.length < 15) return setErrorMessage("Número do cartão incompleto.");
    if (cardExpiry.length !== 5) return setErrorMessage("Validade inválida.");
    if (cardCvv.length < 3) return setErrorMessage("CVV inválido.");
    if (!postalCode || !addressNumber || !phone) return setErrorMessage("Preencha endereço e telefone.");

    setLoading(true);
    try {
      const [expMonth, expYearShort] = cardExpiry.split('/');
      const expYear = `20${expYearShort}`;

      const payload = {
        userId: user.id, email: user.email, name: name.trim() || user.user_metadata?.full_name,
        cpf: cpfClean, phone: phone.replace(/\D/g, ''), postalCode: postalCode.replace(/\D/g, ''),
        addressNumber: addressNumber, cycle: plan, method: 'credit_card',
        installments: plan === 'semiannual' ? installments : 1,
        creditCard: {
            holderName: cardName.toUpperCase(), number: cardNumber.replace(/\D/g, ''),
            expiryMonth: expMonth, expiryYear: expYear, ccv: cardCvv
        }
      };

      // MUDAR PARA 'create-pix-charge' EM PRODUÇÃO
      const { data, error } = await supabase.functions.invoke('create-pix-charge', { body: payload });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLoading(false);
      setSuccess(true);
      if (refreshSubscription) await refreshSubscription();

      setTimeout(() => { if (onSuccess) onSuccess(); else onClose(); }, 2000);

    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || 'Pagamento não autorizado.');
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dados do Pagamento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={20} color={theme.textSec} /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            <View style={styles.secureBadge}>
                <Lock size={12} color={theme.textSec} />
                <Text style={styles.secureText}>Ambiente criptografado e seguro</Text>
            </View>

            {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}

            <Text style={styles.sectionHeader}>Cartão de Crédito</Text>
            <InputItem 
                label="Número do Cartão" icon={CreditCard} placeholder="0000 0000 0000 0000" 
                value={cardNumber} onChangeText={t => setCardNumber(formatCardNumber(t))} keyboardType="numeric" maxLength={19} 
                isFocused={focusedField === 'cardNumber'} onFocus={() => setFocusedField('cardNumber')} onBlur={() => setFocusedField(null)}
            />
            <InputItem 
                label="Nome no Cartão" icon={User} placeholder="COMO ESTÁ NO CARTÃO" 
                value={cardName} onChangeText={setCardName} 
                isFocused={focusedField === 'cardName'} onFocus={() => setFocusedField('cardName')} onBlur={() => setFocusedField(null)}
            />
            
            <View style={styles.row}>
                <InputItem 
                    label="Validade" icon={Calendar} placeholder="MM/AA" 
                    value={cardExpiry} onChangeText={t => setCardExpiry(formatExpiry(t))} keyboardType="numeric" maxLength={5} half style={{marginRight: 12}} 
                    isFocused={focusedField === 'cardExpiry'} onFocus={() => setFocusedField('cardExpiry')} onBlur={() => setFocusedField(null)}
                />
                <InputItem 
                    label="CVV" icon={Hash} placeholder="123" 
                    value={cardCvv} onChangeText={setCardCvv} keyboardType="numeric" maxLength={4} secureTextEntry half 
                    isFocused={focusedField === 'cardCvv'} onFocus={() => setFocusedField('cardCvv')} onBlur={() => setFocusedField(null)}
                />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Titular do Cartão</Text>
            <View style={styles.row}>
                <InputItem 
                    label="CPF" icon={User} placeholder="000.000.000-00" 
                    value={cpf} onChangeText={t => setCpf(formatCPF(t))} keyboardType="numeric" maxLength={14} half style={{marginRight: 12}} 
                    isFocused={focusedField === 'cpf'} onFocus={() => setFocusedField('cpf')} onBlur={() => setFocusedField(null)}
                />
                <InputItem 
                    label="Celular" icon={Smartphone} placeholder="(00) 00000-0000" 
                    value={phone} onChangeText={t => setPhone(formatPhone(t))} keyboardType="phone-pad" maxLength={15} half 
                    isFocused={focusedField === 'phone'} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                />
            </View>
            <View style={styles.row}>
                <InputItem 
                    label="CEP" icon={MapPin} placeholder="00000-000" 
                    value={postalCode} onChangeText={t => setPostalCode(formatCEP(t))} keyboardType="numeric" maxLength={9} half style={{marginRight: 12}} 
                    isFocused={focusedField === 'postalCode'} onFocus={() => setFocusedField('postalCode')} onBlur={() => setFocusedField(null)}
                />
                <InputItem 
                    label="Número" icon={MapPin} placeholder="123" 
                    value={addressNumber} onChangeText={setAddressNumber} keyboardType="numeric" half 
                    isFocused={focusedField === 'addressNumber'} onFocus={() => setFocusedField('addressNumber')} onBlur={() => setFocusedField(null)}
                />
            </View>

            <TouchableOpacity 
                style={[styles.payButton, success && styles.payButtonSuccess]} 
                onPress={handleCheckout} 
                disabled={loading || success}
                activeOpacity={0.9}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : success ? (
                    <View style={styles.btnContent}>
                        <View style={styles.checkCircle}><Check size={18} color={theme.primary} strokeWidth={3} /></View>
                        <Text style={styles.payButtonText}>PAGAMENTO APROVADO</Text>
                    </View>
                ) : (
                    <Text style={styles.payButtonText}>PAGAR AGORA</Text>
                )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.cardBg },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.darkBlue },
  closeBtn: { padding: 4, backgroundColor: theme.background, borderRadius: 20 },
  
  secureBadge: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 8, borderRadius: 6, marginBottom: 20, gap: 6, alignSelf: 'center' },
  secureText: { color: theme.textSec, fontSize: 12, fontWeight: '500' },

  sectionHeader: { fontSize: 14, fontWeight: '700', color: theme.darkBlue, marginBottom: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 20 },

  inputContainer: { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  inputFocused: { borderColor: theme.primary, backgroundColor: '#FFF' },
  inputLabel: { fontSize: 11, color: theme.textSec, fontWeight: '600', marginBottom: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInput: { 
    flex: 1, 
    fontSize: 15, 
    color: theme.text, 
    padding: 0, 
    height: 24,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  },

  payButton: { backgroundColor: theme.primary, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: theme.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payButtonSuccess: { backgroundColor: theme.darkBlue },
  payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

  errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: theme.red, fontSize: 13, textAlign: 'center', fontWeight: '500' }
});
