import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '542816805960-m6dqmqk1d1d9p8fa6fdufjck1i6tptel.apps.googleusercontent.com', // Lo encuentras en la consola de Firebase > Google Provider
});

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Error", "Completa todos los campos");

    try {
      if (isRegistering) {
        await auth().createUserWithEmailAndPassword(email, password);
        Alert.alert("Éxito", "Cuenta de tutor creada");
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert("Error de Autenticación", error.message);
    }
  };
  const onGoogleButtonPress = async () => {
  try {
    // 1. Iniciar sesión en Google
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error('No se pudo obtener el token de Google');
    }
    
    // 2. Crear una credencial de Firebase con el token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    // 3. Iniciar sesión en Firebase
    await auth().signInWithCredential(googleCredential);
    onLoginSuccess();
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo iniciar sesión con Google");
  }
};

  return (
<View style={styles.container}>
      <Text style={styles.title}>SafeMind AI</Text>
      <Text style={styles.subtitle}>{isRegistering ? 'Registro de Tutor' : 'Acceso para Padres'}</Text>
      
      {/* Etiqueta para Email */}
      <Text style={styles.label}>Correo Electrónico:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="ejemplo@correo.com" 
        placeholderTextColor="#999" // Asegura que el placeholder se vea
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Etiqueta para Contraseña */}
      <Text style={styles.label}>Contraseña:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Ingresa tu contraseña" 
        placeholderTextColor="#999"
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
  style={[styles.button, { backgroundColor: '#db4437', marginTop: 10 }]} 
  onPress={onGoogleButtonPress}
>
  <Text style={styles.buttonText}>Continuar con Google</Text>
</TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.switchText}>
          {isRegistering ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 30, 
    backgroundColor: '#F5F7F9' // Fondo gris muy claro para que resalten los inputs
  },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#2c3e50', marginBottom: 5 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#7f8c8d' },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 5,
    marginLeft: 5
  },
  input: { 
    backgroundColor: '#ffffff', // Fondo blanco puro para el input
    borderWidth: 1, 
    borderColor: '#dcdde1', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20,
    color: '#000000', // TEXTO SIEMPRE NEGRO AL ESCRIBIR
    fontSize: 16,
    elevation: 2, // Sombra suave en Android
  },
  button: { 
    backgroundColor: '#2ecc71', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10,
    elevation: 3
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 25, color: '#3498db', fontWeight: '500' }
});

export default LoginScreen;