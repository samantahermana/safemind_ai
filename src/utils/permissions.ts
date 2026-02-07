import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export async function requestCameraPermission(): Promise<boolean> {
  try {
    // Primero verifica el estado actual
    const currentStatus = await Camera.getCameraPermissionStatus();
    console.log('Estado actual del permiso:', currentStatus);
    
    if (currentStatus === 'granted') {
      return true;
    }
    
    if (currentStatus === 'denied') {
      // Intenta solicitar el permiso
      const newStatus = await Camera.requestCameraPermission();
      console.log('Nuevo estado del permiso:', newStatus);
      
      if (newStatus === 'granted') {
        return true;
      }
      
      if (newStatus === 'denied') {
        Alert.alert(
          'Permiso Denegado',
          'Necesitas habilitar el permiso de cámara en Configuración de la aplicación',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    }
    
    if (currentStatus === 'not-determined') {
      const newStatus = await Camera.requestCameraPermission();
      console.log('Permiso solicitado, nuevo estado:', newStatus);
      return newStatus === 'granted';
    }
    
    return false;
  } catch (err) {
    console.error('Error al solicitar permiso de cámara:', err);
    Alert.alert('Error', 'Hubo un problema al solicitar el permiso de cámara');
    return false;
  }
}

export async function checkCameraPermission(): Promise<boolean> {
  const cameraPermission = await Camera.getCameraPermissionStatus();
  return cameraPermission === 'granted';
}