import {useState, useEffect} from 'react';
import {
  requestCameraPermission,
  checkCameraPermission,
} from '../utils/permissions';

export const useCameraPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      try {
        const hasIt = await checkCameraPermission();
        console.log('🟡 Permiso actual:', hasIt);

        if (mounted) {
          if (!hasIt) {
            const permission = await requestCameraPermission();
            console.log('🟢 Permiso solicitado:', permission);
            setHasPermission(permission);
          } else {
            setHasPermission(true);
          }
          setIsChecking(false);
        }
      } catch (error) {
        console.error('❌ Error verificando permisos:', error);
        if (mounted) {
          setHasPermission(false);
          setIsChecking(false);
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const retry = async () => {
    console.log('🔄 Reintentando...');
    setIsChecking(true);
    const permission = await requestCameraPermission();
    console.log('🟢 Permiso obtenido (retry):', permission);
    setHasPermission(permission);
    setIsChecking(false);
  };

  return {hasPermission, isChecking, retry};
};
