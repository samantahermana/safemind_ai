// import database from '@react-native-firebase/database';

// interface AlertData {
//   app: string;
//   sender: string;
//   message: string;
//   riskLevel: number;
//   stage: string;
//   detectedAt: string;
// }

// export const sendFirebaseAlert = async (alert: AlertData): Promise<void> => {
//   try {
//     // We push to the 'alerts' node in the Realtime Database
//     await database().ref('/security_alerts').push({
//       ...alert,
//       status: 'PENDING_REVIEW',
//       priority: alert.riskLevel > 8 ? 'HIGH' : 'MEDIUM'
//     });
//   } catch (error) {
//     throw new Error(`Firebase synchronization failed: ${error}`);
//   }
// };