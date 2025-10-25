import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { adminWallet, WalletTransaction, WalletBalanceResponse } from '@/services/adminWallet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  userId: string;
}

function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat('tr-TR').format(n);
  } catch (_e) {
    return String(n);
  }
}

function makeIdem(prefix: string = 'adm'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
 

export default function AdminWalletPanel({ userId }: Props) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('');
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [amountStr, setAmountStr] = useState<string>('100');
  const [reason, setReason] = useState<string>('admin_adjust');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    const sanitized = amountStr.replace(/[^\d-]/g, '');
    const parsed = parseInt(sanitized || '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountStr]);

  const load = useCallback(async () => {
    console.log('[AdminWalletPanel] refresh start', { userId });
    setError(null);
    try {
      const b: WalletBalanceResponse = await adminWallet.getBalance(userId);
      const txs: WalletTransaction[] = await adminWallet.listTransactions(userId);
      setBalance(b?.balance ?? 0);
      setCurrency(b?.currency ?? '');
      setLedger(Array.isArray(txs) ? txs.slice(0, 50) : []);
      console.log('[AdminWalletPanel] refresh success', { balance: b?.balance, txs: txs?.length ?? 0 });
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Unknown error';
      console.error('[AdminWalletPanel] refresh error', e);
      setError(msg);
    } finally {
      setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onCredit = useCallback(async () => {
    console.log('[AdminWalletPanel] credit click', { userId, amount: parsedAmount, reason });
    setLoading(true);
    setError(null);
    try {
      await adminWallet.credit(userId, parsedAmount, reason);
      await load();
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Unknown error';
      console.error('[AdminWalletPanel] credit error', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, parsedAmount, reason, load]);

  const onDebit = useCallback(async () => {
    console.log('[AdminWalletPanel] debit click', { userId, amount: parsedAmount, reason });
    setLoading(true);
    setError(null);
    try {
      await adminWallet.debit(userId, parsedAmount, reason);
      await load();
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Unknown error';
      console.error('[AdminWalletPanel] debit error', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, parsedAmount, reason, load]);

  if (initialLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}> 
        <View style={styles.header}>
          <Text style={styles.title} testID="wallet-title">Wallet</Text>
          <TouchableOpacity onPress={load} testID="wallet-refresh" style={styles.refreshBtn} activeOpacity={0.7}>
            <Text style={styles.refreshText}>Yenile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#4C6FFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="admin-wallet-panel">
      <View style={styles.header}>
        <Text style={styles.title} testID="wallet-title">Wallet</Text>
        <TouchableOpacity onPress={load} testID="wallet-refresh" style={styles.refreshBtn} activeOpacity={0.7}>
          <Text style={styles.refreshText}>Yenile</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox} testID="wallet-error">
          <Text style={styles.errorText}>Hata: {error}</Text>
        </View>
      ) : null}

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Bakiye:</Text>
        <Text style={styles.balanceValue} testID="wallet-balance">
          {balance === null ? '—' : `${formatNumber(balance)}${currency ? ' ' + currency : ' (cent/kuruş)'}`}
        </Text>
      </View>

      <View style={styles.inputsRow}>
        <TextInput
          testID="wallet-amount-input"
          value={amountStr}
          onChangeText={(t) => setAmountStr(t.replace(/[^\d-]/g, ''))}
          placeholder="Tutar (cent/kuruş)"
          placeholderTextColor="#5f6a86"
          keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
          style={styles.input}
        />
        <TextInput
          testID="wallet-reason-input"
          value={reason}
          onChangeText={setReason}
          placeholder="Reason (örn: admin_adjust)"
          placeholderTextColor="#5f6a86"
          style={[styles.input, styles.inputReason]}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          testID="wallet-credit-btn"
          onPress={onCredit}
          disabled={loading || parsedAmount <= 0}
          style={[styles.actionBtn, styles.creditBtn, (loading || parsedAmount <= 0) && styles.btnDisabled]}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>+ Credit</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          testID="wallet-debit-btn"
          onPress={onDebit}
          disabled={loading || parsedAmount <= 0}
          style={[styles.actionBtn, styles.debitBtn, (loading || parsedAmount <= 0) && styles.btnDisabled]}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>− Debit</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.ledgerWrap}>
        <Text style={styles.ledgerTitle}>Son İşlemler</Text>
        <View style={styles.ledgerBox}>
          <FlatList
            data={ledger}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const delta = item.amount;
              const isPos = (delta ?? 0) >= 0;
              return (
                <View style={styles.row} testID={`ledger-row-${item.id}`}>
                  <Text style={styles.cellDate}>{new Date(item.created_at).toLocaleString()}</Text>
                  <Text style={[styles.cellDelta, isPos ? styles.deltaPos : styles.deltaNeg]}>
                    {formatNumber(delta)}
                  </Text>
                  <Text style={styles.cellReason}>{item.reason ?? item.type}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.cellReason}>Kayıt yok.</Text>}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23263a',
    padding: 16,
    backgroundColor: '#101015',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    color: '#9aa4bf',
    textDecorationLine: 'underline',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#2a1a1f',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a2430',
  },
  errorText: {
    color: '#ff8aa0',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    color: '#9aa4bf',
    fontSize: 14,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#23263a',
  },
  inputReason: {
    flex: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditBtn: {
    backgroundColor: '#10b981',
  },
  debitBtn: {
    backgroundColor: '#ef4444',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  ledgerWrap: {
    marginTop: 8,
    gap: 8,
  },
  ledgerTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  ledgerBox: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: '#23263a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#23263a',
    gap: 8,
  },
  cellDate: {
    flex: 1.2,
    color: '#9aa4bf',
    fontSize: 12,
  },
  cellDelta: {
    flex: 0.6,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right' as const,
  },
  deltaPos: {
    color: '#10b981',
  },
  deltaNeg: {
    color: '#ef4444',
  },
  cellReason: {
    flex: 0.8,
    color: '#9aa4bf',
    fontSize: 12,
    textAlign: 'right' as const,
  },
});
