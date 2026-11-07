import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

final Provider<ApiService> apiServiceProvider = Provider<ApiService>((ref) {
  final api = ApiService(
    onUnauthorized: () {
      ref.read(authNotifierProvider.notifier).logout();
    },
  );
  return api;
});

class AuthState {
  final StaffUser? user;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null && user!.token.isNotEmpty;

  AuthState copyWith({
    StaffUser? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(AuthState(isLoading: true)) {
    checkSavedSession();
  }

  Future<void> checkSavedSession() async {
    try {
      final token = await _apiService.storage.read(key: 'auth_token');
      final userDataStr = await _apiService.storage.read(key: 'user_data');
      if (token != null && userDataStr != null) {
        final decoded = jsonDecode(userDataStr) as Map<String, dynamic>;
        final user = StaffUser.fromJson(decoded);
        state = AuthState(user: user, isLoading: false);
        return;
      }
    } catch (_) {}
    state = AuthState(isLoading: false);
  }

  Future<bool> login(String emailOrUsername, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _apiService.login(emailOrUsername, password);
      final rawRole = (res['role'] ?? '').toString().toLowerCase().trim();
      final isRider = rawRole == 'rider';
      final isPickup = rawRole.replaceAll('_', '') == 'pickupstaff' || rawRole == 'staff';

      if (!isRider && !isPickup) {
        state = state.copyWith(
          isLoading: false,
          error: 'Access restricted: This app is for delivery and pickup staff only.',
        );
        return false;
      }

      final user = StaffUser.fromJson(res);
      await _apiService.storage.write(key: 'auth_token', value: user.token);
      await _apiService.storage.write(key: 'user_data', value: jsonEncode(user.toJson()));

      state = AuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.storage.deleteAll();
    state = AuthState(user: null, isLoading: false);
  }
}

final StateNotifierProvider<AuthNotifier, AuthState> authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AuthNotifier(api);
});
