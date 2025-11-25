import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions, // Importar useWindowDimensions
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const placeholderImages = {
  image1: require('../assets/1.png'),
  image2: require('../assets/2.png'),
  image3: require('../assets/3.png'),
  image4: require('../assets/4.png'),
  image5: require('../assets/5.png'),
};

// Paleta de cores EXATAMENTE IGUAL ao Onboarding
const cores = {
  primary: '#00C853',
  light: '#FFFFFF',
  secondary: '#1A202C',
  gray100: '#F1F5F9',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  primaryLight: '#E6F8EB',
};

// Dados para o carrossel, agora com a referência das imagens
const carouselData = [
  {
    id: '1',
    image: placeholderImages.image1, // Tela inicial
    title: 'Todas as Certificações',
    description: 'Acesse material completo e personalizado para as principais certificações.'
  },
  {
    id: '2',
    image: placeholderImages.image2, // Questão Interativa
    title: 'Questões Interativas',
    description: 'Teste seu conhecimento com milhares de questões práticas e interativas.'
  },
  {
    id: '3',
    image: placeholderImages.image3, // Revisão Case Prático
    title: 'Cases Dissertativos',
    description: 'Treine com casos reais e aprimore sua escrita e capacidade analítica.'
  },
  {
    id: '4',
    image: placeholderImages.image4, // Duas telas (pode representar flashcards ou visão geral)
    title: 'Flashcards Inteligentes',
    description: 'Memorize conceitos-chave de forma rápida e eficaz com nosso sistema inteligente.'
  },
  {
    id: '5',
    image: placeholderImages.image5, // Questão Interativa (ângulo diferente)
    title: 'Questões de Prova',
    description: 'Enfrente questões no formato da prova para se preparar de verdade.'
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions(); // USANDO O HOOK

  const handleStartOnboarding = () => {
    navigation.navigate('OnboardingFlow');
  };

  const handleLogin = () => {
    navigation.navigate('Auth');
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / windowWidth);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Bem-vindo(a) ao CertifAI</Text>

        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.scrollViewStyle}
          >
            {carouselData.map((item) => (
              <View key={item.id} style={[styles.carouselSlide, { width: windowWidth }]}>
                {/* Aqui usamos o componente Image com a source da imagem */}
                <Image
                  source={item.image}
                  style={styles.slideImage}
                  resizeMode="contain" // ou "cover", dependendo de como quer que a imagem se ajuste
                />
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {carouselData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartOnboarding}
        >
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>
        <Text onPress={handleLogin} style={styles.buttonSecondaryText}>Já tenho uma conta</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cores.light,
  },
  container: {
    flex: 1,
    backgroundColor: cores.light,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: cores.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    marginBottom: 20,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollViewStyle: {
    //
  },
  carouselSlide: {
    // width: windowWidth, // REMOVIDO DAQUI, PASSADO INLINE
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  // NOVO ESTILO PARA AS IMAGENS DO SLIDE
  slideImage: {
    width: '90%', // Ajusta a largura para caber no slide
    height: 400, // Altura fixa, pode ajustar conforme necessário
    borderRadius: 12, // Borda arredondada como nas suas imagens
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cores.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 16,
    color: cores.gray500,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: cores.gray200,
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: cores.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: cores.light,
    borderTopWidth: 1,
    borderTopColor: cores.gray100,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: cores.primary,
    width: '100%',
  },
  buttonSecondaryText: {
    marginTop: 12,
    color: cores.gray500,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  buttonText: {
    color: cores.light,
    fontSize: 16,
    fontWeight: 'bold',
  },
});