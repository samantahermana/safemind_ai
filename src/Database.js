import SQLite from 'react-native-sqlite-storage';

// Habilitar promesas para manejar la asincronía de forma limpia
SQLite.enablePromise(true);

const database_name = "SafeMind.db";

// 1. Obtener conexión a la base de datos
export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: database_name, location: 'default' });
};

// 2. Crear la tabla de notificaciones (si no existe)
export const createTable = async (db) => {
  const query = `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app TEXT,
        sender TEXT,
        message TEXT,
        timestamp TEXT,
        risk_score REAL DEFAULT 0.0,
        status TEXT DEFAULT 'pending'
    );`;
  await db.executeSql(query);
};

// 3. Guardar una nueva notificación capturada
export const saveNotification = async (db, notification) => {
  const insertQuery = `INSERT INTO notifications (app, sender, message, timestamp) VALUES (?, ?, ?, ?)`;
  const values = [
    notification.app,
    notification.title,
    notification.message,
    notification.timestamp
  ];
  return db.executeSql(insertQuery, values);
};

// 4. OBTENER TODAS LAS NOTIFICACIONES (El método que faltaba)
export const getNotifications = async (db) => {
  try {
    const notifications = [];
    // Ordenamos por ID descendente para ver lo más nuevo primero
    const results = await db.executeSql("SELECT * FROM notifications ORDER BY id DESC");
    
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        notifications.push(result.rows.item(index));
      }
    });
    
    return notifications;
  } catch (error) {
    console.error("Error al obtener notificaciones de la DB:", error);
    return []; // Devolvemos lista vacía para evitar que la app explote
  }
};