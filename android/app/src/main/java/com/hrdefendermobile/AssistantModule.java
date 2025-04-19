package com.hrdefendermobile;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Native-Modul für die Google Assistant-Integration
 * Dieses Modul fungiert als Bridge zwischen dem Google Assistant (via App Actions)
 * und dem React Native-Code der App
 */
public class AssistantModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AssistantModule";
    
    private final ReactApplicationContext reactContext;

    public AssistantModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "AssistantModule";
    }

    /**
     * Initialisiert die Google Assistant-Integration
     * Diese Methode kann von JS aufgerufen werden, um die Integration zu starten
     */
    @ReactMethod
    public void setupAssistantIntentHandlers() {
        Log.d(TAG, "Assistant Intent Handler initialisiert");
    }

    /**
     * Verarbeitet einen eingehenden Intent aus Google Assistant
     * Diese Methode wird von der MainActivity aufgerufen, wenn ein App Actions Intent empfangen wird
     */
    public void handleAssistantIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        String action = intent.getAction();
        Uri data = intent.getData();
        
        Log.d(TAG, "Empfangener Assistant Intent: " + action);
        
        if (action == null) {
            return;
        }

        // Je nach Intent-Typ verarbeiten und an JS senden
        switch (action) {
            case "com.hrdefendermobile.CREATE_LEARNING_PLAN":
                handleCreateLearningPlanIntent(intent);
                break;
            case "com.hrdefendermobile.SEARCH_LEARNING_MODULE":
                handleSearchModuleIntent(intent);
                break;
            case "com.hrdefendermobile.ANALYZE_DOCUMENT":
                handleAnalyzeDocumentIntent(intent);
                break;
            case "com.hrdefendermobile.CREATE_CASE":
                handleCreateCaseIntent(intent);
                break;
            case Intent.ACTION_SEARCH:
                // Standard-Suchintent
                handleSearchIntent(intent);
                break;
            case Intent.ACTION_VIEW:
                // URI öffnen
                if (data != null) {
                    handleViewIntent(data);
                }
                break;
        }
    }

    /**
     * Verarbeitet einen Intent zum Erstellen eines Lernplans
     */
    private void handleCreateLearningPlanIntent(Intent intent) {
        String goal = intent.getStringExtra("goal");
        String title = intent.getStringExtra("title");
        
        WritableMap params = Arguments.createMap();
        params.putString("goal", goal != null ? goal : "");
        params.putString("title", title != null ? title : "");
        
        sendEvent("CREATE_LEARNING_PLAN", params);
    }

    /**
     * Verarbeitet einen Intent zum Suchen von Lernmodulen
     */
    private void handleSearchModuleIntent(Intent intent) {
        String query = intent.getStringExtra("query");
        
        WritableMap params = Arguments.createMap();
        params.putString("query", query != null ? query : "");
        
        sendEvent("SEARCH_LEARNING_MODULE", params);
    }

    /**
     * Verarbeitet einen Intent zum Analysieren eines Dokuments
     */
    private void handleAnalyzeDocumentIntent(Intent intent) {
        String documentName = intent.getStringExtra("documentName");
        
        WritableMap params = Arguments.createMap();
        params.putString("documentName", documentName != null ? documentName : "");
        
        sendEvent("ANALYZE_DOCUMENT", params);
    }

    /**
     * Verarbeitet einen Intent zum Erstellen eines Falls
     */
    private void handleCreateCaseIntent(Intent intent) {
        String caseTitle = intent.getStringExtra("caseTitle");
        String caseDescription = intent.getStringExtra("caseDescription");
        
        WritableMap params = Arguments.createMap();
        params.putString("caseTitle", caseTitle != null ? caseTitle : "");
        params.putString("caseDescription", caseDescription != null ? caseDescription : "");
        
        sendEvent("CREATE_CASE", params);
    }

    /**
     * Verarbeitet einen Standard-Suchintent
     */
    private void handleSearchIntent(Intent intent) {
        String query = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (query == null) {
            query = intent.getStringExtra("query");
        }
        
        WritableMap params = Arguments.createMap();
        params.putString("query", query != null ? query : "");
        
        sendEvent("SEARCH_QUERY", params);
    }

    /**
     * Verarbeitet einen URI-basierten Intent
     */
    private void handleViewIntent(Uri data) {
        String path = data.getPath();
        if (path == null) {
            return;
        }
        
        WritableMap params = Arguments.createMap();
        params.putString("path", path);
        
        // Zusätzliche Parameter aus dem URI extrahieren
        for (String key : data.getQueryParameterNames()) {
            params.putString(key, data.getQueryParameter(key));
        }
        
        sendEvent("VIEW_URI", params);
    }

    /**
     * Sendet ein Event an den JS-Teil via DeviceEventEmitter
     */
    private void sendEvent(String eventName, WritableMap params) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
            
            Log.d(TAG, "Event gesendet: " + eventName);
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Senden des Events: " + e.getMessage());
        }
    }

    /**
     * Testet die Verbindung zwischen JS und Native (kann aus JS aufgerufen werden)
     */
    @ReactMethod
    public void testConnection(Promise promise) {
        promise.resolve("AssistantModule erfolgreich verbunden");
    }
}