package com.rntflight.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.time.LocalDate

class StepCounterModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), SensorEventListener, LifecycleEventListener {
  private val sensorManager =
    reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val stepCounterSensor: Sensor? =
    sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  private val preferences =
    reactContext.getSharedPreferences("step_counter", Context.MODE_PRIVATE)
  private val pendingTodayStepPromises = mutableListOf<Promise>()

  private var isListening = false
  private var hasJsListeners = false
  private var latestTodaySteps = 0

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = "StepCounter"

  @ReactMethod
  fun isStepCountingAvailable(promise: Promise) {
    promise.resolve(stepCounterSensor != null)
  }

  @ReactMethod
  fun getTodaySteps(promise: Promise) {
    if (stepCounterSensor == null) {
      promise.reject("STEP_COUNTER_UNAVAILABLE", "Step counter sensor is not available on this device.")
      return
    }

    if (latestTodaySteps > 0) {
      promise.resolve(latestTodaySteps)
      return
    }

    pendingTodayStepPromises.add(promise)
    startSensorIfNeeded()
  }

  @ReactMethod
  fun startStepUpdates() {
    startSensorIfNeeded()
  }

  @ReactMethod
  fun stopStepUpdates() {
    stopSensor()
  }

  @ReactMethod
  fun addListener(eventName: String) {
    hasJsListeners = true
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    hasJsListeners = false
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) {
      return
    }

    latestTodaySteps = calculateTodaySteps(event.values[0].toInt())
    resolvePendingPromises(latestTodaySteps)

    if (hasJsListeners) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(STEP_COUNTER_CHANGE_EVENT, latestTodaySteps)
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  override fun onHostResume() {
    if (hasJsListeners) {
      startSensorIfNeeded()
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    stopSensor()
  }

  private fun startSensorIfNeeded() {
    if (isListening || stepCounterSensor == null) {
      return
    }

    isListening = sensorManager.registerListener(
      this,
      stepCounterSensor,
      SensorManager.SENSOR_DELAY_UI
    )
  }

  private fun stopSensor() {
    if (!isListening) {
      return
    }

    sensorManager.unregisterListener(this)
    isListening = false
  }

  private fun calculateTodaySteps(totalStepsSinceBoot: Int): Int {
    val todayKey = LocalDate.now().toString()
    val savedDate = preferences.getString(KEY_BASELINE_DATE, null)

    if (savedDate != todayKey) {
      preferences.edit()
        .putString(KEY_BASELINE_DATE, todayKey)
        .putInt(KEY_BASELINE_STEPS, totalStepsSinceBoot)
        .apply()
      return 0
    }

    val baseline = preferences.getInt(KEY_BASELINE_STEPS, totalStepsSinceBoot)
    return (totalStepsSinceBoot - baseline).coerceAtLeast(0)
  }

  private fun resolvePendingPromises(steps: Int) {
    if (pendingTodayStepPromises.isEmpty()) {
      return
    }

    pendingTodayStepPromises.forEach { it.resolve(steps) }
    pendingTodayStepPromises.clear()
  }

  companion object {
    private const val STEP_COUNTER_CHANGE_EVENT = "StepCounterChange"
    private const val KEY_BASELINE_DATE = "baseline_date"
    private const val KEY_BASELINE_STEPS = "baseline_steps"
  }
}
