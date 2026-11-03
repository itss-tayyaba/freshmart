import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import 'auth_provider.dart';

class CustomerOrdersState {
  final List<CustomerOrderModel> orders;
  final bool isLoading;
  final String? error;

  CustomerOrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
  });

  CustomerOrdersState copyWith({
    List<CustomerOrderModel>? orders,
    bool? isLoading,
    String? error,
  }) {
    return CustomerOrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CustomerOrdersNotifier extends StateNotifier<CustomerOrdersState> {
  final Ref _ref;

  CustomerOrdersNotifier(this._ref) : super(CustomerOrdersState(isLoading: false)) {
    fetchMyOrders();
  }

  Future<void> fetchMyOrders() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final api = _ref.read(customerApiProvider);
      final raw = await api.getMyOrders();
      final List<CustomerOrderModel> list = [];
      for (final it in raw) {
        if (it is Map<String, dynamic>) {
          list.add(CustomerOrderModel.fromJson(it));
        }
      }
      state = state.copyWith(orders: list, isLoading: false, error: null);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<CustomerOrderModel> trackSingleOrder(String orderId) async {
    try {
      final api = _ref.read(customerApiProvider);
      final raw = await api.trackOrder(orderId);
      final ordMap = raw['order'] ?? raw;
      return CustomerOrderModel.fromJson(ordMap as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<CustomerOrderModel> placeOrder(Map<String, dynamic> orderPayload) async {
    try {
      final api = _ref.read(customerApiProvider);
      final res = await api.createOrder(orderPayload);
      final ordMap = res['order'] ?? res;
      final created = CustomerOrderModel.fromJson(ordMap as Map<String, dynamic>);
      await fetchMyOrders();
      return created;
    } catch (e) {
      rethrow;
    }
  }
}

final customerOrdersProvider =
    StateNotifierProvider<CustomerOrdersNotifier, CustomerOrdersState>((ref) {
  return CustomerOrdersNotifier(ref);
});
