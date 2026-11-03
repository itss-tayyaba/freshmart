# FreshMart Staff Mobile App (Flutter)

A unified mobile application for **Delivery Riders** and **Warehouse Pickup Staff**. Built with Flutter, Riverpod, GoRouter, Dio, and Flutter Secure Storage.

Brand Color: `#059669` (Emerald 600)

---

## Architecture & Features

### 1. Unified Authentication
- Endpoint: `POST /auth/login`
- Role `rider` -> Automatically opens **Rider Shell**
- Role `pickupstaff` / `pickup_staff` -> Automatically opens **Pickup Shell**
- Any other role -> Displays access restriction message

### 2. Rider Shell
- **Assigned Deliveries**: `GET /orders/assigned-to-me` (auto-refreshes every 15s + pull-to-refresh)
- **Order Details**: Customer name, address, items, total COD amount
- **One-Tap Actions**:
  - `Call Customer`: Directly triggers phone dialer via `url_launcher`
  - `Open in Google Maps`: Opens turn-by-turn navigation to destination coordinates
- **Live GPS Telemetry**:
  - Whenever an order is `Out for Delivery`, streams GPS coordinates every 5s via `PUT /orders/:id/rider-location` and `PUT /riders/me/location`
- **Doorstep OTP Handover**:
  - "Delivered" action presents 4-digit customer verification dialog calling `POST /orders/:id/verify-delivery-otp`

### 3. Pickup Shell
- **Packing Queue**: `GET /orders/pickup-assigned-to-me`
- **1-Tap Status Updates**:
  - `Start Preparing`: `PUT /orders/:id/pickup-status` with `{"status": "Preparing"}`
  - `Ready for Pickup`: `PUT /orders/:id/pickup-status` with `{"status": "Ready for Pickup"}`

---

## How to Run

```bash
# 1. Install dependencies
cd freshmart_staff
flutter pub get

# 2. Run against Android Emulator (local development backend)
flutter run --dart-define=API_URL=http://10.0.2.2:5000/api

# 3. Run against Live Server / Vercel
flutter run --dart-define=API_URL=https://YOUR-DOMAIN.vercel.app/api
```

---

## Build Release APK

```bash
# Generate release keystore if needed
keytool -genkey -v -keystore ~/freshmart.jks -keyalg RSA -keysize 2048 -validity 10000 -alias freshmart

# Build APK
flutter build apk --release --dart-define=API_URL=https://YOUR-DOMAIN.vercel.app/api
# Output: build/app/outputs/flutter-apk/app-release.apk
```
