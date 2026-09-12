import { isDbOnline } from '../config/db.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ADMIN_ORDERS_FULL } from '../../src/data/adminSuiteData.js';

// @desc    Create new order
// @route   POST /api/orders
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

    const initialTimeline = [
      { title: 'Order Confirmed', time: 'Just now', completed: true, desc: `Payment method: ${paymentMethod}` },
      { title: 'Picked & Packed Fresh', time: 'Est. 5 mins', completed: false, desc: 'Cold sealed in thermal insulation pack' },
      { title: 'Out for Express Delivery', time: 'Est. 10 mins', completed: false, desc: 'Assigned courier en route' },
      { title: 'Delivered to Doorstep', time: 'Est. 15 mins', completed: false, desc: 'Contactless handover at address' }
    ];

    if (isDbOnline()) {
      const order = new Order({
        orderId,
        user: req.user?._id,
        customerName: custName,
        customerPhone: custPhone,
        shippingAddress,
        orderItems,
        paymentMethod,
        itemsPrice,
        deliveryPrice,
        discountPrice: discount,
        totalPrice,
        status: req.body.status || 'Pending',
        assignedRider: req.body.assignedRider || null,
        timeline: initialTimeline
      });

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
      status: req.body.status || 'Pending',
      statusClass: 'bg-amber-100 text-amber-800',
      payment: paymentMethod,
      paymentMethod,
      time: 'Just now',
      assignedRider: req.body.assignedRider || null,
      timeline: initialTimeline
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

// @desc    Track order by Order ID
// @route   GET /api/orders/track/:orderId
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const formattedId = orderId.startsWith('#') ? orderId : `#${orderId}`;

    if (isDbOnline()) {
      const order = await Order.findOne({
        $or: [{ orderId: formattedId }, { orderId: orderId }]
      });
      if (order) return res.json({ success: true, order });
    }

    res.json({
      success: true,
      order: {
        orderId: formattedId,
        customerName: 'Ayesha Khan',
        totalPrice: 2450,
        status: 'Out for Delivery',
        assignedRider: { name: 'Rider Ali', phone: '+92 301 1234567', eta: '12 mins' },
        timeline: [
          { title: 'Order Confirmed', time: '10:24 AM', completed: true, desc: 'Verified & sent to warehouse' },
          { title: 'Picked & Packed Fresh', time: '10:35 AM', completed: true, desc: 'Packed in eco cold container' },
          { title: 'Out for Express Delivery', time: '10:48 AM', completed: true, desc: 'Driver is 12 mins away' },
          { title: 'Delivered to Doorstep', time: 'Est. 11:00 AM', completed: false, desc: 'Contactless delivery' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
          { id: req.params.id }
        ]
      });
      if (order) {
        const previousStatus = order.status;
        order.status = status;
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
      return res.json({ success: true, message: `Status updated to ${status}`, order: memOrder });
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
