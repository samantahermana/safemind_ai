import React from 'react';
import {View, Text, ActivityIndicator, TouchableOpacity} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {useCameraPermission} from '../../hooks/useCameraPermission';
import {useCamera} from '../../hooks/useCamera';
import {ErrorView} from '../../components/ErrorView';
import {styles} from '../../styles/screens/ChildScannerScreen.styles';

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
        style={styles.camera}
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

export default ChildScannerScreen;
