import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/customer_orders_provider.dart';
import '../../providers/auth_provider.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(customerAuthNotifierProvider);
    final ordersState = ref.watch(customerOrdersProvider);

    return Scaffold(
      backgroundColor: AppConfig.backgroundColor,
      appBar: AppBar(
        title: const Text('My Grocery Orders'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Orders',
            onPressed: () => ref.read(customerOrdersProvider.notifier).fetchMyOrders(),
          ),
          if (authState.isAuthenticated)
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Sign Out',
              onPressed: () => ref.read(customerAuthNotifierProvider.notifier).logout(),
            ),
        ],
      ),
      body: !authState.isAuthenticated
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline, size: 54, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Sign In to View Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Text('Access your live deliveries, receipts, and order history', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => context.push('/login'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppConfig.primaryColor, foregroundColor: Colors.white),
                    child: const Text('Sign In / Register'),
                  ),
                ],
              ),
            )
          : ordersState.isLoading
              ? const Center(child: CircularProgressIndicator(color: AppConfig.primaryColor))
              : ordersState.orders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long_outlined, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text('No Orders Found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          const Text('Your completed and active orders will appear here', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () => context.go('/'),
                            style: ElevatedButton.styleFrom(backgroundColor: AppConfig.primaryColor, foregroundColor: Colors.white),
                            child: const Text('Start Shopping'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => ref.read(customerOrdersProvider.notifier).fetchMyOrders(),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: ordersState.orders.length,
                        itemBuilder: (context, idx) {
                          final o = ordersState.orders[idx];
                          return _buildOrderHistoryCard(context, o);
                        },
                      ),
                    ),
    );
  }

  Widget _buildOrderHistoryCard(BuildContext context, CustomerOrderModel o) {
    Color statusBg = Colors.grey.shade100;
    Color statusColor = Colors.grey.shade800;

    if (o.status.toLowerCase() == 'delivered') {
      statusBg = Colors.green.shade50;
      statusColor = Colors.green.shade700;
    } else if (o.status.toLowerCase() == 'out for delivery' || o.status.toLowerCase() == 'in transit') {
      statusBg = Colors.amber.shade50;
      statusColor = Colors.amber.shade800;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          final idToTrack = o.orderId.isNotEmpty ? o.orderId : o.id;
          context.push('/track/$idToTrack');
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text(o.orderId.isNotEmpty ? o.orderId : '#${o.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppConfig.primaryDark)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8)),
                    child: Text(o.status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('${o.items.length} Items · Rs. ${o.totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text('Delivery to: ${o.address}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600), maxLines: 1, overflow: TextOverflow.ellipsis),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Track Live Status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConfig.primaryColor)),
                  const Icon(Icons.arrow_forward_ios, size: 14, color: AppConfig.primaryColor),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
