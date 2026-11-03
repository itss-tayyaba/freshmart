import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class LocationTelemetryService {
  final ApiService _apiService;
  Timer? _telemetryTimer;
  String? _activeOrderId;
  bool _isStreaming = false;

  LocationTelemetryService(this._apiService);

  bool get isStreaming => _isStreaming;
  String? get activeOrderId => _activeOrderId;

  Future<bool> checkAndRequestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  void startTelemetry({required String orderId}) async {
    _activeOrderId = orderId;
    if (_isStreaming) return;

    final hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) {
      debugPrint('[GPS Telemetry] Location permission not granted');
      return;
    }

    _isStreaming = true;
    debugPrint('[GPS Telemetry] Started tracking for Order #$orderId');

    // Send immediate first ping
    _sendPing();

    // Send GPS telemetry every 5 seconds
    _telemetryTimer?.cancel();
    _telemetryTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _sendPing();
    });
  }

  Future<void> _sendPing() async {
    if (!_isStreaming || _activeOrderId == null) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      );

      // Send to order GPS channel
      await _apiService.sendRiderLocationToOrder(
        _activeOrderId!,
        lat: position.latitude,
        lng: position.longitude,
        speed: position.speed,
        heading: position.heading,
      );

      // Also send to rider fleet profile channel
      await _apiService.sendRiderLocationMe(
        lat: position.latitude,
        lng: position.longitude,
        speed: position.speed,
        heading: position.heading,
      );

      debugPrint(
        '[GPS Telemetry] Sent coordinates: ${position.latitude}, ${position.longitude} (speed: ${position.speed}m/s)',
      );
    } catch (e) {
      debugPrint('[GPS Telemetry Error] $e');
    }
  }

  void stopTelemetry() {
    _telemetryTimer?.cancel();
    _telemetryTimer = null;
    _activeOrderId = null;
    _isStreaming = false;
    debugPrint('[GPS Telemetry] Stopped streaming');
  }

  void dispose() {
    stopTelemetry();
  }
}
