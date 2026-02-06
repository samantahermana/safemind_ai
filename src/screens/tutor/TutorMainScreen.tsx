import React, {useEffect, useState} from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  NativeModules,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

interface NotificationData {
  id: number;
  sender?: string;
  appName?: string;
  message: string;
  timestamp: string;
  isAnomalous: number;
  riskLevel: number;
  engine: string;
  groomingStage: string;
  timestampRaw?: number;
  childId?: string;
  childEmail?: string;
}

const TutorMainScreen = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [linkedChildrenCount, setLinkedChildrenCount] = useState(0);
  const [archivedAlerts, setArchivedAlerts] = useState<Set<string>>(new Set());
  const user = auth().currentUser;

  // Asegurar que el tutor siempre tenga el ícono normal
  useEffect(() => {
    const setTutorMode = async () => {
      try {
        const { AppModeModule } = NativeModules;
        if (AppModeModule) {
          await AppModeModule.setTutorMode();
          console.log('👨‍💼 Modo tutor activado (ícono normal)');
        }
      } catch (error) {
        console.error('Error al establecer modo tutor:', error);
      }
    };
    setTutorMode();
  }, []);

  // Solicitar permiso y guardar FCM token para notificaciones push
  useEffect(() => {
    console.log('🚀 Iniciando configuración de notificaciones push...');
    
    const setupNotifications = async () => {
      try {
        const currentUser = auth().currentUser;
        console.log('👤 Usuario actual:', currentUser?.uid);
        
        if (!currentUser) {
          console.log('❌ No hay usuario autenticado');
          return;
        }

        const authStatus = await messaging().requestPermission();
        
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .set(
              { fcmToken: token, lastTokenUpdate: firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
        }
      } catch (error) {
        console.error('Error al configurar notificaciones:', error);
      }
    };

    setupNotifications();

    // Listener para notificaciones en primer plano
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data) {
        const channelId = await notifee.createChannel({
          id: 'high_importance_channel',
          name: 'Alertas de SafeMind AI',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        await notifee.displayNotification({
          title: typeof remoteMessage.data.title === 'string' ? remoteMessage.data.title : String(remoteMessage.data.title || ''),
          body: typeof remoteMessage.data.body === 'string' ? remoteMessage.data.body : String(remoteMessage.data.body || ''),
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'com.safemindai.MainActivity',
            },
            autoCancel: true,
            sound: 'default',
            vibrationPattern: [300, 500],
          },
        });
      }
    });

    // Handler para eventos de notificaciones cuando la app está en foreground
    const unsubscribeNotifeeEvents = notifee.onForegroundEvent(({ type, detail }) => {
      // Manejar eventos de notificaciones
    });

    return () => {
      unsubscribe();
      unsubscribeNotifeeEvents();
    };
  }, []);

  // Cargar alertas archivadas desde AsyncStorage
  useEffect(() => {
    const loadArchivedAlerts = async () => {
      try {
        const archived = await AsyncStorage.getItem('archivedAlerts');
        if (archived) {
          setArchivedAlerts(new Set(JSON.parse(archived)));
        }
      } catch (error) {
        console.error('Error al cargar alertas archivadas:', error);
      }
    };
    loadArchivedAlerts();
  }, []);

  // Escuchar hijos vinculados en tiempo real desde linkedChildren
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    console.log('👨‍👩‍👧 Escuchando hijos vinculados para tutor:', currentUser.uid);

    const unsubscribe = firestore()
      .collection('linkedChildren')
      .where('tutorId', '==', currentUser.uid)
      .where('isActive', '==', true)
      .onSnapshot(
        (snapshot) => {
          const children: any[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            children.push({ 
              id: doc.id, 
              email: data.childEmail,
              linkedAt: data.linkedAt,
              ...data 
            });
          });
          
          console.log('Hijos activos encontrados:', children.length);
          setLinkedChildren(children);
          setLinkedChildrenCount(children.length);
        },
        (error) => {
          console.error('❌ Error al escuchar linkedChildren:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  // Escuchar alertas en tiempo real
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    console.log('🔔 Iniciando listener de alertas para tutor:', user.uid);

    const unsubscribe = firestore()
      .collection('alerts')
      .where('tutorId', '==', user.uid)
      .onSnapshot(
        querySnapshot => {
          const tempAlerts: NotificationData[] = [];
          querySnapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar alertas archivadas localmente
            if (archivedAlerts.has(doc.id)) {
              return;
            }
            
            tempAlerts.push({
              id: doc.id as any,
              appName: data.appName,
              message: data.message,
              timestamp:
                data.timestamp
                  ?.toDate()
                  .toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) || 'Reciente',
              isAnomalous: data.riskLevel >= 7 ? 1 : 0,
              riskLevel: data.riskLevel,
              engine: 'AI-Cloud',
              groomingStage: data.groomingStage || 'Analizando',
              timestampRaw: data.timestamp?.toMillis() || Date.now(),
              childId: data.childId,
              childEmail: data.childEmail,
            });
          });
          tempAlerts.sort((a, b) => (b.timestampRaw || 0) - (a.timestampRaw || 0));
          setNotifications(tempAlerts);
        },
        error => {
          console.error('❌ Error al leer alertas de Firestore:', error);
        },
      );

    return () => unsubscribe();
  }, [archivedAlerts]);

  // Guardar FCM Token
  useEffect(() => {
    const saveFcmToken = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

      if (enabled) {
        const token = await messaging().getToken();
        const uid = auth().currentUser?.uid;

        if (uid) {
          await firestore().collection('users').doc(uid).set({
            fcmToken: token,
            lastActive: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
    };

    saveFcmToken();
  }, []);

  const renderItem = ({item}: {item: NotificationData}) => {
    const isHighRisk = item.riskLevel >= 7;
    const isMediumRisk = item.riskLevel >= 5 && item.riskLevel < 7;

    const formatAppName = (appName: string | undefined) => {
      if (!appName) return 'Sistema';
      
      if (appName.includes('com.whatsapp')) return 'WhatsApp';
      if (appName.includes('com.instagram')) return 'Instagram';
      if (appName.includes('com.facebook')) return 'Facebook';
      if (appName.includes('com.snapchat')) return 'Snapchat';
      if (appName.includes('com.tiktok')) return 'TikTok';
      if (appName.includes('Musically')) return 'TikTok';
      if (appName.includes('com.telegram')) return 'Telegram';
      if (appName.includes('com.roblox')) return 'Roblox';
      if (appName.includes('roblox')) return 'Roblox';
      
      const parts = appName.split('.');
      return (
        parts[parts.length - 1].charAt(0).toUpperCase() +
        parts[parts.length - 1].slice(1)
      );
    };

    const getChildName = (email: string | undefined) => {
      if (!email) return 'Desconocido';
      const name = email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    return (
      <View
        style={[
          styles.card,
          isHighRisk && styles.highRiskCard,
          isMediumRisk && styles.mediumRiskCard,
        ]}>
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.sender,
              isHighRisk && styles.highRiskText,
              isMediumRisk && styles.mediumRiskText,
            ]}>
            {isHighRisk ? '🚨 ' : '⚠️ '}
            {formatAppName(item.appName ? item.appName : item.sender)}
          </Text>
          <Text style={styles.time}>{item.timestamp}</Text>
        </View>

        {item.childEmail && (
          <View style={styles.childBadgeInAlert}>
            <Text style={styles.childBadgeInAlertText}>{getChildName(item.childEmail)}</Text>
          </View>
        )}

        <Text style={[styles.message, isHighRisk && styles.highRiskText]}>
          {item.message}
        </Text>

        <View
          style={[
            styles.riskBadge,
            isMediumRisk && {backgroundColor: '#f1c40f'},
          ]}>
          <Text style={styles.riskBadgeText}>
            NIVEL {item.riskLevel} | {item.groomingStage.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => Alert.alert('Sesión cerrada'));
  };

  const handleClearAlerts = async () => {
    Alert.alert(
      'Archivar Alertas',
      '¿Deseas archivar todas las alertas visibles? (Se mantendrán como evidencia en Firestore)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (!user) return;

              // Obtener IDs de todas las alertas actuales
              const alertIds = notifications.map(alert => alert.id.toString());
              
              // Actualizar en Firestore
              const batch = firestore().batch();
              alertIds.forEach(alertId => {
                const alertRef = firestore().collection('alerts').doc(alertId);
                batch.update(alertRef, { 
                  archived: true, 
                  archivedAt: firestore.FieldValue.serverTimestamp() 
                });
              });
              
              await batch.commit();
              
              // Actualizar AsyncStorage local
              const newArchivedSet = new Set([...Array.from(archivedAlerts), ...alertIds]);
              await AsyncStorage.setItem('archivedAlerts', JSON.stringify(Array.from(newArchivedSet)));
              setArchivedAlerts(newArchivedSet);
              
              Alert.alert('Éxito', `${alertIds.length} alertas archivadas (evidencia preservada en Firebase)`);
            } catch (error) {
              console.error('Error al archivar alertas:', error);
              Alert.alert('Error', 'No se pudieron archivar las alertas');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SafeMind AI</Text>
          <Text style={styles.subtitle}>● Conectado como Tutor</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)} 
            style={styles.qrHeaderButton}
          >
            <Text style={{ fontSize: 20 }}>📱</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleClearAlerts} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vincular Hijo</Text>
            <Text style={styles.modalSub}>Escaneá este código desde el celular del menor</Text>
            
            <View style={styles.qrWrapper}>
              {user && (
                <QRCode value={user.uid} size={200} />
              )}
            </View>
            
            <Text style={styles.uidText}>ID: {user?.uid.substring(0, 10)}...</Text>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.dashboardContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{linkedChildrenCount}</Text>
          <Text style={styles.statLabel}>Dispositivos Vinculados</Text>
        </View>
        
        <View style={styles.childrenList}>
          <Text style={styles.listTitle}>Dispositivos Activos:</Text>
          {linkedChildren.length === 0 ? (
            <Text style={styles.noChildrenText}>Esperando vinculación...</Text>
          ) : (
            linkedChildren.map(child => (
              <View key={child.id} style={styles.childBadge}>
                <Text style={styles.childBadgeText}>📱 {child.email?.split('@')[0] || 'Dispositivo'}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sin alertas críticas.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  title: {fontSize: 22, fontWeight: 'bold', color: '#1a1a1a'},
  subtitle: {fontSize: 12, color: '#2ecc71', fontWeight: 'bold', marginTop: 2},
  card: {
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },
  highRiskCard: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 6,
    borderLeftColor: '#e74c3c',
  },
  mediumRiskCard: {
    backgroundColor: '#fffdf0',
    borderLeftWidth: 6,
    borderLeftColor: '#f1c40f',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sender: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  highRiskText: {color: '#c0392b'},
  mediumRiskText: {color: '#967117'},
  time: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  message: {
    fontSize: 15,
    color: '#2d3436',
    lineHeight: 22,
    marginBottom: 8,
  },
  riskBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {alignItems: 'center', marginTop: 100},
  emptyText: {fontSize: 16, color: '#bdc3c7', fontWeight: 'bold'},
  logoutButton: {padding: 8, backgroundColor: '#fee', borderRadius: 5},
  logoutText: {color: '#e74c3c', fontSize: 12, fontWeight: 'bold'},
  clearButton: {
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginRight: 10,
  },
  clearButtonText: {
    fontSize: 18,
  },
  qrHeaderButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  modalSub: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginVertical: 10 },
  qrWrapper: { padding: 15, backgroundColor: 'white', marginVertical: 20 },
  uidText: { fontSize: 10, color: '#bdc3c7', marginBottom: 20 },
  closeButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  dashboardContainer: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  statCard: {
    alignItems: 'center',
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#3498db' },
  statLabel: { fontSize: 10, color: '#7f8c8d', fontWeight: 'bold' },
  childrenList: { flex: 1, paddingLeft: 15 },
  listTitle: { fontSize: 12, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  childBadge: {
    backgroundColor: '#ebf5ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  childBadgeText: { fontSize: 11, color: '#3498db', fontWeight: 'bold' },
  childBadgeInAlert: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#81c784',
  },
  childBadgeInAlertText: { 
    fontSize: 11, 
    color: '#2e7d32', 
    fontWeight: 'bold' 
  },
  noChildrenText: { fontSize: 11, color: '#bdc3c7', fontStyle: 'italic' },
});

export default TutorMainScreen;
