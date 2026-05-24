// PureXBridge.cs — Phase 1 (idle-only)
// ────────────────────────────────────────────────────────────────────
// Bridge between the Android Capacitor app and the Unity scene.
// Receives Intent extras at startup (which animation to play) and
// hosts the message endpoints that the Capacitor plugin will call
// via UnitySendMessage in later phases (SetBodyType, SetVitality,
// Celebrate, etc).
//
// SETUP (in Unity Editor):
//   1. Create empty GameObject in PureXAvatar.unity → name it
//      EXACTLY "PureXBridge" (the name Android targets)
//   2. Attach this script
//   3. Drag your character's Animator into the `animator` slot
//
// PHASE 1 SCOPE:
//   - Reads `animation` Intent extra (default "idle")
//   - Plays that animation state on Awake
//
// PHASE 2 HOOKS (commented below, uncomment when you add features):
//   - SetBodyType(string)    — blendshape morph for lean/athletic/...
//   - SetVitality(string)    — MoodState transitions
//   - Celebrate()            — one-shot victory animation
// ────────────────────────────────────────────────────────────────────

using UnityEngine;

public class PureXBridge : MonoBehaviour
{
    [Header("References")]
    [Tooltip("Drag the character's Animator component here.")]
    public Animator animator;

    void Awake()
    {
        // Read launch extras passed via Intent.putExtra from
        // UnityBridgePlugin.start() on the Android side, so the first
        // frame already shows the requested animation.
        var anim = GetAndroidExtra("animation", "idle");

        if (animator != null && !string.IsNullOrEmpty(anim))
        {
            // Animator.Play accepts state names (case-insensitive).
            // Phase 1 character has only "idle" state — additional
            // states (walk, victory, tired) get added in Phase 2.
            animator.Play(anim);
        }
    }

    // ─── Phase 2 message endpoints (uncomment when ready) ───────────
    //
    // Called from Android via:
    //   UnityPlayer.UnitySendMessage("PureXBridge", "SetBodyType", "heavy");
    //
    /*
    [Header("Body Morph (Phase 2)")]
    public SkinnedMeshRenderer bodyMesh;
    public int leanShape = 0, athleticShape = 1, muscularShape = 2, heavyShape = 3;
    public float morphSpeed = 50f;

    private float[] targetWeights = new float[4];
    private float[] currentWeights = new float[4];

    public void SetBodyType(string type) {
        for (int i = 0; i < 4; i++) targetWeights[i] = 0f;
        switch (type?.ToLowerInvariant()) {
            case "lean":     targetWeights[0] = 100; break;
            case "athletic": targetWeights[1] = 100; break;
            case "muscular": targetWeights[2] = 100; break;
            case "heavy":    targetWeights[3] = 100; break;
            default:         targetWeights[1] = 100; break;
        }
    }

    public void SetVitality(string vitalityStr) {
        if (animator == null) return;
        int v = int.TryParse(vitalityStr, out var parsed) ? parsed : 50;
        if (v < 30)      animator.SetInteger("MoodState", 0);  // tired
        else if (v < 70) animator.SetInteger("MoodState", 1);  // idle
        else             animator.SetInteger("MoodState", 2);  // strong
    }

    public void Celebrate() {
        if (animator != null) animator.SetTrigger("Celebrate");
    }

    void Update() {
        if (bodyMesh == null) return;
        bool changed = false;
        for (int i = 0; i < 4; i++) {
            var next = Mathf.MoveTowards(currentWeights[i], targetWeights[i],
                                          morphSpeed * Time.deltaTime);
            if (next != currentWeights[i]) { currentWeights[i] = next; changed = true; }
        }
        if (changed) {
            bodyMesh.SetBlendShapeWeight(leanShape,     currentWeights[0]);
            bodyMesh.SetBlendShapeWeight(athleticShape, currentWeights[1]);
            bodyMesh.SetBlendShapeWeight(muscularShape, currentWeights[2]);
            bodyMesh.SetBlendShapeWeight(heavyShape,    currentWeights[3]);
        }
    }
    */

    // ─── Android Intent helpers ─────────────────────────────────────

    private string GetAndroidExtra(string key, string fallback)
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        try
        {
            using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (var intent = activity.Call<AndroidJavaObject>("getIntent"))
            {
                var value = intent.Call<string>("getStringExtra", key);
                return string.IsNullOrEmpty(value) ? fallback : value;
            }
        }
        catch { return fallback; }
#else
        return fallback;
#endif
    }
}
