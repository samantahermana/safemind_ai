import {useState, useEffect, useCallback} from 'react';
import {Camera, CameraDevice, Code} from 'react-native-vision-camera';

interface UseCameraOptions {
  onCodeScanned?: (code: string) => void;
  resetDelay?: number;
}

export interface CameraError {
  type: 'NO_CAMERA' | 'PERMISSION_DENIED' | 'INIT_FAILED' | 'UNKNOWN';
  message: string;
  canRetry: boolean;
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const {onCodeScanned, resetDelay = 2000} = options;

  const [device, setDevice] = useState<CameraDevice | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar cámara
  const setupCamera = useCallback(async () => {
    try {
      console.log('📷 Inicializando cámara...');
      setIsLoading(true);
      setError(null);

      const devices = await Camera.getAvailableCameraDevices();
      console.log('📷 Dispositivos encontrados:', devices.length);

      if (devices.length === 0) {
        setError({
          type: 'NO_CAMERA',
          message: 'No se detectó ninguna cámara',
          canRetry: false,
        });
        setIsLoading(false);
        return;
      }

      const backCamera = devices.find(d => d.position === 'back');
      console.log(
        '📷 Back camera:',
        backCamera ? 'Encontrada ✅' : 'No encontrada ❌',
      );

      if (backCamera) {
        setDevice(backCamera);
        setIsActive(true);
        setError(null);
      } else {
        setError({
          type: 'NO_CAMERA',
          message: 'No se encontró cámara trasera',
          canRetry: true,
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('❌ Error al inicializar cámara:', err);

      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';

      setError({
        type: 'INIT_FAILED',
        message: `Error al inicializar: ${errorMessage}`,
        canRetry: true,
      });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      setupCamera();
    }

    // Cleanup: Desactivar cámara al desmontar
    return () => {
      console.log('🧹 Limpiando cámara...');
      mounted = false;
      setIsActive(false);
      setDevice(null);
    };
  }, [setupCamera]);

  // Manejar escaneo con auto-reset
  const handleCodeScanned = useCallback(
    (codes: Code[]) => {
      if (codes.length > 0 && isActive && !scannedCode) {
        const code = codes[0].value;
        console.log('📱 QR escaneado:', code);

        setScannedCode(code ?? null);
        setIsActive(false);

        // Callback opcional
        if (onCodeScanned && code) {
          onCodeScanned(code);
        }

        // Auto-reset después del delay
        setTimeout(() => {
          console.log('🔄 Reactivando escáner...');
          setScannedCode(null);
          setIsActive(true);
        }, resetDelay);
      }
    },
    [isActive, scannedCode, onCodeScanned, resetDelay],
  );

  // Método manual para resetear
  const reset = useCallback(() => {
    setScannedCode(null);
    setIsActive(true);
  }, []);

  // Método para reintentar setup
  const retry = useCallback(() => {
    console.log('🔄 Reintentando inicialización de cámara...');
    setupCamera();
  }, [setupCamera]);

  return {
    device,
    isActive,
    error,
    scannedCode,
    isLoading,
    handleCodeScanned,
    reset,
    retry,
  };
};
