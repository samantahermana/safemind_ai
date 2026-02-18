import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {styles} from '../../styles/screens/LoginScreen.styles';

GoogleSignin.configure({
  webClientId:
    '542816805960-m6dqmqk1d1d9p8fa6fdufjck1i6tptel.apps.googleusercontent.com',
});

const LoginScreen = ({onLoginSuccess}: {onLoginSuccess: () => void}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'child'>('tutor');

  const handleAuth = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Completa todos los campos');
    }

    try {
      if (isRegistering) {
        // Crear cuenta
        const userCredential = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );

        // Guardar rol en Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: email,
          role: selectedRole,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

        Alert.alert(
          'Éxito',
          `Cuenta de ${selectedRole === 'tutor' ? 'Tutor' : 'Hijo'} creada`,
        );
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Error de Autenticación', error.message);
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
      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );

      // Verificar si el usuario ya existe en Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();

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
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
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
              style={[
                styles.roleButton,
                selectedRole === 'tutor' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('tutor')}>
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'tutor' && styles.roleButtonTextActive,
                ]}>
                Tutor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'child' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('child')}>
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'child' && styles.roleButtonTextActive,
                ]}>
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
          {isRegistering
            ? `Crear Cuenta de ${selectedRole === 'tutor' ? 'Tutor' : 'Hijo'}`
            : 'Iniciar Sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={onGoogleButtonPress}>
        <Text style={styles.buttonText}>Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.switchText}>
          {isRegistering
            ? '¿Ya tienes cuenta? Ingresa'
            : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
