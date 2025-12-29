import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { analyzeRisk } from './src/AnalyzerAI';

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
  { name: 'SafeMind.db', location: 'default' },
  () => {},
  error => console.log('Error opening DB: ', error)
);

const App = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    setupDatabase();
    loadNotifications();

    const subscription = DeviceEventEmitter.addListener(
      'onNotificationReceived',
      async (event: NotificationEvent) => {
        // CORRECCIÓN: Priorizar 'title' que es donde Android suele enviar el nombre del remitente
        const remitente = event.title || event.sender || "Remitente Desconocido";
        const appNombre = event.app || "App";
        
        console.log(`📩 Recibido de: ${remitente} | App: ${appNombre}`);
        
        await processAndSaveNotification({
          sender: `${remitente} (${appNombre})`,
          message: event.message
        });
      }
    );

    return () => subscription.remove();
  }, []);

  const setupDatabase = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, message TEXT, timestamp TEXT, isAnomalous INTEGER, riskLevel INTEGER, engine TEXT, groomingStage TEXT)',
        []
      );
    });
  };

  const clearDatabase = () => {
    Alert.alert("Limpiar Historial", "¿Estás seguro de borrar todos los registros?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", onPress: () => {
          db.transaction(tx => {
            tx.executeSql('DELETE FROM messages', [], () => {
              setNotifications([]);
            });
          });
        }
      }
    ]);
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
        }
      );
    });
  };

  const processAndSaveNotification = async (notif: {sender: string, message: string}) => {
    try {
      const analysis = await analyzeRisk(notif.message);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO messages (sender, message, timestamp, isAnomalous, riskLevel, engine, groomingStage) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [notif.sender, notif.message, timestamp, analysis.isAnomalous ? 1 : 0, analysis.riskLevel, analysis.engine, analysis.groomingStage],
          () => {
            console.log('✅ IA Proceso completado');
            loadNotifications();
          }
        );
      });
    } catch (error) {
      console.error('Error procesando notificación:', error);
    }
  };

  const renderItem = ({ item }: { item: NotificationData }) => {
    // Lógica de colores por niveles
    const isHighRisk = item.riskLevel >= 7;
    const isMediumRisk = item.riskLevel >= 4 && item.riskLevel < 7;

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
      return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    };

    return (
      <View style={[
        styles.card, 
        isHighRisk && styles.highRiskCard,
        isMediumRisk && styles.mediumRiskCard
      ]}>
        <View style={styles.cardHeader}>
          <Text style={[
            styles.sender, 
            isHighRisk && styles.highRiskText,
            isMediumRisk && styles.mediumRiskText
          ]}>
            {(isHighRisk || isMediumRisk) ? '⚠️ ' : ''}{formatAppName(item.sender)}
          </Text>
          <Text style={styles.time}>{item.timestamp}</Text>
        </View>
        
        <Text style={[
          styles.message, 
          isHighRisk && styles.highRiskText
        ]}>
          {item.message}
        </Text>

        {(isHighRisk || isMediumRisk) && (
          <View style={[styles.riskBadge, isMediumRisk && { backgroundColor: '#f1c40f' }]}>
            <Text style={styles.riskBadgeText}>
             NIVEL {item.riskLevel} |  {item.groomingStage} 
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SafeMind AI</Text>
          <Text style={styles.subtitle}>● Monitoreo en Tiempo Real</Text>
        </View>
        <TouchableOpacity onPress={clearDatabase} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay actividad detectada.</Text>
            <Text style={styles.emptySubtext}>Los mensajes aparecerán aquí al recibirse.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 12, color: '#2ecc71', fontWeight: 'bold', marginTop: 2 },
  clearButton: { padding: 8, borderRadius: 8, backgroundColor: '#eee' },
  clearButtonText: { fontSize: 12, color: '#666' },
  listContent: { paddingVertical: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 10 
  },
  sender: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#333',
    flex: 1
  },
  highRiskText: { color: '#c0392b' },
  mediumRiskText: { color: '#967117' },
  time: { 
    fontSize: 11, 
    color: '#999',
    marginLeft: 8
  },
  message: { 
    fontSize: 15, 
    color: '#2d3436', 
    lineHeight: 22,
    marginBottom: 8
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
    letterSpacing: 0.5
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#bdc3c7', fontWeight: 'bold' },
  emptySubtext: { fontSize: 12, color: '#bdc3c7', marginTop: 5 },
});

export default App;