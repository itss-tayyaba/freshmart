class StaffUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String token;
  final String? riderId;
  final String? staffId;
  final String? branchId;
  final String? branchName;
  final String? tenantId;
  final String? tenantName;
  final String? phone;

  StaffUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.token,
    this.riderId,
    this.staffId,
    this.branchId,
    this.branchName,
    this.tenantId,
    this.tenantName,
    this.phone,
  });

  bool get isRider => role.toLowerCase().trim() == 'rider';
  
  bool get isPickupStaff {
    final r = role.toLowerCase().replaceAll('_', '').trim();
    return r == 'pickupstaff' || r == 'staff';
  }

  factory StaffUser.fromJson(Map<String, dynamic> json) {
    return StaffUser(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Staff Member',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      token: json['token']?.toString() ?? '',
      riderId: json['riderId']?.toString() ?? json['id']?.toString(),
      staffId: json['staffId']?.toString() ?? json['id']?.toString(),
      branchId: json['branchId']?.toString(),
      branchName: json['branchName']?.toString(),
      tenantId: json['tenantId']?.toString(),
      tenantName: json['tenantName']?.toString(),
      phone: json['phone']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'token': token,
      'riderId': riderId,
      'staffId': staffId,
      'branchId': branchId,
      'branchName': branchName,
      'tenantId': tenantId,
      'tenantName': tenantName,
      'phone': phone,
    };
  }
}
