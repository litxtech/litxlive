import { supabase } from '@/lib/supabase';
import { COIN_PACKAGES, SUBSCRIPTION_PACKAGES } from '@/lib/stripe';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface CoinPurchase {
  packageId: string;
  coins: number;
  price: number;
  currency: string;
  bonus?: number;
}

export interface SubscriptionPurchase {
  packageId: string;
  price: number;
  currency: string;
  interval: string;
}

class PaymentService {
  // Coin satın alma
  async purchaseCoins(packageId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      const packageData = COIN_PACKAGES.find(pkg => pkg.id === packageId);
      if (!packageData) {
        return { success: false, error: 'Package not found' };
      }

      // Stripe payment intent oluştur
      const { data: paymentIntent, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(packageData.price * 100), // cents
          currency: packageData.currency,
          metadata: {
            type: 'coin_purchase',
            packageId,
            coins: packageData.coins,
            bonus: packageData.bonus || 0,
          }
        }
      });

      if (intentError) {
        console.error('[PaymentService] Payment intent error:', intentError);
        return { success: false, error: 'Payment intent creation failed' };
      }

      // Payment intent'i confirm et
      const { data: confirmedPayment, error: confirmError } = await supabase.functions.invoke('confirm-payment-intent', {
        body: {
          paymentIntentId: paymentIntent.id,
          paymentMethodId,
        }
      });

      if (confirmError) {
        console.error('[PaymentService] Payment confirmation error:', confirmError);
        return { success: false, error: 'Payment confirmation failed' };
      }

      // Başarılı ödeme sonrası coin ekle
      const { error: coinError } = await supabase.functions.invoke('add-coins', {
        body: {
          coins: packageData.coins + (packageData.bonus || 0),
          transactionId: confirmedPayment.id,
        }
      });

      if (coinError) {
        console.error('[PaymentService] Add coins error:', coinError);
        return { success: false, error: 'Failed to add coins' };
      }

      return {
        success: true,
        transactionId: confirmedPayment.id,
      };

    } catch (error) {
      console.error('[PaymentService] Purchase coins error:', error);
      return { success: false, error: 'Payment failed' };
    }
  }

  // Abonelik satın alma
  async purchaseSubscription(packageId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      const packageData = SUBSCRIPTION_PACKAGES.find(pkg => pkg.id === packageId);
      if (!packageData) {
        return { success: false, error: 'Package not found' };
      }

      // Stripe subscription oluştur
      const { data: subscription, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: packageData.id,
          paymentMethodId,
          metadata: {
            type: 'subscription',
            packageId,
            interval: packageData.interval,
          }
        }
      });

      if (subscriptionError) {
        console.error('[PaymentService] Subscription creation error:', subscriptionError);
        return { success: false, error: 'Subscription creation failed' };
      }

      return {
        success: true,
        transactionId: subscription.id,
      };

    } catch (error) {
      console.error('[PaymentService] Purchase subscription error:', error);
      return { success: false, error: 'Subscription failed' };
    }
  }

  // Ödeme geçmişi
  async getPaymentHistory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[PaymentService] Get payment history error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[PaymentService] Get payment history error:', error);
      return [];
    }
  }

  // Aktif abonelik kontrolü
  async getActiveSubscription(): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('[PaymentService] Get active subscription error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PaymentService] Get active subscription error:', error);
      return null;
    }
  }

  // Abonelik iptal etme
  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) {
        console.error('[PaymentService] Cancel subscription error:', error);
        return { success: false, error: 'Failed to cancel subscription' };
      }

      return { success: true };
    } catch (error) {
      console.error('[PaymentService] Cancel subscription error:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }
}

export const paymentService = new PaymentService();
