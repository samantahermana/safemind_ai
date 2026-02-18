import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'text-encoding';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';

// Handler para mensajes en segundo plano
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage.data) {
    const channelId = await notifee.createChannel({
      id: 'high_importance_channel',
      name: 'Alertas de SafeMind AI',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.displayNotification({
      title: remoteMessage.data.title,
      body: remoteMessage.data.body,
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
      data: remoteMessage.data,
    });
  }
});

// Handler para eventos de notificaciones en background
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    // Cuando el usuario toca la notificación, la app se abrirá automáticamente
    // debido al pressAction configurado en la notificación
  }
});

AppRegistry.registerComponent(appName, () => App);
