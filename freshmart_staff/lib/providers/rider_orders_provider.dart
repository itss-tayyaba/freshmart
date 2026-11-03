import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import '../services/location_service.dart';
import 'auth_provider.dart';

final locationServiceProvider = Provider<LocationTelemetryService>((ref) {
  final api = ref.watch(apiServiceProvider);
  final service = LocationTelemetryService(api);
  ref.onDispose(() => service.dispose());
  return service;
});

class RiderOrdersState {
  final List<OrderModel> orders;
  final bool isLoading;
  final String? error;
  final DateTime? lastRefreshed;

  RiderOrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
    this.lastRefreshed,
  });

  RiderOrdersState copyWith({
    List<OrderModel>? orders,
    bool? isLoading,
    String? error,
    DateTime? lastRefreshed,
  }) {
    return RiderOrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastRefreshed: lastRefreshed ?? this.lastRefreshed,
    );
  }
}

class RiderOrdersNotifier extends StateNotifier<RiderOrdersState> {
  final Ref _ref;
  Timer? _pollingTimer;

  RiderOrdersNotifier(this._ref) : super(RiderOrdersState(isLoading: true)) {
    fetchAssignedOrders();
    // Auto-refresh orders every 15 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      fetchAssignedOrders(isSilent: true);
    });
  }

  Future<void> fetchAssignedOrders({bool isSilent = false}) async {
    if (!isSilent) {
      state = state.copyWith(isLoading: true, error: null);
    }
    try {
      final api = _ref.read(apiServiceProvider);
      final raw = await api.getRiderAssignedOrders();
      final List<OrderModel> list = [];
      for (final it in raw) {
        if (it is Map<String, dynamic>) {
          list.add(OrderModel.fromJson(it));
        }
      }

      state = state.copyWith(
        orders: list,
        isLoading: false,
        error: null,
        lastRefreshed: DateTime.now(),
      );

      // Check if any order is currently Out for Delivery; if so, maintain GPS stream
      _syncGpsStream(list);
    } catch (e) {
      if (!isSilent) {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    }
  }

  void _syncGpsStream(List<OrderModel> orders) {
    final telemetry = _ref.read(locationServiceProvider);
    final activeOut = orders.firstWhere(
      (o) => o.isOutForDelivery,
      orElse: () => OrderModel(
        id: '',
        orderId: '',
        status: '',
        customerName: '',
        customerPhone: '',
        address: '',
        city: '',
        totalAmount: 0,
        paymentMethod: '',
        paymentStatus: '',
        items: const [],
        createdAt: '',
      ),
    );

    if (activeOut.id.isNotEmpty) {
      telemetry.startTelemetry(orderId: activeOut.orderId.isNotEmpty ? activeOut.orderId : activeOut.id);
    } else {
      telemetry.stopTelemetry();
    }
  }

  Future<bool> verifyDeliveryOtp(String orderId, String otp) async {
    try {
      final api = _ref.read(apiServiceProvider);
      final res = await api.verifyDeliveryOtp(orderId, otp);
      if (res['success'] == true) {
        await fetchAssignedOrders();
        return true;
      }
      return false;
    } catch (e) {
      rethrow;
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

final riderOrdersProvider = StateNotifierProvider<RiderOrdersNotifier, RiderOrdersState>((ref) {
  return RiderOrdersNotifier(ref);
});
