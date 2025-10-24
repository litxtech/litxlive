import { useState, useCallback } from 'react';
import { presenceService } from '@/services/presenceService';

export function usePresence() {
  const [isOnline, setIsOnline] = useState(false);

  const updatePresence = useCallback(async (userId: string, data: any) => {
    try {
      await presenceService.updatePresence(userId, data);
      return { success: true };
    } catch (error) {
      console.error('[usePresence] Update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const joinMatchQueue = useCallback(async (userId: string, tags: string[], lang: string, preferences?: any) => {
    try {
      const result = await presenceService.joinMatchQueue(userId, tags, lang, preferences);
      return result;
    } catch (error) {
      console.error('[usePresence] Join queue error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const leaveMatchQueue = useCallback(async (userId: string) => {
    try {
      const result = await presenceService.leaveMatchQueue(userId);
      return result;
    } catch (error) {
      console.error('[usePresence] Leave queue error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const findMatch = useCallback(async (userId: string, lang: string, tags: string[], preferences?: any) => {
    try {
      const result = await presenceService.findMatch(userId, lang, tags, preferences);
      return result;
    } catch (error) {
      console.error('[usePresence] Find match error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  return {
    isOnline,
    updatePresence,
    joinMatchQueue,
    leaveMatchQueue,
    findMatch,
  };
}
