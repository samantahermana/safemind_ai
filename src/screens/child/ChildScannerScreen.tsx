import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {useCameraPermission} from '../../hooks/useCameraPermission';
import {useCamera} from '../../hooks/useCamera';
import {ErrorView} from '../../components/ErrorView';

const ChildScannerScreen = () => {
  const {hasPermission, isChecking, retry} = useCameraPermission();

  // Mientras verifica permisos
  if (isChecking || hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Verificando permisos...</Text>
      </View>
    );
  }

  // Si no hay permiso
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.text}>Permiso de cámara denegado</Text>
        <Text style={styles.subtext}>
          SafeMind necesita acceso a la cámara para escanear códigos QR
        </Text>
        <TouchableOpacity style={styles.button} onPress={retry}>
          <Text style={styles.buttonText}>Solicitar permiso nuevamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cuando tiene permiso, renderiza la cámara
  return <CameraView />;
};

// Componente de cámara con hooks limpios
const CameraView = () => {
  const {
    device,
    isActive,
    error,
    scannedCode,
    isLoading,
    handleCodeScanned,
    retry,
  } = useCamera({
    onCodeScanned: code => {
      // Aquí procesas el código QR
      console.log('✅ Código procesado:', code);
      // TODO: Navegar o vincular con tutor
    },
    resetDelay: 2000, // Tiempo antes de poder escanear otro QR
  });

  // Si hay error, mostrar ErrorView
  if (error) {
    return <ErrorView error={error} onRetry={retry} />;
  }

  // Mientras carga la cámara
  if (isLoading || !device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Inicializando cámara...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={{
          codeTypes: ['qr'],
          onCodeScanned: handleCodeScanned,
        }}
      />
      <View style={styles.overlay}>
        <View
          style={[
            styles.overlayContent,
            scannedCode ? styles.overlaySuccess : null,
          ]}>
          <Text style={styles.overlayText}>
            {scannedCode
              ? '✅ Código escaneado!'
              : '📱 Escanea el código QR del tutor'}
          </Text>
        </View>
      </View>

      {/* Marcador de escaneo */}
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  overlaySuccess: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  scanFrame: {
    position: 'absolute',
    width: 250,
    height: 250,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
});

export default ChildScannerScreen;
