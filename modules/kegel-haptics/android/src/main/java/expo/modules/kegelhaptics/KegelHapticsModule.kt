package expo.modules.kegelhaptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Kegel v2 vibration language on Android (SPEC_KEGEL_V2 §7.4): `VibrationEffect.createWaveform` with
 * amplitude steps (rising squeeze, falling release). Devices without amplitude control get an on/off
 * pattern computed in JS. Nothing is recorded.
 */
class KegelHapticsModule : Module() {
  private val vibrator: Vibrator?
    get() {
      val ctx = appContext.reactContext ?: return null
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        ctx.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }
    }

  override fun definition() = ModuleDefinition {
    Name("KegelHaptics")

    Function("isSupported") {
      vibrator?.hasVibrator() ?: false
    }

    Function("hasAmplitudeControl") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && (vibrator?.hasAmplitudeControl() ?: false)
    }

    /** Back-to-back segments: timings in ms, amplitudes 0..255. */
    Function("vibrateWaveform") { timings: List<Double>, amplitudes: List<Int> ->
      val v = vibrator ?: return@Function
      if (timings.isEmpty() || timings.size != amplitudes.size) return@Function
      val t = timings.map { it.toLong().coerceAtLeast(0L) }.toLongArray()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val a = amplitudes.map { it.coerceIn(0, 255) }.toIntArray()
        v.vibrate(VibrationEffect.createWaveform(t, a, -1))
      } else {
        // No amplitudes before Android 8: every non-silent segment vibrates.
        val onOff = mutableListOf<Long>()
        var on = false
        var acc = 0L
        t.indices.forEach { i ->
          val segOn = amplitudes[i] > 0
          if (segOn == on) {
            acc += t[i]
          } else {
            onOff.add(acc)
            acc = t[i]
            on = segOn
          }
        }
        onOff.add(acc)
        @Suppress("DEPRECATION")
        v.vibrate(onOff.toLongArray(), -1)
      }
    }

    /** Classic [off, on, off, on…] pattern in ms. */
    Function("vibratePattern") { pattern: List<Double> ->
      val v = vibrator ?: return@Function
      if (pattern.isEmpty()) return@Function
      val p = pattern.map { it.toLong().coerceAtLeast(0L) }.toLongArray()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        v.vibrate(VibrationEffect.createWaveform(p, -1))
      } else {
        @Suppress("DEPRECATION")
        v.vibrate(p, -1)
      }
    }

    Function("cancel") {
      vibrator?.cancel()
    }
  }
}
