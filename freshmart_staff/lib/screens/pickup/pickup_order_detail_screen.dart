import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/pickup_orders_provider.dart';

class PickupOrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const PickupOrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pickupState = ref.watch(pickupOrdersProvider);
    final cleanTarget = orderId.replaceAll('#', '').toLowerCase();

    final order = pickupState.orders.firstWhere(
      (o) =>
          o.id.replaceAll('#', '').toLowerCase() == cleanTarget ||
          o.orderId.replaceAll('#', '').toLowerCase() == cleanTarget,
      orElse: () => OrderModel(
        id: orderId,
        orderId: orderId,
        status: 'Pending',
        customerName: 'Customer',
        customerPhone: '',
        address: '',
        city: '',
        totalAmount: 0,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        items: const [],
        createdAt: '',
      ),
    );

    return Scaffold(
      backgroundColor: AppConfig.backgroundColor,
      appBar: AppBar(
        title: Text(order.orderId.isNotEmpty ? order.orderId : '#${order.id}'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Packing Status Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Packing Status', style: TextStyle(fontSize: 11, color: AppConfig.textMuted)),
                    const SizedBox(height: 2),
                    Text(
                      order.status,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppConfig.primaryDark),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: () async {
                    final nextStatus = order.isPreparing ? 'Ready for Pickup' : 'Preparing';
                    await ref
                        .read(pickupOrdersProvider.notifier)
                        .updatePickupStatus(order.id.isNotEmpty ? order.id : order.orderId, nextStatus);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: order.isPreparing ? AppConfig.primaryColor : Colors.amber.shade700,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(order.isPreparing ? 'Mark Ready' : 'Start Preparing'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Items Checklist
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pick & Pack Items', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (order.items.isEmpty)
                  const Text('No items specified', style: TextStyle(color: Colors.grey))
                else
                  ...order.items.map(
                    (it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          const Icon(Icons.check_box_outline_blank, color: AppConfig.primaryColor, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${it.quantity}x ${it.name}',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            ),
                          ),
                          Text('Rs. ${(it.price * it.quantity).toStringAsFixed(0)}'),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
