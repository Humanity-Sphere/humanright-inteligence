package com.hrdefendermobile;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.util.List;

/**
 * Hauptaktivität der App
 * Verantwortlich für das Empfangen und Weiterleiten von App Actions Intents
 */
public class MainActivity extends ReactActivity {
    private static final String TAG = "MainActivity";
    private AssistantModule assistantModule;

    /**
     * Liefert den Namen der Hauptkomponente, der in index.js registriert ist
     */
    @Override
    protected String getMainComponentName() {
        return "HRDefenderMobile";
    }

    /**
     * Erstellt die ReactActivityDelegate, die für das Aufsetzen des React Native-Backends verantwortlich ist
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                // Falls die Concierge/New Architecture aktiviert wird, kann dies aktiviert werden
                DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }

    /**
     * Wird aufgerufen, wenn die Aktivität erstellt wird
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SoLoader.init(this, false);
        
        // Intent verarbeiten, falls die App durch einen App Actions Intent gestartet wurde
        Intent intent = getIntent();
        if (intent != null) {
            handleIntent(intent);
        }
    }

    /**
     * Wird aufgerufen, wenn die App durch einen neuen Intent gestartet oder wieder in den Vordergrund geholt wird
     */
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    /**
     * Verarbeitet einen eingehenden Intent und leitet ihn an das AssistantModule weiter
     */
    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        String action = intent.getAction();
        if (action == null) {
            return;
        }

        Log.d(TAG, "Intent empfangen: " + action);

        // Mögliche App Actions oder tiefe Links
        if (action.startsWith("com.hrdefendermobile.") ||
            action.equals(Intent.ACTION_VIEW) ||
            action.equals(Intent.ACTION_SEARCH)) {
            
            // Zugriff auf das ReactNativeHost
            ReactNativeHost reactNativeHost = getReactNativeHost();
            if (reactNativeHost == null) {
                Log.e(TAG, "ReactNativeHost ist null");
                return;
            }

            // Warten, bis React geladen ist und dann Intent weiterleiten
            ReactInstanceManager instanceManager = reactNativeHost.getReactInstanceManager();
            if (instanceManager != null) {
                instanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                    @Override
                    public void onReactContextInitialized(com.facebook.react.bridge.ReactContext context) {
                        // AssistantModule aus Kontext holen
                        AssistantModule module = context.getNativeModule(AssistantModule.class);
                        if (module != null) {
                            module.handleAssistantIntent(intent);
                        } else {
                            Log.e(TAG, "AssistantModule nicht gefunden");
                        }
                        
                        // Listener entfernen
                        instanceManager.removeReactInstanceEventListener(this);
                    }
                });
                
                // Falls React bereits initialisiert ist, Intent sofort weiterleiten
                if (instanceManager.hasStartedCreatingInitialContext()) {
                    com.facebook.react.bridge.ReactContext reactContext = instanceManager.getCurrentReactContext();
                    if (reactContext != null) {
                        AssistantModule module = reactContext.getNativeModule(AssistantModule.class);
                        if (module != null) {
                            module.handleAssistantIntent(intent);
                        } else {
                            Log.e(TAG, "AssistantModule nicht gefunden");
                        }
                    }
                }
            } else {
                Log.e(TAG, "ReactInstanceManager ist null");
            }
        }
    }

    /**
     * Liefert den ReactNativeHost, der die App-Packages verwaltet
     */
    protected ReactNativeHost getReactNativeHost() {
        return ((MainApplication) getApplication()).getReactNativeHost();
    }
}