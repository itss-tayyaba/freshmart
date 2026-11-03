import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product_model.dart';
import '../models/cart_item_model.dart';

class CartState {
  final Map<String, CartItemModel> items;
  final double discount;
  final String? appliedCoupon;

  CartState({
    this.items = const {},
    this.discount = 0.0,
    this.appliedCoupon,
  });

  List<CartItemModel> get itemList => items.values.toList();
  int get totalItemCount => items.values.fold(0, (sum, i) => sum + i.quantity);
  double get subtotal => items.values.fold(0.0, (sum, i) => sum + i.subtotal);
  double get deliveryFee => subtotal > 1500 ? 0.0 : 99.0;
  double get finalTotal => (subtotal + deliveryFee - discount).clamp(0.0, double.infinity);

  CartState copyWith({
    Map<String, CartItemModel>? items,
    double? discount,
    String? appliedCoupon,
  }) {
    return CartState(
      items: items ?? this.items,
      discount: discount ?? this.discount,
      appliedCoupon: appliedCoupon ?? this.appliedCoupon,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void addToCart(ProductModel product) {
    final current = Map<String, CartItemModel>.from(state.items);
    if (current.containsKey(product.id)) {
      current[product.id] = current[product.id]!.copyWith(
        quantity: current[product.id]!.quantity + 1,
      );
    } else {
      current[product.id] = CartItemModel(product: product, quantity: 1);
    }
    state = state.copyWith(items: current);
  }

  void removeFromCart(String productId) {
    final current = Map<String, CartItemModel>.from(state.items);
    if (!current.containsKey(productId)) return;

    if (current[productId]!.quantity > 1) {
      current[productId] = current[productId]!.copyWith(
        quantity: current[productId]!.quantity - 1,
      );
    } else {
      current.remove(productId);
    }
    state = state.copyWith(items: current);
  }

  void deleteItem(String productId) {
    final current = Map<String, CartItemModel>.from(state.items);
    current.remove(productId);
    state = state.copyWith(items: current);
  }

  void applyDiscount(String code, double discountAmount) {
    state = state.copyWith(appliedCoupon: code, discount: discountAmount);
  }

  void clearCart() {
    state = CartState();
  }
}

final cartNotifierProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
