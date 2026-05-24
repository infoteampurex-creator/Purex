package com.teampurex.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Register custom Capacitor plugins BEFORE super.onCreate so the
    // bridge picks them up during its plugin-scan phase.
    registerPlugin(UnityBridgePlugin.class);
    super.onCreate(savedInstanceState);
  }
}
