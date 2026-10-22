import { isDbOnline } from '../config/db.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Rider } from '../models/ExtraModels.js';
import { User } from '../models/User.js';
import { ADMIN_ORDERS_FULL } from '../../src/data/adminSuiteData.js';
import { riderServesArea } from '../../src/utils/storeRouting.js';
import { STORE_LOCATIONS } from '../../src/data/freshMartData.js';

const serializeOrderWithoutOtp = (order) => {
  const serialized = order?.toObject ? order.toObject() : { ...order };
  delete serialized.deliveryOtp;
  return serialized;
};

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
  const isPreparing =
    isOut ||
    isDelivered ||
    status.includes('prep') ||
    status.includes('pack') ||
    status.includes('process') ||
    status.includes('ready for pickup');

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
        area: shippingAddress.area || '',
        coords: shippingAddress.coords || null,
        deliverySlot: shippingAddress.deliverySlot || req.body.deliverySlot || '⚡ 15-25 Mins Express Delivery'
      };
    }

    const selectedBranch = STORE_LOCATIONS.find((store) => store.id === req.body.branchId);
    const branchCity = selectedBranch?.city.split(',')[0].trim().toLowerCase();
    const deliveryCity = String(shippingAddress.city || '').split(',')[0].trim().toLowerCase();
    if (!selectedBranch || branchCity !== deliveryCity) {
      return res.status(400).json({
        success: false,
        message: 'Select a configured store branch that serves the delivery city before placing this order'
      });
    }
    const destinationCoords = resolveDestinationCoords(shippingAddress);
    const nearestBranch = STORE_LOCATIONS.filter((store) => store.city === selectedBranch.city)
      .map((store) => ({
        store,
        distanceKm: calculateDistanceKm(
          destinationCoords.lat,
          destinationCoords.lng,
          store.coords.lat,
          store.coords.lng
        )
      }))
      .sort((first, second) => first.distanceKm - second.distanceKm)[0]?.store;
    if (!nearestBranch || nearestBranch.id !== selectedBranch.id) {
      return res.status(400).json({
        success: false,
        message: 'The selected branch is not the nearest configured store for this delivery location'
      });
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
    const branchCoords = selectedBranch.coords;
    const hubCoords = { lat: Number(branchCoords.lat), lng: Number(branchCoords.lng) };
    const distanceKm = calculateDistanceKm(hubCoords.lat, hubCoords.lng, destinationCoords.lat, destinationCoords.lng);
    const etaMinutes = calculateEtaMinutes(distanceKm);
    const etaText = `${etaMinutes} mins (Upon dispatch)`;
    const deliveryOtp = req.body.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000));

    const initialOrderObj = {
      orderId,
      tenantId: req.body.tenantId || 'tenant-freshmart',
      tenantName: req.body.tenantName || '',
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      branchCoords,
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
      status: 'Pending',
      assignedRider: null,
      deliveryOtp
    };

    initialOrderObj.timeline = buildDynamicTimeline(initialOrderObj);

    if (!isDbOnline()) {
      return res.status(503).json({
        success: false,
        message: 'Orders cannot be confirmed until the database connection is available. Please retry checkout.'
      });
    }

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
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
export const getOrders = async (req, res) => {
  if (!isDbOnline()) {
    return res.status(503).json({ success: false, message: 'Order records are unavailable until the database reconnects' });
  }

  try {
    const branchId = req.user?.role === 'admin' ? req.user.branchId : '';
    const branchQuery = branchId ? { branchId } : {};
    const orders = (await Order.find(branchQuery).sort({ createdAt: -1 })).map(serializeOrderWithoutOtp);
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders assigned to the authenticated rider
// @route   GET /api/orders/assigned-to-me
export const getRiderOrders = async (req, res) => {
  try {
    const riderId = req.user?.riderId;
    if (!riderId) {
      return res.status(403).json({ success: false, message: 'Rider identity is required to load assigned orders' });
    }

    if (isDbOnline()) {
      const orders = (await Order.find({
        $or: [{ 'assignedRider.id': riderId }, { 'assignedRider.riderId': riderId }]
      }).sort({ updatedAt: -1 })).map(serializeOrderWithoutOtp);
      return res.json({ success: true, count: orders.length, orders });
    }

    const orders = ADMIN_ORDERS_FULL.filter(
      (order) => order.assignedRider?.id === riderId || order.assignedRider?.riderId === riderId
    ).map(serializeOrderWithoutOtp);
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPickupStaffOrders = async (req, res) => {
  if (req.user?.role !== 'pickupstaff') {
    return res.status(403).json({ success: false, message: 'Pickup staff account required' });
  }
  if (!isDbOnline()) {
    return res.status(503).json({ success: false, message: 'Pickup staff order queues require a database connection' });
  }

  try {
    const staffId = String(req.user?.id || req.user?._id || '');
    const branchId = String(req.user?.branchId || '');
    if (!staffId || !branchId) {
      return res.status(403).json({ success: false, message: 'Pickup staff identity and branch are required' });
    }

    const orders = (await Order.find({
      branchId,
      'assignedPickupStaff.id': staffId
    }).sort({ updatedAt: -1 })).map(serializeOrderWithoutOtp);
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePickupStaffOrderStatus = async (req, res) => {
  if (req.user?.role !== 'pickupstaff') {
    return res.status(403).json({ success: false, message: 'Pickup staff account required' });
  }
  if (!isDbOnline()) {
    return res.status(503).json({ success: false, message: 'Pickup order updates require a database connection' });
  }

  const status = req.body.status;
  if (!['Preparing', 'Ready for Pickup'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Pickup staff can set status to Preparing or Ready for Pickup'
    });
  }

  try {
    const staffId = String(req.user?.id || req.user?._id || '');
    const branchId = String(req.user?.branchId || '');
    const orderId = req.params.id;
    const clauses = [
      { orderId },
      { orderId: orderId.startsWith('#') ? orderId : `#${orderId}` },
      { orderId: orderId.replace(/^#/, '') }
    ];
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) clauses.push({ _id: orderId });

    const order = await Order.findOne({
      branchId,
      'assignedPickupStaff.id': staffId,
      $or: clauses
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Assigned order not found for this pickup staff account' });
    }

    const validTransition =
      (status === 'Preparing' && ['Pending', 'Confirmed'].includes(order.status)) ||
      (status === 'Ready for Pickup' && order.status === 'Preparing');
    if (!validTransition) {
      return res.status(409).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`
      });
    }

    order.status = status;
    if (status === 'Ready for Pickup' && order.assignedPickupStaff) {
      order.assignedPickupStaff.packedAt = new Date();
    }
    order.timeline = buildDynamicTimeline(order);
    const updated = await order.save();
    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: serializeOrderWithoutOtp(updated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
      order: serializeOrderWithoutOtp(foundOrder)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign an order to a pickup staff member
// @route   PUT /api/orders/:id/assign-pickup-staff
export const assignPickupStaffToOrder = async (req, res) => {
  const staffId = String(req.body?.id || '').trim();
  if (!staffId) {
    return res.status(400).json({ success: false, message: 'Pickup staff account ID is required' });
  }
  if (!/^[a-f0-9]{24}$/i.test(staffId)) {
    return res.status(400).json({ success: false, message: 'Pickup staff account ID is invalid' });
  }
  if (!isDbOnline()) {
    return res.status(503).json({
      success: false,
      message: 'Assigning pickup staff requires a database connection and a registered branch staff account'
    });
  }

  try {
    const { id } = req.params;

    const branchId = req.user?.role === 'admin' ? req.user.branchId : '';
    const branchFilter = branchId ? { branchId } : {};
    const clauses = [
      { orderId: id },
      { orderId: id.startsWith('#') ? id : `#${id}` },
      { orderId: id.replace(/^#/, '') }
    ];
    if (id.match(/^[0-9a-fA-F]{24}$/)) clauses.push({ _id: id });
    const order = await Order.findOne({ ...branchFilter, $or: clauses });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found in this branch' });
    }

    const staff = await User.findOne({
      _id: staffId,
      role: 'pickupstaff',
      branchId: order.branchId,
      isActive: true
    }).select('name');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Select an active pickup staff account from this order’s branch'
      });
    }

    if (!['Pending', 'Confirmed', 'Preparing'].includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Pickup staff cannot be assigned while order is ${order.status}`
      });
    }
    order.assignedPickupStaff = {
      id: String(staff._id),
      name: staff.name,
      assignedAt: new Date(),
      packedAt: order.assignedPickupStaff?.packedAt
    };
    order.timeline = buildDynamicTimeline(order);
    await order.save();

    return res.json({
      success: true,
      message: `${staff.name} assigned to order ${order.orderId || order.id}`,
      order: serializeOrderWithoutOtp(order)
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
    const { riderId, rider } = req.body;

    let targetRider = rider;
    if (req.user?.role === 'admin' && isDbOnline() && riderId) {
      const dbRider = await Rider.findOne({ id: riderId, branchId: req.user.branchId });
      if (!dbRider) {
        return res.status(404).json({ success: false, message: 'Rider is not assigned to this branch' });
      }
      if (dbRider.status !== 'On-Duty') {
        return res.status(409).json({ success: false, message: 'Rider is not currently available' });
      }
      targetRider = {
        id: dbRider.id,
        name: dbRider.name,
        phone: dbRider.phone,
        vehicle: dbRider.vehicleNumber || dbRider.vehicleType,
        vehicleType: dbRider.vehicleType,
        zone: dbRider.zone,
        rating: dbRider.rating || 5.0,
        coordinates:
          dbRider.coordinates ||
          (Number.isFinite(dbRider.currentLat) && Number.isFinite(dbRider.currentLng)
            ? { lat: dbRider.currentLat, lng: dbRider.currentLng }
            : null)
      };
    } else if (!targetRider && isDbOnline() && riderId) {
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
          coordinates:
            dbRider.coordinates ||
            (Number.isFinite(dbRider.currentLat) && Number.isFinite(dbRider.currentLng)
              ? { lat: dbRider.currentLat, lng: dbRider.currentLng }
              : null)
        };
      }
    }

    if (!targetRider && !riderId) {
      return res.status(400).json({ success: false, message: 'Rider details or riderId required' });
    }

    const defaultHub = CITY_HUBS.lahore;
    let riderCoords = targetRider?.coordinates || null;
    const fallbackRiderCoords = { lat: defaultHub.lat, lng: defaultHub.lng };
    const initialRiderCoords = riderCoords || fallbackRiderCoords;

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
      coordinates: initialRiderCoords,
      currentLat: initialRiderCoords.lat,
      currentLng: initialRiderCoords.lng,
      assignedAt: new Date(),
      status: 'On-Duty',
      eta: '12-18 mins',
      etaMinutes: 15
    };

    const newStatus = 'Out for Delivery';

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
        if (req.user?.role === 'admin' && order.branchId !== req.user.branchId) {
          return res.status(404).json({ success: false, message: 'Order not found in this branch' });
        }
        if (order.status !== 'Ready for Pickup') {
          return res.status(409).json({
            success: false,
            message: 'Order must be marked Ready for Pickup before assigning a rider'
          });
        }
        const deliveryArea =
          order.shippingAddress?.area || order.shippingAddress?.neighborhood || order.shippingAddress?.address;
        if (!riderServesArea(targetRider?.zone, deliveryArea)) {
          return res.status(409).json({ success: false, message: 'Rider does not serve this delivery area' });
        }
        riderCoords = riderCoords || order.branchCoords || fallbackRiderCoords;
        assignedInfo.coordinates = riderCoords;
        assignedInfo.currentLat = riderCoords.lat;
        assignedInfo.currentLng = riderCoords.lng;
        const reservedRider =
          req.user?.role === 'admin' && riderId
            ? await Rider.findOneAndUpdate(
                { id: assignedInfo.id, branchId: req.user.branchId, status: 'On-Duty' },
                { $set: { status: 'Busy' }, $addToSet: { activeOrders: order.orderId } },
                { new: true }
              )
            : null;
        if (req.user?.role === 'admin' && riderId && !reservedRider) {
          return res.status(409).json({ success: false, message: 'Rider is no longer available for assignment' });
        }
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

        let updated;
        try {
          updated = await order.save();
        } catch (error) {
          if (reservedRider) {
            await Rider.updateOne(
              { id: reservedRider.id, branchId: req.user.branchId },
              { $set: { status: 'On-Duty' }, $pull: { activeOrders: order.orderId } }
            );
          }
          throw error;
        }
        return res.json({
          success: true,
          message: `Rider ${assignedInfo.name} assigned to order ${order.orderId}`,
          order: serializeOrderWithoutOtp(updated)
        });
      }
    }

    // In-memory fallback
    const memOrder = ADMIN_ORDERS_FULL.find(
      (o) => o.id === id || o.orderId === id || o.id === `#${id}` || o.id === id.replace(/^#/, '')
    );
    if (memOrder) {
      if (req.user?.role === 'admin' && memOrder.branchId !== req.user.branchId) {
        return res.status(404).json({ success: false, message: 'Order not found in this branch' });
      }
      if (memOrder.status !== 'Ready for Pickup') {
        return res.status(409).json({
          success: false,
          message: 'Order must be marked Ready for Pickup before assigning a rider'
        });
      }
      const deliveryArea =
        memOrder.shippingAddress?.area ||
        memOrder.shippingAddress?.neighborhood ||
        memOrder.neighborhood ||
        memOrder.shippingAddress?.address ||
        memOrder.address;
      if (!riderServesArea(targetRider?.zone, deliveryArea)) {
        return res.status(409).json({ success: false, message: 'Rider does not serve this delivery area' });
      }
      riderCoords = riderCoords || memOrder.branchCoords || fallbackRiderCoords;
      assignedInfo.coordinates = riderCoords;
      assignedInfo.currentLat = riderCoords.lat;
      assignedInfo.currentLng = riderCoords.lng;
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
        order: serializeOrderWithoutOtp(memOrder)
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
        const assignedRiderId = order.assignedRider.id || order.assignedRider.riderId;
        const requestRiderId = req.user?.riderId || req.user?.id;
        if (req.user?.role === 'rider' && requestRiderId !== assignedRiderId) {
          return res.status(403).json({ success: false, message: 'This order is assigned to a different rider' });
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
        if (assignedRiderId) {
          await Rider.updateOne(
            { id: assignedRiderId, ...(req.user?.branchId ? { branchId: req.user.branchId } : {}) },
            { $set: { coordinates: { lat: numLat, lng: numLng }, currentLat: numLat, currentLng: numLng } }
          );
        }
        return res.json({
          success: true,
          message: 'Rider coordinates and ETA updated in real-time',
          order: serializeOrderWithoutOtp(updated)
        });
      }
    }

    // In-memory fallback
    const memOrder = ADMIN_ORDERS_FULL.find((o) => o.id === id || o.orderId === id);
    if (memOrder && memOrder.assignedRider) {
      const assignedRiderId = memOrder.assignedRider.id || memOrder.assignedRider.riderId;
      const requestRiderId = req.user?.riderId || req.user?.id;
      if (req.user?.role === 'rider' && requestRiderId !== assignedRiderId) {
        return res.status(403).json({ success: false, message: 'This order is assigned to a different rider' });
      }
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
        order: serializeOrderWithoutOtp(memOrder)
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
    const allowedStatuses = ['Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Pickup staff controls preparation and ready-for-dispatch status. Admins can only cancel eligible orders.'
      });
    }
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
        if (req.user?.role === 'admin' && order.branchId !== req.user.branchId) {
          return res.status(404).json({ success: false, message: 'Order not found in this branch' });
        }
        const previousStatus = order.status;
        const validTransition =
          status === 'Cancelled' &&
          !['Delivered', 'Cancelled'].includes(previousStatus) &&
          !order.assignedRider;
        if (!validTransition) {
          return res.status(409).json({
            success: false,
            message: `Cannot change order status from ${previousStatus} to ${status}`
          });
        }
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

        return res.json({ success: true, order: serializeOrderWithoutOtp(updated) });
      }
    }

    const memOrder = ADMIN_ORDERS_FULL.find((o) => o.id === req.params.id || o.orderId === req.params.id);
    if (memOrder) {
      if (req.user?.role === 'admin' && memOrder.branchId !== req.user.branchId) {
        return res.status(404).json({ success: false, message: 'Order not found in this branch' });
      }
      const previousStatus = memOrder.status;
      const validTransition =
        status === 'Cancelled' &&
        !['Delivered', 'Cancelled'].includes(previousStatus) &&
        !memOrder.assignedRider;
      if (!validTransition) {
        return res.status(409).json({
          success: false,
          message: `Cannot change order status from ${previousStatus} to ${status}`
        });
      }
      memOrder.status = status;
      memOrder.timeline = buildDynamicTimeline(memOrder);
      return res.json({ success: true, message: `Status updated to ${status}`, order: serializeOrderWithoutOtp(memOrder) });
    }

    return res.status(404).json({ success: false, message: 'Order not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify customer delivery OTP and complete delivery handover
// @route   POST /api/orders/:id/verify-delivery-otp
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, riderId } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide the 4-digit Customer Delivery OTP' });
    }

    const cleanOtp = String(otp).trim();

    let foundOrder = null;

    if (isDbOnline()) {
      foundOrder = await Order.findOne({
        $or: [
          ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
          { orderId: id },
          { orderId: id.startsWith('#') ? id : `#${id}` },
          { orderId: id.replace(/^#/, '') }
        ]
      });
    }

    if (!foundOrder) {
      const memOrder = ADMIN_ORDERS_FULL.find(
        (o) => o.id === id || o.orderId === id || o.id === `#${id}` || o.id === id.replace(/^#/, '')
      );
      if (memOrder) {
        foundOrder = memOrder;
      }
    }

    if (!foundOrder) {
      return res.status(404).json({ success: false, message: 'Order not found for OTP verification' });
    }

    const assignedRiderId = foundOrder.assignedRider?.id || foundOrder.assignedRider?.riderId;
    const requestRiderId = req.user?.riderId || req.user?.id;
    if (req.user?.role === 'rider' && (!assignedRiderId || requestRiderId !== assignedRiderId)) {
      return res.status(403).json({ success: false, message: 'This order is assigned to a different rider' });
    }

    if (foundOrder.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'This order has already been marked as Delivered' });
    }
    if (foundOrder.status !== 'Out for Delivery' && foundOrder.status !== 'Arrived at Customer') {
      return res.status(409).json({
        success: false,
        message: 'Delivery OTP can only be verified after the rider has the order'
      });
    }

    // Verify the customer's one-time delivery code.
    const expectedOtp = foundOrder.deliveryOtp || '1234';
    const isOtpValid = cleanOtp === String(expectedOtp).trim();

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code "${cleanOtp}". Please ask the customer for the 4-digit code shown in their Customer Portal.`
      });
    }

    // OTP Verified -> Mark Order as Delivered & Payment as Paid
    const deliveryTimestamp = new Date();
    foundOrder.status = 'Delivered';
    foundOrder.paymentStatus = 'Paid';
    foundOrder.deliveredAt = deliveryTimestamp;
    foundOrder.timeline = buildDynamicTimeline(foundOrder);

    // Save order in MongoDB
    if (isDbOnline() && typeof foundOrder.save === 'function') {
      await foundOrder.save();
    }

    // Increment Rider Deliveries Count (+1)
    const effectiveRiderId =
      req.user?.role === 'rider'
        ? requestRiderId
        : foundOrder.assignedRider?.id || foundOrder.assignedRider?.riderId || riderId;
    let newDeliveriesCount = 1;

    if (effectiveRiderId) {
      if (isDbOnline()) {
        const dbRider = await Rider.findOne({ $or: [{ id: effectiveRiderId }, { _id: effectiveRiderId }] });
        if (dbRider) {
          dbRider.deliveriesCount = (dbRider.deliveriesCount || 0) + 1;
          dbRider.status = 'On-Duty';
          dbRider.activeOrders = (dbRider.activeOrders || []).filter((orderId) => orderId !== foundOrder.orderId);
          newDeliveriesCount = dbRider.deliveriesCount;
          await dbRider.save();
        }
      }
    }

    // Update in-memory store if present
    const memOrder = ADMIN_ORDERS_FULL.find(
      (o) => o.id === id || o.orderId === id || o.id === `#${id}` || o.id === id.replace(/^#/, '')
    );
    if (memOrder) {
      memOrder.status = 'Delivered';
      memOrder.statusClass = 'bg-emerald-100 text-emerald-800';
      memOrder.paymentStatus = 'Paid';
      memOrder.deliveredAt = deliveryTimestamp;
      memOrder.timeline = buildDynamicTimeline(memOrder);
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully! Order marked Delivered and Cash Collected.',
      order: serializeOrderWithoutOtp(foundOrder),
      riderDeliveriesCount: newDeliveriesCount,
      collectedAmount: foundOrder.totalPrice || foundOrder.totalAmount,
      deliveredAt: deliveryTimestamp
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
