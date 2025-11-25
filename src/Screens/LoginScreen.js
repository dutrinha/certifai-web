// src/screens/LoginScreen.jsx (Versão Refatorada FINAL)
import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity
} from 'react-native';
import LoginAuth from '../context/LoginAuth'; 

const cores = {
  primary: '#00C853',
  light: '#FFFFFF',
  secondary: '#1A202C',
  gray100: '#F1F5F9',
  gray300: '#CBD5E1',
  gray500: '#64748B',
  red500: '#EF4444',
}; //

export default function LoginScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <LoginAuth />

          {/* ☆ MUDANÇA ☆: Adicionamos o botão "Voltar" aqui */}
          <TouchableOpacity 
            style={styles.footerLinkContainer}
            onPress={() => navigation.goBack()} // <-- Ação de voltar
          >
            <Text style={styles.footerLinkText}>Voltar para o Início</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ☆ MUDANÇA ☆: Adicionamos os estilos de link copiados do LoginAuth.js
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.light }, //
  container: { flex: 1 }, //
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  }, //
  // Estilos para os links (igual ao LoginAuth.js e WelcomeScreen.js)
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
});