import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '542816805960-m6dqmqk1d1d9p8fa6fdufjck1i6tptel.apps.googleusercontent.com',
});

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'child'>('tutor');

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Error", "Completa todos los campos");

    try {
      if (isRegistering) {
        // Crear cuenta
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        
        // Guardar rol en Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: email,
          role: selectedRole,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        
        Alert.alert("Éxito", `Cuenta de ${selectedRole === 'tutor' ? 'Tutor' : 'Hijo'} creada`);
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
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error('No se pudo obtener el token de Google');
      }
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // Verificar si el usuario ya existe en Firestore
      const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        // Si es nuevo, guardar con rol seleccionado
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          role: selectedRole,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      
      onLoginSuccess();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo iniciar sesión con Google");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeMind AI</Text>
      <Text style={styles.subtitle}>
        {isRegistering 
          ? `Registro de ${selectedRole === 'tutor' ? 'Tutor' : 'Hijo'}` 
          : 'Iniciar Sesión'}
      </Text>
      
      {/* Selector de Rol (solo visible en registro) */}
      {isRegistering && (
        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>Selecciona tu rol:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'tutor' && styles.roleButtonActive]}
              onPress={() => setSelectedRole('tutor')}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'tutor' && styles.roleButtonTextActive]}>
                Tutor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, selectedRole === 'child' && styles.roleButtonActive]}
              onPress={() => setSelectedRole('child')}
            >
              <Text style={[styles.roleButtonText, selectedRole === 'child' && styles.roleButtonTextActive]}>
                Hijo/a
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.label}>Correo Electrónico:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="ejemplo@correo.com" 
        placeholderTextColor="#999"
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

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
        <Text style={styles.buttonText}>
          {isRegistering ? `Crear Cuenta de ${selectedRole === 'tutor' ? 'Tutor' : 'Hijo'}` : 'Iniciar Sesión'}
        </Text>
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
    backgroundColor: '#F5F7F9'
  },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#2c3e50', marginBottom: 5 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#7f8c8d' },
  roleSelector: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dcdde1',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#2ecc71',
    backgroundColor: '#d5f4e6',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 5,
    marginLeft: 5
  },
  input: { 
    backgroundColor: '#ffffff',
    borderWidth: 1, 
    borderColor: '#dcdde1', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20,
    color: '#000000',
    fontSize: 16,
    elevation: 2,
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