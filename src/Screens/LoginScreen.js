// src/Screens/LoginScreen.js
import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
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
};

// Largura máxima para manter consistência com o Onboarding no Desktop
const CONTENT_MAX_WIDTH = 500;

export default function LoginScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Container Responsivo que limita a largura */}
          <View style={styles.responsiveContainer}>
            
            <LoginAuth />

            <TouchableOpacity 
              style={styles.footerLinkContainer}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.footerLinkText}>Voltar para o Início</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: cores.light 
  },
  container: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center', // Centraliza o bloco na tela (Desktop)
    paddingVertical: 30,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH, // Limita largura máxima
    paddingHorizontal: 24,       // Espaçamento lateral interno
    alignSelf: 'center',         // Garante centralização
    justifyContent: 'center',
  },
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
