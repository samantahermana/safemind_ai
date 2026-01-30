import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'text-encoding';
import messaging from '@react-native-firebase/messaging';

// Handler para mensajes en segundo plano
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Mensaje recibido en segundo plano:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
