package com.safemindai;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AppModeModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AppModeModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AppModeModule";
    }

    @ReactMethod
    public void setTutorMode(Promise promise) {
        try {
            PackageManager packageManager = reactContext.getPackageManager();
            
            // Habilitar ícono de tutor (normal)
            ComponentName tutorComponent = new ComponentName(reactContext, "com.safemindai.TutorLauncher");
            packageManager.setComponentEnabledSetting(
                tutorComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );
            
            // Deshabilitar ícono de hijo (camuflado)
            ComponentName childComponent = new ComponentName(reactContext, "com.safemindai.ChildLauncher");
            packageManager.setComponentEnabledSetting(
                childComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            );
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "No se pudo cambiar a modo tutor", e);
        }
    }

    @ReactMethod
    public void setChildMode(Promise promise) {
        try {
            PackageManager packageManager = reactContext.getPackageManager();
            
            // Deshabilitar ícono de tutor (normal)
            ComponentName tutorComponent = new ComponentName(reactContext, "com.safemindai.TutorLauncher");
            packageManager.setComponentEnabledSetting(
                tutorComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            );
            
            // Habilitar ícono de hijo (camuflado)
            ComponentName childComponent = new ComponentName(reactContext, "com.safemindai.ChildLauncher");
            packageManager.setComponentEnabledSetting(
                childComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "No se pudo cambiar a modo hijo", e);
        }
    }

    @ReactMethod
    public void getCurrentMode(Promise promise) {
        try {
            PackageManager packageManager = reactContext.getPackageManager();
            
            ComponentName childComponent = new ComponentName(reactContext, "com.safemindai.ChildLauncher");
            int childState = packageManager.getComponentEnabledSetting(childComponent);
            
            boolean isChildMode = (childState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED);
            promise.resolve(isChildMode ? "child" : "tutor");
        } catch (Exception e) {
            promise.reject("ERROR", "No se pudo verificar el modo", e);
        }
    }
}
