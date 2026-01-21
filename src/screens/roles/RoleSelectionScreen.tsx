import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface RoleSelectionScreenProps {
  onRoleSelected: (role: string) => void;
}

const RoleSelectionScreen = ({ onRoleSelected }: RoleSelectionScreenProps) => {
  const saveRole = async (selectedRole: string) => {
    const user = auth().currentUser;
    if (user) {
      await firestore().collection('users').doc(user.uid).set({
        role: selectedRole,
        email: user.email,
        createdAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      onRoleSelected(selectedRole);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeMind AI</Text>
      <Text style={styles.subtitle}>Completa tu perfil</Text>
      <Text style={styles.description}>Selecciona tu rol para continuar usando la aplicación</Text>

      <TouchableOpacity 
        style={[styles.button, styles.tutorButton]} 
        onPress={() => saveRole('tutor')}
      >
        <Text style={styles.buttonText}>👨‍👩‍👧 Soy el Tutor (Padre/Madre)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.childButton]} 
        onPress={() => saveRole('child')}
      >
        <Text style={styles.buttonText}>👶 Soy el Menor (Hijo/a)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  subtitle: { fontSize: 20, color: '#34495e', marginBottom: 10, fontWeight: '600' },
  description: { fontSize: 16, color: '#7f8c8d', marginBottom: 40, textAlign: 'center' },
  button: { width: '80%', padding: 20, borderRadius: 12, marginVertical: 10, alignItems: 'center' },
  tutorButton: { backgroundColor: '#3498db' },
  childButton: { backgroundColor: '#2ecc71' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' }
});

export default RoleSelectionScreen;