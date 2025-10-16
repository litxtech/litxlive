import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
  };
  error?: string;
}

class AuthService {
  private log(message: string, data?: any) {
    console.log(`[AuthService] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthResponse> {
    try {
      this.log('Signing up with email', { email, displayName });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web' 
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        this.log('Sign up error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (data.user) {
        this.log('Sign up successful', data.user);
        return {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
          user: {
            id: data.user.id,
            email: data.user.email!,
            displayName: displayName,
            emailVerified: data.user.email_confirmed_at !== null,
          },
        };
      }

      return {
        success: false,
        message: 'Sign up failed',
      };
    } catch (error) {
      this.log('Sign up exception', error);
      const message = error instanceof Error ? error.message : 'Sign up failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      this.log('Signing in with email', { email });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.log('Sign in error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (data.user) {
        this.log('Sign in successful', data.user);
        return {
          success: true,
          message: 'Sign in successful',
          user: {
            id: data.user.id,
            email: data.user.email!,
            displayName: data.user.user_metadata?.display_name || data.user.email!.split('@')[0],
            emailVerified: data.user.email_confirmed_at !== null,
          },
        };
      }

      return {
        success: false,
        message: 'Sign in failed',
      };
    } catch (error) {
      this.log('Sign in exception', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    try {
      this.log('Resending verification email', { email });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        this.log('Resend verification error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      this.log('Verification email resent successfully');
      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      };
    } catch (error) {
      this.log('Resend verification exception', error);
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async signInWithOTP(email: string): Promise<AuthResponse> {
    try {
      this.log('Sending OTP to email', { email });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        this.log('OTP error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      this.log('OTP sent successfully', data);
      return {
        success: true,
        message: 'Check your email for the login link',
      };
    } catch (error) {
      this.log('OTP exception', error);
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async verifyOTP(email: string, token: string): Promise<AuthResponse> {
    try {
      this.log('Verifying OTP', { email });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        this.log('OTP verification error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (data.user) {
        this.log('OTP verification successful', data.user);
        return {
          success: true,
          message: 'Verification successful',
          user: {
            id: data.user.id,
            email: data.user.email!,
            displayName: data.user.user_metadata?.display_name || data.user.email!.split('@')[0],
            emailVerified: data.user.email_confirmed_at !== null,
          },
        };
      }

      return {
        success: false,
        message: 'Verification failed',
      };
    } catch (error) {
      this.log('OTP verification exception', error);
      const message = error instanceof Error ? error.message : 'Verification failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      this.log('Sending password reset email', { email });

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/reset-password`
        : Linking.createURL('auth/reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        this.log('Password reset error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      this.log('Password reset email sent');
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      this.log('Password reset exception', error);
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      this.log('Updating password');

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this.log('Password update error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (data.user) {
        this.log('Password updated successfully');
        return {
          success: true,
          message: 'Password updated successfully',
        };
      }

      return {
        success: false,
        message: 'Password update failed',
      };
    } catch (error) {
      this.log('Password update exception', error);
      const message = error instanceof Error ? error.message : 'Failed to update password';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      this.log('Signing out');

      if (!supabase) {
        return {
          success: true,
          message: 'Signed out (no auth service)',
        };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.log('Sign out error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      this.log('Sign out successful');
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error) {
      this.log('Sign out exception', error);
      const message = error instanceof Error ? error.message : 'Sign out failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async getCurrentUser() {
    try {
      if (!supabase) {
        this.log('Supabase not initialized');
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        this.log('Get user error', error);
        return null;
      }

      if (user) {
        return {
          id: user.id,
          email: user.email!,
          displayName: user.user_metadata?.display_name || user.email!.split('@')[0],
          emailVerified: user.email_confirmed_at !== null,
        };
      }

      return null;
    } catch (error) {
      this.log('Get user exception', error);
      return null;
    }
  }

  async getSession() {
    try {
      if (!supabase) {
        this.log('Supabase not initialized');
        return null;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        this.log('Get session error', error);
        return null;
      }

      return session;
    } catch (error) {
      this.log('Get session exception', error);
      return null;
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      this.log('Starting Google sign in');

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        this.log('Google sign in error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (Platform.OS === 'web') {
        return {
          success: true,
          message: 'Redirecting to Google...',
        };
      }

      if (data.url) {
        this.log('Opening Google auth URL', data.url);
        const WebBrowser = await import('expo-web-browser');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        if (result.type === 'success') {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            return {
              success: false,
              message: 'Failed to get session after Google sign in',
            };
          }

          return {
            success: true,
            message: 'Google sign in successful',
            user: {
              id: session.user.id,
              email: session.user.email!,
              displayName: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
              emailVerified: session.user.email_confirmed_at !== null,
            },
          };
        }

        return {
          success: false,
          message: 'Google sign in cancelled',
        };
      }

      return {
        success: false,
        message: 'Failed to start Google sign in',
      };
    } catch (error) {
      this.log('Google sign in exception', error);
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async signInWithTwitch(): Promise<AuthResponse> {
    try {
      this.log('Starting Twitch sign in');

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        this.log('Twitch sign in error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (Platform.OS === 'web') {
        return {
          success: true,
          message: 'Redirecting to Twitch...',
        };
      }

      if (data.url) {
        this.log('Opening Twitch auth URL', data.url);
        const WebBrowser = await import('expo-web-browser');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        if (result.type === 'success') {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            return {
              success: false,
              message: 'Failed to get session after Twitch sign in',
            };
          }

          return {
            success: true,
            message: 'Twitch sign in successful',
            user: {
              id: session.user.id,
              email: session.user.email!,
              displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.preferred_username || session.user.email!.split('@')[0],
              emailVerified: session.user.email_confirmed_at !== null,
            },
          };
        }

        return {
          success: false,
          message: 'Twitch sign in cancelled',
        };
      }

      return {
        success: false,
        message: 'Failed to start Twitch sign in',
      };
    } catch (error) {
      this.log('Twitch sign in exception', error);
      const message = error instanceof Error ? error.message : 'Twitch sign in failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  async signInWithTwitter(): Promise<AuthResponse> {
    try {
      this.log('Starting Twitter sign in');

      if (!supabase) {
        return {
          success: false,
          message: 'Authentication service not configured. Please check environment variables.',
          error: 'Supabase not initialized',
        };
      }

      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/auth/callback`
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        this.log('Twitter sign in error', error);
        return {
          success: false,
          message: error.message,
          error: error.message,
        };
      }

      if (Platform.OS === 'web') {
        return {
          success: true,
          message: 'Redirecting to Twitter...',
        };
      }

      if (data.url) {
        this.log('Opening Twitter auth URL', data.url);
        const WebBrowser = await import('expo-web-browser');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        if (result.type === 'success') {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            return {
              success: false,
              message: 'Failed to get session after Twitter sign in',
            };
          }

          return {
            success: true,
            message: 'Twitter sign in successful',
            user: {
              id: session.user.id,
              email: session.user.email!,
              displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.user_name || session.user.email!.split('@')[0],
              emailVerified: session.user.email_confirmed_at !== null,
            },
          };
        }

        return {
          success: false,
          message: 'Twitter sign in cancelled',
        };
      }

      return {
        success: false,
        message: 'Failed to start Twitter sign in',
      };
    } catch (error) {
      this.log('Twitter sign in exception', error);
      const message = error instanceof Error ? error.message : 'Twitter sign in failed';
      return {
        success: false,
        message,
        error: message,
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      this.log('Supabase not initialized - cannot listen to auth changes');
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      this.log('Auth state changed', { event, userId: session?.user?.id });
      callback(event, session);
    });
  }
}

export const authService = new AuthService();
export type { AuthResponse };
