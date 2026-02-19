# SafeMind AI

Aplicación móvil (React Native + Firebase) orientada a la **detección temprana de grooming y manipulación digital** en conversaciones de mensajería. El proyecto contempla dos roles:

- **Tutor**: visualiza alertas, menores vinculados y recibe notificaciones push.
- **Hijo/a**: vincula su dispositivo por QR y permite el análisis de notificaciones entrantes de apps seleccionadas.

> Estado actual: implementación enfocada en **Android**.

---

## 1) Funcionalidades principales

- Autenticación con correo/contraseña y Google Sign-In.
- Registro de perfil con rol (`tutor` o `child`) en Firestore.
- Vinculación tutor-hijo por código QR.
- Captura local de notificaciones (Android Notification Listener).
- Análisis de riesgo con motor híbrido en cliente (`fuzzy matching + reglas contextuales`).
- Creación de alertas en Firestore cuando el riesgo supera umbral.
- Envío de push notifications al tutor mediante Firebase Cloud Functions + FCM.
- Cambio dinámico de ícono/alias Android según modo tutor o hijo.

---

## 2) Arquitectura resumida

### App móvil (React Native)

- **`App.tsx`**: resuelve sesión Firebase Auth y enruta por rol.
- **`src/screens/auth/LoginScreen.tsx`**: login/registro y Google Sign-In.
- **`src/screens/child/ChildMainScreen.tsx`**:
	- vinculación QR,
	- verificación de permiso de lectura de notificaciones,
	- escucha de eventos nativos y análisis IA,
	- creación de documentos en `alerts`.
- **`src/screens/tutor/TutorMainScreen.tsx`**:
	- escucha en tiempo real de `linkedChildren` y `alerts`,
	- persistencia de token FCM,
	- visualización y filtrado de alertas.
- **`src/ai/AnalyzerAI.ts`**: análisis de mensaje y cálculo de `riskLevel`.

### Capa nativa Android

- **`NotificationService`**: escucha notificaciones del sistema y envía eventos al bridge React Native.
- **`NotificationPermissionModule`**: comprueba si el listener está habilitado.
- **`AppModeModule`**: alterna alias `TutorLauncher` / `ChildLauncher`.

### Backend Firebase Functions

- Trigger Firestore en `alerts/{alertId}`.
- Si `riskLevel >= 5`, busca `fcmToken` del tutor y envía notificación push.

---

## 3) Stack tecnológico

- React Native `0.73.9`
- React `18.2.0`
- Firebase (Auth, Firestore, Messaging, Functions)
- Notifee (notificaciones locales en foreground)
- Vision Camera (escaneo QR)
- TypeScript (app y functions)

---

## 4) Requisitos previos

- **Node.js** (LTS recomendado para React Native 0.73.x)
- **Java 17**
- **Android Studio + Android SDK + ADB**
- Dispositivo/emulador Android
- Proyecto Firebase configurado

Para Cloud Functions (carpeta `functions/`):

- Node.js `22` (según `functions/package.json`)
- Firebase CLI

---

## 5) Configuración inicial

### 5.1 Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd safemind_ai
npm install
```

### 5.2 Configurar Firebase Android

1. Crear/usar proyecto en Firebase Console.
2. Registrar app Android con el `applicationId` del proyecto.
3. Descargar `google-services.json` y ubicarlo en:

	 `android/app/google-services.json`

4. Habilitar en Firebase:
	 - Authentication (Email/Password y Google)
	 - Firestore
	 - Cloud Messaging

### 5.3 Google Sign-In

Actualizar `webClientId` en `src/screens/auth/LoginScreen.tsx` con el cliente Web de tu proyecto Firebase/Google Cloud.

### 5.4 Reglas y colecciones esperadas en Firestore

Colecciones utilizadas por la app:

- `users`
- `linkedChildren`
- `alerts`

Campos clave esperados:

- `users/{uid}`: `email`, `role`, `fcmToken` (opcional), timestamps.
- `linkedChildren/{childUid}`: `tutorId`, `childEmail`, `isActive`, `linkedAt`.
- `alerts/{alertId}`: `tutorId`, `childId`, `childEmail`, `message`, `riskLevel`, `groomingStage`, `timestamp`.

---

## 6) Ejecución local (Android)

### Metro

```bash
npm run start
```

### Build / instalación

Script disponible para entorno local con dispositivos específicos:

```bash
npm run android:local
```

Scripts adicionales:

```bash
npm run android:local:clean
npm run android:apk:release
npm run android:apk:release:clean
```

> Nota: `android:local` y `android:local:clean` están personalizados para modelos concretos detectados por ADB (`moto_e13` y `SM_A546E`). Si usas otros dispositivos, adapta esos scripts en `package.json`.

---

## 7) Cloud Functions (alertas push)

### Instalar dependencias de functions

```bash
cd functions
npm install
```

### Compilar y emular

```bash
npm run build
npm run serve
```

### Desplegar

```bash
npm run deploy
```

Regresa a raíz del proyecto cuando termines:

```bash
cd ..
```

---

## 8) Flujo funcional end-to-end

1. Usuario inicia sesión y la app detecta su rol.
2. Si es `child`, vincula con tutor mediante QR.
3. Servicio Android captura notificaciones de apps permitidas.
4. `AnalyzerAI` calcula nivel de riesgo del mensaje.
5. Si riesgo >= umbral, se guarda alerta en Firestore.
6. Cloud Function detecta nueva alerta y envía push al tutor.
7. Tutor visualiza alerta en tiempo real en su panel.

---

## 9) Scripts útiles

Raíz del proyecto:

- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run android:local`
- `npm run android:local:clean`
- `npm run android:apk:release`
- `npm run android:apk:release:clean`

Carpeta `functions/`:

- `npm run lint`
- `npm run build`
- `npm run serve`
- `npm run deploy`
- `npm run logs`

---

## 10) Solución de problemas

- **No aparecen alertas en tutor**:
	- verificar que el menor esté vinculado (`linkedChildren`) y activo,
	- revisar que exista `fcmToken` en `users/{tutorId}`,
	- revisar logs de Cloud Functions.

- **No se capturan notificaciones en modo hijo**:
	- habilitar acceso en Ajustes de Android para Notification Listener,
	- confirmar que la app objetivo esté en whitelist de `NotificationService`.

- **Google Sign-In falla**:
	- revisar SHA-1/SHA-256 en Firebase,
	- validar `webClientId` correcto.

- **Problemas de build Android**:
	- ejecutar clean (`android:local:clean`),
	- validar SDK/NDK/JDK compatibles con React Native `0.73.x`.

---

## 11) Consideraciones éticas y de uso

- Esta herramienta es de apoyo preventivo y no reemplaza evaluación profesional.
- Debe usarse con consentimiento y según normativa local de privacidad/protección de datos.
- Se recomienda complementar con educación digital y acompañamiento familiar.

---
