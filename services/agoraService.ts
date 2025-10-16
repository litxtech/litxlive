export interface AgoraInitResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface AgoraTokenResponse {
  success: boolean;
  token?: string;
  expireAt?: number;
  channel?: string;
  uid?: number;
  appId?: string;
  error?: string;
}

class AgoraService {
  private channelName: string | null = null;
  private uid: number | null = null;
  private token: string | null = null;

  async initializeVideoCall(channelName: string, uid: number): Promise<AgoraInitResult> {
    try {
      console.log('[AgoraService] Initializing video call:', { channelName, uid });
      const base = process.env.EXPO_PUBLIC_API_URL ?? '';
      const url = `${base}/api/agora/rtc-token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`;
      const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AgoraService] Token fetch failed:', errorText);
        return { success: false, error: `Failed to get token: ${response.status}` };
      }
      const data: AgoraTokenResponse = await response.json();
      if (!data.token) return { success: false, error: 'No token received from server' };
      this.channelName = channelName;
      this.uid = uid;
      this.token = data.token;
      console.log('[AgoraService] Token received successfully');
      return { success: true, token: data.token };
    } catch (error: any) {
      console.error('[AgoraService] Initialize error:', error);
      return { success: false, error: error?.message ?? 'Failed to initialize video call' };
    }
  }

  async getRTCToken(channelName: string, uid: number): Promise<AgoraTokenResponse> {
    console.log('[AgoraService] getRTCToken', { channelName, uid });
    const base = process.env.EXPO_PUBLIC_API_URL ?? '';
    const url = `${base}/api/agora/rtc-token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, error: `rtc-token-failed:${res.status} ${errText}` };
    }
    const json: AgoraTokenResponse = await res.json();
    return json;
  }

  async leaveChannel(): Promise<void> {
    try {
      console.log('[AgoraService] Leaving channel');
      this.channelName = null;
      this.uid = null;
      this.token = null;
    } catch (error) {
      console.error('[AgoraService] Leave channel error:', error);
    }
  }

  async muteLocalAudio(muted: boolean): Promise<void> {
    console.log('[AgoraService] Mute audio:', muted);
  }

  async muteLocalVideo(muted: boolean): Promise<void> {
    console.log('[AgoraService] Mute video:', muted);
  }

  getChannelInfo() {
    return { channelName: this.channelName, uid: this.uid, token: this.token };
  }
}

export const agoraService = new AgoraService();
