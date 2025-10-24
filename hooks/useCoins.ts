import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCoins() {
  const [coins, setCoins] = useState(0);

  const updateCoins = useCallback(async (amount: number) => {
    try {
      console.log('[useCoins] Updating coins:', amount);
      setCoins(prev => prev + amount);
      return { success: true };
    } catch (error) {
      console.error('[useCoins] Update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const addCoins = useCallback(async (amount: number) => {
    return updateCoins(amount);
  }, [updateCoins]);

  const spendCoins = useCallback(async (amount: number) => {
    return updateCoins(-amount);
  }, [updateCoins]);

  const getCoins = useCallback(async () => {
    try {
      // Mock coins fetch
      setCoins(100);
      return { success: true, coins: 100 };
    } catch (error) {
      console.error('[useCoins] Get coins error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  return {
    coins,
    updateCoins,
    addCoins,
    spendCoins,
    getCoins,
  };
}
