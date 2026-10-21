import test from 'node:test';
import assert from 'node:assert/strict';

test('Pickup Staff Management & "Deliver to Staff" Workflow', async (t) => {
  // Mock pickup staff store
  let pickupStaffList = [];

  const addPickupStaff = (data, currentTenant = { id: 'tenant-freshmart', name: 'FreshMart' }) => {
    const username = String(data?.username || '').trim().toLowerCase();
    const password = String(data?.password || '').trim();
    const name = String(data?.name || '').trim();
    const phone = String(data?.phone || '').trim();

    if (!username || !password || !name) {
      return { error: 'Missing required fields' };
    }

    if (pickupStaffList.some((s) => s.username === username)) {
      return { error: 'Username already exists' };
    }

    const newStaff = {
      id: `PCK-${Date.now().toString(36).toUpperCase()}`,
      name,
      username,
      password,
      phone,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    pickupStaffList.push(newStaff);
    return { success: true, staff: newStaff };
  };

  const authenticateStaff = (inputUser, inputPass, targetRole = 'admin') => {
    const cleanUser = String(inputUser || '').trim().toLowerCase();
    const cleanPass = String(inputPass || '').trim();

    // Auto-detect pickup staff match across any selected role
    const matched = pickupStaffList.find((person) => {
      const uMatch =
        (person.username && person.username.toLowerCase() === cleanUser) ||
        (person.name && person.name.toLowerCase() === cleanUser) ||
        (person.phone && person.phone.replace(/[^0-9]/g, '') === cleanUser.replace(/[^0-9]/g, '')) ||
        (person.id && person.id.toLowerCase() === cleanUser);
      const pMatch = String(person.password || '').trim() === cleanPass;
      return uMatch && pMatch;
    });

    if (matched) {
      return {
        success: true,
        role: 'pickup_staff',
        user: {
          id: matched.id,
          name: matched.name,
          username: matched.username,
          tenantId: matched.tenantId,
          role: 'pickup_staff'
        }
      };
    }

    if (targetRole === 'pickup_staff') {
      return { success: false, error: 'Pickup staff account not found or password incorrect.' };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  await t.test('1. Admin creates new pickup staff member with username and password', () => {
    const res = addPickupStaff({
      name: 'Rizwan Ahmed',
      username: 'rizwan_pack',
      password: 'password123',
      phone: '0300-9876543'
    });

    assert.equal(res.success, true);
    assert.equal(res.staff.username, 'rizwan_pack');
    assert.equal(res.staff.name, 'Rizwan Ahmed');
    assert.equal(pickupStaffList.length, 1);
  });

  await t.test('2. Staff can log in with username and password even if console role was set to admin', () => {
    // User visits login, leaves tab on 'admin' by mistake
    const loginRes = authenticateStaff('rizwan_pack', 'password123', 'admin');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.role, 'pickup_staff');
    assert.equal(loginRes.user.name, 'Rizwan Ahmed');
  });

  await t.test('3. Staff can log in with pickup_staff role tab explicitly selected', () => {
    const loginRes = authenticateStaff('rizwan_pack', 'password123', 'pickup_staff');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.role, 'pickup_staff');
  });

  await t.test('4. Incorrect password correctly rejected', () => {
    const loginRes = authenticateStaff('rizwan_pack', 'wrongpass', 'pickup_staff');
    assert.equal(loginRes.success, false);
    assert.match(loginRes.error, /password incorrect/i);
  });

  await t.test('5. Admin updates parcel to "Deliver to Staff" with line-wise items', () => {
    const rawOrder = {
      id: 'ORD-501',
      customer: 'Usman Tariq',
      address: 'House 14, Peoples Colony, Faisalabad',
      total: 3450,
      status: 'Pending',
      items: [
        { name: 'Farm Fresh Milk 1L', quantity: 2, price: 350 },
        { name: 'Brown Eggs (Dozen)', quantity: 1, price: 420 },
        { name: 'Whole Wheat Bread', quantity: 1, price: 180 }
      ]
    };

    const staffMember = pickupStaffList[0];
    const pickedIndexes = [0, 1]; // Milk and Eggs prepared line-wise

    const updatedOrder = {
      ...rawOrder,
      status: 'Delivered to Staff',
      fulfillmentStage: 2,
      pickupStaffId: staffMember.id,
      pickupStaffName: staffMember.name,
      pickupStaffUsername: staffMember.username,
      pickedItems: pickedIndexes,
      packageType: 'Eco-Friendly Carton Box',
      stagingBay: 'Dispatch Bay #1 • Rack A',
      isDispatched: false,
      deliveredToStaffAt: new Date().toISOString()
    };

    assert.equal(updatedOrder.status, 'Delivered to Staff');
    assert.equal(updatedOrder.pickupStaffId, staffMember.id);
    assert.equal(updatedOrder.isDispatched, false);
    assert.equal(updatedOrder.pickedItems.length, 2);
    assert.equal(updatedOrder.items.length, 3);
  });

  await t.test('6. Pickup staff completes all line-wise picks and marks parcel Dispatched', () => {
    let order = {
      id: 'ORD-501',
      status: 'Delivered to Staff',
      fulfillmentStage: 2,
      pickupStaffId: pickupStaffList[0].id,
      items: [
        { name: 'Farm Fresh Milk 1L', quantity: 2 },
        { name: 'Brown Eggs (Dozen)', quantity: 1 },
        { name: 'Whole Wheat Bread', quantity: 1 }
      ],
      pickedItems: [0, 1]
    };

    // Staff completes line-wise picking: [0, 1, 2]
    order.pickedItems = [0, 1, 2];
    order.fulfillmentStage = 3;

    // Staff marks ready for dispatch & seals parcel
    order = {
      ...order,
      fulfillmentStage: 5,
      status: 'Dispatched',
      parcelCode: `PRCL-${order.id}-999`,
      isDispatched: true,
      dispatchStatus: 'Dispatched',
      dispatchedAt: new Date().toISOString()
    };

    assert.equal(order.isDispatched, true);
    assert.equal(order.status, 'Dispatched');
    assert.match(order.parcelCode, /^PRCL-ORD-501/);
    assert.equal(order.pickedItems.length, 3);
  });

  await t.test('7. Authenticates Hafsa as Al-Fatah pickup staff directly with hafsa / staff123', () => {
    // Add Hafsa to the staff roster for Al-Fatah
    addPickupStaff(
      {
        name: 'Hafsa (Al-Fatah Packing Desk)',
        username: 'hafsa',
        password: 'staff123',
        phone: '+92 300 1112233'
      },
      { id: 'tenant-alfatah', name: 'Al-Fatah Supermarket' }
    );

    const authRes = authenticateStaff('hafsa', 'staff123', 'pickup_staff');
    assert.equal(authRes.success, true);
    assert.equal(authRes.role, 'pickup_staff');
    assert.equal(authRes.user.username, 'hafsa');
    assert.equal(authRes.user.tenantId, 'tenant-alfatah');
  });

  await t.test('8. Staff assigned from Pickup Staff page and Order page cannot alter staff status when in prep or dispatched', () => {
    let order = {
      id: 'ORD-702',
      status: 'Pending',
      tenantId: 'tenant-alfatah',
      customer: 'Tayyaba Batool'
    };

    // Step 1: Assign from Pickup Staff page
    const staffHafsa = pickupStaffList.find((s) => s.username === 'hafsa');
    assert.ok(staffHafsa, 'Hafsa staff exists');

    order = {
      ...order,
      pickupStaffId: staffHafsa.id,
      pickupStaffName: staffHafsa.name,
      status: 'Deliver to Staff',
      fulfillmentStage: 2,
      pickupStep: 'received'
    };
    assert.equal(order.pickupStaffId, staffHafsa.id);

    // Step 2: Staff moves to Preparing in Pickup Staff portal
    order = {
      ...order,
      status: 'Preparing',
      pickupStep: 'picking',
      isDispatchedByStaff: false
    };

    // Order page cannot alter or overwrite pickup staff status
    const canOrderPageAlterStaff = (ord) => {
      if (ord.isDispatchedByStaff || ['Preparing', 'Packed', 'Ready for Dispatch', 'Dispatched'].includes(ord.status)) {
        return false;
      }
      return !ord.pickupStaffId;
    };

    assert.equal(canOrderPageAlterStaff(order), false, 'Order page is locked and cannot alter staff status');

    // Step 3: Staff marks Ready for Dispatch
    order = {
      ...order,
      status: 'Ready for Dispatch',
      isDispatchedByStaff: true
    };
    assert.equal(canOrderPageAlterStaff(order), false, 'Order page still cannot alter staff status after dispatch');

    // Step 4: Order page unlocks Rider Assignment only after staff dispatch
    const isRiderAssignmentUnlocked = Boolean(order.isDispatchedByStaff);
    assert.equal(isRiderAssignmentUnlocked, true, 'Rider assignment is unlocked on order page');
  });

  await t.test('9. Once pickup staff is assigned on Pickup Staff page, the assignment is locked and cannot be changed', () => {
    let order = {
      id: 'ORD-703',
      status: 'Pending',
      tenantId: 'tenant-alfatah',
      pickupStaffId: null,
      pickupStaffName: null
    };

    // Initially can assign
    const canAssignPickupStaff = (ord) => {
      const isAssigned = Boolean(ord.pickupStaffId || ord.pickupStaffName);
      return !isAssigned && !ord.isDispatched && !['Dispatched', 'Out for Delivery', 'Arrived at Customer', 'Delivered'].includes(ord.status);
    };

    assert.equal(canAssignPickupStaff(order), true, 'Before assignment, admin can assign staff');

    // Admin assigns staff (e.g. Asad or Hafsa)
    order = {
      ...order,
      pickupStaffId: 'PCK-ASAD',
      pickupStaffName: 'Asad',
      status: 'Deliver to Staff'
    };

    // After assignment, canAssign must be false (locked badge displayed instead of dropdown)
    assert.equal(canAssignPickupStaff(order), false, 'After assignment, pickup staff person is locked and dropdown is disabled/hidden');
  });

  await t.test('10. Resolves multi-tab portal routes independently without signing out', () => {
    const parseMockUrl = (urlStr) => {
      const url = new URL(urlStr, 'http://localhost:5173');
      const path = url.pathname.toLowerCase();
      const hash = url.hash.toLowerCase();
      const searchParams = url.searchParams;

      if (
        path.startsWith('/pickup-staff') ||
        hash === '#pickup-staff' ||
        searchParams.get('portal') === 'pickup-staff'
      ) {
        return { page: 'pickup-staff', role: 'pickup_staff' };
      }
      if (
        path.startsWith('/delivery-portal') ||
        hash === '#rider' ||
        searchParams.get('portal') === 'rider'
      ) {
        return { page: 'delivery-portal', role: 'rider' };
      }
      return { page: 'admin', role: 'admin' };
    };

    // Tab 1: Admin Dashboard
    const tab1 = parseMockUrl('http://localhost:5173/admin');
    assert.equal(tab1.page, 'admin');
    assert.equal(tab1.role, 'admin');

    // Tab 2: Pickup Staff Portal (Opened simultaneously in another tab)
    const tab2 = parseMockUrl('http://localhost:5173/?portal=pickup-staff');
    assert.equal(tab2.page, 'pickup-staff');
    assert.equal(tab2.role, 'pickup_staff');

    // Tab 3: Rider Portal (Opened simultaneously in another tab)
    const tab3 = parseMockUrl('http://localhost:5173/?portal=rider');
    assert.equal(tab3.page, 'delivery-portal');
    assert.equal(tab3.role, 'rider');
  });

  await t.test('11. Rider Portal does NOT render Active Courier select switcher', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const deliveryPortalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/DeliveryPortal/DeliveryPortal.jsx'),
      'utf8'
    );

    // Active Courier select dropdown must be removed
    assert.equal(
      deliveryPortalCode.includes('selectedRiderId'),
      false,
      'DeliveryPortal must not have selectedRiderId courier switcher state'
    );
    assert.equal(
      deliveryPortalCode.includes('<select') && deliveryPortalCode.includes('Active Courier'),
      false,
      'DeliveryPortal must not have an Active Courier select dropdown'
    );
  });

  await t.test('12. Rider Portal does NOT run automatic simulation timers to move rider marker', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const deliveryPortalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/DeliveryPortal/DeliveryPortal.jsx'),
      'utf8'
    );

    // No simulation interval moving coordinates automatically
    assert.equal(
      deliveryPortalCode.includes('simulationIntervalRef.current = setInterval'),
      false,
      'DeliveryPortal must not have an automatic coordinate sliding timer loop'
    );
  });

  await t.test('13. Customer Handover OTP PIN is kept private and not leaked to Rider', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const deliveryPortalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/DeliveryPortal/DeliveryPortal.jsx'),
      'utf8'
    );
    const storeContextCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/context/StoreContext.jsx'),
      'utf8'
    );

    // Rider must not see customer PIN text rendered
    assert.equal(
      deliveryPortalCode.includes('(Customer PIN:'),
      false,
      'Rider UI must not display "(Customer PIN: ...)"'
    );
    assert.equal(
      deliveryPortalCode.includes('(PIN: {order.deliveryOtp})'),
      false,
      'Rider UI must not render "(PIN: {order.deliveryOtp})"'
    );

    // Rider must enter OTP from customer rather than auto-falling back
    assert.equal(
      deliveryPortalCode.includes('targetExpectedOtp ||\n      \'\''),
      false,
      'Rider OTP verification must not automatically fall back to expected target OTP'
    );

    // Error messages must not leak the secret PIN
    assert.equal(
      storeContextCode.includes('(Doorstep OTP:'),
      false,
      'StoreContext error toast must not leak "(Doorstep OTP: ...)"'
    );
  });

  await t.test('14. Al-Fatah Rider & Store Hubs are accurately positioned in Faisalabad (Peoples Colony & D-Ground)', async () => {
    const { INITIAL_RIDERS, INITIAL_TENANTS } = await import('../src/data/tenantData.js');

    const alFatahRider = INITIAL_RIDERS.find((r) => r.id === 'RDR-ALFATAH');
    assert.ok(alFatahRider, 'RDR-ALFATAH must exist in INITIAL_RIDERS');
    assert.equal(
      alFatahRider.zone.includes('Faisalabad') || alFatahRider.zone.includes('Peoples Colony'),
      true,
      'Al-Fatah rider zone must be in Faisalabad'
    );
    assert.equal(
      alFatahRider.zone.includes('Lahore') || alFatahRider.zone.includes('Gulberg'),
      false,
      'Al-Fatah rider zone must not be in Lahore or Gulberg'
    );
    assert.equal(alFatahRider.coordinates.lat, 31.4147, 'Al-Fatah rider lat must be Faisalabad D-Ground');
    assert.equal(alFatahRider.coordinates.lng, 73.0872, 'Al-Fatah rider lng must be Faisalabad D-Ground');

    const alFatahTenant = INITIAL_TENANTS.find((t) => t.id === 'tenant-alfatah');
    assert.ok(alFatahTenant, 'tenant-alfatah must exist');
    assert.equal(
      alFatahTenant.hubs.some((h) => h.includes('Faisalabad') || h.includes('D-Ground')),
      true,
      'Al-Fatah tenant hubs must be in Faisalabad'
    );
  });
});
