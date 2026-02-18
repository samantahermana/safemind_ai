import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {CameraError} from '../hooks/useCamera';
import {styles} from '../styles/components/ErrorView.styles';

interface ErrorViewProps {
  error: CameraError;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({error, onRetry}) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'NO_CAMERA':
        return '📷';
      case 'PERMISSION_DENIED':
        return '🔒';
      case 'INIT_FAILED':
        return '⚠️';
      default:
        return '❌';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{getErrorIcon()}</Text>
      <Text style={styles.title}>Error de Cámara</Text>
      <Text style={styles.message}>{error.message}</Text>

      {error.canRetry && onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      )}

      {!error.canRetry && (
        <Text style={styles.hint}>
          Por favor, verifica que tu dispositivo tenga una cámara funcional
        </Text>
      )}
    </View>
  );
};
