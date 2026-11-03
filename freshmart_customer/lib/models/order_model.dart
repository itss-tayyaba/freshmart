class CustomerOrderItem {
  final String name;
  final int quantity;
  final double price;
  final String? image;

  CustomerOrderItem({
    required this.name,
    required this.quantity,
    required this.price,
    this.image,
  });

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    return CustomerOrderItem(
      name: json['name']?.toString() ?? 'Item',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      image: json['image']?.toString(),
    );
  }
}

class CustomerOrderModel {
  final String id;
  final String orderId;
  final String status;
  final double totalPrice;
  final String paymentMethod;
  final String paymentStatus;
  final String address;
  final String city;
  final String? eta;
  final String? deliveryOtp;
  final List<CustomerOrderItem> items;
  final double? riderLat;
  final double? riderLng;
  final String? riderName;
  final String? riderPhone;
  final String createdAt;

  CustomerOrderModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.totalPrice,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.address,
    required this.city,
    this.eta,
    this.deliveryOtp,
    required this.items,
    this.riderLat,
    this.riderLng,
    this.riderName,
    this.riderPhone,
    required this.createdAt,
  });

  factory CustomerOrderModel.fromJson(Map<String, dynamic> json) {
    final shipping = json['shippingAddress'] is Map ? json['shippingAddress'] as Map<String, dynamic> : null;
    final assigned = json['assignedRider'] is Map ? json['assignedRider'] as Map<String, dynamic> : null;
    final riderCoords = assigned?['coordinates'] is Map ? assigned!['coordinates'] as Map<String, dynamic> : null;

    final rawList = json['orderItems'] ?? json['rawItems'] ?? json['items'];
    final List<CustomerOrderItem> itemsList = [];
    if (rawList is List) {
      for (final it in rawList) {
        if (it is Map<String, dynamic>) {
          itemsList.add(CustomerOrderItem.fromJson(it));
        }
      }
    }

    final rawTotal = json['totalPrice'] ?? json['totalAmount'] ?? json['total'] ?? 0;

    return CustomerOrderModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      totalPrice: (rawTotal as num).toDouble(),
      paymentMethod: json['paymentMethod']?.toString() ?? 'Cash on Delivery',
      paymentStatus: json['paymentStatus']?.toString() ?? 'Pending',
      address: json['address']?.toString() ?? shipping?['address']?.toString() ?? 'Lahore',
      city: json['city']?.toString() ?? shipping?['city']?.toString() ?? 'Lahore',
      eta: json['eta']?.toString() ?? assigned?['eta']?.toString() ?? '15-20 mins',
      deliveryOtp: json['deliveryOtp']?.toString(),
      items: itemsList,
      riderLat: riderCoords?['lat'] != null ? (riderCoords!['lat'] as num).toDouble() : null,
      riderLng: riderCoords?['lng'] != null ? (riderCoords!['lng'] as num).toDouble() : null,
      riderName: assigned?['name']?.toString(),
      riderPhone: assigned?['phone']?.toString(),
      createdAt: json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }
}
