import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import 'auth_provider.dart';

class PickupOrdersState {
  final List<OrderModel> orders;
  final bool isLoading;
  final String? error;
  final DateTime? lastRefreshed;

  PickupOrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
    this.lastRefreshed,
  });

  PickupOrdersState copyWith({
    List<OrderModel>? orders,
    bool? isLoading,
    String? error,
    DateTime? lastRefreshed,
  }) {
    return PickupOrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastRefreshed: lastRefreshed ?? this.lastRefreshed,
    );
  }
}

class PickupOrdersNotifier extends StateNotifier<PickupOrdersState> {
  final Ref _ref;
  Timer? _pollingTimer;

  PickupOrdersNotifier(this._ref) : super(PickupOrdersState(isLoading: true)) {
    fetchPickupOrders();
    // Auto-refresh orders every 15 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      fetchPickupOrders(isSilent: true);
    });
  }

  Future<void> fetchPickupOrders({bool isSilent = false}) async {
    if (!isSilent) {
      state = state.copyWith(isLoading: true, error: null);
    }
    try {
      final api = _ref.read(apiServiceProvider);
      final raw = await api.getPickupAssignedOrders();
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
    } catch (e) {
      if (!isSilent) {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    }
  }

  Future<bool> updatePickupStatus(String orderId, String newStatus) async {
    try {
      final api = _ref.read(apiServiceProvider);
      await api.updateOrderPickupStatus(orderId, newStatus);
      await fetchPickupOrders(isSilent: true);
      return true;
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

final pickupOrdersProvider = StateNotifierProvider<PickupOrdersNotifier, PickupOrdersState>((ref) {
  return PickupOrdersNotifier(ref);
});
