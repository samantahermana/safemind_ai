import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveTutorId = async (id: string) => {
  await AsyncStorage.setItem('tutorId', id);
};

export const getTutorId = async () => {
  return await AsyncStorage.getItem('tutorId');
};