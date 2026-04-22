import CoreMotion
import Foundation
import React

@objc(StepCounter)
class StepCounter: RCTEventEmitter {
  private let pedometer = CMPedometer()
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["StepCounterChange"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
    pedometer.stopUpdates()
  }

  @objc(isStepCountingAvailable:rejecter:)
  func isStepCountingAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(CMPedometer.isStepCountingAvailable())
  }

  @objc(requestPermission:rejecter:)
  func requestPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard CMPedometer.isStepCountingAvailable() else {
      resolve(false)
      return
    }

    let now = Date()
    let probeStart = now.addingTimeInterval(-1)

    pedometer.queryPedometerData(from: probeStart, to: now) { _, error in
      resolve(error == nil)
    }
  }

  @objc(getTodaySteps:rejecter:)
  func getTodaySteps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard CMPedometer.isStepCountingAvailable() else {
      reject("STEP_COUNTER_UNAVAILABLE", "Step counting is not available on this device.", nil)
      return
    }

    let startOfDay = Calendar.current.startOfDay(for: Date())
    pedometer.queryPedometerData(from: startOfDay, to: Date()) { data, error in
      if let error = error {
        reject("STEP_COUNTER_QUERY_FAILED", error.localizedDescription, error)
        return
      }

      resolve(data?.numberOfSteps.intValue ?? 0)
    }
  }

  @objc(startStepUpdates)
  func startStepUpdates() {
    guard CMPedometer.isStepCountingAvailable() else {
      return
    }

    let startOfDay = Calendar.current.startOfDay(for: Date())
    pedometer.startUpdates(from: startOfDay) { [weak self] data, _ in
      guard let self = self, self.hasListeners else {
        return
      }

      self.sendEvent(
        withName: "StepCounterChange",
        body: data?.numberOfSteps.intValue ?? 0
      )
    }
  }

  @objc(stopStepUpdates)
  func stopStepUpdates() {
    pedometer.stopUpdates()
  }
}
