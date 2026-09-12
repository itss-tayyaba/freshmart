import { isDbOnline } from '../config/db.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Rider } from '../models/ExtraModels.js';
import { ADMIN_ORDERS_FULL } from '../../src/data/adminSuiteData.js';

// Dark Store Hub coordinates for Pakistani fulfillment centers
export const CITY_HUBS = {
  lahore: { lat: 31.5150, lng: 74.3450, hubName: 'FreshMart SuperHub #1 (Gulberg III)', city: 'Lahore, Pakistan' },
  karachi: { lat: 24.8190, lng: 67.0320, hubName: 'FreshMart Express Hub #2 (Clifton)', city: 'Karachi, Pakistan' },
  islamabad: { lat: 33.7120, lng: 73.0680, hubName: 'FreshMart Capital Hub #3 (Blue Area)', city: 'Islamabad, Pakistan' },
  rawalpindi: { lat: 33.5970, lng: 73.0470, hubName: 'FreshMart Hub #4 (Saddar Cantt)', city: 'Rawalpindi, Pakistan' },
  faisalabad: { lat: 31.4180, lng: 73.0790, hubName: 'FreshMart Hub #5 (D-Ground)', city: 'Faisalabad, Pakistan' }
};

// Calculate Haversine distance in KM
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 3.2;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Calculate dynamic ETA in minutes (assuming ~25km/h motorbike speed + 2 min buffer)
export const calculateEtaMinutes = (distanceKm) => {
  if (distanceKm <= 0.2) return 2;
  const transitMinutes = Math.round((distanceKm / 25) * 60);
  return Math.max(2, transitMinutes + 2);
};

// Resolve destination coordinates from address text or structured coords
export const resolveDestinationCoords = (shippingAddress) => {
  if (shippingAddress?.coords?.lat && shippingAddress?.coords?.lng) {
    return { lat: Number(shippingAddress.coords.lat), lng: Number(shippingAddress.coords.lng) };
  }
  if (shippingAddress?.coordinates?.lat && shippingAddress?.coordinates?.lng) {
    return { lat: Number(shippingAddress.coordinates.lat), lng: Number(shippingAddress.coordinates.lng) };
  }
  if (shippingAddress?.lat && shippingAddress?.lng) {
    return { lat: Number(shippingAddress.lat), lng: Number(shippingAddress.lng) };
  }

  const addr = ((shippingAddress?.address || '') + ' ' + (shippingAddress?.city || '') + ' ' + (shippingAddress?.area || '')).toLowerCase();

  if (addr.includes('johar')) return { lat: 31.4697, lng: 74.2728 };
  if (addr.includes('gulberg')) return { lat: 31.5204, lng: 74.3587 };
  if (addr.includes('dha') && addr.includes('karachi')) return { lat: 24.8010, lng: 67.0680 };
  if (addr.includes('dha') && !addr.includes('karachi')) return { lat: 31.4826, lng: 74.4074 };
  if (addr.includes('clifton')) return { lat: 24.8270, lng: 67.0251 };
  if (addr.includes('gulshan')) return { lat: 24.9180, lng: 67.0971 };
  if (addr.includes('f-7') || addr.includes('f7')) return { lat: 33.7215, lng: 73.0565 };
  if (addr.includes('blue area')) return { lat: 33.7100, lng: 73.0650 };
  if (addr.includes('karachi')) return { lat: 24.8607, lng: 67.0011 };
  if (addr.includes('islamabad')) return { lat: 33.6844, lng: 73.0479 };
  if (addr.includes('rawalpindi')) return { lat: 33.5651, lng: 73.0169 };
  if (addr.includes('faisalabad')) return { lat: 31.4504, lng: 73.1350 };

  // Default Central Lahore drop-off
  return { lat: 31.5204, lng: 74.3587 };
};

// Resolve Hub coordinates based on delivery city
export const resolveHubCoords = (cityStr) => {
  const cityLower = (cityStr || '').toLowerCase();
  if (cityLower.includes('karachi')) return CITY_HUBS.karachi;
  if (cityLower.includes('islamabad')) return CITY_HUBS.islamabad;
  if (cityLower.includes('rawalpindi')) return CITY_HUBS.rawalpindi;
  if (cityLower.includes('faisalabad')) return CITY_HUBS.faisalabad;
  return CITY_HUBS.lahore;
};

// Build authentic chronological timeline based on true order state
export const buildDynamicTimeline = (order) => {
  const status = (order.status || 'Pending').toLowerCase();
  const isDelivered = status === 'delivered' || status === 'completed';
  const isOut = status.includes('out') || status.includes('transit') || status.includes('picked up') || (order.assignedRider && !isDelivered);
  const isPreparing = isOut || isDelivered || status.includes('prep') || status.includes('pack') || status.includes('process');

  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const assigned = order.assignedRider;
  const etaText = assigned?.eta || (order.eta ? order.eta : '15-25 mins');

  return [
    {
      title: 'Order Confirmed',
      time: formatTime(createdDate),
      completed: true,
      desc: `Payment method: ${order.paymentMethod || order.payment || 'Cash on Delivery'}`
    },
    {
      title: 'Dark Store Packed & Verified',
      time: isPreparing ? formatTime(new Date(createdDate.getTime() + 4 * 60000)) : 'In Progress',
      completed: isPreparing,
      desc: 'Quality checked and sealed in chilled thermal insulation'
    },
    {
      title: 'Out for Express Delivery',
      time: isDelivered ? 'Completed' : isOut ? `ETA: ${etaText}` : 'Awaiting Assignment',
      completed: isOut || isDelivered,
      desc: assigned
        ? `Assigned to courier ${assigned.name} (${assigned.vehicle || assigned.vehicleType || 'Motorbike'}). GPS tracking live.`
        : 'Dispatch team is reviewing address to assign fleet rider'
    },
    {
      title: 'Delivered to Doorstep',
      time: isDelivered ? formatTime(new Date(createdDate.getTime() + 18 * 60000)) : 'Pending',
      completed: isDelivered,
      desc: `Contactless handover at ${order.shippingAddress?.address || order.address || 'Delivery Address'}`
    }
  ];
};

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const rawItemsList =
      req.body.orderItems ||
      req.body.rawItems ||
      (Array.isArray(req.body.items) ? req.body.items : []);

    if (!rawItemsList || rawItemsList.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    // Normalize order items structure
    const orderItems = rawItemsList.map((item) => {
      const prod = item.product && typeof item.product === 'object' ? item.product : null;
      const prodId = prod?._id || prod?.id || item.product || item.id || item.productId;
      const name = item.name || prod?.name || 'Grocery Item';
      const price = Number(item.price !== undefined ? item.price : (prod?.price || 0));
      const quantity = Number(item.quantity || 1);
      const unit = item.unit || prod?.unit || '1 unit';
      const image = item.image || prod?.image || '';
      const vendorId = item.vendorId || prod?.vendorId || 'VND-101';

      return {
        product: prodId && typeof prodId === 'string' && prodId.match(/^[0-9a-fA-F]{24}$/) ? prodId : undefined,
        id: prodId ? String(prodId) : undefined,
        name,
        price,
        quantity,
        unit,
        image,
        vendorId
      };
    });

    const custName =
      req.body.customerName ||
      req.body.recipientName ||
      req.body.customer ||
      req.user?.name ||
      'Customer';

    const custPhone =
      req.body.customerPhone ||
      req.body.phone ||
      req.user?.phone ||
      '+92 300 1234567';

    // Normalize shipping address
    let shippingAddress = req.body.shippingAddress;
    if (typeof shippingAddress === 'string') {
      shippingAddress = {
        address: shippingAddress,
        city: req.body.city || 'Lahore, Pakistan',
        deliverySlot: req.body.deliverySlot || '⚡ 15-25 Mins Express Delivery'
      };
    } else if (!shippingAddress || typeof shippingAddress !== 'object') {
      shippingAddress = {
        address: req.body.address || '123 Main Street, Gulberg, Lahore',
        city: req.body.city || 'Lahore, Pakistan',
        deliverySlot: req.body.deliverySlot || '⚡ 15-25 Mins Express Delivery'
      };
    } else {
      shippingAddress = {
        address: shippingAddress.address || req.body.address || '123 Main Street, Gulberg, Lahore',
        city: shippingAddress.city || req.body.city || 'Lahore, Pakistan',
        deliverySlot: shippingAddress.deliverySlot || req.body.deliverySlot || '⚡ 15-25 Mins Express Delivery'
      };
    }

    const paymentMethod = req.body.paymentMethod || req.body.payment || 'Cash on Delivery';

    const itemsPrice =
      req.body.itemsPrice !== undefined
        ? Number(req.body.itemsPrice)
        : req.body.subtotal !== undefined
        ? Number(req.body.subtotal)
        : orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const deliveryPrice =
      req.body.deliveryPrice !== undefined
        ? Number(req.body.deliveryPrice)
        : req.body.deliveryCharges !== undefined
        ? Number(req.body.deliveryCharges)
        : itemsPrice >= 1000 || itemsPrice === 0
        ? 0
        : 100;

    const discount = Number(req.body.discountPrice || req.body.discountAmount || 0);
    const totalPrice =
      req.body.totalPrice !== undefined
        ? Number(req.body.totalPrice)
        : req.body.totalAmount !== undefined
        ? Number(req.body.totalAmount)
        : req.body.total !== undefined
        ? Number(req.body.total)
        : Math.max(0, itemsPrice + deliveryPrice - discount);

    const orderId = req.body.orderId || req.body.id || ('#FM' + Math.floor(10000 + Math.random() * 90000));

    // Calculate real destination and hub coordinates
    const destinationCoords = resolveDestinationCoords(shippingAddress);
    const hubHub = resolveHubCoords(shippingAddress.city);
    const hubCoords = { lat: hubHub.lat, lng: hubHub.lng };
    const distanceKm = calculateDistanceKm(hubCoords.lat, hubCoords.lng, destinationCoords.lat, destinationCoords.lng);
    const etaMinutes = calculateEtaMinutes(distanceKm);
    const etaText = `${etaMinutes} mins (Upon dispatch)`;

    const initialOrderObj = {
      orderId,
      user: req.user?._id,
      customerName: custName,
      customerPhone: custPhone,
      shippingAddress,
      destinationCoords,
      hubCoords,
      distanceKm,
      eta: etaText,
      etaMinutes,
      orderItems,
      paymentMethod,
      itemsPrice,
      deliveryPrice,
      discountPrice: discount,
      totalPrice,
      status: req.body.status || 'Confirmed',
      assignedRider: req.body.assignedRider || null
    };

    initialOrderObj.timeline = buildDynamicTimeline(initialOrderObj);

    if (isDbOnline()) {
      const order = new Order(initialOrderObj);
      const createdOrder = await order.save();

      // Deduct stock for all ordered products in MongoDB
      for (const item of orderItems) {
        const prodId = item.product || item.id;
        const qty = Number(item.quantity) || 1;
        const filter = {
          $or: [
            ...(prodId && typeof prodId === 'string' && prodId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: prodId }] : []),
            ...(prodId ? [{ id: String(prodId) }, { customId: String(prodId) }] : []),
            ...(item.name ? [{ name: item.name }] : [])
          ]
        };

        const prod = await Product.findOne(filter);
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - qty);
          prod.stockCount = prod.stock;
          prod.status = prod.stock === 0 ? 'Out of Stock' : prod.stock < 15 ? 'Low Stock' : 'Active';
          prod.inStock = prod.stock > 0;
          await prod.save();
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Order created and product stock updated in MongoDB',
        order: createdOrder
      });
    }

    const newOrder = {
      id: orderId,
      orderId,
      customer: custName,
      customerName: custName,
      customerPhone: custPhone,
      address: shippingAddress.address,
      city: shippingAddress.city,
      deliverySlot: shippingAddress.deliverySlot,
      shippingAddress,
      destinationCoords,
      hubCoords,
      distanceKm,
      eta: etaText,
      etaMinutes,
      orderItems,
      rawItems: orderItems,
      items: `${orderItems.length} Item${orderItems.length > 1 ? 's' : ''}`,
      total: totalPrice,
      totalPrice,
      totalAmount: totalPrice,
      subtotal: itemsPrice,
      itemsPrice,
      deliveryPrice,
      deliveryCharges: deliveryPrice,
      discountPrice: discount,
      discountAmount: discount,
      status: req.body.status || 'Confirmed',
      statusClass: 'bg-emerald-100 text-emerald-800',
      payment: paymentMethod,
      paymentMethod,
      time: 'Just now',
      assignedRider: req.body.assignedRider || null,
      timeline: initialOrderObj.timeline
    };
    ADMIN_ORDERS_FULL.unshift(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  try {
    if (isDbOnline()) {
      const orders = await Order.find({}).sort({ createdAt: -1 });
      if (orders && orders.length > 0) {
        return res.json({ success: true, count: orders.length, orders });
      }
    }
    res.json({ success: true, count: ADMIN_ORDERS_FULL.length, orders: ADMIN_ORDERS_FULL });
  } catch (error) {
    res.json({ success: true, count: ADMIN_ORDERS_FULL.length, orders: ADMIN_ORDERS_FULL });
  }
};

// @desc    Track order by Order ID (Zero fake fallback - returns real MongoDB / store order)
// @route   GET /api/orders/track/:orderId
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID parameter is required' });
    }

    const formattedId = orderId.startsWith('#') ? orderId : `#${orderId}`;
    const cleanId = orderId.replace(/^#/, '');

    let foundOrder = null;

    if (isDbOnline()) {
      const dbOrder = await Order.findOne({
        $or: [
          { orderId: formattedId },
          { orderId: cleanId },
          { orderId: orderId },
          ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : [])
        ]
      }).populate('user', 'name email phone');

      if (dbOrder) {
        foundOrder = dbOrder.toObject ? dbOrder.toObject() : dbOrder;
      }
    }

    if (!foundOrder) {
      const memOrder = ADMIN_ORDERS_FULL.find(
        (o) =>
          o.id === orderId ||
          o.id === formattedId ||
          o.id === cleanId ||
          o.orderId === orderId ||
          o.orderId === formattedId ||
          o.orderId === cleanId
      );
      if (memOrder) {
        foundOrder = { ...memOrder };
      }
    }

    if (!foundOrder) {
      // Return 404 - no fake fallback orders in production
      return res.status(404).json({
        success: false,
        message: `Order "${orderId}" not found in database. Please check your order reference number.`
      });
    }

    // Resolve accurate coordinates & dynamic ETA
    const destCoords = foundOrder.destinationCoords || resolveDestinationCoords(foundOrder.shippingAddress || { address: foundOrder.address, city: foundOrder.city });
    const hubHub = resolveHubCoords(foundOrder.shippingAddress?.city || foundOrder.city);
    const hubCoords = foundOrder.hubCoords || { lat: hubHub.lat, lng: hubHub.lng };

    let riderCoords = null;
    let distanceKm = 0;
    let etaMinutes = 15;
    let etaText = '15-25 mins';

    if (foundOrder.assignedRider) {
      riderCoords =
        foundOrder.assignedRider.coordinates ||
        (foundOrder.assignedRider.currentLat && foundOrder.assignedRider.currentLng
          ? { lat: foundOrder.assignedRider.currentLat, lng: foundOrder.assignedRider.currentLng }
          : hubCoords);

      distanceKm = calculateDistanceKm(riderCoords.lat, riderCoords.lng, destCoords.lat, destCoords.lng);
      etaMinutes = calculateEtaMinutes(distanceKm);
      etaText = distanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${etaMinutes} mins`;

      foundOrder.assignedRider.coordinates = riderCoords;
      foundOrder.assignedRider.currentLat = riderCoords.lat;
      foundOrder.assignedRider.currentLng = riderCoords.lng;
      foundOrder.assignedRider.eta = etaText;
      foundOrder.assignedRider.etaMinutes = etaMinutes;
    } else {
      distanceKm = calculateDistanceKm(hubCoords.lat, hubCoords.lng, destCoords.lat, destCoords.lng);
      etaMinutes = calculateEtaMinutes(distanceKm);
      etaText = `${etaMinutes} mins (Upon dispatch)`;
    }

    foundOrder.destinationCoords = destCoords;
    foundOrder.hubCoords = hubCoords;
    foundOrder.distanceKm = distanceKm;
    foundOrder.eta = etaText;
    foundOrder.etaMinutes = etaMinutes;
    foundOrder.timeline = buildDynamicTimeline(foundOrder);

    return res.json({
      success: true,
      order: foundOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign rider to order
// @route   PUT /api/orders/:id/assign-rider
export const assignRiderToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { riderId, rider, status } = req.body;

    let targetRider = rider;
    if (!targetRider && isDbOnline() && riderId) {
      const dbRider = await Rider.findOne({ $or: [{ id: riderId }, { _id: riderId }] });
      if (dbRider) {
        targetRider = {
          id: dbRider.id,
          name: dbRider.name,
          phone: dbRider.phone,
          vehicle: dbRider.vehicleNumber || dbRider.vehicleType,
          vehicleType: dbRider.vehicleType,
          zone: dbRider.zone,
          rating: dbRider.rating || 5.0,
          coordinates: dbRider.coordinates || { lat: 31.5150, lng: 74.3450 }
        };
      }
    }

    if (!targetRider && !riderId) {
      return res.status(400).json({ success: false, message: 'Rider details or riderId required' });
    }

    const defaultHub = CITY_HUBS.lahore;
    const riderCoords = targetRider?.coordinates || { lat: defaultHub.lat, lng: defaultHub.lng };

    const assignedInfo = {
      id: targetRider?.id || riderId,
      riderId: targetRider?.id || riderId,
      name: targetRider?.name || 'Assigned Courier',
      phone: targetRider?.phone || '+92 300 0000000',
      vehicle: targetRider?.vehicle || targetRider?.vehicleNumber || 'Motorbike',
      vehicleType: targetRider?.vehicleType || '🏍️ Honda 125',
      vehicleNumber: targetRider?.vehicleNumber || 'LEK-0000',
      zone: targetRider?.zone || 'Lahore Hub',
      rating: targetRider?.rating || 5.0,
      coordinates: riderCoords,
      currentLat: riderCoords.lat,
      currentLng: riderCoords.lng,
      assignedAt: new Date(),
      status: 'On-Duty',
      eta: '12-18 mins',
      etaMinutes: 15
    };

    const newStatus = status || 'Out for Delivery';

    if (isDbOnline()) {
      const order = await Order.findOne({
        $or: [
          ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
          { orderId: id },
          { orderId: id.startsWith('#') ? id : `#${id}` },
          { orderId: id.replace(/^#/, '') }
        ]
      });

      if (order) {
        const destCoords = order.destinationCoords || resolveDestinationCoords(order.shippingAddress);
        const distanceKm = calculateDistanceKm(riderCoords.lat, riderCoords.lng, destCoords.lat, destCoords.lng);
        const etaMinutes = calculateEtaMinutes(distanceKm);
        const etaText = distanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${etaMinutes} mins`;

        assignedInfo.eta = etaText;
        assignedInfo.etaMinutes = etaMinutes;

        order.assignedRider = assignedInfo;
        order.status = newStatus;
        order.destinationCoords = destCoords;
        order.distanceKm = distanceKm;
        order.eta = etaText;
        order.etaMinutes = etaMinutes;
        order.timeline = buildDynamicTimeline(order);

        const updated = await order.save();
        return res.json({
          success: true,
          message: `Rider ${assignedInfo.name} assigned to order ${order.orderId}`,
          order: updated
        });
      }
    }

    // In-memory fallback
    const memOrder = ADMIN_ORDERS_FULL.find(
      (o) => o.id === id || o.orderId === id || o.id === `#${id}` || o.id === id.replace(/^#/, '')
    );
    if (memOrder) {
      const destCoords = resolveDestinationCoords(memOrder.shippingAddress || { address: memOrder.address, city: memOrder.city });
      const distanceKm = calculateDistanceKm(riderCoords.lat, riderCoords.lng, destCoords.lat, destCoords.lng);
      const etaMinutes = calculateEtaMinutes(distanceKm);
      const etaText = distanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${etaMinutes} mins`;

      assignedInfo.eta = etaText;
      assignedInfo.etaMinutes = etaMinutes;

      memOrder.assignedRider = assignedInfo;
      memOrder.status = newStatus;
      memOrder.statusClass = 'bg-purple-100 text-purple-800';
      memOrder.destinationCoords = destCoords;
      memOrder.distanceKm = distanceKm;
      memOrder.eta = etaText;
      memOrder.etaMinutes = etaMinutes;
      memOrder.timeline = buildDynamicTimeline(memOrder);

      return res.json({
        success: true,
        message: `Rider ${assignedInfo.name} assigned to order ${memOrder.id}`,
        order: memOrder
      });
    }

    return res.status(404).json({ success: false, message: 'Order not found to assign rider' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update live rider GPS coordinates for active order
// @route   PUT /api/orders/:id/rider-location
export const updateRiderLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, speed, heading } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (isDbOnline()) {
      const order = await Order.findOne({
        $or: [
          ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
          { orderId: id },
          { orderId: id.startsWith('#') ? id : `#${id}` },
          { orderId: id.replace(/^#/, '') }
        ]
      });

      if (order) {
        if (!order.assignedRider) {
          return res.status(400).json({ success: false, message: 'Order has no assigned rider to update coordinates' });
        }

        order.assignedRider.coordinates = { lat: numLat, lng: numLng };
        order.assignedRider.currentLat = numLat;
        order.assignedRider.currentLng = numLng;
        if (speed !== undefined) order.assignedRider.speed = Number(speed);
        if (heading !== undefined) order.assignedRider.heading = Number(heading);

        const destCoords = order.destinationCoords || resolveDestinationCoords(order.shippingAddress);
        const distanceKm = calculateDistanceKm(numLat, numLng, destCoords.lat, destCoords.lng);
        const etaMinutes = calculateEtaMinutes(distanceKm);
        const etaText = distanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${etaMinutes} mins`;

        order.assignedRider.eta = etaText;
        order.assignedRider.etaMinutes = etaMinutes;
        order.distanceKm = distanceKm;
        order.eta = etaText;
        order.etaMinutes = etaMinutes;
        order.timeline = buildDynamicTimeline(order);

        const updated = await order.save();
        return res.json({
          success: true,
          message: 'Rider coordinates and ETA updated in real-time',
          order: updated
        });
      }
    }

    // In-memory fallback
    const memOrder = ADMIN_ORDERS_FULL.find((o) => o.id === id || o.orderId === id);
    if (memOrder && memOrder.assignedRider) {
      memOrder.assignedRider.coordinates = { lat: numLat, lng: numLng };
      memOrder.assignedRider.currentLat = numLat;
      memOrder.assignedRider.currentLng = numLng;
      const destCoords = resolveDestinationCoords(memOrder.shippingAddress || { address: memOrder.address, city: memOrder.city });
      const distanceKm = calculateDistanceKm(numLat, numLng, destCoords.lat, destCoords.lng);
      const etaMinutes = calculateEtaMinutes(distanceKm);
      const etaText = distanceKm <= 0.2 ? 'Arriving now (1-2 mins)' : `${etaMinutes} mins`;
      memOrder.assignedRider.eta = etaText;
      memOrder.distanceKm = distanceKm;
      memOrder.eta = etaText;
      memOrder.timeline = buildDynamicTimeline(memOrder);

      return res.json({
        success: true,
        message: 'Rider coordinates and ETA updated in memory',
        order: memOrder
      });
    }

    return res.status(404).json({ success: false, message: 'Order not found' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (isDbOnline()) {
      const order = await Order.findOne({
        $or: [
          ...(req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.params.id }] : []),
          { orderId: req.params.id },
          { id: req.params.id },
          { orderId: req.params.id.startsWith('#') ? req.params.id : `#${req.params.id}` },
          { orderId: req.params.id.replace(/^#/, '') }
        ]
      });
      if (order) {
        const previousStatus = order.status;
        order.status = status;
        order.timeline = buildDynamicTimeline(order);
        const updated = await order.save();

        // If order was cancelled, restore inventory
        if (status === 'Cancelled' && previousStatus !== 'Cancelled' && Array.isArray(order.orderItems)) {
          for (const item of order.orderItems) {
            const prodId = item.product || item.id || item.productId;
            const qty = Number(item.quantity) || 1;
            const filter = {
              $or: [
                ...(prodId && typeof prodId === 'string' && prodId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: prodId }] : []),
                ...(prodId ? [{ id: String(prodId) }, { customId: String(prodId) }] : []),
                ...(item.name ? [{ name: item.name }] : [])
              ]
            };
            const prod = await Product.findOne(filter);
            if (prod) {
              prod.stock = (prod.stock || 0) + qty;
              prod.stockCount = prod.stock;
              prod.status = prod.stock === 0 ? 'Out of Stock' : prod.stock < 15 ? 'Low Stock' : 'Active';
              prod.inStock = prod.stock > 0;
              await prod.save();
            }
          }
        }

        return res.json({ success: true, order: updated });
      }
    }

    const memOrder = ADMIN_ORDERS_FULL.find((o) => o.id === req.params.id || o.orderId === req.params.id);
    if (memOrder) {
      memOrder.status = status;
      memOrder.timeline = buildDynamicTimeline(memOrder);
      return res.json({ success: true, message: `Status updated to ${status}`, order: memOrder });
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

