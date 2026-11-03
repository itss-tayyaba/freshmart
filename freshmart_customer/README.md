# FreshMart Customer Mobile App (Flutter)

Express grocery shopping and 10-15 minute doorstep delivery application for customers. Built with Flutter, Riverpod, GoRouter, Dio, and Cached Network Image.

Brand Color: `#059669` (Emerald 600)

---

## Features & Endpoints

- **Product Catalog & Aisles**: `GET /products`, `GET /categories`
- **Customer Authentication**: `POST /auth/register`, `POST /auth/login`
- **Instant Checkout**: `POST /orders` (supports COD and Mobile Wallets)
- **Live Order Tracking**: `GET /orders/track/:orderId` (with live courier location, dynamic ETA, and 4-digit verification OTP)
- **Customer Order History**: `GET /orders/mine`
- **Promotions & Coupons**: `POST /promotions/validate`

---

## How to Run

```bash
# 1. Install dependencies
cd freshmart_customer
flutter pub get

# 2. Run against Android Emulator (local development backend)
flutter run --dart-define=API_URL=http://10.0.2.2:5000/api

# 3. Run against Live Server / Vercel
flutter run --dart-define=API_URL=https://YOUR-DOMAIN.vercel.app/api
```

---

## Build Release APK

```bash
flutter build apk --release --dart-define=API_URL=https://YOUR-DOMAIN.vercel.app/api
# Output: build/app/outputs/flutter-apk/app-release.apk
```
