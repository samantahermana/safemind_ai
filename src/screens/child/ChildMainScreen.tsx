import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter, ActivityIndicator, TouchableOpacity, Alert, Linking, NativeModules } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { analyzeRisk } from '../../ai/AnalyzerAI';
import { isNoiseMessage } from '../../utils/filters';
import { requestCameraPermission, checkCameraPermission } from '../../utils/permissions';

const ChildMainScreen = () => {
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  // 1. Verificar vinculación al iniciar
  useEffect(() => {
    const initialize = async () => {
      console.log('👶 Inicializando ChildMainScreen...');
      const id = await AsyncStorage.getItem('tutorId');
      setTutorId(id);
      setLoading(false);
      
      // Verificar permiso de notificaciones al iniciar
      checkNotificationPermission();
    };
    initialize();

    // Verificar permiso cuando la app se activa
    const checkPermissionInterval = setInterval(() => {
      checkNotificationStatus();
    }, 2000);

    return () => clearInterval(checkPermissionInterval);
  }, []);

  // Verificar y solicitar permiso de notificaciones
  const checkNotificationPermission = async () => {
    try {
      const hasAskedBefore = await AsyncStorage.getItem('hasAskedNotificationPermission');
      
      if (!hasAskedBefore) {
        Alert.alert(
          '🔔 Permiso Requerido',
          'SafeMind AI necesita acceso para LEER las notificaciones de otras aplicaciones (WhatsApp, Instagram, etc.) en tu dispositivo para protegerte.\n\n⚠️ NO se trata de notificaciones de SafeMind AI.\n\nDebes activar "SafeMind AI" en la lista de servicios con acceso a notificaciones.',
          [
            {
              text: 'Abrir Configuración',
              onPress: async () => {
                await AsyncStorage.setItem('hasAskedNotificationPermission', 'true');
                openNotificationSettings();
                // Después de 3 segundos, preguntar si activó el permiso
                setTimeout(() => {
                  Alert.alert(
                    'Confirmación',
                    '¿Activaste "SafeMind AI" en la lista de servicios de notificación?',
                    [
                      {
                        text: 'Todavía no',
                        style: 'cancel',
                        onPress: () => setNotificationPermissionGranted(false)
                      },
                      {
                        text: 'Sí, lo activé',
                        onPress: async () => {
                          // Verificar inmediatamente con el módulo nativo
                          checkNotificationStatus();
                        }
                      }
                    ]
                  );
                }, 3000);
              }
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error al verificar permiso de notificaciones:', error);
    }
  };

  const openNotificationSettings = async () => {
    try {
      // Intent específico para Notification Listener Settings
      await Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
    } catch (error) {
      console.error('Error al abrir configuración con sendIntent:', error);
      // Fallback: intentar con openURL
      try {
        await Linking.openURL('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
      } catch (error2) {
        console.error('Error al abrir configuración con openURL:', error2);
        Alert.alert(
          'Configuración Manual',
          'Por favor, ve a:\n\nConfiguración → Aplicaciones → Permisos especiales → Acceso a notificaciones → Servicios del Sistema → Activar',
          [{ text: 'Entendido' }]
        );
      }
    }
  };

  // Verificar el estado del permiso (usando módulo nativo)
  const checkNotificationStatus = async () => {
    try {
      const { NotificationPermissionModule } = NativeModules;
      if (NotificationPermissionModule) {
        const isEnabled = await NotificationPermissionModule.isNotificationListenerEnabled();
        setNotificationPermissionGranted(isEnabled);
        
        // Actualizar AsyncStorage para consistencia
        await AsyncStorage.setItem('notificationPermissionConfirmed', isEnabled ? 'true' : 'false');
      }
    } catch (error) {
      console.error('Error al verificar estado del permiso:', error);
    }
  };

  // 2. Activar Escucha de Notificaciones (Solo si está vinculado)
  useEffect(() => {
    if (tutorId) {
      console.log('👂 Iniciando listener de notificaciones...');
      const subscription = DeviceEventEmitter.addListener(
        'onNotificationReceived',
        async (event) => {
          console.log('📩 Notificación capturada:', event);
          
          if (isNoiseMessage(event.message)) {
            console.log('🗑️ Mensaje de ruido descartado');
            return;
          }
          
          console.log('🔍 Analizando riesgo...');
          const analysis = await analyzeRisk(event.message);
          console.log('📊 Análisis completado:', analysis);
          
          if (analysis.riskLevel >= 5) {
            const currentUser = auth().currentUser;
            console.log('⚠️ Creando alerta en Firestore...');
            
            await firestore().collection('alerts').add({
              tutorId: tutorId,
              childId: currentUser?.uid || 'unknown',
              childEmail: currentUser?.email || 'unknown',
              sender: event.title || 'Desconocido',
              appName: event.app || 'Sistema',
              message: event.message,
              riskLevel: analysis.riskLevel,
              groomingStage: analysis.groomingStage,
              timestamp: firestore.FieldValue.serverTimestamp(),
            });
            
            console.log('✅ Alerta creada exitosamente');
          } else {
            console.log(`ℹ️ Riesgo bajo (${analysis.riskLevel}), no se crea alerta`);
          }
        }
      );
      return () => subscription.remove();
    }
  }, [tutorId]);

  const handleStartScanning = async () => {
    console.log('👶 Iniciando escaneo...');
    const permission = await requestCameraPermission();
    console.log('👶 Permiso obtenido:', permission);
    setHasPermission(permission);
    if (permission) {
      setShowScanner(true);
    }
  };

  const handleUnlink = async () => {
    Alert.alert(
      'Desvincular Dispositivo',
      '¿Estás seguro que deseas desvincular este dispositivo del tutor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            const currentUser = auth().currentUser;
            
            // 1. Remover de AsyncStorage
            await AsyncStorage.removeItem('tutorId');
            
            // 2. Marcar como inactivo en Firestore
            if (currentUser) {
              await firestore()
                .collection('linkedChildren')
                .doc(currentUser.uid)
                .update({ isActive: false });
            }
            
            setTutorId(null);
            setShowScanner(false);
            setHasPermission(false);
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            // NO borrar tutorId - mantener vinculación
            // await AsyncStorage.removeItem('tutorId'); // 👈 COMENTAR O ELIMINAR ESTA LÍNEA
            await auth().signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.center} />;
  }

  // --- VISTA A: PANTALLA DE BIENVENIDA (Si no hay vínculo y no está escaneando) ---
  if (!tutorId && !showScanner) {
    return (
      <View style={styles.welcomeContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>

        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeEmoji}>👶</Text>
          <Text style={styles.welcomeTitle}>¡Bienvenido a SafeMind AI!</Text>
          <Text style={styles.welcomeSubtitle}>
            Para activar la protección, necesitas vincular este dispositivo con tu tutor
          </Text>
          
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
            <Text style={styles.instructionStep}>1. Pide a tu padre/madre que abra la app</Text>
            <Text style={styles.instructionStep}>2. Presiona "Escanear código QR"</Text>
            <Text style={styles.instructionStep}>3. Apunta la cámara al código QR</Text>
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={handleStartScanning}>
            <Text style={styles.scanButtonText}>📷 Escanear Código QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- VISTA B: ESCÁNER (Si no hay vínculo pero inició el escaneo) ---
  if (!tutorId && showScanner) {
    if (!hasPermission) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Permiso de cámara denegado</Text>
          <Text style={styles.errorSubtext}>Ve a Configuración para habilitar el permiso</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleStartScanning}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowScanner(false)}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return <QRScannerView 
      onScanned={async (scannedId) => {
        console.log('📱 Vinculando con tutor:', scannedId);
        
        // 1. Guardar en AsyncStorage (local)
        await AsyncStorage.setItem('tutorId', scannedId);
        
        // 2. Guardar en Firestore (sincronizado)
        const currentUser = auth().currentUser;
        if (currentUser) {
          await firestore()
            .collection('linkedChildren')
            .doc(currentUser.uid)
            .set({
              tutorId: scannedId,
              childEmail: currentUser.email,
              linkedAt: firestore.FieldValue.serverTimestamp(),
              isActive: true,
            });
          
          console.log('✅ Vinculación guardada en Firestore');
          
          // 3. Cambiar al modo hijo (ícono camuflado)
          try {
            const { AppModeModule } = NativeModules;
            if (AppModeModule) {
              await AppModeModule.setChildMode();
              console.log('🎭 Modo hijo activado (ícono camuflado)');
            }
          } catch (error) {
            console.error('Error al cambiar modo:', error);
          }
          
          // Mensaje discreto de configuración completada
          Alert.alert(
            'Configuración Completada',
            'Los servicios del sistema se han configurado correctamente.',
            [{ text: 'OK' }]
          );
        }
        
        setTutorId(scannedId);
        setShowScanner(false);
      }}
      onCancel={() => setShowScanner(false)}
    />;
  }

  // --- VISTA C: ESCUDO (Si ya está vinculado) ---
  return (
    <View style={styles.shieldContainer}>
      <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>

      <View style={styles.iconCircle}>
        <Text style={{fontSize: 60}}>🛡️</Text>
      </View>
      <Text style={styles.shieldTitle}>SafeMind AI Activado</Text>
      <Text style={styles.shieldStatus}>Protegiendo este dispositivo en tiempo real</Text>
      
      <View style={styles.linkedBadge}>
        <Text style={styles.linkedText}>Vinculado con: {tutorId?.substring(0, 8)}...</Text>
      </View>

      {/* Indicador de permiso de notificaciones */}
      <View style={[styles.permissionBadge, notificationPermissionGranted ? styles.permissionGranted : styles.permissionDenied]}>
        <Text style={styles.permissionIcon}>{notificationPermissionGranted ? '✅' : '⚠️'}</Text>
        <View style={styles.permissionTextContainer}>
          <Text style={styles.permissionTitle}>
            {notificationPermissionGranted ? 'Acceso a Notificaciones del Sistema Activo' : 'Acceso a Notificaciones del Sistema Requerido'}
          </Text>
          <Text style={styles.permissionSubtitle}>
            {notificationPermissionGranted ? 'Monitoreando WhatsApp, Instagram, etc.' : 'Necesario para leer notificaciones de otras apps'}
          </Text>
          {!notificationPermissionGranted && (
            <TouchableOpacity onPress={openNotificationSettings}>
              <Text style={styles.permissionAction}>🔧 Activar Ahora</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.unlinkButton} onPress={handleUnlink}>
          <Text style={styles.unlinkButtonText}>🔗 Desvincular Dispositivo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente separado para el escáner QR
const QRScannerView = ({ onScanned, onCancel }: { onScanned: (id: string) => void; onCancel: () => void }) => {
  const [device, setDevice] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      console.log('📷 Configurando cámara...');
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        console.log('❌ No hay permiso de cámara');
        return;
      }

      const devices = await Camera.getAvailableCameraDevices();
      const backCamera = devices.find((d) => d.position === 'back');
      console.log('📷 Cámara trasera encontrada:', !!backCamera);
      
      if (backCamera) {
        setDevice(backCamera);
        setIsActive(true);
      }
    }
    setupCamera();
  }, []);

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.scanSub}>Inicializando cámara...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.scanTitle}>Vincular con Tutor</Text>
        <Text style={styles.scanSub}>Apunta al código QR en el celular de tu padre/madre</Text>
        
        <TouchableOpacity style={styles.cancelScanButton} onPress={onCancel}>
          <Text style={styles.cancelScanButtonText}>✕ Cancelar</Text>
        </TouchableOpacity>
      </View>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={{
          codeTypes: ['qr'],
          onCodeScanned: (codes) => {
            if (codes.length > 0 && codes[0].value && isActive) {
              console.log('📱 QR escaneado:', codes[0].value);
              setIsActive(false);
              onScanned(codes[0].value);
            }
          },
        }}
      />
      <View style={styles.scannerFrame} />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f9ff' },
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { position: 'absolute', top: 60, width: '100%', zIndex: 1, alignItems: 'center', padding: 20 },
  scanTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  scanSub: { color: 'white', textAlign: 'center', marginTop: 10 },
  cancelScanButton: {
    marginTop: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelScanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scannerFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '35%',
    borderWidth: 2,
    borderColor: '#2ecc71',
    borderRadius: 20,
    backgroundColor: 'transparent'
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  instructionsBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 30,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 15,
  },
  instructionStep: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shieldContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 20 },
  menuButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  menuIcon: {
    fontSize: 28,
    color: '#34495e',
    fontWeight: 'bold',
  },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  shieldTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginTop: 30 },
  shieldStatus: { fontSize: 16, color: '#7f8c8d', marginTop: 10, textAlign: 'center' },
  linkedBadge: { marginTop: 40, padding: 10, backgroundColor: '#d1fae5', borderRadius: 20 },
  linkedText: { color: '#065f46', fontSize: 12, fontWeight: 'bold' },
  permissionBadge: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  permissionGranted: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  permissionDenied: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  permissionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  permissionAction: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  permissionDeactivate: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  unlinkButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  unlinkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold', marginBottom: 10 },
  errorSubtext: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
});

export default ChildMainScreen;