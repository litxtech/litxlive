import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface StripePaymentProps {
  packageId: string;
  packageName: string;
  price: number;
  coins: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StripePayment({
  packageId,
  packageName,
  price,
  coins,
  currency = 'USD',
  onSuccess,
  onCancel,
}: StripePaymentProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Web için basit ödeme simülasyonu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Payment Successful!',
        `You received ${coins} coins. Thank you for your purchase!`
      );
      onSuccess?.();

    } catch (error: any) {
      console.error('[StripePayment] Error:', error);
      Alert.alert(
        'Payment Failed',
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.packageInfo}>
        <Text style={styles.packageName}>{packageName}</Text>
        <Text style={styles.coins}>{coins} Coins</Text>
        <Text style={styles.price}>
          {currency} {price.toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Pay with Stripe (Web)</Text>
        )}
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  packageInfo: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  packageName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  coins: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFD700',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#666',
  },
  button: {
    backgroundColor: '#635BFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
