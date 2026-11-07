import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiService {
  late final Dio dio;
  final FlutterSecureStorage storage = const FlutterSecureStorage();
  void Function()? onUnauthorized;

  ApiService({this.onUnauthorized}) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Initialize custom server URL if previously configured
    storage.read(key: 'custom_api_url').then((saved) {
      if (saved != null && saved.trim().isNotEmpty) {
        dio.options.baseUrl = saved.trim();
      }
    });

    // Auth & Error Interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.read(key: 'auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await storage.deleteAll();
            onUnauthorized?.call();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> updateBaseUrl(String newUrl) async {
    final clean = newUrl.trim();
    if (clean.isNotEmpty) {
      dio.options.baseUrl = clean;
      await storage.write(key: 'custom_api_url', value: clean);
    }
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String emailOrUsername, String password) async {
    try {
      final response = await dio.post('/auth/login', data: {
        'email': emailOrUsername,
        'password': password,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // --- Rider Endpoints ---
  Future<List<dynamic>> getRiderAssignedOrders() async {
    try {
      final response = await dio.get('/orders/assigned-to-me');
      final data = response.data;
      if (data is Map && data['orders'] is List) {
        return data['orders'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> sendRiderLocationToOrder(
    String orderId, {
    required double lat,
    required double lng,
    double? speed,
    double? heading,
  }) async {
    try {
      final cleanId = orderId.replaceAll('#', '');
      await dio.put('/orders/$cleanId/rider-location', data: {
        'lat': lat,
        'lng': lng,
        'speed': speed ?? 0.0,
        'heading': heading ?? 0.0,
      });
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> sendRiderLocationMe({
    required double lat,
    required double lng,
    double? speed,
    double? heading,
  }) async {
    try {
      await dio.put('/riders/me/location', data: {
        'lat': lat,
        'lng': lng,
        'speed': speed ?? 0.0,
        'heading': heading ?? 0.0,
      });
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> verifyDeliveryOtp(String orderId, String otp) async {
    try {
      final cleanId = orderId.replaceAll('#', '');
      final response = await dio.post('/orders/$cleanId/verify-delivery-otp', data: {
        'otp': otp,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // --- Pickup Staff Endpoints ---
  Future<List<dynamic>> getPickupAssignedOrders() async {
    try {
      final response = await dio.get('/orders/pickup-assigned-to-me');
      final data = response.data;
      if (data is Map && data['orders'] is List) {
        return data['orders'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateOrderPickupStatus(String orderId, String status) async {
    try {
      final cleanId = orderId.replaceAll('#', '');
      final response = await dio.put('/orders/$cleanId/pickup-status', data: {
        'status': status,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null && e.response?.data is Map) {
      final map = e.response!.data as Map;
      if (map['message'] != null) return map['message'].toString();
    }
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timed out. Please check your network connection.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Unable to reach FreshMart API server. Please check your network.';
    }
    return e.message ?? 'An unexpected network error occurred';
  }
}
