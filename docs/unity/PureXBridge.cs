// PureXBridge.cs
// -------------------------------------------------------------------
// Reference Unity-side script that receives messages from the
// Android Capacitor plugin (UnityBridgePlugin.kt).
//
// SETUP (in Unity Editor):
//   1. Create an empty GameObject in PureXAvatar.unity scene
//   2. Name it EXACTLY  "PureXBridge"   (the name the Android
//      side targets in UnityPlayer.UnitySendMessage)
//   3. Attach this script as a component
//   4. Drag the Animator + SkinnedMeshRenderer references into the
//      Inspector slots
//
// Contract:
//   SetBodyType(string)    — "lean" | "athletic" | "solid" | "heavy"
//   SetAnimation(string)   — "idle" | "flex" | "walk" | "charged"
//   RequestShutdown()      — finishes the Unity activity
// -------------------------------------------------------------------

using UnityEngine;

public class PureXBridge : MonoBehaviour
{
    [Header("References")]
    public Animator animator;
    public SkinnedMeshRenderer bodyMesh;

    // Blendshape indices in `bodyMesh` — set in Inspector. The order
    // must match the BodyType enum on the JS side:
    //   0 = lean, 1 = athletic, 2 = solid, 3 = heavy
    [Header("Body Blendshape Indices")]
    public int leanShape = 0;
    public int athleticShape = 1;
    public int solidShape = 2;
    public int heavyShape = 3;

    // How fast we interpolate between body types when SetBodyType is
    // called. 0 = snap instantly, higher = smoother.
    public float morphSpeed = 2.5f;

    private float[] targetWeights = new float[4];
    private float[] currentWeights = new float[4];

    void Awake()
    {
        // Read launch extras passed via Intent.putExtra in
        // UnityBridgePlugin.start() so the first frame already shows
        // the correct body type — no "wrong avatar flash".
        var initialBodyType = GetAndroidExtra("bodyType", "athletic");
        var initialAnim = GetAndroidExtra("animation", "idle");
        ApplyBodyType(initialBodyType, instant: true);
        SetAnimation(initialAnim);
    }

    void Update()
    {
        if (bodyMesh == null) return;
        // Smoothly approach targetWeights — keeps morphs feeling alive
        // when the user logs new measurements mid-session.
        for (int i = 0; i < 4; i++)
        {
            currentWeights[i] = Mathf.MoveTowards(
                currentWeights[i],
                targetWeights[i],
                morphSpeed * 100f * Time.deltaTime
            );
        }
        bodyMesh.SetBlendShapeWeight(leanShape, currentWeights[0]);
        bodyMesh.SetBlendShapeWeight(athleticShape, currentWeights[1]);
        bodyMesh.SetBlendShapeWeight(solidShape, currentWeights[2]);
        bodyMesh.SetBlendShapeWeight(heavyShape, currentWeights[3]);
    }

    // ─── Public bridge methods (called via UnitySendMessage) ────────

    public void SetBodyType(string bodyType)
    {
        ApplyBodyType(bodyType, instant: false);
    }

    public void SetAnimation(string name)
    {
        if (animator == null) return;
        // Animator must have a Trigger parameter for each name above.
        animator.SetTrigger(name);
    }

    public void RequestShutdown()
    {
        // The Unity activity lifecycle takes care of GPU teardown.
        Application.Quit();
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private void ApplyBodyType(string bodyType, bool instant)
    {
        // Hard-zero everyone, then ramp the chosen index to 100.
        for (int i = 0; i < 4; i++) targetWeights[i] = 0f;
        switch (bodyType?.ToLowerInvariant())
        {
            case "lean":     targetWeights[0] = 100f; break;
            case "athletic": targetWeights[1] = 100f; break;
            case "solid":    targetWeights[2] = 100f; break;
            case "heavy":    targetWeights[3] = 100f; break;
            default:         targetWeights[1] = 100f; break; // athletic fallback
        }
        if (instant)
        {
            for (int i = 0; i < 4; i++) currentWeights[i] = targetWeights[i];
        }
    }

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
