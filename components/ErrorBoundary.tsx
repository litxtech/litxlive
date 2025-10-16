import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorText?: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const text = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, errorText: text };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error:', error);
    console.error('[ErrorBoundary] Info:', info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorText: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.errorText ?? 'Unexpected error occurred.'}</Text>
          <Pressable onPress={this.handleReset} style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0f14',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
});
