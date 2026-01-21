import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LoginScreen from './src/screens/auth/LoginScreen';
import RoleSelectionScreen from './src/screens/roles/RoleSelectionScreen';
import TutorMainScreen from './src/screens/tutor/TutorMainScreen';
import ChildMainScreen from './src/screens/child/ChildMainScreen';

const App = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState);
      if (userState) {
        const doc = await firestore().collection('users').doc(userState.uid).get();
        if (doc.exists) {
          const userData = doc.data();
          setRole(userData?.role || null);
        } else {
          // Si el usuario existe pero no tiene documento en Firestore, 
          // puede ser un caso excepcional, mantener role como null
          setRole(null);
        }
      } else {
        // Si no hay usuario, resetear el rol
        setRole(null);
      }
      setInitializing(false);
    });
    return subscriber;
  }, []);
    useEffect(() => {
    console.log('🚀 APP INICIADO');
  }, []);


  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <LoginScreen onLoginSuccess={() => {}} />;
  if (!role) return <RoleSelectionScreen onRoleSelected={setRole} />;
  if (role === 'tutor') return <TutorMainScreen />;
  return <ChildMainScreen />;
};

export default App;