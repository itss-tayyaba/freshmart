import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/rider_orders_provider.dart';

class RiderOrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;

  const RiderOrderDetailScreen({super.key, required this.orderId});

  @override
  ConsumerState<RiderOrderDetailScreen> createState() => _RiderOrderDetailScreenState();
}

class _RiderOrderDetailScreenState extends ConsumerState<RiderOrderDetailScreen> {
  final _otpController = TextEditingController();
  bool _isSubmittingOtp = false;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _makePhoneCall(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: cleanPhone,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not place call to $phone')),
        );
      }
    }
  }

  Future<void> _openGoogleMaps(OrderModel order) async {
    Uri mapsUri;
    if (order.destinationLat != null && order.destinationLng != null) {
      mapsUri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${order.destinationLat},${order.destinationLng}',
      );
    } else {
      final query = Uri.encodeComponent('${order.address}, ${order.city}');
      mapsUri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    }

    if (await canLaunchUrl(mapsUri)) {
      await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
    }
  }

  void _showOtpDialog(OrderModel order) {
    _otpController.clear();
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.shield_outlined, color: AppConfig.primaryColor),
                SizedBox(width: 8),
                Text('Customer Delivery OTP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ask the customer for their 4-digit verification code to complete the parcel delivery and collect cash.',
                  style: TextStyle(fontSize: 12, color: AppConfig.textMuted),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                  decoration: InputDecoration(
                    hintText: '••••',
                    counterText: '',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConfig.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _isSubmittingOtp
                    ? null
                    : () async {
                        final otp = _otpController.text.trim();
                        if (otp.length != 4) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please enter a valid 4-digit OTP')),
                          );
                          return;
                        }

                        setDialogState(() => _isSubmittingOtp = true);
                        try {
                          final success = await ref
                              .read(riderOrdersProvider.notifier)
                              .verifyDeliveryOtp(order.id.isNotEmpty ? order.id : order.orderId, otp);

                          if (success && mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Order delivered successfully! Cash collected.'),
                                backgroundColor: Colors.green,
                              ),
                            );
                            context.pop();
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(e.toString()),
                                backgroundColor: Colors.red.shade700,
                              ),
                            );
                          }
                        } finally {
                          if (mounted) {
                            setDialogState(() => _isSubmittingOtp = false);
                          }
                        }
                      },
                child: _isSubmittingOtp
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Verify & Complete'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final riderState = ref.watch(riderOrdersProvider);
    final cleanTarget = widget.orderId.replaceAll('#', '').toLowerCase();

    final order = riderState.orders.firstWhere(
      (o) =>
          o.id.replaceAll('#', '').toLowerCase() == cleanTarget ||
          o.orderId.replaceAll('#', '').toLowerCase() == cleanTarget,
      orElse: () => OrderModel(
        id: widget.orderId,
        orderId: widget.orderId,
        status: 'Loading',
        customerName: 'Customer',
        customerPhone: '',
        address: 'Loading address...',
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
          // Order Header Status Card
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
                    const Text('Status', style: TextStyle(fontSize: 11, color: AppConfig.textMuted)),
                    const SizedBox(height: 2),
                    Text(
                      order.status,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppConfig.primaryDark),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: order.isDelivered ? Colors.green.shade50 : Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    order.isDelivered ? 'Handover Complete' : 'In Progress',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: order.isDelivered ? Colors.green.shade700 : Colors.amber.shade800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Customer Contact Card
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
                const Text('Customer Info', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.customerName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text(
                          order.customerPhone.isNotEmpty ? order.customerPhone : 'No phone provided',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                    if (order.customerPhone.isNotEmpty)
                      ElevatedButton.icon(
                        onPressed: () => _makePhoneCall(order.customerPhone),
                        icon: const Icon(Icons.call, size: 16),
                        label: const Text('Call'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade600,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                  ],
                ),
                const Divider(height: 24),
                // Address & Open in Google Maps
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on, size: 20, color: Colors.redAccent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(order.address, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                          Text(order.city, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => _openGoogleMaps(order),
                  icon: const Icon(Icons.map_outlined, size: 16),
                  label: const Text('Open in Google Maps'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppConfig.primaryColor,
                    side: const BorderSide(color: AppConfig.primaryColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Items List
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
                const Text('Parcel Items', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                if (order.items.isEmpty)
                  const Text('Standard Grocery Package', style: TextStyle(fontSize: 12, color: Colors.grey))
                else
                  ...order.items.map(
                    (it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text('${it.quantity}x ${it.name}', style: const TextStyle(fontSize: 13)),
                          ),
                          Text('Rs. ${(it.price * it.quantity).toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Cash to Collect', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    Text(
                      'Rs. ${order.totalAmount.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppConfig.primaryDark),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action Button: "Delivered" (Opens OTP verification)
          if (!order.isDelivered)
            ElevatedButton.icon(
              onPressed: () => _showOtpDialog(order),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Confirm Delivery & Verify OTP'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 8),
                  Text(
                    'Order Delivered & Payment Settled',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
