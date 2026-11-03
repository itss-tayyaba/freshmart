import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final customerApiProvider = Provider<CustomerApiService>((ref) {
  return CustomerApiService(
    onUnauthorized: () {
      ref.read(customerAuthNotifierProvider.notifier).logout();
    },
  );
});

class CustomerUser {
  final String id;
  final String name;
  final String email;
  final String token;
  final String? phone;
  final String? address;

  CustomerUser({
    required this.id,
    required this.name,
    required this.email,
    required this.token,
    this.phone,
    this.address,
  });

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Customer',
      email: json['email']?.toString() ?? '',
      token: json['token']?.toString() ?? '',
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'token': token,
      'phone': phone,
      'address': address,
    };
  }
}

class CustomerAuthState {
  final CustomerUser? user;
  final bool isLoading;
  final String? error;

  CustomerAuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null && user!.token.isNotEmpty;

  CustomerAuthState copyWith({
    CustomerUser? user,
    bool? isLoading,
    String? error,
  }) {
    return CustomerAuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CustomerAuthNotifier extends StateNotifier<CustomerAuthState> {
  final CustomerApiService _api;

  CustomerAuthNotifier(this._api) : super(CustomerAuthState(isLoading: true)) {
    checkSavedSession();
  }

  Future<void> checkSavedSession() async {
    try {
      final token = await _api.storage.read(key: 'auth_token');
      final userStr = await _api.storage.read(key: 'customer_user');
      if (token != null && userStr != null) {
        final map = jsonDecode(userStr) as Map<String, dynamic>;
        state = CustomerAuthState(user: CustomerUser.fromJson(map), isLoading: false);
        return;
      }
    } catch (_) {}
    state = CustomerAuthState(isLoading: false);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.login(email, password);
      final user = CustomerUser.fromJson(res);
      await _api.storage.write(key: 'auth_token', value: user.token);
      await _api.storage.write(key: 'customer_user', value: jsonEncode(user.toJson()));
      state = CustomerAuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    String? address,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
        address: address,
      );
      final user = CustomerUser.fromJson(res);
      await _api.storage.write(key: 'auth_token', value: user.token);
      await _api.storage.write(key: 'customer_user', value: jsonEncode(user.toJson()));
      state = CustomerAuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _api.storage.deleteAll();
    state = CustomerAuthState(user: null, isLoading: false);
  }
}

final customerAuthNotifierProvider =
    StateNotifierProvider<CustomerAuthNotifier, CustomerAuthState>((ref) {
  final api = ref.watch(customerApiProvider);
  return CustomerAuthNotifier(api);
});
