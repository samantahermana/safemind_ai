import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendriskalert = onDocumentCreated("alerts/{alertId}", async (event) => {
  const newValue = event.data?.data();
  if (!newValue) return null;

  const riskLevel: number = newValue.riskLevel;
  const tutorId: string = newValue.tutorId;
  const childEmail: string = newValue.childEmail || "Hijo";
  const sender: string = newValue.sender || "Desconocido";
  const groomingStage: string = newValue.groomingStage || "";

  // Extraer nombre del hijo desde el email
  const childName = childEmail.split("@")[0];

  // Enviar notificación para alertas de nivel 5 o superior
  if (riskLevel >= 5) {
    try {
      const userDoc = await admin.firestore().collection("users").doc(tutorId).get();
      const userData = userDoc.data();

      if (!userDoc.exists || !userData?.fcmToken) {
        console.log(`Tutor ${tutorId} sin token FCM.`);
        return null;
      }

      // Determinar título según nivel de riesgo
      let title: string;
      
      if (riskLevel >= 9) {
        title = "🚨 ALERTA CRÍTICA";
      } else if (riskLevel >= 7) {
        title = "⚠️ ALERTA IMPORTANTE";
      } else {
        title = "⚡ AVISO PREVENTIVO";
      }

      // Construir mensaje detallado
      let body = `${childName} - Nivel ${riskLevel}/10`;
      if (groomingStage) {
        body += ` (${groomingStage})`;
      }

      // Enviar solo data payload para que los handlers de la app muestren la notificación
      const message = {
        token: userData.fcmToken,
        data: {
          alertId: event.params.alertId,
          riskLevel: String(riskLevel),
          childEmail: childEmail,
          sender: sender,
          type: "risk_alert",
          groomingStage: groomingStage,
          title: title,
          body: body,
        },
        android: {
          priority: "high" as const,
        },
      };

      await admin.messaging().send(message);
      console.log(`✅ Notificación enviada a tutor ${tutorId} - Nivel ${riskLevel}`);
    } catch (error) {
      console.error("❌ Error al enviar notificación:", error);
      
      // Si el token es inválido, eliminarlo
      if ((error as any).code === "messaging/invalid-registration-token" ||
          (error as any).code === "messaging/registration-token-not-registered") {
        console.log("Token inválido, eliminando de Firestore...");
        await admin.firestore().collection("users").doc(tutorId).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });
      }
    }
  }
  return null;
});