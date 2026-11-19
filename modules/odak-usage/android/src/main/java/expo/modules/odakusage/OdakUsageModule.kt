package expo.modules.odakusage

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Odak Kampı – Android usage reminder (on-device only, nothing leaves the phone):
 *  - whether "Usage access" is granted, and a shortcut to that settings page;
 *  - launchable apps (name + package) so the user can choose trigger apps;
 *  - apps that came to the foreground in a time window (used by the background check);
 *  - a shortcut to Digital Wellbeing (falls back to the main settings).
 */
class OdakUsageModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("OdakUsage")

    Function("hasUsageAccess") {
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageAccessSettings") {
      context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    Function("openDigitalWellbeing") {
      val wellbeing = context.packageManager.getLaunchIntentForPackage("com.google.android.apps.wellbeing")
      val intent = wellbeing ?: Intent(Settings.ACTION_SETTINGS)
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      wellbeing != null
    }

    AsyncFunction("launchableApps") {
      val pm = context.packageManager
      val main = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(main, 0)
        .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
        .filter { it.first != context.packageName }
        .distinctBy { it.first }
        .sortedBy { it.second.lowercase() }
        .map { mapOf("packageName" to it.first, "label" to it.second) }
    }

    AsyncFunction("foregroundEvents") { fromMs: Double, toMs: Double ->
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val events = usm.queryEvents(fromMs.toLong(), toMs.toLong())
      val out = mutableListOf<Map<String, Any>>()
      val e = UsageEvents.Event()
      val resumed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) UsageEvents.Event.ACTIVITY_RESUMED else 1
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        if (e.eventType == resumed) out.add(mapOf("packageName" to e.packageName, "at" to e.timeStamp.toDouble()))
      }
      out
    }
  }
}
