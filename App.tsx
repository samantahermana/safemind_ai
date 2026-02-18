import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LoginScreen from './src/screens/auth/LoginScreen';
import TutorMainScreen from './src/screens/tutor/TutorMainScreen';
import ChildMainScreen from './src/screens/child/ChildMainScreen';
import {styles} from './src/styles/screens/App.styles';

const App = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    console.log('🚀 APP INICIADA');
    const subscriber = auth().onAuthStateChanged(userState => {
      setUser(userState);
      setInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleResolved(true);
      return;
    }

    setRoleResolved(false);

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        doc => {
          const userData = doc.data();
          setRole(userData?.role || null);
          setRoleResolved(true);
        },
        error => {
          console.error('Error al escuchar rol de usuario:', error);
          setRole(null);
          setRoleResolved(true);
        },
      );

    return () => unsubscribe();
  }, [user]);

  if (initializing || (user && !roleResolved)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }
  if (role === 'tutor') {
    return <TutorMainScreen />;
  }
  if (role === 'child') {
    return <ChildMainScreen />;
  }
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default App;
