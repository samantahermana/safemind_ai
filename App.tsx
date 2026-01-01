import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  DeviceEventEmitter,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator, // Para el estado de carga
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth'; // Firebase Auth
import {analyzeRisk} from './src/AnalyzerAI';
import {isNoiseMessage} from './src/utils/filters';
import LoginScreen from './src/screens/LoginScreen'; // Tu nueva pantalla
import firestore from '@react-native-firebase/firestore'; // Para subir a la nube

interface NotificationData {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  isAnomalous: number;
  riskLevel: number;
  engine: string;
  groomingStage: string;
}

interface NotificationEvent {
  sender?: string;
  title?: string;
  message: string;
  app?: string;
}

const db = SQLite.openDatabase(
  {name: 'SafeMind.db', location: 'default'},
  () => {},
  error => console.log('Error opening DB: ', error),
);

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // 1. ESCUCHAR ESTADO DE AUTH
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(userState => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  // 2. CONFIGURACIÓN INICIAL (Solo si hay usuario)
  useEffect(() => {
    if (user) {
      setupDatabase();
      loadNotifications();

      const subscription = DeviceEventEmitter.addListener(
        'onNotificationReceived',
        async (event: NotificationEvent) => {
          const remitente =
            event.title || event.sender || 'Remitente Desconocido';
          const appNombre = event.app || 'App';

          if (isNoiseMessage(event.message)) return;

          await processAndSaveNotification({
            sender: `${remitente} (${appNombre})`,
            message: event.message,
          });
        },
      );

      return () => subscription.remove();
    }
  }, [user]);

  // --- LÓGICA DE BASE DE DATOS Y PROCESAMIENTO ---
  const setupDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp TEXT, isAnomalous INTEGER, riskLevel INTEGER, engine TEXT, groomingStage TEXT)',
        [],
      );
    });
  };

  const clearDatabase = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro de borrar todos los registros?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Borrar',
          onPress: () => {
            db.transaction(tx => {
              tx.executeSql('DELETE FROM messages', [], () => {
                setNotifications([]);
              });
            });
          },
        },
      ],
    );
  };

  const loadNotifications = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM messages ORDER BY id DESC',
        [],
        (_, results) => {
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setNotifications(temp);
        },
      );
    });
  };

const processAndSaveNotification = async (notif: {sender: string, message: string}) => {
  try {
    const analysis = await analyzeRisk(notif.message);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ACTUALIZACIÓN: Umbral en 4 para captar riesgos medios y altos
    if (analysis.riskLevel >= 5) {
      console.log(`⚠️ Riesgo detectado (${analysis.riskLevel}). Procesando persistencia híbrida...`);
      
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO messages (sender, message, timestamp, isAnomalous, riskLevel, engine, groomingStage) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            notif.sender, 
            notif.message, 
            timestamp, 
            analysis.isAnomalous ? 1 : 0, 
            analysis.riskLevel, 
            analysis.engine, 
            analysis.groomingStage
          ],
          () => {
            console.log('✅ 1/2: Evidencia guardada localmente (SQLite)');
            
            // Refrescamos la lista en pantalla
            loadNotifications();
            
            // SINCRONIZACIÓN CLOUD: Enviamos a Firebase para el Tutor
            syncWithFirebase(notif, analysis);
            console.log('✅ 2/2: Intento de sincronización Cloud iniciado');
          }
        );
      });
    } else {
      // Si el riesgo es 1, 2 o 3, se ignora por completo para proteger la privacidad
      console.log(`✅ Mensaje seguro (Nivel: ${analysis.riskLevel}). No se genera registro.`);
    }

  } catch (error) {
    console.error('Error crítico en el flujo de procesamiento:', error);
  }
};
  const renderItem = ({item}: {item: NotificationData}) => {
    // Definimos los rangos de riesgo
    const isHighRisk = item.riskLevel >= 7; // 7, 8, 9, 10 -> ROJO
    const isMediumRisk = item.riskLevel >= 5 && item.riskLevel < 7; // 5, 6 -> AMARILLO
    // Formatear el nombre de la app (extraer solo el nombre)
    const formatAppName = (sender: string) => {
      if (sender.includes('com.whatsapp')) return 'WhatsApp';
      if (sender.includes('com.instagram')) return 'Instagram';
      if (sender.includes('com.facebook')) return 'Facebook';
      if (sender.includes('com.snapchat')) return 'Snapchat';
      if (sender.includes('com.tiktok')) return 'TikTok';
      if (sender.includes('Musically')) return 'TikTok';
      if (sender.includes('com.telegram')) return 'Telegram';
      if (sender.includes('Client)')) return 'Roblox';
      if (sender.includes('com.roblox')) return 'Roblox';

      // Para otros casos, extraer después del último punto
      const parts = sender.split('.');
      return (
        parts[parts.length - 1].charAt(0).toUpperCase() +
        parts[parts.length - 1].slice(1)
      );
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
            {formatAppName(item.sender)}
          </Text>
          <Text style={styles.time}>{item.timestamp}</Text>
        </View>

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

  const syncWithFirebase = async (notif: any, analysis: any) => {
    if (user) {
      await firestore().collection('alerts').add({
        tutorId: user.uid,
        sender: notif.sender,
        message: notif.message,
        riskLevel: analysis.riskLevel,
        groomingStage: analysis.groomingStage,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    }
  };

  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => Alert.alert('Sesión cerrada'));
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SafeMind AI</Text>
          <Text style={styles.subtitle}>● Conectado como Tutor</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem} // (Usa tu renderItem que ya tenías)
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
  clearButton: {padding: 8, borderRadius: 8, backgroundColor: '#eee'},
  clearButtonText: {fontSize: 12, color: '#666'},
  listContent: {paddingVertical: 10},
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
  engineText: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {alignItems: 'center', marginTop: 100},
  emptyText: {fontSize: 16, color: '#bdc3c7', fontWeight: 'bold'},
  emptySubtext: {fontSize: 12, color: '#bdc3c7', marginTop: 5},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  logoutButton: {padding: 8, backgroundColor: '#fee', borderRadius: 5},
  logoutText: {color: '#e74c3c', fontSize: 12, fontWeight: 'bold'},
});

export default App;
