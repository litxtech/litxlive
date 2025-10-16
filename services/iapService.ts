import { Platform, Alert } from 'react-native';
import IAP_PACKAGES, { getPackageById, COIN_TO_PRODUCT_MAP } from '@/constants/iapPackages';
import type { PurchaseRequest, PurchaseResponse } from '@/types/transaction';

class IAPService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[IAP] Initializing IAP service...');
    
    if (Platform.OS === 'web') {
      console.log('[IAP] Web platform - using web payment methods');
      this.initialized = true;
      return;
    }

    console.log('[IAP] Native platform - IAP ready for dev client');
    this.initialized = true;
  }

  async getProducts() {
    await this.initialize();
    
    if (Platform.OS === 'web') {
      return IAP_PACKAGES.map(pkg => ({
        productId: (pkg.productId ?? pkg.id),
        price: pkg.price.toString(),
        currency: pkg.currency,
        localizedPrice: `${pkg.price}`,
        title: pkg.name,
        description: (pkg.features ?? [`${pkg.coins} coins`, `${pkg.aiCredits} AI credits`]).join(', '),
      }));
    }

    return IAP_PACKAGES;
  }

  async purchasePackage(request: PurchaseRequest): Promise<PurchaseResponse> {
    try {
      await this.initialize();

      const pkg = getPackageById(request.packageId);
      if (!pkg) {
        return {
          success: false,
          error: 'Package not found',
        };
      }

      console.log('[IAP] Processing purchase:', {
        packageId: request.packageId,
        paymentMethod: request.paymentMethod,
      });

      if (Platform.OS === 'web') {
        return this.handleWebPurchase(request, pkg);
      }

      return {
        success: false,
        message: 'Native IAP requires dev client. Please use web payment methods.',
      };
    } catch (error) {
      console.error('[IAP] Purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  private async handleWebPurchase(
    request: PurchaseRequest,
    pkg: typeof IAP_PACKAGES[0]
  ): Promise<PurchaseResponse> {
    Alert.alert(
      'Web Payment',
      `This will redirect to payment gateway for ${pkg.name}\n\nPrice: ${pkg.price} USD\n\nGoogle Play will convert to your local currency automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            console.log('[IAP] Redirecting to payment gateway...');
          },
        },
      ]
    );

    return {
      success: false,
      message: 'Payment gateway integration required',
    };
  }

  getCoinsByProductId(productId: string): number {
    return COIN_TO_PRODUCT_MAP[productId] || 0;
  }

  async restorePurchases(): Promise<PurchaseResponse> {
    try {
      await this.initialize();

      console.log('[IAP] Restoring purchases...');

      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Restore not available on web',
        };
      }

      return {
        success: false,
        message: 'Native IAP requires dev client',
      };
    } catch (error) {
      console.error('[IAP] Restore error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async validateReceipt(receiptData: string, productId: string): Promise<boolean> {
    try {
      console.log('[IAP] Validating receipt:', { productId });
      
      return false;
    } catch (error) {
      console.error('[IAP] Receipt validation error:', error);
      return false;
    }
  }

  async finishTransaction(transactionId: string): Promise<void> {
    console.log('[IAP] Finishing transaction:', transactionId);
  }

  async cleanup(): Promise<void> {
    console.log('[IAP] Cleaning up IAP service');
    this.initialized = false;
  }
}

export const iapService = new IAPService();
