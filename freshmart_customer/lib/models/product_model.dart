class ProductModel {
  final String id;
  final String name;
  final String category;
  final double price;
  final double? originalPrice;
  final String unit;
  final String image;
  final bool inStock;
  final String? description;

  ProductModel({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    this.originalPrice,
    required this.unit,
    required this.image,
    required this.inStock,
    this.description,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Product',
      category: json['category']?.toString() ?? 'General',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      unit: json['unit']?.toString() ?? '1 unit',
      image: json['image']?.toString() ?? '',
      inStock: json['inStock'] == true || (json['stock'] != null && (json['stock'] as num) > 0),
      description: json['description']?.toString(),
    );
  }
}
