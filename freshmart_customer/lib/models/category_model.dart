class CategoryModel {
  final String id;
  final String name;
  final String icon;
  final String? image;

  CategoryModel({
    required this.id,
    required this.name,
    required this.icon,
    this.image,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      icon: json['icon']?.toString() ?? '🛒',
      image: json['image']?.toString(),
    );
  }
}
