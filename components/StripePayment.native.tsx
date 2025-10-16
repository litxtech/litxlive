import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { trpc } from '@/lib/trpc';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface StripePaymentProps {
  packageId: string;
  packageName: string;
  price: number;
  coins: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function NativeStripePaymentContent({
  packageId,
  packageName,
  price,
  coins,
  currency = 'USD',
  onSuccess,
  onCancel,
}: StripePaymentProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const utils = trpc.useUtils();

  const createPaymentIntent = trpc.purchases.stripe.createPaymentIntent.useMutation();
  const confirmPayment = trpc.purchases.stripe.confirmPayment.useMutation();

  const handlePayment = async () => {
    try {
      setLoading(true);

      const result = await createPaymentIntent.mutateAsync({
        packageId,
        currency,
      });

      if (!result.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'LitX Live',
        paymentIntentClientSecret: result.clientSecret,
        defaultBillingDetails: {
          name: 'Customer',
        },
        returnURL: Platform.OS === 'ios' ? 'litxlive://stripe-redirect' : undefined,
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        Alert.alert('Error', initError.message);
        setLoading(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment canceled by user');
          onCancel?.();
        } else {
          console.error('Payment sheet present error:', presentError);
          Alert.alert('Error', presentError.message);
        }
        setLoading(false);
        return;
      }

      const confirmResult = await confirmPayment.mutateAsync({
        paymentIntentId: result.paymentIntentId,
      });

      if (confirmResult.success) {
        Alert.alert(
          'Success',
          `Payment successful! ${coins} coins added to your account.`
        );
        await utils.purchases.balance.invalidate();
        onSuccess?.();
      }

      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Payment failed');
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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with Stripe</Text>
        )}
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function StripePayment(props: StripePaymentProps) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Stripe is not configured. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file.
        </Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NativeStripePaymentContent {...props} />
    </StripeProvider>
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
