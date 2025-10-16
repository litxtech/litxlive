import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coins, Gift, Package, DollarSign, Save, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';

type TabType = 'packages' | 'costs' | 'gifts' | 'limits';

interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price_usd: number;
  tier: string;
}

interface GiftTier {
  name: string;
  coins: number;
  icon: string;
}

export default function AdminEconomy() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('packages');
  const [hasChanges, setHasChanges] = useState(false);

  const economyQuery = trpc.admin.economy.getSettings.useQuery();
  const updateMutation = trpc.admin.economy.updateSetting.useMutation();

  const [callCost, setCallCost] = useState('40');
  const [perMinuteCost, setPerMinuteCost] = useState('30');
  const [dailyPurchaseLimit, setDailyPurchaseLimit] = useState('100000');
  const [dailySpendLimit, setDailySpendLimit] = useState('50000');
  const [giftRateMinute, setGiftRateMinute] = useState('2');
  const [giftRateHour, setGiftRateHour] = useState('20');

  const [packages, setPackages] = useState<Record<string, CoinPackage>>({
    coins_100: { id: 'coins_100', coins: 100, bonus: 0, price_usd: 0.99, tier: 'TIER_1' },
    coins_550: { id: 'coins_550', coins: 550, bonus: 10, price_usd: 4.99, tier: 'TIER_5' },
    coins_1200: { id: 'coins_1200', coins: 1200, bonus: 20, price_usd: 9.99, tier: 'TIER_10' },
    coins_2500: { id: 'coins_2500', coins: 2500, bonus: 25, price_usd: 19.99, tier: 'TIER_20' },
    coins_6500: { id: 'coins_6500', coins: 6500, bonus: 30, price_usd: 49.99, tier: 'TIER_50' },
    coins_14000: { id: 'coins_14000', coins: 14000, bonus: 40, price_usd: 99.99, tier: 'TIER_100' },
  });

  const [gifts, setGifts] = useState<Record<string, GiftTier>>({
    mini_like: { name: 'Mini Like', coins: 5, icon: '❤️' },
    flower: { name: 'Flower', coins: 50, icon: '🌹' },
    diamond: { name: 'Diamond', coins: 500, icon: '💎' },
    super_car: { name: 'Super Car', coins: 5000, icon: '🏎️' },
  });

  React.useEffect(() => {
    if (economyQuery.data) {
      const settings = economyQuery.data;
      
      if (settings.call_connect_cost) setCallCost(settings.call_connect_cost);
      if (settings.call_per_minute_cost) setPerMinuteCost(settings.call_per_minute_cost);
      if (settings.daily_purchase_limit) setDailyPurchaseLimit(settings.daily_purchase_limit);
      if (settings.daily_spend_limit) setDailySpendLimit(settings.daily_spend_limit);
      if (settings.gift_rate_limit_per_minute) setGiftRateMinute(settings.gift_rate_limit_per_minute);
      if (settings.gift_rate_limit_per_hour) setGiftRateHour(settings.gift_rate_limit_per_hour);
      
      if (settings.coin_packages) {
        setPackages(settings.coin_packages as Record<string, CoinPackage>);
      }
      
      if (settings.gifts) {
        setGifts(settings.gifts as Record<string, GiftTier>);
      }
    }
  }, [economyQuery.data]);

  const handleSave = async () => {
    try {
      if (activeTab === 'costs') {
        await updateMutation.mutateAsync({
          key: 'call_connect_cost',
          value: callCost,
        });
        await updateMutation.mutateAsync({
          key: 'call_per_minute_cost',
          value: perMinuteCost,
        });
      } else if (activeTab === 'limits') {
        await updateMutation.mutateAsync({
          key: 'daily_purchase_limit',
          value: dailyPurchaseLimit,
        });
        await updateMutation.mutateAsync({
          key: 'daily_spend_limit',
          value: dailySpendLimit,
        });
        await updateMutation.mutateAsync({
          key: 'gift_rate_limit_per_minute',
          value: giftRateMinute,
        });
        await updateMutation.mutateAsync({
          key: 'gift_rate_limit_per_hour',
          value: giftRateHour,
        });
      } else if (activeTab === 'packages') {
        await updateMutation.mutateAsync({
          key: 'coin_packages',
          value: JSON.stringify(packages),
        });
      } else if (activeTab === 'gifts') {
        await updateMutation.mutateAsync({
          key: 'gifts',
          value: JSON.stringify(gifts),
        });
      }

      Alert.alert('Success', 'Settings saved successfully');
      setHasChanges(false);
      economyQuery.refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('Save error:', error);
    }
  };

  const updatePackage = (id: string, field: keyof CoinPackage, value: string | number) => {
    setPackages(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: typeof value === 'string' ? parseFloat(value) || 0 : value }
    }));
    setHasChanges(true);
  };

  const updateGift = (id: string, field: keyof GiftTier, value: string | number) => {
    setGifts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: field === 'coins' ? (typeof value === 'string' ? parseInt(value) || 0 : value) : value }
    }));
    setHasChanges(true);
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'packages', label: 'Packages', icon: Package },
    { key: 'costs', label: 'Call Costs', icon: DollarSign },
    { key: 'gifts', label: 'Gifts', icon: Gift },
    { key: 'limits', label: 'Limits', icon: Coins },
  ];

  const renderPackages = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Coin Packages</Text>
      <Text style={styles.sectionSubtitle}>Configure coin packages and bonuses</Text>
      
      {Object.entries(packages).map(([id, pkg]) => (
        <View key={id} style={styles.card}>
          <Text style={styles.cardTitle}>{id.replace('coins_', '')} Coins Package</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Base Coins</Text>
              <TextInput
                style={styles.input}
                value={String(pkg.coins)}
                onChangeText={(val) => updatePackage(id, 'coins', val)}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bonus %</Text>
              <TextInput
                style={styles.input}
                value={String(pkg.bonus)}
                onChangeText={(val) => updatePackage(id, 'bonus', val)}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (USD)</Text>
              <TextInput
                style={styles.input}
                value={String(pkg.price_usd)}
                onChangeText={(val) => updatePackage(id, 'price_usd', val)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Play Tier</Text>
              <Text style={styles.tierBadge}>{pkg.tier}</Text>
            </View>
          </View>

          <View style={styles.calculatedRow}>
            <Text style={styles.calculatedLabel}>Total coins with bonus:</Text>
            <Text style={styles.calculatedValue}>
              {pkg.coins + Math.floor(pkg.coins * pkg.bonus / 100)} coins
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCosts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Call & Search Costs</Text>
      <Text style={styles.sectionSubtitle}>Set pricing for video calls</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Call Connection Fee</Text>
        <Text style={styles.cardDescription}>Charged when user starts a call</Text>
        <TextInput
          style={styles.largeInput}
          value={callCost}
          onChangeText={(val) => { setCallCost(val); setHasChanges(true); }}
          keyboardType="numeric"
          placeholder="40"
          placeholderTextColor="#666"
        />
        <Text style={styles.inputHint}>Current: {callCost} coins per call</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Per Minute Cost</Text>
        <Text style={styles.cardDescription}>Additional cost per minute (disabled in MVP)</Text>
        <TextInput
          style={styles.largeInput}
          value={perMinuteCost}
          onChangeText={(val) => { setPerMinuteCost(val); setHasChanges(true); }}
          keyboardType="numeric"
          placeholder="30"
          placeholderTextColor="#666"
        />
        <Text style={styles.inputHint}>Current: {perMinuteCost} coins/min (not active)</Text>
      </View>
    </View>
  );

  const renderGifts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gift Tiers</Text>
      <Text style={styles.sectionSubtitle}>Configure gift prices and icons</Text>
      
      {Object.entries(gifts).map(([id, gift]) => (
        <View key={id} style={styles.card}>
          <View style={styles.giftHeader}>
            <Text style={styles.giftIcon}>{gift.icon}</Text>
            <Text style={styles.cardTitle}>{gift.name}</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Gift Name</Text>
              <TextInput
                style={styles.input}
                value={gift.name}
                onChangeText={(val) => updateGift(id, 'name', val)}
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cost (coins)</Text>
              <TextInput
                style={styles.input}
                value={String(gift.coins)}
                onChangeText={(val) => updateGift(id, 'coins', val)}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderLimits = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Spending Limits</Text>
      <Text style={styles.sectionSubtitle}>Anti-fraud and rate limiting</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Purchase Limit</Text>
        <Text style={styles.cardDescription}>Max coins user can buy per day</Text>
        <TextInput
          style={styles.largeInput}
          value={dailyPurchaseLimit}
          onChangeText={(val) => { setDailyPurchaseLimit(val); setHasChanges(true); }}
          keyboardType="numeric"
          placeholder="100000"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Spend Limit</Text>
        <Text style={styles.cardDescription}>Max coins user can spend per day</Text>
        <TextInput
          style={styles.largeInput}
          value={dailySpendLimit}
          onChangeText={(val) => { setDailySpendLimit(val); setHasChanges(true); }}
          keyboardType="numeric"
          placeholder="50000"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gift Rate Limits</Text>
        <Text style={styles.cardDescription}>Prevent gift spam</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Per Minute</Text>
            <TextInput
              style={styles.input}
              value={giftRateMinute}
              onChangeText={(val) => { setGiftRateMinute(val); setHasChanges(true); }}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Per Hour</Text>
            <TextInput
              style={styles.input}
              value={giftRateHour}
              onChangeText={(val) => { setGiftRateHour(val); setHasChanges(true); }}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Economy Settings</Text>
        {hasChanges && (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Save size={20} color="#FFD700" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon size={18} color={isActive ? '#FFD700' : '#666'} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {economyQuery.isLoading ? (
          <View style={styles.loadingState}>
            <RefreshCw size={32} color="#666" />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'packages' && renderPackages()}
            {activeTab === 'costs' && renderCosts()}
            {activeTab === 'gifts' && renderGifts()}
            {activeTab === 'limits' && renderLimits()}
          </>
        )}
      </ScrollView>

      {hasChanges && (
        <View style={styles.floatingButton}>
          <TouchableOpacity 
            style={styles.saveFloatingButton} 
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save size={24} color="#000" />
            <Text style={styles.saveFloatingText}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cardDescription: {
    fontSize: 13,
    color: '#999',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
  },
  input: {
    backgroundColor: '#0B0B10',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  largeInput: {
    backgroundColor: '#0B0B10',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic' as const,
  },
  tierBadge: {
    backgroundColor: '#FFD700',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  calculatedLabel: {
    fontSize: 13,
    color: '#999',
  },
  calculatedValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  giftIcon: {
    fontSize: 32,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  floatingButton: {
    position: 'absolute' as const,
    bottom: 24,
    left: 16,
    right: 16,
  },
  saveFloatingButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveFloatingText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
});
