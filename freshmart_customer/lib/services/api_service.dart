import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class CustomerApiService {
  late final Dio dio;
  final FlutterSecureStorage storage = const FlutterSecureStorage();
  void Function()? onUnauthorized;

  CustomerApiService({this.onUnauthorized}) {
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

  // --- Catalog ---
  Future<List<dynamic>> getProducts() async {
    try {
      final res = await dio.get('/products');
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['products'] is List) {
        return res.data['products'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getCategories() async {
    try {
      final res = await dio.get('/categories');
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['categories'] is List) {
        return res.data['categories'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final res = await dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    String? address,
  }) async {
    try {
      final res = await dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        'address': address ?? 'Lahore, Pakistan',
      });
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // --- Orders & Tracking ---
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderPayload) async {
    try {
      final res = await dio.post('/orders', data: orderPayload);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> trackOrder(String orderId) async {
    try {
      final cleanId = orderId.replaceAll('#', '');
      final res = await dio.get('/orders/track/$cleanId');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getMyOrders() async {
    try {
      final res = await dio.get('/orders/mine');
      if (res.data is Map && res.data['orders'] is List) {
        return res.data['orders'] as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> validatePromotion(String code, double cartTotal) async {
    try {
      final res = await dio.post('/promotions/validate', data: {
        'code': code,
        'cartTotal': cartTotal,
      });
      return res.data as Map<String, dynamic>;
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
      return 'Connection timed out. Please check network connection.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Could not connect to FreshMart server.';
    }
    return e.message ?? 'An unexpected network error occurred';
  }
}
