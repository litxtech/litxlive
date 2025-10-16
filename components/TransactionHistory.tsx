import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

export type TransactionItem = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  coins: number;
  packageId?: string | null;
  productId?: string | null;
  status: string;
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  completedAt?: string | null;
};

interface Props {
  transactions: TransactionItem[];
  isLoading: boolean;
}

const TransactionHistory = memo(function TransactionHistory({ transactions, isLoading }: Props) {
  const data = useMemo(() => transactions ?? [], [transactions]);

  if (isLoading) {
    return (
      <View style={styles.loader} testID="transaction-history-loading">
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.empty} testID="transaction-history-empty">
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySub}>Your purchases and earnings will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="transaction-history-list"
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.type}>{capitalize(item.type)} • {capitalize(item.status)}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
            {!!item.paymentMethod && (
              <Text style={styles.meta}>Method: {item.paymentMethod}</Text>
            )}
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text>
            <Text style={styles.meta}>{item.coins} coins</Text>
          </View>
        </View>
      )}
    />
  );
});

function capitalize(v: string | undefined) {
  if (!v) return '';
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount ?? 0);
  } catch (e) {
    console.log('[TransactionHistory] currency format fallback', e);
    return `${currency} ${(amount ?? 0).toFixed(2)}`;
  }
}

const styles = StyleSheet.create({
  loader: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
    paddingRight: 8,
  },
  right: {
    alignItems: 'flex-end',
  },
  type: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  meta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});

export default TransactionHistory;
