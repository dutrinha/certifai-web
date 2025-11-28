import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView 
} from 'react-native';
import { 
  X, 
  Frown, 
  ThumbsUp, 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  History,
  CheckCircle
} from 'lucide-react-native';
import { supabase, useAuth } from '../context/AuthContext';

const cores = {
  background: '#F7FAFC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSec: '#64748B',
  primary: '#00C853', // Verde Sucesso
  red: '#EF4444',     // Vermelho Perigo
  redLight: '#FEE2E2',
  border: '#E2E8F0',
  orange: '#F59E0B',
};

export default function ChurnGuardModal({ visible, onClose, onCancelSuccess }) {
  const { user, refreshSubscription } = useAuth(); // Importamos refreshSubscription para atualizar o estado local se necessário
  const [step, setStep] = useState(1); // 1: Perda (Loss Aversion), 2: Pesquisa, 3: Processando
  const [loading, setLoading] = useState(false);

  const handleCancelSubscription = async (reason) => {
    if (!user) return;

    setLoading(true);
    setStep(3); // Mostra tela de loading
    
    try {
      // Chama a Edge Function 'cancel-subscription'
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          userId: user.id, 
          reason: reason 
        },
      });

      if (error) throw error;

      // Sucesso
      Alert.alert(
        "Assinatura Cancelada", 
        "Sua assinatura não será renovada. Você continuará com acesso até o fim do período atual."
      );
      
      // Atualiza o contexto local (opcional, mas recomendado)
      if (refreshSubscription) await refreshSubscription();

      if (onCancelSuccess) onCancelSuccess();
      
      onClose();
      setStep(1); // Reseta para a próxima vez

    } catch (err) {
      console.error("Erro cancelamento:", err);
      Alert.alert(
        "Atenção", 
        "Não foi possível processar o cancelamento automaticamente. Por favor, entre em contato com nosso suporte em contato@certifai.com.br"
      );
      // Volta para o passo anterior para tentar de novo ou fechar
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // PASSO 1: Aversão à Perda (O que ele perde?)
  const renderStep1 = () => (
    <View>
      <View style={styles.headerIconContainer}>
        <AlertTriangle size={32} color={cores.orange} />
      </View>
      
      <Text style={styles.title}>Espere um momento!</Text>
      <Text style={styles.subtitle}>
        Tem certeza que deseja interromper sua jornada de aprovação?
      </Text>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitTitle}>Ao cancelar agora, você perde acesso a:</Text>
        
        <View style={styles.benefitRow}>
          <Brain size={20} color={cores.primary} style={styles.benefitIcon} />
          <Text style={styles.benefitText}>
            <Text style={{fontWeight: 'bold'}}>Professor IA 24/7</Text> tirando suas dúvidas.
          </Text>
        </View>
        
        <View style={styles.benefitRow}>
          <TrendingUp size={20} color={cores.primary} style={styles.benefitIcon} />
          <Text style={styles.benefitText}>
            Seu <Text style={{fontWeight: 'bold'}}>histórico de evolução</Text> será congelado.
          </Text>
        </View>

        <View style={styles.benefitRow}>
          <History size={20} color={cores.primary} style={styles.benefitIcon} />
          <Text style={styles.benefitText}>
            Acesso ilimitado a <Text style={{fontWeight: 'bold'}}>simulados e cases reais</Text>.
          </Text>
        </View>
      </View>

      <Text style={styles.socialProof}>
        💡 <Text style={{fontStyle: 'italic'}}>80% dos alunos que mantêm a assinatura ativa são aprovados na primeira tentativa.</Text>
      </Text>

      <TouchableOpacity style={styles.btnKeep} onPress={onClose}>
        <Text style={styles.btnKeepText}>Mudei de ideia, quero ficar!</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.btnCancelGhost} onPress={() => setStep(2)}>
        <Text style={styles.btnCancelGhostText}>Continuar cancelamento</Text>
      </TouchableOpacity>
    </View>
  );

  // PASSO 2: Pesquisa (Motivo)
  const renderStep2 = () => (
    <View>
      <Text style={styles.title}>Que pena ver você ir</Text>
      <Text style={styles.description}>
        Para melhorarmos, poderia nos contar o motivo principal da sua saída?
        {'\n'}(O cancelamento será processado ao clicar)
      </Text>
      
      <View style={styles.optionsContainer}>
        <OptionButton 
          label="Já fui aprovado! (Sucesso)" 
          onPress={() => handleCancelSubscription('aprovado')} 
          icon={ThumbsUp} 
          color={cores.primary}
        />
        <OptionButton 
          label="Achei o valor alto" 
          onPress={() => handleCancelSubscription('preço')} 
          icon={Frown} 
        />
        <OptionButton 
          label="Não estou usando o suficiente" 
          onPress={() => handleCancelSubscription('uso_baixo')} 
          icon={History} 
        />
        <OptionButton 
          label="Tive problemas técnicos" 
          onPress={() => handleCancelSubscription('tecnico')} 
          icon={AlertTriangle} 
        />
        <OptionButton 
          label="Outros motivos" 
          onPress={() => handleCancelSubscription('outros')} 
        />
      </View>

      <TouchableOpacity style={styles.btnCancelGhost} onPress={() => setStep(1)} disabled={loading}>
        <Text style={styles.btnCancelGhostText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 3 ? (
            <View style={{padding: 40, alignItems: 'center'}}>
              <ActivityIndicator size="large" color={cores.primary} />
              <Text style={{marginTop: 16, color: cores.textSec, fontWeight: '500', textAlign: 'center'}}>
                Processando seu cancelamento...
              </Text>
              <Text style={{marginTop: 8, color: cores.textSec, fontSize: 12, textAlign: 'center'}}>
                Isso pode levar alguns segundos.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={cores.textSec} />
              </TouchableOpacity>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {step === 1 ? renderStep1() : renderStep2()}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const OptionButton = ({ label, onPress, icon: Icon, color }) => (
  <TouchableOpacity style={styles.optionBtn} onPress={onPress}>
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
      {Icon && <Icon size={18} color={color || cores.textSec} />}
      <Text style={styles.optionText}>{label}</Text>
    </View>
    <CheckCircle size={16} color={cores.border} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  container: { 
    backgroundColor: cores.card, 
    borderRadius: 24, 
    padding: 24, 
    width: '100%', 
    maxWidth: 360,
    maxHeight: '90%', // Garante que não estoure a tela em celulares pequenos
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  headerIconContainer: { 
    alignSelf: 'center', 
    backgroundColor: '#FFFBEB', 
    padding: 16, 
    borderRadius: 50, 
    marginBottom: 16,
    marginTop: 8
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: cores.text, 
    textAlign: 'center', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 15, 
    color: cores.textSec, 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 22
  },
  description: {
    fontSize: 15, 
    color: cores.textSec, 
    textAlign: 'center', 
    marginBottom: 20,
    marginTop: 10
  },
  benefitsContainer: {
    backgroundColor: cores.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: cores.border,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.textSec,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: cores.text,
    flex: 1,
    lineHeight: 20,
  },
  socialProof: {
    fontSize: 12,
    color: cores.textSec,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  btnKeep: { 
    backgroundColor: cores.primary, 
    padding: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: cores.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnKeepText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  btnCancelGhost: { 
    padding: 14, 
    alignItems: 'center',
    borderRadius: 14,
  },
  btnCancelGhostText: { 
    color: cores.textSec, 
    fontSize: 14,
    fontWeight: '600'
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderWidth: 1, 
    borderColor: cores.border, 
    borderRadius: 14, 
    backgroundColor: cores.card,
  },
  optionText: { 
    color: cores.text, 
    fontWeight: '500',
    fontSize: 14,
  }
});
