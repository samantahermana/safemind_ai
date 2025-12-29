package com.safemindai;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.os.Bundle;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;

public class NotificationService extends NotificationListenerService {

    // Guardamos los IDs de los mensajes para que no se repitan
    private static final HashSet<String> processedMessages = new HashSet<>();
    private static final int MAX_HISTORY = 50; // Solo recordamos los últimos 50 para ahorrar RAM

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();

        // Filtro de Apps
        boolean esAppValida =
                packageName.equals("com.whatsapp") ||
                        packageName.equals("com.whatsapp.w4b") ||
                        packageName.equals("org.telegram.messenger") ||
                        packageName.equals("com.instagram.android") ||
                        packageName.equals("com.facebook.orca") ||
                        packageName.equals("com.discord") ||
                        packageName.equals("com.roblox.client") ||
                        packageName.equals("com.zhiliaoapp.musically");

        if (!esAppValida) return;

        Bundle extras = sbn.getNotification().extras;
        CharSequence text = extras.getCharSequence("android.text");
        String title = extras.getString("android.title");

        if (text != null) {
            String mensajeStr = text.toString();

            // GENERAMOS UN ID ÚNICO REAL: App + Remitente + Mensaje
            String uniqueId = packageName + "|" + title + "|" + mensajeStr;

            // SI YA LO PROCESAMOS, SALIMOS
            if (processedMessages.contains(uniqueId)) {
                return;
            }

            // AGREGAMOS AL HISTORIAL Y CONTROLAMOS EL TAMAÑO
            if (processedMessages.size() > MAX_HISTORY) {
                processedMessages.clear(); // Limpieza simple para la tesis
            }
            processedMessages.add(uniqueId);

            // EXTRACCIÓN DE TIEMPO
            long timestamp = sbn.getPostTime();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String fechaHoraFormateada = sdf.format(new Date(timestamp));

            // Filtro de mensajes de sistema internos de las apps
            if (!mensajeStr.contains("Buscando nuevos mensajes") && !mensajeStr.contains("Checking for messages")) {
                sendEventToJS(title != null ? title : "Sin título", mensajeStr, packageName, fechaHoraFormateada);
            }
        }
    }

    private void sendEventToJS(String title, String message, String app, String timestamp) {
        try {
            ReactApplication reactApplication = (ReactApplication) getApplication();
            if (reactApplication == null) return;

            ReactNativeHost reactNativeHost = reactApplication.getReactNativeHost();
            ReactContext reactContext = reactNativeHost.getReactInstanceManager().getCurrentReactContext();

            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("title", title);
                params.putString("message", message);
                params.putString("app", app);
                params.putString("timestamp", timestamp);

                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNotificationReceived", params);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}
}