package com.safemindai;

import android.content.Context;
import android.provider.Settings;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class NotificationPermissionModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public NotificationPermissionModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "NotificationPermissionModule";
    }

    @ReactMethod
    public void isNotificationListenerEnabled(Promise promise) {
        try {
            String packageName = reactContext.getPackageName();
            String enabledListeners = Settings.Secure.getString(
                reactContext.getContentResolver(),
                "enabled_notification_listeners"
            );
            
            boolean isEnabled = enabledListeners != null && enabledListeners.contains(packageName);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "No se pudo verificar el permiso", e);
        }
    }
}
