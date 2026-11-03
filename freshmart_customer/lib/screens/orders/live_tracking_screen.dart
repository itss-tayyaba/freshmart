import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_config.dart';
import '../../models/order_model.dart';
import '../../providers/customer_orders_provider.dart';

class LiveTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;

  const LiveTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends ConsumerState<LiveTrackingScreen> {
  CustomerOrderModel? _order;
  bool _isLoading = true;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _fetchLiveStatus();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchLiveStatus(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLiveStatus({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final ord = await ref.read(customerOrdersProvider.notifier).trackSingleOrder(widget.orderId);
      if (mounted) {
        setState(() {
          _order = ord;
          _isLoading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          if (!silent) _isLoading = false;
        });
      }
    }
  }

  Future<void> _callCourier(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri(scheme: 'tel', path: clean);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConfig.backgroundColor,
      appBar: AppBar(
        title: Text('Track ${widget.orderId.startsWith('#') ? widget.orderId : '#${widget.orderId}'}'),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchLiveStatus(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppConfig.primaryColor))
          : _error != null && _order == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => _fetchLiveStatus(),
                          child: const Text('Try Again'),
                        ),
                      ],
                    ),
                  ),
                )
              : _buildTrackingContent(_order!),
    );
  }

  Widget _buildTrackingContent(CustomerOrderModel order) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Live ETA Banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppConfig.primaryColor, Color(0xFF047857)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ESTIMATED ARRIVAL', style: TextStyle(color: Colors.amberAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      order.status.toLowerCase() == 'delivered' ? 'Delivered to Doorstep 🎉' : (order.eta ?? '10-15 Minutes'),
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Live Tracking: ${order.status}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.delivery_dining, size: 48, color: Colors.white),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // OTP Display Card
        if (order.deliveryOtp != null && order.status.toLowerCase() != 'delivered')
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.amber.shade200, shape: BoxShape.circle),
                  child: const Icon(Icons.key, color: Colors.amber, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Delivery Handover OTP',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Share this 4-digit code with the rider when receiving your parcel:',
                        style: TextStyle(fontSize: 11, color: Colors.brown),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        order.deliveryOtp!,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 6,
                          color: AppConfig.textDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),

        // Courier Contact Card (if assigned)
        if (order.riderName != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppConfig.primaryColor.withOpacity(0.12),
                  child: const Icon(Icons.person, color: AppConfig.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.riderName!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const Text('Your FreshMart Express Courier', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                if (order.riderPhone != null && order.riderPhone!.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.phone, color: Colors.green),
                    onPressed: () => _callCourier(order.riderPhone!),
                  ),
              ],
            ),
          ),
        const SizedBox(height: 16),

        // Order Items & Delivery Location
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
              const Text('Delivery Destination', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              Text(order.address, style: const TextStyle(fontSize: 13, color: AppConfig.textDark)),
              Text(order.city, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              const Divider(height: 24),
              const Text('Items Ordered', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              ...order.items.map(
                (it) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Text('${it.quantity}x ${it.name}', style: const TextStyle(fontSize: 13)),
                      Text('Rs. ${(it.price * it.quantity).toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Text('Total Bill', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('Rs. ${order.totalPrice.toStringAsFixed(0)} (${order.paymentMethod})', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppConfig.primaryDark)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
