class OrderItem {
  final String name;
  final int quantity;
  final double price;
  final String? image;

  OrderItem({
    required this.name,
    required this.quantity,
    required this.price,
    this.image,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      name: json['name']?.toString() ?? 'Item',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      image: json['image']?.toString(),
    );
  }
}

class OrderModel {
  final String id;
  final String orderId;
  final String status;
  final String customerName;
  final String customerPhone;
  final String address;
  final String city;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final List<OrderItem> items;
  final double? destinationLat;
  final double? destinationLng;
  final String? deliveryOtp;
  final String? pickupStaffId;
  final String? pickupStaffName;
  final String? assignedRiderId;
  final String? assignedRiderName;
  final String createdAt;

  OrderModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.customerName,
    required this.customerPhone,
    required this.address,
    required this.city,
    required this.totalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.items,
    this.destinationLat,
    this.destinationLng,
    this.deliveryOtp,
    this.pickupStaffId,
    this.pickupStaffName,
    this.assignedRiderId,
    this.assignedRiderName,
    required this.createdAt,
  });

  bool get isOutForDelivery {
    final s = status.toLowerCase();
    return s == 'out for delivery' || s == 'in transit';
  }

  bool get isPreparing {
    final s = status.toLowerCase();
    return s == 'preparing' || s == 'picking';
  }

  bool get isReadyForPickup {
    final s = status.toLowerCase();
    return s == 'ready for pickup' || s == 'ready' || s == 'prepared' || s == 'ready for dispatch';
  }

  bool get isDelivered {
    final s = status.toLowerCase();
    return s == 'delivered' || s == 'completed';
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final shipping = json['shippingAddress'] is Map ? json['shippingAddress'] as Map<String, dynamic> : null;
    final dest = json['destinationCoords'] is Map ? json['destinationCoords'] as Map<String, dynamic> : null;
    final assigned = json['assignedRider'] is Map ? json['assignedRider'] as Map<String, dynamic> : null;

    final rawList = json['orderItems'] ?? json['rawItems'] ?? json['items'];
    final List<OrderItem> itemsList = [];
    if (rawList is List) {
      for (final it in rawList) {
        if (it is Map<String, dynamic>) {
          itemsList.add(OrderItem.fromJson(it));
        }
      }
    }

    final rawTotal = json['totalPrice'] ?? json['totalAmount'] ?? json['total'] ?? 0;

    return OrderModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      customerName: json['customerName']?.toString() ?? shipping?['fullName']?.toString() ?? 'Customer',
      customerPhone: json['customerPhone']?.toString() ?? shipping?['phone']?.toString() ?? '',
      address: json['address']?.toString() ?? shipping?['address']?.toString() ?? 'Delivery Address',
      city: json['city']?.toString() ?? shipping?['city']?.toString() ?? 'Lahore',
      totalAmount: (rawTotal as num).toDouble(),
      paymentMethod: json['paymentMethod']?.toString() ?? json['payment']?.toString() ?? 'Cash on Delivery (COD)',
      paymentStatus: json['paymentStatus']?.toString() ?? 'Pending',
      items: itemsList,
      destinationLat: dest?['lat'] != null ? (dest!['lat'] as num).toDouble() : null,
      destinationLng: dest?['lng'] != null ? (dest!['lng'] as num).toDouble() : null,
      deliveryOtp: json['deliveryOtp']?.toString(),
      pickupStaffId: json['pickupStaffId']?.toString(),
      pickupStaffName: json['pickupStaffName']?.toString(),
      assignedRiderId: assigned?['id']?.toString() ?? assigned?['riderId']?.toString(),
      assignedRiderName: assigned?['name']?.toString(),
      createdAt: json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }
}
