/**
 * WhatsApp Notification Helper for FreshMart Grocery & Delivery Portal
 * Generates pre-formatted WhatsApp links with order details, recipient phone sanitization,
 * delivery confirmation receipts, and en-route courier alerts.
 */

/**
 * Normalizes phone numbers to international WhatsApp format (E.164 without leading +)
 * Specially handles Pakistani phone formats (0300..., +92300..., 92300...)
 */
export const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return '923206551696';
  let cleaned = String(phone).replace(/[^0-9]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // If local Pakistani format starting with '03...'
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    cleaned = '92' + cleaned.substring(1);
  }

  // If starting with 3 and exactly 10 digits (e.g. 3206551696)
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '92' + cleaned;
  }

  // Fallback to demo contact if number is too short or malformed
  if (!cleaned || cleaned.length < 8) {
    return '923206551696';
  }

  return cleaned;
};

/**
 * Formats order item list into a concise bulleted summary for WhatsApp
 */
export const formatOrderItemsSummary = (order, maxLines = 6) => {
  const items = Array.isArray(order?.itemsList) && order.itemsList.length > 0
    ? order.itemsList
    : (Array.isArray(order?.items) ? order.items : []);

  if (!items || items.length === 0) {
    if (typeof order?.items === 'string' && order.items.trim()) {
      return `• ${order.items.trim()}`;
    }
    return '• 1x FreshMart Grocery Package';
  }

  const lines = items.slice(0, maxLines).map((item) => {
    const name = item.name || item.productName || item.title || 'Grocery Item';
    const qty = item.quantity || item.qty || 1;
    return `• ${name} (x${qty})`;
  });

  if (items.length > maxLines) {
    lines.push(`• ...and ${items.length - maxLines} more item(s)`);
  }

  return lines.join('\n');
};

/**
 * Builds the official WhatsApp delivery confirmation message
 */
export const buildWhatsAppDeliveryMessage = (order, rider, customNote = '') => {
  const orderId = String(order?.orderId || order?.id || '').replace(/^#/, '');
  const customer = order?.customerName || order?.customer || 'Valued Customer';
  const address = order?.shippingAddress?.address || order?.address || 'Your specified drop-off location';
  
  const total = Number(order?.totalAmount || order?.total || order?.totalPrice || 0);
  const paymentMethod = String(order?.paymentMethod || 'Cash on Delivery');
  const isCod = paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('cod');
  const totalFormatted = total > 0 ? `Rs. ${total.toLocaleString()} (${isCod ? 'Cash on Delivery Collected' : 'Paid Online'})` : 'Paid';

  const riderName = rider?.name || order?.assignedRider?.name || 'FreshMart Courier';
  const vehicle = rider?.vehicleNumber || rider?.vehicleType || order?.assignedRider?.vehicle || 'Delivery Bike';

  const timeString = order?.deliveredAt
    ? new Date(order.deliveredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const itemsList = formatOrderItemsSummary(order);

  let msg = `*FreshMart - Delivery Confirmed* 🛵📦

Assalam-o-Alaikum *${customer}*! 👋
Your grocery parcel *#${orderId}* has been successfully *DELIVERED* to your doorstep!

📍 *Drop-off Address:* ${address}
💰 *Total Amount:* ${totalFormatted}
🛵 *Delivered By:* ${riderName} (${vehicle})
🕒 *Delivered At:* ${timeString}

🛒 *Delivered Items:*
${itemsList}
`;

  if (customNote && customNote.trim()) {
    msg += `\n💬 *Note from Courier:* ${customNote.trim()}\n`;
  }

  msg += `\nThank you for shopping with *FreshMart*! If you need any assistance, feel free to reply directly to this chat. Have a wonderful day! 🌟`;

  return msg;
};

/**
 * Builds an en-route transit notification message for WhatsApp
 */
export const buildWhatsAppEnRouteMessage = (order, rider) => {
  const orderId = String(order?.orderId || order?.id || '').replace(/^#/, '');
  const customer = order?.customerName || order?.customer || 'Valued Customer';
  const address = order?.shippingAddress?.address || order?.address || 'Your address';
  const riderName = rider?.name || order?.assignedRider?.name || 'FreshMart Courier';
  const vehicle = rider?.vehicleNumber || rider?.vehicleType || order?.assignedRider?.vehicle || 'Delivery Bike';
  const pin = order?.deliveryOtp ? `🔐 *Your Handover PIN:* ${order.deliveryOtp}\n` : '';

  return `*FreshMart - Order In Transit* 🛵

Assalam-o-Alaikum *${customer}*! 👋
I am *${riderName}* (${vehicle}), your courier from *FreshMart*. I am on my way to deliver your grocery parcel *#${orderId}*.

📍 *Destination:* ${address}
${pin}Please keep your 4-digit handover PIN ready upon arrival. See you soon! 🥦`;
};

/**
 * Generates direct wa.me link for delivery confirmation
 */
export const getWhatsAppDeliveryLink = (order, rider, customNote = '') => {
  const phone = normalizeWhatsAppPhone(order?.customerPhone || order?.phone);
  const msg = buildWhatsAppDeliveryMessage(order, rider, customNote);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

/**
 * Generates direct wa.me link for en-route parcel status
 */
export const getWhatsAppEnRouteLink = (order, rider) => {
  const phone = normalizeWhatsAppPhone(order?.customerPhone || order?.phone);
  const msg = buildWhatsAppEnRouteMessage(order, rider);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

/**
 * Builds a general store admin order status message
 */
export const getWhatsAppOrderStatusLink = (order, customStatus = '') => {
  const phone = normalizeWhatsAppPhone(order?.customerPhone || order?.phone);
  const orderId = String(order?.orderId || order?.id || '').replace(/^#/, '');
  const customer = order?.customerName || order?.customer || 'Valued Customer';
  const status = customStatus || order?.status || 'Processing';
  const total = Number(order?.totalAmount || order?.total || order?.totalPrice || 0);

  const msg = `*FreshMart Order Update* 🛒

Assalam-o-Alaikum *${customer}*! 👋
Update regarding your grocery order *#${orderId}*:

📦 *Current Status:* ${status}
💰 *Total Amount:* Rs. ${total.toLocaleString()}
📍 *Destination:* ${order?.shippingAddress?.address || order?.address || 'Delivery Address'}

Thank you for choosing *FreshMart*! Reply here for any questions. 🌟`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};
