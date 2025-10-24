import { useState, useCallback } from 'react';

export function useAgora() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const joinChannel = useCallback(async (channelId: string) => {
    try {
      console.log('[useAgora] Joining channel:', channelId);
      setIsConnected(true);
      return { success: true };
    } catch (error) {
      console.error('[useAgora] Join channel error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    try {
      console.log('[useAgora] Leaving channel');
      setIsConnected(false);
      return { success: true };
    } catch (error) {
      console.error('[useAgora] Leave channel error:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    console.log('[useAgora] Toggle mute:', !isMuted);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    setIsVideoOff(!isVideoOff);
    console.log('[useAgora] Toggle video:', !isVideoOff);
  }, [isVideoOff]);

  return {
    isConnected,
    isMuted,
    isVideoOff,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleVideo,
  };
}
