package com.teampurex.app

import android.content.Intent
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * UnityBridgePlugin
 * -----------------
 * Capacitor plugin that fronts the Unity-as-Library integration.
 *
 * Why reflection?
 *   This plugin must compile cleanly even before the Unity `.aar` /
 *   `unityLibrary` module is dropped into android/. We resolve
 *   `com.unity3d.player.UnityPlayer` and `UnityPlayerActivity` via
 *   `Class.forName` at runtime. Until the .aar arrives, every method
 *   returns `{ available: false }` and the JS side falls back to the
 *   existing static PNG avatar.
 *
 * Contract (matches lib/plugins/unity-bridge.ts):
 *   isAvailable()                      -> { available: boolean }
 *   start({ bodyType, animation? })    -> opens Unity activity full-screen
 *   sendMessage({ object, method, payload }) -> raw UnitySendMessage
 *   setBodyType({ bodyType })          -> sugar over sendMessage
 *   setAnimation({ name })             -> sugar over sendMessage
 *   stop()                             -> finishes Unity activity
 *
 * The Unity-side `PureXBridge.cs` GameObject must be named "PureXBridge"
 * and live in the active scene; it receives string messages from these
 * calls via Unity's `SendMessage`.
 */
@CapacitorPlugin(name = "UnityBridge")
class UnityBridgePlugin : Plugin() {

  companion object {
    private const val TAG = "UnityBridgePlugin"
    private const val UNITY_PLAYER_CLASS = "com.unity3d.player.UnityPlayer"
    private const val UNITY_ACTIVITY_CLASS = "com.unity3d.player.UnityPlayerActivity"
    private const val BRIDGE_GAMEOBJECT = "PureXBridge"
  }

  // ─── Availability check ────────────────────────────────────────────

  /** True iff the Unity .aar has been linked into this build. */
  private fun unityLinked(): Boolean = try {
    Class.forName(UNITY_PLAYER_CLASS)
    true
  } catch (_: ClassNotFoundException) {
    false
  }

  @PluginMethod
  fun isAvailable(call: PluginCall) {
    val ret = JSObject()
    ret.put("available", unityLinked())
    call.resolve(ret)
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  @PluginMethod
  fun start(call: PluginCall) {
    if (!unityLinked()) {
      call.reject("Unity library not linked — see docs/unity-as-library.md")
      return
    }
    val bodyType = call.getString("bodyType") ?: "athletic"
    val animation = call.getString("animation") ?: "idle"

    try {
      val activityClass = Class.forName(UNITY_ACTIVITY_CLASS)
      val intent = Intent(activity, activityClass).apply {
        // Pass initial config via extras — PureXBridge.cs reads these
        // on Awake() and applies before the first frame to avoid the
        // user seeing a wrong-bodytype flash.
        putExtra("bodyType", bodyType)
        putExtra("animation", animation)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      activity.startActivity(intent)
      call.resolve()
    } catch (e: Exception) {
      Log.e(TAG, "Failed to launch Unity activity", e)
      call.reject("Unity start failed: ${e.message}")
    }
  }

  @PluginMethod
  fun stop(call: PluginCall) {
    if (!unityLinked()) { call.resolve(); return }
    try {
      // UnityPlayer.UnitySendMessage("PureXBridge", "RequestShutdown", "");
      sendUnityMessage(BRIDGE_GAMEOBJECT, "RequestShutdown", "")
      call.resolve()
    } catch (e: Exception) {
      Log.e(TAG, "Unity stop failed", e)
      call.reject("Unity stop failed: ${e.message}")
    }
  }

  // ─── Messaging ─────────────────────────────────────────────────────

  @PluginMethod
  fun sendMessage(call: PluginCall) {
    val obj = call.getString("object")
    val method = call.getString("method")
    val payload = call.getString("payload") ?: ""
    if (obj.isNullOrBlank() || method.isNullOrBlank()) {
      call.reject("`object` and `method` are required")
      return
    }
    if (!unityLinked()) {
      call.reject("Unity not linked")
      return
    }
    try {
      sendUnityMessage(obj, method, payload)
      call.resolve()
    } catch (e: Exception) {
      Log.e(TAG, "UnitySendMessage failed", e)
      call.reject("UnitySendMessage failed: ${e.message}")
    }
  }

  @PluginMethod
  fun setBodyType(call: PluginCall) {
    val bodyType = call.getString("bodyType")
    if (bodyType.isNullOrBlank()) { call.reject("`bodyType` is required"); return }
    if (!unityLinked()) { call.reject("Unity not linked"); return }
    try {
      sendUnityMessage(BRIDGE_GAMEOBJECT, "SetBodyType", bodyType)
      call.resolve()
    } catch (e: Exception) {
      call.reject("setBodyType failed: ${e.message}")
    }
  }

  @PluginMethod
  fun setAnimation(call: PluginCall) {
    val name = call.getString("name")
    if (name.isNullOrBlank()) { call.reject("`name` is required"); return }
    if (!unityLinked()) { call.reject("Unity not linked"); return }
    try {
      sendUnityMessage(BRIDGE_GAMEOBJECT, "SetAnimation", name)
      call.resolve()
    } catch (e: Exception) {
      call.reject("setAnimation failed: ${e.message}")
    }
  }

  // ─── Reflection helper ─────────────────────────────────────────────

  /**
   * Calls the static method `UnityPlayer.UnitySendMessage(String, String, String)`
   * without a compile-time dependency on the Unity classes.
   */
  private fun sendUnityMessage(gameObject: String, method: String, payload: String) {
    val cls = Class.forName(UNITY_PLAYER_CLASS)
    val send = cls.getMethod(
      "UnitySendMessage",
      String::class.java, String::class.java, String::class.java
    )
    send.invoke(null, gameObject, method, payload)
  }
}
