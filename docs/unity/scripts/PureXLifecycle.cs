// PureXLifecycle.cs
// ────────────────────────────────────────────────────────────────────
// Battery + memory guard for the PureX Unity scene.
//
// Without this, an idle 3D character at the default 60fps will drain
// ~15%/hour of battery on a mid-tier Android phone — unacceptable for
// a "tap to look at avatar" use case. This script:
//
//   1. Caps the framerate to 30fps (plenty for breathing animation,
//      half the GPU cost of 60fps).
//   2. Disables vsync (lets the framerate cap actually work — vsync
//      forces 60 on most devices).
//   3. Frees unused assets when the user backgrounds the Unity
//      Activity, so memory doesn't climb across sessions.
//   4. Respects the OS sleep timeout (so the phone can sleep normally
//      while in the Unity view — Unity defaults to keeping screen on).
//
// SETUP (in Unity Editor):
//   1. Attach to the same `PureXBridge` GameObject (or any object
//      that survives scene-load).
// ────────────────────────────────────────────────────────────────────

using UnityEngine;

public class PureXLifecycle : MonoBehaviour
{
    void Start()
    {
        // 30 fps is the right target for a stationary, breathing
        // character. 60fps doubles GPU draw with no visible improvement
        // (idle motion is too subtle for users to notice the difference).
        Application.targetFrameRate = 30;
        QualitySettings.vSyncCount = 0;

        // Let the device sleep normally (Unity defaults to NeverSleep
        // which keeps the screen on indefinitely — battery killer).
        Screen.sleepTimeout = SleepTimeout.SystemSetting;
    }

    void OnApplicationPause(bool paused)
    {
        if (paused)
        {
            // User backgrounded the Unity Activity (hit home button,
            // task-switched, etc). Free GPU resources so memory
            // doesn't climb if they reopen multiple times per session.
            Resources.UnloadUnusedAssets();
            System.GC.Collect();
        }
    }
}
