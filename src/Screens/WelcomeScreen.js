// src/Screens/WelcomeScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const placeholderImages = {
  // Estas imagens estão em src/assets, então ../assets/ está correto
  image1: require('../assets/1.png'),
  image2: require('../assets/2.png'),
  image3: require('../assets/3.png'),
  image4: require('../assets/4.png'),
  image5: require('../assets/5.png'),
};

const cores = {
  primary: '#00C853',
  light: '#FFFFFF',
  secondary: '#1A202C',
  gray100: '#F1F5F9',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  primaryLight: '#E6F8EB',
};

const carouselData = [
  {
    id: '1',
    image: placeholderImages.image1,
    title: 'Todas as Certificações',
    description: 'Acesse material completo e personalizado para as principais certificações.'
  },
  {
    id: '2',
    image: placeholderImages.image2,
    title: 'Questões Interativas',
    description: 'Teste seu conhecimento com milhares de questões práticas e interativas.'
  },
  {
    id: '3',
    image: placeholderImages.image3,
    title: 'Cases Dissertativos',
    description: 'Treine com casos reais e aprimore sua escrita e capacidade analítica.'
  },
  {
    id: '4',
    image: placeholderImages.image4,
    title: 'Flashcards Inteligentes',
    description: 'Memorize conceitos-chave de forma rápida e eficaz com nosso sistema inteligente.'
  },
  {
    id: '5',
    image: placeholderImages.image5,
    title: 'Questões de Prova',
    description: 'Enfrente questões no formato da prova para se preparar de verdade.'
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Desktop check: Web platform and width > 768px
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  // --- RESPONSIVE VARIABLES ---
  const isSmallDesktop = windowWidth < 1200;
  
  const titleFontSize = isSmallDesktop ? 42 : 64;
  const titleLineHeight = isSmallDesktop ? 48 : 72;
  const paddingHorizontal = isSmallDesktop ? 32 : 64;
  const desktopCarouselWidth = Math.max(300, Math.min(500, windowWidth * 0.40));

  const handleStartOnboarding = () => {
    navigation.navigate('OnboardingFlow');
  };

  const handleLogin = () => {
    navigation.navigate('Auth');
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const slideWidth = isDesktop ? desktopCarouselWidth : windowWidth;
    const index = Math.round(scrollPosition / slideWidth);
    setActiveIndex(index);
  };

  const scrollToIndex = (index) => {
    if (index >= 0 && index < carouselData.length) {
      const slideWidth = isDesktop ? desktopCarouselWidth : windowWidth;
      scrollViewRef.current?.scrollTo({ x: index * slideWidth, animated: true });
      setActiveIndex(index);
    }
  };

  const handleNext = () => scrollToIndex(activeIndex + 1);
  const handlePrev = () => scrollToIndex(activeIndex - 1);

  // --- DESKTOP LAYOUT ---
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.light }}>
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            minHeight: '100%', 
            justifyContent: 'space-between' 
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Navbar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: paddingHorizontal, paddingVertical: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* CORREÇÃO AQUI: ../../assets/favicon.png */}
              <Image source={require('../../assets/favicon.png')} style={{ width: 40, height: 40, marginRight: 12 }} resizeMode="contain" />
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: cores.secondary }}>CertifAI</Text>
            </View>
            <TouchableOpacity onPress={handleLogin} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: cores.secondary, fontWeight: '600', fontSize: 16 }}>Entrar</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={{ 
            flexDirection: 'row', 
            paddingHorizontal: paddingHorizontal, 
            alignItems: 'center', 
            flexWrap: 'wrap-reverse', 
            gap: 40,
            paddingBottom: 60,
          }}>
            <View style={{ flex: 1, minWidth: 350 }}>
              <View style={{ backgroundColor: cores.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, marginBottom: 24 }}>
                <Text style={{ color: cores.primary, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 }}>APROVADO POR +1.000 ALUNOS</Text>
              </View>

              <Text style={{ fontSize: titleFontSize, fontWeight: '800', color: cores.secondary, lineHeight: titleLineHeight, marginBottom: 24, letterSpacing: -1 }}>
                Sua certificação financeira <Text style={{ color: cores.primary }}>garantida.</Text>
              </Text>

              <Text style={{ fontSize: isSmallDesktop ? 16 : 20, color: cores.gray500, marginBottom: 40, lineHeight: 28, maxWidth: 550 }}>
                A plataforma mais completa para CPA, C-PRO R, C-PRO I e muito mais. Estude com inteligência artificial e passe de primeira.
              </Text>

              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.button, { width: 'auto', paddingHorizontal: 40, height: 56 }]}
                  onPress={handleStartOnboarding}
                >
                  <Text style={[styles.buttonText, { fontSize: 18 }]}>Começar Agora</Text>
                </TouchableOpacity>
                <Text style={{ color: cores.gray500, fontSize: 14, marginLeft: 8 }}>
                  Comece gratuitamente.
                </Text>
              </View>
            </View>

            {/* Right Column: Carousel */}
            <View style={{ flex: 1, minWidth: 350, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 }}>
                <TouchableOpacity onPress={handlePrev} disabled={activeIndex === 0} style={[styles.desktopNavBtn, activeIndex === 0 && { opacity: 0.3 }]}>
                  <ChevronLeft size={24} color={cores.secondary} />
                </TouchableOpacity>

                <View style={{ width: desktopCarouselWidth, alignItems: 'center' }}>
                  <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    style={{ width: desktopCarouselWidth }}
                  >
                    {carouselData.map((item) => (
                      <View key={item.id} style={{ width: desktopCarouselWidth, alignItems: 'center', padding: 10 }}>
                        <Image
                          source={item.image}
                          style={{ 
                            width: '100%', 
                            height: desktopCarouselWidth * 1.5, 
                            maxHeight: 500,
                            borderRadius: 24, 
                            marginBottom: 24 
                          }}
                          resizeMode="contain"
                        />
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 8 }}>{item.title}</Text>
                        <Text style={{ fontSize: 16, color: cores.gray500, textAlign: 'center', lineHeight: 24 }}>{item.description}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    {carouselData.map((_, index) => (
                      <View key={index} style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]} />
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={handleNext} disabled={activeIndex === carouselData.length - 1} style={[styles.desktopNavBtn, activeIndex === carouselData.length - 1 && { opacity: 0.3 }]}>
                  <ChevronRight size={24} color={cores.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={{ padding: 32, borderTopWidth: 1, borderTopColor: cores.gray100, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <View>
              <Text style={{ color: cores.gray500, fontSize: 12 }}>Certifai Tecnologia LTDA</Text>
              <Text style={{ color: cores.gray500, fontSize: 12 }}>CNPJ: 63.594.251/0001-61</Text>
            </View>
            <Text style={{ color: cores.gray500, fontSize: 12 }}>contato@certifai.com.br</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- MOBILE LAYOUT ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* CORREÇÃO AQUI: ../../assets/favicon.png */}
          <Image source={require('../../assets/favicon.png')} style={{ width: 32, height: 32, marginRight: 8 }} resizeMode="contain" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: cores.secondary }}>CertifAI</Text>
        </View>
        <TouchableOpacity onPress={handleLogin} style={{ padding: 8 }}>
          <Text style={{ color: cores.secondary, fontWeight: '600', fontSize: 14 }}>Entrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <View style={{ backgroundColor: cores.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 16 }}>
            <Text style={{ color: cores.primary, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 }}>+1.000 ALUNOS</Text>
          </View>

          <Text style={{ fontSize: 36, fontWeight: '800', color: cores.secondary, lineHeight: 42, marginBottom: 16, letterSpacing: -0.5 }}>
            Sua certificação <Text style={{ color: cores.primary }}>garantida.</Text>
          </Text>

          <Text style={{ fontSize: 16, color: cores.gray500, marginBottom: 24, lineHeight: 24 }}>
            Estude com inteligência artificial e passe de primeira na CPA, C-PRO R e C-PRO I.
          </Text>
        </View>

        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {carouselData.map((item) => (
              <View key={item.id} style={[styles.carouselSlide, { width: windowWidth }]}>
                <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {carouselData.map((_, index) => (
              <View key={index} style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]} />
            ))}
          </View>
        </View>

        <View style={{ padding: 24, alignItems: 'center', opacity: 0.6 }}>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center' }}>Certifai Tecnologia LTDA</Text>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center', marginVertical: 2 }}>CNPJ: 63.594.251/0001-61</Text>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center' }}>contato@certifai.com.br</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleStartOnboarding}>
          <Text style={styles.buttonText}>Começar Agora</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', marginTop: 16, color: cores.gray500, fontSize: 14 }}>Comece gratuitamente.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: cores.light },
  // Common
  pagination: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.gray200, marginHorizontal: 4 },
  paginationDotActive: { backgroundColor: cores.primary, width: 24 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.primary, width: '100%', elevation: 2, shadowColor: cores.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonText: { color: cores.light, fontSize: 16, fontWeight: 'bold' },
  
  // Mobile Specific
  carouselContainer: { marginVertical: 20 },
  carouselSlide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  slideImage: { width: '100%', height: 350, borderRadius: 12, marginBottom: 20 },
  slideTitle: { fontSize: 24, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 8 },
  slideDescription: { fontSize: 16, color: cores.gray500, textAlign: 'center', lineHeight: 24 },
  footer: { padding: 24, backgroundColor: cores.light, borderTopWidth: 1, borderTopColor: cores.gray100 },

  // Desktop Specific
  desktopNavBtn: { padding: 12, borderRadius: 50, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
});
