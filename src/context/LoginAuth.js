// src/components/LoginAuth.js (Componente Reutilizável)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../context/AuthContext'; 
import { Mail, Hash } from 'lucide-react-native';

const cores = {
  primary: '#00C853',
  light: '#FFFFFF',
  secondary: '#1A202C',
  gray100: '#F1F5F9',
  gray300: '#CBD5E1',
  gray500: '#64748B',
  red500: '#EF4444',
};

export default function LoginAuth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState('email');
  
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // (Todo o useEffect de cooldown é copiado 100% do LoginScreen)
  useEffect(() => {
    let timerId;
    if (isResendDisabled) {
      timerId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setIsResendDisabled(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isResendDisabled]); //

  // (Função handleSendCode copiada 100% do LoginScreen)
  const handleSendCode = async (isResending = false) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, 
        },
      }); //
      if (error) {
        throw error;
      }
      if (!isResending) {
        setStep('token'); 
      }
      setIsResendDisabled(true); 
    } catch (e) {
      console.error("Erro ao enviar código:", e);
      setErrorMessage('Erro ao enviar o código. Verifique o e-mail e tente novamente.');
    } finally {
      setLoading(false);
    }
  }; //

  // (Função handleVerifyCode copiada, com UMA adição)
  const handleVerifyCode = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email',
      }); //

      if (error) {
        throw error;
      }
      
      console.log("Sessão verificada:", data.session); //

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (e) {
      console.error("Erro ao verificar código:", e);
      setErrorMessage('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }; //

  const handleEmailChange = (text) => { setEmail(text); if (errorMessage) setErrorMessage(''); }; //
  const handleTokenChange = (text) => { setToken(text); if (errorMessage) setErrorMessage(''); }; //

  return (
    <>
      {step === 'email' && (
        <>
          <Text style={styles.title}>Seja Bem-vindo!</Text>
          <Text style={styles.subtitle}>Digite seu e-mail para entrar ou criar sua conta.</Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputErrorBorder : null]}>
            <Mail size={20} color={errorMessage ? cores.red500 : cores.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={cores.gray500}
              textContentType="emailAddress"
            />
          </View>
          {errorMessage ? (<Text style={styles.errorText}>{errorMessage}</Text>) : null}
          <TouchableOpacity
            style={[styles.button, styles.loginButton, (loading || !email) && styles.buttonDisabled]}
            onPress={() => handleSendCode(false)}
            disabled={loading || !email}>
            {loading ? (
              <ActivityIndicator color={cores.light} />
            ) : (
              <Text style={styles.buttonText}>Enviar código</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 'token' && (
        <>
          <Text style={styles.title}>Verifique seu E-mail</Text>
          <Text style={styles.subtitle}>
            Enviamos um código para <Text style={{fontWeight: 'bold'}}>{email}</Text>
          </Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputErrorBorder : null]}>
            <Hash size={20} color={errorMessage ? cores.red500 : cores.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código de 6 dígitos"
              value={token}
              onChangeText={handleTokenChange}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={cores.gray500}
            />
          </View>
          {errorMessage ? (<Text style={styles.errorText}>{errorMessage}</Text>) : null}
          <TouchableOpacity
            style={[styles.button, styles.loginButton, (loading || token.length < 6) && styles.buttonDisabled]}
            onPress={handleVerifyCode}
            disabled={loading || token.length < 6}>
            {loading ? (
              <ActivityIndicator color={cores.light} />
            ) : (
              <Text style={styles.buttonText}>Confirmar e Entrar</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.footerLinkContainer}
            onPress={() => handleSendCode(true)}
            disabled={isResendDisabled || loading} 
          >
            <Text style={[
              styles.footerLinkText, 
              (isResendDisabled || loading) && styles.disabledText
            ]}>
              {isResendDisabled 
                ? `Reenviar código em (${countdown}s)` 
                : 'Reenviar código'
              }
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
             style={styles.footerLinkContainer}
             onPress={() => { setStep('email'); setErrorMessage(''); }} 
             disabled={loading}
          >
          </TouchableOpacity>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 8 }, //
  subtitle: { fontSize: 16, color: cores.gray500, textAlign: 'center', marginBottom: 32 }, //
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: cores.gray100,
    borderRadius: 12, marginBottom: 16, paddingHorizontal: 12, borderWidth: 1,
    borderColor: cores.gray100,
  }, //
  inputErrorBorder: { borderColor: cores.red500, }, //
  inputIcon: { marginRight: 8 }, //
  input: { flex: 1, height: 50, fontSize: 16, color: cores.secondary }, //
  errorText: {
    color: cores.red500,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  }, //
  
  // ☆ MUDANÇA ☆: Adicionei width: '100%' aqui
  button: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row',
    width: '100%', // <-- ADICIONADO
  }, //
  
  // ☆ MUDANÇA ☆: Adicionei width: '100%' aqui
  loginButton: { 
    backgroundColor: cores.primary, 
    marginTop: 4,
    width: '100%', // <-- ADICIONADO
  }, //
  
  buttonDisabled: { opacity: 0.5, }, //
  buttonText: { color: cores.light, fontSize: 16, fontWeight: 'bold' }, //
  
  // (Estilos dos links que corrigimos no passo anterior)
  footerLinkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerLinkText: {
    color: cores.gray500, 
    fontSize: 16, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  disabledText: {
    color: cores.gray300,
  }, //
});