import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo: errorInfo.componentStack || 'No stack trace' });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ App Error</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Unknown error'}</Text>
          <ScrollView style={styles.stack}>
            <Text style={styles.stackText}>{this.state.error?.stack || ''}</Text>
            <Text style={styles.stackText}>{this.state.errorInfo}</Text>
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: '' })}
            style={styles.button}
          >
            Try Again
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0B0E', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF5252', marginBottom: 12 },
  message: { fontSize: 16, color: '#F5EDE3', marginBottom: 16 },
  stack: { flex: 1, backgroundColor: '#1A1620', borderRadius: 8, padding: 12, marginBottom: 16 },
  stackText: { fontSize: 11, color: '#8A7F92', fontFamily: 'monospace' },
  button: { backgroundColor: '#E84855', borderRadius: 30 },
});
