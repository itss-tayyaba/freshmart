import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';
import 'auth_provider.dart';

final productsFutureProvider = FutureProvider<List<ProductModel>>((ref) async {
  final api = ref.watch(customerApiProvider);
  final raw = await api.getProducts();
  final List<ProductModel> list = [];
  for (final it in raw) {
    if (it is Map<String, dynamic>) {
      list.add(ProductModel.fromJson(it));
    }
  }
  return list;
});

final categoriesFutureProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final api = ref.watch(customerApiProvider);
  final raw = await api.getCategories();
  final List<CategoryModel> list = [];
  for (final it in raw) {
    if (it is Map<String, dynamic>) {
      list.add(CategoryModel.fromJson(it));
    }
  }
  return list;
});

final selectedCategoryProvider = StateProvider<String?>((ref) => null);
final searchQueryProvider = StateProvider<String>((ref) => '');

final filteredProductsProvider = Provider<List<ProductModel>>((ref) {
  final productsAsync = ref.watch(productsFutureProvider);
  final selectedCat = ref.watch(selectedCategoryProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase().trim();

  return productsAsync.maybeWhen(
    data: (products) {
      return products.where((p) {
        final matchesCat = selectedCat == null ||
            selectedCat.isEmpty ||
            p.category.toLowerCase() == selectedCat.toLowerCase();
        final matchesQuery = query.isEmpty ||
            p.name.toLowerCase().contains(query) ||
            p.category.toLowerCase().contains(query);
        return matchesCat && matchesQuery;
      }).toList();
    },
    orElse: () => [],
  );
});
