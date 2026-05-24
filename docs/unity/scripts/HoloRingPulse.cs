// HoloRingPulse.cs
// ────────────────────────────────────────────────────────────────────
// Simple breathing-pulse for the holographic green ring under the
// avatar's feet. Modulates the material's alpha on a slow sine wave
// so the ring fades in and out, giving the scene a subtle "alive"
// rhythm without distracting from the character.
//
// SETUP (in Unity Editor):
//   1. Attach to the HoloRing GameObject (the Quad with the
//      HoloRing_Mat material assigned).
//   2. The material's Surface Type must be Transparent for the alpha
//      modulation to be visible — see phase-1-weekend-checklist.md
//      Step 4 for material setup.
// ────────────────────────────────────────────────────────────────────

using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class HoloRingPulse : MonoBehaviour
{
    [Tooltip("Base alpha at the dimmest point of the pulse cycle (0-1).")]
    public float minAlpha = 0.4f;

    [Tooltip("Additional alpha at the brightest point of the cycle (0-1).")]
    public float pulseRange = 0.3f;

    [Tooltip("Speed of the pulse — radians per second. ~1.5 = ~2.5sec cycle.")]
    public float pulseSpeed = 1.5f;

    private Material mat;

    void Start()
    {
        // Instance the material so we don't mutate the shared asset
        // (Unity auto-instances on first .material access, but being
        // explicit avoids surprises in prefab variants).
        mat = GetComponent<Renderer>().material;
    }

    void Update()
    {
        if (mat == null) return;

        // Sin maps to [-1, 1] → remap to [0, 1] → scale by pulseRange,
        // add minAlpha. Net result: alpha oscillates between minAlpha
        // and (minAlpha + pulseRange).
        float t = (Mathf.Sin(Time.time * pulseSpeed) + 1f) * 0.5f;
        float alpha = minAlpha + (t * pulseRange);

        var color = mat.color;
        color.a = alpha;
        mat.color = color;
    }
}
