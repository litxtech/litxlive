import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { CURRENCY_RATES } from '@/constants/iapPackages';

import type { CurrencyCode } from '@/constants/iapPackages';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
}

export default function CurrencySelector({ selectedCurrency, onSelectCurrency }: CurrencySelectorProps) {
  const currencies = Object.keys(CURRENCY_RATES) as CurrencyCode[];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Currency</Text>
      <View style={styles.currencyRow}>
        {currencies.map((currency) => {
          const info = CURRENCY_RATES[currency];
          const isSelected = selectedCurrency === currency;

          return (
            <TouchableOpacity
              key={currency}
              style={[styles.currencyButton, isSelected && styles.currencyButtonActive]}
              onPress={() => onSelectCurrency(currency)}
            >
              <Text style={[styles.currencySymbol, isSelected && styles.currencySymbolActive]}>
                {info.symbol}
              </Text>
              <Text style={[styles.currencyCode, isSelected && styles.currencyCodeActive]}>
                {currency}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  currencySymbolActive: {
    color: '#FFFFFF',
  },
  currencyCode: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  currencyCodeActive: {
    color: '#FFFFFF',
  },
});
