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
  const { width: windowWidth } = useWindowDimensions();

  // Desktop check: Web platform and width > 768px
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const handleStartOnboarding = () => {
    navigation.navigate('OnboardingFlow');
  };

  const handleLogin = () => {
    navigation.navigate('Auth');
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    // For desktop, we use a fixed width for slides (500), for mobile we use windowWidth
    const slideWidth = isDesktop ? 500 : windowWidth;
    const index = Math.round(scrollPosition / slideWidth);
    setActiveIndex(index);
  };

  const scrollToIndex = (index) => {
    if (index >= 0 && index < carouselData.length) {
      const slideWidth = isDesktop ? 500 : windowWidth;
      scrollViewRef.current?.scrollTo({ x: index * slideWidth, animated: true });
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    scrollToIndex(activeIndex + 1);
  };

  const handlePrev = () => {
    scrollToIndex(activeIndex - 1);
  };

  // --- DESKTOP LAYOUT (SPLIT VIEW) ---
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.light }}>
        {/* Navbar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 64, paddingVertical: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Logo */}
            <Image
              source={require('../../assets/favicon.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: cores.secondary }}>CertifAI</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 100,
              backgroundColor: 'white',
              // Border removed
            }}
          >
            <Text style={{ color: cores.secondary, fontWeight: '600', fontSize: 16 }}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.container, { flexDirection: 'row', backgroundColor: 'transparent' }]}>
          {/* Left Column: Text & CTA */}
          <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 80, paddingRight: 40 }}>
            <View style={{ maxWidth: 600 }}>
              <View style={{ backgroundColor: cores.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, marginBottom: 32 }}>
                <Text style={{ color: cores.primary, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 }}>APROVADO POR +1.000 ALUNOS</Text>
              </View>

              <Text style={{ fontSize: 64, fontWeight: '800', color: cores.secondary, lineHeight: 72, marginBottom: 24, letterSpacing: -1.5 }}>
                Sua certificação financeira <Text style={{ color: cores.primary }}>garantida.</Text>
              </Text>

              <Text style={{ fontSize: 20, color: cores.gray500, marginBottom: 48, lineHeight: 32, maxWidth: 500 }}>
                A plataforma mais completa para CPA, C-PRO R, C-PRO I e muito mais. Estude com inteligência artificial e passe de primeira.
              </Text>

              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.button, { width: 'auto', paddingHorizontal: 40, height: 60 }]}
                  onPress={handleStartOnboarding}
                >
                  <Text style={[styles.buttonText, { fontSize: 18 }]}>Começar Agora</Text>
                </TouchableOpacity>

                <Text style={{ color: cores.gray500, fontSize: 14, marginLeft: 16 }}>
                  Comece gratuitamente.
                </Text>
              </View>
            </View>
          </View>

          {/* Right Column: Carousel */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Decorative Elements */}
            <View style={{ position: 'absolute', width: 600, height: 600, borderRadius: 300, opacity: 0.6, top: '5%', right: '5%' }} />

            {/* Desktop Carousel */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              {/* Prev Button */}
              <TouchableOpacity
                onPress={handlePrev}
                disabled={activeIndex === 0}
                style={{
                  padding: 12,
                  borderRadius: 50,
                  backgroundColor: 'white',
                  opacity: activeIndex === 0 ? 0.5 : 1,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
                }}
              >
                <ChevronLeft size={32} color={cores.secondary} />
              </TouchableOpacity>

              <View style={{ width: 500, alignItems: 'center' }}>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScroll}
                  style={{ width: 500, height: 600 }} // Fixed width for desktop carousel
                >
                  {carouselData.map((item) => (
                    <View key={item.id} style={{ width: 500, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                      <Image
                        source={item.image}
                        style={{ width: '100%', height: 400, marginBottom: 32, borderRadius: 24 }}
                        resizeMode="contain"
                      />
                      <Text style={{ fontSize: 28, fontWeight: 'bold', color: cores.secondary, textAlign: 'center', marginBottom: 16 }}>{item.title}</Text>
                      <Text style={{ fontSize: 18, color: cores.gray500, textAlign: 'center', lineHeight: 28, maxWidth: 400 }}>{item.description}</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
                  {carouselData.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === activeIndex && styles.paginationDotActive,
                        { width: 12, height: 12, borderRadius: 6 } // Slightly larger dots for desktop
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Next Button */}
              <TouchableOpacity
                onPress={handleNext}
                disabled={activeIndex === carouselData.length - 1}
                style={{
                  padding: 12,
                  borderRadius: 50,
                  backgroundColor: 'white',
                  opacity: activeIndex === carouselData.length - 1 ? 0.5 : 1,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
                }}
              >
                <ChevronRight size={32} color={cores.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ padding: 32, borderTopWidth: 1, borderTopColor: cores.gray100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: cores.gray500, fontSize: 12 }}>Certifai Tecnologia LTDA</Text>
            <Text style={{ color: cores.gray500, fontSize: 12 }}>CNPJ: 63.594.251/0001-61</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <Text style={{ color: cores.gray500, fontSize: 12 }}>contato@certifai.com.br</Text>
          </View>
        </View>
      </View>
    );
  }

  // --- MOBILE LAYOUT (UPDATED) ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/favicon.png')}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: cores.secondary }}>CertifAI</Text>
        </View>
        <TouchableOpacity onPress={handleLogin} style={{ padding: 8 }}>
          <Text style={{ color: cores.secondary, fontWeight: '600', fontSize: 14 }}>Entrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 5 }}>
          <View style={{ backgroundColor: cores.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 5 }}>
            <Text style={{ color: cores.primary, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 }}>+1.000 ALUNOS</Text>
          </View>

          <Text style={{ fontSize: 42, fontWeight: '800', color: cores.secondary, lineHeight: 48, marginBottom: 16, letterSpacing: -1 }}>
            Sua certificação <Text style={{ color: cores.primary }}>garantida.</Text>
          </Text>

          <Text style={{ fontSize: 18, color: cores.gray500, marginBottom: 32, lineHeight: 28 }}>
            Estude com inteligência artificial e passe de primeira na CPA, C-PRO R e C-PRO I.
          </Text>
        </View>

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
                <Image
                  source={item.image}
                  style={styles.slideImage}
                  resizeMode="contain"
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

        {/* Mobile Footer Info */}
        <View style={{ padding: 24, paddingBottom: 40, alignItems: 'center', opacity: 0.6 }}>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center', marginBottom: 4 }}>Certifai Tecnologia LTDA</Text>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>CNPJ: 63.594.251/0001-61</Text>
          <Text style={{ color: cores.gray500, fontSize: 12, textAlign: 'center', marginBottom: 2 }}>contato@certifai.com.br</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopWidth: 0 }]}>
        <TouchableOpacity
          style={[styles.button, { height: 56 }]}
          onPress={handleStartOnboarding}
        >
          <Text style={[styles.buttonText, { fontSize: 18 }]}>Começar Agora</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', marginTop: 16, color: cores.gray500, fontSize: 14 }}>Comece gratuitamente.</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideImage: {
    width: '90%',
    height: 400,
    borderRadius: 12,
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