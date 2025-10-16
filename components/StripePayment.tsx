import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  packageName,
  price,
  coins,
  currency = 'USD',
  onCancel,
}: StripePaymentProps) {
  const handlePayment = () => {
    Alert.alert(
      'Not Available',
      'Stripe payment is only available on mobile devices. Please use the mobile app to complete your purchase.'
    );
    onCancel?.();
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
        style={styles.button}
        onPress={handlePayment}
      >
        <Text style={styles.buttonText}>Pay with Stripe</Text>
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
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
  },
});
