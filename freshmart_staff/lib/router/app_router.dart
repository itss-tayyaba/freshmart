import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/rider/rider_home_screen.dart';
import '../screens/rider/rider_order_detail_screen.dart';
import '../screens/pickup/pickup_home_screen.dart';
import '../screens/pickup/pickup_order_detail_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (BuildContext context, GoRouterState state) {
      final isLoggingIn = state.matchedLocation == '/login';

      if (!authState.isAuthenticated) {
        return isLoggingIn ? null : '/login';
      }

      final user = authState.user;
      if (user == null) return '/login';

      if (isLoggingIn || state.matchedLocation == '/') {
        if (user.isRider) return '/rider';
        if (user.isPickupStaff) return '/pickup';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/rider',
        builder: (context, state) => const RiderHomeScreen(),
        routes: [
          GoRoute(
            path: 'order/:id',
            builder: (context, state) {
              final id = state.pathParameters['id'] ?? '';
              return RiderOrderDetailScreen(orderId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/pickup',
        builder: (context, state) => const PickupHomeScreen(),
        routes: [
          GoRoute(
            path: 'order/:id',
            builder: (context, state) {
              final id = state.pathParameters['id'] ?? '';
              return PickupOrderDetailScreen(orderId: id);
            },
          ),
        ],
      ),
    ],
  );
});
