import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const maskToken = (token: string): string => {
  if (!token) {
    return "<empty>";
  }

  if (token.length <= 12) {
    return "***";
  }

  return `${token.slice(0, 6)}...${token.slice(-6)}`;
};

export const sendriskalert = onDocumentCreated(
  "alerts/{alertId}",
  async (event) => {
    const alertId = event.params.alertId;
    const newValue = event.data?.data();
    if (!newValue) {
      console.warn(
        `[sendriskalert] Evento sin data para alertId=${alertId}`,
      );
      return null;
    }

    const riskLevel: number = newValue.riskLevel;
    const tutorId: string = newValue.tutorId;
    const childEmail: string = newValue.childEmail || "Hijo";
    const sender: string = newValue.sender || "Desconocido";
    const groomingStage: string = newValue.groomingStage || "";

    console.log(
      `[sendriskalert] Trigger alertId=${alertId} tutorId=${tutorId} ` +
      `riskLevel=${riskLevel} sender=${sender}`,
    );

    // Extraer nombre del hijo desde el email
    const childName = childEmail.split("@")[0];

    // Enviar notificación para alertas de nivel 5 o superior
    if (riskLevel >= 5) {
      try {
        console.log(
          `[sendriskalert] Buscando token FCM de tutorId=${tutorId}`,
        );

        const userDoc = await admin.firestore()
          .collection("users")
          .doc(tutorId)
          .get();
        const userData = userDoc.data();

        if (!userDoc.exists || !userData?.fcmToken) {
          console.warn(
            `[sendriskalert] Tutor sin token FCM tutorId=${tutorId}`,
          );
          return null;
        }

        const fcmToken = String(userData.fcmToken);
        console.log(
          `[sendriskalert] Token encontrado tutorId=${tutorId} ` +
          `token=${maskToken(fcmToken)}`,
        );

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

        // Enviar solo data payload para que los handlers de la app muestren
        // la notificación
        const message = {
          token: fcmToken,
          notification: {
            title: title,
            body: body,
          },
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

        console.log(
          `[sendriskalert] Enviando FCM alertId=${alertId} ` +
          `priority=${message.android.priority}`,
        );

        const messageId = await admin.messaging().send(message);

        console.log(
          `[sendriskalert] ✅ FCM enviado alertId=${alertId} ` +
          `messageId=${messageId} tutorId=${tutorId} riskLevel=${riskLevel}`,
        );
      } catch (error: unknown) {
        console.error(
          `[sendriskalert] ❌ Error enviando alertId=${alertId}`,
          error,
        );

        const errorCode =
            typeof error === "object" && error !== null && "code" in error ?
              String(error.code) :
              "";

        console.error(
          `[sendriskalert] errorCode=${errorCode || "unknown"} ` +
          `tutorId=${tutorId}`,
        );

        // Si el token es inválido, eliminarlo
        if (
          errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
        ) {
          console.warn(
            `[sendriskalert] Token inválido, borrando en tutorId=${tutorId}`,
          );
          await admin.firestore().collection("users").doc(tutorId).update({
            fcmToken: admin.firestore.FieldValue.delete(),
          });
        }
      }
    } else {
      console.log(
        `[sendriskalert] Alerta ignorada por riesgo bajo ` +
        `alertId=${alertId} riskLevel=${riskLevel}`,
      );
    }

    return null;
  },
);
