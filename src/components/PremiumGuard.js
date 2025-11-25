// src/components/PremiumGuard.js
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PaywallModal from './PaywallModal';

/**
 * Envolve um componente filho.
 * Se o usuário for FREE, intercepta o clique e mostra o Paywall.
 * Se o usuário for PRO, executa a ação normal (onPress).
 */
export default function PremiumGuard({ children, onPress, style }) {
  const { isPro } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  const handlePress = () => {
    if (isPro) {
      // Se for PRO, executa a ação original (navegar, abrir chat, etc)
      if (onPress) onPress();
    } else {
      // Se for FREE, abre o Paywall
      console.log("Usuário Free tentou acessar recurso Premium");
      setShowPaywall(true);
    }
  };

  return (
    <>
      <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.8}>
        {/* Renderiza o botão original, mas agora controlado pelo Guard */}
        <View pointerEvents="none"> 
           {/* pointerEvents="none" garante que o clique vá para o TouchableOpacity do Guard */}
           {children}
        </View>
      </TouchableOpacity>

      <PaywallModal 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
    </>
  );
}