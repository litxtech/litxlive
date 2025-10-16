import { Platform } from 'react-native';

export interface RTCConfig {
  iceServers: RTCIceServer[];
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface ConnectionState {
  status: 'idle' | 'requesting-permissions' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'closed';
  error?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onStateChange: ((state: ConnectionState) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private readonly rtcConfig: RTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  };

  private readonly defaultMediaConstraints: MediaConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };

  setStateChangeCallback(callback: (state: ConnectionState) => void) {
    this.onStateChange = callback;
  }

  private updateState(state: Partial<ConnectionState>) {
    if (this.onStateChange) {
      const currentState: ConnectionState = {
        status: state.status || 'idle',
        error: state.error,
        localStream: state.localStream || this.localStream || undefined,
        remoteStream: state.remoteStream || this.remoteStream || undefined,
      };
      this.onStateChange(currentState);
    }
  }

  async requestMediaPermissions(constraints?: MediaConstraints): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      console.log('[WebRTC] Requesting media permissions...');
      this.updateState({ status: 'requesting-permissions' });

      const mediaConstraints = constraints || this.defaultMediaConstraints;

      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return { 
            success: false, 
            error: 'getUserMedia not supported in this browser. Please use HTTPS.' 
          };
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      this.localStream = stream;
      console.log('[WebRTC] Media permissions granted');
      
      return { success: true, stream };
    } catch (error: any) {
      console.error('[WebRTC] Media permission error:', error);
      
      let errorMessage = 'Failed to access camera/microphone';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please enable in settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera/microphone found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone constraints cannot be satisfied.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Media access blocked. Please use HTTPS.';
      }

      this.updateState({ status: 'failed', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async requestAudioOnly(): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    console.log('[WebRTC] Requesting audio-only permissions...');
    return this.requestMediaPermissions({
      video: false,
      audio: this.defaultMediaConstraints.audio,
    });
  }

  async initializePeerConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[WebRTC] Initializing peer connection...');
      
      if (this.peerConnection) {
        console.log('[WebRTC] Closing existing peer connection');
        this.peerConnection.close();
      }

      this.peerConnection = new RTCPeerConnection(this.rtcConfig);

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate:', event.candidate.type);
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        console.log('[WebRTC] ICE connection state:', state);

        if (state === 'connected') {
          this.reconnectAttempts = 0;
          this.updateState({ status: 'connected' });
        } else if (state === 'disconnected' || state === 'failed') {
          this.handleConnectionFailure();
        } else if (state === 'checking') {
          this.updateState({ status: 'connecting' });
        }
      };

      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Remote track received:', event.track.kind);
        
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.updateState({ 
            status: 'connected',
            remoteStream: this.remoteStream 
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('[WebRTC] Connection state:', state);

        if (state === 'failed') {
          this.handleConnectionFailure();
        } else if (state === 'closed') {
          this.updateState({ status: 'closed' });
        }
      };

      return { success: true };
    } catch (error) {
      console.error('[WebRTC] Initialize peer connection error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async handleConnectionFailure() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebRTC] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      this.updateState({ 
        status: 'reconnecting',
        error: `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      });

      await this.restartIce();
    } else {
      console.error('[WebRTC] Max reconnect attempts reached');
      this.updateState({ 
        status: 'failed',
        error: 'Connection failed. Please try again.'
      });
    }
  }

  async restartIce() {
    try {
      if (!this.peerConnection) return;

      console.log('[WebRTC] Restarting ICE...');
      await this.peerConnection.restartIce();
    } catch (error) {
      console.error('[WebRTC] ICE restart error:', error);
    }
  }

  async createOffer(): Promise<{ success: boolean; offer?: RTCSessionDescriptionInit; error?: string }> {
    try {
      if (!this.peerConnection) {
        return { success: false, error: 'Peer connection not initialized' };
      }

      console.log('[WebRTC] Creating offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      return { success: true, offer };
    } catch (error) {
      console.error('[WebRTC] Create offer error:', error);
      return { success: false, error: String(error) };
    }
  }

  async createAnswer(): Promise<{ success: boolean; answer?: RTCSessionDescriptionInit; error?: string }> {
    try {
      if (!this.peerConnection) {
        return { success: false, error: 'Peer connection not initialized' };
      }

      console.log('[WebRTC] Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      return { success: true, answer };
    } catch (error) {
      console.error('[WebRTC] Create answer error:', error);
      return { success: false, error: String(error) };
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.peerConnection) {
        return { success: false, error: 'Peer connection not initialized' };
      }

      console.log('[WebRTC] Setting remote description...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));

      return { success: true };
    } catch (error) {
      console.error('[WebRTC] Set remote description error:', error);
      return { success: false, error: String(error) };
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.peerConnection) {
        return { success: false, error: 'Peer connection not initialized' };
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      return { success: true };
    } catch (error) {
      console.error('[WebRTC] Add ICE candidate error:', error);
      return { success: false, error: String(error) };
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log('[WebRTC] Audio', enabled ? 'enabled' : 'disabled');
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log('[WebRTC] Video', enabled ? 'enabled' : 'disabled');
    }
  }

  async switchCamera() {
    try {
      if (Platform.OS === 'web') {
        console.log('[WebRTC] Camera switching not supported on web');
        return { success: false, error: 'Not supported on web' };
      }

      if (!this.localStream) {
        return { success: false, error: 'No local stream' };
      }

      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) {
        return { success: false, error: 'No video track' };
      }

      const currentFacingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      videoTrack.stop();
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);

      console.log('[WebRTC] Camera switched to:', newFacingMode);
      return { success: true };
    } catch (error) {
      console.error('[WebRTC] Switch camera error:', error);
      return { success: false, error: String(error) };
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  cleanup() {
    console.log('[WebRTC] Cleaning up...');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.reconnectAttempts = 0;
    this.updateState({ status: 'closed' });
  }
}

export const webrtcService = new WebRTCService();
