import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_config.dart';
import '../../models/product_model.dart';
import '../../providers/products_provider.dart';
import '../../providers/cart_provider.dart';

class ProductDetailScreen extends ConsumerWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsFutureProvider);

    final product = productsAsync.maybeWhen(
      data: (products) => products.firstWhere(
        (p) => p.id == productId,
        orElse: () => ProductModel(
          id: productId,
          name: 'Grocery Product',
          category: 'Grocery',
          price: 0,
          unit: '1 unit',
          image: '',
          inStock: true,
        ),
      ),
      orElse: () => ProductModel(
        id: productId,
        name: 'Loading...',
        category: 'Grocery',
        price: 0,
        unit: '1 unit',
        image: '',
        inStock: true,
      ),
    );

    return Scaffold(
      backgroundColor: AppConfig.backgroundColor,
      appBar: AppBar(
        title: Text(product.name),
        backgroundColor: AppConfig.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: [
                if (product.image.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: product.image,
                    height: 280,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  )
                else
                  Container(
                    height: 220,
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
                  ),
                Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.category.toUpperCase(),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppConfig.primaryColor),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.name,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppConfig.textDark),
                      ),
                      Text(product.unit, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                      const SizedBox(height: 16),
                      Text(
                        'Rs. ${product.price.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppConfig.primaryDark),
                      ),
                      const Divider(height: 32),
                      const Text('Description', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text(
                        product.description ?? 'Freshly sourced premium supermarket item delivered express to your doorstep.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
              ],
            ),
            child: ElevatedButton.icon(
              onPressed: () {
                ref.read(cartNotifierProvider.notifier).addToCart(product);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Added ${product.name} to cart'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              icon: const Icon(Icons.add_shopping_cart),
              label: const Text('Add to Basket'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
