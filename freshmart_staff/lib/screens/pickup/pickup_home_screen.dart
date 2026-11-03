import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/pickup_orders_provider.dart';

class PickupHomeScreen extends ConsumerWidget {
  const PickupHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final pickupState = ref.watch(pickupOrdersProvider);
    final user = authState.user;

    final orders = pickupState.orders;
    final pendingOrders = orders.where((o) => !o.isReadyForPickup && !o.isDelivered).toList();
    final readyOrders = orders.where((o) => o.isReadyForPickup).toList();

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
              user?.name ?? 'Pickup Station',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Warehouse Fulfillment & Packing Station',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w400, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Queue',
            onPressed: () {
              ref.read(pickupOrdersProvider.notifier).fetchPickupOrders();
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
                  content: const Text('Are you sure you want to log out of the pickup console?'),
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
                await ref.read(authNotifierProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(pickupOrdersProvider.notifier).fetchPickupOrders(),
        child: pickupState.isLoading && orders.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppConfig.primaryColor))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // KPI Cards
                  Row(
                    children: [
                      _buildKpiCard(
                        title: 'To Pack / Prep',
                        count: '${pendingOrders.length}',
                        icon: Icons.inventory_2_outlined,
                        color: Colors.amber.shade700,
                      ),
                      const SizedBox(width: 12),
                      _buildKpiCard(
                        title: 'Ready for Dispatch',
                        count: '${readyOrders.length}',
                        icon: Icons.check_box_outlined,
                        color: AppConfig.primaryColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Packing Queue',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppConfig.textDark),
                      ),
                      if (pickupState.lastRefreshed != null)
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
                          Icon(Icons.inventory_rounded, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'Packing Queue Empty',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Customer orders requiring packing or pickup will automatically appear here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    )
                  else
                    ...orders.map((order) => _buildPickupCard(context, ref, order)),
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

  Widget _buildPickupCard(BuildContext context, WidgetRef ref, OrderModel order) {
    Color statusBg = Colors.grey.shade100;
    Color statusColor = Colors.grey.shade800;

    if (order.isReadyForPickup) {
      statusBg = Colors.green.shade50;
      statusColor = Colors.green.shade700;
    } else if (order.isPreparing) {
      statusBg = Colors.amber.shade50;
      statusColor = Colors.amber.shade800;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: Border.all(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Order ID & Status
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

            // Items Count and preview
            Text(
              '${order.items.length} Item${order.items.length > 1 ? 's' : ''} to pack:',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConfig.textMuted),
            ),
            const SizedBox(height: 4),
            ...order.items.take(3).map(
                  (it) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text(
                      '• ${it.quantity}x ${it.name}',
                      style: const TextStyle(fontSize: 13, color: AppConfig.textDark),
                    ),
                  ),
                ),
            if (order.items.length > 3)
              Text(
                '+ ${order.items.length - 3} more items',
                style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey),
              ),

            const Divider(height: 20),

            // Operational Action Buttons: Start Preparing / Ready for Pickup
            Row(
              children: [
                if (!order.isPreparing && !order.isReadyForPickup) ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          await ref
                              .read(pickupOrdersProvider.notifier)
                              .updatePickupStatus(order.id.isNotEmpty ? order.id : order.orderId, 'Preparing');
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Order #${order.id} marked Preparing'),
                              backgroundColor: Colors.amber.shade700,
                            ),
                          );
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                          );
                        }
                      },
                      icon: const Icon(Icons.play_arrow_rounded, size: 18),
                      label: const Text('Start Preparing'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],

                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: order.isReadyForPickup
                        ? null
                        : () async {
                            try {
                              await ref
                                  .read(pickupOrdersProvider.notifier)
                                  .updatePickupStatus(order.id.isNotEmpty ? order.id : order.orderId, 'Ready for Pickup');
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Order marked Ready for Pickup / Dispatch'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                              );
                            }
                          },
                    icon: const Icon(Icons.check_circle_outline, size: 18),
                    label: Text(order.isReadyForPickup ? 'Ready' : 'Ready for Pickup'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConfig.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
