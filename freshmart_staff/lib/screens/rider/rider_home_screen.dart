import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/rider_orders_provider.dart';

class RiderHomeScreen extends ConsumerWidget {
  const RiderHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final riderOrdersState = ref.watch(riderOrdersProvider);
    final locationService = ref.watch(locationServiceProvider);
    final user = authState.user;

    final orders = riderOrdersState.orders;
    final activeOrders = orders.where((o) => !o.isDelivered).toList();
    final deliveredOrders = orders.where((o) => o.isDelivered).toList();

    return Scaffold(
      backgroundColor: AppConfig.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user?.name ?? 'Rider Fleet',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: locationService.isStreaming ? Colors.amberAccent : Colors.lightGreenAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  locationService.isStreaming ? 'GPS Active (Streaming)' : 'On Duty · Lahore Hub',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w400, color: Colors.white70),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Orders',
            onPressed: () {
              ref.read(riderOrdersProvider.notifier).fetchAssignedOrders();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Confirm Logout'),
                  content: const Text('Are you sure you want to log out of the courier console?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Log Out'),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                ref.read(locationServiceProvider).stopTelemetry();
                await ref.read(authNotifierProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(riderOrdersProvider.notifier).fetchAssignedOrders(),
        child: riderOrdersState.isLoading && orders.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppConfig.primaryColor))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // KPI Cards
                  Row(
                    children: [
                      _buildKpiCard(
                        title: 'Active Runs',
                        count: '${activeOrders.length}',
                        icon: Icons.delivery_dining,
                        color: AppConfig.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _buildKpiCard(
                        title: 'Completed',
                        count: '${deliveredOrders.length}',
                        icon: Icons.check_circle_outline,
                        color: Colors.blue.shade700,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Assigned Deliveries',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppConfig.textDark,
                        ),
                      ),
                      if (riderOrdersState.lastRefreshed != null)
                        Text(
                          'Updated just now',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (orders.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.inbox_outlined, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'No Assigned Parcels',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'New parcel orders dispatched to your courier ID will appear here automatically.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    )
                  else
                    ...orders.map((order) => _buildOrderCard(context, order)),
                ],
              ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String count,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
                Text(
                  title,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, OrderModel order) {
    Color statusBg = Colors.grey.shade100;
    Color statusColor = Colors.grey.shade800;

    if (order.isDelivered) {
      statusBg = Colors.green.shade50;
      statusColor = Colors.green.shade700;
    } else if (order.isOutForDelivery) {
      statusBg = Colors.amber.shade50;
      statusColor = Colors.amber.shade800;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: Border.all(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.go('/rider/order/${order.id.isNotEmpty ? order.id : order.orderId}'),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text(
                    order.orderId.isNotEmpty ? order.orderId : '#${order.id}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppConfig.primaryDark),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      order.status,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.person_pin, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(
                    order.customerName,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${order.address}, ${order.city}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text(
                    '${order.items.length} Item${order.items.length > 1 ? 's' : ''}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  Text(
                    'Rs. ${order.totalAmount.toStringAsFixed(0)} (COD)',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppConfig.textDark),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
